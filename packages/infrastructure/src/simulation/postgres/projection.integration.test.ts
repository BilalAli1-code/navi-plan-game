import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createScaffoldDecisionDefinition,
  isAccepted,
  type DecisionDefinition,
  type SubmitDecisionCommand,
} from "@projectsim/domain";
import pkg from "pg";
import { createPermitAllAuthorizer } from "../authorizer";
import { createPermitAllLifecycleAuthorizer } from "../authorization/lifecycle-authorizer";
import { createPermitAllProjectionAuthorizer } from "../authorization/projection-authorizer";
import { createInMemoryDecisionDefinitionProvider } from "../decision-definition-provider";
import {
  createInMemoryDecisionProjectionContentProvider,
  createScaffoldProjectionContentRecord,
} from "../projection/projection-content-provider";
import { createInMemoryEventBus } from "./event-bus";
import {
  createPostgresSimulationCommandModule,
  type PostgresSimulationCommandModule,
} from "./postgres-composition-root";
import { cleanupPostgresTenants } from "./test-db-cleanup";

const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb = DATABASE_URL ? describe : describe.skip;
const skipReason =
  "DATABASE_URL / DATABASE_ADMIN_URL unavailable — Postgres projection suites skipped";

const TENANT_A = "tenant_proj_a";
const TENANT_B = "tenant_proj_b";
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const definition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const buildCommand = (commandId: string): SubmitDecisionCommand => ({
  commandId: asCommandId(commandId),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
});

const truncateAll = async (): Promise<void> => {
  await cleanupPostgresTenants({
    adminUrl: DATABASE_ADMIN_URL,
    tenantIds: [TENANT_A, TENANT_B],
  });
};

const adminQuery = async <T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  if (!DATABASE_ADMIN_URL) {
    return [];
  }
  const client = new Client({ connectionString: DATABASE_ADMIN_URL });
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    await client.end();
  }
};

describeIfDb("PS-ROADMAP-006 postgres projection persistence + RLS", () => {
  let moduleA: PostgresSimulationCommandModule;

  beforeAll(() => {
    if (!DATABASE_URL) {
      return;
    }
    const contentProvider = createInMemoryDecisionProjectionContentProvider([
      createScaffoldProjectionContentRecord({
        tenantId: asTenantId(TENANT_A),
        contentPackageVersionId,
      }),
    ]);
    moduleA = createPostgresSimulationCommandModule({
      database: { connectionString: DATABASE_URL },
      tenantId: TENANT_A,
      authorizer: createPermitAllAuthorizer(),
      lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
      projectionAuthorizer: createPermitAllProjectionAuthorizer(),
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        { tenantId: asTenantId(TENANT_A), definition },
      ]),
      projectionContentProvider: contentProvider,
      eventBus: createInMemoryEventBus(),
    });
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await moduleA?.close();
  });

  it("persists projection via rebuild and round-trips JSON + source versions", async () => {
    const created = await moduleA.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    expect(created.ok).toBe(true);
    const started = await moduleA.lifecycleService.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: null,
    });
    expect(started.ok).toBe(true);

    const rebuilt = await moduleA.rebuildProjectionService.rebuild({
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      actorId: asActorId("actor_1"),
    });
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) {
      return;
    }
    expect(rebuilt.value.projection.availableDecisions).toHaveLength(1);

    const rows = await adminQuery<{
      projection_hash: string;
      source_aggregate_version: number;
      source_state_version: number;
      source_action_sequence: number;
      projection_payload: unknown;
    }>(
      `select projection_hash, source_aggregate_version, source_state_version,
              source_action_sequence, projection_payload
         from simulation_projection
        where tenant_id = $1 and simulation_run_id = $2`,
      [TENANT_A, "run_1"],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.projection_hash).toBe(
      rebuilt.value.projection.semanticHash,
    );
    expect(rows[0]?.source_aggregate_version).toBe(
      rebuilt.value.projection.sourceAggregateVersion,
    );

    const got = await moduleA.getProjectionService.get({
      simulationRunId: asSimulationRunId("run_1"),
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_2"),
      causationId: null,
    });
    expect(got.ok).toBe(true);
    if (!got.ok) {
      return;
    }
    expect(got.value.freshness).toBe("current");
    expect(got.value.projection.semanticHash).toBe(
      rebuilt.value.projection.semanticHash,
    );
  });

  it("event-triggered rebuild via relay after SubmitDecision; failure isolation", async () => {
    const created = await moduleA.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    expect(created.ok).toBe(true);
    await moduleA.lifecycleService.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: null,
    });

    const accepted = await moduleA.applicationService.process(
      buildCommand("cmd_proj_1"),
    );
    expect(isAccepted(accepted)).toBe(true);

    const beforeAgg = (
      await moduleA.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId("run_1"),
      )
    )?.aggregateVersion;

    const tick = await moduleA.outboxRelay.tick();
    expect(tick.published).toBeGreaterThan(0);

    const projection = await moduleA.projectionRepository.get(
      asTenantId(TENANT_A),
      asSimulationRunId("run_1"),
    );
    expect(projection).not.toBeNull();
    expect(projection?.decisionHistory).toHaveLength(1);
    expect(projection?.availableDecisions).toEqual([]);
    expect(JSON.stringify(projection)).not.toContain("FIXTURE_DELAYED_REVIEW");

    const afterAgg = (
      await moduleA.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId("run_1"),
      )
    )?.aggregateVersion;
    expect(afterAgg).toBe(beforeAgg);

    // ProjectionRebuilt technical events may remain pending after consumer rebuilds.
    // Drain them; authoritative SimulationRun must stay unchanged.
    await moduleA.outboxRelay.tick();
    const tickIdle = await moduleA.outboxRelay.tick();
    expect(tickIdle.claimed).toBe(0);

    await moduleA.projectionRepository.delete(
      asTenantId(TENANT_A),
      asSimulationRunId("run_1"),
    );
    const rebuilt = await moduleA.rebuildProjectionService.rebuild({
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_rebuild"),
      causationId: null,
      actorId: asActorId("actor_1"),
    });
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok || !projection) {
      return;
    }
    expect(rebuilt.value.projection.semanticHash).toBe(projection.semanticHash);
    const finalAgg = (
      await moduleA.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId("run_1"),
      )
    )?.aggregateVersion;
    expect(finalAgg).toBe(beforeAgg);
  });
  it("enforces tenant isolation for projection read/write/delete", async () => {
    if (!DATABASE_URL) {
      return;
    }
    const contentProvider = createInMemoryDecisionProjectionContentProvider([
      createScaffoldProjectionContentRecord({
        tenantId: asTenantId(TENANT_A),
        contentPackageVersionId,
      }),
      createScaffoldProjectionContentRecord({
        tenantId: asTenantId(TENANT_B),
        contentPackageVersionId,
      }),
    ]);
    const moduleB = createPostgresSimulationCommandModule({
      database: { connectionString: DATABASE_URL },
      tenantId: TENANT_B,
      authorizer: createPermitAllAuthorizer(),
      lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
      projectionAuthorizer: createPermitAllProjectionAuthorizer(),
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        { tenantId: asTenantId(TENANT_B), definition },
      ]),
      projectionContentProvider: contentProvider,
      enableProjectionConsumer: false,
    });

    try {
      await moduleA.lifecycleService.create({
        actorId: asActorId("actor_1"),
        learnerId: asLearnerId("learner_1"),
        businessCaseId: asBusinessCaseId("case_1"),
        contentPackageVersionId,
        runtimeVersion: "runtime-1",
        correlationId: asCorrelationId("corr_1"),
        causationId: null,
        simulationRunId: asSimulationRunId("run_1"),
      });
      await moduleA.lifecycleService.start({
        actorId: asActorId("actor_1"),
        simulationRunId: asSimulationRunId("run_1"),
        correlationId: asCorrelationId("corr_1"),
        causationId: null,
        expectedAggregateVersion: null,
      });
      const rebuilt = await moduleA.rebuildProjectionService.rebuild({
        simulationRunId: asSimulationRunId("run_1"),
        correlationId: asCorrelationId("corr_1"),
        causationId: null,
        actorId: asActorId("actor_1"),
      });
      expect(rebuilt.ok).toBe(true);

      expect(
        await moduleB.projectionRepository.get(
          asTenantId(TENANT_B),
          asSimulationRunId("run_1"),
        ),
      ).toBeNull();

      // Cross-tenant write via app role should be denied by RLS.
      if (!DATABASE_URL) {
        return;
      }
      const client = new Client({ connectionString: DATABASE_URL });
      await client.connect();
      try {
        await client.query("select set_config('app.tenant_id', $1, false)", [
          TENANT_B,
        ]);
        await expect(
          client.query(
            `insert into simulation_projection (
               tenant_id, simulation_run_id, projection_type, projection_schema_version,
               source_aggregate_version, source_state_version, source_action_sequence,
               content_package_version_id, projection_payload, projection_hash, generated_at
             ) values ($1,'run_1','simulation',1,1,0,0,'cpv_1','{}'::jsonb,'hash',now())`,
            [TENANT_A],
          ),
        ).rejects.toThrow();
      } finally {
        await client.end();
      }
    } finally {
      await moduleB.close();
    }
  });
});

if (!DATABASE_URL) {
  describe("PS-ROADMAP-006 postgres projection persistence + RLS (skipped)", () => {
    it.skip(`skipped: ${skipReason}`, () => {
      // Explicit skip reporting for CI/agents without DATABASE_URL.
    });
  });
}
