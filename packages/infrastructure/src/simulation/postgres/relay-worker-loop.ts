import type { OutboxRelayTickResult } from "./outbox-relay";

export interface RelayWorkerConfig {
  readonly pollIntervalMs: number;
  readonly batchSize: number;
  readonly concurrency: number;
  readonly shutdownTimeoutMs: number;
  readonly workerId: string;
}

export const DEFAULT_RELAY_WORKER_CONFIG: RelayWorkerConfig = {
  pollIntervalMs: 1_000,
  batchSize: 50,
  concurrency: 4,
  shutdownTimeoutMs: 30_000,
  workerId: "relay-worker",
};

export const validateRelayWorkerConfig = (
  input: Partial<RelayWorkerConfig>,
): RelayWorkerConfig => {
  const pollIntervalMs =
    input.pollIntervalMs ?? DEFAULT_RELAY_WORKER_CONFIG.pollIntervalMs;
  const batchSize = input.batchSize ?? DEFAULT_RELAY_WORKER_CONFIG.batchSize;
  const concurrency =
    input.concurrency ?? DEFAULT_RELAY_WORKER_CONFIG.concurrency;
  const shutdownTimeoutMs =
    input.shutdownTimeoutMs ?? DEFAULT_RELAY_WORKER_CONFIG.shutdownTimeoutMs;
  const workerId = input.workerId ?? DEFAULT_RELAY_WORKER_CONFIG.workerId;

  if (
    !Number.isFinite(pollIntervalMs) ||
    pollIntervalMs < 50 ||
    pollIntervalMs > 600_000
  ) {
    throw new Error("RELAY_POLL_INTERVAL_MS must be in [50, 600000].");
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new Error("RELAY_BATCH_SIZE must be an integer in [1, 500].");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error("RELAY_CONCURRENCY must be an integer in [1, 32].");
  }
  if (
    !Number.isFinite(shutdownTimeoutMs) ||
    shutdownTimeoutMs < 100 ||
    shutdownTimeoutMs > 600_000
  ) {
    throw new Error("RELAY_SHUTDOWN_TIMEOUT_MS must be in [100, 600000].");
  }
  if (typeof workerId !== "string" || workerId.trim().length === 0) {
    throw new Error("RELAY_WORKER_ID must be a non-empty string.");
  }
  return {
    pollIntervalMs,
    batchSize,
    concurrency,
    shutdownTimeoutMs,
    workerId: workerId.trim(),
  };
};

export interface RelayTenantTick {
  readonly tenantId: string;
  tickOutbox(): Promise<OutboxRelayTickResult>;
  processTargets(batchSize: number): Promise<{
    readonly claimed: number;
  }>;
}

export interface RelayWorkerLoopDeps {
  readonly config: RelayWorkerConfig;
  readonly discoverTenants: () => Promise<readonly string[]>;
  readonly createTenantTick: (tenantId: string) => Promise<RelayTenantTick>;
  readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly log?: (event: string, fields: Record<string, unknown>) => void;
  readonly onStatus?: (status: RelayWorkerStatus) => void;
}

export interface RelayWorkerStatus {
  readonly processState:
    "starting" | "ready" | "running" | "shutting_down" | "stopped";
  readonly startedAt: string;
  readonly ready: boolean;
  readonly shuttingDown: boolean;
  readonly lastPollAt: string | null;
  readonly lastSuccessfulBatchAt: string | null;
  readonly lastLoopErrorAt: string | null;
  readonly lastLoopErrorSummary: string | null;
  readonly inFlightCount: number;
  readonly configuredConcurrency: number;
  readonly workerId: string;
}

export interface RelayWorkerLoop {
  run(signal: AbortSignal): Promise<void>;
  getStatus(): RelayWorkerStatus;
}

const sleepWithSignal = (ms: number, signal: AbortSignal): Promise<void> =>
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
  });

export const createRelayWorkerLoop = (
  deps: RelayWorkerLoopDeps,
): RelayWorkerLoop => {
  const log = deps.log ?? (() => undefined);
  const sleep = deps.sleep ?? sleepWithSignal;
  let status: RelayWorkerStatus = {
    processState: "starting",
    startedAt: new Date().toISOString(),
    ready: false,
    shuttingDown: false,
    lastPollAt: null,
    lastSuccessfulBatchAt: null,
    lastLoopErrorAt: null,
    lastLoopErrorSummary: null,
    inFlightCount: 0,
    configuredConcurrency: deps.config.concurrency,
    workerId: deps.config.workerId,
  };

  const publish = (patch: Partial<RelayWorkerStatus>) => {
    status = { ...status, ...patch };
    deps.onStatus?.(status);
  };

  return {
    getStatus: () => status,
    async run(signal) {
      log("relay.worker.start", { workerId: deps.config.workerId });
      publish({ processState: "ready", ready: true });
      log("relay.worker.ready", { workerId: deps.config.workerId });

      while (!signal.aborted) {
        publish({
          processState: "running",
          lastPollAt: new Date().toISOString(),
        });
        try {
          const tenants = await deps.discoverTenants();
          let didWork = false;
          for (const tenantId of tenants) {
            if (signal.aborted) break;
            publish({ inFlightCount: status.inFlightCount + 1 });
            try {
              const tick = await deps.createTenantTick(tenantId);
              const outbox = await tick.tickOutbox();
              const targets = await tick.processTargets(deps.config.batchSize);
              if (outbox.claimed > 0 || targets.claimed > 0) {
                didWork = true;
                publish({ lastSuccessfulBatchAt: new Date().toISOString() });
              }
              log("relay.worker.tenant_tick", {
                tenantId,
                outboxClaimed: outbox.claimed,
                outboxPublished: outbox.published,
                outboxFailed: outbox.failed,
                outboxDead: outbox.dead,
                targetsClaimed: targets.claimed,
              });
            } finally {
              publish({
                inFlightCount: Math.max(0, status.inFlightCount - 1),
              });
            }
          }
          if (!didWork && !signal.aborted) {
            try {
              await sleep(deps.config.pollIntervalMs, signal);
            } catch {
              break;
            }
          }
        } catch (error) {
          const summary =
            error instanceof Error ? error.message.slice(0, 240) : "loop_error";
          publish({
            lastLoopErrorAt: new Date().toISOString(),
            lastLoopErrorSummary: summary,
          });
          log("relay.worker.loop_error", { summary });
          if (!signal.aborted) {
            try {
              await sleep(deps.config.pollIntervalMs, signal);
            } catch {
              break;
            }
          }
        }
      }

      publish({
        processState: "shutting_down",
        ready: false,
        shuttingDown: true,
      });
      log("relay.worker.shutdown_requested", {
        workerId: deps.config.workerId,
      });

      const deadline = Date.now() + deps.config.shutdownTimeoutMs;
      while (status.inFlightCount > 0 && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 25));
      }

      publish({ processState: "stopped", shuttingDown: false, ready: false });
      log("relay.worker.shutdown_completed", {
        workerId: deps.config.workerId,
        inFlightCount: status.inFlightCount,
      });
    },
  };
};
