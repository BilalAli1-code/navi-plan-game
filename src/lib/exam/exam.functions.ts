import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireFeature } from "@/lib/billing/entitlement.server";
import type { Json } from "@/integrations/supabase/types";
import type { ExamReport } from "./types";

type SaveInput = { report: ExamReport };
const asJson = (v: unknown): Json => v as Json;

export const saveExamReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as SaveInput;
    if (!i?.report?.id) throw new Error("report required");
    return i;
  })
  .handler(async ({ data, context }) => {
    await requireFeature(context.supabase, context.userId, "exam_history");
    const r = data.report;
    const { error } = await context.supabase.from("exam_reports").upsert(
      {
        id: r.id,
        user_id: context.userId,
        session_id: r.sessionId,
        mode: "full",
        total_questions: r.totalQuestions,
        correct_count: r.correctCount,
        overall_percent: r.overallPercent,
        readiness: r.readiness,
        pass_probability: r.passProbability,
        duration_taken_ms: r.durationTakenMs,
        avg_time_per_question_ms: Math.round(r.avgTimePerQuestionMs),
        avg_confidence: r.avgConfidence,
        domain_scores: asJson(r.domainScores),
        knowledge_area_scores: asJson(r.knowledgeAreaScores),
        strongest_topics: asJson(r.strongestTopics),
        weakest_topics: asJson(r.weakestTopics),
        difficulty_breakdown: asJson(r.difficultyBreakdown),
        too_fast_count: r.tooFast.length,
        too_slow_count: r.tooSlow.length,
        completed_at: new Date(r.completedAt).toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export type StoredExamReport = {
  id: string;
  session_id: string | null;
  overall_percent: number;
  pass_probability: number;
  readiness: string;
  total_questions: number;
  correct_count: number;
  duration_taken_ms: number;
  avg_time_per_question_ms: number;
  avg_confidence: number;
  weakest_topics: string[];
  strongest_topics: string[];
  domain_scores: Array<{ domain: string; correct: number; total: number; percent: number }>;
  knowledge_area_scores: Array<{
    knowledgeArea: string;
    correct: number;
    total: number;
    percent: number;
  }>;
  completed_at: string;
};

export const listExamReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StoredExamReport[]> => {
    await requireFeature(context.supabase, context.userId, "exam_history");
    const { data, error } = await context.supabase
      .from("exam_reports")
      .select(
        "id, session_id, overall_percent, pass_probability, readiness, total_questions, correct_count, duration_taken_ms, avg_time_per_question_ms, avg_confidence, weakest_topics, strongest_topics, domain_scores, knowledge_area_scores, completed_at",
      )
      .order("completed_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as StoredExamReport[];
  });
