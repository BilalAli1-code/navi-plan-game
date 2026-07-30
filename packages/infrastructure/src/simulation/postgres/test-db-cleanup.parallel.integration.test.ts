/**
 * BC-005 REL-010 — concurrent tenant-scoped cleanup must not wipe peers.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pkg from "pg";
import { cleanupPostgresTenants } from "./test-db-cleanup";

const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb =
  DATABASE_URL && DATABASE_ADMIN_URL ? describe : describe.skip;
const skipReason =
  "DATABASE_URL / DATABASE_ADMIN_URL unavailable — REL-010 cleanup suite skipped";

const TENANT_A = "tenant_bc005_cleanup_a";
const TENANT_B = "tenant_bc005_cleanup_b";
const ACTOR_A = "actor_bc005_cleanup_a";
const ACTOR_B = "actor_bc005_cleanup_b";

const insertMembership = async (
  client: InstanceType<typeof Client>,
  tenantId: string,
  actorId: string,
): Promise<void> => {
  await client.query(
    `insert into tenant_memberships (tenant_id, actor_id, roles, capabilities)
       values ($1, $2, $3::text[], $4::text[])
     on conflict (tenant_id, actor_id)
       do update set roles = excluded.roles, capabilities = excluded.capabilities`,
    [
      tenantId,
      actorId,
      ["learner"],
      ["simulation.run.view", "simulation.run.start"],
    ],
  );
};

const countMembership = async (
  client: InstanceType<typeof Client>,
  tenantId: string,
  actorId: string,
): Promise<number> => {
  const result = await client.query<{ n: number }>(
    `select count(*)::int as n
       from tenant_memberships
      where tenant_id = $1 and actor_id = $2`,
    [tenantId, actorId],
  );
  return result.rows[0]?.n ?? 0;
};

describeIfDb("BC-005 REL-010 parallel cleanupPostgresTenants", () => {
  if (!DATABASE_ADMIN_URL) {
    it(skipReason, () => {
      expect(true).toBe(true);
    });
    return;
  }

  const admin = new Client({ connectionString: DATABASE_ADMIN_URL });

  beforeAll(async () => {
    await admin.connect();
    await cleanupPostgresTenants({
      adminUrl: DATABASE_ADMIN_URL,
      tenantIds: [TENANT_A, TENANT_B],
    });
  });

  afterAll(async () => {
    await cleanupPostgresTenants({
      adminUrl: DATABASE_ADMIN_URL,
      tenantIds: [TENANT_A, TENANT_B],
    });
    await admin.end();
  });

  it("concurrent cleanup for different tenants does not wipe peer membership", async () => {
    await insertMembership(admin, TENANT_A, ACTOR_A);
    await insertMembership(admin, TENANT_B, ACTOR_B);
    expect(await countMembership(admin, TENANT_A, ACTOR_A)).toBe(1);
    expect(await countMembership(admin, TENANT_B, ACTOR_B)).toBe(1);

    // Concurrent cleanups for different tenants: A is deleted; B must remain
    // because its cleanup call is not the one under assertion — peer A cleanup
    // must not cross-delete B. Run cleanup(A) alongside a concurrent cleanup of
    // an unused tenant id so both calls race without targeting B.
    await Promise.all([
      cleanupPostgresTenants({
        adminUrl: DATABASE_ADMIN_URL,
        tenantIds: [TENANT_A],
      }),
      cleanupPostgresTenants({
        adminUrl: DATABASE_ADMIN_URL,
        tenantIds: ["tenant_bc005_cleanup_unused"],
      }),
    ]);

    expect(await countMembership(admin, TENANT_A, ACTOR_A)).toBe(0);
    expect(await countMembership(admin, TENANT_B, ACTOR_B)).toBe(1);

    // Full parallel peer cleanups also succeed without cross-wipe anomalies.
    await insertMembership(admin, TENANT_A, ACTOR_A);
    await Promise.all([
      cleanupPostgresTenants({
        adminUrl: DATABASE_ADMIN_URL,
        tenantIds: [TENANT_A],
      }),
      cleanupPostgresTenants({
        adminUrl: DATABASE_ADMIN_URL,
        tenantIds: [TENANT_B],
      }),
    ]);
    expect(await countMembership(admin, TENANT_A, ACTOR_A)).toBe(0);
    expect(await countMembership(admin, TENANT_B, ACTOR_B)).toBe(0);
  });
});

if (!DATABASE_URL || !DATABASE_ADMIN_URL) {
  describe("BC-005 REL-010 parallel cleanupPostgresTenants (skipped)", () => {
    it(skipReason, () => {
      expect(Boolean(DATABASE_URL && DATABASE_ADMIN_URL)).toBe(false);
    });
  });
}
