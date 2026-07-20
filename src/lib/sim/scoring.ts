// Communication vs decision vs stakeholder scoring split (Blueprint §9.2).
//
// Pure, engine-generic. Casepacks do NOT branch here — they only supply
// weights via ChapterDefinition.scoringEmphasis when they want to nudge
// the aggregate.

import type { ChapterDefinition } from "./days";

export type ScoreDimension = "communication" | "decision" | "stakeholder";

export type ScoreSample = {
  dimension: ScoreDimension;
  /** 0..100 for this single sample. */
  score: number;
  /** Optional weight (defaults to 1). Higher = counts more. */
  weight?: number;
  /** Optional human-readable tag for surfacing later ("negotiation", …). */
  tag?: string;
};

export type ChapterScoreState = {
  chapter: number;
  communication: { total: number; weight: number };
  decision: { total: number; weight: number };
  stakeholder: { total: number; weight: number };
  sampleCount: number;
};

export function emptyChapterScoreState(chapter: number): ChapterScoreState {
  return {
    chapter,
    communication: { total: 0, weight: 0 },
    decision: { total: 0, weight: 0 },
    stakeholder: { total: 0, weight: 0 },
    sampleCount: 0,
  };
}

/**
 * Fold a new sample into a chapter's running state. Returns a NEW object
 * (immutable) so callers can persist safely.
 */
export function addSample(
  state: ChapterScoreState,
  sample: ScoreSample,
): ChapterScoreState {
  const w = sample.weight ?? 1;
  const bucket = { ...state[sample.dimension] };
  bucket.total += sample.score * w;
  bucket.weight += w;
  return {
    ...state,
    [sample.dimension]: bucket,
    sampleCount: state.sampleCount + 1,
  };
}

export type DimensionScores = {
  communication: number;
  decision: number;
  stakeholder: number;
};

export function currentAverages(state: ChapterScoreState): DimensionScores {
  const avg = (b: { total: number; weight: number }) =>
    b.weight <= 0 ? 0 : Math.round((b.total / b.weight) * 100) / 100;
  return {
    communication: avg(state.communication),
    decision: avg(state.decision),
    stakeholder: avg(state.stakeholder),
  };
}

/**
 * Overall = weighted mean of the three dimension averages. Default weights
 * are equal; a chapter can bias the aggregate by declaring `scoringEmphasis`
 * that mentions the dimension name (case-insensitive substring match).
 */
export function overallScore(
  state: ChapterScoreState,
  chapter?: Pick<ChapterDefinition, "scoringEmphasis">,
): number {
  const avgs = currentAverages(state);
  const weights = { communication: 1, decision: 1, stakeholder: 1 };
  for (const raw of chapter?.scoringEmphasis ?? []) {
    const t = raw.toLowerCase();
    if (t.includes("communicat")) weights.communication += 0.5;
    if (t.includes("decision")) weights.decision += 0.5;
    if (t.includes("stakeholder") || t.includes("relationship")) {
      weights.stakeholder += 0.5;
    }
  }
  const totalW = weights.communication + weights.decision + weights.stakeholder;
  const totalScore =
    avgs.communication * weights.communication +
    avgs.decision * weights.decision +
    avgs.stakeholder * weights.stakeholder;
  return Math.round((totalScore / totalW) * 100) / 100;
}

/**
 * Map a `DecisionOption.quality` label to a 0..100 score. Kept here so
 * callers can convert engine outputs into samples without recomputing.
 */
export function qualityToScore(
  quality: "excellent" | "good" | "risky" | "poor",
): number {
  switch (quality) {
    case "excellent": return 92;
    case "good": return 78;
    case "risky": return 52;
    case "poor": return 28;
  }
}
