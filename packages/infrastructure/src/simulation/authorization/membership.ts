import type { ActorId } from "@projectsim/domain";

/**
 * Authorization context for a single actor within a tenant
 * (docs/architecture/05-api-architecture/03_Authentication_and_Authorization.md).
 *
 * Built by infrastructure from membership records; never trusted from raw
 * client input without membership validation.
 */
export interface AuthorizationContext {
  readonly actorId: ActorId;
  readonly tenantId: string;
  readonly roles: readonly string[];
  readonly capabilities: readonly string[];
}

/**
 * Loads the membership for an actor in a tenant. Returns `null` when the actor
 * is not a member (TENANT_ACCESS_DENIED).
 */
export interface MembershipStore {
  findMembership(
    tenantId: string,
    actorId: ActorId,
  ): Promise<AuthorizationContext | null>;
}

/** In-memory membership store for tests and local composition. */
export const createInMemoryMembershipStore = (
  memberships: readonly AuthorizationContext[] = [],
): MembershipStore & {
  upsert(membership: AuthorizationContext): void;
} => {
  const byKey = new Map<string, AuthorizationContext>();
  for (const membership of memberships) {
    byKey.set(`${membership.tenantId}:${membership.actorId}`, membership);
  }

  return {
    async findMembership(tenantId, actorId) {
      return byKey.get(`${tenantId}:${actorId}`) ?? null;
    },
    upsert(membership) {
      byKey.set(`${membership.tenantId}:${membership.actorId}`, membership);
    },
  };
};
