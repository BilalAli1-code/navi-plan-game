// Adaptive practice: AI-generated PMP-style questions per simulation day.
// Questions are generated server-side, scored server-side, and completion is
// gated on submitted answers — no client-side "mark complete" path.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getDay } from "./days";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: unknown) => v as any;

const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        rationale: z.string().describe("Why this option is stronger or weaker than the others."),
      }),
    )
    .min(3)
    .max(4),
  correctOptionId: z.string(),
  pmbokPrinciple: z.string(),
  pmbokDomain: z.string(),
  ecoDomain: z.enum(["People", "Process", "Business Environment"]),
  competency: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  takeaway: z.string().describe("One-sentence practical takeaway."),
});

const GenSchema = z.object({
  questions: z.array(QuestionSchema).min(4).max(6),
});

export type PracticeQuestion = z.infer<typeof QuestionSchema>;

async function generateQuestionsWithAI(input: {
  dayNumber: number;
  phase: string;
  approach: string | null;
  caseTitle: string;
  weakDomains: string[];
  recentDecisions: string[];
  correctRate: number;
}): Promise<PracticeQuestion[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const day = getDay(input.dayNumber);
  const targeting =
    input.weakDomains.length > 0
      ? `Emphasize these weaker areas: ${input.weakDomains.join(", ")}.`
      : `Balance across People, Process, and Business Environment.`;

  const difficulty =
    input.correctRate < 0.5 ? "easy-to-medium" : input.correctRate > 0.8 ? "medium-to-hard" : "medium";

  const prompt = `Generate 5 adaptive PMP practice questions for a learner on Day ${input.dayNumber} of a 7-day PMBOK simulation.

Simulation context:
- Project: ${input.caseTitle}
- Day focus: ${day.title} — ${day.focus}
- Current PMBOK performance domain / phase: ${input.phase}
- Delivery approach chosen: ${input.approach ?? "not yet selected"}
- Learner correctness so far: ${(input.correctRate * 100).toFixed(0)}%
- Recent simulation decisions the learner made: ${input.recentDecisions.slice(0, 6).join(" | ") || "none yet"}

Instructions:
- Mix question styles: multiple-choice, situational, best-next-action, matching concepts.
- Difficulty: mostly ${difficulty}.
- ${targeting}
- Each question must have 3-4 options with a unique correctOptionId.
- Every option's rationale must explain why it is stronger or weaker than the others (do NOT restrict this to only the correct one).
- Map every question to a PMBOK principle, PMBOK performance domain, PMI ECO domain (People / Process / Business Environment), and a PM competency (e.g. Risk Management, Stakeholder Engagement, Change Control).
- Ground language in PMI terminology. Use realistic project situations, not textbook definitions.
- Return JSON only.`;

  const { object } = await generateObject({
    model,
    schema: GenSchema,
    prompt,
  });
  return object.questions;
}

// Fallback questions if AI is unavailable — never lets practice hard-fail.
function fallbackQuestions(dayNumber: number, phase: string): PracticeQuestion[] {
  const day = getDay(dayNumber);
  const mk = (n: number, prompt: string, correct: string, opts: [string, string, string, string]): PracticeQuestion => ({
    id: `d${dayNumber}-q${n}`,
    prompt,
    options: opts.map((o, i) => ({
      id: `o${i}`,
      label: o,
      rationale:
        `o${i}` === correct
          ? "Aligns with PMI stewardship, stakeholder engagement, and value delivery."
          : "Bypasses PMI-recommended engagement, integration, or risk controls.",
    })),
    correctOptionId: correct,
    pmbokPrinciple: "Stakeholders",
    pmbokDomain: day.phase,
    ecoDomain: n % 3 === 0 ? "Business Environment" : n % 2 === 0 ? "Process" : "People",
    competency: "Project Management Fundamentals",
    difficulty: "medium",
    takeaway: "PMI expects proactive stakeholder engagement and integrated change control.",
  });
  return [
    mk(1, `In the ${phase} phase, what should the project manager do FIRST when a critical stakeholder raises a concern?`, "o0", [
      "Listen, log the concern in the register, then plan engagement",
      "Escalate to the sponsor immediately",
      "Reassure them that the plan is on track",
      "Wait until the next status meeting",
    ]),
    mk(2, `A team member misses a key deadline during ${phase}. Best next action?`, "o1", [
      "Escalate to their functional manager",
      "Have a private, coaching conversation to understand root cause",
      "Reduce their scope silently",
      "Note it in performance review",
    ]),
    mk(3, `A change request would improve value but exceed the current baseline. What should you do?`, "o0", [
      "Submit through integrated change control",
      "Approve informally to keep momentum",
      "Reject to protect the baseline",
      "Defer to closing",
    ]),
    mk(4, `Which artifact best supports adaptive tailoring decisions during ${phase}?`, "o2", [
      "Charter",
      "Risk register",
      "Tailoring workshop outputs and lessons learned",
      "Stakeholder register",
    ]),
    mk(5, `The sponsor wants weekly one-page updates. Which principle drives your format?`, "o0", [
      "Stakeholder engagement + value delivery",
      "Quality management",
      "Risk optimization",
      "Change control",
    ]),
  ];
}

// Start (or resume) a practice session for a day.
export const startPracticeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; dayNumber?: number };
    if (!i?.runId || !i?.dayNumber) throw new Error("runId/dayNumber required");
    return { runId: i.runId, dayNumber: i.dayNumber };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;

    // Reuse an in-progress session if one exists.
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

    // Build adaptive context from the run snapshot.
    const { data: runRow, error: runErr } = await db
      .from("simulation_runs")
      .select("state_snapshot, selected_delivery_approach, current_phase, case_id")
      .eq("id", data.runId)
      .eq("user_id", context.userId)
      .single();
    if (runErr) throw new Error(runErr.message);

    const snapshot = (runRow?.state_snapshot ?? {}) as {
      log?: Array<{ correct?: boolean; atPhase?: string; decisionId?: string }>;
      decisions?: Array<{ id: string; title: string; ecoDomain?: string }>;
    };
    const log = snapshot.log ?? [];
    const total = log.length || 1;
    const correctRate = log.filter((l) => l.correct).length / total;
    const decisionMap = new Map((snapshot.decisions ?? []).map((d) => [d.id, d]));
    const recentDecisions = log
      .slice(-6)
      .map((l) => decisionMap.get(l.decisionId ?? "")?.title ?? "decision")
      .filter(Boolean);
    const weakDomains = Array.from(
      new Set(
        log
          .filter((l) => l.correct === false)
          .map((l) => decisionMap.get(l.decisionId ?? "")?.ecoDomain)
          .filter((x): x is string => !!x),
      ),
    );

    let questions: PracticeQuestion[];
    try {
      questions = await generateQuestionsWithAI({
        dayNumber: data.dayNumber,
        phase: runRow?.current_phase ?? "Initiation",
        approach: runRow?.selected_delivery_approach ?? null,
        caseTitle: runRow?.case_id ?? "project",
        weakDomains,
        recentDecisions,
        correctRate,
      });
    } catch {
      questions = fallbackQuestions(data.dayNumber, runRow?.current_phase ?? "Initiation");
    }

    const { data: inserted, error: insErr } = await db
      .from("practice_sessions")
      .insert({
        run_id: data.runId,
        user_id: context.userId,
        day_number: data.dayNumber,
        status: "in_progress",
        total_questions: questions.length,
        estimated_minutes: 10,
        questions: asJson(questions),
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { session: inserted, attempts: [] };
  });

// Submit a single answer. Feedback is built server-side from the stored
// question metadata — the browser cannot claim a wrong answer is correct.
export const submitPracticeAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { sessionId?: string; questionId?: string; selectedOptionId?: string };
    if (!i?.sessionId || !i?.questionId || !i?.selectedOptionId)
      throw new Error("sessionId/questionId/selectedOptionId required");
    return { sessionId: i.sessionId, questionId: i.questionId, selectedOptionId: i.selectedOptionId };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
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
      strongerOption: isCorrect ? null : { id: correct?.id, label: correct?.label, rationale: correct?.rationale ?? "" },
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
        feedback: asJson(feedback),
        pmbok_mapping: asJson({ principle: q.pmbokPrinciple, domain: q.pmbokDomain }),
        eco_mapping: asJson({ domain: q.ecoDomain, competency: q.competency }),
      },
      { onConflict: "session_id,question_id" },
    );
    if (insErr) throw new Error(insErr.message);

    return { isCorrect, feedback };
  });

// Finalize the session: score, mark completed, update learner_mastery per ECO
// domain, and mark the daily "practice" activity complete.
export const completePracticeSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { sessionId?: string };
    if (!i?.sessionId) throw new Error("sessionId required");
    return { sessionId: i.sessionId };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
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

    // Update learner_mastery per ECO domain (best-effort).
    const byDomain = new Map<string, { correct: number; total: number }>();
    for (const a of attempts ?? []) {
      const attempt = a as { eco_mapping: { domain?: string } | null; is_correct: boolean };
      const dom = attempt.eco_mapping?.domain ?? "Process";
      const cur = byDomain.get(dom) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (attempt.is_correct) cur.correct += 1;
      byDomain.set(dom, cur);
    }
    for (const [domain, stats] of byDomain) {
      try {
        await db.from("learner_mastery").upsert(
          {
            user_id: context.userId,
            eco_domain: domain,
            attempts: stats.total,
            correct: stats.correct,
            last_practiced_at: new Date().toISOString(),
          },
          { onConflict: "user_id,eco_domain" },
        );
      } catch {
        /* learner_mastery schema may differ; ignore */
      }
    }

    // Mark the daily practice activity as complete.
    try {
      const { data: dayRow } = await db
        .from("daily_progress")
        .select("id, practice_completed, briefing_completed, learning_completed, workplace_activities_completed, decisions_completed, reflection_completed")
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
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
