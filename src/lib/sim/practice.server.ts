// Server-only helpers for practice generation. Kept out of the .functions.ts
// module because the TanStack server-fn splitter deletes sibling module-scope
// declarations from the handler bundle at runtime.

import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getDay } from "./days";

export const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        rationale: z.string(),
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
  takeaway: z.string(),
});

export const GenSchema = z.object({
  questions: z.array(QuestionSchema).min(4).max(6),
});

export type PracticeQuestion = z.infer<typeof QuestionSchema>;

export async function generateAdaptiveQuestions(input: {
  dayNumber: number;
  phase: string;
  approach: string | null;
  caseTitle: string;
  weakDomains: string[];
  recentDecisions: string[];
  correctRate: number;
  briefOverride?: string;
  count?: number;
}): Promise<PracticeQuestion[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const count = input.count ?? 5;

  let prompt = input.briefOverride;
  if (!prompt) {
    const day = getDay(input.dayNumber);
    const targeting =
      input.weakDomains.length > 0
        ? `Emphasize these weaker areas: ${input.weakDomains.join(", ")}.`
        : `Balance across People, Process, and Business Environment.`;
    const difficulty =
      input.correctRate < 0.5 ? "easy-to-medium" : input.correctRate > 0.8 ? "medium-to-hard" : "medium";

    prompt = `Generate ${count} adaptive PMP practice questions for a learner on Day ${input.dayNumber} of a 7-day PMBOK simulation.

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
- Every option's rationale must explain why it is stronger or weaker than the others (not only the correct one).
- Map every question to a PMBOK principle, PMBOK performance domain, PMI ECO domain, and a PM competency.
- Ground in PMI terminology. Use realistic project situations.
- Return JSON only.`;
  }

  const { object } = await generateObject({ model, schema: GenSchema, prompt });
  return object.questions;
}

export function fallbackPracticeQuestions(dayNumber: number, phase: string): PracticeQuestion[] {
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
