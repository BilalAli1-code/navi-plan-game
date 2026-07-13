// Day 7 final AI mentor assessment. Assessment context is composed server-side
// from trusted sources (simulation_runs, decisions, daily_progress, reflections,
// practice_sessions). The browser never supplies scores. A single assessment
// per run is stored in final_assessments; regeneration requires an explicit
// force flag.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: unknown) => v as any;

const ReportSchema = z.object({
  overall_score: z.number().min(0).max(100),
  readiness_level: z.enum(["developing", "approaching", "ready", "exam_ready"]),
  project_outcome_summary: z.string(),
  leadership_strengths: z.array(z.string()).min(1),
  decision_making_strengths: z.array(z.string()).min(1),
  development_areas: z.array(z.string()).min(1),
  stakeholder_management_assessment: z.string(),
  risk_management_assessment: z.string(),
  delivery_approach_assessment: z.string(),
  pmbok_performance_domains: z.array(
    z.object({ domain: z.string(), score: z.number().min(0).max(100), notes: z.string() }),
  ).min(4),
  eco_people_score: z.number().min(0).max(100),
  eco_process_score: z.number().min(0).max(100),
  eco_business_environment_score: z.number().min(0).max(100),
  recommended_next_case: z.string(),
  seven_day_follow_up_plan: z.array(
    z.object({ day: z.number(), focus: z.string(), activities: z.array(z.string()) }),
  ).length(7),
});

export type FinalReport = z.infer<typeof ReportSchema>;

export const getFinalAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;

    // Prevent duplicate generation unless force=true.
    const { data: existing } = await db
      .from("final_assessments")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing && !data.force) return { assessment: existing };

    // Build trusted context — everything from the DB, nothing from the browser.
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

    const context_payload = {
      project: {
        case_id: run.case_id,
        delivery_approach: run.selected_delivery_approach,
        final_metrics: run.state_snapshot?.metrics ?? {},
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
        by_phase: (decisions ?? []).map(
          (d: { phase: string; selected_option_text: string; mentor_feedback: unknown }) => ({
            phase: d.phase,
            option: d.selected_option_text,
            feedback: d.mentor_feedback,
          }),
        ),
      },
      days: (days ?? []).map(
        (d: { day_number: number; status: string; completion_percentage: number }) => ({
          day: d.day_number,
          status: d.status,
          completion: d.completion_percentage,
        }),
      ),
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
      practice: {
        average_score: practiceAvg,
        sessions: practice ?? [],
      },
    };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are Maya, a senior PMP-certified project management mentor.
Write a rigorous, honest, PMI-aligned final assessment for a learner who completed a 7-day project simulation.
Ground scores in the trusted data provided. Do not invent numbers. Be specific, use PMI vocabulary, and give actionable coaching.`;

    const prompt = `Generate the final assessment as strict JSON matching the schema.

Trusted learner data:
${JSON.stringify(context_payload, null, 2)}

Scoring guidance:
- overall_score: weighted blend of project health, decision correctness, and practice average.
- readiness_level: developing (<55), approaching (55-69), ready (70-84), exam_ready (>=85).
- pmbok_performance_domains: cover at minimum Stakeholders, Team, Planning, Delivery, Measurement, Uncertainty.
- ECO scores: derive from decisions and practice mapped to People / Process / Business Environment.
- seven_day_follow_up_plan: exactly 7 days of targeted follow-up, each 60-90 min, targeting the learner's weakest areas.
- recommended_next_case: pick a plausible next industry (e.g. Healthcare, Software, Aerospace, Retail) different from ${run.case_id}.`;

    let report: FinalReport;
    try {
      const { object } = await generateObject({ model, schema: ReportSchema, prompt, system });
      report = object;
    } catch (err) {
      throw new Error(`Assessment generation failed: ${err instanceof Error ? err.message : "unknown"}`);
    }

    const payload = {
      run_id: data.runId,
      user_id: context.userId,
      overall_score: report.overall_score,
      readiness_level: report.readiness_level,
      assessment_data: asJson(report),
      strengths: asJson([...report.leadership_strengths, ...report.decision_making_strengths]),
      development_areas: asJson(report.development_areas),
      recommended_next_steps: asJson({
        next_case: report.recommended_next_case,
        seven_day_plan: report.seven_day_follow_up_plan,
      }),
      generated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = await db
      .from("final_assessments")
      .upsert(payload, { onConflict: "run_id" })
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);

    // Mark run completed on final assessment.
    await db
      .from("simulation_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.runId)
      .eq("user_id", context.userId);

    return { assessment: saved };
  });
