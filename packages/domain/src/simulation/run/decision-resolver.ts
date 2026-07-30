import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ActionRecordId,
  AnalyticsSignalId,
  ConsequenceId,
  ContentPackageVersionId,
  DecisionRecordId,
  EventId,
  LearningSignalId,
  ResolverVersion,
  ScheduledEventId,
  SimulationRunId,
  StakeholderSignalId,
  TenantId,
} from "../../shared-kernel/ids";
import { asIsoTimestamp } from "../../shared-kernel/time";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { DecisionDefinition } from "../content/decision-definition";
import type { ConsequenceDefinition } from "../content/consequence-definition";
import { createConsequence, type Consequence } from "./consequence";
import {
  buildConsequenceApplicationKey,
  deriveAnalyticsSignalId,
  deriveConsequenceId,
  deriveDecisionOutcomeId,
  deriveLearnerMessageOccurrenceId,
  deriveLearningSignalId,
  deriveScheduledEventId,
  deriveStakeholderSignalId,
} from "./consequence-identity";
import {
  createLearnerMessageOccurrence,
  learnerMessageSemanticEqual,
  type LearnerMessageOccurrence,
} from "./learner-message";
import {
  createDecisionOutcome,
  type DecisionOutcome,
} from "./decision-outcome";
import type { Decision } from "./decision";
import { applyMetricDelta, type ProjectMetrics } from "./project-metrics";
import { transitionProjectState, type ProjectState } from "./project-state";
import {
  createScheduledEventInstruction,
  type ScheduledEventInstruction,
} from "./scheduled-event";
import type { SimulationState } from "./state";

/** Supported deterministic resolver contract version for PS-ROADMAP-005. */
export const SUPPORTED_RESOLVER_VERSION =
  "decision-resolver/v1" as ResolverVersion;

export interface ProposedMetricChange {
  readonly consequenceId: ConsequenceId;
  readonly metricKey: string;
  readonly previousValue: number;
  readonly delta: number;
  readonly nextValue: number;
  readonly reasonCode: string;
}

export interface ProposedProjectStateChange {
  readonly consequenceId: ConsequenceId;
  readonly previousStatus: ProjectState["status"];
  readonly nextStatus: ProjectState["status"];
  readonly reasonCode: string;
}

export interface ProposedLearningSignal {
  readonly signalId: LearningSignalId;
  readonly consequenceId: ConsequenceId;
  readonly signalType: string;
  readonly competencyKey: string;
  readonly delta: number;
  readonly reasonCode: string;
}

export interface ProposedStakeholderSignal {
  readonly signalId: StakeholderSignalId;
  readonly consequenceId: ConsequenceId;
  readonly signalType: string;
  readonly stakeholderId: string;
  readonly sentimentDelta: number;
  readonly reasonCode: string;
}

export interface ProposedAnalyticsSignal {
  readonly signalId: AnalyticsSignalId;
  readonly consequenceId: ConsequenceId;
  readonly signalType: string;
  readonly dimension: string;
  readonly value: number;
  readonly reasonCode: string;
}

export interface ProposedLearnerMessageDelivery {
  readonly consequenceId: ConsequenceId;
  readonly occurrence: LearnerMessageOccurrence;
}

export interface DecisionResolution {
  readonly outcome: DecisionOutcome;
  readonly consequences: readonly Consequence[];
  readonly nextMetrics: ProjectMetrics;
  readonly nextProjectState: ProjectState;
  readonly scheduledEvents: readonly ScheduledEventInstruction[];
  readonly learnerMessages: readonly LearnerMessageOccurrence[];
  readonly metricChanges: readonly ProposedMetricChange[];
  readonly projectStateChanges: readonly ProposedProjectStateChange[];
  readonly learningSignals: readonly ProposedLearningSignal[];
  readonly stakeholderSignals: readonly ProposedStakeholderSignal[];
  readonly analyticsSignals: readonly ProposedAnalyticsSignal[];
  readonly learnerMessageDeliveries: readonly ProposedLearnerMessageDelivery[];
}

export interface ResolveDecisionDefinitionInput {
  readonly simulationRunId: SimulationRunId;
  readonly tenantId: TenantId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly state: SimulationState;
  readonly decision: Decision;
  readonly definition: DecisionDefinition;
  readonly originActionId: ActionRecordId;
  readonly resolvedAt: IsoTimestamp;
  readonly originEventId: EventId | null;
}

const addDelayMs = (
  timestamp: IsoTimestamp,
  delayMs: number,
): Result<IsoTimestamp, RuleViolationError> => {
  const millis = Date.parse(timestamp);
  if (Number.isNaN(millis)) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        "resolvedAt is not a valid ISO timestamp for scheduling.",
      ),
    );
  }
  return ok(asIsoTimestamp(new Date(millis + delayMs).toISOString()));
};

const validateDefinitionShape = (
  definition: ConsequenceDefinition,
): Result<void, RuleViolationError> => {
  if (definition.id.trim().length === 0) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_DEFINITION_INVALID",
        "ConsequenceDefinition.id must be non-empty.",
      ),
    );
  }
  switch (definition.type) {
    case "project_metric_delta":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "project_metric" ||
        definition.target.metricKey !== definition.payload.metricKey
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "project_metric_delta target/payload mismatch.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "project_state_transition":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "project_state"
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "project_state_transition target/timing invalid.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "schedule_event":
      if (
        definition.timing !== "delayed" ||
        definition.target.kind !== "scheduled_event"
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "schedule_event target/timing invalid.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "learning_signal":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "learning_context"
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "learning_signal target/timing invalid.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "stakeholder_signal":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "stakeholder_context" ||
        definition.target.stakeholderId !== definition.payload.stakeholderId
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "stakeholder_signal target/payload mismatch.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "analytics_signal":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "analytics_context"
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "analytics_signal target/timing invalid.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    case "deliver_learner_message":
      if (
        definition.timing !== "immediate" ||
        definition.target.kind !== "learner_message"
      ) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_TARGET_INVALID",
            "deliver_learner_message target/timing invalid.",
            { consequenceDefinitionId: definition.id },
          ),
        );
      }
      return ok(undefined);
    default:
      return err(
        ruleViolationError(
          "CONSEQUENCE_TYPE_UNSUPPORTED",
          `Consequence type is unsupported.`,
          { consequenceDefinitionId: (definition as ConsequenceDefinition).id },
        ),
      );
  }
};

/**
 * Deterministic DecisionResolver (Core Simulation).
 *
 * Pure: no I/O, no wall-clock access, no randomness, no AI. Persistence and
 * event envelope assembly happen in the aggregate operation.
 */
export const resolveDecisionDeterministically = (
  input: ResolveDecisionDefinitionInput,
): Result<DecisionResolution, RuleViolationError> => {
  const { decision, definition, state } = input;

  if (definition.id !== decision.decisionDefinitionId) {
    return err(
      ruleViolationError(
        "CONTENT_DEFINITION_NOT_FOUND",
        "Decision definition does not match the submitted Decision.",
      ),
    );
  }
  if (definition.contentPackageVersionId !== input.contentPackageVersionId) {
    return err(
      ruleViolationError(
        "CONTENT_VERSION_MISMATCH",
        "Decision definition content version does not match the run.",
      ),
    );
  }

  const option = definition.options.find(
    (entry) => entry.id === decision.selectedOptionId,
  );
  if (!option) {
    return err(
      ruleViolationError(
        "DECISION_OPTION_NOT_FOUND",
        `Selected option '${decision.selectedOptionId}' was not found.`,
      ),
    );
  }
  if (!option.outcome) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_DEFINITION_INVALID",
        "Selected option is missing an outcome definition.",
      ),
    );
  }
  if (option.outcome.consequenceDefinitions.length === 0) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_DEFINITION_INVALID",
        "Outcome must define at least one consequence.",
      ),
    );
  }
  if (option.outcome.resolverVersion !== SUPPORTED_RESOLVER_VERSION) {
    return err(
      ruleViolationError(
        "RESOLVER_VERSION_UNSUPPORTED",
        `Resolver version '${option.outcome.resolverVersion}' is unsupported.`,
        {
          resolverVersion: option.outcome.resolverVersion,
          supported: SUPPORTED_RESOLVER_VERSION,
        },
      ),
    );
  }

  const resolverVersion = option.outcome.resolverVersion;
  const outcomeId = deriveDecisionOutcomeId({
    decisionRecordId: decision.id,
    resolverVersion,
  });

  let nextMetrics = state.projectMetrics;
  let nextProjectState = state.projectState;
  const consequences: Consequence[] = [];
  const scheduledEvents: ScheduledEventInstruction[] = [];
  const metricChanges: ProposedMetricChange[] = [];
  const projectStateChanges: ProposedProjectStateChange[] = [];
  const learningSignals: ProposedLearningSignal[] = [];
  const stakeholderSignals: ProposedStakeholderSignal[] = [];
  const analyticsSignals: ProposedAnalyticsSignal[] = [];
  const learnerMessageDeliveries: ProposedLearnerMessageDelivery[] = [];
  const learnerMessages: LearnerMessageOccurrence[] = [];
  const learningSignalIds: LearningSignalId[] = [];
  const stakeholderSignalIds: StakeholderSignalId[] = [];
  const analyticsSignalIds: AnalyticsSignalId[] = [];
  const seenDefinitionIds = new Set<string>();
  let nextDeliverySequence =
    state.learnerMessages.reduce(
      (max, message) => Math.max(max, message.deliverySequence),
      0,
    ) + 1;

  for (const consequenceDefinition of option.outcome.consequenceDefinitions) {
    if (seenDefinitionIds.has(consequenceDefinition.id)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Duplicate consequence definition id '${consequenceDefinition.id}'.`,
        ),
      );
    }
    seenDefinitionIds.add(consequenceDefinition.id);

    const shape = validateDefinitionShape(consequenceDefinition);
    if (!shape.ok) {
      return shape;
    }

    const applicationKey = buildConsequenceApplicationKey({
      simulationRunId: input.simulationRunId,
      decisionRecordId: decision.id,
      consequenceDefinitionId: consequenceDefinition.id,
      resolverVersion,
    });
    if (
      state.consequences.some(
        (existing) => existing.applicationKey === applicationKey,
      )
    ) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_ALREADY_APPLIED",
          `Consequence application key '${applicationKey}' already exists.`,
        ),
      );
    }

    const consequenceId = deriveConsequenceId({
      simulationRunId: input.simulationRunId,
      decisionRecordId: decision.id,
      consequenceDefinitionId: consequenceDefinition.id,
      resolverVersion,
    });

    let status: "applied" | "scheduled" = "applied";
    let appliedAt: IsoTimestamp | null = input.resolvedAt;
    let scheduledAt: IsoTimestamp | null = null;
    let effectSummary: string = consequenceDefinition.type;

    switch (consequenceDefinition.type) {
      case "project_metric_delta": {
        const applied = applyMetricDelta(nextMetrics, {
          metricKey: consequenceDefinition.payload.metricKey,
          delta: consequenceDefinition.payload.delta,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        if (!applied.ok) {
          return applied;
        }
        nextMetrics = applied.value.metrics;
        metricChanges.push({
          consequenceId,
          metricKey: consequenceDefinition.payload.metricKey,
          previousValue: applied.value.previousValue,
          delta: consequenceDefinition.payload.delta,
          nextValue: applied.value.nextValue,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        effectSummary = `metric:${consequenceDefinition.payload.metricKey}:${applied.value.previousValue}->${applied.value.nextValue}`;
        break;
      }
      case "project_state_transition": {
        const transitioned = transitionProjectState(
          nextProjectState,
          consequenceDefinition.payload.nextStatus,
          consequenceDefinition.payload.reasonCode,
        );
        if (!transitioned.ok) {
          return transitioned;
        }
        projectStateChanges.push({
          consequenceId,
          previousStatus: transitioned.value.previousStatus,
          nextStatus: transitioned.value.next.status,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        nextProjectState = transitioned.value.next;
        effectSummary = `project_state:${transitioned.value.previousStatus}->${transitioned.value.next.status}`;
        break;
      }
      case "schedule_event": {
        status = "scheduled";
        appliedAt = null;
        scheduledAt = input.resolvedAt;
        const dueAt = addDelayMs(
          input.resolvedAt,
          consequenceDefinition.payload.delayMs,
        );
        if (!dueAt.ok) {
          return dueAt;
        }
        const scheduledEventId: ScheduledEventId =
          deriveScheduledEventId(consequenceId);
        const triggerRaw = consequenceDefinition.payload.triggerType ?? null;
        const triggerType =
          triggerRaw === "chapter_entry" ||
          triggerRaw === "chapter_exit" ||
          triggerRaw === "event" ||
          triggerRaw === "metric_threshold" ||
          triggerRaw === "completion" ||
          triggerRaw === "manual"
            ? triggerRaw
            : null;
        const instruction = createScheduledEventInstruction({
          id: scheduledEventId,
          tenantId: input.tenantId,
          simulationRunId: input.simulationRunId,
          contentPackageVersionId: input.contentPackageVersionId,
          originDecisionRecordId: decision.id,
          originConsequenceId: consequenceId,
          consequenceDefinitionId: consequenceDefinition.id,
          dueAt: dueAt.value,
          delayMs: consequenceDefinition.payload.delayMs,
          reasonCode: consequenceDefinition.payload.reasonCode,
          createdAt: input.resolvedAt,
          resolverVersion,
          sourceDecisionId:
            consequenceDefinition.payload.sourceDecisionId ??
            decision.decisionDefinitionId,
          sourceChapterId:
            consequenceDefinition.payload.sourceChapterId ?? null,
          targetChapterId:
            consequenceDefinition.payload.targetChapterId ?? null,
          deferredEffectKind:
            consequenceDefinition.payload.deferredEffectKind ?? null,
          deferredEffectPayload:
            consequenceDefinition.payload.deferredEffectPayload ?? null,
          triggerType,
          priority:
            typeof consequenceDefinition.payload.priority === "number"
              ? consequenceDefinition.payload.priority
              : 100,
        });
        if (!instruction.ok) {
          return instruction;
        }
        if (
          state.scheduledEvents.some(
            (existing) => existing.id === instruction.value.id,
          ) ||
          scheduledEvents.some(
            (existing) => existing.id === instruction.value.id,
          )
        ) {
          return err(
            ruleViolationError(
              "SCHEDULED_EVENT_INSTRUCTION_INVALID",
              `Scheduled event '${instruction.value.id}' already exists.`,
            ),
          );
        }
        scheduledEvents.push(instruction.value);
        effectSummary = `schedule:${instruction.value.id}`;
        break;
      }
      case "learning_signal": {
        const signalId = deriveLearningSignalId(consequenceId);
        learningSignalIds.push(signalId);
        learningSignals.push({
          signalId,
          consequenceId,
          signalType: consequenceDefinition.payload.signalType,
          competencyKey: consequenceDefinition.payload.competencyKey,
          delta: consequenceDefinition.payload.delta,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        effectSummary = `learning_signal:${signalId}`;
        break;
      }
      case "stakeholder_signal": {
        const signalId = deriveStakeholderSignalId(consequenceId);
        stakeholderSignalIds.push(signalId);
        stakeholderSignals.push({
          signalId,
          consequenceId,
          signalType: consequenceDefinition.payload.signalType,
          stakeholderId: consequenceDefinition.payload.stakeholderId,
          sentimentDelta: consequenceDefinition.payload.sentimentDelta,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        effectSummary = `stakeholder_signal:${signalId}`;
        break;
      }
      case "analytics_signal": {
        const signalId = deriveAnalyticsSignalId(consequenceId);
        analyticsSignalIds.push(signalId);
        analyticsSignals.push({
          signalId,
          consequenceId,
          signalType: consequenceDefinition.payload.signalType,
          dimension: consequenceDefinition.payload.dimension,
          value: consequenceDefinition.payload.value,
          reasonCode: consequenceDefinition.payload.reasonCode,
        });
        effectSummary = `analytics_signal:${signalId}`;
        break;
      }
      case "deliver_learner_message": {
        const occurrenceId = deriveLearnerMessageOccurrenceId(consequenceId);
        const existing =
          state.learnerMessages.find(
            (message) => message.occurrenceId === occurrenceId,
          ) ??
          learnerMessages.find(
            (message) => message.occurrenceId === occurrenceId,
          );
        const candidate = createLearnerMessageOccurrence({
          occurrenceId,
          definitionId: consequenceDefinition.payload.messageDefinitionId,
          definitionVersion: consequenceDefinition.payload.definitionVersion,
          deliverySequence: nextDeliverySequence,
          deliveredAt: input.resolvedAt,
          sender: consequenceDefinition.payload.sender,
          subject: consequenceDefinition.payload.subject,
          body: consequenceDefinition.payload.body,
        });
        if (!candidate.ok) {
          return candidate;
        }
        if (existing) {
          if (!learnerMessageSemanticEqual(existing, candidate.value)) {
            return err(
              ruleViolationError(
                "LEARNER_MESSAGE_OCCURRENCE_CONFLICT",
                `Learner message occurrence '${occurrenceId}' already exists with conflicting content.`,
                { occurrenceId },
              ),
            );
          }
          // Identical semantic content: occurrence-level idempotent no-op.
          effectSummary = `learner_message:${occurrenceId}:idempotent`;
          break;
        }
        learnerMessages.push(candidate.value);
        learnerMessageDeliveries.push({
          consequenceId,
          occurrence: candidate.value,
        });
        nextDeliverySequence += 1;
        effectSummary = `learner_message:${occurrenceId}`;
        break;
      }
      default:
        return err(
          ruleViolationError(
            "CONSEQUENCE_TYPE_UNSUPPORTED",
            "Consequence type is unsupported.",
          ),
        );
    }

    void effectSummary;
    const consequence = createConsequence({
      id: consequenceId,
      simulationRunId: input.simulationRunId,
      originActionId: input.originActionId,
      originDecisionRecordId: decision.id as DecisionRecordId,
      originEventId: input.originEventId,
      consequenceDefinitionId: consequenceDefinition.id,
      consequenceType: consequenceDefinition.type,
      timing: consequenceDefinition.timing,
      target: consequenceDefinition.target,
      payload: consequenceDefinition.payload,
      status,
      appliedAt,
      scheduledAt,
      resolverVersion,
      applicationKey,
    });
    if (!consequence.ok) {
      return consequence;
    }
    consequences.push(consequence.value);
  }

  const outcome = createDecisionOutcome({
    id: outcomeId,
    decisionRecordId: decision.id,
    outcomeDefinitionId: option.outcome.id,
    resolverVersion,
    resolvedAt: input.resolvedAt,
    qualityClassification: option.outcome.qualityClassification,
    consequenceIds: consequences.map((entry) => entry.id),
    learningSignalIds,
    stakeholderSignalIds,
    analyticsSignalIds,
    explanationReference: option.outcome.explanationReference,
  });
  if (!outcome.ok) {
    return outcome;
  }

  return ok({
    outcome: outcome.value,
    consequences,
    nextMetrics,
    nextProjectState,
    scheduledEvents,
    learnerMessages,
    metricChanges,
    projectStateChanges,
    learningSignals,
    stakeholderSignals,
    analyticsSignals,
    learnerMessageDeliveries,
  });
};
