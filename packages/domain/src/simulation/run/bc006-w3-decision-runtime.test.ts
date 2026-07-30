/**
 * BC-006 Workstream 3 — decision eligibility, mapping, schedules, cross-chapter.
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
  buildDecisionEligibilityContext,
  buildInitialProjectMetricsFromPackage,
  createDocumentRuntime,
  createInitialSimulationState,
  createNorthstarConnectedCarePackage,
  createScaffoldDecisionDefinition,
  evaluateConditionExpression,
  always,
  isDecisionDefinitionAvailable,
  mapBusinessCasePackageToRuntimeDecisions,
  parseSimulationState,
  processSubmitDecision,
  serializeSimulationState,
  SUPPORTED_RESOLVER_VERSION,
  validateDecisionEligibility,
  type SimulationRun,
  type SimulationState,
} from "../../index";

const tenantId = asTenantId("tenant_w3");
const cpv = asContentPackageVersionId("cpv:northstar-connected-care:1.0.0");
const now = asIsoTimestamp("2026-07-28T12:00:00.000Z");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_w3"),
  tenantId,
  learnerId: asLearnerId("learner_w3"),
  businessCaseId: asBusinessCaseId("northstar-connected-care"),
  contentPackageVersionId: cpv,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 0,
  currentChapterId: asChapterId("chapter-01"),
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

describe("BC-006 W3 condition evaluation", () => {
  it("evaluates allowlisted condition kinds deterministically", () => {
    const facts = {
      completedChapterIds: new Set(["chapter-01"]),
      currentChapterId: "chapter-02",
      initiallyUnlockedChapterIds: new Set(["chapter-01"]),
      submittedDecisionIds: new Set(["decision.define-objective"]),
      resolvedDecisionIds: new Set(["decision.define-objective"]),
      selectedOptionsByDecisionId: new Map([
        ["decision.define-objective", "option.objective-patient-access"],
      ]),
      completedActivityIds: new Set(["activity.review-authorization"]),
      activeActivityIds: new Set<string>(),
      completedMeetingIds: new Set(["meeting.program-kickoff"]),
      availableDocumentIds: new Set(["document.authorization-summary"]),
      deliveredMessageIds: new Set(["message.sponsor-welcome"]),
      metricValues: new Map([["schedule_pressure", 55]]),
      narrativeFlags: new Map([["flag.recovery", true]]),
      experienceLevel: "practitioner",
    };
    expect(evaluateConditionExpression(always, facts)).toBe(true);
    expect(
      evaluateConditionExpression(
        {
          kind: "chapter_status",
          chapterId: asChapterId("chapter-01"),
          status: "completed",
        },
        facts,
      ),
    ).toBe(true);
    expect(
      evaluateConditionExpression(
        {
          kind: "document_available",
          documentId: asDocumentId("document.authorization-summary"),
        },
        facts,
      ),
    ).toBe(true);
    expect(
      evaluateConditionExpression(
        {
          kind: "metric_compare",
          metricKey: "schedule_pressure" as never,
          operator: "gte",
          value: 50,
        },
        facts,
      ),
    ).toBe(true);
  });
});

describe("BC-006 W3 Northstar runtime mapping", () => {
  const pkg = createNorthstarConnectedCarePackage();
  const runtime = mapBusinessCasePackageToRuntimeDecisions(pkg, cpv);

  it("maps every Northstar decision and option through the content adapter", () => {
    expect(runtime).toHaveLength(pkg.decisions.length);
    expect(runtime).toHaveLength(37);
    const optionCount = runtime.reduce(
      (sum, decision) => sum + decision.options.length,
      0,
    );
    expect(optionCount).toBe(
      pkg.decisions.reduce((sum, decision) => sum + decision.options.length, 0),
    );
    for (const decision of pkg.decisions) {
      const mapped = runtime.find((entry) => entry.id === decision.id);
      expect(mapped).toBeDefined();
      expect(mapped?.chapterId).toBe(decision.chapterId);
      expect(mapped?.eligibilityCondition).toEqual(decision.availableWhen);
      expect(mapped?.options.length).toBe(decision.options.length);
      for (const option of decision.options) {
        const mappedOption = mapped?.options.find(
          (entry) => entry.id === option.id,
        );
        expect(mappedOption).toBeDefined();
        expect(mappedOption?.outcome.resolverVersion).toBe(
          SUPPORTED_RESOLVER_VERSION,
        );
        expect(
          mappedOption?.outcome.consequenceDefinitions.length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("preserves Chapter One decision IDs and Chapters 2–6 catalog IDs", () => {
    expect(runtime.some((d) => d.id === "decision.define-objective")).toBe(
      true,
    );
    expect(
      runtime.some((d) => d.id === "decision.select-delivery-approach"),
    ).toBe(true);
    expect(runtime.some((d) => d.id === "decision.establish-governance")).toBe(
      true,
    );
    expect(
      runtime.some(
        (d) => d.id === "decision.northstar.chapter-02.scope-baseline-strategy",
      ),
    ).toBe(true);
    expect(
      runtime.some(
        (d) =>
          d.id === "decision.northstar.chapter-06.final-closure-recommendation",
      ),
    ).toBe(true);
  });

  it("embeds delayed schedule provenance for Workstream 4", () => {
    const withDelayed = runtime.flatMap((decision) =>
      decision.options.flatMap((option) =>
        option.outcome.consequenceDefinitions
          .filter((consequence) => consequence.type === "schedule_event")
          .map((consequence) => ({ decision, consequence })),
      ),
    );
    expect(withDelayed.length).toBeGreaterThan(0);
    for (const entry of withDelayed.slice(0, 20)) {
      expect(entry.consequence.payload.sourceDecisionId).toBe(
        entry.decision.id,
      );
      expect(entry.consequence.payload.sourceChapterId).toBe(
        entry.decision.chapterId,
      );
    }
  });
});

describe("BC-006 W3 eligibility and evidence", () => {
  it("rejects missing required document evidence", () => {
    const definition = {
      ...createScaffoldDecisionDefinition({ contentPackageVersionId: cpv }),
      id: asDecisionId("decision.evidence-gate"),
      options: createScaffoldDecisionDefinition({
        contentPackageVersionId: cpv,
      }).options.map((option) => ({
        ...option,
        decisionDefinitionId: asDecisionId("decision.evidence-gate"),
      })),
      requiredEvidenceDocumentIds: [
        asDocumentId("document.authorization-summary"),
      ],
      chapterId: null,
    };
    const context = buildDecisionEligibilityContext({
      runStatus: "active",
      contentPackageVersionId: cpv,
      currentChapterId: null,
      state: createInitialSimulationState(),
    });
    const result = isDecisionDefinitionAvailable(context, definition, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DECISION_NOT_ELIGIBLE");
    }
  });

  it("rejects decisions whose chapter is not unlocked", () => {
    const definition = {
      ...createScaffoldDecisionDefinition({ contentPackageVersionId: cpv }),
      chapterId: asChapterId("chapter-02"),
    };
    const context = buildDecisionEligibilityContext({
      runStatus: "active",
      contentPackageVersionId: cpv,
      currentChapterId: asChapterId("chapter-01"),
      state: createInitialSimulationState(),
    });
    const result = isDecisionDefinitionAvailable(context, definition, now);
    expect(result.ok).toBe(false);
  });

  it("keeps command and projection eligibility parity for the same facts", () => {
    const definition = createScaffoldDecisionDefinition({
      contentPackageVersionId: cpv,
    });
    const context = buildDecisionEligibilityContext({
      runStatus: "active",
      contentPackageVersionId: cpv,
      currentChapterId: null,
      state: createInitialSimulationState(),
    });
    const available = isDecisionDefinitionAvailable(context, definition, now);
    const command = validateDecisionEligibility(context, {
      decisionDefinitionId: definition.id,
      selectedOptionId: definition.options[0]!.id,
      definition,
      sourceActionId: asActionRecordId("action_parity"),
      submittedAt: now,
    });
    expect(available.ok).toBe(true);
    expect(command.ok).toBe(true);
  });
});

describe("BC-006 W3 cross-chapter consequence chains", () => {
  const pkg = createNorthstarConnectedCarePackage();
  const runtime = mapBusinessCasePackageToRuntimeDecisions(pkg, cpv);

  const withEvidenceDocuments = (
    state: SimulationState,
    definitionIds: readonly string[],
  ): SimulationState => {
    // Seed all package-referenced metric keys while preserving already-applied values.
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
          originatingCommandId: asCommandId(`cmd_doc_${index}`),
        });
        if (!created.ok) {
          throw new Error(created.error.message);
        }
        return created.value;
      }),
    ];
    return { ...state, projectMetrics, documents };
  };

  const submitMappedDecision = (
    run: SimulationRun,
    decisionId: string,
    optionIndex = 0,
  ) => {
    const definition = runtime.find((entry) => entry.id === decisionId);
    expect(definition).toBeDefined();
    const option = definition!.options[optionIndex]!;
    let eventCounter = 0;
    return processSubmitDecision(run, {
      decisionRecordId: asDecisionRecordId(`record:${decisionId}`),
      decisionDefinitionId: asDecisionId(decisionId),
      selectedOptionId: option.id,
      definition: definition!,
      sourceActionId: asActionRecordId(`action:${decisionId}`),
      submittedBy: asActorId("actor_w3"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId(`evt_submit:${decisionId}`),
      correlationId: asCorrelationId(`corr:${decisionId}`),
      causationId: null,
      allocateEventId: () => asEventId(`evt_alloc_${(eventCounter += 1)}`),
    });
  };

  it("applies governance decision consequences once and creates delayed schedules with provenance", () => {
    const definition = runtime.find(
      (entry) => entry.id === "decision.establish-governance",
    )!;
    let run = activeRun({
      state: withEvidenceDocuments(createInitialSimulationState(), []),
      currentChapterId: asChapterId("chapter-01"),
    });

    for (const prerequisiteId of definition.prerequisiteDecisionIds) {
      const prereq = runtime.find((entry) => entry.id === prerequisiteId)!;
      run = {
        ...run,
        state: withEvidenceDocuments(
          run.state,
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
        definition.requiredEvidenceDocumentIds.map(String),
      ),
    };

    const first = submitMappedDecision(run, "decision.establish-governance", 1);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error(first.error.message);
    }
    const consequenceCount = first.value.run.state.consequences.length;
    const scheduleCount = first.value.run.state.scheduledEvents.length;
    expect(consequenceCount).toBeGreaterThan(0);
    expect(scheduleCount).toBeGreaterThan(0);
    for (const schedule of first.value.run.state.scheduledEvents) {
      expect(schedule.sourceDecisionId).toBe("decision.establish-governance");
      expect(schedule.sourceChapterId).toBe("chapter-01");
      expect(schedule.resolverVersion).toBe(SUPPORTED_RESOLVER_VERSION);
      expect(schedule.contentPackageVersionId).toBe(cpv);
      expect(schedule.originDecisionRecordId).toBe(
        "record:decision.establish-governance",
      );
    }

    const duplicate = processSubmitDecision(first.value.run, {
      decisionRecordId: asDecisionRecordId(
        "record:decision.establish-governance:dup",
      ),
      decisionDefinitionId: asDecisionId("decision.establish-governance"),
      selectedOptionId: definition.options[1]!.id,
      definition,
      sourceActionId: asActionRecordId(
        "action:decision.establish-governance:dup",
      ),
      submittedBy: asActorId("actor_w3"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_submit:dup"),
      correlationId: asCorrelationId("corr:dup"),
      causationId: null,
      allocateEventId: () => asEventId("evt_alloc_dup"),
    });
    expect(duplicate.ok).toBe(false);

    const serialized = serializeSimulationState(first.value.run.state);
    const rehydrated = parseSimulationState(serialized);
    expect(rehydrated).not.toBeNull();
    expect(rehydrated?.consequences).toHaveLength(consequenceCount);
    expect(rehydrated?.scheduledEvents).toHaveLength(scheduleCount);
    expect(rehydrated?.scheduledEvents[0]?.sourceDecisionId).toBe(
      "decision.establish-governance",
    );
    expect(rehydrated?.schemaVersion).toBe(8);
  });

  it("maps cross-chapter decision families used by consequence chains", () => {
    const chainDecisionIds = [
      "decision.establish-governance",
      "decision.northstar.chapter-02.launch-target-communication",
      "decision.northstar.chapter-02.quality-acceptance-threshold",
      "decision.northstar.chapter-02.vendor-responsibility-boundary",
      "decision.northstar.chapter-03.communication-breakdown-response",
      "decision.northstar.chapter-05.adoption-response",
      "decision.northstar.chapter-04.recovery-strategy",
    ] as const;
    for (const decisionId of chainDecisionIds) {
      const mapped = runtime.find((entry) => entry.id === decisionId);
      expect(mapped).toBeDefined();
      expect(mapped!.options.length).toBeGreaterThan(0);
      const hasImmediate = mapped!.options.some((option) =>
        option.outcome.consequenceDefinitions.some(
          (consequence) => consequence.timing === "immediate",
        ),
      );
      expect(hasImmediate).toBe(true);
    }
  });

  it("rejects unknown options and keeps delayed effects from applying immediately", () => {
    const definition = runtime.find(
      (entry) => entry.id === "decision.define-objective",
    )!;
    const run = activeRun({
      state: withEvidenceDocuments(
        createInitialSimulationState(),
        definition.requiredEvidenceDocumentIds.map(String),
      ),
    });
    let eventCounter = 0;
    const invalid = processSubmitDecision(run, {
      decisionRecordId: asDecisionRecordId("record:invalid-option"),
      decisionDefinitionId: definition.id,
      selectedOptionId: "option.does-not-exist" as never,
      definition,
      sourceActionId: asActionRecordId("action:invalid-option"),
      submittedBy: asActorId("actor_w3"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_invalid_option"),
      correlationId: asCorrelationId("corr_invalid_option"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_inv_${(eventCounter += 1)}`),
    });
    expect(invalid.ok).toBe(false);

    const valid = submitMappedDecision(run, "decision.define-objective", 1);
    expect(valid.ok).toBe(true);
    if (!valid.ok) {
      throw new Error(valid.error.message);
    }
    const delayed = valid.value.run.state.scheduledEvents;
    expect(delayed.length).toBeGreaterThan(0);
    for (const schedule of delayed) {
      expect(schedule.status).toBe("pending");
      expect(schedule.deferredEffectKind).not.toBeNull();
    }
    // Delayed metric/stakeholder effects must not already be materialized as
    // future Workplace unlocks; schedules remain pending instructions only.
    expect(
      valid.value.run.state.consequences.every(
        (consequence) =>
          consequence.status === "applied" ||
          consequence.status === "scheduled",
      ),
    ).toBe(true);
  });
});
