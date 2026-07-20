// Seven-day learning program catalog for every ProjectSim business case.
// Each day represents ~60 minutes of self-paced study; total ≈ 7 hours.

import type { SimPhase } from "./types";

export const TOTAL_DAYS = 7;
export const DAILY_MINUTES = 60;
export const TOTAL_MINUTES = TOTAL_DAYS * DAILY_MINUTES; // 420

export type DayActivityKey =
  | "briefing"
  | "learning"
  | "workplace"
  | "decisions"
  | "practice"
  | "reflection";

export const DAY_ACTIVITY_LABELS: Record<DayActivityKey, string> = {
  briefing: "Daily briefing (5 min)",
  learning: "PMBOK concept learning (10 min)",
  workplace: "Review inbox / meetings / documents (10 min)",
  decisions: "Project decisions & activities (20 min)",
  practice: "Adaptive practice questions (10 min)",
  reflection: "Reflection & mentor feedback (5 min)",
};

export const DAY_ACTIVITY_MINUTES: Record<DayActivityKey, number> = {
  briefing: 5,
  learning: 10,
  workplace: 10,
  decisions: 20,
  practice: 10,
  reflection: 5,
};

/**
 * Chapter Contract (Simulation Design Blueprint §7.2 / §8.4).
 *
 * A DayDefinition is the runtime "chapter" a learner works through. Chapters
 * are NOT calendar days: `inWorldStart` and `inWorldEnd` describe the
 * simulated project time span the chapter covers, independent of the ~60
 * minutes of real learner time it takes to complete.
 *
 * All Chapter Contract fields are OPTIONAL so existing casepacks keep
 * working. New content authored against the Business Case Content Bible
 * should populate them.
 */
export type ChapterAdvanceRule = {
  /** Required activity keys. Defaults to REQUIRED_ACTIVITIES when omitted. */
  requiredActivities?: DayActivityKey[];
  /** IDs (or key suffixes) of decisions that must have a log entry. */
  requiredDecisionIds?: string[];
  /** Document kinds that must be present at chapter close. */
  requiredOutputKinds?: string[];
};

export type ChapterProgressContext = {
  chapter: number;
  activityFlags: Record<DayActivityKey, boolean>;
  decisionIdsLogged: Set<string>;
  documentKindsPresent: Set<string>;
};

export type MayaTrigger =
  | "unsupported_guarantee"
  | "critical_stakeholder_excluded"
  | "no_success_criteria"
  | "high_priority_ignored"
  | "learner_asked"
  | "poor_decision_quality"
  | "stakeholder_relationship_degraded"
  | "commitment_missed";

export type DayDefinition = {
  day: number;
  title: string;
  phase: SimPhase;
  focus: string;
  objectives: string[];
  /** Morning briefing narrative — sets the tone and story of the day. */
  briefing: string;
  /** End-of-day cliffhanger / story hook — pushes into the next day. */
  storyHook: string;

  // --- Chapter Contract (all optional, additive) ---
  storyTheme?: string;
  inWorldStart?: string;         // e.g. "Project week 1"
  inWorldEnd?: string;           // e.g. "Project week 1"
  lifecycleEmphasis?: SimPhase[];
  openingCondition?: string;
  scoringEmphasis?: string[];
  mayaTriggers?: MayaTrigger[];
  advanceRule?: ChapterAdvanceRule;
};


export const DAY_PLAN: DayDefinition[] = [
  {
    day: 1,
    title: "Orientation & Tailoring",
    phase: "Tailoring",
    focus: "Understand the business case and tailor the delivery approach.",
    objectives: [
      "Review project background and organizational context",
      "Complete the Tailoring Workshop",
      "Select and justify a delivery approach",
      "Review PMBOK tailoring concepts",
    ],
    briefing:
      "Monday morning, 8:15. You just joined as the project manager. Your inbox already has a welcome note from the sponsor, an intro from the vendor, and a message from a pilot customer. In an hour you'll walk into the project kickoff meeting — the sponsor sets ambitious goals, the product owner is excited, and engineering already looks cautious. Your first job is not to solve anything: it is to listen, tailor your approach to the context, and set the tone as a leader.",
    storyHook:
      "As the day winds down a late email lands from your sponsor — a competitor just announced an AI-powered self-service portal, and the exec team wants your impact assessment tomorrow. The project just got sharper teeth.",
  },
  {
    day: 2,
    title: "Initiation",
    phase: "Initiation",
    focus: "Confirm feasibility, identify stakeholders, and align the sponsor.",
    objectives: [
      "Review the business case and feasibility",
      "Identify key stakeholders",
      "Engage with the sponsor",
      "Develop or review the project charter",
    ],
    briefing:
      "The competitor announcement changes everything. The sponsor wants a quick impact read, the customer team wants to be involved, and Finance wants budget visibility. Today is about turning noise into structure — a signed charter, a real stakeholder register, and clear governance.",
    storyHook:
      "Engineering drops a technical constraint that blows up one of your kickoff assumptions. Tomorrow's planning session just got harder.",
  },
  {
    day: 3,
    title: "Planning",
    phase: "Planning",
    focus: "Build the plan across scope, schedule, cost, risk, and stakeholders.",
    objectives: [
      "Define scope or product backlog",
      "Develop schedule and cost approach",
      "Create risk and stakeholder strategies",
      "Make key planning decisions",
    ],
    briefing:
      "Scope pressure is now real. Product wants more features, engineering pushes back, finance reminds you about the budget, security raises new compliance concerns. There is no perfect plan — only trade-offs you can defend.",
    storyHook:
      "A key team member resigns and a vendor flags a delay. Tomorrow you stop planning and start leading humans through the mess.",
  },
  {
    day: 4,
    title: "Execution",
    phase: "Execution",
    focus: "Lead the team, manage communications, respond to early events.",
    objectives: [
      "Lead the project team",
      "Manage stakeholder communication",
      "Respond to early stakeholder and vendor events",
      "Address team or resource issues",
    ],
    briefing:
      "Plans are meeting reality. Standups are drifting, demos expose usability issues, and stakeholders are pulling in different directions. Today is about servant leadership and disciplined communication.",
    storyHook:
      "A critical test fails overnight. Execs are already asking questions before you've had coffee.",
  },
  {
    day: 5,
    title: "Monitoring & Controlling",
    phase: "Monitoring",
    focus: "Measure performance and steer the project.",
    objectives: [
      "Review schedule, cost, quality, and risk performance",
      "Respond to change requests",
      "Make corrective or preventive decisions",
    ],
    briefing:
      "Numbers are talking. EVM, defect trends, risk heatmaps — read them like a leader, not an accountant. Change requests are landing; decide with data, not fear.",
    storyHook:
      "A steering committee is called for tomorrow. Recovery — or a very hard conversation — is on the agenda.",
  },
  {
    day: 6,
    title: "Crisis & Recovery",
    phase: "Monitoring",
    focus: "Respond to a major issue and recover the project.",
    objectives: [
      "Respond to a major issue or risk",
      "Participate in a steering committee meeting",
      "Apply leadership, negotiation, and conflict skills",
      "Develop a recovery strategy",
    ],
    briefing:
      "This is the day leadership is tested. Options over panic. Facts over blame. Recovery plans that stakeholders can actually believe.",
    storyHook:
      "The sponsor signs off on the recovery plan. Cutover starts tomorrow — go/no-go, then launch.",
  },
  {
    day: 7,
    title: "Delivery & Closing",
    phase: "Closing",
    focus: "Close out the project, capture lessons, and receive final assessment.",
    objectives: [
      "Obtain acceptance and complete closure",
      "Review benefits and lessons learned",
      "Receive final AI mentor assessment",
      "Generate a personalized development plan",
    ],
    briefing:
      "Launch day. Whether it goes smoothly or rocky depends on choices you made all week. Own the outcome, run a real closure, hand off benefits, and step back to reflect.",
    storyHook:
      "Maya delivers your final executive-style performance review — the story of the leader you became this week.",
  },

];

export const REQUIRED_ACTIVITIES: DayActivityKey[] = [
  "briefing",
  "learning",
  "workplace",
  "decisions",
  "practice",
  "reflection",
];

export function getDay(dayNumber: number): DayDefinition {
  return DAY_PLAN.find((d) => d.day === dayNumber) ?? DAY_PLAN[0];
}
