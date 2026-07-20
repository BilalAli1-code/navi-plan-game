// ProjectSim v2 workplace simulation engine — types.

export type SimPhase =
  | "Tailoring"
  | "Initiation"
  | "Planning"
  | "Execution"
  | "Monitoring"
  | "Closing"
  | "Complete";

export const SIM_PHASE_ORDER: SimPhase[] = [
  "Tailoring",
  "Initiation",
  "Planning",
  "Execution",
  "Monitoring",
  "Closing",
  "Complete",
];

export type DeliveryApproach = "Predictive" | "Agile" | "Hybrid" | "Iterative" | "Lean";

export type EcoDomain = "People" | "Process" | "Business Environment";

export type ProjectMetrics = {
  health: number;         // derived rollup 0-100
  budget: number;         // 0-100 (100 = on budget)
  schedule: number;       // 0-100 (100 = on time)
  risk: number;           // 0-100 (higher = safer)
  morale: number;         // 0-100
  trust: number;          // stakeholder trust 0-100
  quality: number;        // 0-100
  satisfaction: number;   // customer satisfaction 0-100
};

export type MetricImpact = Partial<Omit<ProjectMetrics, "health">>;

export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  personality: string;   // one-line persona used for AI chat
  priorities: string[];
  avatarInitial: string;
  color: string;         // tailwind bg class fragment e.g. "bg-emerald-500"
};

export type SimDocument = {
  id: string;
  title: string;
  kind: "Business Case" | "Charter" | "Risk Register" | "RAID" | "Status Report" | "Contract" | "Plan" | "Stakeholder Register";
  updatedAt: string;
  markdown: string;
};

export type Email = {
  id: string;
  from: string;         // stakeholder id
  subject: string;
  preview: string;
  body: string;
  receivedAt: string;
  read: boolean;
  unlocksDecisionId?: string;
};

export type Meeting = {
  id: string;
  title: string;
  time: string;
  attendees: string[];   // stakeholder ids
  agenda: string[];
  transcript: string;    // markdown
  unlocksDecisionId?: string;
};

export type DecisionOption = {
  id: string;
  label: string;
  rationale: string;
  impact: MetricImpact;
  quality: "excellent" | "good" | "risky" | "poor";
  consequence: string;     // shown after selection
  pmiPrinciple: string;
};

export type Decision = {
  id: string;
  phase: SimPhase;
  ecoDomain: EcoDomain;
  ecoTask: string;
  pmbokDomain: string;
  title: string;
  situation: string;      // markdown
  source: "email" | "meeting" | "document" | "event";
  sourceId?: string;
  options: DecisionOption[];
  correctOptionId: string;
  examTip: string;
};

export type DecisionLogEntry = {
  decisionId: string;
  optionId: string;
  quality: DecisionOption["quality"];
  correct: boolean;
  atPhase: SimPhase;
  impact: MetricImpact;
  timestamp: number;
};

export type TailoringAnswers = Record<string, string>;

export type IndustryCaseRef = {
  id: string;
  industry: string;
  emoji: string;
  projectName: string;
  sponsor: string;
  budget: string;
  duration: string;
  summary: string;
  body: string;
  challenges: string[];
  recommendedApproach: DeliveryApproach;
};

export type SimState = {
  caseId: string;
  phase: SimPhase;
  metrics: ProjectMetrics;
  tailoring: TailoringAnswers | null;
  tailoringScore: number | null;
  approach: DeliveryApproach | null;
  emails: Email[];
  meetings: Meeting[];
  documents: SimDocument[];
  decisions: Decision[];       // available (unlocked)
  activeDecisionId: string | null;
  log: DecisionLogEntry[];
  xp: number;
  createdAt: number;
  lastConsequence: string | null;
  currentDay: number;         // active chapter in the 7-chapter plan (1..7)
  completedMinutes: number;   // cumulative minutes across all chapters
  /** In-world project time label (Blueprint §8.3); derived from chapter. Optional. */
  inWorldDate?: string;
};

export const INITIAL_METRICS: ProjectMetrics = {
  health: 75,
  budget: 80,
  schedule: 80,
  risk: 65,
  morale: 75,
  trust: 70,
  quality: 75,
  satisfaction: 70,
};
