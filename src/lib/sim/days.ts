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
