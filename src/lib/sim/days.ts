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
    title: "The Assignment",
    phase: "Initiation",
    focus: "Understand the business case, meet the stakeholders, and set the tone.",
    storyTheme: "Understand before acting.",
    inWorldStart: "Project week 1",
    inWorldEnd: "Project week 1",
    lifecycleEmphasis: ["Initiation"],
    openingCondition:
      "The learner arrives as the newly assigned Project Manager after the previous lead left. Expectations are high; key details are unresolved.",
    objectives: [
      "Review the business case and identify weak assumptions",
      "Clarify measurable business objectives and success criteria",
      "Prepare for and lead the kickoff meeting",
      "Build or validate the initial stakeholder register",
      "Record initial risks, assumptions, issues, and dependencies",
      "Establish initial communication expectations",
    ],
    briefing:
      "Monday morning, 8:15. You just joined as the project manager. Your inbox already has a welcome note from the sponsor, an intro from the vendor, and a message from a pilot customer. In an hour you'll walk into the project kickoff meeting — the sponsor sets ambitious goals, the product owner is excited, and engineering already looks cautious. Your first job is not to solve anything: it is to listen, tailor your approach to the context, and set the tone as a leader.",
    storyHook:
      "At 5:42 PM the sponsor forwards an executive news alert — a competitor just launched an AI-enabled customer portal. The CEO wants an impact assessment and recommendation by tomorrow morning.",
    scoringEmphasis: [
      "Business understanding",
      "Stakeholder identification",
      "Executive communication",
      "Transparency",
      "Leadership tone",
      "Risk awareness",
      "Integration",
    ],
    mayaTriggers: [
      "unsupported_guarantee",
      "critical_stakeholder_excluded",
      "no_success_criteria",
      "high_priority_ignored",
      "learner_asked",
    ],
    advanceRule: {
      requiredOutputKinds: ["Charter", "Stakeholder Register"],
    },
  },
  {
    day: 2,
    title: "Planning Under Competitive Pressure",
    phase: "Planning",
    focus: "Build a credible plan while the executive target is moving.",
    storyTheme: "Build a credible plan while the target is moving.",
    inWorldStart: "Project week 2",
    inWorldEnd: "Project week 3",
    lifecycleEmphasis: ["Planning"],
    openingCondition:
      "The competitor announcement raises executive urgency. Marketing and Sales push to match or exceed the competitor's visible features.",
    objectives: [
      "Produce an executive impact assessment",
      "Facilitate a customer-needs / requirements workshop",
      "Prioritize MVP features and separate needs from solutions",
      "Develop the initial schedule, cost forecast, and reserves",
      "Develop risk and communication plans",
      "Assign benefits owners and change-control expectations",
    ],
    briefing:
      "The competitor announcement changes everything. The sponsor wants a quick impact read, the customer team wants to be involved, and Finance wants budget visibility. Today is about turning noise into structure — a signed charter, a real stakeholder register, and clear governance.",
    storyHook:
      "Engineering drops a technical constraint that blows up one of your kickoff assumptions. Tomorrow's planning session just got harder.",
    scoringEmphasis: [
      "Requirements discipline",
      "Prioritization",
      "Estimation credibility",
      "Executive alignment",
      "Communication clarity",
    ],
    mayaTriggers: ["unsupported_guarantee", "poor_decision_quality", "learner_asked"],
    advanceRule: {
      requiredOutputKinds: ["Plan", "Risk Register"],
    },
  },
  {
    day: 3,
    title: "The Project Changes Shape",
    phase: "Planning",
    focus: "Handle trade-offs, protect scope, and lock a defensible baseline.",
    storyTheme: "Every plan meets pressure. Defend value, not preferences.",
    inWorldStart: "Project week 4",
    inWorldEnd: "Project week 5",
    lifecycleEmphasis: ["Planning"],
    openingCondition:
      "New requests land from Sales, Legal, and Security. Reserves and timeline are contested.",
    objectives: [
      "Run change control on incoming requests",
      "Defend or rebase the schedule with data",
      "Update the risk register and stakeholder strategy",
      "Get an explicit baseline decision from the sponsor",
    ],
    briefing:
      "Scope pressure is now real. Product wants more features, engineering pushes back, finance reminds you about the budget, security raises new compliance concerns. There is no perfect plan — only trade-offs you can defend.",
    storyHook:
      "A key team member resigns and a vendor flags a delay. Tomorrow you stop planning and start leading humans through the mess.",
    scoringEmphasis: [
      "Change control discipline",
      "Trade-off transparency",
      "Baseline integrity",
      "Stakeholder negotiation",
    ],
    mayaTriggers: ["poor_decision_quality", "stakeholder_relationship_degraded", "learner_asked"],
  },
  {
    day: 4,
    title: "Delivery Begins",
    phase: "Execution",
    focus: "Lead the team, run cadence, and hold communication together.",
    storyTheme: "Plans are meeting reality. Lead the people, not the Gantt chart.",
    inWorldStart: "Project week 6",
    inWorldEnd: "Project week 8",
    lifecycleEmphasis: ["Execution", "Monitoring"],
    openingCondition:
      "First iteration ships. Standups drift, demos expose UX issues, and stakeholders pull in different directions.",
    objectives: [
      "Run effective cadence (standups, demos, reviews)",
      "Manage stakeholder communication proactively",
      "Address team, vendor, and resource issues",
      "Track and close open commitments from prior chapters",
    ],
    briefing:
      "Plans are meeting reality. Standups are drifting, demos expose usability issues, and stakeholders are pulling in different directions. Today is about servant leadership and disciplined communication.",
    storyHook: "A critical test fails overnight. Execs are already asking questions before you've had coffee.",
    scoringEmphasis: [
      "Servant leadership",
      "Communication rhythm",
      "Conflict handling",
      "Commitment follow-through",
    ],
    mayaTriggers: ["commitment_missed", "stakeholder_relationship_degraded", "learner_asked"],
  },
  {
    day: 5,
    title: "Crisis Exposes Earlier Decisions",
    phase: "Monitoring",
    focus: "Read the signals and steer with data — not fear.",
    storyTheme: "Numbers are talking. Read them like a leader.",
    inWorldStart: "Project week 9",
    inWorldEnd: "Project week 10",
    lifecycleEmphasis: ["Monitoring"],
    openingCondition:
      "EVM, defect trends, and risk heatmaps reveal a growing gap. Change requests are landing hard.",
    objectives: [
      "Review schedule, cost, quality, and risk performance",
      "Diagnose the true root cause (not the loudest voice)",
      "Respond to change requests with data",
      "Make corrective or preventive decisions",
    ],
    briefing:
      "Numbers are talking. EVM, defect trends, risk heatmaps — read them like a leader, not an accountant. Change requests are landing; decide with data, not fear.",
    storyHook:
      "A steering committee is called for tomorrow. Recovery — or a very hard conversation — is on the agenda.",
    scoringEmphasis: ["Data-driven judgment", "Root-cause discipline", "Change control", "Transparency"],
    mayaTriggers: ["poor_decision_quality", "high_priority_ignored", "learner_asked"],
  },
  {
    day: 6,
    title: "Recovery & Readiness",
    phase: "Monitoring",
    focus: "Lead a recovery the steering committee can believe in.",
    storyTheme: "Options over panic. Facts over blame.",
    inWorldStart: "Project week 11",
    inWorldEnd: "Project week 12",
    lifecycleEmphasis: ["Execution", "Monitoring"],
    openingCondition:
      "A material issue is on the table. The learner must present recovery options and manage escalation.",
    objectives: [
      "Present recovery options with trade-offs",
      "Rebuild trust with the sponsor and steering committee",
      "Apply negotiation and conflict techniques",
      "Confirm launch readiness criteria",
    ],
    briefing:
      "This is the day leadership is tested. Options over panic. Facts over blame. Recovery plans that stakeholders can actually believe.",
    storyHook: "The sponsor signs off on the recovery plan. Cutover starts tomorrow — go/no-go, then launch.",
    scoringEmphasis: [
      "Escalation quality",
      "Negotiation",
      "Conflict resolution",
      "Recovery planning",
      "Trust rebuild",
    ],
    mayaTriggers: [
      "stakeholder_relationship_degraded",
      "commitment_missed",
      "poor_decision_quality",
      "learner_asked",
    ],
  },
  {
    day: 7,
    title: "Launch, Transition, and Executive Review",
    phase: "Closing",
    focus: "Deliver, close responsibly, and reflect on the leader you became.",
    storyTheme: "Own the outcome. Hand off benefits. Learn out loud.",
    inWorldStart: "Project week 13",
    inWorldEnd: "90-day benefits review",
    lifecycleEmphasis: ["Closing"],
    openingCondition:
      "The go/no-go decision is imminent. Whether launch is smooth or rocky depends on choices made all week.",
    objectives: [
      "Make the go / no-go / responsible-delay decision",
      "Run a real closure with acceptance and lessons learned",
      "Hand off benefits to accountable owners",
      "Receive Maya's final executive-style performance review",
    ],
    briefing:
      "Launch day. Whether it goes smoothly or rocky depends on choices you made all week. Own the outcome, run a real closure, hand off benefits, and step back to reflect.",
    storyHook: "Maya delivers your final executive-style performance review — the story of the leader you became this week.",
    scoringEmphasis: [
      "Go/no-go judgment",
      "Benefits ownership",
      "Lessons discipline",
      "Executive communication",
      "Reflection quality",
    ],
    mayaTriggers: ["poor_decision_quality", "learner_asked"],
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
