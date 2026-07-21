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

// ─── Authoritative decision-completion helpers ────────────────────────────
//
// Every UI surface (Mission Control, Inbox, Meetings, Dashboard, Decision
// Performance) must derive completion from these helpers so a decision
// appears exactly once and identically everywhere.
//
// Rules:
//   • state.log is the single source of truth for "a decision was made".
//   • An email is "done" only when its unlocksDecisionId is in the log.
//     Informational emails (no unlocksDecisionId) fall back to email.read
//     and are NEVER counted as decisions.
//   • A meeting is "done" only when its unlocksDecisionId is in the log.

export function answeredDecisionIds(state: SimState): Set<string> {
  return new Set(state.log.map((l) => l.decisionId));
}

export function isEmailCompleted(state: SimState, email: Email): boolean {
  if (email.unlocksDecisionId) {
    return answeredDecisionIds(state).has(email.unlocksDecisionId);
  }
  return !!email.read;
}

export function isMeetingCompleted(state: SimState, meeting: Meeting): boolean {
  return (
    !!meeting.unlocksDecisionId &&
    answeredDecisionIds(state).has(meeting.unlocksDecisionId)
  );
}

/** Decisions whose gating email is visible in the current chapter and are not yet answered. */
export function pendingVisibleDecisions(state: SimState): Decision[] {
  const answered = answeredDecisionIds(state);
  return visibleDecisions(state).filter((d) => !answered.has(d.id));
}

/** Decisions in the current chapter or earlier that the learner has answered. */
export function completedDecisions(state: SimState): Decision[] {
  const answered = answeredDecisionIds(state);
  return state.decisions.filter((d) => answered.has(d.id));
}
