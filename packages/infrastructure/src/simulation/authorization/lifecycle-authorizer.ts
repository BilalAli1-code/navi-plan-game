import { err, ok, type ActorId } from "@projectsim/domain";
import type { SimulationRunLifecycleAuthorizer } from "@projectsim/application";
import type { MembershipStore } from "./membership";

/**
 * Lifecycle authorizer using only approved capability strings
 * (PS-API-003 / PS-DOM-010):
 * - load → simulation.run.view
 * - create/start/pause/resume/complete/fail/recover/archive → simulation.run.start
 *
 * Gap: no dedicated pause/resume/complete/fail/archive/recover capabilities exist
 * in the approved model; mutations intentionally reuse `.start`.
 */
export const createLifecycleCapabilityAuthorizer = (options: {
  readonly tenantId: string;
  readonly membershipStore: MembershipStore;
}): SimulationRunLifecycleAuthorizer => ({
  async authorize(operation, actorId: ActorId) {
    const membership = await options.membershipStore.findMembership(
      options.tenantId,
      actorId,
    );
    if (!membership) {
      return err({
        kind: "authorization",
        code: "TENANT_ACCESS_DENIED",
        retryable: false,
        message: `Actor ${actorId} is not a member of tenant ${options.tenantId}.`,
      });
    }

    const required =
      operation === "load" ? "simulation.run.view" : "simulation.run.start";
    if (!membership.capabilities.includes(required)) {
      return err({
        kind: "authorization",
        code: "PERMISSION_DENIED",
        retryable: false,
        message: `Actor ${actorId} lacks capability ${required}.`,
        details: { missing: [required] },
      });
    }
    return ok(undefined);
  },
});

/** Permit-all lifecycle authorizer for focused unit/integration tests. */
export const createPermitAllLifecycleAuthorizer =
  (): SimulationRunLifecycleAuthorizer => ({
    authorize: async () => ok(undefined),
  });
