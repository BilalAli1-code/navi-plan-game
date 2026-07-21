// Server functions for ProjectSim cloud persistence.
// All queries scope by auth.uid() via RLS; the user_id we insert is context.userId
// (validated by requireSupabaseAuth). state_snapshot holds the full SimState so a
// learner can rehydrate on any device; the top-level metric columns exist for
// analytics/queries.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCaseAccess, requireRunAccess } from "@/lib/billing/entitlement.server";
import type { Json } from "@/integrations/supabase/types";
import type { SimState } from "./types";
import type { MasteryUpdate } from "./mastery.functions";
import { buildProgressionSnapshot } from "./progression";
import { syncDailyProgressRows } from "./daily.functions";

const asJson = (v: unknown): Json => v as Json;

function metricRow(state: SimState) {
  const m = state.metrics;
  const progression = buildProgressionSnapshot(state);
  const persistedState =
    state.completedMinutes === progression.totalCompletedMinutes
      ? state
      : { ...state, completedMinutes: progression.totalCompletedMinutes };
  return {
    case_id: persistedState.caseId,
    status: persistedState.phase === "Complete" ? "completed" : "active",
    selected_delivery_approach: persistedState.approach,
    current_phase: persistedState.phase,
    current_week: 0,
    current_day: persistedState.currentDay ?? 1,
    total_days: 7,
    estimated_total_minutes: 420,
    completed_minutes: progression.totalCompletedMinutes,
    project_health: Math.round(m.health),
    budget_score: Math.round(m.budget),
    schedule_score: Math.round(m.schedule),
    risk_score: Math.round(m.risk),
    quality_score: Math.round(m.quality),
    team_morale: Math.round(m.morale),
    stakeholder_trust: Math.round(m.trust),
    customer_satisfaction: Math.round(m.satisfaction),
    xp: persistedState.xp,
    tailoring_config: asJson(persistedState.tailoring ?? {}),
    state_snapshot: asJson(persistedState),
    last_activity_at: new Date().toISOString(),
    completed_at: persistedState.phase === "Complete" ? new Date().toISOString() : null,
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
    await requireCaseAccess(context.supabase, context.userId, data.caseId);
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
    await requireCaseAccess(context.supabase, context.userId, data.state.caseId);
    const row = { ...metricRow(data.state), user_id: context.userId };
    if (data.runId) {
      const { error } = await context.supabase
        .from("simulation_runs")
        .update(row)
        .eq("id", data.runId)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      await syncDailyProgressRows(context.supabase as never, context.userId, data.runId, data.state);
      return { runId: data.runId };
    }
    const { data: inserted, error } = await context.supabase
      .from("simulation_runs")
      .insert({ ...row, started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await syncDailyProgressRows(context.supabase as never, context.userId, inserted.id as string, data.state);
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
    await requireRunAccess(context.supabase, context.userId, data.runId);
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
    await requireRunAccess(context.supabase, context.userId, data.runId);
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

// ─── Consolidated decision persistence ───────────────────────────────────────
//
// Replaces the four separate server calls previously fired by submitDecision
// in the store (saveDecision + applyMasteryUpdates + recordScoreSample +
// updateEventStatus ×1-3). Executing them in a single server function gives
// us atomic persistence without a round-trip per sub-operation.
//
// The mastery math here must stay byte-identical to mastery.functions.ts
// (computeMastery). The scoring math mirrors scoring.functions.ts (addSample).

// Rolling window size — must match WINDOW in mastery.functions.ts.
const MASTERY_ROLLING_WINDOW = 10;

function computeMasteryScore(
  prevRecent: number[],
  incoming: number,
  attempts: number,
  difficulty: MasteryUpdate["difficulty"],
): { mastery: number; recent: number[] } {
  const recent = [...prevRecent, incoming].slice(-MASTERY_ROLLING_WINDOW);
  const n = recent.length;
  let num = 0, den = 0;
  recent.forEach((s, i) => {
    const w = 1 + i * (2 / Math.max(n - 1, 1));
    num += s * w;
    den += w;
  });
  let mastery = num / den;
  const last3 = recent.slice(-3);
  if (last3.length === 3 && last3.every((s) => s >= 75)) mastery += 5;
  if (last3.length === 3 && last3.every((s) => s <= 30)) mastery -= 5;
  if (difficulty === "hard") mastery += 4;
  if (difficulty === "easy") mastery -= 2;
  if (attempts < 3) mastery = mastery * 0.85;
  return { mastery: Math.max(0, Math.min(100, Math.round(mastery))), recent };
}

type EventStatusInput = {
  eventKey: string;
  status: "locked" | "available" | "viewed" | "responded" | "completed" | "expired";
};

type PersistDecisionInput = {
  runId: string;
  decisionId: string;
  chapter: number;
  phase: string | null;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  metricImpacts: Record<string, number>;
  mentorFeedback: Record<string, unknown>;
  eventId: string | null;
  masteryUpdates: MasteryUpdate[];
  /** score 0-100 for the "decision" scoring dimension */
  decisionScore: number;
  eventStatusUpdates: EventStatusInput[];
};

export const persistDecisionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as PersistDecisionInput;
    if (!i?.runId || !i?.decisionId) throw new Error("runId and decisionId required");
    return {
      runId: i.runId,
      decisionId: i.decisionId,
      chapter: i.chapter ?? 1,
      phase: i.phase ?? null,
      selectedOptionId: i.selectedOptionId ?? null,
      selectedOptionText: i.selectedOptionText ?? null,
      metricImpacts: i.metricImpacts ?? {},
      mentorFeedback: i.mentorFeedback ?? {},
      eventId: i.eventId ?? null,
      masteryUpdates: Array.isArray(i.masteryUpdates) ? i.masteryUpdates : [],
      decisionScore: typeof i.decisionScore === "number" ? i.decisionScore : 50,
      eventStatusUpdates: Array.isArray(i.eventStatusUpdates) ? i.eventStatusUpdates : [],
    };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireRunAccess(db, context.userId, data.runId);
    const now = new Date().toISOString();

    // Guard: if this decision was already persisted, skip all sub-operations to
    // prevent double-counting mastery and scoring on retries.
    const { data: existingDecision } = await db
      .from("simulation_decisions")
      .select("id")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("decision_id", data.decisionId)
      .maybeSingle();
    if (existingDecision) return { ok: true as const, duplicate: true as const };

    // 1. Insert simulation_decisions row.
    const { error: decErr } = await db.from("simulation_decisions").insert(
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
    );
    if (decErr) throw new Error(decErr.message);

    // 2. Apply mastery updates.
    for (const u of data.masteryUpdates) {
      const { data: existing } = await db
        .from("learner_mastery")
        .select("*")
        .eq("user_id", context.userId)
        .eq("topic", u.topic)
        .maybeSingle();

      const prevAttempts = existing?.attempts ?? 0;
      const prevSuccess = existing?.successful_decisions ?? 0;
      const prevRecent: number[] = Array.isArray(existing?.recent_scores)
        ? (existing.recent_scores as number[])
        : [];
      const prevStreakOK = existing?.consecutive_correct ?? 0;
      const prevStreakBad = existing?.consecutive_wrong ?? 0;
      const prevTotal = Number(existing?.total_score ?? 0);
      const score = u.score ?? 0;

      const attempts = prevAttempts + 1;
      const successful = prevSuccess + (score >= 75 ? 1 : 0);
      const consecutive_correct = score >= 75 ? prevStreakOK + 1 : 0;
      const consecutive_wrong = score < 40 ? prevStreakBad + 1 : 0;
      const { mastery, recent } = computeMasteryScore(prevRecent, score, attempts, u.difficulty ?? undefined);
      const is_mastered = mastery >= 85 && attempts >= 3 && consecutive_correct >= 3;
      const is_development_area = (mastery < 40 && attempts >= 2) || consecutive_wrong >= 3;

      await db.from("learner_mastery").upsert(
        {
          user_id: context.userId,
          topic: u.topic,
          pmbok_domain: u.pmbokDomain ?? existing?.pmbok_domain ?? null,
          pmbok_principle: u.pmbokPrinciple ?? existing?.pmbok_principle ?? null,
          eco_domain: u.ecoDomain ?? existing?.eco_domain ?? null,
          competency: u.competency ?? existing?.competency ?? null,
          difficulty: u.difficulty ?? existing?.difficulty ?? null,
          attempts,
          successful_decisions: successful,
          total_score: prevTotal + score,
          recent_scores: recent,
          consecutive_correct,
          consecutive_wrong,
          mastery_score: mastery,
          is_mastered,
          mastered_at: is_mastered ? (existing?.mastered_at ?? now) : null,
          is_development_area,
          last_practiced_at: now,
        },
        { onConflict: "user_id,topic" },
      );
    }

    // 3. Persist chapter score sample (decision dimension).
    const chapter = Math.max(1, Math.min(7, data.chapter));
    try {
      const { data: scoreRow } = await db
        .from("simulation_scores")
        .select("*")
        .eq("run_id", data.runId)
        .eq("chapter", chapter)
        .maybeSingle();

      type ScoreState = {
        sampleCount: number;
        samples: { dimension: string; score: number; weight: number }[];
        weightedSums: Record<string, number>;
        weightTotals: Record<string, number>;
      };
      const prevState: ScoreState = (scoreRow?.metadata as { state?: ScoreState } | null)?.state ?? {
        sampleCount: 0,
        samples: [],
        weightedSums: { communication: 0, decision: 0, stakeholder: 0 },
        weightTotals: { communication: 0, decision: 0, stakeholder: 0 },
      };
      const newSample = { dimension: "decision", score: data.decisionScore, weight: 1 };
      const nextSamples = [...prevState.samples, newSample];
      const weightedSums = { ...prevState.weightedSums };
      const weightTotals = { ...prevState.weightTotals };
      weightedSums.decision = (weightedSums.decision ?? 0) + data.decisionScore;
      weightTotals.decision = (weightTotals.decision ?? 0) + 1;
      const avg = (d: string) =>
        (weightTotals[d] ?? 0) > 0
          ? Math.round((weightedSums[d] ?? 0) / (weightTotals[d] ?? 1))
          : null;
      const overall =
        (weightTotals.communication ?? 0) + (weightTotals.decision ?? 0) + (weightTotals.stakeholder ?? 0) > 0
          ? Math.round(
              (Object.values(weightedSums).reduce((a, b) => a + b, 0)) /
                (Object.values(weightTotals).reduce((a, b) => a + b, 0)),
            )
          : null;
      const nextState: ScoreState = {
        sampleCount: prevState.sampleCount + 1,
        samples: nextSamples,
        weightedSums,
        weightTotals,
      };
      const scorePayload = {
        decision_score: avg("decision") ?? undefined,
        communication_score: avg("communication") ?? undefined,
        stakeholder_score: avg("stakeholder") ?? undefined,
        overall_score: overall ?? undefined,
        sample_count: nextState.sampleCount,
        metadata: asJson({ state: nextState }),
      };
      if (scoreRow) {
        await db.from("simulation_scores").update(scorePayload).eq("id", scoreRow.id);
      } else {
        await db.from("simulation_scores").insert({ run_id: data.runId, chapter, ...scorePayload });
      }
    } catch (err) {
      console.error("persistDecisionAction: score persistence failed", err);
    }

    // 4. Batch-update event statuses (no regression).
    const statusRank: Record<string, number> = {
      locked: 0, available: 1, viewed: 2, responded: 3, completed: 4, expired: 5,
    };
    for (const ev of data.eventStatusUpdates) {
      const { data: cur } = await db
        .from("simulation_events")
        .select("status")
        .eq("run_id", data.runId)
        .eq("user_id", context.userId)
        .eq("event_key", ev.eventKey)
        .maybeSingle();
      if (cur && (statusRank[cur.status] ?? 0) > (statusRank[ev.status] ?? 0)) continue;
      const patch = {
        status: ev.status,
        viewed_at: ev.status === "viewed" ? now : undefined,
        responded_at: ev.status === "responded" ? now : undefined,
        completed_at: ev.status === "completed" ? now : undefined,
        unlocked_at: ev.status !== "locked" ? now : undefined,
      };
      await db
        .from("simulation_events")
        .update(patch)
        .eq("run_id", data.runId)
        .eq("user_id", context.userId)
        .eq("event_key", ev.eventKey);
    }

    return { ok: true as const };
  });
