// Server function: processAction.
//
// Pipeline (server-authoritative):
//   1. Validate input (Zod)                           — reject early
//   2. Load trusted simulation_runs row (RLS-scoped)  — trusted state
//   3. Resolve subject (stakeholder / risk / conflict) from case catalogs
//   4. Duplicate check on (run_id, action_key)        — idempotent
//   5. Compute outcome deterministically (pure engine)
//   6. Insert simulation_actions row
//   7. Apply metric delta to simulation_runs snapshot + top-level columns
//   8. Upsert learner_mastery for each mastery impact (same math as mastery.functions)
//   9. Upsert delayed simulation_events (idempotent by event_key)
//  10. Return outcome for optimistic UI

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json, Tables } from "@/integrations/supabase/types";
import { stakeholdersFor } from "./cases";
import { findConflict, findRisk } from "./risks";
import { computeActionOutcome } from "./actions.engine";
import { ActionInputSchema, type ActionInput } from "./actions";
import type { MetricImpact, ProjectMetrics, SimState } from "./types";
import type { MasteryUpdate } from "./mastery.functions";

const asJson = (v: unknown): Json => v as Json;
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function applyDelta(m: ProjectMetrics, d: MetricImpact): ProjectMetrics {
  const next: ProjectMetrics = {
    ...m,
    budget: clamp(m.budget + (d.budget ?? 0)),
    schedule: clamp(m.schedule + (d.schedule ?? 0)),
    risk: clamp(m.risk + (d.risk ?? 0)),
    morale: clamp(m.morale + (d.morale ?? 0)),
    trust: clamp(m.trust + (d.trust ?? 0)),
    quality: clamp(m.quality + (d.quality ?? 0)),
    satisfaction: clamp(m.satisfaction + (d.satisfaction ?? 0)),
  };
  next.health = Math.round(
    (next.budget + next.schedule + next.risk + next.morale + next.trust + next.quality + next.satisfaction) / 7,
  );
  return next;
}

// Same mastery math as mastery.functions.computeMastery — duplicated intentionally
// so processAction can update mastery inside the same transaction path.
const WINDOW = 10;
function computeMastery(
  prevRecent: number[],
  incoming: number,
  attempts: number,
  difficulty: MasteryUpdate["difficulty"],
): { mastery: number; recent: number[] } {
  const recent = [...prevRecent, incoming].slice(-WINDOW);
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

export const processAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    // Discriminated union parse.
    const raw = (input as { action?: unknown })?.action ?? input;
    const parsed = ActionInputSchema.parse(raw);
    return { action: parsed as ActionInput };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const action = data.action;

    // 2. Load trusted run.
    const { data: run, error: runErr } = await db
      .from("simulation_runs")
      .select("id, case_id, state_snapshot, current_day")
      .eq("id", action.runId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (runErr) throw new Error(runErr.message);
    if (!run) throw new Error("run not found");
    const snapshot = (run.state_snapshot ?? {}) as Partial<SimState>;
    const caseId = (snapshot.caseId ?? run.case_id) as string;
    const metrics = (snapshot.metrics ?? {
      health: 75, budget: 80, schedule: 80, risk: 65,
      morale: 75, trust: 70, quality: 75, satisfaction: 70,
    }) as ProjectMetrics;

    // 3. Resolve subject + compute outcome.
    let outcome;
    if (action.actionType === "stakeholder_interaction") {
      const stakeholder = stakeholdersFor(caseId).find(
        (s) => s.id === action.stakeholderId,
      );
      if (!stakeholder) throw new Error(`unknown stakeholder ${action.stakeholderId}`);
      outcome = computeActionOutcome({
        input: action,
        stakeholder,
        currentTrust: metrics.trust,
      });
    } else if (action.actionType === "risk_response") {
      const risk = findRisk(caseId, action.riskId);
      if (!risk) throw new Error(`unknown risk ${action.riskId}`);
      if (risk.riskType !== action.riskType) {
        throw new Error("risk type mismatch");
      }
      outcome = computeActionOutcome({ input: action, risk });
    } else {
      const conflict = findConflict(caseId, action.conflictId);
      if (!conflict) throw new Error(`unknown conflict ${action.conflictId}`);
      outcome = computeActionOutcome({ input: action, conflict });
    }

    // 4. Duplicate check. Use a stable key for risk/conflict; interactions get a
    //    timestamped key so multiple chat turns are allowed.
    const stableKey =
      action.actionType === "risk_response"
        ? `risk:${action.riskId}`
        : action.actionType === "conflict_management"
          ? `conflict:${action.conflictId}`
          : outcome.actionKey;

    if (
      action.actionType === "risk_response" ||
      action.actionType === "conflict_management"
    ) {
      const { data: existing } = await db
        .from("simulation_actions")
        .select("id")
        .eq("run_id", action.runId)
        .eq("action_key", stableKey)
        .maybeSingle();
      if (existing) {
        return {
          ok: false as const,
          duplicate: true as const,
          actionId: existing.id as string,
          message: "This action has already been submitted for this run.",
          quality: null,
          outcomeData: asJson({}),
          metricImpacts: asJson({}),
          metrics: asJson({}),
          masteryTopics: [] as string[],
          delayedEventKeys: [] as string[],
        };
      }
    }

    // 5+6. Insert action row.
    const { data: inserted, error: insertErr } = await db
      .from("simulation_actions")
      .insert({
        run_id: action.runId,
        user_id: context.userId,
        section_number: action.sectionNumber,
        action_type: action.actionType,
        action_key: stableKey,
        subject_id: outcome.subjectId,
        input_data: asJson(action),
        outcome_data: asJson(outcome.outcomeData),
        metric_impacts: asJson(outcome.metricImpacts),
        mastery_impacts: asJson(outcome.masteryImpacts),
        pmbok_mapping: asJson(outcome.pmbokMapping),
        eco_mapping: asJson(outcome.ecoMapping),
      })
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);

    // 7. Update trusted metrics on the run.
    const nextMetrics = applyDelta(metrics, outcome.metricImpacts);
    const nextSnapshot: Partial<SimState> = { ...snapshot, metrics: nextMetrics };
    const { error: updErr } = await db
      .from("simulation_runs")
      .update({
        state_snapshot: asJson(nextSnapshot),
        project_health: Math.round(nextMetrics.health),
        budget_score: Math.round(nextMetrics.budget),
        schedule_score: Math.round(nextMetrics.schedule),
        risk_score: Math.round(nextMetrics.risk),
        quality_score: Math.round(nextMetrics.quality),
        team_morale: Math.round(nextMetrics.morale),
        stakeholder_trust: Math.round(nextMetrics.trust),
        customer_satisfaction: Math.round(nextMetrics.satisfaction),
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", action.runId)
      .eq("user_id", context.userId);
    if (updErr) throw new Error(updErr.message);

    // 8. Apply mastery updates.
    const now = new Date().toISOString();
    for (const u of outcome.masteryImpacts) {
      const { data: existing } = await db
        .from("learner_mastery")
        .select("*")
        .eq("user_id", context.userId)
        .eq("topic", u.topic)
        .maybeSingle();
      const prevAttempts: number = existing?.attempts ?? 0;
      const prevSuccess: number = existing?.successful_decisions ?? 0;
      const prevRecent: number[] = Array.isArray(existing?.recent_scores)
        ? (existing.recent_scores as number[])
        : [];
      const prevStreakOK: number = existing?.consecutive_correct ?? 0;
      const prevStreakBad: number = existing?.consecutive_wrong ?? 0;
      const prevTotal: number = Number(existing?.total_score ?? 0);

      const attempts = prevAttempts + 1;
      const successful = prevSuccess + ((u.score ?? 0) >= 75 ? 1 : 0);
      const consecutive_correct = (u.score ?? 0) >= 75 ? prevStreakOK + 1 : 0;
      const consecutive_wrong = (u.score ?? 0) < 40 ? prevStreakBad + 1 : 0;
      const { mastery, recent } = computeMastery(prevRecent, (u.score ?? 0), attempts, u.difficulty ?? null);
      const is_mastered = mastery >= 85 && attempts >= 3 && consecutive_correct >= 3;
      const is_development_area =
        (mastery < 40 && attempts >= 2) || consecutive_wrong >= 3;

      const { error: masErr } = await db
        .from("learner_mastery")
        .upsert(
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
            total_score: prevTotal + (u.score ?? 0),
            recent_scores: recent,
            consecutive_correct,
            consecutive_wrong,
            mastery_score: mastery,
            is_mastered,
            mastered_at: is_mastered ? existing?.mastered_at ?? now : null,
            is_development_area,
            last_practiced_at: now,
          },
          { onConflict: "user_id,topic" },
        );
      if (masErr) throw new Error(masErr.message);
    }

    // 9. Upsert delayed simulation_events.
    if (outcome.delayedEvents.length > 0) {
      const rows = outcome.delayedEvents.map((e) => ({
        run_id: action.runId,
        user_id: context.userId,
        event_key: e.eventKey,
        event_type: e.eventType,
        status: "available",
        day_number: Math.min(7, action.sectionNumber + (e.dayOffset ?? 1)),
        priority: e.priority ?? "normal",
        payload: asJson(e.payload),
        pmbok_mapping: asJson(outcome.pmbokMapping),
        eco_mapping: asJson(outcome.ecoMapping),
        unlocked_at: now,
      }));
      const { error: evErr } = await db
        .from("simulation_events")
        .upsert(rows, { onConflict: "run_id,event_key", ignoreDuplicates: false });
      if (evErr) throw new Error(evErr.message);
    }

    return {
      ok: true as const,
      duplicate: false as const,
      actionId: inserted.id as string,
      message: null as string | null,
      quality: outcome.quality as string | null,
      outcomeData: asJson(outcome.outcomeData),
      metricImpacts: asJson(outcome.metricImpacts),
      metrics: asJson(nextMetrics),
      masteryTopics: outcome.masteryImpacts.map((m) => m.topic),
      delayedEventKeys: outcome.delayedEvents.map((e) => e.eventKey),
    };
  });

export const listActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("simulation_actions")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { actions: (rows ?? []) as Tables<"simulation_actions">[] };
  });
