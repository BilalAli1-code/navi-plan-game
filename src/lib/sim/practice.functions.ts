// Adaptive practice server functions. All helpers live in ./practice.server so
// the TanStack server-fn splitter doesn't strip them from handler bundles.
// Selection logic lives in ./selection.server and is dynamically imported
// inside the handler for the same reason.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireFeature } from "@/lib/billing/entitlement.server";
import type { Json } from "@/integrations/supabase/types";
import type { PracticeQuestion } from "./practice.server";

export type { PracticeQuestion } from "./practice.server";

export const startPracticeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return { runId: i.runId, dayNumber: i.dayNumber };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireFeature(db, context.userId, "adaptive_practice");

    const { data: existing } = await db
      .from("practice_sessions")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("day_number", data.dayNumber)
      .in("status", ["in_progress", "completed"])
      .order("created_at", { ascending: false })
      .limit(1);
    const current = existing?.[0];
    if (current) {
      const { data: attempts } = await db
        .from("practice_attempts")
        .select("*")
        .eq("session_id", current.id)
        .eq("user_id", context.userId);
      return { session: current, attempts: attempts ?? [] };
    }

    // Delegate to the adaptive selection engine (server-only import).
    const { selectAdaptiveQuestions } = await import("./selection.server");
    const { questions, metadata } = await selectAdaptiveQuestions({
      db,
      userId: context.userId,
      runId: data.runId,
      dayNumber: data.dayNumber,
      questionCount: 5,
    });

    const { data: inserted, error: insErr } = await db
      .from("practice_sessions")
      .insert({
        run_id: data.runId,
        user_id: context.userId,
        day_number: data.dayNumber,
        status: "in_progress",
        total_questions: questions.length,
        estimated_minutes: 10,
        questions: questions as unknown as Json,
        metadata: metadata as unknown as Json,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { session: inserted, attempts: [] };
  });

export const submitPracticeAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { sessionId?: string; questionId?: string; selectedOptionId?: string };
    if (!i?.sessionId || !i?.questionId || !i?.selectedOptionId)
      throw new Error("sessionId/questionId/selectedOptionId required");
    return {
      sessionId: i.sessionId,
      questionId: i.questionId,
      selectedOptionId: i.selectedOptionId,
    };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireFeature(db, context.userId, "adaptive_practice");
    const { data: session, error: sErr } = await db
      .from("practice_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .single();
    if (sErr) throw new Error(sErr.message);
    if (session.status === "completed") throw new Error("Session already completed");

    const questions = (session.questions ?? []) as PracticeQuestion[];
    const q = questions.find((qq) => qq.id === data.questionId);
    if (!q) throw new Error("Question not found");
    const selected = q.options.find((o) => o.id === data.selectedOptionId);
    if (!selected) throw new Error("Invalid option");
    const correct = q.options.find((o) => o.id === q.correctOptionId);
    const isCorrect = data.selectedOptionId === q.correctOptionId;

    const feedback = {
      effective: isCorrect,
      why: isCorrect
        ? `Effective. ${selected.rationale}`
        : `Not the strongest option. ${selected.rationale}`,
      strongerOption: isCorrect
        ? null
        : { id: correct?.id, label: correct?.label ?? "", rationale: correct?.rationale ?? "" },
      alternatives: q.options
        .filter((o) => o.id !== data.selectedOptionId && o.id !== q.correctOptionId)
        .map((o) => ({ label: o.label, why: o.rationale })),
      pmbokPrinciple: q.pmbokPrinciple,
      pmbokDomain: q.pmbokDomain,
      ecoDomain: q.ecoDomain,
      competency: q.competency,
      takeaway: q.takeaway,
    };

    const { error: insErr } = await db.from("practice_attempts").upsert(
      {
        session_id: data.sessionId,
        run_id: session.run_id,
        user_id: context.userId,
        question_id: q.id,
        selected_answer: data.selectedOptionId,
        correct_answer: q.correctOptionId,
        is_correct: isCorrect,
        reasoning: selected.rationale,
        feedback: feedback as unknown as Json,
        pmbok_mapping: { principle: q.pmbokPrinciple, domain: q.pmbokDomain } as unknown as Json,
        eco_mapping: { domain: q.ecoDomain, competency: q.competency } as unknown as Json,
      },
      { onConflict: "session_id,question_id" },
    );
    if (insErr) throw new Error(insErr.message);

    return { isCorrect, feedback };
  });

export const completePracticeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { sessionId?: string };
    if (!i?.sessionId) throw new Error("sessionId required");
    return { sessionId: i.sessionId };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireFeature(db, context.userId, "adaptive_practice");
    const { data: session, error: sErr } = await db
      .from("practice_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .eq("user_id", context.userId)
      .single();
    if (sErr) throw new Error(sErr.message);

    const { data: attempts, error: aErr } = await db
      .from("practice_attempts")
      .select("*")
      .eq("session_id", data.sessionId)
      .eq("user_id", context.userId);
    if (aErr) throw new Error(aErr.message);

    const questions = (session.questions ?? []) as PracticeQuestion[];
    const total = questions.length;
    const answered = new Set((attempts ?? []).map((a: { question_id: string }) => a.question_id));
    if (answered.size < total) throw new Error(`Answer all ${total} questions before completing.`);

    const correct = (attempts ?? []).filter((a: { is_correct: boolean }) => a.is_correct).length;
    const score = Math.round((correct / total) * 100);

    const { error: upErr } = await db
      .from("practice_sessions")
      .update({
        status: "completed",
        correct_answers: correct,
        score,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("user_id", context.userId);
    if (upErr) throw new Error(upErr.message);

    // Update learner_mastery via the shared service (one record per topic).
    // Group attempts by canonical topic derived from PMBOK/ECO mapping.
    const byTopic = new Map<
      string,
      {
        correct: number;
        total: number;
        pmbokDomain?: string;
        pmbokPrinciple?: string;
        ecoDomain?: string;
        competency?: string;
      }
    >();
    for (const a of attempts ?? []) {
      const attempt = a as {
        eco_mapping: { domain?: string; competency?: string } | null;
        pmbok_mapping: { domain?: string; principle?: string } | null;
        is_correct: boolean;
      };
      const dom = attempt.pmbok_mapping?.domain ?? "Process";
      const eco = attempt.eco_mapping?.domain ?? "Process";
      const topic = `${dom} — ${eco}`;
      const cur = byTopic.get(topic) ?? {
        correct: 0,
        total: 0,
        pmbokDomain: dom,
        pmbokPrinciple: attempt.pmbok_mapping?.principle,
        ecoDomain: eco,
        competency: attempt.eco_mapping?.competency,
      };
      cur.total += 1;
      if (attempt.is_correct) cur.correct += 1;
      byTopic.set(topic, cur);
    }
    const now2 = new Date().toISOString();
    for (const [topic, stats] of byTopic) {
      // Session-level score for this topic drives the mastery delta.
      const score = Math.round((stats.correct / Math.max(stats.total, 1)) * 100);
      const { data: existing } = await db
        .from("learner_mastery")
        .select("*")
        .eq("user_id", context.userId)
        .eq("topic", topic)
        .maybeSingle();
      const prevAttempts: number = existing?.attempts ?? 0;
      const prevSuccess: number = existing?.successful_decisions ?? 0;
      const prevRecent: number[] = Array.isArray(existing?.recent_scores)
        ? (existing.recent_scores as number[])
        : [];
      const prevStreakOK: number = existing?.consecutive_correct ?? 0;
      const prevStreakBad: number = existing?.consecutive_wrong ?? 0;
      const attemptsN = prevAttempts + 1;
      const recent = [...prevRecent, score].slice(-10);
      const n = recent.length;
      let num = 0,
        den = 0;
      recent.forEach((s, i) => {
        const w = 1 + i * (2 / Math.max(n - 1, 1));
        num += s * w;
        den += w;
      });
      let mastery = num / den;
      const last3 = recent.slice(-3);
      if (last3.length === 3 && last3.every((s) => s >= 75)) mastery += 5;
      if (last3.length === 3 && last3.every((s) => s <= 30)) mastery -= 5;
      if (attemptsN < 3) mastery *= 0.85;
      const masteryScore = Math.max(0, Math.min(100, Math.round(mastery)));
      const consecutive_correct = score >= 75 ? prevStreakOK + 1 : 0;
      const consecutive_wrong = score < 40 ? prevStreakBad + 1 : 0;
      const isMastered = masteryScore >= 85 && attemptsN >= 3 && consecutive_correct >= 3;

      try {
        await db.from("learner_mastery").upsert(
          {
            user_id: context.userId,
            topic,
            pmbok_domain: stats.pmbokDomain ?? null,
            pmbok_principle: stats.pmbokPrinciple ?? null,
            eco_domain: stats.ecoDomain ?? null,
            competency: stats.competency ?? null,
            difficulty: "medium",
            attempts: attemptsN,
            successful_decisions: prevSuccess + (score >= 75 ? 1 : 0),
            recent_scores: recent,
            consecutive_correct,
            consecutive_wrong,
            mastery_score: masteryScore,
            is_mastered: isMastered,
            mastered_at: isMastered ? (existing?.mastered_at ?? now2) : null,
            is_development_area: (masteryScore < 40 && attemptsN >= 2) || consecutive_wrong >= 3,
            last_practiced_at: now2,
          },
          { onConflict: "user_id,topic" },
        );
      } catch {
        /* best-effort */
      }
    }

    // Record the practice event.
    try {
      await db.from("simulation_events").upsert(
        {
          run_id: session.run_id,
          user_id: context.userId,
          event_key: `practice:day-${session.day_number}`,
          event_type: "practice",
          status: "completed",
          day_number: session.day_number,
          priority: "normal",
          completed_at: new Date().toISOString(),
          unlocked_at: session.created_at ?? new Date().toISOString(),
          payload: { score, correct, total },
        },
        { onConflict: "run_id,event_key" },
      );
    } catch {
      /* best-effort */
    }

    // Mark the daily "practice" activity complete and unlock the next day when all done.
    try {
      const { data: dayRow } = await db
        .from("daily_progress")
        .select(
          "id, practice_completed, briefing_completed, learning_completed, workplace_activities_completed, decisions_completed, reflection_completed",
        )
        .eq("run_id", session.run_id)
        .eq("user_id", context.userId)
        .eq("day_number", session.day_number)
        .single();
      if (dayRow && !dayRow.practice_completed) {
        const flags = {
          briefing: dayRow.briefing_completed,
          learning: dayRow.learning_completed,
          workplace: dayRow.workplace_activities_completed,
          decisions: dayRow.decisions_completed,
          practice: true,
          reflection: dayRow.reflection_completed,
        };
        const done = Object.values(flags).filter(Boolean).length;
        const allDone = done === 6;
        await db
          .from("daily_progress")
          .update({
            practice_completed: true,
            completion_percentage: Math.round((done / 6) * 100),
            completed_minutes: Math.round((done / 6) * 60),
            status: allDone ? "completed" : "in_progress",
            completed_at: allDone ? new Date().toISOString() : null,
          })
          .eq("id", dayRow.id)
          .eq("user_id", context.userId);
        if (allDone && session.day_number < 7) {
          await db
            .from("daily_progress")
            .update({ status: "available" })
            .eq("run_id", session.run_id)
            .eq("user_id", context.userId)
            .eq("day_number", session.day_number + 1)
            .eq("status", "locked");
        }
      }
    } catch {
      /* best-effort */
    }

    return { score, correct, total };
  });

export const getPracticeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return { runId: i.runId, dayNumber: i.dayNumber };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    try {
      await requireFeature(db, context.userId, "adaptive_practice");
    } catch (e) {
      if (e instanceof Response) {
        return { session: null, attempts: [], locked: true as const };
      }
      throw e;
    }
    const { data: rows } = await db
      .from("practice_sessions")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("day_number", data.dayNumber)
      .order("created_at", { ascending: false })
      .limit(1);
    const session = rows?.[0] ?? null;
    if (!session) return { session: null, attempts: [] };
    const { data: attempts } = await db
      .from("practice_attempts")
      .select("*")
      .eq("session_id", session.id)
      .eq("user_id", context.userId);
    return { session, attempts: attempts ?? [] };
  });
