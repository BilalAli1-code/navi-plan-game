// Chapter-gated visibility helpers (Blueprint §7.3).
//
// Single source of truth for the UI: given the learner's current chapter,
// which emails / meetings / decisions should be surfaced right now? Keeps
// chapter gating consistent across Inbox, Calendar, Decision panels and
// Mission Control so future-chapter content never leaks in.

import type { Decision, Email, Meeting, SimState } from "./types";
import { decisionMinChapter } from "./orchestrator";

function clampChapter(ch: number | undefined | null): number {
  const n = Math.round(ch ?? 1);
  return Math.max(1, Math.min(7, Number.isFinite(n) ? n : 1));
}

/** True when this decision is eligible to appear in the current chapter. */
export function isDecisionEligible(dec: Decision, currentChapter: number): boolean {
  return currentChapter >= decisionMinChapter(dec);
}

export function visibleDecisions(state: SimState): Decision[] {
  const ch = clampChapter(state.currentDay);
  return state.decisions.filter((d) => isDecisionEligible(d, ch));
}

/**
 * Emails/meetings tied to a future-chapter decision are hidden. Emails and
 * meetings not tied to any decision remain visible (they are pure narrative
 * beats and do not gate progression).
 */
export function visibleEmails(state: SimState): Email[] {
  const ch = clampChapter(state.currentDay);
  const byId = new Map(state.decisions.map((d) => [d.id, d]));
  return state.emails.filter((e) => {
    if (!e.unlocksDecisionId) return true;
    const dec = byId.get(e.unlocksDecisionId);
    return dec ? isDecisionEligible(dec, ch) : true;
  });
}

export function visibleMeetings(state: SimState): Meeting[] {
  const ch = clampChapter(state.currentDay);
  const byId = new Map(state.decisions.map((d) => [d.id, d]));
  return state.meetings.filter((m) => {
    if (!m.unlocksDecisionId) return true;
    const dec = byId.get(m.unlocksDecisionId);
    return dec ? isDecisionEligible(dec, ch) : true;
  });
}
