// Deterministic, pure outcome rules for first-class engine actions.
// This file has NO server or DB dependencies so it can be unit-tested and
// so the server function stays a thin orchestration layer.
//
// Contract: (validated input, trusted state slice, catalog entry) →
//           ActionOutcome (metric deltas, mastery deltas, delayed events).

import {
  MASTERY_TOPICS,
  type ActionInput,
  type ActionOutcome,
  type ConflictManagementInput,
  type DelayedEvent,
  type OutcomeQuality,
  type RiskResponseInput,
  type StakeholderInteractionInput,
} from "./actions";
import type { MasteryUpdate } from "./mastery.functions";
import type { MetricImpact, Stakeholder } from "./types";
import type { ConflictCase, RiskCase } from "./risks";

// ---------------- Shared helpers ----------------
const clamp = (n: number, lo = -20, hi = 20) => Math.max(lo, Math.min(hi, n));

function qualityFromScore(score: number): OutcomeQuality {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 35) return "risky";
  return "poor";
}

function scoreToMastery(quality: OutcomeQuality): number {
  return { excellent: 95, good: 75, risky: 40, poor: 15 }[quality];
}

// ---------------- Stakeholder interaction ----------------
// Rules (deterministic heuristic — no LLM in the authoritative path):
//   - Base sentiment defaults to stakeholder-specific baseline (60).
//   - Message quality is scored on:
//       * message length (empty → -30, terse < 20 chars → -10, thorough ≥ 60 → +10)
//       * hits on any of the stakeholder's priorities (+8 each, capped at +20)
//       * negative markers ("no", "cannot", "won't", "impossible") → -8
//       * escalation keyword usage when interactionType != "escalation" → -5
//       * empathy words ("understand", "appreciate", "hear you") → +6
//   - Interaction-type multiplier: negotiation & escalation are higher-stakes
//     (multiply delta 1.4x), information_request is lower-stakes (0.7x).
export function computeStakeholderOutcome(
  input: StakeholderInteractionInput,
  stakeholder: Stakeholder,
  currentTrust: number,
): ActionOutcome {
  const message = (input.learnerMessage ?? input.selectedResponse ?? "").trim();
  const lower = message.toLowerCase();

  let raw = 55;
  if (message.length === 0) raw -= 30;
  else if (message.length < 20) raw -= 10;
  else if (message.length >= 60) raw += 10;

  let hits = 0;
  for (const p of stakeholder.priorities) {
    if (lower.includes(p.toLowerCase().split(" ")[0])) hits += 1;
  }
  raw += Math.min(hits, 3) * 8;

  const negatives = ["no way", "won't", "can't", "impossible", "not my problem"];
  if (negatives.some((n) => lower.includes(n))) raw -= 8;

  const empathy = ["understand", "appreciate", "hear you", "recognize"];
  if (empathy.some((n) => lower.includes(n))) raw += 6;

  if (
    lower.includes("escalate") &&
    input.interactionType !== "escalation"
  )
    raw -= 5;

  // Type multiplier around the *delta* from neutral (55).
  const multMap: Record<StakeholderInteractionInput["interactionType"], number> = {
    chat: 1.0,
    meeting_response: 1.1,
    negotiation: 1.4,
    escalation: 1.4,
    information_request: 0.7,
    expectation_management: 1.2,
    feedback: 1.1,
    presentation: 1.2,
  };
  const delta = (raw - 55) * multMap[input.interactionType];
  const score = Math.max(0, Math.min(100, Math.round(55 + delta)));
  const quality = qualityFromScore(score);

  // Trust impact (bounded ±10).
  const trustDelta = clamp(
    ({ excellent: 6, good: 3, risky: -3, poor: -8 } as const)[quality],
    -10,
    10,
  );
  const sentimentAfter = Math.max(0, Math.min(100, currentTrust + trustDelta));

  const metricImpacts: MetricImpact = { trust: trustDelta };
  // Sponsor-specific: bad executive comms also dings satisfaction.
  if (stakeholder.id === "sponsor" && quality === "poor") {
    metricImpacts.satisfaction = -5;
  }

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: MASTERY_TOPICS.communication,
      score: scoreToMastery(quality),
      pmbokDomain: "Stakeholders",
      pmbokPrinciple: "Engage stakeholders effectively",
      ecoDomain: "People",
      competency: "Stakeholder communication",
      difficulty: "medium",
    },
    {
      topic: MASTERY_TOPICS.stakeholderEngagement,
      score: scoreToMastery(quality),
      pmbokDomain: "Stakeholders",
      pmbokPrinciple: "Meaningful engagement",
      ecoDomain: "People",
      competency: "Stakeholder engagement",
      difficulty: "medium",
    },
  ];
  if (input.interactionType === "negotiation") {
    masteryImpacts.push({
      topic: MASTERY_TOPICS.negotiation,
      score: scoreToMastery(quality),
      pmbokDomain: "Stakeholders",
      pmbokPrinciple: "Principled negotiation",
      ecoDomain: "People",
      competency: "Negotiation",
      difficulty: "hard",
    });
  }
  if (
    input.interactionType === "feedback" ||
    input.interactionType === "expectation_management"
  ) {
    masteryImpacts.push({
      topic: MASTERY_TOPICS.emotionalIntelligence,
      score: scoreToMastery(quality),
      pmbokDomain: "Team",
      pmbokPrinciple: "Emotional intelligence",
      ecoDomain: "People",
      competency: "EI in feedback",
      difficulty: "medium",
    });
  }

  const delayedEvents: DelayedEvent[] = [];
  if (sentimentAfter < 40 && stakeholder.id === "sponsor") {
    delayedEvents.push({
      eventKey: `sponsor_escalation:${input.runId}:${input.sectionNumber}`,
      eventType: "issue",
      priority: "urgent",
      dayOffset: 1,
      payload: {
        source: "stakeholder_interaction",
        stakeholderId: stakeholder.id,
        title: "Sponsor escalation follow-up",
        description:
          "Sponsor trust dropped after a difficult conversation. Expect an executive review request tomorrow.",
      },
    });
  }

  return {
    quality,
    outcomeData: {
      score,
      stakeholderSentimentBefore: currentTrust,
      stakeholderSentimentAfter: sentimentAfter,
      trustImpact: trustDelta,
      messageLength: message.length,
      priorityHits: hits,
    },
    metricImpacts,
    masteryImpacts,
    pmbokMapping: {
      domain: "Stakeholders",
      process: "10.4 Monitor Stakeholder Engagement",
    },
    ecoMapping: {
      domain: "People",
      task: "P-1.9 Collaborate with stakeholders",
    },
    delayedEvents,
    actionKey: `stakeholder:${stakeholder.id}:${input.interactionType}:${Date.now()}`,
    subjectId: stakeholder.id,
  };
}

// ---------------- Risk response ----------------
export function computeRiskResponseOutcome(
  input: RiskResponseInput,
  risk: RiskCase,
): ActionOutcome {
  const matches = input.responseStrategy === risk.correctStrategy;
  let quality: OutcomeQuality;
  if (matches && input.ownerAssigned && input.contingencyDefined) quality = "excellent";
  else if (matches) quality = "good";
  else if (
    risk.acceptableStrategies?.includes(input.responseStrategy as never)
  )
    quality = "risky";
  else quality = "poor";

  // Metric shape: risk score up when we handle well, morale small nudge.
  const riskDelta = ({ excellent: 10, good: 6, risky: -3, poor: -10 } as const)[
    quality
  ];
  const trustDelta = ({ excellent: 3, good: 2, risky: 0, poor: -3 } as const)[
    quality
  ];
  const metricImpacts: MetricImpact = { risk: riskDelta, trust: trustDelta };
  if (input.ownerAssigned) metricImpacts.morale = (metricImpacts.morale ?? 0) + 1;

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: MASTERY_TOPICS.riskResponse,
      score: scoreToMastery(quality),
      pmbokDomain: "Uncertainty",
      pmbokPrinciple: "Optimize risk responses",
      ecoDomain: "Process",
      competency: `${risk.riskType} response`,
      difficulty: "hard",
    },
    {
      topic: MASTERY_TOPICS.riskAnalysis,
      score: matches ? 80 : 40,
      pmbokDomain: "Uncertainty",
      pmbokPrinciple: "Analyze risk exposure",
      ecoDomain: "Process",
      competency: "Qualitative + strategy fit",
      difficulty: "medium",
    },
  ];
  if ((input.reasoning ?? "").length >= 80) {
    masteryImpacts.push({
      topic: MASTERY_TOPICS.riskIdentification,
      score: 75,
      pmbokDomain: "Uncertainty",
      pmbokPrinciple: "Continuous identification",
      ecoDomain: "Process",
      competency: "Articulate triggers & causes",
      difficulty: "medium",
    });
  }

  const delayedEvents: DelayedEvent[] = [];
  if (quality === "poor") {
    delayedEvents.push({
      eventKey: `risk_realized:${input.runId}:${risk.id}`,
      eventType: "issue",
      priority: "high",
      dayOffset: 2,
      payload: {
        source: "risk_response",
        riskId: risk.id,
        title: `Risk realized: ${risk.title}`,
        description: `Weak ${input.responseStrategy} response allowed "${risk.title}" to materialize.`,
        expectedImpact: risk.realizedImpact,
      },
    });
  } else if (quality === "excellent") {
    delayedEvents.push({
      eventKey: `risk_contained:${input.runId}:${risk.id}`,
      eventType: "notification",
      priority: "low",
      dayOffset: 1,
      payload: {
        source: "risk_response",
        riskId: risk.id,
        title: `Risk contained: ${risk.title}`,
        description: "Owner reports the mitigation is on track.",
      },
    });
  }

  return {
    quality,
    outcomeData: {
      matchedRecommended: matches,
      residualRisk: input.residualRisk ?? (matches ? 20 : 60),
      ownerAssigned: input.ownerAssigned ?? null,
      contingencyDefined: !!input.contingencyDefined,
    },
    metricImpacts,
    masteryImpacts,
    pmbokMapping: risk.pmbokMapping,
    ecoMapping: risk.ecoMapping,
    delayedEvents,
    actionKey: `risk:${risk.id}`,
    subjectId: risk.id,
  };
}

// ---------------- Conflict management ----------------
export function computeConflictOutcome(
  input: ConflictManagementInput,
  conflict: ConflictCase,
): ActionOutcome {
  const matches = input.selectedTechnique === conflict.correctTechnique;
  const acceptable = conflict.acceptableTechniques?.includes(input.selectedTechnique);
  const quality: OutcomeQuality = matches
    ? "excellent"
    : acceptable
      ? "good"
      : input.selectedTechnique === "Withdraw / avoid"
        ? "poor"
        : "risky";

  const moraleDelta = ({ excellent: 6, good: 2, risky: -3, poor: -8 } as const)[
    quality
  ];
  const trustDelta = ({ excellent: 4, good: 1, risky: -2, poor: -5 } as const)[
    quality
  ];
  const metricImpacts: MetricImpact = { morale: moraleDelta, trust: trustDelta };

  const masteryImpacts: MasteryUpdate[] = [
    {
      topic: MASTERY_TOPICS.conflictManagement,
      score: scoreToMastery(quality),
      pmbokDomain: "Team",
      pmbokPrinciple: "Manage conflict constructively",
      ecoDomain: "People",
      competency: input.selectedTechnique,
      difficulty: "hard",
    },
    {
      topic: MASTERY_TOPICS.leadership,
      score: scoreToMastery(quality),
      pmbokDomain: "Team",
      pmbokPrinciple: "Lead with situational awareness",
      ecoDomain: "People",
      competency: "Team leadership",
      difficulty: "medium",
    },
    {
      topic: MASTERY_TOPICS.emotionalIntelligence,
      score: scoreToMastery(quality),
      pmbokDomain: "Team",
      pmbokPrinciple: "Emotional intelligence",
      ecoDomain: "People",
      competency: "EI in conflict",
      difficulty: "medium",
    },
  ];

  const delayedEvents: DelayedEvent[] = [];
  if (input.selectedTechnique === "Withdraw / avoid") {
    delayedEvents.push({
      eventKey: `conflict_relapse:${input.runId}:${conflict.id}`,
      eventType: "issue",
      priority: "high",
      dayOffset: 2,
      payload: {
        source: "conflict_management",
        conflictId: conflict.id,
        title: `Team productivity drop from unresolved conflict`,
        description:
          "The conflict you avoided resurfaced as missed commitments and reduced velocity.",
      },
    });
  }
  if (quality === "excellent") {
    delayedEvents.push({
      eventKey: `conflict_resolved:${input.runId}:${conflict.id}`,
      eventType: "notification",
      priority: "low",
      dayOffset: 1,
      payload: {
        source: "conflict_management",
        conflictId: conflict.id,
        title: "Team dynamic improved",
        description: `Parties reported feeling heard after the ${input.selectedTechnique} approach.`,
      },
    });
  }

  return {
    quality,
    outcomeData: {
      matchedRecommended: matches,
      escalationImpact: quality === "poor" ? "high" : quality === "risky" ? "medium" : "low",
      moraleImpact: moraleDelta,
      trustImpact: trustDelta,
    },
    metricImpacts,
    masteryImpacts,
    pmbokMapping: conflict.pmbokMapping,
    ecoMapping: conflict.ecoMapping,
    delayedEvents,
    actionKey: `conflict:${conflict.id}`,
    subjectId: conflict.id,
  };
}

// ---------------- Top-level dispatcher (pure) ----------------
export function computeActionOutcome(args: {
  input: ActionInput;
  stakeholder?: Stakeholder;
  currentTrust?: number;
  risk?: RiskCase;
  conflict?: ConflictCase;
}): ActionOutcome {
  const { input } = args;
  if (input.actionType === "stakeholder_interaction") {
    if (!args.stakeholder) throw new Error("stakeholder is required");
    return computeStakeholderOutcome(input, args.stakeholder, args.currentTrust ?? 60);
  }
  if (input.actionType === "risk_response") {
    if (!args.risk) throw new Error("risk case is required");
    return computeRiskResponseOutcome(input, args.risk);
  }
  if (!args.conflict) throw new Error("conflict case is required");
  return computeConflictOutcome(input, args.conflict);
}
