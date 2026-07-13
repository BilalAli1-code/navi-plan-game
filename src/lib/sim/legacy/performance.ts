import type {
  Choice,
  KnowledgeArea,
  PerfCategory,
  PerfScores,
  Scenario,
} from "./types";
import { getScenarioMeta } from "./scenarios";

export const PERF_CATEGORIES: PerfCategory[] = [
  "Leadership",
  "Risk Management",
  "Stakeholder Engagement",
  "Communication",
  "Business Value",
  "Agile Mindset",
  "Predictive Mindset",
  "Integration Thinking",
];

export const KNOWLEDGE_AREAS: KnowledgeArea[] = [
  "Integration",
  "Scope",
  "Schedule",
  "Cost",
  "Quality",
  "Resource",
  "Communications",
  "Risk",
  "Procurement",
  "Stakeholder",
];

const KA_TO_PRIMARY: Record<KnowledgeArea, PerfCategory> = {
  Integration: "Integration Thinking",
  Scope: "Integration Thinking",
  Schedule: "Predictive Mindset",
  Cost: "Business Value",
  Quality: "Integration Thinking",
  Resource: "Leadership",
  Communications: "Communication",
  Risk: "Risk Management",
  Procurement: "Business Value",
  Stakeholder: "Stakeholder Engagement",
};

export function initialPerfScores(): PerfScores {
  return PERF_CATEGORIES.reduce(
    (acc, c) => ({ ...acc, [c]: 50 }),
    {} as PerfScores,
  );
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function perfImpactFor(
  scenario: Scenario,
  choice: Choice,
): Partial<Record<PerfCategory, number>> {
  const meta = getScenarioMeta(scenario);
  const primary = KA_TO_PRIMARY[meta.knowledgeArea];
  const q = choice.quality;
  const mag = q === "excellent" ? 8 : q === "good" ? 4 : q === "risky" ? -3 : -6;
  const map: Partial<Record<PerfCategory, number>> = {};
  const add = (c: PerfCategory, n: number) => {
    map[c] = (map[c] ?? 0) + n;
  };
  add(primary, mag);
  if (q === "excellent") add("Integration Thinking", 3);
  if (q === "poor") add("Integration Thinking", -3);
  const text = `${choice.label} ${choice.rationale}`.toLowerCase();
  const agile =
    /iterative|hybrid|sprint|team norm|servant|agile|working agreement|pair|retro|standup|mvp|pilot|working session/.test(
      text,
    );
  const predictive =
    /baseline|reserve|critical path|evm|ccb|wbs|change control|formal|contract|governance|charter|earned value/.test(
      text,
    );
  if (agile) add("Agile Mindset", mag > 0 ? 4 : -2);
  if (predictive) add("Predictive Mindset", mag > 0 ? 4 : -2);
  if (/conflict|team|resign|morale|coach|1:1/.test(text)) {
    add("Leadership", mag > 0 ? 3 : -2);
  }
  if (/benefit|value|npv|outcome|realiz|business case/.test(text)) {
    add("Business Value", mag > 0 ? 3 : -2);
  }
  if (/stakeholder|sponsor|client|comms|communi/.test(text)) {
    add("Stakeholder Engagement", mag > 0 ? 2 : -1);
  }
  if (/risk|contingen|reserve|mitigat|response/.test(text)) {
    add("Risk Management", mag > 0 ? 2 : -1);
  }
  return map;
}

export function applyPerfImpact(
  scores: PerfScores,
  impact: Partial<Record<PerfCategory, number>>,
): PerfScores {
  const next = { ...scores };
  for (const c of PERF_CATEGORIES) {
    next[c] = clamp((next[c] ?? 50) + (impact[c] ?? 0));
  }
  return next;
}

export function weakestCategories(scores: PerfScores, n = 3): PerfCategory[] {
  return [...PERF_CATEGORIES].sort((a, b) => scores[a] - scores[b]).slice(0, n);
}

// Which knowledge areas map to (or reinforce) a weak performance category.
export function knowledgeAreasFor(cat: PerfCategory): KnowledgeArea[] {
  const out: KnowledgeArea[] = [];
  for (const ka of KNOWLEDGE_AREAS) {
    if (KA_TO_PRIMARY[ka] === cat) out.push(ka);
  }
  // Cross-cutting mindset boosts
  if (cat === "Stakeholder Engagement") out.push("Communications");
  if (cat === "Business Value") out.push("Integration");
  return out;
}

export function knowledgeAreaLevel(scores: PerfScores, ka: KnowledgeArea): number {
  return scores[KA_TO_PRIMARY[ka]];
}

export function recommendations(scores: PerfScores): {
  category: PerfCategory;
  score: number;
  tip: string;
}[] {
  const tips: Record<PerfCategory, string> = {
    "Leadership":
      "Practice servant leadership: coach, facilitate, and time-box decisions rather than force outcomes.",
    "Risk Management":
      "Keep the risk register alive — identify, analyze, assign an owner, and choose a response for every risk.",
    "Stakeholder Engagement":
      "Map power/interest and tailor engagement. Never treat stakeholders as a single audience.",
    "Communication":
      "Design cadence + format per group; add RACI and an explicit escalation path.",
    "Business Value":
      "Anchor every decision to benefits realization and NPV, not just deliverables shipped.",
    "Agile Mindset":
      "Favor iterative, empirical delivery: small increments, retros, and hypothesis-driven scope.",
    "Predictive Mindset":
      "Strengthen baseline, EVM, CCB, and reserve-analysis reflexes for tightly scoped work.",
    "Integration Thinking":
      "Route decisions through Perform Integrated Change Control and think across knowledge areas.",
  };
  return [...PERF_CATEGORIES]
    .sort((a, b) => scores[a] - scores[b])
    .map((c) => ({ category: c, score: scores[c], tip: tips[c] }));
}
