// Adaptive practice selection engine.
//
// This module is intentionally server-only (imported from practice.functions.ts
// inside handlers so the TanStack server-fn splitter never ships it to the
// browser). It composes a mastery-driven "selection brief" and drives the
// AI question generator to produce a mix of dev-area, current-simulation,
// spaced-repetition, and reinforcement questions.
//
// Weighting rules (see DEFAULT_MIX):
//   • 50% development-area topics (is_development_area or mastery_score < 55)
//   • 25% current-simulation topics (phase / approach / weak decisions)
//   • 15% spaced-repetition (topics not practiced recently)
//   • 10% broader reinforcement (mastered but underexposed)
//
// The engine never returns identical questions from the last few sessions —
// prior question IDs and topic exposure counts are passed to the generator
// with an explicit "vary the scenario" instruction. Difficulty starts near
// the learner's mastery level and adapts per session correctness.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";
import { generateAdaptiveQuestions, fallbackPracticeQuestions, type PracticeQuestion } from "./practice.server";
import { getDay } from "./days";

export type SelectionSource =
  | "development_area"
  | "current_simulation"
  | "spaced_repetition"
  | "reinforcement";

export type SelectionMix = {
  development_area: number;
  current_simulation: number;
  spaced_repetition: number;
  reinforcement: number;
};

export const DEFAULT_MIX: SelectionMix = {
  development_area: 0.5,
  current_simulation: 0.25,
  spaced_repetition: 0.15,
  reinforcement: 0.1,
};

export type SelectedQuestion = PracticeQuestion & {
  selectionReason: string;
  masteryTopic: string | null;
  selectionSource: SelectionSource;
};

export type SelectionMetadata = {
  intent: string;
  learnerFacingSummary: string;
  mix: SelectionMix;
  slotPlan: Array<{ source: SelectionSource; count: number; topics: string[] }>;
  avoidedQuestionIds: string[];
  masteryContext: {
    developmentAreas: string[];
    lowMasteryTopics: string[];
    masteredTopics: string[];
    averageMastery: number;
  };
  simulationContext: {
    phase: string;
    approach: string | null;
    caseId: string;
    weakDecisions: string[];
  };
  generatedAt: string;
};

type Db = SupabaseClient<Database>;
type MasteryRow = Tables<"learner_mastery">;
type AttemptRow = Tables<"practice_attempts">;

function targetDifficulty(avgMastery: number): "easy-to-medium" | "medium" | "medium-to-hard" {
  if (avgMastery < 45) return "easy-to-medium";
  if (avgMastery > 78) return "medium-to-hard";
  return "medium";
}

function planSlots(count: number, mix: SelectionMix) {
  // Convert ratios to integer slot counts summing to `count`. Distribute
  // rounding remainder to the highest-weight source first (dev area).
  const sources: SelectionSource[] = [
    "development_area",
    "current_simulation",
    "spaced_repetition",
    "reinforcement",
  ];
  const raw = sources.map((s) => ({ source: s, want: mix[s] * count }));
  const base = raw.map((r) => ({ source: r.source, count: Math.floor(r.want), frac: r.want - Math.floor(r.want) }));
  let assigned = base.reduce((a, b) => a + b.count, 0);
  const order = [...base].sort((a, b) => b.frac - a.frac);
  for (let i = 0; assigned < count && i < order.length; i++, assigned++) {
    const t = order[i];
    const target = base.find((b) => b.source === t.source)!;
    target.count += 1;
  }
  return base.map((b) => ({ source: b.source, count: b.count }));
}

async function loadMastery(db: Db, userId: string): Promise<MasteryRow[]> {
  const { data } = await db
    .from("learner_mastery")
    .select("*")
    .eq("user_id", userId)
    .order("mastery_score", { ascending: true });
  return data ?? [];
}

async function loadRecentAttempts(db: Db, userId: string, limit = 60): Promise<AttemptRow[]> {
  const { data } = await db
    .from("practice_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function loadRecentQuestionIds(db: Db, userId: string, runId: string): Promise<string[]> {
  // Last 3 sessions for this user (any run) — avoid immediate identical repeats
  const { data } = await db
    .from("practice_sessions")
    .select("questions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);
  const ids = new Set<string>();
  for (const s of data ?? []) {
    const qs = (s.questions as unknown as { id?: string }[] | null) ?? [];
    for (const q of qs) if (q?.id) ids.add(q.id);
  }
  return Array.from(ids);
}

async function loadWeakDecisions(db: Db, runId: string, userId: string) {
  const { data } = await db
    .from("simulation_decisions")
    .select("selected_option_text, phase, mentor_feedback, decision_id")
    .eq("user_id", userId)
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

function pickDevAreaTopics(mastery: MasteryRow[]): string[] {
  const dev = mastery.filter((m) => m.is_development_area || m.mastery_score < 55);
  return dev.slice(0, 6).map((m) => m.topic);
}

function pickLowMasteryTopics(mastery: MasteryRow[]): string[] {
  return mastery.filter((m) => m.mastery_score < 65 && m.attempts >= 1).slice(0, 8).map((m) => m.topic);
}

function pickMasteredTopics(mastery: MasteryRow[]): string[] {
  return mastery.filter((m) => m.is_mastered || m.mastery_score >= 85).slice(0, 6).map((m) => m.topic);
}

function pickSpacedRepetitionTopics(mastery: MasteryRow[]): string[] {
  const now = Date.now();
  return mastery
    .filter((m) => {
      if (!m.last_practiced_at) return m.attempts > 0;
      const ageDays = (now - new Date(m.last_practiced_at).getTime()) / 86_400_000;
      return ageDays >= 2 && m.mastery_score < 90;
    })
    .slice(0, 6)
    .map((m) => m.topic);
}

function buildIntent(
  devAreas: string[],
  simContext: { phase: string; approach: string | null; weakDecisions: string[] },
): { intent: string; learnerFacing: string } {
  const short = (s: string) => s.replace(/^[^—]+—\s*/, "").trim();
  const emphasis = devAreas.slice(0, 3).map(short);
  const weak = simContext.weakDecisions.slice(0, 2);
  const parts: string[] = [];
  if (emphasis.length) parts.push(emphasis.join(", "));
  else parts.push(`${simContext.phase} performance domain`);
  const learnerFacing =
    parts.length && emphasis.length
      ? `Today's practice focuses on ${parts[0]} — your recent activity shows this is a development area${
          weak.length ? `, and you had close calls on ${weak.join(" and ")}` : ""
        }.`
      : `Today's practice reinforces ${simContext.phase} concepts aligned to your ${
          simContext.approach ?? "chosen"
        } delivery approach.`;
  const intent = `dev_area=[${devAreas.slice(0, 4).join("|")}]; phase=${simContext.phase}; approach=${
    simContext.approach ?? "n/a"
  }; weak=[${weak.join("|")}]`;
  return { intent, learnerFacing };
}

export async function selectAdaptiveQuestions(params: {
  db: Db;
  userId: string;
  runId: string;
  dayNumber: number;
  questionCount?: number;
  mix?: Partial<SelectionMix>;
}): Promise<{ questions: SelectedQuestion[]; metadata: SelectionMetadata }> {
  const count = params.questionCount ?? 5;
  const mix: SelectionMix = { ...DEFAULT_MIX, ...(params.mix ?? {}) };

  // Load learner + run context in parallel.
  const [mastery, recentAttempts, avoidedIds, runResult, weakDecisions] = await Promise.all([
    loadMastery(params.db, params.userId),
    loadRecentAttempts(params.db, params.userId),
    loadRecentQuestionIds(params.db, params.userId, params.runId),
    params.db
      .from("simulation_runs")
      .select("state_snapshot, selected_delivery_approach, current_phase, case_id")
      .eq("id", params.runId)
      .eq("user_id", params.userId)
      .single(),
    loadWeakDecisions(params.db, params.runId, params.userId),
  ]);

  const run = runResult.data;
  const phase = run?.current_phase ?? "Initiation";
  const approach = run?.selected_delivery_approach ?? null;
  const caseId = run?.case_id ?? "project";

  const snapshot = (run?.state_snapshot ?? {}) as {
    log?: Array<{ correct?: boolean; atPhase?: string; decisionId?: string }>;
    decisions?: Array<{ id: string; title: string; ecoDomain?: string }>;
  };
  const log = snapshot.log ?? [];
  const decisionMap = new Map((snapshot.decisions ?? []).map((d) => [d.id, d]));
  const runCorrectRate = log.length ? log.filter((l) => l.correct).length / log.length : 0.6;
  const weakDecisionTitles = Array.from(
    new Set(
      log
        .filter((l) => l.correct === false)
        .map((l) => decisionMap.get(l.decisionId ?? "")?.title ?? "")
        .filter(Boolean),
    ),
  ).slice(0, 4);
  const recentDecisionTitles = log
    .slice(-6)
    .map((l) => decisionMap.get(l.decisionId ?? "")?.title ?? "")
    .filter(Boolean);
  const weakDecisionSummary = [
    ...weakDecisionTitles,
    ...weakDecisions
      .filter((d) => {
        const fb = d.mentor_feedback as { quality?: string } | null;
        return fb?.quality === "weak" || fb?.quality === "average";
      })
      .map((d) => d.selected_option_text ?? "")
      .filter(Boolean),
  ].slice(0, 5);

  // Repeated mistakes: attempt questionIds answered wrong >=2 times recently.
  const wrongCounts = new Map<string, number>();
  for (const a of recentAttempts) {
    if (!a.is_correct) wrongCounts.set(a.question_id, (wrongCounts.get(a.question_id) ?? 0) + 1);
  }
  const repeatedMistakeTopics = Array.from(
    new Set(
      recentAttempts
        .filter((a) => (wrongCounts.get(a.question_id) ?? 0) >= 2)
        .map((a) => {
          const eco = a.eco_mapping as { domain?: string } | null;
          const pmbok = a.pmbok_mapping as { domain?: string } | null;
          return pmbok?.domain && eco?.domain ? `${pmbok.domain} — ${eco.domain}` : null;
        })
        .filter((x): x is string => !!x),
    ),
  ).slice(0, 4);

  const devAreas = Array.from(new Set([...pickDevAreaTopics(mastery), ...repeatedMistakeTopics]));
  const lowMastery = pickLowMasteryTopics(mastery);
  const mastered = pickMasteredTopics(mastery);
  const spaced = pickSpacedRepetitionTopics(mastery);
  const averageMastery = mastery.length
    ? Math.round(mastery.reduce((a, m) => a + Number(m.mastery_score), 0) / mastery.length)
    : 50;

  const slots = planSlots(count, mix);
  // If we have no dev areas yet (new learner), reallocate dev-area slots to
  // current-simulation so the session is still useful.
  const dev = slots.find((s) => s.source === "development_area")!;
  const cur = slots.find((s) => s.source === "current_simulation")!;
  if (devAreas.length === 0 && dev.count > 0) {
    cur.count += dev.count;
    dev.count = 0;
  }
  const spacedSlot = slots.find((s) => s.source === "spaced_repetition")!;
  if (spaced.length === 0 && spacedSlot.count > 0) {
    cur.count += spacedSlot.count;
    spacedSlot.count = 0;
  }
  const reinforceSlot = slots.find((s) => s.source === "reinforcement")!;
  if (mastered.length === 0 && reinforceSlot.count > 0) {
    cur.count += reinforceSlot.count;
    reinforceSlot.count = 0;
  }

  const day = getDay(params.dayNumber);
  const targeting = devAreas.length
    ? `Priority development areas (weigh heavily): ${devAreas.slice(0, 5).join("; ")}.`
    : `No strong development areas yet — balance across People, Process, and Business Environment.`;
  const difficulty = targetDifficulty(averageMastery);

  const slotPlan = slots.map((s) => {
    const topics =
      s.source === "development_area"
        ? devAreas.slice(0, s.count + 2)
        : s.source === "current_simulation"
        ? [phase, ...(approach ? [approach] : []), ...weakDecisionSummary].slice(0, s.count + 2)
        : s.source === "spaced_repetition"
        ? spaced.slice(0, s.count + 2)
        : mastered.slice(0, s.count + 2);
    return { source: s.source, count: s.count, topics };
  });

  const { intent, learnerFacing } = buildIntent(devAreas, {
    phase,
    approach,
    weakDecisions: weakDecisionSummary,
  });

  const slotBrief = slotPlan
    .filter((s) => s.count > 0)
    .map(
      (s) =>
        `- ${s.count} × ${s.source.replace("_", "-")} question(s) → topics: ${
          s.topics.length ? s.topics.join(" | ") : "learner's current context"
        }`,
    )
    .join("\n");

  // Build the AI generation brief. We generate a single batch and label each
  // returned question with the slot it belongs to (by index).
  const briefPrompt = `Adaptive PMP practice for Day ${params.dayNumber} — ${day.title} (${day.focus}).

Learner context:
- Case: ${caseId}
- Phase: ${phase} · Delivery approach: ${approach ?? "not selected"}
- Average mastery across topics: ${averageMastery}/100
- Recent run correctness: ${(runCorrectRate * 100).toFixed(0)}%
- Development areas: ${devAreas.slice(0, 6).join(", ") || "(none yet)"}
- Low-mastery topics: ${lowMastery.join(", ") || "(none)"}
- Mastered topics (reinforce sparingly): ${mastered.join(", ") || "(none)"}
- Spaced-repetition candidates: ${spaced.join(", ") || "(none)"}
- Recent weak simulation decisions: ${weakDecisionSummary.join(" | ") || "(none)"}
- Recent simulation decisions (context): ${recentDecisionTitles.join(" | ") || "(none)"}
- Question IDs to AVOID repeating (already seen recently): ${avoidedIds.slice(0, 40).join(", ") || "(none)"}

Produce exactly ${count} questions matching this mix (in this order):
${slotBrief}

Rules:
- Never repeat a scenario from the AVOID list — vary the situation while testing the same competency.
- Difficulty target: mostly ${difficulty}. Adapt: if a topic is a development area, use easy-to-medium with clear scaffolding; if mastered, use medium-to-hard with subtle distractors.
- Each question maps to a PMBOK principle, PMBOK performance domain, PMI ECO domain, and a PM competency.
- Every option's rationale explains why it is stronger or weaker (not only the correct one).
- ${targeting}
- Ground in PMI terminology. Return JSON only.`;

  let rawQuestions: PracticeQuestion[];
  try {
    rawQuestions = await generateAdaptiveQuestions({
      dayNumber: params.dayNumber,
      phase,
      approach,
      caseTitle: caseId,
      weakDomains: devAreas.slice(0, 5),
      recentDecisions: recentDecisionTitles,
      correctRate: runCorrectRate,
      briefOverride: briefPrompt,
      count,
    });
  } catch {
    rawQuestions = fallbackPracticeQuestions(params.dayNumber, phase);
  }

  // Ensure unique IDs (defensive: model can return duplicates from prior sessions).
  const seenIds = new Set<string>();
  rawQuestions = rawQuestions.map((q, i) => {
    let id = q.id;
    if (!id || seenIds.has(id) || avoidedIds.includes(id)) {
      id = `d${params.dayNumber}-s${Date.now().toString(36)}-q${i}`;
    }
    seenIds.add(id);
    return { ...q, id };
  });

  // Attach slot metadata by slot order. If the model returned fewer than
  // requested, fill from the fallback bank up to `count`.
  if (rawQuestions.length < count) {
    const filler = fallbackPracticeQuestions(params.dayNumber, phase).slice(
      0,
      count - rawQuestions.length,
    );
    rawQuestions = [...rawQuestions, ...filler];
  }

  // Flatten the slot plan into a per-question source array.
  const perQuestionSlot: SelectionSource[] = [];
  for (const s of slotPlan) {
    for (let i = 0; i < s.count; i++) perQuestionSlot.push(s.source);
  }
  while (perQuestionSlot.length < rawQuestions.length) perQuestionSlot.push("current_simulation");

  const questions: SelectedQuestion[] = rawQuestions.slice(0, count).map((q, i) => {
    const source = perQuestionSlot[i] ?? "current_simulation";
    const topicKey = `${q.pmbokDomain} — ${q.ecoDomain}`;
    const reason =
      source === "development_area"
        ? `Prioritized because "${topicKey}" is a development area (low mastery / repeated mistakes).`
        : source === "current_simulation"
        ? `Aligned to your current ${phase} phase and ${approach ?? "delivery approach"}.`
        : source === "spaced_repetition"
        ? `Spaced repetition — you haven't practiced "${topicKey}" recently.`
        : `Reinforcement of a mastered area to prevent decay.`;
    return {
      ...q,
      selectionReason: reason,
      masteryTopic: topicKey,
      selectionSource: source,
    };
  });

  const metadata: SelectionMetadata = {
    intent,
    learnerFacingSummary: learnerFacing,
    mix,
    slotPlan,
    avoidedQuestionIds: avoidedIds.slice(0, 40),
    masteryContext: {
      developmentAreas: devAreas,
      lowMasteryTopics: lowMastery,
      masteredTopics: mastered,
      averageMastery,
    },
    simulationContext: {
      phase,
      approach,
      caseId,
      weakDecisions: weakDecisionSummary,
    },
    generatedAt: new Date().toISOString(),
  };

  return { questions, metadata };
}
