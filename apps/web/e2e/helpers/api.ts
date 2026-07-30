import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";

export interface DecisionLifecycleFixture {
  readonly tenantId: string;
  readonly actorId: string;
  readonly learnerId: string;
  readonly simulationRunId: string;
  readonly expected: {
    readonly selectedOptionId: string;
    readonly selectedOptionLabel: string;
    readonly projectStatus: string;
    readonly budget: number;
    readonly decisionDefinitionId: string;
    readonly consequenceDefinitionCount: number;
  };
}

const e2eFetch = async (
  path: string,
  init?: RequestInit,
): Promise<Response> => {
  const response = await fetch(`${E2E_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-ProjectSim-E2E-Seam": E2E_SEAM_SECRET,
      ...(init?.headers ?? {}),
    },
  });
  return response;
};

/** Global truncate — requires server E2E_ALLOW_GLOBAL_RESET=1. */
export const cleanupAllE2eFixtures = async (): Promise<void> => {
  const response = await e2eFetch("/api/v1/e2e/fixtures/cleanup", {
    method: "POST",
    body: JSON.stringify({ global: true }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`E2E global cleanup failed (${response.status}): ${body}`);
  }
};

/** Tenant-scoped cleanup — does not delete unrelated tenants. */
export const cleanupE2eTenant = async (tenantId: string): Promise<void> => {
  const response = await e2eFetch("/api/v1/e2e/fixtures/cleanup", {
    method: "POST",
    body: JSON.stringify({ tenantId }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`E2E tenant cleanup failed (${response.status}): ${body}`);
  }
};

/** @deprecated Prefer cleanupAllE2eFixtures / cleanupE2eTenant. */
export const cleanupE2eFixtures = cleanupAllE2eFixtures;

export const createDecisionLifecycleFixture = async (
  identity: E2eIdentity,
  options?: {
    readonly capabilities?: readonly string[];
    readonly postSeedCapabilities?: readonly string[];
    readonly skipMembership?: boolean;
    readonly completeAfterSeed?: boolean;
  },
): Promise<DecisionLifecycleFixture> => {
  const response = await e2eFetch("/api/v1/e2e/fixtures/decision-lifecycle", {
    method: "POST",
    body: JSON.stringify({
      tenantId: identity.tenantId,
      actorId: identity.actorId,
      learnerId: identity.learnerId,
      simulationRunId: identity.simulationRunId,
      ...(options?.capabilities ? { capabilities: options.capabilities } : {}),
      ...(options?.postSeedCapabilities
        ? { postSeedCapabilities: options.postSeedCapabilities }
        : {}),
      ...(options?.skipMembership ? { skipMembership: true } : {}),
      ...(options?.completeAfterSeed ? { completeAfterSeed: true } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`E2E fixture create failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as { data: DecisionLifecycleFixture };
  return json.data;
};

export const setProjectionGate = async (
  mode: "open" | "hold" | "fail_rebuild",
): Promise<void> => {
  const response = await e2eFetch("/api/v1/e2e/projection-gate", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set projection gate to ${mode}`);
  }
};

export const resetProjectionGate = async (): Promise<void> => {
  const response = await e2eFetch("/api/v1/e2e/projection-gate/reset", {
    method: "POST",
    body: "{}",
  });
  if (!response.ok) {
    throw new Error("Failed to reset projection gate");
  }
};

export const tickOutboxRelay = async (tenantId: string): Promise<void> => {
  const response = await e2eFetch("/api/v1/e2e/relay/tick", {
    method: "POST",
    body: JSON.stringify({ tenantId }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Relay tick failed (${response.status}): ${body}`);
  }
};

export const redeliverLastOutboxEvent = async (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): Promise<{ eventId: string; eventType: string }> => {
  const response = await e2eFetch("/api/v1/e2e/events/redeliver-last", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Event redelivery failed (${response.status}): ${body}`);
  }
  const json = (await response.json()) as {
    data: { eventId: string; eventType: string };
  };
  return json.data;
};

export const fetchProjection = async (input: {
  readonly accessToken: string;
  readonly simulationRunId: string;
}): Promise<Response> =>
  fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${input.simulationRunId}/projection`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    },
  );

export const submitDecisionApi = async (input: {
  readonly accessToken: string;
  readonly simulationRunId: string;
  readonly commandId: string;
  readonly correlationId: string;
  readonly expectedAggregateVersion: number;
  readonly decisionId: string;
  readonly optionId: string;
  readonly rationale?: string;
}): Promise<Response> =>
  fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${input.simulationRunId}/commands/submit-decision`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.commandId,
        "If-Match": `"${input.expectedAggregateVersion}"`,
        "X-Correlation-ID": input.correlationId,
      },
      body: JSON.stringify({
        commandId: input.commandId,
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: input.expectedAggregateVersion,
        payload: {
          decisionId: input.decisionId,
          optionId: input.optionId,
          ...(input.rationale !== undefined
            ? { rationale: input.rationale }
            : {}),
        },
      }),
    },
  );
