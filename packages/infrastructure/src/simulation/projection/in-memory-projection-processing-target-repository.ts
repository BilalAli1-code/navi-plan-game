import type {
  ProjectionProcessingTarget,
  ProjectionProcessingTargetRepository,
  ProjectionProcessingTargetStatus,
} from "@projectsim/application";
import { projectionProcessingTargetKey } from "@projectsim/application";

export const createInMemoryProjectionProcessingTargetRepository = (
  boundTenantId: string,
): ProjectionProcessingTargetRepository & {
  readonly rows: Map<string, ProjectionProcessingTarget>;
} => {
  const rows = new Map<string, ProjectionProcessingTarget>();

  const keyOf = (eventId: string, projectionType: string) =>
    projectionProcessingTargetKey({
      tenantId: boundTenantId,
      eventId,
      projectionType: projectionType as never,
    });

  return {
    rows,
    async materializeTargets(targets) {
      for (const target of targets) {
        const key = keyOf(target.eventId, target.projectionType);
        if (rows.has(key)) continue;
        const now = new Date().toISOString();
        rows.set(key, {
          tenantId: boundTenantId,
          eventId: target.eventId,
          projectionType: target.projectionType,
          simulationRunId: target.simulationRunId,
          eventType: target.eventType,
          status: "pending",
          attemptCount: 0,
          nextAttemptAt: now,
          claimedBy: null,
          claimedAt: null,
          claimExpiresAt: null,
          completedAt: null,
          exhaustedAt: null,
          lastErrorClassification: null,
          lastErrorSummary: null,
          createdAt: now,
          updatedAt: now,
        });
      }
    },
    async getTarget(eventId, projectionType) {
      return rows.get(keyOf(eventId, projectionType)) ?? null;
    },
    async listFailedTargets(input) {
      return [...rows.values()]
        .filter(
          (row) =>
            (row.status === "exhausted" || row.status === "retrying") &&
            (!input.simulationRunId ||
              row.simulationRunId === input.simulationRunId) &&
            (!input.projectionType ||
              row.projectionType === input.projectionType),
        )
        .sort((a, b) =>
          (b.exhaustedAt ?? b.updatedAt).localeCompare(
            a.exhaustedAt ?? a.updatedAt,
          ),
        )
        .slice(input.offset, input.offset + input.limit);
    },
    async claimTargets(input) {
      const nowIso = input.now.toISOString();
      const claimable = [...rows.values()]
        .filter((row) => {
          if (
            (row.status === "pending" || row.status === "retrying") &&
            row.nextAttemptAt <= nowIso
          ) {
            return true;
          }
          if (
            row.status === "claimed" &&
            row.claimExpiresAt &&
            row.claimExpiresAt <= nowIso
          ) {
            return true;
          }
          return false;
        })
        .sort((a, b) =>
          a.nextAttemptAt === b.nextAttemptAt
            ? a.eventId.localeCompare(b.eventId)
            : a.nextAttemptAt.localeCompare(b.nextAttemptAt),
        )
        .slice(0, input.batchSize);

      const claimed: ProjectionProcessingTarget[] = [];
      for (const row of claimable) {
        const updated: ProjectionProcessingTarget = {
          ...row,
          status: "claimed",
          claimedBy: input.workerId,
          claimedAt: nowIso,
          claimExpiresAt: new Date(
            input.now.getTime() + input.claimLeaseMs,
          ).toISOString(),
          updatedAt: nowIso,
        };
        rows.set(keyOf(row.eventId, row.projectionType), updated);
        claimed.push(updated);
      }
      return claimed;
    },
    async markSucceeded(input) {
      const key = keyOf(input.eventId, input.projectionType);
      const existing = rows.get(key);
      if (!existing) return;
      const nowIso = input.now.toISOString();
      rows.set(key, {
        ...existing,
        status: "succeeded",
        attemptCount: input.attemptCount,
        completedAt: nowIso,
        claimedBy: null,
        claimedAt: null,
        claimExpiresAt: null,
        lastErrorClassification: null,
        lastErrorSummary: null,
        updatedAt: nowIso,
      });
    },
    async markFailed(input) {
      const key = keyOf(input.eventId, input.projectionType);
      const existing = rows.get(key);
      if (!existing) return;
      const nowIso = input.now.toISOString();
      const status: ProjectionProcessingTargetStatus = input.exhausted
        ? "exhausted"
        : "retrying";
      rows.set(key, {
        ...existing,
        status,
        attemptCount: input.attemptCount,
        nextAttemptAt: input.nextAttemptAt
          ? input.nextAttemptAt.toISOString()
          : nowIso,
        exhaustedAt: input.exhausted ? nowIso : null,
        claimedBy: null,
        claimedAt: null,
        claimExpiresAt: null,
        lastErrorClassification: input.classification,
        lastErrorSummary: input.summary,
        updatedAt: nowIso,
      });
    },
    async manualRetry(input) {
      const key = keyOf(input.eventId, input.projectionType);
      const existing = rows.get(key);
      if (!existing) return { ok: false, priorStatus: null };
      if (existing.status !== "exhausted" && existing.status !== "retrying") {
        return { ok: false, priorStatus: existing.status };
      }
      const nowIso = input.now.toISOString();
      rows.set(key, {
        ...existing,
        status: "retrying",
        nextAttemptAt: nowIso,
        claimedBy: null,
        claimedAt: null,
        claimExpiresAt: null,
        exhaustedAt: null,
        updatedAt: nowIso,
      });
      return { ok: true, priorStatus: existing.status };
    },
    async allTargetsSucceeded(eventId) {
      const forEvent = [...rows.values()].filter(
        (row) => row.eventId === eventId,
      );
      if (forEvent.length === 0) return false;
      return forEvent.every((row) => row.status === "succeeded");
    },
    async queueSummary() {
      let pending = 0;
      let claimed = 0;
      let retrying = 0;
      let exhausted = 0;
      let succeeded = 0;
      let oldest: string | null = null;
      for (const row of rows.values()) {
        if (row.status === "pending") pending += 1;
        if (row.status === "claimed") claimed += 1;
        if (row.status === "retrying") retrying += 1;
        if (row.status === "exhausted") exhausted += 1;
        if (row.status === "succeeded") succeeded += 1;
        if (row.status === "pending" || row.status === "retrying") {
          if (oldest === null || row.nextAttemptAt < oldest) {
            oldest = row.nextAttemptAt;
          }
        }
      }
      return {
        pending,
        claimed,
        retrying,
        exhausted,
        succeeded,
        oldestPendingAt: oldest,
      };
    },
    async countByStatusForRun(input) {
      let pending = 0;
      let claimed = 0;
      let retrying = 0;
      let exhausted = 0;
      let succeeded = 0;
      for (const row of rows.values()) {
        if (row.simulationRunId !== input.simulationRunId) continue;
        if (
          input.projectionType &&
          row.projectionType !== input.projectionType
        ) {
          continue;
        }
        if (row.status === "pending") pending += 1;
        if (row.status === "claimed") claimed += 1;
        if (row.status === "retrying") retrying += 1;
        if (row.status === "exhausted") exhausted += 1;
        if (row.status === "succeeded") succeeded += 1;
      }
      return {
        pending,
        claimed,
        retrying,
        exhausted,
        succeeded,
        oldestPendingAt: null,
      };
    },
  };
};
