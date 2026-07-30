import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asEventId,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  asIsoTimestamp,
} from "../../shared-kernel";
import {
  archiveSimulationRun,
  assertContentPackageVersionUnchanged,
  canAcceptLearnerActions,
  completeSimulationRun,
  createSimulationRun,
  pauseSimulationRun,
  recordAcceptedLearnerAction,
  recordSimulationRunFailure,
  recoverSimulationRun,
  rehydrateSimulationRun,
  resumeSimulationRun,
  serializeSimulationState,
  startSimulationRun,
  type SimulationRun,
} from "./index";

const baseIds = {
  id: asSimulationRunId("run_1"),
  tenantId: asTenantId("tenant_1"),
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId: asContentPackageVersionId("cpv_1"),
  runtimeVersion: "runtime-1.0.0",
  createdAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  eventId: asEventId("evt_create"),
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
};

const ctx = (eventId: string, at = "2026-07-25T00:01:00.000Z") => ({
  occurredAt: asIsoTimestamp(at),
  recordedAt: asIsoTimestamp(at),
  eventId: asEventId(eventId),
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
});

const createdRun = (): SimulationRun => {
  const result = createSimulationRun(baseIds);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("create failed");
  }
  return result.value.run;
};

describe("SimulationRun aggregate", () => {
  it("creates a run in created status with version 1 and a Created event", () => {
    const result = createSimulationRun(baseIds);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.run.status).toBe("created");
    expect(result.value.run.aggregateVersion).toBe(1);
    expect(result.value.run.lastProcessedSequence).toBe(0);
    expect(result.value.events).toHaveLength(1);
    expect(result.value.events[0]?.eventType).toBe("SimulationRunCreated");
  });

  it("rehydrates without advancing version or emitting events", () => {
    const run = createdRun();
    const rehydrated = rehydrateSimulationRun({
      ...run,
      status: run.status,
      state: serializeSimulationState(run.state),
    });
    expect(rehydrated.ok).toBe(true);
    if (!rehydrated.ok) {
      return;
    }
    expect(rehydrated.value.aggregateVersion).toBe(run.aggregateVersion);
    expect(rehydrated.value.lastProcessedSequence).toBe(
      run.lastProcessedSequence,
    );
    expect(rehydrated.value).toEqual(run);
  });

  it("rejects rehydration of unknown status and malformed state", () => {
    const run = createdRun();
    expect(
      rehydrateSimulationRun({
        ...run,
        status: "bogus",
        state: serializeSimulationState(run.state),
      }).ok,
    ).toBe(false);
    expect(
      rehydrateSimulationRun({
        ...run,
        status: "created",
        state: { schemaVersion: 99 },
      }).ok,
    ).toBe(false);
  });

  it("rehydrates cancelled status without a cancel transition API", () => {
    const run = createdRun();
    const cancelled = rehydrateSimulationRun({
      ...run,
      status: "cancelled",
      state: serializeSimulationState(run.state),
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) {
      return;
    }
    expect(cancelled.value.status).toBe("cancelled");
    expect(canAcceptLearnerActions(cancelled.value)).toBe(false);
  });

  it("supports the approved happy-path lifecycle", () => {
    let run = createdRun();
    const started = startSimulationRun(run, ctx("evt_start"));
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    run = started.value.run;
    expect(run.status).toBe("active");
    expect(run.aggregateVersion).toBe(2);
    expect(run.lastProcessedSequence).toBe(0);

    const paused = pauseSimulationRun(run, ctx("evt_pause"));
    expect(paused.ok).toBe(true);
    if (!paused.ok) {
      return;
    }
    run = paused.value.run;

    const resumed = resumeSimulationRun(run, ctx("evt_resume"));
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) {
      return;
    }
    run = resumed.value.run;

    const completed = completeSimulationRun(run, ctx("evt_complete"));
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    run = completed.value.run;
    expect(run.status).toBe("completed");

    const archived = archiveSimulationRun(run, ctx("evt_archive"));
    expect(archived.ok).toBe(true);
    if (!archived.ok) {
      return;
    }
    expect(archived.value.run.status).toBe("archived");
    expect(archived.value.events[0]?.eventType).toBe("SimulationRunArchived");
  });

  it("allows administrative complete from paused", () => {
    const started = startSimulationRun(createdRun(), ctx("s2"));
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    const paused = pauseSimulationRun(started.value.run, ctx("p"));
    expect(paused.ok).toBe(true);
    if (!paused.ok) {
      return;
    }
    const completed = completeSimulationRun(paused.value.run, ctx("c"));
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(completed.value.run.status).toBe("completed");
  });

  it("supports failure and recovery", () => {
    const started = startSimulationRun(createdRun(), ctx("s"));
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    const failed = recordSimulationRunFailure(started.value.run, ctx("f"));
    expect(failed.ok).toBe(true);
    if (!failed.ok) {
      return;
    }
    expect(failed.value.run.status).toBe("failed");
    const recovered = recoverSimulationRun(failed.value.run, ctx("r"));
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) {
      return;
    }
    expect(recovered.value.run.status).toBe("active");
  });

  it("rejects invalid transitions without mutating state", () => {
    const run = createdRun();
    const before = { ...run };
    const paused = pauseSimulationRun(run, ctx("bad"));
    expect(paused.ok).toBe(false);
    expect(run).toEqual(before);
  });

  it("rejects learner actions unless active; advances sequence when active", () => {
    const created = createdRun();
    expect(recordAcceptedLearnerAction(created, ctx("a").occurredAt).ok).toBe(
      false,
    );

    const started = startSimulationRun(created, ctx("s"));
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    const advanced = recordAcceptedLearnerAction(
      started.value.run,
      ctx("a2").occurredAt,
    );
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) {
      return;
    }
    expect(advanced.value.aggregateVersion).toBe(3);
    expect(advanced.value.lastProcessedSequence).toBe(1);
  });

  it("keeps content package version immutable", () => {
    const run = createdRun();
    expect(
      assertContentPackageVersionUnchanged(
        run,
        asContentPackageVersionId("other"),
      ).ok,
    ).toBe(false);
    expect(
      assertContentPackageVersionUnchanged(run, run.contentPackageVersionId).ok,
    ).toBe(true);
  });

  it("round-trips authoritative state through serialize/parse", () => {
    const run = createdRun();
    const rehydrated = rehydrateSimulationRun({
      ...run,
      status: run.status,
      state: serializeSimulationState(run.state),
    });
    expect(rehydrated.ok).toBe(true);
    if (!rehydrated.ok) {
      return;
    }
    expect(rehydrated.value.state).toEqual(run.state);
  });
});
