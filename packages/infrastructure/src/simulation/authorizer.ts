import { ok } from "@projectsim/domain";
import type { SimulationCommandAuthorizer } from "@projectsim/application";

/**
 * MVP {@link SimulationCommandAuthorizer} that permits every command.
 *
 * Real authentication/authorization (roles, permissions, tenant isolation) is
 * out of scope for this milestone and depends on identity infrastructure that
 * does not exist yet. This adapter satisfies the port so the composition root
 * can wire the application service today; it is expected to be replaced by a
 * genuine authorizer without any application-layer change.
 */
export const createPermitAllAuthorizer = (): SimulationCommandAuthorizer => ({
  authorize: async () => ok(undefined),
});
