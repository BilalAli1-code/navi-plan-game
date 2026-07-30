import { DecisionWorkspace } from "@projectsim/ui";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import {
  workplaceDecisionLogPath,
  workplaceMissionControlPath,
} from "../workplace/routes";
import { useSimulationProjection } from "./useSimulationProjection";
import { useSubmitDecision } from "./useSubmitDecision";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function DecisionPage() {
  const { simulationRunId = "" } = useParams();
  const session = useAuthSession();
  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const projectionQuery = useSimulationProjection({
    apiClient,
    simulationRunId,
    actorId: session.actorId,
    enabled: Boolean(session.accessToken && simulationRunId),
  });

  const submit = useSubmitDecision({
    apiClient,
    actorId: session.actorId,
  });

  if (!session.accessToken) {
    return (
      <main>
        <h1>Decision</h1>
        <p role="alert">Authentication required.</p>
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={() =>
              session.setSession({
                actorId: "actor_1",
                tenantId: "tenant_local",
                accessToken: createDevBrowserToken({
                  actorId: "actor_1",
                  tenantId: "tenant_local",
                }),
                authSource: "dev",
              })
            }
          >
            Sign in (dev)
          </button>
        ) : (
          <p>Sign in with Supabase Auth, then reopen this Decision run.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <Link to={workplaceMissionControlPath(simulationRunId)}>
          Back to Mission Control
        </Link>
        {" · "}
        <Link to={workplaceDecisionLogPath(simulationRunId)}>Decision Log</Link>
      </p>
      <DecisionWorkspace
        model={projectionQuery.data?.model ?? null}
        loading={projectionQuery.isLoading}
        errorMessage={
          projectionQuery.error instanceof Error
            ? projectionQuery.error.message
            : null
        }
        phase={submit.phase}
        statusMessage={submit.statusMessage}
        onRefresh={() => {
          void projectionQuery.refetch();
        }}
        onSubmit={(intent) => {
          const freshness = projectionQuery.data?.model.freshness;
          if (freshness !== "current") {
            return;
          }
          submit.beginAttempt({
            simulationRunId,
            decisionId: intent.decisionId,
            optionId: intent.optionId,
            rationale: intent.rationale,
            expectedAggregateVersion: intent.expectedAggregateVersion,
            projectionFreshness: freshness,
          });
        }}
        onCancelConfirm={() => submit.resetPhase()}
        onRetryUncertain={() => submit.retryUncertain()}
      />
    </main>
  );
}
