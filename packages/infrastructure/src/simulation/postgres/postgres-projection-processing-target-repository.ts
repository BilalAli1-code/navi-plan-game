import type {
  MaterializeProjectionTargetInput,
  ProjectionProcessingTarget,
  ProjectionProcessingTargetRepository,
  ProjectionProcessingTargetStatus,
  ProjectionTargetErrorClassification,
} from "@projectsim/application";
import type { WorkplaceProjectionType } from "@projectsim/domain";
import type { PostgresDatabase } from "./database";

interface TargetRow {
  readonly tenant_id: string;
  readonly event_id: string;
  readonly projection_type: string;
  readonly simulation_run_id: string;
  readonly event_type: string;
  readonly status: ProjectionProcessingTargetStatus;
  readonly attempt_count: number;
  readonly next_attempt_at: Date | string;
  readonly claimed_by: string | null;
  readonly claimed_at: Date | string | null;
  readonly claim_expires_at: Date | string | null;
  readonly completed_at: Date | string | null;
  readonly exhausted_at: Date | string | null;
  readonly last_error_classification: string | null;
  readonly last_error_summary: string | null;
  readonly created_at: Date | string;
  readonly updated_at: Date | string;
}

const toIso = (value: Date | string | null): string | null => {
  if (value === null) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
};

const mapRow = (row: TargetRow): ProjectionProcessingTarget => ({
  tenantId: row.tenant_id,
  eventId: row.event_id,
  projectionType: row.projection_type as WorkplaceProjectionType,
  simulationRunId: row.simulation_run_id,
  eventType: row.event_type,
  status: row.status,
  attemptCount: row.attempt_count,
  nextAttemptAt: toIso(row.next_attempt_at)!,
  claimedBy: row.claimed_by,
  claimedAt: toIso(row.claimed_at),
  claimExpiresAt: toIso(row.claim_expires_at),
  completedAt: toIso(row.completed_at),
  exhaustedAt: toIso(row.exhausted_at),
  lastErrorClassification:
    row.last_error_classification as ProjectionTargetErrorClassification | null,
  lastErrorSummary: row.last_error_summary,
  createdAt: toIso(row.created_at)!,
  updatedAt: toIso(row.updated_at)!,
});

export const createPostgresProjectionProcessingTargetRepository = (
  database: PostgresDatabase,
  boundTenantId: string,
): ProjectionProcessingTargetRepository => ({
  async materializeTargets(
    targets: readonly MaterializeProjectionTargetInput[],
  ) {
    if (targets.length === 0) return;
    await database.withTenantTransaction(boundTenantId, async (client) => {
      for (const target of targets) {
        await client.query(
          `insert into projection_processing_target (
             tenant_id, event_id, projection_type, simulation_run_id, event_type, status
           ) values ($1, $2, $3, $4, $5, 'pending')
           on conflict (tenant_id, event_id, projection_type) do nothing`,
          [
            boundTenantId,
            target.eventId,
            target.projectionType,
            target.simulationRunId,
            target.eventType,
          ],
        );
      }
    });
  },

  async getTarget(eventId, projectionType) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const result = await client.query<TargetRow>(
        `select *
           from projection_processing_target
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3
          limit 1`,
        [boundTenantId, eventId, projectionType],
      );
      const row = result.rows[0];
      return row ? mapRow(row) : null;
    });
  },

  async listFailedTargets(input) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const params: unknown[] = [boundTenantId];
      let sql = `
        select *
          from projection_processing_target
         where tenant_id = $1
           and status in ('exhausted', 'retrying')`;
      if (input.simulationRunId) {
        params.push(input.simulationRunId);
        sql += ` and simulation_run_id = $${params.length}`;
      }
      if (input.projectionType) {
        params.push(input.projectionType);
        sql += ` and projection_type = $${params.length}`;
      }
      params.push(input.limit);
      const limitIdx = params.length;
      params.push(input.offset);
      const offsetIdx = params.length;
      sql += ` order by coalesce(exhausted_at, updated_at) desc
               limit $${limitIdx} offset $${offsetIdx}`;
      const result = await client.query<TargetRow>(sql, params);
      return result.rows.map(mapRow);
    });
  },

  async claimTargets(input) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const nowIso = input.now.toISOString();
      const expiresIso = new Date(
        input.now.getTime() + input.claimLeaseMs,
      ).toISOString();
      const selected = await client.query<{
        event_id: string;
        projection_type: string;
      }>(
        `select event_id, projection_type
           from projection_processing_target
          where tenant_id = $1
            and (
              (status in ('pending', 'retrying') and next_attempt_at <= $2::timestamptz)
              or (
                status = 'claimed'
                and claim_expires_at is not null
                and claim_expires_at <= $2::timestamptz
              )
            )
          order by next_attempt_at asc, event_id asc, projection_type asc
          limit $3
          for update skip locked`,
        [boundTenantId, nowIso, input.batchSize],
      );
      if (selected.rows.length === 0) {
        return [];
      }
      const claimed: TargetRow[] = [];
      for (const row of selected.rows) {
        const updated = await client.query<TargetRow>(
          `update projection_processing_target
              set status = 'claimed',
                  claimed_by = $4,
                  claimed_at = $5::timestamptz,
                  claim_expires_at = $6::timestamptz,
                  updated_at = $5::timestamptz
            where tenant_id = $1
              and event_id = $2
              and projection_type = $3
            returning *`,
          [
            boundTenantId,
            row.event_id,
            row.projection_type,
            input.workerId,
            nowIso,
            expiresIso,
          ],
        );
        const claimedRow = updated.rows[0];
        if (claimedRow) {
          claimed.push(claimedRow);
        }
      }
      return claimed.map(mapRow);
    });
  },

  async markSucceeded(input) {
    await database.withTenantTransaction(boundTenantId, async (client) => {
      await client.query(
        `update projection_processing_target
            set status = 'succeeded',
                attempt_count = $4,
                completed_at = $5,
                claimed_by = null,
                claimed_at = null,
                claim_expires_at = null,
                last_error_classification = null,
                last_error_summary = null,
                updated_at = $5
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3`,
        [
          boundTenantId,
          input.eventId,
          input.projectionType,
          input.attemptCount,
          input.now,
        ],
      );
    });
  },

  async markFailed(input) {
    await database.withTenantTransaction(boundTenantId, async (client) => {
      if (input.exhausted) {
        await client.query(
          `update projection_processing_target
              set status = 'exhausted',
                  attempt_count = $4,
                  exhausted_at = $5,
                  next_attempt_at = $5,
                  claimed_by = null,
                  claimed_at = null,
                  claim_expires_at = null,
                  last_error_classification = $6,
                  last_error_summary = $7,
                  updated_at = $5
            where tenant_id = $1
              and event_id = $2
              and projection_type = $3`,
          [
            boundTenantId,
            input.eventId,
            input.projectionType,
            input.attemptCount,
            input.now,
            input.classification,
            input.summary,
          ],
        );
        return;
      }
      await client.query(
        `update projection_processing_target
            set status = 'retrying',
                attempt_count = $4,
                next_attempt_at = $5,
                claimed_by = null,
                claimed_at = null,
                claim_expires_at = null,
                last_error_classification = $6,
                last_error_summary = $7,
                updated_at = $8
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3`,
        [
          boundTenantId,
          input.eventId,
          input.projectionType,
          input.attemptCount,
          input.nextAttemptAt,
          input.classification,
          input.summary,
          input.now,
        ],
      );
    });
  },

  async manualRetry(input) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const existing = await client.query<TargetRow>(
        `select *
           from projection_processing_target
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3
          for update`,
        [boundTenantId, input.eventId, input.projectionType],
      );
      const row = existing.rows[0];
      if (!row) {
        return { ok: false as const, priorStatus: null };
      }
      if (row.status !== "exhausted" && row.status !== "retrying") {
        return { ok: false as const, priorStatus: row.status };
      }
      await client.query(
        `update projection_processing_target
            set status = 'retrying',
                next_attempt_at = $4,
                claimed_by = null,
                claimed_at = null,
                claim_expires_at = null,
                exhausted_at = null,
                updated_at = $4
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3`,
        [boundTenantId, input.eventId, input.projectionType, input.now],
      );
      return { ok: true as const, priorStatus: row.status };
    });
  },

  async allTargetsSucceeded(eventId) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const result = await client.query<{ n: number; s: number }>(
        `select count(*)::int as n,
                count(*) filter (where status = 'succeeded')::int as s
           from projection_processing_target
          where tenant_id = $1
            and event_id = $2`,
        [boundTenantId, eventId],
      );
      const row = result.rows[0];
      if (!row || row.n === 0) return false;
      return row.n === row.s;
    });
  },

  async queueSummary() {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const result = await client.query<{
        status: ProjectionProcessingTargetStatus;
        n: number;
        oldest: Date | string | null;
      }>(
        `select status,
                count(*)::int as n,
                min(next_attempt_at) filter (
                  where status in ('pending', 'retrying')
                ) as oldest
           from projection_processing_target
          where tenant_id = $1
          group by status`,
        [boundTenantId],
      );
      let pending = 0;
      let claimed = 0;
      let retrying = 0;
      let exhausted = 0;
      let succeeded = 0;
      let oldestPendingAt: string | null = null;
      for (const row of result.rows) {
        if (row.status === "pending") pending = row.n;
        if (row.status === "claimed") claimed = row.n;
        if (row.status === "retrying") retrying = row.n;
        if (row.status === "exhausted") exhausted = row.n;
        if (row.status === "succeeded") succeeded = row.n;
        if (row.oldest) {
          const iso = toIso(row.oldest);
          if (iso && (oldestPendingAt === null || iso < oldestPendingAt)) {
            oldestPendingAt = iso;
          }
        }
      }
      return {
        pending,
        claimed,
        retrying,
        exhausted,
        succeeded,
        oldestPendingAt,
      };
    });
  },

  async countByStatusForRun(input) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const params: unknown[] = [boundTenantId, input.simulationRunId];
      let sql = `
        select status, count(*)::int as n
          from projection_processing_target
         where tenant_id = $1
           and simulation_run_id = $2`;
      if (input.projectionType) {
        params.push(input.projectionType);
        sql += ` and projection_type = $3`;
      }
      sql += ` group by status`;
      const result = await client.query<{
        status: ProjectionProcessingTargetStatus;
        n: number;
      }>(sql, params);
      let pending = 0;
      let claimed = 0;
      let retrying = 0;
      let exhausted = 0;
      let succeeded = 0;
      for (const row of result.rows) {
        if (row.status === "pending") pending = row.n;
        if (row.status === "claimed") claimed = row.n;
        if (row.status === "retrying") retrying = row.n;
        if (row.status === "exhausted") exhausted = row.n;
        if (row.status === "succeeded") succeeded = row.n;
      }
      return {
        pending,
        claimed,
        retrying,
        exhausted,
        succeeded,
        oldestPendingAt: null,
      };
    });
  },
});
