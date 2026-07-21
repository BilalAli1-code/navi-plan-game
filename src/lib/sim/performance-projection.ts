import type { Tables } from "@/integrations/supabase/types";
import { getCaseRef } from "./cases";
import {
  PERF_CATEGORIES,
  KNOWLEDGE_AREAS,
  applyPerfImpact,
  initialPerfScores,
} from "./legacy/performance";
import type { PerfScores, PerfCategory, KnowledgeArea } from "./legacy/types";
import type { SimState } from "./types";

type DecisionQuality = "excellent" | "good" | "risky" | "poor";

export type PerformanceProjection = {
  runId: string;
  caseId: string;
  projectName: string;
  deliveryApproach: string | null;
  perfScores: PerfScores;
  overallAccuracyPct: number;
  correctDecisions: number;
  totalDecisions: number;
  knowledgeAreaCoverage: Record<KnowledgeArea, { total: number; correct: number }>;
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function qualityFromScore(score: number): DecisionQuality {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 35) return "risky";
  return "poor";
}

function categoryForDecisionDomain(domain: string): PerfCategory {
  const d = domain.toLowerCase();
  if (d.includes("stakeholder")) return "Stakeholder Engagement";
  if (d.includes("risk") || d.includes("uncertainty")) return "Risk Management";
  if (d.includes("communication")) return "Communication";
  if (d.includes("team") || d.includes("leadership")) return "Leadership";
  if (d.includes("integration") || d.includes("change")) return "Integration Thinking";
  if (d.includes("delivery")) return "Predictive Mindset";
  return "Business Value";
}

function knowledgeAreaForDecisionDomain(domain: string): KnowledgeArea {
  const d = domain.toLowerCase();
  if (d.includes("stakeholder")) return "Stakeholder";
  if (d.includes("risk") || d.includes("uncertainty")) return "Risk";
  if (d.includes("communication")) return "Communications";
  if (d.includes("team") || d.includes("resource")) return "Resource";
  if (d.includes("quality")) return "Quality";
  if (d.includes("cost") || d.includes("value")) return "Cost";
  if (d.includes("schedule") || d.includes("timeline")) return "Schedule";
  return "Integration";
}

function qualityDelta(quality: DecisionQuality): number {
  return { excellent: 6, good: 3, risky: -2, poor: -5 }[quality];
}

function approachDelta(
  approach: string | null,
  quality: DecisionQuality,
): Partial<Record<PerfCategory, number>> {
  const positive = quality === "excellent" || quality === "good";
  const agileDelta = positive ? 2 : -1;
  const predictiveDelta = positive ? 2 : -1;
  if (!approach) return {};
  if (approach === "Agile") return { "Agile Mindset": agileDelta };
  if (approach === "Predictive") return { "Predictive Mindset": predictiveDelta };
  if (approach === "Hybrid") {
    return {
      "Agile Mindset": positive ? 1 : -1,
      "Predictive Mindset": positive ? 1 : -1,
    };
  }
  return {};
}

export function buildPerformanceProjection(params: {
  run: Pick<
    Tables<"simulation_runs">,
    "id" | "case_id" | "selected_delivery_approach" | "state_snapshot"
  >;
  actions: Array<Pick<Tables<"simulation_actions">, "action_type" | "outcome_data">>;
}): PerformanceProjection {
  const { run, actions } = params;
  const snapshot = (run.state_snapshot ?? {}) as Partial<SimState>;
  const state = snapshot as SimState;
  const decisions = Array.isArray(state.decisions) ? state.decisions : [];
  const log = Array.isArray(state.log) ? state.log : [];
  const decisionById = new Map(decisions.map((d) => [d.id, d]));

  const perfScores = initialPerfScores();
  const coverage: Record<KnowledgeArea, { total: number; correct: number }> = {
    Integration: { total: 0, correct: 0 },
    Scope: { total: 0, correct: 0 },
    Schedule: { total: 0, correct: 0 },
    Cost: { total: 0, correct: 0 },
    Quality: { total: 0, correct: 0 },
    Resource: { total: 0, correct: 0 },
    Communications: { total: 0, correct: 0 },
    Risk: { total: 0, correct: 0 },
    Procurement: { total: 0, correct: 0 },
    Stakeholder: { total: 0, correct: 0 },
  };

  let rollingScores = { ...perfScores };
  for (const item of log) {
    const decision = decisionById.get(item.decisionId);
    const category = categoryForDecisionDomain(decision?.pmbokDomain ?? "integration");
    const ka = knowledgeAreaForDecisionDomain(decision?.pmbokDomain ?? "integration");
    const quality = item.quality;
    const delta = qualityDelta(quality);

    coverage[ka].total += 1;
    if (item.correct) coverage[ka].correct += 1;

    rollingScores = applyPerfImpact(rollingScores, {
      [category]: delta,
      ...approachDelta(run.selected_delivery_approach, quality),
      "Integration Thinking": quality === "excellent" ? 1 : 0,
    });
  }

  for (const action of actions) {
    const score = Number((action.outcome_data as { score?: number } | null)?.score ?? 55);
    const quality = qualityFromScore(score);
    if (action.action_type === "stakeholder_interaction") {
      rollingScores = applyPerfImpact(rollingScores, {
        "Stakeholder Engagement": qualityDelta(quality),
        Communication: quality === "excellent" ? 3 : quality === "poor" ? -3 : 1,
        Leadership: quality === "excellent" ? 2 : quality === "poor" ? -2 : 0,
      });
    } else if (action.action_type === "risk_response") {
      rollingScores = applyPerfImpact(rollingScores, {
        "Risk Management": qualityDelta(quality),
        "Predictive Mindset": quality === "excellent" ? 2 : quality === "poor" ? -2 : 0,
      });
    } else if (action.action_type === "conflict_management") {
      rollingScores = applyPerfImpact(rollingScores, {
        Leadership: qualityDelta(quality),
        Communication: quality === "excellent" ? 2 : quality === "poor" ? -2 : 0,
      });
    }
  }

  for (const key of PERF_CATEGORIES) {
    rollingScores[key] = clamp(rollingScores[key]);
  }

  const totalDecisions = log.length;
  const correctDecisions = log.filter((entry) => entry.correct).length;
  const overallAccuracyPct =
    totalDecisions > 0 ? Math.round((correctDecisions / totalDecisions) * 100) : 0;

  return {
    runId: run.id,
    caseId: run.case_id,
    projectName: getCaseRef(run.case_id).projectName,
    deliveryApproach: run.selected_delivery_approach,
    perfScores: rollingScores,
    overallAccuracyPct,
    correctDecisions,
    totalDecisions,
    knowledgeAreaCoverage: coverage,
  };
}

export { KNOWLEDGE_AREAS, PERF_CATEGORIES };
