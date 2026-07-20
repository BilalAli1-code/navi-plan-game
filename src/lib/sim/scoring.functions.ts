// Scoring persistence: per-chapter communication/decision/stakeholder split.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  addSample,
  currentAverages,
  emptyChapterScoreState,
  overallScore,
  qualityToScore,
  type ChapterScoreState,
  type ScoreDimension,
} from "./scoring";
import { getChapter } from "./days";

const SampleSchema = z.object({
  runId: z.string().uuid(),
  chapter: z.number().int().min(1).max(7),
  dimension: z.enum(["communication", "decision", "stakeholder"]),
  score: z.number().min(0).max(100),
  weight: z.number().min(0.1).max(10).optional(),
  tag: z.string().max(64).optional(),
});

function loadState(row: {
  metadata: unknown;
  chapter: number;
} | null, chapter: number): ChapterScoreState {
  const raw = row?.metadata as { state?: ChapterScoreState } | null;
  if (raw?.state) return raw.state;
  return emptyChapterScoreState(chapter);
}

export const recordScoreSample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SampleSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing } = await supabase
      .from("simulation_scores")
      .select("*")
      .eq("run_id", data.runId)
      .eq("chapter", data.chapter)
      .maybeSingle();

    const state = loadState(existing, data.chapter);
    const next = addSample(state, {
      dimension: data.dimension as ScoreDimension,
      score: data.score,
      weight: data.weight,
      tag: data.tag,
    });
    const avgs = currentAverages(next);
    const overall = overallScore(next, getChapter(data.chapter));

    if (existing) {
      const { error } = await supabase
        .from("simulation_scores")
        .update({
          communication_score: avgs.communication,
          decision_score: avgs.decision,
          stakeholder_score: avgs.stakeholder,
          overall_score: overall,
          sample_count: next.sampleCount,
          metadata: { state: next },
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("simulation_scores").insert({
        run_id: data.runId,
        chapter: data.chapter,
        communication_score: avgs.communication,
        decision_score: avgs.decision,
        stakeholder_score: avgs.stakeholder,
        overall_score: overall,
        sample_count: next.sampleCount,
        metadata: { state: next },
      });
      if (error) throw error;
    }
    return { ok: true, averages: avgs, overall };
  });

export const listScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ runId: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("simulation_scores")
      .select("chapter, communication_score, decision_score, stakeholder_score, overall_score, sample_count")
      .eq("run_id", data.runId)
      .order("chapter", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

/** Convenience: convert an engine decision-quality label to a decision sample. */
export function decisionQualityToSample(
  quality: "excellent" | "good" | "risky" | "poor",
  weight = 1,
) {
  return { dimension: "decision" as const, score: qualityToScore(quality), weight };
}
