// Stakeholder interaction engine: outcomes, metric impacts, and mastery deltas.

import type { MetricImpact } from "./types";
import type { MasteryUpdate } from "./mastery.functions";
import type {
  NegotiationInput,
  EscalationInput,
  InformationRequestInput,
  ExpectationManagementInput,
  FeedbackInput,
  PresentationInput,
  MeetingResponseInput,
} from "./stakeholder-interactions";
import {
  assessNegotiation,
  assessEscalation,
  assessFeedback,
} from "./stakeholder-interactions";
import type { SimPhase } from "./types";

export interface StakeholderInteractionOutcome {
  quality: "excellent" | "good" | "risky" | "poor";
  trustDelta: number;
  metricImpacts: MetricImpact;
  masteryImpacts: MasteryUpdate[];
  feedback: string;  // narrative for learner
  alternatives?: string[];  // better approaches
}

/**
 * Process negotiation interaction and compute outcome.
 */
export function processNegotiation(
  input: NegotiationInput,
  stakeholderPriorities: string[],
): StakeholderInteractionOutcome {
  const assessment = assessNegotiation(input, stakeholderPriorities);

  const metricImpacts: MetricImpact = {};
  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Negotiation",
      deltaXp: assessment.quality === "excellent" ? 20 : assessment.quality === "good" ? 12 : 5,
      noteTags: ["negotiation", input.subject],
    },
  ];

  // Metric impacts based on quality and subject
  if (assessment.quality === "excellent") {
    if (input.subject === "budget") metricImpacts.budget = 8;
    if (input.subject === "schedule") metricImpacts.schedule = 6;
    if (input.subject === "scope") metricImpacts.quality = 6;
    metricImpacts.trust = assessment.trustDelta;
    metricImpacts.morale = 5;
  } else if (assessment.quality === "good") {
    if (input.subject === "budget") metricImpacts.budget = 4;
    if (input.subject === "schedule") metricImpacts.schedule = 3;
    metricImpacts.trust = assessment.trustDelta;
    metricImpacts.morale = 2;
  } else if (assessment.quality === "risky") {
    metricImpacts.trust = 0;
    metricImpacts.satisfaction = -3;
  } else {
    metricImpacts.trust = assessment.trustDelta;
    metricImpacts.satisfaction = -8;
    metricImpacts.morale = -5;
  }

  const feedbackText =
    assessment.quality === "excellent"
      ? `Excellent negotiation. You acknowledged concerns and proposed balanced trade-offs. The stakeholder is satisfied.`
      : assessment.quality === "good"
        ? `Good negotiation. You proposed concrete solutions, though the stakeholder might have hoped for more.`
        : assessment.quality === "risky"
          ? `Your proposal lacked specificity. The stakeholder is uncertain about your commitment.`
          : `Poor negotiation. The stakeholder feels unheard. Consider their priorities before negotiating again.`;

  return {
    quality: assessment.quality,
    trustDelta: assessment.trustDelta,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
    alternatives:
      assessment.quality !== "excellent"
        ? [
            "Explicitly mention the stakeholder's top priorities.",
            "Propose 2-3 concrete concessions.",
            "State your non-negotiable constraints clearly.",
          ]
        : undefined,
  };
}

/**
 * Process escalation interaction and compute outcome.
 */
export function processEscalation(
  input: EscalationInput,
  phase: SimPhase,
): StakeholderInteractionOutcome {
  const assessment = assessEscalation(input, phase);

  const metricImpacts: MetricImpact = {};
  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Leadership",
      deltaXp: assessment.quality === "excellent" ? 15 : assessment.quality === "good" ? 10 : 5,
      noteTags: ["escalation", input.urgency],
    },
  ];

  if (assessment.quality === "excellent") {
    metricImpacts.risk = 8;  // issue now owned by higher level
    metricImpacts.trust = 10;
    metricImpacts.morale = 5;
  } else if (assessment.quality === "good") {
    metricImpacts.risk = 5;
    metricImpacts.trust = 5;
  } else if (assessment.quality === "risky") {
    metricImpacts.trust = -2;
    metricImpacts.satisfaction = -3;
  } else {
    metricImpacts.trust = -8;
    metricImpacts.satisfaction = -10;
  }

  const feedbackText =
    assessment.quality === "excellent"
      ? `Strong escalation. You documented prior actions and clearly stated risks. The escalation was accepted.`
      : assessment.quality === "good"
        ? `Good escalation. The issue is now escalated, though more evidence might have strengthened your case.`
        : assessment.quality === "risky"
          ? `The escalation was premature. Management wanted evidence of prior attempts.`
          : `Ineffective escalation. Without documented attempts, the issue was not taken seriously.`;

  return {
    quality: assessment.quality,
    trustDelta: assessment.trustDelta,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
    alternatives:
      assessment.quality !== "excellent"
        ? [
            "Document 2-3 specific actions you've already tried.",
            "Quantify the risk and business impact.",
            "Identify the right escalation recipient.",
          ]
        : undefined,
  };
}

/**
 * Process information request interaction.
 */
export function processInformationRequest(
  input: InformationRequestInput,
): StakeholderInteractionOutcome {
  const isUrgent = input.deadline === "asap" || input.deadline === "this_week";
  const quality = input.impactIfNotReceived.length > 50 ? "good" : "risky";

  const metricImpacts: MetricImpact = {
    trust: quality === "good" ? 4 : 0,
    morale: quality === "good" ? 2 : 0,
  };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Communication",
      deltaXp: quality === "good" ? 8 : 4,
      noteTags: ["information_request"],
    },
  ];

  const feedbackText =
    quality === "good"
      ? `Clear information request. You explained the business impact, so the stakeholder understands urgency.`
      : `Information request sent. You could strengthen future requests by explaining the impact more explicitly.`;

  return {
    quality: quality as "excellent" | "good" | "risky" | "poor",
    trustDelta: quality === "good" ? 4 : 0,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
  };
}

/**
 * Process expectation management interaction.
 */
export function processExpectationManagement(
  input: ExpectationManagementInput,
): StakeholderInteractionOutcome {
  const isProactive = input.followUpAction && input.followUpAction.length > 0;
  const quality = isProactive ? "good" : "risky";

  const metricImpacts: MetricImpact = {
    trust: quality === "good" ? 8 : 2,
    satisfaction: quality === "good" ? 6 : 0,
    morale: 3,
  };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Stakeholder Engagement",
      deltaXp: quality === "good" ? 10 : 6,
      noteTags: ["expectation_management"],
    },
  ];

  const feedbackText =
    quality === "good"
      ? `Proactive expectation management. You clarified misalignments and committed to follow-up actions. Stakeholder confidence increased.`
      : `You addressed the expectation gap. Follow-up actions will help maintain alignment.`;

  return {
    quality: quality as "excellent" | "good" | "risky" | "poor",
    trustDelta: quality === "good" ? 8 : 2,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
  };
}

/**
 * Process feedback interaction.
 */
export function processFeedback(
  input: FeedbackInput,
): StakeholderInteractionOutcome {
  const assessment = assessFeedback(input);

  const metricImpacts: MetricImpact = {
    trust: assessment.trustDelta,
    morale: assessment.quality === "excellent" ? 8 : assessment.quality === "good" ? 4 : 0,
  };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Emotional Intelligence",
      deltaXp: assessment.quality === "excellent" ? 15 : assessment.quality === "good" ? 10 : 5,
      noteTags: ["feedback", input.feedbackType],
    },
  ];

  const feedbackText =
    assessment.quality === "excellent"
      ? `Excellent feedback. You balanced constructive criticism with acknowledgment. The stakeholder feels valued.`
      : assessment.quality === "good"
        ? `Good feedback. You were specific and constructive, which helps the stakeholder improve.`
        : `Your feedback lacked specificity or constructiveness. Be clearer about what you observed and why it matters.`;

  return {
    quality: assessment.quality,
    trustDelta: assessment.trustDelta,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
  };
}

/**
 * Process presentation preparation interaction.
 */
export function processPresentation(
  input: PresentationInput,
): StakeholderInteractionOutcome {
  const hasData = input.supportingData.length >= 2;
  const hasClearObjective = input.objective.length > 20;
  const quality = hasData && hasClearObjective ? "good" : "risky";

  const metricImpacts: MetricImpact = {
    trust: quality === "good" ? 6 : 0,
    satisfaction: quality === "good" ? 4 : 0,
  };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Communication",
      deltaXp: quality === "good" ? 12 : 6,
      noteTags: ["presentation"],
    },
  ];

  const feedbackText =
    quality === "good"
      ? `Well-prepared presentation. You have clear objectives and supporting data. The audience will understand your position.`
      : `Presentation prepared. Gather more supporting data to strengthen your key message.`;

  return {
    quality: quality as "excellent" | "good" | "risky" | "poor",
    trustDelta: quality === "good" ? 6 : 0,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
  };
}

/**
 * Process meeting response interaction.
 */
export function processMeetingResponse(
  input: MeetingResponseInput,
): StakeholderInteractionOutcome {
  const hasStructuredResponse = input.responseType === "structured" && input.selectedOption;
  const hasWrittenResponse = input.responseType === "freeform" && (input.writtenResponse?.length ?? 0) > 20;
  const quality = hasStructuredResponse || hasWrittenResponse ? "good" : "risky";

  const metricImpacts: MetricImpact = {
    trust: quality === "good" ? 5 : 0,
    morale: quality === "good" ? 3 : -2,
  };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: "People — Communication",
      deltaXp: quality === "good" ? 8 : 4,
      noteTags: ["meeting_response"],
    },
  ];

  const feedbackText =
    quality === "good"
      ? `Good meeting response. You engaged thoughtfully with the stakeholder's points.`
      : `Your response was unclear. Be more direct and specific in future meeting interactions.`;

  return {
    quality: quality as "excellent" | "good" | "risky" | "poor",
    trustDelta: quality === "good" ? 5 : 0,
    metricImpacts,
    masteryImpacts,
    feedback: feedbackText,
  };
}
