import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ExamReport } from "./types";

type SaveInput = { report: ExamReport };

export const saveExamReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as SaveInput;
    if (!i?.report?.id) throw new Error("report required");
    return i;
  })
  .handler(async ({ data, context }) => {
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
        domain_scores: r.domainScores as unknown as Record<string, unknown>[],
        knowledge_area_scores: r.knowledgeAreaScores as unknown as Record<string, unknown>[],
        strongest_topics: r.strongestTopics,
        weakest_topics: r.weakestTopics,
        difficulty_breakdown: r.difficultyBreakdown as unknown as Record<string, unknown>,
        too_fast_count: r.tooFast.length,
        too_slow_count: r.tooSlow.length,
        completed_at: new Date(r.completedAt).toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listExamReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exam_reports")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown[];
  });
