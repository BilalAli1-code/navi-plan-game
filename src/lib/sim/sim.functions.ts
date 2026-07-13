// Server functions for ProjectSim cloud persistence.
// All queries scope by auth.uid() via RLS; the user_id we insert is context.userId
// (validated by requireSupabaseAuth). state_snapshot holds the full SimState so a
// learner can rehydrate on any device; the top-level metric columns exist for
// analytics/queries.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SimState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: unknown) => v as any;

function metricRow(state: SimState) {
  const m = state.metrics;
  return {
    case_id: state.caseId,
    status: state.phase === "Complete" ? "completed" : "active",
    selected_delivery_approach: state.approach,
    current_phase: state.phase,
    current_week: 0,
    current_day: state.currentDay ?? 1,
    total_days: 7,
    estimated_total_minutes: 420,
    completed_minutes: state.completedMinutes ?? 0,
    project_health: Math.round(m.health),
    budget_score: Math.round(m.budget),
    schedule_score: Math.round(m.schedule),
    risk_score: Math.round(m.risk),
    quality_score: Math.round(m.quality),
    team_morale: Math.round(m.morale),
    stakeholder_trust: Math.round(m.trust),
    customer_satisfaction: Math.round(m.satisfaction),
    xp: state.xp,
    tailoring_config: asJson(state.tailoring ?? {}),
    state_snapshot: asJson(state),
    last_activity_at: new Date().toISOString(),
    completed_at: state.phase === "Complete" ? new Date().toISOString() : null,
  };
}

// Load the newest run (active or paused) for this learner + case, if any.
export const loadRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { caseId?: string };
    if (!i?.caseId || typeof i.caseId !== "string") throw new Error("caseId required");
    return { caseId: i.caseId };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("simulation_runs")
      .select("id, state_snapshot, status")
      .eq("user_id", context.userId)
      .eq("case_id", data.caseId)
      .in("status", ["active", "paused", "not_started"])
      .order("last_activity_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) return { run: null };
    return { run: { id: row.id, status: row.status, snapshot: row.state_snapshot as SimState } };
  });

// Upsert (create-or-update) the run snapshot + metrics. Returns the run id.
export const saveRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string | null; state?: SimState };
    if (!i?.state?.caseId) throw new Error("state.caseId required");
    return { runId: i.runId ?? null, state: i.state };
  })
  .handler(async ({ data, context }) => {
    const row = { ...metricRow(data.state), user_id: context.userId };
    if (data.runId) {
      const { error } = await context.supabase
        .from("simulation_runs")
        .update(row)
        .eq("id", data.runId)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { runId: data.runId };
    }
    const { data: inserted, error } = await context.supabase
      .from("simulation_runs")
      .insert({ ...row, started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { runId: inserted.id as string };
  });

// Append a decision. Uniqueness on (run_id, decision_id) guards duplicates.
export const saveDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as {
      runId?: string;
      decisionId?: string;
      phase?: string;
      selectedOptionId?: string;
      selectedOptionText?: string;
      metricImpacts?: Record<string, number>;
      mentorFeedback?: Record<string, unknown>;
      eventId?: string | null;
    };
    if (!i?.runId || !i?.decisionId) throw new Error("runId and decisionId required");
    return {
      runId: i.runId,
      decisionId: i.decisionId,
      phase: i.phase ?? null,
      selectedOptionId: i.selectedOptionId ?? null,
      selectedOptionText: i.selectedOptionText ?? null,
      metricImpacts: i.metricImpacts ?? {},
      mentorFeedback: i.mentorFeedback ?? {},
      eventId: i.eventId ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("simulation_decisions").upsert(
      {
        run_id: data.runId,
        user_id: context.userId,
        decision_id: data.decisionId,
        event_id: data.eventId,
        phase: data.phase,
        selected_option_id: data.selectedOptionId,
        selected_option_text: data.selectedOptionText,
        metric_impacts: asJson(data.metricImpacts),
        mentor_feedback: asJson(data.mentorFeedback),
      },
      { onConflict: "run_id,decision_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setRunStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; status?: string };
    if (!i?.runId || !i?.status) throw new Error("runId and status required");
    const allowed = ["not_started", "active", "paused", "completed", "abandoned"];
    if (!allowed.includes(i.status)) throw new Error("invalid status");
    return { runId: i.runId, status: i.status };
  })
  .handler(async ({ data, context }) => {
    const patch = {
      status: data.status,
      last_activity_at: new Date().toISOString(),
      completed_at: data.status === "completed" ? new Date().toISOString() : null,
    };
    const { error } = await context.supabase
      .from("simulation_runs")
      .update(patch)
      .eq("id", data.runId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
