// Configuration-driven Chapter Contract helpers (Blueprint §7.2, §7.3, §11.3).
//
// These functions are the ONLY place engine code should reason about whether
// a chapter can advance or an event is eligible to fire. Every business case
// expresses its rules declaratively on ChapterDefinition; no per-case
// branching lives here.

import {
  REQUIRED_ACTIVITIES,
  getChapter,
  type ChapterDefinition,
  type ChapterProgressContext,
  type DayActivityKey,
} from "./days";
import type { SimPhase, SimState } from "./types";

export type ChapterStatus = "locked" | "available" | "active" | "complete";

export type AdvanceCheck =
  | { canAdvance: true }
  | { canAdvance: false; reasons: string[] };

/**
 * Deterministically decide whether the learner can close a chapter, based on
 * the chapter's own `advanceRule`. Defaults to requiring every activity in
 * REQUIRED_ACTIVITIES.
 */
export function canAdvanceChapter(
  chapter: ChapterDefinition,
  ctx: ChapterProgressContext,
): AdvanceCheck {
  const rule = chapter.advanceRule ?? {};
  const reasons: string[] = [];

  const requiredActs: DayActivityKey[] =
    rule.requiredActivities ?? REQUIRED_ACTIVITIES;
  for (const a of requiredActs) {
    if (!ctx.activityFlags[a]) reasons.push(`Activity not complete: ${a}`);
  }

  for (const id of rule.requiredDecisionIds ?? []) {
    const matched = Array.from(ctx.decisionIdsLogged).some(
      (logged) => logged === id || logged.endsWith(id),
    );
    if (!matched) reasons.push(`Decision required: ${id}`);
  }

  for (const kind of rule.requiredOutputKinds ?? []) {
    if (!ctx.documentKindsPresent.has(kind)) {
      reasons.push(`Output required: ${kind}`);
    }
  }

  return reasons.length === 0
    ? { canAdvance: true }
    : { canAdvance: false, reasons };
}

/**
 * Event gate carried on any seeded email / meeting / decision / risk.
 * Undefined fields = no constraint. All conditions must pass.
 */
export type EventGate = {
  chapter?: number;                        // exact chapter
  minChapter?: number;                     // >=
  phase?: SimPhase;                        // must match current phase
  requiresPriorDecisionIds?: string[];     // all must be logged
  requiresMetricAtMost?: Partial<Record<keyof SimState["metrics"], number>>;
  requiresMetricAtLeast?: Partial<Record<keyof SimState["metrics"], number>>;
};

export function isEventEligible(
  gate: EventGate | undefined,
  state: SimState,
  currentChapter: number,
): boolean {
  if (!gate) return true;

  if (gate.chapter !== undefined && gate.chapter !== currentChapter) return false;
  if (gate.minChapter !== undefined && currentChapter < gate.minChapter) return false;
  if (gate.phase !== undefined && gate.phase !== state.phase) return false;

  const loggedIds = new Set(state.log.map((l) => l.decisionId));
  for (const id of gate.requiresPriorDecisionIds ?? []) {
    const ok = Array.from(loggedIds).some((x) => x === id || x.endsWith(id));
    if (!ok) return false;
  }

  for (const [k, v] of Object.entries(gate.requiresMetricAtMost ?? {})) {
    if ((state.metrics[k as keyof SimState["metrics"]] ?? 0) > (v as number)) return false;
  }
  for (const [k, v] of Object.entries(gate.requiresMetricAtLeast ?? {})) {
    if ((state.metrics[k as keyof SimState["metrics"]] ?? 0) < (v as number)) return false;
  }
  return true;
}

/**
 * Derive a chapter's status from persisted progress. `progressByChapter`
 * maps chapter number -> whether it is marked complete (activities/decisions
 * satisfied server-side).
 */
export function deriveChapterStatuses(
  currentChapter: number,
  completedChapters: Set<number>,
): Record<number, ChapterStatus> {
  const out: Record<number, ChapterStatus> = {};
  let earliestOpen = 1;
  for (let ch = 1; ch <= 7; ch += 1) {
    if (completedChapters.has(ch)) {
      out[ch] = "complete";
    } else {
      earliestOpen = ch;
      break;
    }
  }
  for (let ch = earliestOpen; ch <= 7; ch += 1) {
    if (out[ch]) continue;
    if (ch === earliestOpen) out[ch] = "available";
    else out[ch] = "locked";
  }
  if (out[currentChapter] === "available") out[currentChapter] = "active";
  return out;
}

/**
 * Convenience: read chapter in-world time span for display.
 */
export function chapterTimeLabel(chapter: number): string {
  const c = getChapter(chapter);
  if (!c.inWorldStart && !c.inWorldEnd) return "";
  if (c.inWorldStart === c.inWorldEnd) return c.inWorldStart ?? "";
  return `${c.inWorldStart ?? ""} – ${c.inWorldEnd ?? ""}`;
}
