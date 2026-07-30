import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  concurrencyError,
  err,
  ok,
  type SimulationDomainEvent,
  type SimulationRun,
  type TenantId,
} from "@projectsim/domain";
import type { Clock, IdentifierGenerator } from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";
import {
  createSimulationRunLifecycleService,
  type SimulationRunLifecycleAuthorizer,
} from "./simulation-run-lifecycle-service";

const tenantId = asTenantId("tenant_1");

const clock: Clock = {
  now: () => asIsoTimestamp("2026-07-25T12:00:00.000Z"),
};

const identifiers: IdentifierGenerator = {
  nextEventId: () => asEventId("evt_1"),
  nextActionRecordId: () => asActionRecordId("action_1"),
  nextSimulationRunId: () => asSimulationRunId("run_generated"),
  nextDecisionRecordId: () => asDecisionRecordId("decision_record_1"),
};

const permitAll: SimulationRunLifecycleAuthorizer = {
  authorize: async () => ok(undefined),
};

const createRepo = (): SimulationRunRepository & {
  readonly events: SimulationDomainEvent[];
} => {
  const runs = new Map<string, SimulationRun>();
  const events: SimulationDomainEvent[] = [];
  return {
    get events() {
      return events;
    },
    async getById(tid: TenantId, id) {
      return runs.get(`${tid}:${id}`) ?? null;
    },
    async save(tid, run, expected, pending) {
      const key = `${tid}:${run.id}`;
      const existing = runs.get(key);
      if (expected === null) {
        if (existing) {
          return err(concurrencyError(0, existing.aggregateVersion));
        }
      } else if (!existing || existing.aggregateVersion !== expected) {
        return err(concurrencyError(expected, existing?.aggregateVersion ?? 0));
      }
      runs.set(key, run);
      events.push(...pending);
      return ok(undefined);
    },
  };
};

describe("SimulationRunLifecycleService", () => {
  it("creates, starts, pauses, and resumes a run", async () => {
    const repository = createRepo();
    const service = createSimulationRunLifecycleService({
      tenantId,
      repository,
      clock,
      identifiers,
      authorizer: permitAll,
    });

    const created = await service.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId: asContentPackageVersionId("cpv_1"),
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.value.run.status).toBe("created");
    expect(repository.events[0]?.eventType).toBe("SimulationRunCreated");

    const started = await service.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: 1,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.value.run.status).toBe("active");

    const paused = await service.pause({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: 2,
    });
    expect(paused.ok).toBe(true);

    const resumed = await service.resume({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: 3,
    });
    expect(resumed.ok).toBe(true);
    if (!resumed.ok) {
      return;
    }
    expect(resumed.value.run.status).toBe("active");
  });

  it("rejects stale expected versions", async () => {
    const repository = createRepo();
    const service = createSimulationRunLifecycleService({
      tenantId,
      repository,
      clock,
      identifiers,
      authorizer: permitAll,
    });
    await service.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId: asContentPackageVersionId("cpv_1"),
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });

    const started = await service.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: 99,
    });
    expect(started.ok).toBe(false);
    if (!started.ok) {
      expect(started.error.kind).toBe("concurrency");
    }
  });

  it("denies lifecycle mutations when authorizer rejects", async () => {
    const repository = createRepo();
    const deny: SimulationRunLifecycleAuthorizer = {
      authorize: async () =>
        err({
          kind: "authorization",
          code: "PERMISSION_DENIED",
          retryable: false,
          message: "denied",
        }),
    };
    const service = createSimulationRunLifecycleService({
      tenantId,
      repository,
      clock,
      identifiers,
      authorizer: deny,
    });

    const created = await service.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId: asContentPackageVersionId("cpv_1"),
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    expect(created.ok).toBe(false);
    if (!created.ok) {
      expect(created.error.code).toBe("PERMISSION_DENIED");
    }
    expect(repository.events).toHaveLength(0);
  });
});
