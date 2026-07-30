/**
 * Deterministic simulation engine evaluation (BC-006 Workstream 4).
 *
 * Evaluates schedule eligibility, applies deferred effects exactly once,
 * triggers/resolves crises, and updates narrative/stakeholder behavior.
 *
 * Pure Domain: no wall clock, randomness, AI, projections, or network.
 */

import type { RuleViolationError } from "../../shared-kernel/errors";
import type { ChapterId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { CrisisDefinition } from "../content/business-case/entities";
import {
  evaluateConditionExpression,
  type ConditionEvaluationFacts,
} from "../content/business-case/evaluate-condition";
import {
  applyDeferredEffectFromSchedule,
  type StakeholderBehaviorMap,
} from "./apply-deferred-effect";
import {
  createCrisisRuntimeState,
  resolveCrisisRuntimeState,
  type CrisisRuntimeState,
} from "./crisis-runtime";
import { buildDecisionEligibilityContextFromParts } from "./decision-eligibility";
import type { SimulationRun } from "./simulation-run";
import type { SimulationState } from "./state";
import {
  compareSchedulesForApplication,
  isScheduleAwaitingEligibility,
  markScheduleApplied,
  markScheduleCancelled,
  markScheduleEligible,
  markScheduleExpired,
  markScheduleSuperseded,
  type ScheduledEventInstruction,
  type ScheduleTriggerType,
} from "./scheduled-event";

export type EngineBoundary =
  | { readonly kind: "chapter_exit"; readonly chapterId: ChapterId }
  | { readonly kind: "chapter_entry"; readonly chapterId: ChapterId }
  | { readonly kind: "decision_resolved" }
  | { readonly kind: "metric_changed" }
  | { readonly kind: "completion" }
  | { readonly kind: "manual" };

export interface EngineEvaluationInput {
  readonly run: SimulationRun;
  readonly boundary: EngineBoundary;
  readonly occurredAt: IsoTimestamp;
  readonly crises?: readonly CrisisDefinition[];
  /**
   * Explicit cancel/expire/supersede instructions (authored or admin).
   * Keys are schedule IDs.
   */
  readonly cancelScheduleIds?: ReadonlyMap<string, string>;
  readonly expireScheduleIds?: ReadonlyMap<string, string>;
  readonly supersedeScheduleIds?: ReadonlyMap<
    string,
    { readonly replacementId: string; readonly reason: string }
  >;
}

export interface EngineEvaluationResult {
  readonly state: SimulationState;
  readonly becameEligibleIds: readonly string[];
  readonly appliedScheduleIds: readonly string[];
  readonly cancelledScheduleIds: readonly string[];
  readonly expiredScheduleIds: readonly string[];
  readonly supersededScheduleIds: readonly string[];
  readonly triggeredCrisisIds: readonly string[];
  readonly resolvedCrisisIds: readonly string[];
}

export const buildConditionFactsFromRun = (
  run: SimulationRun,
  state: SimulationState = run.state,
): ConditionEvaluationFacts => {
  const eligibility = buildDecisionEligibilityContextFromParts({
    runStatus: run.status,
    contentPackageVersionId: run.contentPackageVersionId,
    currentChapterId: run.currentChapterId,
    decisions: state.decisions,
    documents: state.documents,
    meetings: state.meetings,
    learnerMessages: state.learnerMessages,
    activities: state.activities,
    projectMetrics: state.projectMetrics,
    chapterProgress: state.chapterProgress,
  });
  const narrativeFlags = new Map<string, boolean>(
    Object.entries(state.narrativeFlags),
  );
  return {
    completedChapterIds: eligibility.completedChapterIds,
    currentChapterId: eligibility.currentChapterId,
    initiallyUnlockedChapterIds: eligibility.initiallyUnlockedChapterIds,
    submittedDecisionIds: new Set(
      state.decisions.map((decision) => decision.decisionDefinitionId),
    ),
    resolvedDecisionIds: new Set(
      state.decisions
        .filter((decision) => decision.status === "resolved")
        .map((decision) => decision.decisionDefinitionId),
    ),
    selectedOptionsByDecisionId: new Map(
      state.decisions.map((decision) => [
        decision.decisionDefinitionId,
        decision.selectedOptionId,
      ]),
    ),
    completedActivityIds: eligibility.completedActivityIds,
    activeActivityIds: eligibility.activeActivityIds,
    completedMeetingIds: eligibility.completedMeetingIds,
    availableDocumentIds: eligibility.availableDocumentIds,
    deliveredMessageIds: eligibility.deliveredMessageIds,
    metricValues: eligibility.metricValues,
    narrativeFlags,
    experienceLevel: run.experienceLevel ?? null,
  };
};

const effectiveTriggerType = (
  schedule: ScheduledEventInstruction,
): ScheduleTriggerType => {
  if (schedule.triggerType !== null) {
    return schedule.triggerType;
  }
  if (schedule.targetChapterId !== null) {
    return "chapter_entry";
  }
  return "chapter_exit";
};

const isScheduleEligibleForBoundary = (
  schedule: ScheduledEventInstruction,
  boundary: EngineBoundary,
  run: SimulationRun,
): boolean => {
  if (!isScheduleAwaitingEligibility(schedule.status)) {
    return false;
  }
  const trigger = effectiveTriggerType(schedule);
  switch (boundary.kind) {
    case "chapter_exit":
      if (trigger !== "chapter_exit" && trigger !== "completion") {
        return false;
      }
      if (schedule.sourceChapterId === null) {
        return true;
      }
      return schedule.sourceChapterId === boundary.chapterId;
    case "chapter_entry":
      if (trigger !== "chapter_entry") {
        return false;
      }
      if (schedule.targetChapterId === null) {
        return run.currentChapterId === boundary.chapterId;
      }
      return schedule.targetChapterId === boundary.chapterId;
    case "decision_resolved":
      return trigger === "event" || trigger === "completion";
    case "metric_changed":
      return trigger === "metric_threshold";
    case "completion":
      return trigger === "completion";
    case "manual":
      return trigger === "manual";
    default: {
      const _exhaustive: never = boundary;
      void _exhaustive;
      return false;
    }
  }
};

const evaluateCrises = (
  input: EngineEvaluationInput,
  state: SimulationState,
  facts: ConditionEvaluationFacts,
): Result<
  {
    readonly crises: readonly CrisisRuntimeState[];
    readonly triggeredCrisisIds: readonly string[];
    readonly resolvedCrisisIds: readonly string[];
    readonly narrativeFlags: Readonly<Record<string, boolean>>;
  },
  RuleViolationError
> => {
  const crises = input.crises ?? [];
  let nextCrises = [...state.crises];
  let narrativeFlags = { ...state.narrativeFlags };
  const triggeredCrisisIds: string[] = [];
  const resolvedCrisisIds: string[] = [];
  const sequence = input.run.lastProcessedSequence;

  for (const definition of crises) {
    const existing = nextCrises.find(
      (entry) => entry.crisisId === definition.id,
    );
    if (!existing) {
      const inChapter =
        input.run.currentChapterId === definition.chapterId ||
        (input.boundary.kind === "chapter_entry" &&
          input.boundary.chapterId === definition.chapterId);
      if (
        inChapter &&
        evaluateConditionExpression(definition.triggerWhen, facts)
      ) {
        const created = createCrisisRuntimeState({
          crisisId: definition.id,
          chapterId: definition.chapterId,
          triggeredAt: input.occurredAt,
          triggeredAtSequence: sequence,
          contentPackageVersionId: input.run.contentPackageVersionId,
        });
        if (!created.ok) {
          return created;
        }
        nextCrises = [...nextCrises, created.value];
        triggeredCrisisIds.push(definition.id);
        narrativeFlags = {
          ...narrativeFlags,
          [`crisis_triggered:${definition.id}`]: true,
        };
        for (const flag of definition.outcomeFlags) {
          narrativeFlags = { ...narrativeFlags, [flag]: true };
        }
      }
      continue;
    }

    if (existing.status === "triggered") {
      if (evaluateConditionExpression(definition.resolutionWhen, facts)) {
        const resolved = resolveCrisisRuntimeState(existing, {
          resolvedAt: input.occurredAt,
          resolvedAtSequence: sequence,
        });
        if (!resolved.ok) {
          return resolved;
        }
        nextCrises = nextCrises.map((entry) =>
          entry.crisisId === existing.crisisId ? resolved.value : entry,
        );
        resolvedCrisisIds.push(existing.crisisId);
        narrativeFlags = {
          ...narrativeFlags,
          [`crisis_resolved:${existing.crisisId}`]: true,
        };
      }
    }
  }

  return ok({
    crises: nextCrises,
    triggeredCrisisIds,
    resolvedCrisisIds,
    narrativeFlags,
  });
};

/**
 * Run one deterministic engine evaluation pass against authoritative state.
 */
export const evaluateSimulationEngine = (
  input: EngineEvaluationInput,
): Result<EngineEvaluationResult, RuleViolationError> => {
  let state = input.run.state;
  const sequence = input.run.lastProcessedSequence;
  const becameEligibleIds: string[] = [];
  const appliedScheduleIds: string[] = [];
  const cancelledScheduleIds: string[] = [];
  const expiredScheduleIds: string[] = [];
  const supersededScheduleIds: string[] = [];

  let schedules = [...state.scheduledEvents];

  for (const [scheduleId, reason] of input.cancelScheduleIds ?? []) {
    const index = schedules.findIndex((entry) => entry.id === scheduleId);
    if (index < 0) {
      continue;
    }
    const marked = markScheduleCancelled(schedules[index]!, reason);
    if (!marked.ok) {
      return marked;
    }
    if (schedules[index]!.status !== marked.value.status) {
      cancelledScheduleIds.push(scheduleId);
    }
    schedules[index] = marked.value;
  }

  for (const [scheduleId, reason] of input.expireScheduleIds ?? []) {
    const index = schedules.findIndex((entry) => entry.id === scheduleId);
    if (index < 0) {
      continue;
    }
    const marked = markScheduleExpired(schedules[index]!, reason);
    if (!marked.ok) {
      return marked;
    }
    if (schedules[index]!.status !== marked.value.status) {
      expiredScheduleIds.push(scheduleId);
    }
    schedules[index] = marked.value;
  }

  for (const [scheduleId, replacement] of input.supersedeScheduleIds ?? []) {
    const index = schedules.findIndex((entry) => entry.id === scheduleId);
    if (index < 0) {
      continue;
    }
    const marked = markScheduleSuperseded(
      schedules[index]!,
      replacement.replacementId,
      replacement.reason,
    );
    if (!marked.ok) {
      return marked;
    }
    if (schedules[index]!.status !== marked.value.status) {
      supersededScheduleIds.push(scheduleId);
    }
    schedules[index] = marked.value;
  }

  state = { ...state, scheduledEvents: schedules };

  const facts = buildConditionFactsFromRun(input.run, state);
  const crisisResult = evaluateCrises(input, state, facts);
  if (!crisisResult.ok) {
    return crisisResult;
  }
  state = {
    ...state,
    crises: crisisResult.value.crises,
    narrativeFlags: crisisResult.value.narrativeFlags,
  };

  const eligibleCandidates = state.scheduledEvents
    .filter((schedule) =>
      isScheduleEligibleForBoundary(schedule, input.boundary, {
        ...input.run,
        state,
      }),
    )
    .slice()
    .sort(compareSchedulesForApplication);

  schedules = [...state.scheduledEvents];
  let projectMetrics = state.projectMetrics;
  let projectState = state.projectState;
  let narrativeFlags = { ...state.narrativeFlags };
  let stakeholderBehavior: StakeholderBehaviorMap = {
    ...state.stakeholderBehavior,
  };

  for (const candidate of eligibleCandidates) {
    const index = schedules.findIndex((entry) => entry.id === candidate.id);
    if (index < 0) {
      continue;
    }
    const current = schedules[index]!;
    if (!isScheduleAwaitingEligibility(current.status)) {
      continue;
    }

    const eligible = markScheduleEligible(current, sequence);
    if (!eligible.ok) {
      return eligible;
    }
    becameEligibleIds.push(String(current.id));

    const appliedEffect = applyDeferredEffectFromSchedule({
      schedule: eligible.value,
      projectMetrics,
      projectState,
      narrativeFlags,
      stakeholderBehavior,
    });
    if (!appliedEffect.ok) {
      return appliedEffect;
    }

    const applied = markScheduleApplied(eligible.value, sequence);
    if (!applied.ok) {
      return applied;
    }

    schedules[index] = applied.value;
    projectMetrics = appliedEffect.value.projectMetrics;
    projectState = appliedEffect.value.projectState;
    narrativeFlags = appliedEffect.value.narrativeFlags;
    stakeholderBehavior = appliedEffect.value.stakeholderBehavior;
    appliedScheduleIds.push(String(current.id));
  }

  // Expire chapter_exit schedules that targeted a completed chapter but never
  // became eligible (e.g. wrong trigger). Only when an explicit expire map is empty
  // and boundary is chapter_entry of a later chapter — skip inventing policy.
  void markScheduleEligible;

  state = {
    ...state,
    scheduledEvents: schedules,
    projectMetrics,
    projectState,
    narrativeFlags,
    stakeholderBehavior,
  };

  return ok({
    state,
    becameEligibleIds,
    appliedScheduleIds,
    cancelledScheduleIds,
    expiredScheduleIds,
    supersededScheduleIds,
    triggeredCrisisIds: crisisResult.value.triggeredCrisisIds,
    resolvedCrisisIds: crisisResult.value.resolvedCrisisIds,
  });
};

/**
 * True when any crisis is triggered and unresolved for the given chapter.
 */
export const hasBlockingCrisis = (
  state: SimulationState,
  chapterId: ChapterId,
): boolean =>
  state.crises.some(
    (crisis) => crisis.chapterId === chapterId && crisis.status === "triggered",
  );

/**
 * Validate authored chapter completionWhen / unlockWhen conditions.
 */
export const evaluateChapterCondition = (
  run: SimulationRun,
  state: SimulationState,
  condition:
    Parameters<typeof evaluateConditionExpression>[0] | null | undefined,
): boolean => {
  if (condition === null || condition === undefined) {
    return true;
  }
  return evaluateConditionExpression(
    condition,
    buildConditionFactsFromRun(run, state),
  );
};

export const assertNoEnginePartialFailure = (
  result: Result<EngineEvaluationResult, RuleViolationError>,
): Result<EngineEvaluationResult, RuleViolationError> => {
  if (!result.ok) {
    return err(result.error);
  }
  return result;
};
