// Server functions for the 7-day daily learning structure. All calls are gated
// by requireSupabaseAuth so user_id always comes from the verified session.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DAY_PLAN, DAILY_MINUTES, REQUIRED_ACTIVITIES, type DayActivityKey } from "./days";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: unknown) => v as any;

export type DailyProgressRow = {
  id: string;
  run_id: string;
  day_number: number;
  day_title: string | null;
  project_phase: string | null;
  estimated_minutes: number;
  completed_minutes: number;
  completion_percentage: number;
  status: "locked" | "available" | "in_progress" | "completed";
  briefing_completed: boolean;
  learning_completed: boolean;
  workplace_activities_completed: boolean;
  decisions_completed: boolean;
  practice_completed: boolean;
  reflection_completed: boolean;
  started_at: string | null;
  completed_at: string | null;
};

const ACTIVITY_COLUMN: Record<DayActivityKey, keyof DailyProgressRow> = {
  briefing: "briefing_completed",
  learning: "learning_completed",
  workplace: "workplace_activities_completed",
  decisions: "decisions_completed",
  practice: "practice_completed",
  reflection: "reflection_completed",
};

// Ensure all 7 daily_progress rows exist for a run and return them ordered by day.
export const listDailyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    const { data: existing, error } = await context.supabase
      .from("daily_progress")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("day_number", { ascending: true });
    if (error) throw new Error(error.message);
    const have = new Set((existing ?? []).map((r) => r.day_number));
    const missing = DAY_PLAN.filter((d) => !have.has(d.day)).map((d) => ({
      run_id: data.runId,
      user_id: context.userId,
      day_number: d.day,
      day_title: d.title,
      project_phase: d.phase,
      estimated_minutes: DAILY_MINUTES,
      status: d.day === 1 ? "available" : "locked",
    }));
    if (missing.length) {
      const { error: insErr } = await context.supabase.from("daily_progress").insert(missing);
      if (insErr) throw new Error(insErr.message);
      const { data: refetched, error: refErr } = await context.supabase
        .from("daily_progress")
        .select("*")
        .eq("run_id", data.runId)
        .eq("user_id", context.userId)
        .order("day_number", { ascending: true });
      if (refErr) throw new Error(refErr.message);
      return { days: (refetched ?? []) as DailyProgressRow[] };
    }
    return { days: (existing ?? []) as DailyProgressRow[] };
  });

// Mark one activity as complete. Recomputes completion %, minutes, status, and
// unlocks the next day when every required activity for the current day is done.
export const completeDayActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number; activity?: DayActivityKey };
    if (!i?.runId || !i?.dayNumber || !i?.activity) throw new Error("runId/dayNumber/activity required");
    if (!REQUIRED_ACTIVITIES.includes(i.activity)) throw new Error("invalid activity");
    return { runId: i.runId, dayNumber: i.dayNumber, activity: i.activity };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error: fetchErr } = await context.supabase
      .from("daily_progress")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("day_number", data.dayNumber)
      .limit(1);
    if (fetchErr) throw new Error(fetchErr.message);
    const row = rows?.[0] as DailyProgressRow | undefined;
    if (!row) throw new Error("day not found");

    const col = ACTIVITY_COLUMN[data.activity];
    // Idempotent: if activity already complete, just return current state.
    if (row[col]) return { ok: true as const };

    const updated: Partial<DailyProgressRow> = { [col]: true } as Partial<DailyProgressRow>;
    // Recompute % and minutes across all activities.
    const flags: Record<DayActivityKey, boolean> = {
      briefing: row.briefing_completed,
      learning: row.learning_completed,
      workplace: row.workplace_activities_completed,
      decisions: row.decisions_completed,
      practice: row.practice_completed,
      reflection: row.reflection_completed,
    };
    flags[data.activity] = true;
    const completed = REQUIRED_ACTIVITIES.filter((a) => flags[a]).length;
    updated.completion_percentage = Math.round((completed / REQUIRED_ACTIVITIES.length) * 100);
    updated.completed_minutes = Math.round((completed / REQUIRED_ACTIVITIES.length) * DAILY_MINUTES);
    const allDone = completed === REQUIRED_ACTIVITIES.length;
    updated.status = allDone ? "completed" : "in_progress";
    if (row.started_at == null) updated.started_at = new Date().toISOString();
    if (allDone) updated.completed_at = new Date().toISOString();

    const { error: upErr } = await context.supabase
      .from("daily_progress")
      .update(asJson(updated))
      .eq("id", row.id)
      .eq("user_id", context.userId);
    if (upErr) throw new Error(upErr.message);

    // Unlock next day if this one just completed.
    if (allDone && data.dayNumber < DAY_PLAN.length) {
      await context.supabase
        .from("daily_progress")
        .update({ status: "available" })
        .eq("run_id", data.runId)
        .eq("user_id", context.userId)
        .eq("day_number", data.dayNumber + 1)
        .eq("status", "locked");
    }
    return { ok: true as const };
  });

// Set the current day (advance / jump-back for self-paced navigation).
export const setCurrentDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return { runId: i.runId, dayNumber: i.dayNumber };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("simulation_runs")
      .update({ current_day: data.dayNumber, last_activity_at: new Date().toISOString() })
      .eq("id", data.runId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// Save/upsert the daily reflection for a run.
export const saveReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as {
      runId?: string;
      dayNumber?: number;
      whatWentWell?: string;
      whatWasChallenging?: string;
      whatWouldChange?: string;
      keyLearning?: string;
    };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return {
      runId: i.runId,
      dayNumber: i.dayNumber,
      whatWentWell: i.whatWentWell?.slice(0, 4000) ?? null,
      whatWasChallenging: i.whatWasChallenging?.slice(0, 4000) ?? null,
      whatWouldChange: i.whatWouldChange?.slice(0, 4000) ?? null,
      keyLearning: i.keyLearning?.slice(0, 4000) ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("daily_reflections").upsert(
      {
        run_id: data.runId,
        user_id: context.userId,
        day_number: data.dayNumber,
        what_went_well: data.whatWentWell,
        what_was_challenging: data.whatWasChallenging,
        what_would_change: data.whatWouldChange,
        key_learning: data.keyLearning,
      },
      { onConflict: "run_id,day_number" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const getReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return { runId: i.runId, dayNumber: i.dayNumber };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("daily_reflections")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("day_number", data.dayNumber)
      .limit(1);
    if (error) throw new Error(error.message);
    return { reflection: rows?.[0] ?? null };
  });
