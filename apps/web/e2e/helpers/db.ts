import pg from "pg";
import { E2E_DATABASE_ADMIN_URL, requireE2eDatabase } from "./env";

const { Client } = pg;

export interface AuthoritativeDecisionState {
  readonly decisionCount: number;
  readonly resolvedDecisionCount: number;
  readonly outcomeCount: number;
  readonly consequenceCount: number;
  readonly scheduledEventCount: number;
  readonly budget: number | null;
  readonly projectStatus: string | null;
  readonly idempotencyReceiptCount: number;
  readonly outboxEventCount: number;
  /** Count of `simulation` projection rows (Decision workspace identity). */
  readonly projectionCount: number;
  /** Count of `mission_control` projection rows (PS-ROADMAP-011). */
  readonly missionControlProjectionCount: number;
  /** Count of `decision_log` projection rows (PS-ROADMAP-012). */
  readonly decisionLogProjectionCount: number;
  readonly projectionSourceAggregateVersion: number | null;
  readonly projectionHistoryCount: number;
  readonly distinctConsequenceApplicationKeys: number;
  /** Authoritative system-delivered learner messages (PS-014 prerequisite). */
  readonly learnerMessageCount: number;
  readonly learnerMessageDeliveredOutboxCount: number;
}

const queryAdmin = async <T extends pg.QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> => {
  requireE2eDatabase();
  const client = new Client({ connectionString: E2E_DATABASE_ADMIN_URL });
  await client.connect();
  try {
    return await client.query<T>(sql, params);
  } finally {
    await client.end();
  }
};

export const inspectAuthoritativeDecisionState = async (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): Promise<AuthoritativeDecisionState> => {
  const stateRows = await queryAdmin<{ authoritative_state: unknown }>(
    `select authoritative_state
       from simulation_state
      where tenant_id = $1 and simulation_run_id = $2`,
    [input.tenantId, input.simulationRunId],
  );
  if (stateRows.rowCount !== 1) {
    throw new Error(
      `Expected one simulation_state row for ${input.tenantId}/${input.simulationRunId}`,
    );
  }
  const state = stateRows.rows[0]!.authoritative_state as {
    decisions?: unknown[];
    decisionOutcomes?: unknown[];
    consequences?: Array<{ applicationKey?: string }>;
    scheduledEvents?: unknown[];
    learnerMessages?: unknown[];
    projectMetrics?: { budget?: { value?: number } };
    projectState?: { status?: string };
  };

  const decisions = Array.isArray(state.decisions) ? state.decisions : [];
  const outcomes = Array.isArray(state.decisionOutcomes)
    ? state.decisionOutcomes
    : [];
  const consequences = Array.isArray(state.consequences)
    ? state.consequences
    : [];
  const schedules = Array.isArray(state.scheduledEvents)
    ? state.scheduledEvents
    : [];
  const learnerMessages = Array.isArray(state.learnerMessages)
    ? state.learnerMessages
    : [];
  const resolvedDecisionCount = decisions.filter((decision) => {
    const record = decision as { status?: string };
    return record.status === "resolved";
  }).length;

  const applicationKeys = new Set(
    consequences
      .map((consequence) => consequence.applicationKey)
      .filter((key): key is string => typeof key === "string"),
  );

  // Receipts are keyed by (tenant_id, command_id). Tests use unique tenants.
  const receipts = await queryAdmin(
    `select 1 from idempotency_receipts
      where tenant_id = $1 and result->>'simulationRunId' = $2`,
    [input.tenantId, input.simulationRunId],
  );
  const outbox = await queryAdmin(
    `select 1 from event_outbox
      where tenant_id = $1 and simulation_run_id = $2`,
    [input.tenantId, input.simulationRunId],
  );
  const learnerMessageOutbox = await queryAdmin(
    `select 1 from event_outbox
      where tenant_id = $1
        and simulation_run_id = $2
        and event_type = 'LearnerMessageDelivered'`,
    [input.tenantId, input.simulationRunId],
  );
  const projections = await queryAdmin<{
    source_aggregate_version: number;
    projection_payload: { decisionHistory?: unknown[] };
  }>(
    `select source_aggregate_version, projection_payload
       from simulation_projection
      where tenant_id = $1
        and simulation_run_id = $2
        and projection_type = 'simulation'`,
    [input.tenantId, input.simulationRunId],
  );
  const missionControlProjections = await queryAdmin(
    `select 1
       from simulation_projection
      where tenant_id = $1
        and simulation_run_id = $2
        and projection_type = 'mission_control'`,
    [input.tenantId, input.simulationRunId],
  );
  const decisionLogProjections = await queryAdmin(
    `select 1
       from simulation_projection
      where tenant_id = $1
        and simulation_run_id = $2
        and projection_type = 'decision_log'`,
    [input.tenantId, input.simulationRunId],
  );

  const projection = projections.rows[0];
  const history = Array.isArray(projection?.projection_payload?.decisionHistory)
    ? projection!.projection_payload.decisionHistory!
    : [];

  return {
    decisionCount: decisions.length,
    resolvedDecisionCount,
    outcomeCount: outcomes.length,
    consequenceCount: consequences.length,
    scheduledEventCount: schedules.length,
    budget: state.projectMetrics?.budget?.value ?? null,
    projectStatus: state.projectState?.status ?? null,
    idempotencyReceiptCount: receipts.rowCount ?? 0,
    outboxEventCount: outbox.rowCount ?? 0,
    projectionCount: projections.rowCount ?? 0,
    missionControlProjectionCount: missionControlProjections.rowCount ?? 0,
    decisionLogProjectionCount: decisionLogProjections.rowCount ?? 0,
    projectionSourceAggregateVersion:
      projection?.source_aggregate_version ?? null,
    projectionHistoryCount: history.length,
    distinctConsequenceApplicationKeys: applicationKeys.size,
    learnerMessageCount: learnerMessages.length,
    learnerMessageDeliveredOutboxCount: learnerMessageOutbox.rowCount ?? 0,
  };
};

export const countCrossTenantLeaks = async (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): Promise<number> => {
  const result = await queryAdmin(
    `select 1 from simulation_state
      where simulation_run_id = $1 and tenant_id <> $2
     union all
     select 1 from simulation_projection
      where simulation_run_id = $1 and tenant_id <> $2`,
    [input.simulationRunId, input.tenantId],
  );
  return result.rowCount ?? 0;
};

export const countProjectionInboxRows = async (input: {
  readonly tenantId: string;
}): Promise<number> => {
  // Inbox is keyed by (tenant_id, event_id); tests use unique tenants.
  const result = await queryAdmin(
    `select 1 from projection_event_inbox where tenant_id = $1`,
    [input.tenantId],
  );
  return result.rowCount ?? 0;
};

export const listOutboxEventTypes = async (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): Promise<string[]> => {
  const result = await queryAdmin<{ event_type: string }>(
    `select event_type
       from event_outbox
      where tenant_id = $1 and simulation_run_id = $2
      order by id asc`,
    [input.tenantId, input.simulationRunId],
  );
  return result.rows.map((row) => row.event_type);
};

/** Prove unique event IDs may share one action sequenceNumber. */
export const assertSharedSequenceUniqueEventIds = async (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): Promise<void> => {
  const result = await queryAdmin<{
    sequence_number: number;
    event_count: string;
    distinct_ids: string;
  }>(
    `select sequence_number,
            count(*)::text as event_count,
            count(distinct event_id)::text as distinct_ids
       from event_outbox
      where tenant_id = $1 and simulation_run_id = $2
      group by sequence_number
     having count(*) > 1`,
    [input.tenantId, input.simulationRunId],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error(
      "Expected at least one action sequence with multiple unique outbox events.",
    );
  }
  for (const row of result.rows) {
    if (row.event_count !== row.distinct_ids) {
      throw new Error(
        `Sequence ${row.sequence_number} has duplicate event_id values.`,
      );
    }
  }
};

export const waitForAuthoritativeCondition = async (
  check: () => Promise<boolean>,
  options?: {
    readonly timeoutMs?: number;
    readonly intervalMs?: number;
    readonly message?: string;
  },
): Promise<void> => {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  const intervalMs = options?.intervalMs ?? 200;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    options?.message ??
      `Timed out after ${timeoutMs}ms waiting for authoritative condition`,
  );
};
