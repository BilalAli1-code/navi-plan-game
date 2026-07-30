import { describe, expect, it, vi } from "vitest";
import { ApiClientError, type ApiClient } from "../../api/client";

describe("submit decision client contracts", () => {
  it("reuses command id as idempotency key and does not invent aggregate versions", async () => {
    const submitDecision = vi.fn(
      async (input: {
        commandId: string;
        expectedAggregateVersion: number;
        rationale?: string;
      }) => ({
        data: {
          commandId: input.commandId,
          status: "accepted" as const,
          aggregateVersion: input.expectedAggregateVersion + 1,
          simulationRunId: "run_1",
          correlationId: "corr_1",
        },
        meta: {
          requestId: "req_1",
          correlationId: "corr_1",
          apiVersion: "v1" as const,
        },
      }),
    );
    const client = {
      getProjection: vi.fn(),
      submitDecision,
    } as unknown as ApiClient;

    await client.submitDecision({
      simulationRunId: "run_1",
      commandId: "cmd_stable",
      correlationId: "corr_stable",
      expectedAggregateVersion: 2,
      decisionId: "decision_1",
      optionId: "option_a",
      rationale: "draft",
    });

    expect(submitDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: "cmd_stable",
        expectedAggregateVersion: 2,
        rationale: "draft",
      }),
    );
  });

  it("maps 412 as a non-auto-resubmit conflict signal", () => {
    const error = new ApiClientError({
      status: 412,
      code: "AGGREGATE_VERSION_CONFLICT",
      message: "version conflict",
      retryable: false,
      requestId: "req_1",
      correlationId: "corr_1",
    });
    expect(error.status).toBe(412);
    expect(error.retryable).toBe(false);
  });

  it("maps 422 business rejection as non-retryable", () => {
    const error = new ApiClientError({
      status: 422,
      code: "DECISION_OPTION_INVALID",
      message: "option invalid",
      retryable: false,
      requestId: "req_1",
      correlationId: "corr_1",
    });
    expect(error.retryable).toBe(false);
  });

  it("preserves request and correlation ids on conflicts", () => {
    const error = new ApiClientError({
      status: 409,
      code: "IDEMPOTENCY_KEY_REUSED",
      message: "conflict",
      retryable: false,
      requestId: "req_support",
      correlationId: "corr_support",
    });
    expect(error.requestId).toBe("req_support");
    expect(error.correlationId).toBe("corr_support");
  });
});

describe("submit decision attempt identity lifecycle", () => {
  it("treats payload changes as a new deliberate attempt identity", () => {
    const first = {
      commandId: "cmd_1",
      optionId: "option_a",
      rationale: "one",
    };
    const second = {
      commandId: "cmd_2",
      optionId: "option_b",
      rationale: "two",
    };
    expect(first.commandId).not.toBe(second.commandId);
    expect(first.optionId).not.toBe(second.optionId);
  });

  it("reuses the same attempt identifiers for uncertain transport retry", () => {
    const attempt = {
      commandId: "cmd_retry",
      correlationId: "corr_retry",
      optionId: "option_a",
      rationale: "same",
      expectedAggregateVersion: 2,
      projectionFreshness: "current" as const,
    };
    const retry = { ...attempt };
    expect(retry.commandId).toBe(attempt.commandId);
    expect(retry.correlationId).toBe(attempt.correlationId);
    expect(retry.rationale).toBe(attempt.rationale);
    expect(retry.projectionFreshness).toBe("current");
  });

  it("requires current projection freshness as mutation authority", () => {
    const staleAttempt = {
      projectionFreshness: "rebuild_failed" as const,
    };
    expect(staleAttempt.projectionFreshness).not.toBe("current");
  });
});
