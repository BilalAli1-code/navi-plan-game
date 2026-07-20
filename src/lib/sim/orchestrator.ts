// Chapter/event orchestration (Blueprint §7.3 / §11).
//
// Pure helpers that decide (a) which seeded events should be locked vs
// available for the learner's current chapter, and (b) which Maya coaching
// triggers should fire in response to a just-committed decision. Kept
// generic — no case-specific branching lives here.

import { getChapter, type MayaTrigger } from "./days";
import type {
  Decision,
  DecisionOption,
  SimPhase,
  SimState,
} from "./types";
import type { EventInput } from "./events.functions";

// Minimum chapter a phase's content should surface in. Mirrors DAY_PLAN
// phases without hard-coding any business case.
export const PHASE_MIN_CHAPTER: Record<SimPhase, number> = {
  Tailoring: 1,
  Initiation: 1,
  Planning: 2,
  Execution: 4,
  Monitoring: 5,
  Closing: 7,
  Complete: 7,
};

export function decisionMinChapter(d: Pick<Decision, "phase">): number {
  return PHASE_MIN_CHAPTER[d.phase] ?? 1;
}

/**
 * Rewrite an event catalog so future-chapter items are `locked` and current
 * or past chapter items surface as `available` (unless the learner already
 * progressed them). Never regresses a status the store already advanced.
 */
export function applyChapterGates(
  events: EventInput[],
  currentChapter: number,
  decisions: Decision[],
): EventInput[] {
  const decIndex = new Map(decisions.map((d) => [d.id, d]));
  return events.map((e) => {
    // Only gate content tied to a specific decision (email/meeting/decision).
    const decId = e.relatedDecisionId ?? null;
    const dec = decId ? decIndex.get(decId) : undefined;
    if (!dec) return e;
    const min = decisionMinChapter(dec);
    const eligible = currentChapter >= min;
    // Preserve any already-advanced status; only downgrade "available" -> "locked"
    // when the chapter hasn't opened yet. If the learner has already viewed /
    // responded / completed, leave it alone (syncEvents also protects this).
    if (!eligible && (e.status === undefined || e.status === "available")) {
      return { ...e, status: "locked" as const };
    }
    if (eligible && e.status === "locked") {
      return { ...e, status: "available" as const };
    }
    return e;
  });
}

// ─── Maya trigger dispatcher ────────────────────────────────────────────────

export type MayaNudge = {
  id: string;                 // stable per (decisionId, trigger) so we don't spam
  trigger: MayaTrigger;
  title: string;
  message: string;
  severity: "info" | "warning" | "coaching";
};

const GUARANTEE_RX = /\b(guarantee|guaranteed|promise|commit to|will absolutely|no risk)\b/i;

/**
 * Given a just-committed decision and the resulting state, return the Maya
 * nudges that fit the current chapter's allowlist. The store enqueues these
 * as proactive coaching moments; UI decides how to surface them.
 */
export function evaluateMayaTriggers(input: {
  decision: Decision;
  option: DecisionOption;
  prevState: SimState;
  nextState: SimState;
  currentChapter: number;
}): MayaNudge[] {
  const { decision, option, prevState, nextState, currentChapter } = input;
  const chapter = getChapter(currentChapter);
  const allowed = new Set<MayaTrigger>(chapter.mayaTriggers ?? []);
  const nudges: MayaNudge[] = [];

  const emit = (n: MayaNudge) => {
    if (allowed.size === 0 || allowed.has(n.trigger)) nudges.push(n);
  };

  if (option.quality === "poor" || option.quality === "risky") {
    emit({
      id: `poor:${decision.id}`,
      trigger: "poor_decision_quality",
      severity: "coaching",
      title: "Maya wants a word",
      message: `That call in "${decision.title}" was ${option.quality}. ${option.consequence} — what would a PMBOK-aligned move look like next time?`,
    });
  }

  const text = `${option.label} ${option.rationale}`;
  if (GUARANTEE_RX.test(text)) {
    emit({
      id: `guarantee:${decision.id}`,
      trigger: "unsupported_guarantee",
      severity: "warning",
      title: "Careful with guarantees",
      message: `You made a hard promise in "${decision.title}". Guarantees to executives without data behind them tend to hurt trust when reality lands.`,
    });
  }

  const trustDrop = prevState.metrics.trust - nextState.metrics.trust;
  if (trustDrop >= 8) {
    emit({
      id: `trust:${decision.id}`,
      trigger: "stakeholder_relationship_degraded",
      severity: "warning",
      title: "Stakeholder trust took a hit",
      message: `Trust dropped ${Math.round(trustDrop)} points after "${decision.title}". Consider a proactive 1:1 with the most affected stakeholder before the next chapter closes.`,
    });
  }

  return nudges;
}
