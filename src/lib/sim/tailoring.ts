// Phase-0 Tailoring Workshop — 8 questions, scored against the industry's
// recommended delivery approach and PMI's tailoring principle.

import type { DeliveryApproach, TailoringAnswers } from "./types";

export type TailoringQuestion = {
  id: string;
  question: string;
  hint: string;
  options: { id: string; label: string; recommendedFor: DeliveryApproach[]; explanation: string }[];
};

export const TAILORING_QUESTIONS: TailoringQuestion[] = [
  {
    id: "approach",
    question: "Which delivery approach best fits this project?",
    hint: "PMBOK 7/8 Principle: Tailoring — match approach to context.",
    options: [
      { id: "predictive", label: "Predictive (Waterfall)", recommendedFor: ["Predictive"], explanation: "Fixed scope, regulated, stable requirements." },
      { id: "agile", label: "Agile / Scrum", recommendedFor: ["Agile"], explanation: "Evolving requirements, empowered team, customer collaboration." },
      { id: "hybrid", label: "Hybrid", recommendedFor: ["Hybrid"], explanation: "Predictive governance + iterative delivery." },
      { id: "iterative", label: "Iterative / Incremental", recommendedFor: ["Iterative"], explanation: "Progressive elaboration, staged releases." },
      { id: "lean", label: "Lean", recommendedFor: ["Lean"], explanation: "Value stream + waste reduction focus." },
    ],
  },
  {
    id: "governance",
    question: "How much formal governance does this project need?",
    hint: "Regulators, board oversight, and safety needs push governance up.",
    options: [
      { id: "heavy", label: "Formal stage gates + CCB", recommendedFor: ["Predictive", "Hybrid"], explanation: "Regulated / high-CapEx projects." },
      { id: "light", label: "Product owner + backlog review", recommendedFor: ["Agile", "Lean"], explanation: "Empowered team environments." },
      { id: "blended", label: "Gates for milestones, agile inside", recommendedFor: ["Hybrid"], explanation: "Most enterprise projects." },
    ],
  },
  {
    id: "planning",
    question: "How will you plan?",
    hint: "Rolling wave beats big-bang planning when the future is uncertain.",
    options: [
      { id: "upfront", label: "Detailed upfront plan", recommendedFor: ["Predictive"], explanation: "Stable, known scope." },
      { id: "rolling", label: "Rolling wave", recommendedFor: ["Hybrid", "Iterative"], explanation: "Detail near-term, high-level far-term." },
      { id: "just-in-time", label: "Just-in-time / backlog", recommendedFor: ["Agile", "Lean"], explanation: "Continuous discovery." },
    ],
  },
  {
    id: "change",
    question: "How will you handle change?",
    hint: "PMBOK: Change is enabled, not just controlled.",
    options: [
      { id: "ccb", label: "Formal CCB with impact analysis", recommendedFor: ["Predictive", "Hybrid"], explanation: "Baseline discipline." },
      { id: "backlog", label: "Reprioritize the backlog", recommendedFor: ["Agile", "Lean"], explanation: "Change embraced continuously." },
      { id: "hybrid-change", label: "CCB for baseline scope, backlog for delivery details", recommendedFor: ["Hybrid"], explanation: "Best of both." },
    ],
  },
  {
    id: "risk",
    question: "Risk management cadence?",
    hint: "Living register with owners > any one-time analysis.",
    options: [
      { id: "workshop", label: "Formal workshop + monthly review", recommendedFor: ["Predictive", "Hybrid"], explanation: "PMI-canonical." },
      { id: "sprint", label: "Sprint-level risk review", recommendedFor: ["Agile"], explanation: "Continuous, embedded." },
      { id: "none", label: "Only when something breaks", recommendedFor: [], explanation: "Anti-PMI." },
    ],
  },
  {
    id: "comms",
    question: "Communication cadence?",
    hint: "Tailor per stakeholder analysis — not one-size-fits-all.",
    options: [
      { id: "tailored", label: "Tailored per stakeholder power/interest", recommendedFor: ["Predictive", "Agile", "Hybrid", "Iterative", "Lean"], explanation: "Always correct." },
      { id: "weekly-all", label: "One weekly email to everyone", recommendedFor: [], explanation: "Broadcast fails." },
      { id: "on-demand", label: "Only when asked", recommendedFor: [], explanation: "Silence = anxiety." },
    ],
  },
  {
    id: "success",
    question: "How will success be measured?",
    hint: "Business value beats on-time/on-budget in PMBOK 7/8.",
    options: [
      { id: "value", label: "Business value + acceptance criteria", recommendedFor: ["Predictive", "Agile", "Hybrid", "Iterative", "Lean"], explanation: "Always correct." },
      { id: "iron", label: "On-time + on-budget only", recommendedFor: [], explanation: "Iron triangle alone is dated." },
      { id: "output", label: "Number of features shipped", recommendedFor: [], explanation: "Output ≠ outcome." },
    ],
  },
  {
    id: "team",
    question: "How will you lead the team?",
    hint: "PMBOK 7/8: Servant leadership over command-and-control.",
    options: [
      { id: "servant", label: "Servant leadership + empowerment", recommendedFor: ["Predictive", "Agile", "Hybrid", "Iterative", "Lean"], explanation: "Always correct." },
      { id: "command", label: "Command-and-control", recommendedFor: [], explanation: "Anti-PMI." },
      { id: "laissez", label: "Laissez-faire", recommendedFor: [], explanation: "Abdicates leadership." },
    ],
  },
];

export type TailoringScore = {
  correct: number;
  total: number;
  percent: number;
  approach: DeliveryApproach;
  feedback: string;
};

export function scoreTailoring(answers: TailoringAnswers, recommended: DeliveryApproach): TailoringScore {
  let correct = 0;
  const total = TAILORING_QUESTIONS.length;
  for (const q of TAILORING_QUESTIONS) {
    const chosen = q.options.find((o) => o.id === answers[q.id]);
    if (!chosen) continue;
    if (chosen.recommendedFor.includes(recommended) || chosen.recommendedFor.length >= 5) {
      correct++;
    }
  }
  const percent = Math.round((correct / total) * 100);
  const chosenApproach = (TAILORING_QUESTIONS[0].options.find((o) => o.id === answers.approach)?.recommendedFor[0] ?? recommended) as DeliveryApproach;
  let feedback: string;
  if (percent >= 85) feedback = "Excellent tailoring — this reflects PMI's Tailoring principle applied with judgment.";
  else if (percent >= 65) feedback = "Solid choices. A couple of items would benefit from more context-fit.";
  else feedback = "Your tailoring is generic. Re-read the case's constraints and try again — approach must fit context.";
  return { correct, total, percent, approach: chosenApproach, feedback };
}
