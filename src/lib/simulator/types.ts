export type PhaseId =
  | "initiation"
  | "planning"
  | "execution"
  | "monitoring"
  | "closing";

export type Metrics = {
  budget: number; // % remaining 0-100
  schedule: number; // -100 (very behind) to +100 (ahead)
  scope: number; // 0-100 stability
  risk: number; // 0-100 (higher = worse)
  stakeholders: number; // 0-100
  morale: number; // 0-100
};

export type Impact = Partial<Metrics>;

export type Choice = {
  id: string;
  label: string;
  rationale: string; // short PMBOK reasoning (not shown until after)
  impact: Impact;
  xp: number;
  quality: "excellent" | "good" | "risky" | "poor";
};

export type Scenario = {
  id: string;
  phase: PhaseId;
  title: string;
  body: string;
  choices: Choice[];
  kind: "phase" | "event";
};

export type BadgeId =
  | "risk-manager"
  | "scope-controller"
  | "stakeholder-expert"
  | "budget-hawk"
  | "delivery-star";
