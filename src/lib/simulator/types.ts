export type PhaseId =
  | "initiation"
  | "planning"
  | "execution"
  | "monitoring"
  | "closing";

export type ProcessGroup =
  | "Initiating"
  | "Planning"
  | "Executing"
  | "Monitoring & Controlling"
  | "Closing";

export type KnowledgeArea =
  | "Integration"
  | "Scope"
  | "Schedule"
  | "Cost"
  | "Quality"
  | "Resource"
  | "Communications"
  | "Risk"
  | "Procurement"
  | "Stakeholder";

export type Difficulty = "easy" | "medium" | "hard";

export type Metrics = {
  budget: number; // % remaining 0-100
  schedule: number; // -100 (very behind) to +100 (ahead)
  scope: number; // 0-100 stability
  risk: number; // 0-100 (higher = worse)
  stakeholders: number; // 0-100
  morale: number; // 0-100
  quality: number; // 0-100
  businessValue: number; // 0-100
};

export type Impact = Partial<Metrics>;

export type Choice = {
  id: string;
  label: string;
  rationale: string; // short PMBOK reasoning (shown after selection)
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

export type ScenarioMeta = {
  processGroup: ProcessGroup;
  knowledgeArea: KnowledgeArea;
  difficulty: Difficulty;
  explanation: string; // why the correct answer is correct
  pmMindset: string; // one-line mindset takeaway
  correctChoiceId: string; // derived from scenario if not set
};

export type BadgeId =
  | "risk-manager"
  | "scope-controller"
  | "stakeholder-expert"
  | "budget-hawk"
  | "delivery-star"
  | "quality-champion"
  | "value-driver";

export type Decision = {
  scenarioId: string;
  scenarioTitle: string;
  phase: PhaseId;
  processGroup: ProcessGroup;
  knowledgeArea: KnowledgeArea;
  choiceId: string;
  choiceLabel: string;
  choiceImpact: Impact;
  quality: Choice["quality"];
  correct: boolean;
  xp: number;
  coachText: string | null;
};

// Flags derived from prior decisions that inform future scenarios.
export type ConsequenceFlag =
  | "neglected-stakeholders-early"
  | "skipped-risk-planning"
  | "scope-uncontrolled"
  | "budget-overcommitted"
  | "team-morale-hit"
  | "quality-shortcut"
  | "value-focus-lost";
