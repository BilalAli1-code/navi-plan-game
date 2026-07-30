import { describe, expect, it, vi } from "vitest";
import {
  asEventId,
  asSimulationRunId,
  asTenantId,
  type SimulationDomainEvent,
} from "@projectsim/domain";
import type { ProjectionProcessingTargetRepository } from "./projection-processing-target";
import { createProjectionTargetProcessor } from "./projection-target-processor";
import { DEFAULT_RELAY_RETRY_POLICY } from "./relay-retry-policy";
import type { WorkplaceProjectionRegistry } from "./workplace-projection-registry";

const createTargets = (
  tenantId: string,
): ProjectionProcessingTargetRepository => {
  type Row = {
    eventId: string;
    projectionType: string;
    simulationRunId: string;
    eventType: string;
    status: "pending" | "claimed" | "succeeded" | "retrying" | "exhausted";
    attemptCount: number;
    nextAttemptAt: string;
    lastErrorClassification: string | null;
    lastErrorSummary: string | null;
  };
  const rows = new Map<string, Row>();
  const key = (e: string, p: string) => `${e}:${p}`;
  return {
    async materializeTargets(targets) {
      for (const t of targets) {
        const k = key(t.eventId, t.projectionType);
        if (rows.has(k)) continue;
        rows.set(k, {
          eventId: t.eventId,
          projectionType: t.projectionType,
          simulationRunId: t.simulationRunId,
          eventType: t.eventType,
          status: "pending",
          attemptCount: 0,
          nextAttemptAt: new Date(0).toISOString(),
          lastErrorClassification: null,
          lastErrorSummary: null,
        });
      }
    },
    async getTarget(eventId, projectionType) {
      const row = rows.get(key(eventId, projectionType));
      if (!row) return null;
      return {
        tenantId,
        eventId: row.eventId,
        projectionType: row.projectionType as never,
        simulationRunId: row.simulationRunId,
        eventType: row.eventType,
        status: row.status,
        attemptCount: row.attemptCount,
        nextAttemptAt: row.nextAttemptAt,
        claimedBy: null,
        claimedAt: null,
        claimExpiresAt: null,
        completedAt: row.status === "succeeded" ? row.nextAttemptAt : null,
        exhaustedAt: row.status === "exhausted" ? row.nextAttemptAt : null,
        lastErrorClassification: row.lastErrorClassification as never,
        lastErrorSummary: row.lastErrorSummary,
        createdAt: row.nextAttemptAt,
        updatedAt: row.nextAttemptAt,
      };
    },
    async listFailedTargets() {
      return [];
    },
    async claimTargets() {
      return [];
    },
    async markSucceeded(input) {
      const row = rows.get(key(input.eventId, input.projectionType));
      if (!row) return;
      row.status = "succeeded";
      row.attemptCount = input.attemptCount;
    },
    async markFailed(input) {
      const row = rows.get(key(input.eventId, input.projectionType));
      if (!row) return;
      row.status = input.exhausted ? "exhausted" : "retrying";
      row.attemptCount = input.attemptCount;
      row.lastErrorClassification = input.classification;
      row.lastErrorSummary = input.summary;
      row.nextAttemptAt =
        input.nextAttemptAt?.toISOString() ?? new Date().toISOString();
    },
    async manualRetry() {
      return { ok: false, priorStatus: null };
    },
    async allTargetsSucceeded(eventId) {
      const forEvent = [...rows.values()].filter((r) => r.eventId === eventId);
      return (
        forEvent.length > 0 && forEvent.every((r) => r.status === "succeeded")
      );
    },
    async queueSummary() {
      return {
        pending: 0,
        claimed: 0,
        retrying: 0,
        exhausted: 0,
        succeeded: 0,
        oldestPendingAt: null,
      };
    },
    async countByStatusForRun() {
      return {
        pending: 0,
        claimed: 0,
        retrying: 0,
        exhausted: 0,
        succeeded: 0,
        oldestPendingAt: null,
      };
    },
  };
};

describe("projection target processor", () => {
  it("fans out independently and preserves success when another target fails", async () => {
    const targets = createTargets("tenant_1");
    const registry: WorkplaceProjectionRegistry = {
      registeredTypes: ["inbox", "meetings"],
      handlerFor(type) {
        if (type === "inbox") {
          return {
            projectionType: "inbox",
            rebuild: async () => ({ ok: true }),
          };
        }
        if (type === "meetings") {
          return {
            projectionType: "meetings",
            rebuild: async () => ({ ok: false }),
          };
        }
        return undefined;
      },
      projectionTypesForEvent(eventType) {
        return eventType === "LearnerMessageDelivered"
          ? ["inbox", "meetings"]
          : [];
      },
    };

    const processor = createProjectionTargetProcessor({
      tenantId: asTenantId("tenant_1"),
      registry,
      targets,
      policy: { ...DEFAULT_RELAY_RETRY_POLICY, maxAttempts: 2, jitterRatio: 0 },
      now: () => new Date("2026-07-26T00:00:00.000Z"),
      random: () => 0,
      workerId: "test-worker",
    });

    const event = {
      eventId: asEventId("evt_1"),
      eventType: "LearnerMessageDelivered",
      tenantId: asTenantId("tenant_1"),
      simulationRunId: asSimulationRunId("run_1"),
    } as unknown as SimulationDomainEvent;

    const outcome = await processor.handleEvent(event);
    expect(outcome.materialized).toBe(2);
    expect(outcome.eventFullySucceeded).toBe(false);
    expect(outcome.results.map((r) => r.outcome)).toEqual([
      "succeeded",
      "retrying",
    ]);

    const inbox = await targets.getTarget("evt_1", "inbox");
    const meetings = await targets.getTarget("evt_1", "meetings");
    expect(inbox?.status).toBe("succeeded");
    expect(meetings?.status).toBe("retrying");
  });

  it("exhausts missing registrations without crashing the batch", async () => {
    const targets = createTargets("tenant_1");
    const registry: WorkplaceProjectionRegistry = {
      registeredTypes: [],
      handlerFor: () => undefined,
      projectionTypesForEvent: () => ["inbox"],
    };
    const processor = createProjectionTargetProcessor({
      tenantId: asTenantId("tenant_1"),
      registry,
      targets,
      policy: DEFAULT_RELAY_RETRY_POLICY,
      now: () => new Date("2026-07-26T00:00:00.000Z"),
      workerId: "test-worker",
    });
    const event = {
      eventId: asEventId("evt_2"),
      eventType: "LearnerMessageDelivered",
      tenantId: asTenantId("tenant_1"),
      simulationRunId: asSimulationRunId("run_1"),
    } as unknown as SimulationDomainEvent;
    const outcome = await processor.handleEvent(event);
    expect(outcome.results[0]?.outcome).toBe("exhausted");
    expect(outcome.results[0]?.classification).toBe("missing_registration");
  });

  it("does not reprocess already succeeded targets on redelivery", async () => {
    const targets = createTargets("tenant_1");
    const rebuild = vi.fn(async () => ({ ok: true }));
    const registry: WorkplaceProjectionRegistry = {
      registeredTypes: ["inbox"],
      handlerFor: () => ({ projectionType: "inbox", rebuild }),
      projectionTypesForEvent: () => ["inbox"],
    };
    const processor = createProjectionTargetProcessor({
      tenantId: asTenantId("tenant_1"),
      registry,
      targets,
      policy: DEFAULT_RELAY_RETRY_POLICY,
      now: () => new Date("2026-07-26T00:00:00.000Z"),
      workerId: "test-worker",
    });
    const event = {
      eventId: asEventId("evt_3"),
      eventType: "LearnerMessageDelivered",
      tenantId: asTenantId("tenant_1"),
      simulationRunId: asSimulationRunId("run_1"),
    } as unknown as SimulationDomainEvent;
    await processor.handleEvent(event);
    await processor.handleEvent(event);
    expect(rebuild).toHaveBeenCalledTimes(1);
  });
});
