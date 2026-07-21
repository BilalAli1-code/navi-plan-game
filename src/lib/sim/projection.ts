// Engine-generated projection layer (Blueprint §7.3 / SSOT Architecture).
//
// buildSimProjection() is the ONLY place allowed to compute derived UI values
// from canonical simulation state. Every UI surface must read these values
// from the store projection rather than recomputing them inline.
//
// Contract: (SimState, DailyProgressRow[]) → SimProjection (pure, no side-effects)

import type { DecisionLogEntry, SimState } from "./types";
import type { DailyProgressRow } from "./daily.functions";
import { TOTAL_MINUTES, TOTAL_DAYS } from "./days";
import { visibleDecisions, completedDecisions } from "./visibility";

// ─── XP Tier definition ──────────────────────────────────────────────────────

export type XPTier = {
  label: string;
  xp: number;
};

export const XP_TIERS: XPTier[] = [
  { label: "PM Initiate", xp: 0 },
  { label: "PM Associate", xp: 100 },
  { label: "PM Professional", xp: 250 },
  { label: "PM Expert", xp: 500 },
  { label: "PM Master", xp: 1000 },
];

// ─── Projection types ────────────────────────────────────────────────────────

export type DecisionProjection = {
  /** All decisions answered by the learner (across all chapters). */
  total: number;
  /** Correct (PMI-aligned) decisions. */
  correct: number;
  /** Decision accuracy 0–100. */
  accuracy: number;
  /** Counts by quality rating. */
  byQuality: { excellent: number; good: number; risky: number; poor: number };
  /** Last 3 log entries, newest first. */
  recent: DecisionLogEntry[];
  /** Total visible decisions for current chapter (used by progress bars). */
  visible: number;
  /** Visible decisions not yet answered. */
  pending: number;
};

export type ProgressProjection = {
  /** 0–100 overall completion percentage, derived from completed_minutes / TOTAL_MINUTES. */
  overallPct: number;
  /** How many days have status "completed". */
  daysDone: number;
  /** Sum of completed_minutes across all daily_progress rows. */
  totalCompletedMinutes: number;
};

export type XPProjection = {
  current: number;
  currentTier: XPTier;
  nextTier: XPTier | null;
  /** Points still needed to reach next tier (0 when at max). */
  toNext: number;
  /** Progress to next tier 0–100. */
  tierProgressPct: number;
};

export type AchievementEntry = {
  label: string;
  earned: boolean;
};

export type SimProjection = {
  decisions: DecisionProjection;
  progress: ProgressProjection;
  xp: XPProjection;
  achievements: AchievementEntry[];
};

// ─── Pure projection builder ─────────────────────────────────────────────────

export function buildSimProjection(
  state: SimState,
  days: DailyProgressRow[],
): SimProjection {
  // ── Decisions ──
  const log = state.log ?? [];
  const total = log.length;
  const correct = log.filter((l) => l.correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const byQuality = {
    excellent: log.filter((l) => l.quality === "excellent").length,
    good: log.filter((l) => l.quality === "good").length,
    risky: log.filter((l) => l.quality === "risky").length,
    poor: log.filter((l) => l.quality === "poor").length,
  };
  const recent = [...log].reverse().slice(0, 3);

  const visibleDecisionsList = visibleDecisions(state);
  const completedDecisionsList = completedDecisions(state);
  const visible = visibleDecisionsList.length;
  const pending = visible - completedDecisionsList.length;

  // ── Progress ──
  const totalCompletedMinutes = days.reduce(
    (sum, d) => sum + (d.completed_minutes ?? 0),
    0,
  );
  const overallPct = Math.round((totalCompletedMinutes / TOTAL_MINUTES) * 100);
  const daysDone = days.filter((d) => d.status === "completed").length;

  // ── XP ──
  const xp = state.xp ?? 0;
  const currentTier = XP_TIERS.filter((t) => xp >= t.xp).at(-1) ?? XP_TIERS[0];
  const nextTier = XP_TIERS.find((t) => t.xp > xp) ?? null;
  const toNext = nextTier ? nextTier.xp - xp : 0;
  const tierProgressPct = nextTier
    ? Math.round(((xp - currentTier.xp) / (nextTier.xp - currentTier.xp)) * 100)
    : 100;

  // ── Achievements ──
  const achievements: AchievementEntry[] = [
    { label: "First Decision", earned: total >= 1 },
    { label: "5 Decisions", earned: total >= 5 },
    { label: "Approach Chosen", earned: !!state.approach },
    {
      label: "Phase 3+",
      earned: ["Planning", "Execution", "Monitoring", "Closing", "Complete"].includes(
        state.phase,
      ),
    },
    { label: "25% Progress", earned: overallPct >= 25 },
    { label: "50% Progress", earned: overallPct >= 50 },
  ];

  return {
    decisions: { total, correct, accuracy, byQuality, recent, visible, pending },
    progress: { overallPct, daysDone, totalCompletedMinutes },
    xp: { current: xp, currentTier, nextTier, toNext, tierProgressPct },
    achievements,
  };
}

export { TOTAL_DAYS };
