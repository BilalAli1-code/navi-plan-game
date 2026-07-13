// Canonical mastery topic keys + score helpers. Keeping labels stable is what
// makes learner_mastery a real longitudinal record — do not re-word these
// after the fact. New topics are additive.
//
// Topic naming convention: "<PMBOK Domain> — <Focus>" so the label reads
// naturally in the competency dashboard.

import type { Decision, DecisionOption, EcoDomain, SimPhase } from "./types";

export type MasteryTopicKey = string;

export type MasteryDelta = {
  topic: MasteryTopicKey;
  score: number; // 0-100
  pmbokDomain?: string | null;
  pmbokPrinciple?: string | null;
  ecoDomain?: EcoDomain | string | null;
  competency?: string | null;
  difficulty?: "easy" | "medium" | "hard" | null;
};

export const QUALITY_TO_SCORE: Record<DecisionOption["quality"], number> = {
  excellent: 95,
  good: 75,
  risky: 40,
  poor: 15,
};

export function decisionTopic(decision: Decision): MasteryTopicKey {
  return `${decision.pmbokDomain} — ${decision.ecoDomain}`;
}

export function decisionMasteryDelta(
  decision: Decision,
  option: DecisionOption,
): MasteryDelta {
  return {
    topic: decisionTopic(decision),
    score: QUALITY_TO_SCORE[option.quality] ?? 50,
    pmbokDomain: decision.pmbokDomain,
    pmbokPrinciple: option.pmiPrinciple,
    ecoDomain: decision.ecoDomain,
    competency: decision.ecoTask,
    difficulty: option.quality === "excellent" ? "hard" : "medium",
  };
}

export function tailoringMasteryDelta(scorePercent: number): MasteryDelta {
  return {
    topic: "Tailoring — Development Approach",
    score: Math.max(0, Math.min(100, Math.round(scorePercent))),
    pmbokDomain: "Development Approach & Life Cycle",
    pmbokPrinciple: "Tailor based on context",
    ecoDomain: "Process",
    competency: "Tailoring the delivery approach",
    difficulty: "medium",
  };
}

export function reflectionMasteryDelta(charCount: number): MasteryDelta {
  const score = charCount >= 400 ? 80 : charCount >= 200 ? 65 : 45;
  return {
    topic: "Professional Practice — Reflection",
    score,
    pmbokDomain: "Team",
    pmbokPrinciple: "Foster continuous learning",
    ecoDomain: "People",
    competency: "Reflective practice",
    difficulty: "easy",
  };
}

export function dayCompletionMasteryDelta(
  day: number,
  phase: SimPhase,
): MasteryDelta {
  return {
    topic: `Program — Day ${day} (${phase})`,
    score: 80,
    pmbokDomain: phase,
    pmbokPrinciple: "Consistent daily practice",
    ecoDomain: "Process",
    competency: `Day ${day} completion`,
    difficulty: "medium",
  };
}

export function finalAssessmentMasteryDelta(overall: number): MasteryDelta {
  return {
    topic: "Program — Final Assessment",
    score: Math.max(0, Math.min(100, Math.round(overall))),
    pmbokDomain: "Overall",
    pmbokPrinciple: "PMI mindset",
    ecoDomain: "Business Environment",
    competency: "Integrated project management",
    difficulty: "hard",
  };
}
