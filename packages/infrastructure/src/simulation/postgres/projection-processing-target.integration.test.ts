import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { createPostgresDatabase } from "./database";
import { createPostgresProjectionProcessingTargetRepository } from "./postgres-projection-processing-target-repository";
import { deletePostgresTenantsRows } from "./test-db-cleanup";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
const describeIf =
  DATABASE_URL && DATABASE_ADMIN_URL ? describe : describe.skip;

describeIf("projection processing targets (postgres)", () => {
  const tenantA = "tenant_ps023_a";
  const tenantB = "tenant_ps023_b";
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: DATABASE_ADMIN_URL });
    await admin.connect();
  });

  afterAll(async () => {
    await admin.end();
  });

  beforeEach(async () => {
    await deletePostgresTenantsRows(admin, [tenantA, tenantB]);
  });

  it("enforces uniqueness and claim exclusivity across workers", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const repo = createPostgresProjectionProcessingTargetRepository(
      database,
      tenantA,
    );
    await repo.materializeTargets([
      {
        tenantId: tenantA,
        eventId: "evt_1",
        projectionType: "inbox",
        simulationRunId: "run_1",
        eventType: "LearnerMessageDelivered",
      },
      {
        tenantId: tenantA,
        eventId: "evt_1",
        projectionType: "inbox",
        simulationRunId: "run_1",
        eventType: "LearnerMessageDelivered",
      },
    ]);
    const now = new Date();
    const claimedA = await repo.claimTargets({
      workerId: "worker-a",
      batchSize: 10,
      claimLeaseMs: 60_000,
      now,
    });
    const claimedB = await repo.claimTargets({
      workerId: "worker-b",
      batchSize: 10,
      claimLeaseMs: 60_000,
      now: new Date(now.getTime() + 1_000),
    });
    expect(claimedA).toHaveLength(1);
    expect(claimedB).toHaveLength(0);
    expect(claimedA[0]?.claimedBy).toBe("worker-a");
    await database.close();
  });

  it("recovers stale claims after lease expiry", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const repo = createPostgresProjectionProcessingTargetRepository(
      database,
      tenantA,
    );
    await repo.materializeTargets([
      {
        tenantId: tenantA,
        eventId: "evt_stale",
        projectionType: "meetings",
        simulationRunId: "run_1",
        eventType: "MeetingScheduled",
      },
    ]);
    const claimedAt = new Date();
    const first = await repo.claimTargets({
      workerId: "worker-a",
      batchSize: 1,
      claimLeaseMs: 1,
      now: claimedAt,
    });
    expect(first).toHaveLength(1);
    const recovered = await repo.claimTargets({
      workerId: "worker-b",
      batchSize: 1,
      claimLeaseMs: 60_000,
      now: new Date(claimedAt.getTime() + 2_000),
    });
    expect(recovered).toHaveLength(1);
    expect(recovered[0]?.claimedBy).toBe("worker-b");
    await database.close();
  });

  it("isolates tenants under RLS", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const repoA = createPostgresProjectionProcessingTargetRepository(
      database,
      tenantA,
    );
    const repoB = createPostgresProjectionProcessingTargetRepository(
      database,
      tenantB,
    );
    await repoA.materializeTargets([
      {
        tenantId: tenantA,
        eventId: "evt_a",
        projectionType: "inbox",
        simulationRunId: "run_a",
        eventType: "LearnerMessageDelivered",
      },
    ]);
    await repoB.materializeTargets([
      {
        tenantId: tenantB,
        eventId: "evt_b",
        projectionType: "inbox",
        simulationRunId: "run_b",
        eventType: "LearnerMessageDelivered",
      },
    ]);
    const fromA = await repoA.claimTargets({
      workerId: "w",
      batchSize: 10,
      claimLeaseMs: 60_000,
      now: new Date(),
    });
    expect(fromA.map((t) => t.eventId)).toEqual(["evt_a"]);
    const summaryB = await repoB.queueSummary();
    expect(summaryB.pending + summaryB.claimed).toBe(1);
    await database.close();
  });

  it("supports manual retry of exhausted targets", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const repo = createPostgresProjectionProcessingTargetRepository(
      database,
      tenantA,
    );
    await repo.materializeTargets([
      {
        tenantId: tenantA,
        eventId: "evt_x",
        projectionType: "documents",
        simulationRunId: "run_1",
        eventType: "DocumentInitialized",
      },
    ]);
    await repo.markFailed({
      eventId: "evt_x",
      projectionType: "documents",
      attemptCount: 5,
      nextAttemptAt: null,
      exhausted: true,
      classification: "unknown",
      summary: "boom",
      now: new Date(),
    });
    const retry = await repo.manualRetry({
      eventId: "evt_x",
      projectionType: "documents",
      now: new Date(),
    });
    expect(retry.ok).toBe(true);
    expect(retry.priorStatus).toBe("exhausted");
    const row = await repo.getTarget("evt_x", "documents");
    expect(row?.status).toBe("retrying");
    await database.close();
  });
});
