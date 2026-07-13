// Day 7 final AI mentor assessment. Assessment context is composed server-side
// from trusted sources (simulation_runs, decisions, daily_progress, reflections,
// practice_sessions). The browser never supplies scores. A single assessment
// per run is stored in final_assessments; regeneration requires an explicit
// force flag.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { generateFinalReport, type FinalReport } from "./assessment.server";

export type { FinalReport } from "./assessment.server";

export const getFinalAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: row } = await db
      .from("final_assessments")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { assessment: row ?? null };
  });

export const generateFinalAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; force?: boolean };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId, force: !!i.force };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;

    const { data: existing } = await db
      .from("final_assessments")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing && !data.force) return { assessment: existing };

    const { data: run, error: runErr } = await db
      .from("simulation_runs")
      .select("*")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .single();
    if (runErr) throw new Error(runErr.message);

    const { data: decisions } = await db
      .from("simulation_decisions")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId);
    const { data: days } = await db
      .from("daily_progress")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("day_number", { ascending: true });
    const { data: reflections } = await db
      .from("daily_reflections")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("day_number", { ascending: true });
    const { data: practice } = await db
      .from("practice_sessions")
      .select("day_number, score, correct_answers, total_questions, status")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("day_number", { ascending: true });

    const snapshot = (run.state_snapshot ?? {}) as {
      log?: Array<{ correct: boolean; quality: string; atPhase: string }>;
      metrics?: Record<string, number>;
      tailoring?: Record<string, string> | null;
    };
    const totalDecisions = snapshot.log?.length ?? 0;
    const correctDecisions = snapshot.log?.filter((l) => l.correct).length ?? 0;
    const practiceAvg = practice?.length
      ? Math.round(
          (practice as Array<{ score: number }>).reduce((s, p) => s + (p.score ?? 0), 0) /
            practice.length,
        )
      : 0;

    const payload = {
      project: {
        case_id: run.case_id,
        delivery_approach: run.selected_delivery_approach,
        final_metrics: (snapshot as { metrics?: Record<string, number> })?.metrics ?? {},
        health: run.project_health,
        budget: run.budget_score,
        schedule: run.schedule_score,
        risk: run.risk_score,
        quality: run.quality_score,
        morale: run.team_morale,
        trust: run.stakeholder_trust,
        satisfaction: run.customer_satisfaction,
        xp: run.xp,
      },
      tailoring: snapshot.tailoring ?? {},
      decisions: {
        total: totalDecisions,
        correct: correctDecisions,
        by_phase: (decisions ?? []).map((d) => ({
          phase: d.phase,
          option: d.selected_option_text,
          feedback: d.mentor_feedback,
        })),
      },
      days: (days ?? []).map((d) => ({
        day: d.day_number,
        status: d.status,
        completion: d.completion_percentage,
      })),
      reflections: (reflections ?? []).map(
        (r: {
          day_number: number;
          what_went_well: string | null;
          what_was_challenging: string | null;
          key_learning: string | null;
        }) => ({
          day: r.day_number,
          well: r.what_went_well,
          challenging: r.what_was_challenging,
          learning: r.key_learning,
        }),
      ),
      practice: { average_score: practiceAvg, sessions: practice ?? [] },
    };

    let report: FinalReport;
    try {
      report = await generateFinalReport(payload, run.case_id);
    } catch (err) {
      throw new Error(`Assessment generation failed: ${err instanceof Error ? err.message : "unknown"}`);
    }

    const row = {
      run_id: data.runId,
      user_id: context.userId,
      overall_score: report.overall_score,
      readiness_level: report.readiness_level,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assessment_data: report as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      strengths: [...report.leadership_strengths, ...report.decision_making_strengths] as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      development_areas: report.development_areas as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommended_next_steps: {
        next_case: report.recommended_next_case,
        seven_day_plan: report.seven_day_follow_up_plan,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      generated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = await db
      .from("final_assessments")
      .upsert(row, { onConflict: "run_id" })
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);

    await db
      .from("simulation_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.runId)
      .eq("user_id", context.userId);

    // Record the mentor_review event so the timeline shows it.
    try {
      await db.from("simulation_events").upsert(
        {
          run_id: data.runId,
          user_id: context.userId,
          event_key: "mentor_review:final",
          event_type: "mentor_review",
          status: "completed",
          day_number: 7,
          priority: "urgent",
          completed_at: new Date().toISOString(),
          payload: {
            overall_score: report.overall_score,
            readiness_level: report.readiness_level,
          },
        },
        { onConflict: "run_id,event_key" },
      );
    } catch {
      /* best-effort */
    }

    // Bump program-level mastery from the final overall score.
    try {
      const overall = Math.max(0, Math.min(100, Math.round(report.overall_score)));
      await db.from("learner_mastery").upsert(
        {
          user_id: context.userId,
          topic: "Program — Final Assessment",
          pmbok_domain: "Overall",
          eco_domain: "Business Environment",
          competency: "Integrated project management",
          difficulty: "hard",
          attempts: 1,
          successful_decisions: overall >= 75 ? 1 : 0,
          recent_scores: [overall],
          mastery_score: overall,
          consecutive_correct: overall >= 75 ? 1 : 0,
          consecutive_wrong: overall < 40 ? 1 : 0,
          is_mastered: overall >= 85,
          mastered_at: overall >= 85 ? new Date().toISOString() : null,
          is_development_area: overall < 40,
          last_practiced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic" },
      );
    } catch {
      /* best-effort */
    }

    return { assessment: saved };
  });
