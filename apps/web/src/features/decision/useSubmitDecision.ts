import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { DecisionUiPhase, ProjectionFreshness } from "@projectsim/ui";
import {
  ApiClientError,
  type ApiClient,
  type SubmitDecisionReceiptResult,
} from "../../api/client";
import { decisionLogQueryKey } from "../decision-log/queryKeys";
import { inboxQueryKey } from "../inbox/queryKeys";
import { missionControlQueryKey } from "../mission-control/queryKeys";
import { simulationProjectionQueryKey } from "./queryKeys";

export interface SubmitDecisionAttempt {
  readonly commandId: string;
  readonly correlationId: string;
  readonly decisionId: string;
  readonly optionId: string;
  readonly rationale: string;
  readonly expectedAggregateVersion: number;
  readonly simulationRunId: string;
  /** Caller-declared projection authority; must be current to submit. */
  readonly projectionFreshness: ProjectionFreshness;
}

type CachedProjection = {
  readonly model: {
    readonly freshness: ProjectionFreshness;
    readonly sourceAggregateVersion: number;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSubmitDecision = (input: {
  readonly apiClient: ApiClient;
  readonly actorId: string;
  readonly pollIntervalMs?: number;
  readonly pollTimeoutMs?: number;
}) => {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const attemptRef = useRef<SubmitDecisionAttempt | null>(null);
  const [phase, setPhase] = useState<DecisionUiPhase>("ready");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<
    SubmitDecisionReceiptResult["data"] | null
  >(null);

  const pollIntervalMs = input.pollIntervalMs ?? 200;
  const pollTimeoutMs = input.pollTimeoutMs ?? 5_000;

  const assertCurrentProjectionAuthority = (
    attempt: SubmitDecisionAttempt,
  ): void => {
    if (attempt.projectionFreshness !== "current") {
      throw new ApiClientError({
        status: 409,
        code: "PROJECTION_NOT_CURRENT",
        message:
          "Projection is not current. Refresh before submitting a decision.",
        retryable: false,
        requestId: "",
        correlationId: attempt.correlationId,
      });
    }
    const cached = queryClient.getQueryData<CachedProjection>(
      simulationProjectionQueryKey(attempt.simulationRunId, input.actorId),
    );
    if (!cached || cached.model.freshness !== "current") {
      throw new ApiClientError({
        status: 409,
        code: "PROJECTION_NOT_CURRENT",
        message:
          "Cached projection is not current. Refresh before submitting a decision.",
        retryable: false,
        requestId: "",
        correlationId: attempt.correlationId,
      });
    }
  };

  const waitForProjectionVersion = async (
    simulationRunId: string,
    targetVersion: number,
  ): Promise<"synced" | "timeout"> => {
    const started = Date.now();
    while (Date.now() - started < pollTimeoutMs) {
      await queryClient.invalidateQueries({
        queryKey: simulationProjectionQueryKey(simulationRunId, input.actorId),
      });
      const fresh = await input.apiClient.getProjection(simulationRunId);
      queryClient.setQueryData(
        simulationProjectionQueryKey(simulationRunId, input.actorId),
        {
          result: fresh,
          model: {
            simulationRunId: fresh.data.simulationRunId,
            freshness: fresh.meta.freshness,
            sourceAggregateVersion: fresh.meta.sourceAggregateVersion,
            runStatus: fresh.data.run.status,
            projectStatus: fresh.data.project.status,
            metrics: fresh.data.project.metrics,
            availableDecisions: fresh.data.availableDecisions,
            decisionHistory: fresh.data.decisionHistory,
          },
        },
      );
      if (fresh.meta.sourceAggregateVersion >= targetVersion) {
        await queryClient.invalidateQueries({
          queryKey: missionControlQueryKey(simulationRunId, input.actorId),
        });
        await queryClient.invalidateQueries({
          queryKey: inboxQueryKey(simulationRunId, input.actorId),
        });
        await queryClient.invalidateQueries({
          queryKey: decisionLogQueryKey(simulationRunId, input.actorId),
        });
        return "synced";
      }
      await sleep(pollIntervalMs);
    }
    return "timeout";
  };

  const mutation = useMutation({
    retry: false,
    mutationFn: async (attempt: SubmitDecisionAttempt) => {
      if (inFlight.current) {
        throw new Error("A decision submission is already in progress.");
      }
      assertCurrentProjectionAuthority(attempt);
      inFlight.current = true;
      attemptRef.current = attempt;
      setPhase("submitting");
      setStatusMessage("Submitting decision…");
      try {
        const receipt = await input.apiClient.submitDecision({
          simulationRunId: attempt.simulationRunId,
          commandId: attempt.commandId,
          correlationId: attempt.correlationId,
          expectedAggregateVersion: attempt.expectedAggregateVersion,
          decisionId: attempt.decisionId,
          optionId: attempt.optionId,
          rationale: attempt.rationale,
        });
        setLastReceipt(receipt.data);
        setPhase("accepted_refreshing");
        setStatusMessage(
          "Decision accepted. Refreshing authoritative projection…",
        );
        const sync = await waitForProjectionVersion(
          attempt.simulationRunId,
          receipt.data.aggregateVersion,
        );
        if (sync === "timeout") {
          setPhase("accepted_refreshing");
          setStatusMessage(
            "Decision was accepted, but the authoritative projection is still refreshing. Use Refresh.",
          );
          return receipt;
        }
        setPhase("resolved");
        setStatusMessage("Decision resolved.");
        return receipt;
      } finally {
        inFlight.current = false;
      }
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        if (error.code === "PROJECTION_NOT_CURRENT") {
          setPhase("rejected");
          setStatusMessage(error.message);
          return;
        }
        if (error.status === 412) {
          setPhase("conflict");
          setStatusMessage(
            "The simulation changed. Refresh the projection and review before submitting again.",
          );
          void queryClient.invalidateQueries({
            queryKey: simulationProjectionQueryKey(
              attemptRef.current?.simulationRunId ?? "",
              input.actorId,
            ),
          });
          return;
        }
        if (error.status === 409) {
          setPhase("conflict");
          setStatusMessage(
            `${error.message} (request ${error.requestId || "n/a"}, correlation ${error.correlationId || "n/a"})`,
          );
          return;
        }
        if (error.status === 422) {
          setPhase("rejected");
          setStatusMessage(error.message);
          return;
        }
        setPhase(error.retryable ? "retryable_failure" : "rejected");
        setStatusMessage(error.message);
        return;
      }
      setPhase("retryable_failure");
      setStatusMessage("Network error while submitting the decision.");
    },
  });

  /** Uncertain transport retry — reuses the same attempt identifiers/payload. */
  const retryUncertain = () => {
    const attempt = attemptRef.current;
    if (!attempt) {
      return;
    }
    mutation.mutate(attempt);
  };

  const beginAttempt = (
    partial: Omit<SubmitDecisionAttempt, "commandId" | "correlationId"> & {
      readonly commandId?: string;
      readonly correlationId?: string;
    },
  ) => {
    if (partial.projectionFreshness !== "current") {
      setPhase("rejected");
      setStatusMessage(
        "Projection is not current. Refresh before submitting a decision.",
      );
      return;
    }
    const attempt: SubmitDecisionAttempt = {
      ...partial,
      commandId: partial.commandId ?? `cmd_${crypto.randomUUID()}`,
      correlationId: partial.correlationId ?? `corr_${crypto.randomUUID()}`,
    };
    mutation.mutate(attempt);
  };

  return {
    phase,
    statusMessage,
    lastReceipt,
    isPending: mutation.isPending || inFlight.current,
    beginAttempt,
    retryUncertain,
    resetPhase: () => {
      setPhase("ready");
      setStatusMessage(null);
    },
  };
};
