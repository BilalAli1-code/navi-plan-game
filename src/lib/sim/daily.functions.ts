// Server functions for the 7-day daily learning structure. All calls are gated
// by requireSupabaseAuth so user_id always comes from the verified session.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRunAccess } from "@/lib/billing/entitlement.server";
import type { Json, TablesUpdate } from "@/integrations/supabase/types";
import { DAILY_MINUTES, REQUIRED_ACTIVITIES, type DayActivityKey } from "./days";
import type { SimState } from "./types";
import { INITIAL_METRICS } from "./types";
import {
  applyActivityCompletion,
  buildProgressionSnapshot,
  migrateChapterProgress,
} from "./progression";

const assertJson = (value: unknown): Json => value as Json;

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

function asProgressState(snapshot: Partial<SimState>): SimState {
  return {
    caseId: snapshot.caseId ?? "",
    phase: snapshot.phase ?? "Initiation",
    metrics: snapshot.metrics ?? INITIAL_METRICS,
    tailoring: snapshot.tailoring ?? null,
    tailoringScore: snapshot.tailoringScore ?? null,
    approach: snapshot.approach ?? null,
    emails: snapshot.emails ?? [],
    meetings: snapshot.meetings ?? [],
    documents: snapshot.documents ?? [],
    decisions: snapshot.decisions ?? [],
    activeDecisionId: snapshot.activeDecisionId ?? null,
    log: snapshot.log ?? [],
    xp: snapshot.xp ?? 0,
    createdAt: snapshot.createdAt ?? Date.now(),
    lastConsequence: snapshot.lastConsequence ?? null,
    currentDay: snapshot.currentDay ?? 1,
    completedMinutes: snapshot.completedMinutes ?? 0,
    chapterProgress: migrateChapterProgress(snapshot.chapterProgress),
  };
}

function mapChapterStatus(status: "locked" | "available" | "active" | "completed") {
  return status === "active" ? "in_progress" : status;
}

function deriveDailyRows(runId: string, state: SimState): Omit<DailyProgressRow, "id">[] {
  const progression = buildProgressionSnapshot(state);
  return progression.chapters.map((chapter) => ({
    run_id: runId,
    day_number: chapter.dayNumber,
    day_title: chapter.title,
    project_phase: chapter.phase,
    estimated_minutes: DAILY_MINUTES,
    completed_minutes: chapter.completedMinutes,
    completion_percentage: chapter.completionPercentage,
    status: mapChapterStatus(chapter.status),
    briefing_completed: chapter.activities.briefing,
    learning_completed: chapter.activities.learning,
    workplace_activities_completed: chapter.activities.workplace,
    decisions_completed: chapter.activities.decisions,
    practice_completed: chapter.activities.practice,
    reflection_completed: chapter.activities.reflection,
    started_at: chapter.startedAt,
    completed_at: chapter.completedAt,
  }));
}

export async function syncDailyProgressRows(
  supabase: any,
  userId: string,
  runId: string,
  state: SimState,
) {
  const derivedRows = deriveDailyRows(runId, state);
  const { data: existingRows, error } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("run_id", runId)
    .eq("user_id", userId)
    .order("day_number", { ascending: true });
  if (error) throw new Error(error.message);

  const existing = (existingRows ?? []) as DailyProgressRow[];
  const existingByDay = new Map(existing.map((row) => [row.day_number, row]));
  const missing = derivedRows
    .filter((row) => !existingByDay.has(row.day_number))
    .map((row) => ({ ...row, user_id: userId }));
  if (missing.length) {
    const { error: insertError } = await supabase.from("daily_progress").insert(missing);
    if (insertError) throw new Error(insertError.message);
  }

  let rowsToSync = existing;
  if (missing.length) {
    const { data: refetchedRows, error: refetchError } = await supabase
      .from("daily_progress")
      .select("*")
      .eq("run_id", runId)
      .eq("user_id", userId)
      .order("day_number", { ascending: true });
    if (refetchError) throw new Error(refetchError.message);
    rowsToSync = (refetchedRows ?? []) as DailyProgressRow[];
  }

  const syncedByDay = new Map(rowsToSync.map((row) => [row.day_number, row]));
  await Promise.all(
    derivedRows.map(async (row) => {
      const existingRow = syncedByDay.get(row.day_number);
      if (!existingRow) return;
      const patch: TablesUpdate<"daily_progress"> = {
        day_title: row.day_title,
        project_phase: row.project_phase,
        estimated_minutes: row.estimated_minutes,
        completed_minutes: row.completed_minutes,
        completion_percentage: row.completion_percentage,
        status: row.status,
        briefing_completed: row.briefing_completed,
        learning_completed: row.learning_completed,
        workplace_activities_completed: row.workplace_activities_completed,
        decisions_completed: row.decisions_completed,
        practice_completed: row.practice_completed,
        reflection_completed: row.reflection_completed,
        started_at: row.started_at,
        completed_at: row.completed_at,
      };
      const { error: updateError } = await supabase
        .from("daily_progress")
        .update(patch)
        .eq("id", existingRow.id)
        .eq("user_id", userId);
      if (updateError) throw new Error(updateError.message);
    }),
  );

  return deriveDailyRows(runId, state).map((row) => ({
    ...row,
    id: syncedByDay.get(row.day_number)?.id ?? existingByDay.get(row.day_number)?.id ?? "",
  })) as DailyProgressRow[];
}

// Ensure all 7 daily_progress rows exist for a run and return them ordered by day.
export const listDailyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    await requireRunAccess(context.supabase, context.userId, data.runId);
    const { data: runRows, error: runError } = await context.supabase
      .from("simulation_runs")
      .select("state_snapshot")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .limit(1);
    if (runError) throw new Error(runError.message);
    const snapshot = asProgressState((runRows?.[0]?.state_snapshot ?? {}) as Partial<SimState>);
    const days = await syncDailyProgressRows(context.supabase as never, context.userId, data.runId, snapshot);
    return { days };
  });

// Mark one activity as complete. Recomputes completion %, minutes, status, and
// unlocks the next day when every required activity for the current day is done.
export const completeDayActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number; activity?: DayActivityKey };
    if (!i?.runId || !i?.dayNumber || !i?.activity)
      throw new Error("runId/dayNumber/activity required");
    if (!REQUIRED_ACTIVITIES.includes(i.activity)) throw new Error("invalid activity");
    return { runId: i.runId, dayNumber: i.dayNumber, activity: i.activity };
  })
  .handler(async ({ data, context }) => {
    await requireRunAccess(context.supabase, context.userId, data.runId);
    const { data: runRows, error: runError } = await context.supabase
      .from("simulation_runs")
      .select("state_snapshot")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .limit(1);
    if (runError) throw new Error(runError.message);
    const run = runRows?.[0];
    const nextState = applyActivityCompletion(
      asProgressState((run?.state_snapshot ?? {}) as Partial<SimState>),
      data.dayNumber,
      data.activity,
    );
    const { error: upErr } = await context.supabase
      .from("simulation_runs")
      .update({
        current_day: nextState.currentDay,
        completed_minutes: nextState.completedMinutes,
        last_activity_at: new Date().toISOString(),
        state_snapshot: assertJson(nextState),
      })
      .eq("id", data.runId)
      .eq("user_id", context.userId);
    if (upErr) throw new Error(upErr.message);
    await syncDailyProgressRows(context.supabase as never, context.userId, data.runId, nextState);
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
    await requireRunAccess(context.supabase, context.userId, data.runId);
    const { data: runRows, error: runError } = await context.supabase
      .from("simulation_runs")
      .select("state_snapshot")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .limit(1);
    if (runError) throw new Error(runError.message);
    const run = runRows?.[0];
    const snapshot = asProgressState((run?.state_snapshot ?? {}) as Partial<SimState>);
    const progression = buildProgressionSnapshot(snapshot);
    const day = progression.chapters.find((chapter) => chapter.dayNumber === data.dayNumber);
    if (!day || day.status === "locked") throw new Error("requested day is locked");

    const { error } = await context.supabase
      .from("simulation_runs")
      .update({
        current_day: data.dayNumber,
        last_activity_at: new Date().toISOString(),
        state_snapshot: assertJson({ ...snapshot, currentDay: data.dayNumber }),
      })
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
    await requireRunAccess(context.supabase, context.userId, data.runId);
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
    await requireRunAccess(context.supabase, context.userId, data.runId);
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
