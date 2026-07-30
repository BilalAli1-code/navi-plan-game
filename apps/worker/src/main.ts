import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  createPostgresDatabase,
  createPostgresSimulationCommandModule,
  createRelayWorkerLoop,
  discoverRelayTenants,
  type RelayWorkerStatus,
  type PostgresSimulationCommandModule,
} from "@projectsim/infrastructure";
import { loadWorkerRuntimeConfig } from "./config.js";

const log = (event: string, fields: Record<string, unknown> = {}) => {
  console.log(
    JSON.stringify({ event, ts: new Date().toISOString(), ...fields }),
  );
};

const main = async () => {
  const config = loadWorkerRuntimeConfig();
  if (!config.enabled) {
    log("relay.worker.disabled", {});
    return;
  }

  const database = createPostgresDatabase({
    connectionString: config.databaseUrl,
  });
  const modules = new Map<string, PostgresSimulationCommandModule>();

  const getModule = (tenantId: string) => {
    const existing = modules.get(tenantId);
    if (existing) return existing;
    const created = createPostgresSimulationCommandModule({
      database,
      tenantId,
      relayWorkerId: config.worker.workerId,
      retryPolicy: config.retry,
    });
    modules.set(tenantId, created);
    return created;
  };

  let latestStatus: RelayWorkerStatus | null = null;
  const loop = createRelayWorkerLoop({
    config: config.worker,
    discoverTenants: () => discoverRelayTenants(config.databaseAdminUrl),
    createTenantTick: async (tenantId) => {
      const module = getModule(tenantId);
      return {
        tenantId,
        tickOutbox: () => module.outboxRelay.tick(),
        processTargets: async (batchSize) => {
          const processor = module.projectionEventConsumer.targetProcessor;
          if (!processor) {
            return { claimed: 0 };
          }
          const result = await processor.processClaimableBatch(batchSize);
          const settled = new Set<string>();
          for (const item of result.results) {
            if (item.outcome !== "succeeded" || settled.has(item.eventId)) {
              continue;
            }
            settled.add(item.eventId);
            await module.projectionEventConsumer.settleEventIfComplete(
              item.eventId,
            );
          }
          return { claimed: result.claimed };
        },
      };
    },
    sleep: (ms, signal) =>
      new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(new Error("aborted"));
          return;
        }
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        }, ms);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        };
        signal.addEventListener("abort", onAbort, { once: true });
      }),
    log,
    onStatus: (status) => {
      latestStatus = status;
    },
  });

  const app = new Hono();
  app.get("/healthz", (c) =>
    c.json({
      ok: true,
      liveness: true,
      workerId: config.worker.workerId,
      processState: latestStatus?.processState ?? "starting",
    }),
  );
  app.get("/readyz", (c) => {
    const ready = latestStatus?.ready === true && !latestStatus.shuttingDown;
    return c.json(
      {
        ok: ready,
        ready,
        workerId: config.worker.workerId,
        processState: latestStatus?.processState ?? "starting",
        database: true,
      },
      ready ? 200 : 503,
    );
  });
  app.get("/status", (c) =>
    c.json({
      data: latestStatus,
      meta: { workerId: config.worker.workerId },
    }),
  );

  const server = serve({ fetch: app.fetch, port: config.healthPort }, () => {
    log("relay.health.listen", { port: config.healthPort });
  });

  const controller = new AbortController();
  const onSignal = (signal: string) => {
    log("relay.worker.signal", { signal });
    controller.abort();
  };
  process.on("SIGTERM", () => onSignal("SIGTERM"));
  process.on("SIGINT", () => onSignal("SIGINT"));

  try {
    await loop.run(controller.signal);
  } finally {
    server.close();
    for (const module of modules.values()) {
      await module.close();
    }
    await database.close();
  }
};

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "relay.worker.fatal",
      message: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});
