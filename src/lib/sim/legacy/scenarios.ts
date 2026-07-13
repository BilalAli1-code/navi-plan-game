import type {
  Difficulty,
  KnowledgeArea,
  ProcessGroup,
  Scenario,
  ScenarioMeta,
} from "./types";

export const PHASE_ORDER = [
  "initiation",
  "planning",
  "execution",
  "monitoring",
  "closing",
] as const;

export const PHASE_META: Record<
  (typeof PHASE_ORDER)[number],
  { label: string; blurb: string }
> = {
  initiation: { label: "Initiation", blurb: "Charter, business case, stakeholders" },
  planning: { label: "Planning", blurb: "WBS, schedule, budget, risk & comms" },
  execution: { label: "Execution", blurb: "Team, vendors, deliverables" },
  monitoring: { label: "Monitoring & Control", blurb: "Performance, changes, issues" },
  closing: { label: "Closing", blurb: "Delivery, lessons learned, evaluation" },
};

export const QUESTIONS_PER_PHASE = 3;

// The business case is always the first decision of every simulation, before Initiation.
export const BUSINESS_CASE: Scenario = {
  id: "biz-case",
  phase: "initiation",
  kind: "phase",
  title: "Approve the Business Case",
  body: "Executive leadership has handed you a draft business case for a new customer-portal replacement. Estimated cost is $2.4M over 9 months, expected NPV is $6M over 3 years, and the project aligns with the corporate strategy — but market conditions are shifting. What is your recommendation before committing?",
  choices: [
    {
      id: "a",
      label: "Endorse it — validate assumptions, NPV/IRR, strategic alignment, then recommend go",
      rationale: "PMBOK 7: value delivery + Initiation guardrails. Confirms benefits realization before charter.",
      impact: { stakeholders: 8, scope: 5, risk: -5 },
      xp: 25,
      quality: "excellent",
    },
    {
      id: "b",
      label: "Rubber-stamp it — leadership already decided, get moving",
      rationale: "Skips due diligence. Sets up scope, benefit, and risk failures downstream.",
      impact: { risk: 15, scope: -10, stakeholders: -5 },
      xp: 3,
      quality: "poor",
    },
    {
      id: "c",
      label: "Reject it — market is too uncertain to justify $2.4M",
      rationale: "Overreacts on limited data; you can plan phased delivery under uncertainty.",
      impact: { stakeholders: -10, schedule: -5 },
      xp: 6,
      quality: "risky",
    },
    {
      id: "d",
      label: "Recommend a phased pilot: fund discovery + MVP, gate full spend on results",
      rationale: "Hybrid PMBOK 7: iterative funding, real-options thinking, protects benefit case.",
      impact: { risk: -10, budget: 5, stakeholders: 5 },
      xp: 24,
      quality: "excellent",
    },
  ],
};

// Phase scenarios: 3 per phase. Simulator will play them in order.
export const PHASE_SCENARIOS: Scenario[] = [
  // ============ INITIATION ============
  {
    id: "init-1",
    phase: "initiation",
    kind: "phase",
    title: "Draft the Project Charter",
    body: "The sponsor wants the charter today. High-level scope is fuzzy and no stakeholder register exists yet. What do you do?",
    choices: [
      { id: "a", label: "Draft charter with sponsor + run rapid stakeholder identification in parallel", rationale: "Balances speed with PMBOK 6 Identify Stakeholders and Develop Charter integration.", impact: { stakeholders: 5, risk: -5, scope: 5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Sign off a placeholder charter now and fix later", rationale: "Skips Integration Management foundations; scope and risk creep in.", impact: { scope: -15, risk: 15, stakeholders: -5 }, xp: 5, quality: "poor" },
      { id: "c", label: "Delay the charter until full requirements are collected", rationale: "Confuses Initiating with Planning; sponsor loses confidence.", impact: { stakeholders: -10, schedule: -10 }, xp: 8, quality: "risky" },
      { id: "d", label: "Charter with clear success criteria + assumptions/constraints logged", rationale: "Solid PMBOK 7 stewardship + tailoring; explicit assumptions reduce future risk.", impact: { scope: 8, risk: -8, stakeholders: 5 }, xp: 22, quality: "excellent" },
    ],
  },
  {
    id: "init-2",
    phase: "initiation",
    kind: "phase",
    title: "Identify Stakeholders",
    body: "Your charter is signed. You have 48 hours before the kickoff and a long list of names but no analysis. How do you approach the stakeholder register?",
    choices: [
      { id: "a", label: "Run a power/interest grid + salience model workshop with sponsor & PMO", rationale: "PMBOK Identify Stakeholders best practice — classifies engagement strategy correctly.", impact: { stakeholders: 12, risk: -5 }, xp: 24, quality: "excellent" },
      { id: "b", label: "Invite everyone to every meeting to be safe", rationale: "Meeting overload, unclear ownership, dilutes accountability.", impact: { morale: -8, schedule: -5, stakeholders: -3 }, xp: 5, quality: "poor" },
      { id: "c", label: "Only talk to the sponsor — they'll cascade", rationale: "Misses silent influencers; blindsides you in Execution.", impact: { stakeholders: -10, risk: 10 }, xp: 6, quality: "risky" },
      { id: "d", label: "Register + tailored comms plan per stakeholder group", rationale: "Plan Communications Management done right.", impact: { stakeholders: 10, risk: -3 }, xp: 22, quality: "excellent" },
    ],
  },
  {
    id: "init-3",
    phase: "initiation",
    kind: "phase",
    title: "Define High-Level Scope & Success Criteria",
    body: "Sponsor wants a one-page scope statement. Marketing, Ops, and IT are already pulling in different directions on what 'done' means.",
    choices: [
      { id: "a", label: "Facilitate a MoSCoW workshop, publish measurable acceptance criteria", rationale: "Requirements/scope tailoring — creates a shared, testable definition of done.", impact: { scope: 12, stakeholders: 5, risk: -5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Write what you think they want and ask them to sign", rationale: "Bypasses stakeholders; sets up change-request storm later.", impact: { scope: -12, stakeholders: -10, risk: 10 }, xp: 4, quality: "poor" },
      { id: "c", label: "Copy scope from the last similar project", rationale: "Ignores tailoring principle; may miss context-specific needs.", impact: { scope: -5, risk: 8 }, xp: 8, quality: "risky" },
      { id: "d", label: "Draft scope + explicit out-of-scope list, review with each group", rationale: "Explicit boundaries prevent scope creep — classic PMBOK move.", impact: { scope: 10, stakeholders: 6, risk: -3 }, xp: 22, quality: "excellent" },
    ],
  },

  // ============ PLANNING ============
  {
    id: "plan-1",
    phase: "planning",
    kind: "phase",
    title: "Build the Schedule & Risk Plan",
    body: "You have a target date from the sponsor but the team estimates 20% more effort. How do you plan?",
    choices: [
      { id: "a", label: "Force team estimates down to hit the date", rationale: "Ignores realistic estimating; morale and quality collapse.", impact: { schedule: 10, morale: -20, risk: 20, scope: -10 }, xp: 3, quality: "poor" },
      { id: "b", label: "Negotiate scope reduction + reserve analysis + risk register", rationale: "Classic PMBOK: scope/schedule/cost trade + management reserves.", impact: { scope: 5, risk: -15, stakeholders: 5, morale: 5 }, xp: 25, quality: "excellent" },
      { id: "c", label: "Add contractors to compress the schedule", rationale: "Crashing works but adds cost and coordination risk.", impact: { budget: -10, schedule: 5, risk: 5 }, xp: 15, quality: "good" },
      { id: "d", label: "Commit to date, hide the gap in the plan", rationale: "Violates transparency principle; catastrophic in Monitoring.", impact: { risk: 25, stakeholders: -10, morale: -10 }, xp: 0, quality: "poor" },
    ],
  },
  {
    id: "plan-2",
    phase: "planning",
    kind: "phase",
    title: "Cost Estimating & Budget",
    body: "Finance asks for a firm number. You have parametric estimates ±30% and no historical data for two of the workstreams.",
    choices: [
      { id: "a", label: "Bottom-up estimate + contingency + management reserve, communicate range", rationale: "Estimate Costs + Determine Budget with proper reserves and transparency.", impact: { budget: 5, risk: -10, stakeholders: 5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Give the midpoint and promise you'll hit it", rationale: "Point estimates without reserves = guaranteed overrun.", impact: { budget: -10, risk: 15, stakeholders: -8 }, xp: 4, quality: "poor" },
      { id: "c", label: "Sandbag heavily to guarantee coming in under", rationale: "Padding erodes trust when finance benchmarks other projects.", impact: { stakeholders: -8, budget: 3 }, xp: 8, quality: "risky" },
      { id: "d", label: "Analogous estimate now, refine to definitive after design", rationale: "Rolling-wave / progressive elaboration — appropriate for early stage.", impact: { budget: 3, risk: -5 }, xp: 20, quality: "good" },
    ],
  },
  {
    id: "plan-3",
    phase: "planning",
    kind: "phase",
    title: "Communications & Governance Plan",
    body: "Steering committee, sponsor, vendor and cross-functional teams all want different cadences and formats. Design your plan.",
    choices: [
      { id: "a", label: "Stakeholder-tailored comms matrix + RACI + escalation path", rationale: "Plan Communications + Stakeholder Engagement PMBOK best practice.", impact: { stakeholders: 12, morale: 5, risk: -5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Weekly status email to all — same message for everyone", rationale: "One-size-fits-all misses engagement needs of key stakeholders.", impact: { stakeholders: -8 }, xp: 6, quality: "risky" },
      { id: "c", label: "Ad hoc — meet when needed", rationale: "No cadence = surprises and rework.", impact: { stakeholders: -10, risk: 10 }, xp: 4, quality: "poor" },
      { id: "d", label: "Steering deck + team standup + vendor SLA review — three separate cadences", rationale: "Layered governance is right; add RACI to make it excellent.", impact: { stakeholders: 8, risk: -3 }, xp: 20, quality: "good" },
    ],
  },

  // ============ EXECUTION ============
  {
    id: "exec-1",
    phase: "execution",
    kind: "phase",
    title: "Kick Off Execution",
    body: "Team is assembled, vendor onboarded. First sprint/deliverable starts Monday. Where do you invest your first week?",
    choices: [
      { id: "a", label: "Working agreements, definition of done, comms cadence with stakeholders", rationale: "Hybrid best practice: team charter + PMBOK Manage Communications.", impact: { morale: 12, stakeholders: 8, risk: -5 }, xp: 22, quality: "excellent" },
      { id: "b", label: "Jump straight into building — velocity matters", rationale: "Skipping team norms drives rework and conflict.", impact: { morale: -8, risk: 10, scope: -5 }, xp: 5, quality: "poor" },
      { id: "c", label: "Detailed micromanagement of every task", rationale: "Violates servant leadership; morale drops.", impact: { morale: -15, schedule: 3 }, xp: 6, quality: "risky" },
      { id: "d", label: "Run a risk workshop with the team & vendor", rationale: "Good but incomplete without team norms; still valuable.", impact: { risk: -12, stakeholders: 3 }, xp: 16, quality: "good" },
    ],
  },
  {
    id: "exec-2",
    phase: "execution",
    kind: "phase",
    title: "Manage Quality on the First Deliverable",
    body: "The team is about to hand over the first deliverable. QA found 12 minor defects and 2 majors. Client demo is tomorrow.",
    choices: [
      { id: "a", label: "Fix majors, disclose minors with a remediation plan, demo with transparency", rationale: "Manage Quality + Stakeholder trust — honest handover.", impact: { stakeholders: 8, scope: 5, risk: -5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Ship as-is and hope the client doesn't spot them", rationale: "Quality debt compounds; trust collapse when found.", impact: { stakeholders: -15, risk: 15, scope: -10 }, xp: 3, quality: "poor" },
      { id: "c", label: "Delay the demo two weeks to fix everything", rationale: "Overcorrects — schedule impact for diminishing returns.", impact: { schedule: -12, stakeholders: -5 }, xp: 8, quality: "risky" },
      { id: "d", label: "Fix majors, run root-cause on the defects", rationale: "Solid — proactive quality control.", impact: { risk: -8, scope: 3 }, xp: 18, quality: "good" },
    ],
  },
  {
    id: "exec-3",
    phase: "execution",
    kind: "phase",
    title: "Team Conflict",
    body: "Two senior engineers openly disagree on architecture in front of the team. Morale is dropping this week.",
    choices: [
      { id: "a", label: "Facilitate a structured decision session with criteria and a timeboxed choice", rationale: "Manage Team / conflict-resolution: confront-problem-solve style.", impact: { morale: 10, risk: -5, scope: 3 }, xp: 24, quality: "excellent" },
      { id: "b", label: "Pick one architecture yourself to end the debate", rationale: "Forcing works short-term but breaks trust and ownership.", impact: { morale: -10, stakeholders: -3, risk: 5 }, xp: 6, quality: "risky" },
      { id: "c", label: "Ignore it — they'll figure it out", rationale: "Avoidance = festering conflict + delivery risk.", impact: { morale: -15, risk: 12 }, xp: 3, quality: "poor" },
      { id: "d", label: "1:1 coaching with each engineer, then joint agreement", rationale: "Servant leadership — good, slightly slower than facilitated session.", impact: { morale: 8, risk: -3 }, xp: 18, quality: "good" },
    ],
  },

  // ============ MONITORING ============
  {
    id: "mon-1",
    phase: "monitoring",
    kind: "phase",
    title: "Mid-Project Health Check",
    body: "EVM shows CPI 0.88 and SPI 0.92. Sponsor asks for status. How do you respond?",
    choices: [
      { id: "a", label: "Transparent report + variance analysis + corrective action plan", rationale: "Perform Integrated Change Control + Control Costs done right.", impact: { stakeholders: 10, risk: -10, budget: -3 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Report 'green' — you'll recover next month", rationale: "Status manipulation destroys trust when reality hits.", impact: { stakeholders: -20, risk: 15 }, xp: 0, quality: "poor" },
      { id: "c", label: "Escalate immediately, request more budget", rationale: "Correct escalation, but no corrective plan attached.", impact: { stakeholders: -3, budget: -10, risk: -5 }, xp: 12, quality: "good" },
      { id: "d", label: "Cut scope silently to catch up", rationale: "Bypasses change control — the classic PMBOK anti-pattern.", impact: { scope: -20, stakeholders: -10 }, xp: 3, quality: "poor" },
    ],
  },
  {
    id: "mon-2",
    phase: "monitoring",
    kind: "phase",
    title: "Handle a Change Request",
    body: "A senior stakeholder sends an email asking for a 'small' UI change — but it touches core data flows. What's the correct next step?",
    choices: [
      { id: "a", label: "Log it in the change log, run impact analysis, take it to the CCB", rationale: "Perform Integrated Change Control — never accept CRs via email.", impact: { scope: 8, stakeholders: 3, risk: -5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Ask the team to implement — it's a senior stakeholder", rationale: "Uncontrolled change, hidden cost/schedule impact.", impact: { scope: -12, budget: -8, risk: 12 }, xp: 4, quality: "poor" },
      { id: "c", label: "Reply 'no' — we're past the change window", rationale: "Damages relationship without exploring the option.", impact: { stakeholders: -10 }, xp: 6, quality: "risky" },
      { id: "d", label: "Estimate quickly, absorb into next sprint", rationale: "Skips formal impact — risky even if 'small'.", impact: { scope: -5, risk: 8 }, xp: 8, quality: "risky" },
    ],
  },
  {
    id: "mon-3",
    phase: "monitoring",
    kind: "phase",
    title: "Control Risks",
    body: "Your risk register hasn't been reviewed in 4 weeks. Two new risks were mentioned in the last retro but never logged.",
    choices: [
      { id: "a", label: "Run a risk review session, update register, assign owners & responses", rationale: "Monitor Risks — treat register as a living document.", impact: { risk: -15, stakeholders: 3, morale: 3 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Add the two risks yourself later this week", rationale: "Better than nothing but misses team involvement.", impact: { risk: -5 }, xp: 12, quality: "good" },
      { id: "c", label: "Leave it — the team knows the risks informally", rationale: "Tribal knowledge fails at handover and audit.", impact: { risk: 12, stakeholders: -3 }, xp: 4, quality: "poor" },
      { id: "d", label: "Only track the top-5 risks to reduce overhead", rationale: "Reasonable tailoring, but you'll miss emerging risks.", impact: { risk: 5 }, xp: 10, quality: "risky" },
    ],
  },

  // ============ CLOSING ============
  {
    id: "close-1",
    phase: "closing",
    kind: "phase",
    title: "Close the Project",
    body: "Final deliverable is accepted. What closes the project properly?",
    choices: [
      { id: "a", label: "Formal acceptance + lessons learned + release resources + archive", rationale: "Textbook Close Project or Phase.", impact: { stakeholders: 10, morale: 10 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Move team to next project immediately", rationale: "Skips knowledge transfer and closure ceremonies.", impact: { morale: -10, stakeholders: -5 }, xp: 5, quality: "poor" },
      { id: "c", label: "Retrospective only, skip formal sign-off", rationale: "Missing contractual closure creates downstream disputes.", impact: { stakeholders: -10, risk: 10 }, xp: 8, quality: "risky" },
      { id: "d", label: "Client handover + benefits realization plan + lessons learned", rationale: "PMBOK 7 outcome/value orientation.", impact: { stakeholders: 12, morale: 8 }, xp: 24, quality: "excellent" },
    ],
  },
  {
    id: "close-2",
    phase: "closing",
    kind: "phase",
    title: "Vendor & Procurement Closeout",
    body: "Two vendors are involved. One delivered late, the other overperformed. How do you close procurements?",
    choices: [
      { id: "a", label: "Formal contract closure, final payments, performance scorecard for both", rationale: "Close Procurements — audit-ready and future-proofs vendor pool.", impact: { stakeholders: 8, risk: -5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Pay both in full, move on", rationale: "Loses leverage, misses feedback loop for the org.", impact: { budget: -5, stakeholders: -3 }, xp: 6, quality: "risky" },
      { id: "c", label: "Withhold final payment from the late vendor without notice", rationale: "Contractual dispute risk without formal process.", impact: { risk: 15, stakeholders: -8 }, xp: 4, quality: "poor" },
      { id: "d", label: "Formal closure + preferred-vendor recommendation to PMO", rationale: "Great — captures OPA (organizational process assets).", impact: { stakeholders: 6 }, xp: 22, quality: "excellent" },
    ],
  },
  {
    id: "close-3",
    phase: "closing",
    kind: "phase",
    title: "Lessons Learned & Benefits Realization",
    body: "The sponsor asks how you'll prove the project delivered value.",
    choices: [
      { id: "a", label: "Benefits realization plan with KPIs, owner, and 3/6/12-month review points", rationale: "PMBOK 7 value delivery — links project output to business outcome.", impact: { stakeholders: 12, morale: 5 }, xp: 25, quality: "excellent" },
      { id: "b", label: "Deliverable is accepted, benefits are Ops' problem", rationale: "Misses the whole point of PMBOK 7 value focus.", impact: { stakeholders: -10 }, xp: 4, quality: "poor" },
      { id: "c", label: "Publish lessons learned to the PMO wiki, hand off benefits tracking", rationale: "Good practice — could be stronger with explicit owner.", impact: { stakeholders: 5 }, xp: 18, quality: "good" },
      { id: "d", label: "Skip benefits — track velocity instead", rationale: "Confuses output with outcome; PMBOK anti-pattern.", impact: { stakeholders: -8 }, xp: 5, quality: "risky" },
    ],
  },
];

// Random events can fire between phase scenarios.
export const RANDOM_EVENTS: Scenario[] = [
  {
    id: "ev-scope",
    phase: "execution",
    kind: "event",
    title: "⚠️ Client requests a major scope change",
    body: "The client wants a new module added — no timeline or budget change. They insist it's 'small'.",
    choices: [
      { id: "a", label: "Log a change request, impact analysis, route through CCB", rationale: "Perform Integrated Change Control — the correct PMBOK response.", impact: { scope: 8, stakeholders: 5, risk: -5 }, xp: 22, quality: "excellent" },
      { id: "b", label: "Say yes to keep the client happy", rationale: "Uncontrolled scope creep.", impact: { scope: -20, budget: -10, schedule: -10, risk: 15 }, xp: 2, quality: "poor" },
      { id: "c", label: "Refuse outright — 'not in scope'", rationale: "Damages the stakeholder relationship without exploring options.", impact: { stakeholders: -15, scope: 3 }, xp: 6, quality: "risky" },
    ],
  },
  {
    id: "ev-vendor",
    phase: "execution",
    kind: "event",
    title: "⚠️ Vendor announces a 3-week delay",
    body: "Your critical-path vendor slips 3 weeks. Contract has a late-delivery clause.",
    choices: [
      { id: "a", label: "Trigger risk response, invoke contract clause, re-plan critical path", rationale: "Risk response + procurement management done right.", impact: { risk: -8, schedule: -5, budget: 3 }, xp: 22, quality: "excellent" },
      { id: "b", label: "Wait and hope they recover", rationale: "No response strategy = compound risk.", impact: { schedule: -20, risk: 20 }, xp: 2, quality: "poor" },
      { id: "c", label: "Bring work in-house immediately", rationale: "Costly and burns morale, but reduces dependency.", impact: { budget: -15, morale: -8, schedule: -3, risk: -5 }, xp: 12, quality: "good" },
    ],
  },
  {
    id: "ev-resign",
    phase: "execution",
    kind: "event",
    title: "⚠️ Key team member resigns",
    body: "Your lead engineer resigns with 2 weeks notice. They own 40% of the domain knowledge.",
    choices: [
      { id: "a", label: "Knowledge transfer plan + pair programming + update risk register", rationale: "Resource management + risk mitigation.", impact: { risk: -8, morale: -3, schedule: -3 }, xp: 20, quality: "excellent" },
      { id: "b", label: "Backfill with a contractor next month", rationale: "Reasonable but delayed; knowledge is already walking out.", impact: { budget: -8, schedule: -8, risk: 5 }, xp: 10, quality: "good" },
      { id: "c", label: "Ignore — the team will absorb it", rationale: "Guaranteed burnout and delivery risk.", impact: { morale: -15, risk: 20, schedule: -10 }, xp: 2, quality: "poor" },
    ],
  },
  {
    id: "ev-budget",
    phase: "monitoring",
    kind: "event",
    title: "⚠️ Finance cuts your budget by 15%",
    body: "Corporate finance mandates a 15% budget cut across all projects.",
    choices: [
      { id: "a", label: "Re-baseline: negotiate scope with sponsor + update plans", rationale: "Change control + realistic re-planning.", impact: { scope: -8, stakeholders: 3, risk: -5, budget: -15 }, xp: 22, quality: "excellent" },
      { id: "b", label: "Cut quality assurance to save money", rationale: "Manage Quality violation — defects will explode.", impact: { risk: 25, scope: -10, stakeholders: -10, budget: -15 }, xp: 2, quality: "poor" },
      { id: "c", label: "Draw from management reserve, delay decision", rationale: "Buys time but doesn't address the mandate.", impact: { budget: -15, risk: 8 }, xp: 10, quality: "risky" },
    ],
  },
  {
    id: "ev-reg",
    phase: "monitoring",
    kind: "event",
    title: "⚠️ New regulatory requirement drops",
    body: "A compliance rule goes live next quarter and affects your deliverable.",
    choices: [
      { id: "a", label: "Assess impact, log change request, engage compliance & sponsor", rationale: "Integrated Change Control + Stakeholder Engagement.", impact: { risk: -10, stakeholders: 5, scope: 3, budget: -5 }, xp: 22, quality: "excellent" },
      { id: "b", label: "Ship current version, retrofit later", rationale: "Non-compliant delivery = project failure.", impact: { risk: 25, stakeholders: -15 }, xp: 3, quality: "poor" },
      { id: "c", label: "Pause the project until requirements are clear", rationale: "Overreaction — you can plan under uncertainty.", impact: { schedule: -15, stakeholders: -5 }, xp: 8, quality: "risky" },
    ],
  },
];

// ---------- Scenario metadata ----------
// Per-scenario PMBOK metadata. Any scenario not listed falls back to a
// phase-derived default via getScenarioMeta().
const SCENARIO_META_OVERRIDES: Record<
  string,
  Partial<ScenarioMeta> & { knowledgeArea: KnowledgeArea; difficulty: Difficulty; explanation: string; pmMindset: string }
> = {
  "biz-case": {
    knowledgeArea: "Integration",
    difficulty: "medium",
    explanation:
      "Business cases are validated against benefits realization (NPV, strategic fit) before charter. Phased funding controls downside risk when markets shift.",
    pmMindset:
      "A PM protects value delivery — never rubber-stamp, never over-reject. Use real options to keep decisions reversible.",
    examTip: "The PMP expects PMs to validate benefits and use phased delivery under uncertainty, not to rubber-stamp or reject outright.",
  },
  "init-1": {
    knowledgeArea: "Integration",
    difficulty: "easy",
    explanation:
      "Develop Project Charter runs in parallel with Identify Stakeholders. Explicit assumptions/constraints reduce downstream risk.",
    pmMindset: "Move fast, but never skip the artifacts that anchor scope and accountability.",
  },
  "init-2": {
    knowledgeArea: "Stakeholder",
    difficulty: "easy",
    explanation:
      "Power/interest and salience models classify engagement strategy — this is core PMBOK Identify Stakeholders.",
    pmMindset: "Not everyone deserves the same cadence. Tailor engagement to influence and interest.",
  },
  "init-3": {
    knowledgeArea: "Scope",
    difficulty: "easy",
    explanation:
      "MoSCoW + measurable acceptance criteria + explicit out-of-scope list create a shared definition of done.",
    pmMindset: "Ambiguity in scope becomes conflict in execution. Publish 'not doing' as loudly as 'doing'.",
  },
  "plan-1": {
    knowledgeArea: "Schedule",
    difficulty: "medium",
    explanation:
      "Realistic estimating + reserve analysis + risk register is the PMBOK way to reconcile a target date with true effort.",
    pmMindset: "Never lie with the plan. Negotiate scope or reserves; hiding gaps guarantees failure.",
  },
  "plan-2": {
    knowledgeArea: "Cost",
    difficulty: "medium",
    explanation:
      "Bottom-up estimating with contingency and management reserve, communicated as a range, is Determine Budget done right.",
    pmMindset: "Point estimates are political theatre. Ranges + reserves are how PMs tell the truth.",
  },
  "plan-3": {
    knowledgeArea: "Communications",
    difficulty: "medium",
    explanation:
      "Plan Communications Management pairs a stakeholder-tailored matrix with RACI and escalation paths.",
    pmMindset: "One-size-fits-all comms is nobody's comms. Tailor to power and interest.",
  },
  "exec-1": {
    knowledgeArea: "Resource",
    difficulty: "medium",
    explanation:
      "Working agreements, definition of done, and comms cadence are hybrid best practice for kicking off execution.",
    pmMindset: "Team norms before velocity. Skipping this is 'fast' in week one and slow every week after.",
  },
  "exec-2": {
    knowledgeArea: "Quality",
    difficulty: "medium",
    explanation:
      "Manage Quality: fix majors, disclose minors with a remediation plan, and preserve trust with transparent handover.",
    pmMindset: "Ship truthfully. Undisclosed defects are trust debt at compound interest.",
  },
  "exec-3": {
    knowledgeArea: "Resource",
    difficulty: "hard",
    explanation:
      "Confront-problem-solve conflict style with structured criteria and a timeboxed decision preserves ownership and morale.",
    pmMindset: "Facilitate the decision; don't own the answer. Servant leadership beats forcing.",
    examTip: "The PMP usually favors collaboration and problem-solving before escalation or forcing a decision.",
  },
  "mon-1": {
    knowledgeArea: "Integration",
    difficulty: "hard",
    explanation:
      "CPI/SPI variance requires transparent reporting AND a corrective action plan — Perform Integrated Change Control.",
    pmMindset: "Green-washing is career-ending. Own the variance and bring the fix.",
  },
  "mon-2": {
    knowledgeArea: "Scope",
    difficulty: "medium",
    explanation:
      "Change requests are logged, impact-analysed, and routed through the CCB — never accepted via email.",
    pmMindset: "Every 'small' change is an uncontrolled cost until analysed. Trust the process.",
  },
  "mon-3": {
    knowledgeArea: "Risk",
    difficulty: "medium",
    explanation:
      "Monitor Risks treats the register as a living document — regular reviews with owners and responses.",
    pmMindset: "A stale risk register is worse than none — it manufactures false confidence.",
  },
  "close-1": {
    knowledgeArea: "Integration",
    difficulty: "easy",
    explanation:
      "Close Project or Phase: formal acceptance, lessons learned, resource release, archive.",
    pmMindset: "Closure is not paperwork — it's how the org gets smarter.",
  },
  "close-2": {
    knowledgeArea: "Procurement",
    difficulty: "medium",
    explanation:
      "Close Procurements formally with performance scorecards to future-proof the vendor pool.",
    pmMindset: "Contracts end cleanly or expensively. Pick clean.",
  },
  "close-3": {
    knowledgeArea: "Integration",
    difficulty: "hard",
    explanation:
      "PMBOK 7 value delivery: benefits realization plan with KPIs, owner, and review cadence links output to outcome.",
    pmMindset: "The project's job isn't 'delivered'. It's 'value realized'.",
  },
  "ev-scope": {
    knowledgeArea: "Scope",
    difficulty: "medium",
    explanation: "Perform Integrated Change Control is the answer to any 'small' scope request.",
    pmMindset: "Kindness to the client is honest impact analysis, not silent capitulation.",
  },
  "ev-vendor": {
    knowledgeArea: "Procurement",
    difficulty: "hard",
    explanation: "Trigger the risk response, invoke the contract clause, re-plan the critical path.",
    pmMindset: "Contracts exist for exactly this moment — use them.",
  },
  "ev-resign": {
    knowledgeArea: "Resource",
    difficulty: "hard",
    explanation: "Knowledge transfer + pair programming + updated risk register mitigates single-point-of-failure.",
    pmMindset: "Every resignation is a risk event. Extract knowledge before it walks.",
  },
  "ev-budget": {
    knowledgeArea: "Cost",
    difficulty: "hard",
    explanation: "Re-baseline via change control — renegotiate scope with the sponsor and update plans.",
    pmMindset: "Budget cuts are scope conversations in disguise.",
  },
  "ev-reg": {
    knowledgeArea: "Risk",
    difficulty: "medium",
    explanation: "Integrated Change Control + Stakeholder Engagement handles new compliance realities.",
    pmMindset: "Compliance is scope, not friction.",
  },
};

const PROCESS_GROUP_BY_PHASE: Record<Scenario["phase"], ProcessGroup> = {
  initiation: "Initiating",
  planning: "Planning",
  execution: "Executing",
  monitoring: "Monitoring & Controlling",
  closing: "Closing",
};

const KA_DEFAULT_EXAM_TIP: Record<KnowledgeArea, string> = {
  Integration: "Integrated Change Control governs every meaningful change — no shortcuts, no email approvals.",
  Scope: "The PMP favors preventing scope creep through the CCB over saying 'yes' or 'no' outright.",
  Schedule: "Prefer realistic estimating with reserves over crashing or fast-tracking without analysis.",
  Cost: "Ranges and reserves beat point estimates. Re-baseline via change control, never silently.",
  Quality: "Prevention over inspection. Fix majors, disclose minors, and root-cause the defect trend.",
  Resource: "Servant leadership and team empowerment beat command-and-control on the PMP.",
  Communications: "Tailor communication to each stakeholder group — one-size-fits-all is never the answer.",
  Risk: "Identify, analyze, respond, monitor — and always update the register with owners.",
  Procurement: "Follow contract terms. Formal closure and performance scorecards protect the org.",
  Stakeholder: "Engage, don't just inform. Analyze power/interest before choosing a strategy.",
};

export function getScenarioMeta(scenario: Scenario): ScenarioMeta {
  const override = SCENARIO_META_OVERRIDES[scenario.id] as
    | (Partial<ScenarioMeta> & {
        knowledgeArea: KnowledgeArea;
        difficulty: Difficulty;
        explanation: string;
        pmMindset: string;
      })
    | undefined;
  const excellent = scenario.choices.filter((c) => c.quality === "excellent");
  const pool = excellent.length ? excellent : scenario.choices;
  const correct = pool.reduce((best, c) => (c.xp > best.xp ? c : best), pool[0]);
  const ka = override?.knowledgeArea ?? "Integration";
  return {
    processGroup: override?.processGroup ?? PROCESS_GROUP_BY_PHASE[scenario.phase],
    knowledgeArea: ka,
    difficulty: override?.difficulty ?? "medium",
    explanation:
      override?.explanation ??
      "The correct answer follows PMBOK process — engage stakeholders, protect scope, and route changes formally.",
    pmMindset:
      override?.pmMindset ??
      "Think in trade-offs across scope, schedule, cost, quality, risk, and value.",
    examTip: override?.examTip ?? KA_DEFAULT_EXAM_TIP[ka],
    correctChoiceId: override?.correctChoiceId ?? correct.id,
  };
}

