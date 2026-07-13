// Risk + Conflict reference catalog.
// Every case gets a compact set of risks and at least one conflict. A generic
// "reference" set covers all 15 industries; individual industries can override.
// The catalogs are consulted by both the UI (to render options) and the
// server engine (to compute authoritative outcomes) — so they must stay
// serializable and side-effect free.

import type {
  ConflictTechnique,
  OpportunityStrategy,
  RiskStrategy,
  ThreatStrategy,
} from "./actions";

export type RiskCase = {
  id: string;
  title: string;
  description: string;
  riskType: "threat" | "opportunity";
  correctStrategy: RiskStrategy;
  acceptableStrategies?: RiskStrategy[];
  sectionNumber: number;               // day / phase index (1..7)
  required?: boolean;                  // if true, day is blocked until responded
  realizedImpact?: string;             // narrative used in delayed event
  pmbokMapping: Record<string, unknown>;
  ecoMapping: Record<string, unknown>;
};

export type ConflictCase = {
  id: string;
  title: string;
  description: string;
  parties: string[];                   // stakeholder ids
  cause: string;
  correctTechnique: ConflictTechnique;
  acceptableTechniques?: ConflictTechnique[];
  sectionNumber: number;
  required?: boolean;
  pmbokMapping: Record<string, unknown>;
  ecoMapping: Record<string, unknown>;
};

// -------- Reference (project atlas) risk catalog --------
const REFERENCE_RISKS: RiskCase[] = [
  {
    id: "vendor-slip",
    title: "Vendor slips their long-lead delivery",
    description:
      "Priya's team flagged a two-week slip on a critical dependency needed for pilot cutover.",
    riskType: "threat",
    correctStrategy: "Mitigate" as ThreatStrategy,
    acceptableStrategies: ["Transfer"],
    sectionNumber: 3,
    required: true,
    realizedImpact: "Pilot cutover slips into the following week; sponsor cadence disrupted.",
    pmbokMapping: { domain: "Uncertainty", process: "11.5 Plan Risk Responses" },
    ecoMapping: { domain: "Process", task: "PR-2.3 Assess & manage risks" },
  },
  {
    id: "regulatory-shift",
    title: "Regulator publishes stricter guidance mid-project",
    description:
      "Dr. Osei circulated draft guidance that would tighten our documented mitigation cadence.",
    riskType: "threat",
    correctStrategy: "Escalate" as ThreatStrategy,
    acceptableStrategies: ["Mitigate"],
    sectionNumber: 4,
    realizedImpact: "Compliance audit finding requires unplanned rework and steering escalation.",
    pmbokMapping: { domain: "Uncertainty", process: "11.6 Implement Risk Responses" },
    ecoMapping: { domain: "Business Environment", task: "BE-3.1 Plan & manage compliance" },
  },
  {
    id: "budget-tailwind",
    title: "Q3 budget carryforward is available",
    description:
      "Finance signaled a one-time carryforward that could fund an accelerated pilot expansion.",
    riskType: "opportunity",
    correctStrategy: "Exploit" as OpportunityStrategy,
    acceptableStrategies: ["Enhance", "Share"],
    sectionNumber: 5,
    pmbokMapping: { domain: "Uncertainty", process: "11.5 Plan Risk Responses (opportunities)" },
    ecoMapping: { domain: "Process", task: "PR-2.3 Assess & manage risks" },
  },
];

// -------- Reference conflict catalog --------
const REFERENCE_CONFLICTS: ConflictCase[] = [
  {
    id: "scope-vs-quality",
    title: "Vendor pushes scope cut; QA insists on regression suite",
    description:
      "Priya wants to cut end-to-end regression to meet the milestone; Jordan says it will bite us in prod.",
    parties: ["vendor", "team-lead"],
    cause: "Scope vs. quality trade-off under milestone pressure",
    correctTechnique: "Collaborate / problem solve",
    acceptableTechniques: ["Compromise / reconcile"],
    sectionNumber: 4,
    required: true,
    pmbokMapping: { domain: "Team", process: "9.5 Manage Team" },
    ecoMapping: { domain: "People", task: "P-1.1 Manage conflict" },
  },
];

// Industry-specific overrides (keep small — reference set covers the rest).
const PER_CASE: Record<string, { risks?: RiskCase[]; conflicts?: ConflictCase[] }> = {};

export function risksFor(caseId: string): RiskCase[] {
  return PER_CASE[caseId]?.risks ?? REFERENCE_RISKS;
}
export function conflictsFor(caseId: string): ConflictCase[] {
  return PER_CASE[caseId]?.conflicts ?? REFERENCE_CONFLICTS;
}
export function findRisk(caseId: string, riskId: string): RiskCase | undefined {
  return risksFor(caseId).find((r) => r.id === riskId);
}
export function findConflict(caseId: string, conflictId: string): ConflictCase | undefined {
  return conflictsFor(caseId).find((c) => c.id === conflictId);
}

// Required actions (used by day progression to block completion until done).
export function requiredActionKeys(caseId: string, sectionNumber: number): string[] {
  const keys: string[] = [];
  for (const r of risksFor(caseId)) {
    if (r.required && r.sectionNumber === sectionNumber) keys.push(`risk:${r.id}`);
  }
  for (const c of conflictsFor(caseId)) {
    if (c.required && c.sectionNumber === sectionNumber) keys.push(`conflict:${c.id}`);
  }
  return keys;
}
