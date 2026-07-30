import { describe, expect, it, vi } from "vitest";
import {
  createRelayWorkerLoop,
  validateRelayWorkerConfig,
} from "./relay-worker-loop";

describe("relay worker loop", () => {
  it("rejects invalid configuration", () => {
    expect(() => validateRelayWorkerConfig({ batchSize: 0 })).toThrow(
      /RELAY_BATCH_SIZE/,
    );
  });

  it("stops claiming after abort and reaches stopped state", async () => {
    const controller = new AbortController();
    const tickOutbox = vi.fn(async () => ({
      claimed: 0,
      published: 0,
      failed: 0,
      dead: 0,
    }));
    const processTargets = vi.fn(async () => ({ claimed: 0 }));
    const statuses: string[] = [];
    const loop = createRelayWorkerLoop({
      config: validateRelayWorkerConfig({
        pollIntervalMs: 50,
        batchSize: 10,
        concurrency: 1,
        shutdownTimeoutMs: 200,
        workerId: "test",
      }),
      discoverTenants: async () => {
        controller.abort();
        return ["tenant_a"];
      },
      createTenantTick: async (tenantId) => ({
        tenantId,
        tickOutbox,
        processTargets,
      }),
      sleep: async () => undefined,
      onStatus: (status) => statuses.push(status.processState),
    });

    await loop.run(controller.signal);
    expect(statuses).toContain("ready");
    expect(statuses.at(-1)).toBe("stopped");
    expect(loop.getStatus().ready).toBe(false);
  });

  it("continues after a tenant tick error", async () => {
    let polls = 0;
    const controller = new AbortController();
    const loop = createRelayWorkerLoop({
      config: validateRelayWorkerConfig({
        pollIntervalMs: 50,
        batchSize: 10,
        concurrency: 1,
        shutdownTimeoutMs: 100,
        workerId: "test",
      }),
      discoverTenants: async () => {
        polls += 1;
        if (polls >= 2) controller.abort();
        return ["tenant_a"];
      },
      createTenantTick: async () => {
        throw new Error("db down");
      },
      sleep: async (_ms, signal) => {
        if (signal.aborted) throw new Error("aborted");
      },
    });
    await loop.run(controller.signal);
    expect(loop.getStatus().lastLoopErrorSummary).toContain("db down");
  });
});
