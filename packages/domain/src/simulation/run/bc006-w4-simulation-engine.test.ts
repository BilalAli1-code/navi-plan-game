/**
 * BC-006 Workstream 4 — schedule lifecycle, chapter gates, crises, ordering.
 */

import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asChapterId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionRecordId,
  asDocumentId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  buildInitialProjectMetricsFromPackage,
  compareSchedulesForApplication,
  createDocumentRuntime,
  createInitialSimulationState,
  createNorthstarConnectedCarePackage,
  createScaffoldDecisionDefinition,
  createScheduledEventInstruction,
  evaluateSimulationEngine,
  hasBlockingCrisis,
  mapBusinessCasePackageToRuntimeDecisions,
  markScheduleCancelled,
  markScheduleEligible,
  markScheduleExpired,
  markScheduleSuperseded,
  parseSimulationState,
  processCompleteChapter,
  processSubmitDecision,
  rehydrateScheduledEventInstruction,
  serializeSimulationState,
  SUPPORTED_RESOLVER_VERSION,
  type ScheduledEventInstruction,
  type SimulationRun,
  type SimulationState,
} from "../../index";

const tenantId = asTenantId("tenant_w4");
const cpv = asContentPackageVersionId("cpv:northstar-connected-care:1.0.0");
const now = asIsoTimestamp("2026-07-28T15:00:00.000Z");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_w4"),
  tenantId,
  learnerId: asLearnerId("learner_w4"),
  businessCaseId: asBusinessCaseId("northstar-connected-care"),
  contentPackageVersionId: cpv,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 1,
  currentChapterId: asChapterId("chapter-01"),
  currentDayId: null,
  experienceLevel: "practitioner",
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

const withEvidenceDocuments = (
  state: SimulationState,
  pkg: ReturnType<typeof createNorthstarConnectedCarePackage>,
  definitionIds: readonly string[],
): SimulationState => {
  const projectMetrics = {
    ...buildInitialProjectMetricsFromPackage(pkg),
    ...state.projectMetrics,
  };
  const existing = new Set(
    state.documents.map((document) => document.documentDefinitionId),
  );
  const toAdd = [
    ...new Set(definitionIds.filter((id) => !existing.has(id as never))),
  ];
  const documents = [
    ...state.documents,
    ...toAdd.map((documentDefinitionId, index) => {
      const created = createDocumentRuntime({
        documentId: asDocumentId(documentDefinitionId),
        documentDefinitionId: asDocumentId(documentDefinitionId),
        creationSequence: state.documents.length + index + 1,
        content: {
          title: documentDefinitionId,
          category: "evidence",
          description: documentDefinitionId,
          contentType: "plain_text",
          body: documentDefinitionId,
        },
        createdAt: now,
        originatingCommandId: asCommandId(`cmd_doc_w4_${index}`),
      });
      if (!created.ok) {
        throw new Error(created.error.message);
      }
      return created.value;
    }),
  ];
  return { ...state, projectMetrics, documents };
};

describe("BC-006 W4 schedule lifecycle", () => {
  it("advances pending → eligible → applied exactly once and preserves reload", () => {
    const base = createScheduledEventInstruction({
      id: "sched_w4_1" as never,
      tenantId,
      simulationRunId: asSimulationRunId("run_w4"),
      contentPackageVersionId: cpv,
      originDecisionRecordId: asDecisionRecordId("record_source"),
      originConsequenceId: "cons_source" as never,
      consequenceDefinitionId: "def_metric" as never,
      dueAt: now,
      delayMs: 86_400_000,
      reasonCode: "W4_TEST",
      createdAt: now,
      resolverVersion: SUPPORTED_RESOLVER_VERSION,
      sourceDecisionId: "decision.define-objective",
      sourceChapterId: "chapter-01",
      targetChapterId: null,
      deferredEffectKind: "change_project_metric",
      deferredEffectPayload: JSON.stringify({
        kind: "change_project_metric",
        metricKey: "schedule_pressure",
        delta: 3,
      }),
      triggerType: "chapter_exit",
      priority: 10,
    });
    expect(base.ok).toBe(true);
    if (!base.ok) {
      return;
    }

    const run = activeRun({
      state: {
        ...createInitialSimulationState(),
        projectMetrics: buildInitialProjectMetricsFromPackage(
          createNorthstarConnectedCarePackage(),
        ),
        scheduledEvents: [base.value],
      },
    });

    const evaluated = evaluateSimulationEngine({
      run,
      boundary: { kind: "chapter_exit", chapterId: asChapterId("chapter-01") },
      occurredAt: now,
    });
    expect(evaluated.ok).toBe(true);
    if (!evaluated.ok) {
      return;
    }
    expect(evaluated.value.becameEligibleIds).toEqual(["sched_w4_1"]);
    expect(evaluated.value.appliedScheduleIds).toEqual(["sched_w4_1"]);
    expect(evaluated.value.state.scheduledEvents[0]?.status).toBe("applied");
    expect(evaluated.value.state.projectMetrics.schedule_pressure?.value).toBe(
      53,
    );

    const again = evaluateSimulationEngine({
      run: { ...run, state: evaluated.value.state },
      boundary: { kind: "chapter_exit", chapterId: asChapterId("chapter-01") },
      occurredAt: now,
    });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.value.appliedScheduleIds).toEqual([]);
    expect(again.value.state.projectMetrics.schedule_pressure?.value).toBe(53);

    // Orphan test schedules lack Decision/Consequence referents; rehydrate the
    // schedule instruction directly and prove schema-8 status round-trip.
    const serialized = serializeSimulationState(evaluated.value.state);
    expect(serialized.schemaVersion).toBe(8);
    expect(serialized.scheduledEvents).toHaveLength(1);
    const rehydratedSchedule = rehydrateScheduledEventInstruction(
      (serialized.scheduledEvents as unknown[])[0],
    );
    expect(rehydratedSchedule.ok).toBe(true);
    if (rehydratedSchedule.ok) {
      expect(rehydratedSchedule.value.status).toBe("applied");
      expect(rehydratedSchedule.value.deferredEffectKind).toBe(
        "change_project_metric",
      );
    }
  });

  it("supports cancel, supersede, and expire without rewriting applied history", () => {
    const make = (id: string, status: ScheduledEventInstruction["status"]) => {
      const created = createScheduledEventInstruction({
        id: id as never,
        tenantId,
        simulationRunId: asSimulationRunId("run_w4"),
        contentPackageVersionId: cpv,
        originDecisionRecordId: asDecisionRecordId("record_source"),
        originConsequenceId: "cons_source" as never,
        consequenceDefinitionId: `def_${id}` as never,
        dueAt: now,
        delayMs: 1,
        reasonCode: "W4_TERM",
        createdAt: now,
        resolverVersion: SUPPORTED_RESOLVER_VERSION,
        status,
        deferredEffectKind: "set_case_flag",
        deferredEffectPayload: JSON.stringify({
          kind: "set_case_flag",
          flag: "flag.test",
          value: true,
        }),
      });
      if (!created.ok) {
        throw new Error(created.error.message);
      }
      return created.value;
    };

    const pending = make("sched_cancel", "pending");
    const cancelled = markScheduleCancelled(pending, "recovery_completed");
    expect(cancelled.ok).toBe(true);
    expect(cancelled.ok && cancelled.value.status).toBe("cancelled");

    const eligible = markScheduleEligible(make("sched_super", "pending"), 2);
    expect(eligible.ok).toBe(true);
    if (!eligible.ok) {
      return;
    }
    const superseded = markScheduleSuperseded(
      eligible.value,
      "sched_replacement",
      "branch_replaced",
    );
    expect(superseded.ok).toBe(true);
    expect(superseded.ok && superseded.value.supersededById).toBe(
      "sched_replacement",
    );

    const expired = markScheduleExpired(
      make("sched_expire", "scheduled"),
      "chapter_boundary_passed",
    );
    expect(expired.ok).toBe(true);
    expect(expired.ok && expired.value.status).toBe("expired");

    const applied = make("sched_applied", "applied");
    const cannotCancel = markScheduleCancelled(applied, "nope");
    expect(cannotCancel.ok).toBe(false);
  });

  it("orders eligible schedules by category, priority, then id", () => {
    const mk = (
      id: string,
      category: ScheduledEventInstruction["orderCategory"],
      priority: number,
    ) => {
      const created = createScheduledEventInstruction({
        id: id as never,
        tenantId,
        simulationRunId: asSimulationRunId("run_w4"),
        contentPackageVersionId: cpv,
        originDecisionRecordId: asDecisionRecordId("record_source"),
        originConsequenceId: "cons_source" as never,
        consequenceDefinitionId: `def_${id}` as never,
        dueAt: now,
        delayMs: 1,
        reasonCode: "ORDER",
        createdAt: now,
        resolverVersion: SUPPORTED_RESOLVER_VERSION,
        orderCategory: category,
        priority,
      });
      if (!created.ok) {
        throw new Error(created.error.message);
      }
      return created.value;
    };
    const schedules = [
      mk("c", "stakeholder", 1),
      mk("a", "safety_compliance", 50),
      mk("b", "metric", 1),
      mk("d", "safety_compliance", 1),
    ].sort(compareSchedulesForApplication);
    expect(schedules.map((entry) => entry.id)).toEqual(["d", "a", "b", "c"]);
  });
});

describe("BC-006 W4 crisis and chapter progression", () => {
  const pkg = createNorthstarConnectedCarePackage();
  const runtime = mapBusinessCasePackageToRuntimeDecisions(pkg, cpv);

  const submitMappedDecision = (
    run: SimulationRun,
    decisionId: string,
    optionIndex = 0,
  ) => {
    const definition = runtime.find((entry) => entry.id === decisionId);
    if (!definition) {
      throw new Error(`missing ${decisionId}`);
    }
    const option = definition.options[optionIndex]!;
    let eventCounter = 0;
    return processSubmitDecision(run, {
      decisionRecordId: asDecisionRecordId(`record:${decisionId}`),
      decisionDefinitionId: asDecisionId(decisionId),
      selectedOptionId: option.id,
      definition,
      sourceActionId: asActionRecordId(`action:${decisionId}`),
      submittedBy: asActorId("actor_w4"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId(`evt_submit:${decisionId}`),
      correlationId: asCorrelationId(`corr:${decisionId}`),
      causationId: null,
      allocateEventId: () => asEventId(`evt_alloc_w4_${(eventCounter += 1)}`),
      crises: pkg.crises,
    });
  };

  it("triggers chapter-04 crisis once on chapter entry and blocks completion until resolved", () => {
    const crisis = pkg.crises.find((entry) => entry.id.includes("chapter-04"));
    expect(crisis).toBeDefined();

    let run = activeRun({
      currentChapterId: asChapterId("chapter-03"),
      state: createInitialSimulationState(),
    });

    const entry = evaluateSimulationEngine({
      run: {
        ...run,
        currentChapterId: asChapterId("chapter-04"),
      },
      boundary: {
        kind: "chapter_entry",
        chapterId: asChapterId("chapter-04"),
      },
      occurredAt: now,
      crises: pkg.crises,
    });
    expect(entry.ok).toBe(true);
    if (!entry.ok) {
      return;
    }
    expect(entry.value.triggeredCrisisIds.some((id) => id.includes("04"))).toBe(
      true,
    );
    expect(
      hasBlockingCrisis(entry.value.state, asChapterId("chapter-04")),
    ).toBe(true);

    const again = evaluateSimulationEngine({
      run: {
        ...run,
        currentChapterId: asChapterId("chapter-04"),
        state: entry.value.state,
      },
      boundary: {
        kind: "chapter_entry",
        chapterId: asChapterId("chapter-04"),
      },
      occurredAt: now,
      crises: pkg.crises,
    });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.value.triggeredCrisisIds).toEqual([]);

    run = {
      ...run,
      currentChapterId: asChapterId("chapter-04"),
      state: entry.value.state,
    };

    const blocked = processCompleteChapter(run, {
      chapterId: asChapterId("chapter-04"),
      nextChapterId: asChapterId("chapter-05"),
      requiredDecisionIds: [],
      requiredActivityIds: [],
      requiredMeetingIds: [],
      crises: pkg.crises,
      commandId: asCommandId("cmd_complete_ch4_blocked"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_w4"),
      correlationId: asCorrelationId("corr_ch4_blocked"),
      causationId: null,
      eventId: asEventId("evt_ch4_blocked"),
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.details?.codeHint).toBe("CRISIS_BLOCKING");
    }
  });

  it("applies delayed governance schedules on chapter exit through CompleteChapter", () => {
    const governance = runtime.find(
      (entry) => entry.id === "decision.establish-governance",
    )!;
    let run = activeRun({
      state: withEvidenceDocuments(createInitialSimulationState(), pkg, []),
    });

    for (const prerequisiteId of governance.prerequisiteDecisionIds) {
      const prereq = runtime.find((entry) => entry.id === prerequisiteId)!;
      run = {
        ...run,
        state: withEvidenceDocuments(
          run.state,
          pkg,
          prereq.requiredEvidenceDocumentIds.map(String),
        ),
      };
      const submitted = submitMappedDecision(run, prerequisiteId);
      expect(submitted.ok).toBe(true);
      if (!submitted.ok) {
        throw new Error(submitted.error.message);
      }
      run = submitted.value.run;
    }

    run = {
      ...run,
      state: withEvidenceDocuments(
        run.state,
        pkg,
        governance.requiredEvidenceDocumentIds.map(String),
      ),
    };
    const gov = submitMappedDecision(run, "decision.establish-governance", 1);
    expect(gov.ok).toBe(true);
    if (!gov.ok) {
      throw new Error(gov.error.message);
    }
    run = gov.value.run;
    const pendingBefore = run.state.scheduledEvents.filter(
      (schedule) =>
        schedule.status === "pending" || schedule.status === "scheduled",
    ).length;
    expect(pendingBefore).toBeGreaterThan(0);

    // Satisfy chapter completion requirements for chapter-01.
    const chapter = pkg.chapters.find((entry) => entry.id === "chapter-01")!;
    const completed = processCompleteChapter(run, {
      chapterId: asChapterId("chapter-01"),
      nextChapterId: asChapterId("chapter-02"),
      requiredDecisionIds: chapter.requiredDecisionIds,
      requiredActivityIds: [],
      requiredMeetingIds: [],
      completionWhen: { kind: "always" },
      crises: pkg.crises,
      commandId: asCommandId("cmd_complete_ch1"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_w4"),
      correlationId: asCorrelationId("corr_ch1"),
      causationId: null,
      eventId: asEventId("evt_ch1"),
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      throw new Error(completed.error.message);
    }
    expect(completed.value.run.currentChapterId).toBe("chapter-02");
    const appliedAfter = completed.value.run.state.scheduledEvents.filter(
      (schedule) => schedule.status === "applied",
    );
    expect(appliedAfter.length).toBeGreaterThan(0);

    const reloaded = parseSimulationState(
      serializeSimulationState(completed.value.run.state),
    );
    expect(reloaded?.scheduledEvents.some((s) => s.status === "applied")).toBe(
      true,
    );
  });

  it("keeps scaffold decision lifecycle green with engine no-op", () => {
    const definition = createScaffoldDecisionDefinition({
      contentPackageVersionId: cpv,
    });
    let eventCounter = 0;
    const result = processSubmitDecision(
      activeRun({ currentChapterId: null }),
      {
        decisionRecordId: asDecisionRecordId("record_scaffold_w4"),
        decisionDefinitionId: definition.id,
        selectedOptionId: definition.options[1]!.id,
        definition,
        sourceActionId: asActionRecordId("action_scaffold_w4"),
        submittedBy: asActorId("actor_w4"),
        submittedAt: now,
        recordedAt: now,
        eventId: asEventId("evt_scaffold_w4"),
        correlationId: asCorrelationId("corr_scaffold_w4"),
        causationId: null,
        allocateEventId: () => asEventId(`evt_sc_${(eventCounter += 1)}`),
      },
    );
    expect(result.ok).toBe(true);
  });
});
