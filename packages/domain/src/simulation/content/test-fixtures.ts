import {
  asConsequenceDefinitionId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionOutcomeDefinitionId,
  asLearnerMessageDefinitionId,
  asMetricKey,
  asStakeholderId,
  type ContentPackageVersionId,
  type DecisionId,
} from "../../shared-kernel/ids";
import { SUPPORTED_RESOLVER_VERSION } from "../run/decision-resolver";
import type { DecisionDefinition } from "./decision-definition";
import type { DecisionOutcomeDefinition } from "./decision-outcome-definition";

/**
 * Deterministic scaffolding DecisionDefinition for tests/local MVP.
 * Not production content — no Content Aggregate persistence.
 */
export const createScaffoldDecisionDefinition = (input: {
  readonly id?: DecisionId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly availability?: DecisionDefinition["availability"];
  readonly prerequisiteDecisionIds?: readonly DecisionId[];
  readonly expiresAt?: DecisionDefinition["expiresAt"];
}): DecisionDefinition => {
  const decisionDefinitionId = input.id ?? asDecisionId("decision_1");
  const optionA = asDecisionOptionId("option_a");
  const optionB = asDecisionOptionId("option_b");

  const outcomeFor = (
    outcomeId: string,
    metricDelta: number,
    nextStatus: "planning" | "executing",
  ): DecisionOutcomeDefinition => ({
    id: asDecisionOutcomeDefinitionId(outcomeId),
    resolverVersion: SUPPORTED_RESOLVER_VERSION,
    qualityClassification: null,
    explanationReference: null,
    consequenceDefinitions: [
      {
        id: asConsequenceDefinitionId(`${outcomeId}_metric`),
        type: "project_metric_delta",
        timing: "immediate",
        target: {
          kind: "project_metric",
          metricKey: asMetricKey("budget"),
        },
        payload: {
          metricKey: asMetricKey("budget"),
          delta: metricDelta,
          reasonCode: "FIXTURE_BUDGET_DELTA",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_state`),
        type: "project_state_transition",
        timing: "immediate",
        target: { kind: "project_state" },
        payload: {
          nextStatus,
          reasonCode: "FIXTURE_STATE_TRANSITION",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_schedule`),
        type: "schedule_event",
        timing: "delayed",
        target: { kind: "scheduled_event" },
        payload: {
          delayMs: 3_600_000,
          reasonCode: "FIXTURE_DELAYED_REVIEW",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_learning`),
        type: "learning_signal",
        timing: "immediate",
        target: { kind: "learning_context" },
        payload: {
          signalType: "competency_delta",
          competencyKey: "scope_management",
          delta: 1,
          reasonCode: "FIXTURE_LEARNING",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_stakeholder`),
        type: "stakeholder_signal",
        timing: "immediate",
        target: {
          kind: "stakeholder_context",
          stakeholderId: asStakeholderId("stakeholder_sponsor"),
        },
        payload: {
          signalType: "sentiment_delta",
          stakeholderId: asStakeholderId("stakeholder_sponsor"),
          sentimentDelta: metricDelta > 0 ? 1 : -1,
          reasonCode: "FIXTURE_STAKEHOLDER",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_analytics`),
        type: "analytics_signal",
        timing: "immediate",
        target: { kind: "analytics_context" },
        payload: {
          signalType: "decision_resolved",
          dimension: "decision_count",
          value: 1,
          reasonCode: "FIXTURE_ANALYTICS",
        },
      },
      {
        id: asConsequenceDefinitionId(`${outcomeId}_learner_message`),
        type: "deliver_learner_message",
        timing: "immediate",
        target: { kind: "learner_message" },
        payload: {
          messageDefinitionId: asLearnerMessageDefinitionId(
            `${outcomeId}_msg_def`,
          ),
          definitionVersion: "1",
          sender: {
            senderId: "sender_project_office",
            displayName: "Project Office",
            roleLabel: "PMO",
          },
          subject: "Decision recorded",
          body: "Your decision has been recorded and related consequences were applied.",
        },
      },
    ],
  });

  return {
    id: decisionDefinitionId,
    contentPackageVersionId: input.contentPackageVersionId,
    options: [
      {
        id: optionA,
        decisionDefinitionId,
        outcome: outcomeFor("outcome_a", -10, "planning"),
      },
      {
        id: optionB,
        decisionDefinitionId,
        outcome: outcomeFor("outcome_b", 5, "planning"),
      },
    ],
    availability: input.availability ?? "available",
    prerequisiteDecisionIds: input.prerequisiteDecisionIds ?? [],
    requiredEvidenceDocumentIds: [],
    requiredEvidenceMeetingIds: [],
    requiredEvidenceMessageIds: [],
    requiredEvidenceActivityIds: [],
    chapterId: null,
    eligibilityCondition: null,
    expiresAt: input.expiresAt ?? null,
  };
};
