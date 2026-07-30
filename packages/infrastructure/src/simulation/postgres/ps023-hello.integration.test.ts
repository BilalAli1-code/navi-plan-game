import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
} from "@projectsim/domain";
import { createInMemoryMembershipStore } from "../authorization/membership";
import { createPostgresDatabase } from "./database";
import { discoverRelayTenants } from "./discover-relay-tenants";
import { createPostgresSimulationCommandModule } from "./postgres-composition-root";
import { deletePostgresTenantsRows } from "./test-db-cleanup";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
const describeIf =
  DATABASE_URL && DATABASE_ADMIN_URL ? describe : describe.skip;

describeIf("PS-023 hello-world convergence", () => {
  const tenantId = "tenant_ps023_hello";
  const actorId = "actor_ps023_hello";
  const runId = "run_ps023_hello";
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: DATABASE_ADMIN_URL });
    await admin.connect();
  });

  afterAll(async () => {
    await admin.end();
  });

  beforeEach(async () => {
    await deletePostgresTenantsRows(admin, [tenantId]);
    await admin.query(
      `insert into tenant_memberships (tenant_id, actor_id, roles, capabilities)
       values ($1, $2, $3, $4)`,
      [
        tenantId,
        actorId,
        ["operator"],
        [
          "simulation.run.view",
          "simulation.run.start",
          "simulation.projection.ops",
        ],
      ],
    );
  });

  it("publishes outbox, materializes targets, and supports rebuild ops", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const module = createPostgresSimulationCommandModule({
      database,
      tenantId,
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId(actorId),
          tenantId,
          roles: ["operator"],
          capabilities: [
            "simulation.run.view",
            "simulation.run.start",
            "simulation.projection.ops",
          ],
        },
      ]),
      relayWorkerId: "hello-worker",
    });

    const created = await module.lifecycleService.create({
      simulationRunId: asSimulationRunId(runId),
      actorId: asActorId(actorId),
      learnerId: asLearnerId("learner_ps023_hello"),
      businessCaseId: asBusinessCaseId("case_ps023_hello"),
      correlationId: asCorrelationId("corr_hello"),
      causationId: null,
      contentPackageVersionId: asContentPackageVersionId("cpv_1"),
      runtimeVersion: "runtime-1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const started = await module.lifecycleService.start({
      simulationRunId: asSimulationRunId(runId),
      actorId: asActorId(actorId),
      correlationId: asCorrelationId("corr_hello_start"),
      causationId: null,
      expectedAggregateVersion: null,
    });
    expect(started.ok).toBe(true);

    const tenants = await discoverRelayTenants(DATABASE_ADMIN_URL!);
    expect(tenants).toContain(tenantId);

    let published = 0;
    for (let i = 0; i < 20; i += 1) {
      const tick = await module.outboxRelay.tick();
      published += tick.published;
      if (tick.claimed === 0) break;
    }
    expect(published).toBeGreaterThan(0);

    const summary = await module.projectionOperationsService.getQueueSummary({
      actorId: asActorId(actorId),
      tenantId: asTenantId(tenantId),
      capabilities: [
        "simulation.run.view",
        "simulation.run.start",
        "simulation.projection.ops",
      ],
    });
    expect(summary.ok).toBe(true);
    if (summary.ok) {
      expect(summary.value.succeeded).toBeGreaterThan(0);
    }

    const rebuild = await module.projectionOperationsService.rebuildAllForRun(
      {
        actorId: asActorId(actorId),
        tenantId: asTenantId(tenantId),
        capabilities: [
          "simulation.run.view",
          "simulation.run.start",
          "simulation.projection.ops",
        ],
      },
      {
        simulationRunId: runId,
        correlationId: "corr_rebuild_all",
      },
    );
    expect(rebuild.ok).toBe(true);
    if (rebuild.ok) {
      expect(rebuild.value.results.length).toBeGreaterThan(0);
      expect(
        rebuild.value.results.some((item) => item.result === "rebuilt"),
      ).toBe(true);
    }

    await module.close();
    await database.close();
  });
});
