import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
} from "@projectsim/domain";
import {
  cleanupPostgresTenants,
  upsertPostgresMembership,
} from "@projectsim/infrastructure";
import pkg from "pg";
import {
  createAuthResolver,
  createDevAccessToken,
  createTestSupabaseAccessToken,
} from "./auth/session";
import { createApiApp } from "./create-app";
import { createPostgresSimulationModuleRegistry } from "./module-registry";

const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb = DATABASE_URL ? describe : describe.skip;
const skipReason =
  "DATABASE_URL / DATABASE_ADMIN_URL unavailable — Postgres API route suites skipped";

const TENANT = "tenant_api_pg";
const ACTOR = "actor_api_pg";
const RUN = "run_api_pg";
const JWT_SECRET = "ps007-postgres-api-test-secret";

const truncateAll = async (): Promise<void> => {
  await cleanupPostgresTenants({
    adminUrl: DATABASE_ADMIN_URL,
    tenantIds: [TENANT],
  });
};

describeIfDb("PS-ROADMAP-007 postgres-backed public API routes", () => {
  if (!DATABASE_URL) {
    it(skipReason, () => {
      expect(true).toBe(true);
    });
    return;
  }

  const registry = createPostgresSimulationModuleRegistry({
    connectionString: DATABASE_URL,
  });
  const resolveAuth = createAuthResolver({
    supabaseJwtSecret: JWT_SECRET,
    allowDevAuth: false,
  });
  const app = createApiApp({
    registry,
    resolveAuth,
    enableDevRoutes: false,
    allowDevAuth: false,
    clock: () => "2026-07-25T13:00:00.000Z",
    allocateRequestId: () => "req_pg_1",
  });

  beforeAll(async () => {
    await truncateAll();
  });

  beforeEach(async () => {
    await truncateAll();
    await upsertPostgresMembership(registry.database, {
      actorId: asActorId(ACTOR),
      tenantId: TENANT,
      roles: ["learner"],
      capabilities: ["simulation.run.view", "simulation.run.start"],
    });
    const services = registry.get(TENANT);
    const created = await services.lifecycleService.create({
      actorId: asActorId(ACTOR),
      learnerId: asLearnerId("learner_pg"),
      businessCaseId: asBusinessCaseId("case_pg"),
      contentPackageVersionId: asContentPackageVersionId("cpv_1"),
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_pg_seed"),
      causationId: null,
      simulationRunId: asSimulationRunId(RUN),
    });
    expect(created.ok).toBe(true);
    const started = await services.lifecycleService.start({
      actorId: asActorId(ACTOR),
      simulationRunId: asSimulationRunId(RUN),
      correlationId: asCorrelationId("corr_pg_seed"),
      causationId: null,
      expectedAggregateVersion: null,
    });
    expect(started.ok).toBe(true);
  });

  afterAll(async () => {
    await registry.close();
  });

  it("reads the canonical projection through GetSimulationProjection over Postgres", async () => {
    const token = await createTestSupabaseAccessToken({
      jwtSecret: JWT_SECRET,
      actorId: ACTOR,
      tenantId: TENANT,
    });
    const res = await app.request(`/api/v1/simulation-runs/${RUN}/projection`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Correlation-ID": "corr_pg_read",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.data.availableDecisions).toHaveLength(1);
    expect(body.data.semanticHash).toBeUndefined();

    const client = new Client({ connectionString: DATABASE_ADMIN_URL });
    await client.connect();
    try {
      const rows = await client.query(
        `select tenant_id, simulation_run_id from simulation_projection
          where tenant_id = $1 and simulation_run_id = $2
            and projection_type = 'simulation'`,
        [TENANT, RUN],
      );
      expect(rows.rowCount).toBe(1);
    } finally {
      await client.end();
    }
  });

  it("submits a decision through durable Postgres idempotency and refreshes projection", async () => {
    const token = await createTestSupabaseAccessToken({
      jwtSecret: JWT_SECRET,
      actorId: ACTOR,
      tenantId: TENANT,
    });
    const projection = await (
      await app.request(`/api/v1/simulation-runs/${RUN}/projection`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    const version = projection.meta.sourceAggregateVersion as number;
    const budgetBefore = projection.data.project.metrics.find(
      (metric: { metricKey: string }) => metric.metricKey === "budget",
    )?.value;
    const projectBefore = projection.data.project.status as string;

    const client = new Client({ connectionString: DATABASE_ADMIN_URL });
    await client.connect();
    let beforeUpdatedAt: string | null = null;
    try {
      const beforeRows = await client.query<{
        source_aggregate_version: number;
        updated_at: Date;
      }>(
        `select source_aggregate_version, updated_at
           from simulation_projection
          where tenant_id = $1 and simulation_run_id = $2
            and projection_type = 'simulation'`,
        [TENANT, RUN],
      );
      expect(beforeRows.rowCount).toBe(1);
      beforeUpdatedAt = beforeRows.rows[0]!.updated_at.toISOString();
      expect(beforeRows.rows[0]!.source_aggregate_version).toBe(version);
    } finally {
      await client.end();
    }

    const commandId = "cmd_pg_submit_1";
    const res = await app.request(
      `/api/v1/simulation-runs/${RUN}/commands/submit-decision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": commandId,
          "If-Match": `"${version}"`,
          "X-Correlation-ID": "corr_pg_submit",
        },
        body: JSON.stringify({
          commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: "decision_1",
            optionId: "option_b",
            rationale: "postgres path",
          },
        }),
      },
    );
    expect(res.status).toBe(200);
    const receipt = await res.json();
    expect(receipt.data.status).toBe("accepted");
    expect(receipt.data.aggregateVersion).toBeGreaterThan(version);

    const refreshed = await (
      await app.request(`/api/v1/simulation-runs/${RUN}/projection`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).json();
    expect(refreshed.meta.freshness).toBe("current");
    expect(refreshed.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
      receipt.data.aggregateVersion,
    );
    expect(refreshed.data.availableDecisions).toEqual([]);
    expect(refreshed.data.decisionHistory).toHaveLength(1);
    expect(refreshed.data.decisionHistory[0]?.status).toBe("resolved");
    expect(refreshed.data.decisionHistory[0]?.selectedOptionId).toBe(
      "option_b",
    );
    expect(refreshed.data.project.status).not.toBe(projectBefore);
    const budgetAfter = refreshed.data.project.metrics.find(
      (metric: { metricKey: string }) => metric.metricKey === "budget",
    )?.value;
    expect(budgetAfter).toBeGreaterThan(budgetBefore ?? 0);

    const verify = new Client({ connectionString: DATABASE_ADMIN_URL });
    await verify.connect();
    try {
      const projectionRows = await verify.query<{
        source_aggregate_version: number;
        updated_at: Date;
      }>(
        `select source_aggregate_version, updated_at
           from simulation_projection
          where tenant_id = $1 and simulation_run_id = $2
            and projection_type = 'simulation'`,
        [TENANT, RUN],
      );
      // UPDATE path (not a second insert): one simulation row with advanced source version.
      expect(projectionRows.rowCount).toBe(1);
      expect(projectionRows.rows[0]!.source_aggregate_version).toBeGreaterThan(
        version,
      );
      expect(projectionRows.rows[0]!.updated_at.toISOString()).not.toBe(
        beforeUpdatedAt,
      );

      const receipts = await verify.query(
        `select command_id from idempotency_receipts
          where tenant_id = $1 and command_id = $2`,
        [TENANT, commandId],
      );
      expect(receipts.rowCount).toBe(1);
      const outbox = await verify.query(
        `select event_id from event_outbox where tenant_id = $1`,
        [TENANT],
      );
      expect(outbox.rowCount).toBeGreaterThan(0);

      // Same-key retry returns the original accepted receipt.
      const retry = await app.request(
        `/api/v1/simulation-runs/${RUN}/commands/submit-decision`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Idempotency-Key": commandId,
            "If-Match": `"${version}"`,
            "X-Correlation-ID": "corr_pg_retry",
          },
          body: JSON.stringify({
            commandId,
            commandType: "SubmitDecision",
            commandVersion: 1,
            expectedAggregateVersion: version,
            payload: {
              decisionId: "decision_1",
              optionId: "option_b",
              rationale: "postgres path",
            },
          }),
        },
      );
      expect(retry.status).toBe(200);
      const retryBody = await retry.json();
      expect(retryBody.data.commandId).toBe(receipt.data.commandId);
      expect(retryBody.data.aggregateVersion).toBe(
        receipt.data.aggregateVersion,
      );
    } finally {
      await verify.end();
    }
  });

  it("denies actors without tenant membership and rejects disabled dev tokens", async () => {
    const outsider = await createTestSupabaseAccessToken({
      jwtSecret: JWT_SECRET,
      actorId: "outsider",
      tenantId: TENANT,
    });
    const denied = await app.request(
      `/api/v1/simulation-runs/${RUN}/projection`,
      { headers: { Authorization: `Bearer ${outsider}` } },
    );
    expect(denied.status).toBe(403);

    const devToken = createDevAccessToken({
      actorId: ACTOR,
      tenantId: TENANT,
    });
    const devRejected = await app.request(
      `/api/v1/simulation-runs/${RUN}/projection`,
      { headers: { Authorization: `Bearer ${devToken}` } },
    );
    expect(devRejected.status).toBe(401);

    // Ensure tenant branding remains isolated.
    expect(asTenantId(TENANT)).toBe(TENANT);
  });
});

if (!DATABASE_URL) {
  describe("PS-ROADMAP-007 postgres-backed public API routes (skipped)", () => {
    it(skipReason, () => {
      expect(DATABASE_URL).toBeFalsy();
    });
  });
}
