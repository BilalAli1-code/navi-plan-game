// Stakeholder interaction types, schemas, and contextual availability rules.

import { z } from "zod";
import type { InteractionType } from "./actions";
import type { SimState, Stakeholder, SimPhase } from "./types";

// -------- Interaction-specific input types --------

export const NegotiationSubjectSchema = z.enum([
  "scope",
  "budget",
  "schedule",
  "resources",
  "contract_terms",
  "acceptance_criteria",
]);
export type NegotiationSubject = z.infer<typeof NegotiationSubjectSchema>;

export const NegotiationInputSchema = z.object({
  objective: z.string().min(10).max(500),
  stakeholderPosition: z.string().min(10).max(500),
  learnerPriorities: z.array(z.string().max(100)).min(1).max(5),
  availableConcessions: z.array(z.string().max(100)).min(1).max(5),
  nonNegotiableConstraints: z.array(z.string().max(100)).min(1).max(3),
  proposedResponse: z.string().min(20).max(1000),
  reasoning: z.string().max(500).optional(),
  subject: NegotiationSubjectSchema,
});
export type NegotiationInput = z.infer<typeof NegotiationInputSchema>;

export const EscalationInputSchema = z.object({
  issueBeing: z.string().min(10).max(300),
  whyEscalationNeeded: z.string().min(20).max(500),
  actionsAttempted: z.array(z.string().max(150)).min(1).max(5),
  requestedDecision: z.string().min(10).max(300),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  escalationRecipient: z.string().max(100),
  riskOfNotEscalating: z.string().max(300),
});
export type EscalationInput = z.infer<typeof EscalationInputSchema>;

export const InformationRequestInputSchema = z.object({
  informationNeeded: z.string().min(10).max(300),
  reason: z.string().min(10).max(400),
  requestedStakeholder: z.string().max(100),
  deadline: z.enum(["asap", "this_week", "this_month", "flexible"]),
  impactIfNotReceived: z.string().min(10).max(300),
});
export type InformationRequestInput = z.infer<typeof InformationRequestInputSchema>;

export const ExpectationManagementInputSchema = z.object({
  currentExpectation: z.string().min(10).max(300),
  misalignmentIdentified: z.string().min(20).max(400),
  proposedClarification: z.string().min(20).max(400),
  commitmentOrBoundary: z.string().min(10).max(300),
  followUpAction: z.string().max(200).optional(),
});
export type ExpectationManagementInput = z.infer<typeof ExpectationManagementInputSchema>;

export const FeedbackTypeSchema = z.enum(["giving", "requesting", "coaching", "corrective"]);
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;

export const FeedbackInputSchema = z.object({
  feedbackType: FeedbackTypeSchema,
  topic: z.string().min(10).max(300),
  specifics: z.string().min(20).max(800),
  suggestedImprovement: z.string().max(300).optional(),
  positiveAspect: z.string().max(200).optional(),
});
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

export const PresentationInputSchema = z.object({
  audience: z.string().max(200),
  objective: z.string().min(10).max(300),
  keyMessage: z.string().min(10).max(400),
  supportingData: z.array(z.string().max(150)).min(1).max(5),
  decisionRequested: z.string().max(300),
  risksAndTradeOffs: z.string().max(400),
});
export type PresentationInput = z.infer<typeof PresentationInputSchema>;

export const MeetingResponseInputSchema = z.object({
  meetingId: z.string().max(64),
  responseType: z.enum(["structured", "freeform"]),
  selectedOption: z.string().max(300).optional(),
  writtenResponse: z.string().max(1000).optional(),
});
export type MeetingResponseInput = z.infer<typeof MeetingResponseInputSchema>;

// -------- Contextual availability rules --------
// Determines which interaction types are available based on state & stakeholder

export interface InteractionAvailability {
  type: InteractionType;
  available: boolean;
  reason?: string;  // why unavailable
  priority?: "high" | "normal" | "low";  // suggested to learner
}

/**
 * Compute which interaction types should be offered for a stakeholder
 * in the current simulation state.
 */
export function getAvailableInteractions(
  state: SimState,
  stakeholder: Stakeholder,
): InteractionAvailability[] {
  const availability: InteractionAvailability[] = [];

  // Chat — always available
  availability.push({
    type: "chat",
    available: true,
    priority: "normal",
  });

  // Negotiation — available when there are unresolved disputes
  const hasDisputedMetrics = hasMetricDispute(state, stakeholder);
  availability.push({
    type: "negotiation",
    available: hasDisputedMetrics,
    priority: hasDisputedMetrics ? "high" : undefined,
    reason: !hasDisputedMetrics ? "No active disputes" : undefined,
  });

  // Escalation — available when there are unresolved issues & conditions met
  const escallationReady = isEscalationAppropriate(state, stakeholder);
  availability.push({
    type: "escalation",
    available: escallationReady,
    priority: escallationReady ? "high" : undefined,
    reason: !escallationReady ? "No escalation-worthy issues" : undefined,
  });

  // Information request — always available
  availability.push({
    type: "information_request",
    available: true,
    priority: "normal",
  });

  // Expectation management — available when stakeholder has expectations set
  availability.push({
    type: "expectation_management",
    available: true,
    priority: "normal",
  });

  // Feedback — always available
  availability.push({
    type: "feedback",
    available: true,
    priority: "normal",
  });

  // Presentation — available before high-visibility meetings
  const hasUpcomingPresentation = hasUpcomingMeeting(state, stakeholder);
  availability.push({
    type: "presentation",
    available: hasUpcomingPresentation,
    priority: hasUpcomingPresentation ? "high" : undefined,
    reason: !hasUpcomingPresentation ? "No upcoming presentations" : undefined,
  });

  // Meeting response — available during active meetings
  availability.push({
    type: "meeting_response",
    available: true,
    priority: "normal",
  });

  return availability;
}

/**
 * Check if there are metric disputes (scope, budget, schedule conflicts).
 */
function hasMetricDispute(state: SimState, _stakeholder: Stakeholder): boolean {
  // Heuristic: if any metric is below 50, there's likely a dispute
  return (
    state.metrics.budget < 50 ||
    state.metrics.schedule < 50 ||
    state.metrics.satisfaction < 50
  );
}

/**
 * Check if escalation is appropriate:
 * - unresolved issues exist
 * - trust is low or satisfaction is declining
 * - phase-specific escalation triggers
 */
function isEscalationAppropriate(state: SimState, _stakeholder: Stakeholder): boolean {
  const trustLow = state.metrics.trust < 40;
  const satisfactionLow = state.metrics.satisfaction < 35;
  const criticalPhase = ["Planning", "Execution", "Monitoring"].includes(state.phase);

  return (trustLow || satisfactionLow) && criticalPhase;
}

/**
 * Check if there's an upcoming presentation/meeting event.
 */
function hasUpcomingMeeting(state: SimState, stakeholder: Stakeholder): boolean {
  // Check if stakeholder is in any upcoming meetings
  return state.meetings.some((m) => m.attendees.includes(stakeholder.id));
}

// -------- Outcome assessment rules --------
// Server uses these to validate and score outcomes

export interface InteractionOutcomeAssessment {
  quality: "excellent" | "good" | "risky" | "poor";
  trustDelta: number;  // -20 to +20
  communicationEffectiveness: "poor" | "fair" | "good" | "excellent";
  insights: string[];  // coaching points for learner
}

/**
 * Score a negotiation outcome.
 * The engine must assess whether the learner's proposal balances interests.
 */
export function assessNegotiation(
  input: NegotiationInput,
  stakeholderPriorities: string[],
): InteractionOutcomeAssessment {
  // Heuristic: good negotiation shows understanding of stakeholder priorities
  // and proposes reasonable trade-offs.
  const mentionsStakeholderConcern = stakeholderPriorities.some((p) =>
    input.proposedResponse.toLowerCase().includes(p.toLowerCase()),
  );

  const hasConcreteProposal = input.availableConcessions.length > 0;
  const respectsConstraints = input.nonNegotiableConstraints.length > 0;

  let quality: "excellent" | "good" | "risky" | "poor";
  let trustDelta = 0;

  if (mentionsStakeholderConcern && hasConcreteProposal && respectsConstraints) {
    quality = "excellent";
    trustDelta = 12;
  } else if (hasConcreteProposal && respectsConstraints) {
    quality = "good";
    trustDelta = 6;
  } else if (hasConcreteProposal) {
    quality = "risky";
    trustDelta = 0;
  } else {
    quality = "poor";
    trustDelta = -10;
  }

  return {
    quality,
    trustDelta,
    communicationEffectiveness:
      quality === "excellent" ? "excellent" : quality === "good" ? "good" : "fair",
    insights: [
      mentionsStakeholderConcern
        ? "You acknowledged the stakeholder's concerns."
        : "Consider explicitly addressing stakeholder priorities.",
      `You offered ${input.availableConcessions.length} concession(s).`,
    ],
  };
}

/**
 * Score an escalation outcome.
 * Engine checks: appropriate timing, correct recipient, supporting facts.
 */
export function assessEscalation(
  input: EscalationInput,
  _phase: SimPhase,
): InteractionOutcomeAssessment {
  const hasAttemptedActions = input.actionsAttempted.length >= 2;
  const hasRiskStatement = input.riskOfNotEscalating.length > 20;
  const urgencyAlignedWithPriority =
    input.urgency === "critical" || input.urgency === "high";

  let quality: "excellent" | "good" | "risky" | "poor";
  let trustDelta = 0;

  if (hasAttemptedActions && hasRiskStatement && urgencyAlignedWithPriority) {
    quality = "excellent";
    trustDelta = 8;
  } else if (hasAttemptedActions && hasRiskStatement) {
    quality = "good";
    trustDelta = 5;
  } else if (hasAttemptedActions) {
    quality = "risky";
    trustDelta = 0;
  } else {
    quality = "poor";
    trustDelta = -8;
  }

  return {
    quality,
    trustDelta,
    communicationEffectiveness:
      quality === "excellent" ? "excellent" : quality === "good" ? "good" : "fair",
    insights: [
      hasAttemptedActions
        ? `You documented ${input.actionsAttempted.length} prior actions.`
        : "Document specific prior attempts before escalating.",
      urgencyAlignedWithPriority
        ? "Urgency level is appropriate."
        : "Consider raising urgency for critical issues.",
    ],
  };
}

/**
 * Score feedback outcome.
 * Engine checks: constructiveness, specificity, balance of positive/corrective.
 */
export function assessFeedback(
  input: FeedbackInput,
): InteractionOutcomeAssessment {
  const isConstructive = input.feedbackType === "coaching" || input.feedbackType === "corrective";
  const isBalanced = input.feedbackType === "coaching" && input.positiveAspect;
  const isSpecific = input.specifics.length > 30;

  let quality: "excellent" | "good" | "risky" | "poor";
  let trustDelta = 0;

  if (isConstructive && isBalanced && isSpecific) {
    quality = "excellent";
    trustDelta = 10;
  } else if (isConstructive && isSpecific) {
    quality = "good";
    trustDelta = 6;
  } else if (isConstructive) {
    quality = "risky";
    trustDelta = 0;
  } else {
    quality = "poor";
    trustDelta = -5;
  }

  return {
    quality,
    trustDelta,
    communicationEffectiveness:
      quality === "excellent" ? "excellent" : quality === "good" ? "good" : "fair",
    insights: [
      isBalanced ? "Balanced feedback builds stronger relationships." : "",
      isSpecific ? "Specific examples strengthen your feedback." : "",
    ].filter(Boolean),
  };
}

// -------- Chapter-aware engagement --------
// Which stakeholders are "in the spotlight" for a given chapter. Anyone
// missing from the primary set is still fully chattable — they just aren't
// pushed forward on the Stakeholders / Mission Control surfaces.

const CHAPTER_PRIMARY_STAKEHOLDERS: Record<number, string[]> = {
  1: ["sponsor", "customer", "team-lead", "vendor"],
  2: ["sponsor", "customer", "team-lead", "risk-officer"],
  3: ["sponsor", "vendor", "risk-officer", "team-lead"],
  4: ["team-lead", "customer", "vendor"],
  5: ["sponsor", "risk-officer", "team-lead"],
  6: ["sponsor", "customer", "team-lead", "vendor"],
  7: ["sponsor", "customer", "risk-officer"],
};

export type StakeholderEngagement = "primary" | "supporting" | "quiet";

export function stakeholderEngagementForChapter(
  stakeholderId: string,
  chapter: number,
): StakeholderEngagement {
  const primary = CHAPTER_PRIMARY_STAKEHOLDERS[chapter] ?? [];
  if (primary.includes(stakeholderId)) return "primary";
  // Sponsor and team-lead are always at least supporting.
  if (stakeholderId === "sponsor" || stakeholderId === "team-lead") return "supporting";
  return "quiet";
}

