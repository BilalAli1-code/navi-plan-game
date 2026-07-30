import pg from "pg";

/**
 * Discover tenants that have claimable outbox rows or projection targets.
 * Uses an admin connection (bypasses RLS) and returns distinct tenant IDs only.
 */
export const discoverRelayTenants = async (
  adminConnectionString: string,
): Promise<readonly string[]> => {
  const client = new pg.Client({ connectionString: adminConnectionString });
  await client.connect();
  try {
    const result = await client.query<{ tenant_id: string }>(
      `select distinct tenant_id
         from (
           select tenant_id
             from event_outbox
            where status = 'pending'
              and available_at <= now()
           union
           select tenant_id
             from projection_processing_target
            where (
              status in ('pending', 'retrying')
              and next_attempt_at <= now()
            )
            or (
              status = 'claimed'
              and claim_expires_at is not null
              and claim_expires_at <= now()
            )
         ) work
        order by tenant_id`,
    );
    return result.rows.map((row) => row.tenant_id);
  } finally {
    await client.end();
  }
};
