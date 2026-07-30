import { describe, expect, it } from "vitest";
import { asActorId } from "@projectsim/domain";
import { createLifecycleCapabilityAuthorizer } from "./lifecycle-authorizer";
import { createInMemoryMembershipStore } from "./membership";
import type { SimulationRunLifecycleOperation } from "@projectsim/application";

const mutatingOps: readonly SimulationRunLifecycleOperation[] = [
  "create",
  "start",
  "pause",
  "resume",
  "complete",
  "fail",
  "recover",
  "archive",
];

describe("createLifecycleCapabilityAuthorizer", () => {
  it("given_no_membership_when_authorized_then_it_denies_tenant_access", async () => {
    const authorizer = createLifecycleCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: createInMemoryMembershipStore(),
    });

    const result = await authorizer.authorize("load", asActorId("actor_1"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ACCESS_DENIED");
    }
  });

  it("given_view_only_membership_when_load_then_it_allows", async () => {
    const authorizer = createLifecycleCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId("actor_1"),
          tenantId: "tenant_a",
          roles: ["learner"],
          capabilities: ["simulation.run.view"],
        },
      ]),
    });

    const load = await authorizer.authorize("load", asActorId("actor_1"));
    expect(load.ok).toBe(true);

    const start = await authorizer.authorize("start", asActorId("actor_1"));
    expect(start.ok).toBe(false);
    if (!start.ok) {
      expect(start.error.code).toBe("PERMISSION_DENIED");
    }
  });

  it("given_start_capability_when_mutating_lifecycle_ops_then_it_allows", async () => {
    const authorizer = createLifecycleCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId("actor_1"),
          tenantId: "tenant_a",
          roles: ["facilitator"],
          capabilities: ["simulation.run.start"],
        },
      ]),
    });

    for (const operation of mutatingOps) {
      const result = await authorizer.authorize(
        operation,
        asActorId("actor_1"),
      );
      expect(result.ok).toBe(true);
    }

    const load = await authorizer.authorize("load", asActorId("actor_1"));
    expect(load.ok).toBe(false);
  });

  it("given_empty_capabilities_when_any_op_then_it_denies", async () => {
    const authorizer = createLifecycleCapabilityAuthorizer({
      tenantId: "tenant_a",
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId("actor_1"),
          tenantId: "tenant_a",
          roles: ["learner"],
          capabilities: [],
        },
      ]),
    });

    for (const operation of ["load", ...mutatingOps] as const) {
      const result = await authorizer.authorize(
        operation,
        asActorId("actor_1"),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PERMISSION_DENIED");
      }
    }
  });
});
