import { err, ok, type ActorId } from "@projectsim/domain";
import type { SimulationProjectionAuthorizer } from "@projectsim/application";
import type { MembershipStore } from "./membership";

/**
 * Projection read authorizer — requires `simulation.run.view` only.
 * Does not require decision-submission mutation capabilities.
 */
export const createProjectionCapabilityAuthorizer = (options: {
  readonly tenantId: string;
  readonly membershipStore: MembershipStore;
}): SimulationProjectionAuthorizer => ({
  async authorizeView(input: {
    readonly actorId: ActorId;
    readonly simulationRunId: string;
  }) {
    const membership = await options.membershipStore.findMembership(
      options.tenantId,
      input.actorId,
    );
    if (!membership) {
      return err({
        kind: "authorization",
        code: "TENANT_ACCESS_DENIED",
        retryable: false,
        message: `Actor ${input.actorId} is not a member of tenant ${options.tenantId}.`,
      });
    }
    if (!membership.capabilities.includes("simulation.run.view")) {
      return err({
        kind: "authorization",
        code: "PERMISSION_DENIED",
        retryable: false,
        message: `Actor ${input.actorId} lacks capability simulation.run.view.`,
        details: { missing: ["simulation.run.view"] },
      });
    }
    return ok(undefined);
  },
});

/** Permit-all projection authorizer for focused unit/integration tests. */
export const createPermitAllProjectionAuthorizer =
  (): SimulationProjectionAuthorizer => ({
    authorizeView: async () => ok(undefined),
  });
