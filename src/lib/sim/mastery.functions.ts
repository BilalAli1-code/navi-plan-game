// Server-side mastery service. Every meaningful learner action funnels through
// applyMasteryUpdates so the scoring rules live in ONE place (never in UI).
//
// Mastery model (per user + topic):
//   - recent_scores: rolling window of the last 10 activity scores (0-100)
//   - attempts: count of activities recorded for this topic
//   - successful_decisions: attempts scoring >= 75
//   - consecutive_correct / consecutive_wrong: streak counters
//   - mastery_score: weighted avg of recent_scores + difficulty & consistency
//                    adjustments, clamped 0-100
//   - is_mastered: mastery_score >= 85 AND attempts >= 3 AND streak of 3
//   - is_development_area: mastery_score < 40 AND attempts >= 2, OR 3 wrong streak

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type MasteryUpdate = {
  topic: string;                 // canonical topic label (unique key)
  score: number;                 // 0-100 for this activity
  pmbokDomain?: string | null;
  pmbokPrinciple?: string | null;
  ecoDomain?: string | null;
  competency?: string | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  deltaXp?: number;
};

const WINDOW = 10;

function computeMastery(
  prevRecent: number[],
  incoming: number,
  attempts: number,
  difficulty: MasteryUpdate["difficulty"],
): { mastery: number; recent: number[] } {
  const recent = [...prevRecent, incoming].slice(-WINDOW);
  // weighted average: newest weighted W, oldest weighted 1
  const n = recent.length;
  let num = 0;
  let den = 0;
  recent.forEach((s, i) => {
    const w = 1 + i * (2 / Math.max(n - 1, 1)); // 1..3
    num += s * w;
    den += w;
  });
  let mastery = num / den;

  // consistency
  const last3 = recent.slice(-3);
  if (last3.length === 3 && last3.every((s) => s >= 75)) mastery += 5;
  if (last3.length === 3 && last3.every((s) => s <= 30)) mastery -= 5;

  // difficulty
  if (difficulty === "hard") mastery += 4;
  if (difficulty === "easy") mastery -= 2;

  // low-attempt penalty (avoid mastery from one lucky answer)
  if (attempts < 3) mastery = mastery * 0.85;

  return { mastery: Math.max(0, Math.min(100, Math.round(mastery))), recent };
}

export const applyMasteryUpdates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { updates?: MasteryUpdate[] };
    if (!Array.isArray(i?.updates) || i.updates.length === 0)
      throw new Error("updates required");
    for (const u of i.updates) {
      if (!u.topic || typeof u.topic !== "string") throw new Error("topic required");
      if (typeof u.score !== "number" || u.score < 0 || u.score > 100)
        throw new Error("score must be 0-100");
    }
    return { updates: i.updates };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const now = new Date().toISOString();
    const results: Array<{ topic: string; mastery: number; is_mastered: boolean }> = [];

    for (const u of data.updates) {
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
      const successful = prevSuccess + (u.score >= 75 ? 1 : 0);
      const consecutive_correct = u.score >= 75 ? prevStreakOK + 1 : 0;
      const consecutive_wrong = u.score < 40 ? prevStreakBad + 1 : 0;
      const { mastery, recent } = computeMastery(
        prevRecent,
        u.score,
        attempts,
        u.difficulty ?? null,
      );

      const is_mastered = mastery >= 85 && attempts >= 3 && consecutive_correct >= 3;
      const is_development_area =
        (mastery < 40 && attempts >= 2) || consecutive_wrong >= 3;

      const row = {
        user_id: context.userId,
        topic: u.topic,
        pmbok_domain: u.pmbokDomain ?? existing?.pmbok_domain ?? null,
        pmbok_principle: u.pmbokPrinciple ?? existing?.pmbok_principle ?? null,
        eco_domain: u.ecoDomain ?? existing?.eco_domain ?? null,
        competency: u.competency ?? existing?.competency ?? null,
        difficulty: u.difficulty ?? existing?.difficulty ?? null,
        attempts,
        successful_decisions: successful,
        total_score: prevTotal + u.score,
        recent_scores: recent,
        consecutive_correct,
        consecutive_wrong,
        mastery_score: mastery,
        is_mastered,
        mastered_at: is_mastered ? existing?.mastered_at ?? now : null,
        is_development_area,
        last_practiced_at: now,
      };

      const { error } = await db
        .from("learner_mastery")
        .upsert(row, { onConflict: "user_id,topic" });
      if (error) throw new Error(error.message);
      results.push({ topic: u.topic, mastery, is_mastered });
    }

    return { results };
  });

export const listMastery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const { data, error } = await db
      .from("learner_mastery")
      .select("*")
      .eq("user_id", context.userId)
      .order("mastery_score", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Tables<"learner_mastery">[] };
  });
