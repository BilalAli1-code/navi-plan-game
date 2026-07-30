import { describe, expect, it } from "vitest";
import {
  asActorId,
  asCommandId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asIsoTimestamp,
  asSimulationRunId,
  type SubmitDecisionCommand,
} from "@projectsim/domain";
import { createCapabilityAuthorizer } from "./capability-authorizer";
import { createInMemoryMembershipStore } from "./membership";

const command: SubmitDecisionCommand = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
};

describe("createCapabilityAuthorizer", () => {
  it("given_no_membership_when_authorized_then_it_denies_tenant_access", async () => {
    const authorizer = createCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: createInMemoryMembershipStore(),
    });

    const result = await authorizer.authorize(command);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ACCESS_DENIED");
    }
  });

  it("given_membership_without_capabilities_when_authorized_then_it_denies_permission", async () => {
    const store = createInMemoryMembershipStore([
      {
        actorId: asActorId("actor_1"),
        tenantId: "tenant_a",
        roles: ["learner"],
        capabilities: [],
      },
    ]);
    const authorizer = createCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: store,
    });

    const result = await authorizer.authorize(command);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PERMISSION_DENIED");
    }
  });

  it("given_membership_with_required_capabilities_when_authorized_then_it_allows", async () => {
    const store = createInMemoryMembershipStore([
      {
        actorId: asActorId("actor_1"),
        tenantId: "tenant_a",
        roles: ["learner"],
        capabilities: ["simulation.run.view", "simulation.run.start"],
      },
    ]);
    const authorizer = createCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: store,
    });

    const result = await authorizer.authorize(command);

    expect(result.ok).toBe(true);
  });
});
