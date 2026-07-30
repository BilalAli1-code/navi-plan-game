import type {
  ProjectionSaveResult,
  SimulationProjectionRepository,
} from "@projectsim/application";
import { resolveSimulationProjectionType } from "@projectsim/application";
import {
  evaluateProjectionSave,
  parseWorkplaceProjection,
  ruleViolationError,
  serializeWorkplaceProjection,
  throwDomainError,
  type DomainEventPublisher,
  type ProjectionDomainEvent,
  err,
  ok,
} from "@projectsim/domain";
import type { PostgresDatabase } from "./database";

export const createPostgresSimulationProjectionRepository = (
  database: PostgresDatabase,
  boundTenantId: string,
  options?: {
    readonly eventPublisher?: DomainEventPublisher;
  },
): SimulationProjectionRepository => ({
  async get(tenantId, simulationRunId, projectionType) {
    if (tenantId !== boundTenantId) {
      return null;
    }
    const type = resolveSimulationProjectionType(projectionType);
    return database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query(
        `select projection_payload
           from simulation_projection
          where tenant_id = $1
            and simulation_run_id = $2
            and projection_type = $3`,
        [tenantId, simulationRunId, type],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const parsed = parseWorkplaceProjection(row.projection_payload);
      if (!parsed.ok) {
        throwDomainError(parsed.error);
      }
      return parsed.value;
    });
  },

  async saveIfNewer(projection, pendingProjectionEvents = []) {
    if (projection.tenantId !== boundTenantId) {
      return err(
        ruleViolationError(
          "PROJECTION_PERSISTENCE_FAILED",
          "Projection tenant does not match repository tenant binding.",
        ),
      );
    }
    const parsed = parseWorkplaceProjection(
      serializeWorkplaceProjection(projection),
    );
    if (!parsed.ok) {
      return err(parsed.error);
    }
    const projectionType = parsed.value.projectionType;

    return database.withTenantTransaction(
      projection.tenantId,
      async (client) => {
        const existingResult = await client.query(
          `select projection_payload
             from simulation_projection
            where tenant_id = $1
              and simulation_run_id = $2
              and projection_type = $3
            for update`,
          [projection.tenantId, projection.simulationRunId, projectionType],
        );
        const existingRow = existingResult.rows[0];
        let existingCandidate: {
          sourceAggregateVersion: number;
          sourceStateVersion: number;
          sourceActionSequence: number;
          semanticHash: string;
        } | null = null;
        if (existingRow) {
          const existing = parseWorkplaceProjection(
            existingRow.projection_payload,
          );
          if (!existing.ok) {
            return err(existing.error);
          }
          existingCandidate = {
            sourceAggregateVersion: existing.value.sourceAggregateVersion,
            sourceStateVersion: existing.value.sourceStateVersion,
            sourceActionSequence: existing.value.sourceActionSequence,
            semanticHash: existing.value.semanticHash,
          };
        }

        const decision = evaluateProjectionSave(existingCandidate, {
          sourceAggregateVersion: parsed.value.sourceAggregateVersion,
          sourceStateVersion: parsed.value.sourceStateVersion,
          sourceActionSequence: parsed.value.sourceActionSequence,
          semanticHash: parsed.value.semanticHash,
        });
        if (!decision.ok) {
          return err(decision.error);
        }
        if (decision.value.kind === "unchanged") {
          return ok({ kind: "unchanged" });
        }

        let saveResult: ProjectionSaveResult;
        if (decision.value.kind === "insert") {
          await client.query(
            `insert into simulation_projection (
               tenant_id, simulation_run_id, projection_type, projection_schema_version,
               source_aggregate_version, source_state_version, source_action_sequence,
               source_event_id, content_package_version_id, projection_payload,
               projection_hash, generated_at, created_at, updated_at
             ) values (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::timestamptz,now(),now()
             )`,
            [
              projection.tenantId,
              projection.simulationRunId,
              projectionType,
              projection.projectionSchemaVersion,
              projection.sourceAggregateVersion,
              projection.sourceStateVersion,
              projection.sourceActionSequence,
              projection.sourceEventId,
              projection.contentPackageVersionId,
              JSON.stringify(serializeWorkplaceProjection(parsed.value)),
              projection.semanticHash,
              projection.generatedAt,
            ],
          );
          saveResult = { kind: "inserted" };
        } else {
          await client.query(
            `update simulation_projection
                set projection_schema_version = $4,
                    source_aggregate_version = $5,
                    source_state_version = $6,
                    source_action_sequence = $7,
                    source_event_id = $8,
                    content_package_version_id = $9,
                    projection_payload = $10::jsonb,
                    projection_hash = $11,
                    generated_at = $12::timestamptz,
                    updated_at = now()
              where tenant_id = $1
                and simulation_run_id = $2
                and projection_type = $3`,
            [
              projection.tenantId,
              projection.simulationRunId,
              projectionType,
              projection.projectionSchemaVersion,
              projection.sourceAggregateVersion,
              projection.sourceStateVersion,
              projection.sourceActionSequence,
              projection.sourceEventId,
              projection.contentPackageVersionId,
              JSON.stringify(serializeWorkplaceProjection(parsed.value)),
              projection.semanticHash,
              projection.generatedAt,
            ],
          );
          saveResult = { kind: "replaced" };
        }

        if (pendingProjectionEvents.length > 0) {
          for (const event of pendingProjectionEvents as readonly ProjectionDomainEvent[]) {
            await client.query(
              `insert into event_outbox (
                 event_id, tenant_id, event_type, aggregate_id, aggregate_type,
                 aggregate_version, sequence_number, simulation_run_id, payload,
                 occurred_at, recorded_at, status, attempt_count, available_at
               ) values (
                 $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::timestamptz,$11::timestamptz,
                 'pending',0,now()
               )
               on conflict (event_id) do nothing`,
              [
                event.eventId,
                projection.tenantId,
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
          if (options?.eventPublisher) {
            // Optional immediate fan-out for in-process consumers; relay remains SoT.
            await options.eventPublisher.publish(pendingProjectionEvents);
          }
        }
        return ok(saveResult);
      },
    );
  },

  async delete(tenantId, simulationRunId, projectionType) {
    if (tenantId !== boundTenantId) {
      return err(
        ruleViolationError(
          "PROJECTION_PERSISTENCE_FAILED",
          "Projection tenant does not match repository tenant binding.",
        ),
      );
    }
    const type = resolveSimulationProjectionType(projectionType);
    await database.withTenantTransaction(tenantId, async (client) => {
      await client.query(
        `delete from simulation_projection
          where tenant_id = $1
            and simulation_run_id = $2
            and projection_type = $3`,
        [tenantId, simulationRunId, type],
      );
    });
    return ok(undefined);
  },
});

export const createPostgresProjectionEventInbox = (
  database: PostgresDatabase,
  boundTenantId: string,
): {
  hasProcessedEventId: (eventId: string) => Promise<boolean>;
  rememberProcessedEventId: (eventId: string) => Promise<void>;
} => ({
  async hasProcessedEventId(eventId) {
    return database.withTenantTransaction(boundTenantId, async (client) => {
      const result = await client.query(
        `select 1
           from projection_event_inbox
          where tenant_id = $1
            and event_id = $2
          limit 1`,
        [boundTenantId, eventId],
      );
      return (result.rowCount ?? 0) > 0;
    });
  },
  async rememberProcessedEventId(eventId) {
    await database.withTenantTransaction(boundTenantId, async (client) => {
      await client.query(
        `insert into projection_event_inbox (tenant_id, event_id)
         values ($1, $2)
         on conflict (tenant_id, event_id) do nothing`,
        [boundTenantId, eventId],
      );
    });
  },
});
