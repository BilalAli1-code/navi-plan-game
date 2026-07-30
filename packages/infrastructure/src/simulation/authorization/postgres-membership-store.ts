import type { ActorId } from "@projectsim/domain";
import type { PostgresDatabase } from "../postgres/database";
import type { AuthorizationContext, MembershipStore } from "./membership";

interface MembershipRow {
  readonly tenant_id: string;
  readonly actor_id: string;
  readonly roles: string[];
  readonly capabilities: string[];
}

/**
 * PostgreSQL-backed {@link MembershipStore}. Tenant isolation is enforced by
 * RLS via the tenant-scoped transaction.
 */
export const createPostgresMembershipStore = (
  database: PostgresDatabase,
  tenantId: string,
): MembershipStore => ({
  async findMembership(requestedTenantId, actorId) {
    // Refuse cross-tenant lookups even before hitting the database.
    if (requestedTenantId !== tenantId) {
      return null;
    }

    return database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query<MembershipRow>(
        `select tenant_id, actor_id, roles, capabilities
           from tenant_memberships
          where tenant_id = $1 and actor_id = $2`,
        [tenantId, actorId],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        actorId: row.actor_id as ActorId,
        tenantId: row.tenant_id,
        roles: row.roles,
        capabilities: row.capabilities,
      } satisfies AuthorizationContext;
    });
  },
});

/** Seed helper for tests / local setup (writes a membership under RLS). */
export const upsertPostgresMembership = async (
  database: PostgresDatabase,
  membership: AuthorizationContext,
): Promise<void> => {
  await database.withTenantTransaction(membership.tenantId, async (client) => {
    await client.query(
      `insert into tenant_memberships (tenant_id, actor_id, roles, capabilities)
         values ($1, $2, $3, $4)
       on conflict (tenant_id, actor_id)
         do update set roles = excluded.roles, capabilities = excluded.capabilities`,
      [
        membership.tenantId,
        membership.actorId,
        membership.roles,
        membership.capabilities,
      ],
    );
  });
};
