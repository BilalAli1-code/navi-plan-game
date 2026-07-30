import {
  asBusinessCaseId,
  asChapterId,
  asContentPackageVersionId,
  asDayId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  concurrencyError,
  err,
  isExperienceLevel,
  ok,
  rehydrateSimulationRun,
  ruleViolationError,
  serializeSimulationState,
  throwDomainError,
  type ExperienceLevel,
  type SimulationDomainEvent,
  type SimulationRun,
} from "@projectsim/domain";
import type { SimulationRunRepository } from "@projectsim/application";
import type { PostgresDatabase } from "./database";

interface SimulationRunRow {
  readonly tenant_id: string;
  readonly simulation_run_id: string;
  readonly learner_id: string | null;
  readonly business_case_id: string | null;
  readonly content_package_version_id: string | null;
  readonly experience_level: string | null;
  readonly runtime_version: string | null;
  readonly status: string | null;
  readonly aggregate_version: number;
  readonly last_sequence_number: number;
  readonly current_chapter_id: string | null;
  readonly current_day_id: string | null;
  readonly started_at: Date | string | null;
  readonly paused_at: Date | string | null;
  readonly completed_at: Date | string | null;
  readonly archived_at: Date | string | null;
  readonly created_at: Date | string | null;
  readonly updated_at: Date | string;
  readonly authoritative_state: unknown;
}

const toIso = (value: Date | string | null): string | null => {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
};

const assertCompleteOwnership = (row: SimulationRunRow): void => {
  const missing: string[] = [];
  if (row.learner_id == null || row.learner_id.trim() === "") {
    missing.push("learner_id");
  }
  if (row.business_case_id == null || row.business_case_id.trim() === "") {
    missing.push("business_case_id");
  }
  if (
    row.content_package_version_id == null ||
    row.content_package_version_id.trim() === ""
  ) {
    missing.push("content_package_version_id");
  }
  if (row.runtime_version == null || row.runtime_version.trim() === "") {
    missing.push("runtime_version");
  }
  if (row.tenant_id == null || row.tenant_id.trim() === "") {
    missing.push("tenant_id");
  }
  if (row.status == null || row.status.trim() === "") {
    missing.push("status");
  }
  if (row.authoritative_state == null) {
    missing.push("authoritative_state");
  }

  if (missing.length === 0) {
    return;
  }

  throwDomainError(
    ruleViolationError(
      "SIMULATION_RUN_LEGACY_INCOMPLETE",
      "Simulation run row is missing required immutable ownership fields and cannot be rehydrated. " +
        "Query public.simulation_state_incomplete_ownership and repair ownership columns before retrying.",
      {
        runId: row.simulation_run_id,
        tenantId: row.tenant_id,
        missingFields: missing,
        operatorView: "public.simulation_state_incomplete_ownership",
      },
    ),
  );
};

const mapRow = (row: SimulationRunRow): SimulationRun => {
  assertCompleteOwnership(row);

  const createdAt = toIso(row.created_at) ?? toIso(row.updated_at);
  if (!createdAt) {
    throwDomainError(
      ruleViolationError(
        "SIMULATION_RUN_LEGACY_INCOMPLETE",
        "simulation_state.created_at/updated_at missing for rehydration.",
        {
          runId: row.simulation_run_id,
          tenantId: row.tenant_id,
          missingFields: ["created_at"],
          operatorView: "public.simulation_state_incomplete_ownership",
        },
      ),
    );
  }
  const updatedAt = toIso(row.updated_at);
  if (!updatedAt) {
    throwDomainError(
      ruleViolationError(
        "SIMULATION_RUN_LEGACY_INCOMPLETE",
        "simulation_state.updated_at missing for rehydration.",
        {
          runId: row.simulation_run_id,
          tenantId: row.tenant_id,
          missingFields: ["updated_at"],
          operatorView: "public.simulation_state_incomplete_ownership",
        },
      ),
    );
  }

  const experienceLevel: ExperienceLevel | null =
    row.experience_level !== null && isExperienceLevel(row.experience_level)
      ? row.experience_level
      : null;

  const rehydrated = rehydrateSimulationRun({
    id: asSimulationRunId(row.simulation_run_id),
    tenantId: asTenantId(row.tenant_id),
    learnerId: asLearnerId(row.learner_id!),
    businessCaseId: asBusinessCaseId(row.business_case_id!),
    contentPackageVersionId: asContentPackageVersionId(
      row.content_package_version_id!,
    ),
    experienceLevel,
    runtimeVersion: row.runtime_version!,
    status: row.status!,
    aggregateVersion: row.aggregate_version,
    lastProcessedSequence: row.last_sequence_number,
    currentChapterId: row.current_chapter_id
      ? asChapterId(row.current_chapter_id)
      : null,
    currentDayId: row.current_day_id ? asDayId(row.current_day_id) : null,
    startedAt: toIso(row.started_at)
      ? asIsoTimestamp(toIso(row.started_at)!)
      : null,
    pausedAt: toIso(row.paused_at)
      ? asIsoTimestamp(toIso(row.paused_at)!)
      : null,
    completedAt: toIso(row.completed_at)
      ? asIsoTimestamp(toIso(row.completed_at)!)
      : null,
    archivedAt: toIso(row.archived_at)
      ? asIsoTimestamp(toIso(row.archived_at)!)
      : null,
    createdAt: asIsoTimestamp(createdAt),
    updatedAt: asIsoTimestamp(updatedAt),
    state: row.authoritative_state,
  });
  if (!rehydrated.ok) {
    throwDomainError(rehydrated.error);
  }
  return rehydrated.value;
};

const insertOutbox = async (
  client: {
    query: (sql: string, params?: unknown[]) => Promise<unknown>;
  },
  tenantId: string,
  events: readonly SimulationDomainEvent[],
): Promise<void> => {
  for (const event of events) {
    await client.query(
      `insert into event_outbox (
         event_id, tenant_id, event_type, aggregate_id, aggregate_type,
         aggregate_version, sequence_number, simulation_run_id, payload,
         occurred_at, recorded_at, status, attempt_count, available_at
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz,
         $11::timestamptz, 'pending', 0, now()
       )
       on conflict (event_id) do nothing`,
      [
        event.eventId,
        tenantId,
        event.eventType,
        event.aggregateId,
        event.aggregateType,
        event.aggregateVersion,
        event.sequenceNumber,
        event.simulationRunId,
        JSON.stringify(event),
        event.occurredAt,
        event.recordedAt,
      ],
    );
  }
};

/**
 * PostgreSQL {@link SimulationRunRepository}.
 *
 * Single authoritative table: `simulation_state` (expanded). Aggregate snapshot
 * and outbox rows commit in one tenant-scoped transaction.
 */
export const createPostgresSimulationRunRepository = (
  database: PostgresDatabase,
  boundTenantId: string,
): SimulationRunRepository => ({
  async getById(tenantId, simulationRunId) {
    if (tenantId !== boundTenantId) {
      return null;
    }
    return database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query<SimulationRunRow>(
        `select tenant_id, simulation_run_id, learner_id, business_case_id,
                content_package_version_id, experience_level, runtime_version, status,
                aggregate_version, last_sequence_number, current_chapter_id,
                current_day_id, started_at, paused_at, completed_at, archived_at,
                created_at, updated_at, authoritative_state
           from simulation_state
          where simulation_run_id = $1`,
        [simulationRunId],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      // Incomplete legacy rows throw SIMULATION_RUN_LEGACY_INCOMPLETE (fail closed;
      // never fabricate ownership identifiers or silently discard the row).
      return mapRow(row);
    });
  },

  async save(tenantId, run, expectedAggregateVersion, pendingDomainEvents) {
    if (tenantId !== boundTenantId || run.tenantId !== tenantId) {
      return err(concurrencyError(expectedAggregateVersion ?? 0, 0));
    }

    return database.withTenantTransaction(tenantId, async (client) => {
      const stateJson = serializeSimulationState(run.state);

      if (expectedAggregateVersion === null) {
        const inserted = await client.query(
          `insert into simulation_state (
             tenant_id, simulation_run_id, learner_id, business_case_id,
             content_package_version_id, experience_level, runtime_version, status,
             aggregate_version, last_sequence_number, current_chapter_id,
             current_day_id, started_at, paused_at, completed_at, archived_at,
             created_at, updated_at, authoritative_state, state_schema_version
           ) values (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20
           )
           on conflict (tenant_id, simulation_run_id) do nothing`,
          [
            tenantId,
            run.id,
            run.learnerId,
            run.businessCaseId,
            run.contentPackageVersionId,
            run.experienceLevel,
            run.runtimeVersion,
            run.status,
            run.aggregateVersion,
            run.lastProcessedSequence,
            run.currentChapterId,
            run.currentDayId,
            run.startedAt,
            run.pausedAt,
            run.completedAt,
            run.archivedAt,
            run.createdAt,
            run.updatedAt,
            JSON.stringify(stateJson),
            run.state.schemaVersion,
          ],
        );
        if (inserted.rowCount === 0) {
          const current = await client.query<{ aggregate_version: number }>(
            "select aggregate_version from simulation_state where simulation_run_id = $1",
            [run.id],
          );
          return err(
            concurrencyError(0, current.rows[0]?.aggregate_version ?? 0),
          );
        }
      } else {
        const updated = await client.query(
          `update simulation_state set
             runtime_version = $3,
             status = $4,
             aggregate_version = $5,
             last_sequence_number = $6,
             current_chapter_id = $7,
             current_day_id = $8,
             started_at = $9,
             paused_at = $10,
             completed_at = $11,
             archived_at = $12,
             updated_at = $13,
             authoritative_state = $14::jsonb,
             state_schema_version = $15
           where simulation_run_id = $1
             and aggregate_version = $2
             and learner_id = $16
             and business_case_id = $17
             and content_package_version_id = $18`,
          [
            run.id,
            expectedAggregateVersion,
            run.runtimeVersion,
            run.status,
            run.aggregateVersion,
            run.lastProcessedSequence,
            run.currentChapterId,
            run.currentDayId,
            run.startedAt,
            run.pausedAt,
            run.completedAt,
            run.archivedAt,
            run.updatedAt,
            JSON.stringify(stateJson),
            run.state.schemaVersion,
            run.learnerId,
            run.businessCaseId,
            run.contentPackageVersionId,
          ],
        );
        if (updated.rowCount === 0) {
          const current = await client.query<{ aggregate_version: number }>(
            "select aggregate_version from simulation_state where simulation_run_id = $1",
            [run.id],
          );
          return err(
            concurrencyError(
              expectedAggregateVersion,
              current.rows[0]?.aggregate_version ?? 0,
            ),
          );
        }
      }

      await insertOutbox(client, tenantId, pendingDomainEvents);
      return ok(undefined);
    });
  },
});
