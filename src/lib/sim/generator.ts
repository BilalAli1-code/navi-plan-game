// Generates phase-appropriate decisions, emails, meetings, and documents for
// any industry case. Kept template-driven so all 15 industries share the same
// PMI-grounded decision spine while surface copy uses industry vocabulary.

import type {
  Decision,
  Email,
  Meeting,
  SimDocument,
  SimPhase,
  IndustryCaseRef,
} from "./types";

type DecisionTpl = Omit<Decision, "id"> & { key: string };

function d(tpl: DecisionTpl, industry: IndustryCaseRef): Decision {
  return {
    ...tpl,
    id: `${industry.id}-${tpl.key}`,
    title: tpl.title.replace("{project}", industry.projectName),
    situation: tpl.situation
      .replace("{project}", industry.projectName)
      .replace("{sponsor}", industry.sponsor)
      .replace("{challenge}", industry.challenges[0] ?? "delivery risk")
      .replace("{industry}", industry.industry),
  };
}

const PHASE_DECISIONS: DecisionTpl[] = [
  // ---------------- Initiation ----------------
  {
    key: "init-charter",
    phase: "Initiation",
    ecoDomain: "Process",
    ecoTask: "PR-2.9 Integrate project planning activities",
    pmbokDomain: "Planning",
    title: "Draft the Project Charter for {project}",
    situation:
      "The sponsor **{sponsor}** wants to greenlight {project} at Monday's steering committee. You have the business case, a rough scope, and vocal opinions from three functions. What is your next move as PM?",
    source: "email",
    options: [
      {
        id: "A",
        label: "Publish a draft charter today with high-level objectives, key stakeholders, and known constraints for steering feedback.",
        rationale: "A charter formally authorizes the project and aligns stakeholders on the why before the how. Iterating it visibly builds trust.",
        impact: { trust: 4, risk: 3, budget: 0 },
        quality: "excellent",
        consequence: "Steering committee approves the charter with minor edits. Sponsor visibly aligned.",
        pmiPrinciple: "Stewardship + Stakeholder Engagement — the charter is the PM's mandate.",
      },
      {
        id: "B",
        label: "Skip the charter and jump straight into detailed planning to save time.",
        rationale: "Skipping authorization leaves scope ambiguous and creates political risk downstream.",
        impact: { trust: -8, risk: -10, morale: -3 },
        quality: "poor",
        consequence: "Two directors dispute scope in week 3 with nothing to arbitrate against.",
        pmiPrinciple: "Charter defines authority — do not skip it.",
      },
      {
        id: "C",
        label: "Ask the sponsor to write the charter so you don't misrepresent their intent.",
        rationale: "The PM authors the charter; the sponsor approves. Delegating upward abdicates the role.",
        impact: { trust: -4, morale: -2 },
        quality: "risky",
        consequence: "Sponsor becomes annoyed you are not driving.",
        pmiPrinciple: "The PM owns integration — including the charter.",
      },
    ],
    correctOptionId: "A",
    examTip: "The charter is the ONE artifact that formally authorizes a project. If the exam asks 'what do you do first?', it usually points to the charter or stakeholder register.",
  },
  {
    key: "init-stakeholders",
    phase: "Initiation",
    ecoDomain: "People",
    ecoTask: "P-1.9 Collaborate with stakeholders",
    pmbokDomain: "Stakeholders",
    title: "A powerful stakeholder was left off the register",
    situation:
      "Legal counsel just heard about {project} from a colleague and is furious they weren't consulted. In this {industry} context, they hold veto authority on contracts.",
    source: "email",
    options: [
      {
        id: "A",
        label: "Meet Legal 1:1 today, apologize, add them to the register with High/High classification, and agree an engagement cadence.",
        rationale: "Rebuild trust with a proactive, tailored engagement plan. Stakeholder register is a living document.",
        impact: { trust: 6, risk: 6 },
        quality: "excellent",
        consequence: "Legal becomes a productive gatekeeper for contract clauses.",
        pmiPrinciple: "Engage stakeholders effectively and proactively.",
      },
      {
        id: "B",
        label: "Send a group email introducing Legal to the team — treat it as a communication issue.",
        rationale: "A broadcast doesn't repair trust; Legal wants 1:1 acknowledgment first.",
        impact: { trust: -2 },
        quality: "risky",
        consequence: "Legal escalates to the CFO the following week.",
        pmiPrinciple: "Tailor communication per stakeholder power/interest.",
      },
      {
        id: "C",
        label: "Argue that the sponsor's charter didn't require Legal at this stage.",
        rationale: "Being technically right vs. politically right. Damages relationship for no gain.",
        impact: { trust: -10, risk: -6 },
        quality: "poor",
        consequence: "Legal blocks the first vendor SOW two months later.",
        pmiPrinciple: "Stakeholder analysis is continuous, not one-time.",
      },
    ],
    correctOptionId: "A",
    examTip: "When a new powerful stakeholder appears, ALWAYS update the stakeholder register and adjust engagement — never dismiss.",
  },
  {
    key: "init-approach",
    phase: "Initiation",
    ecoDomain: "Process",
    ecoTask: "PR-2.13 Determine appropriate project methodology",
    pmbokDomain: "Development Approach & Life Cycle",
    title: "Choose the delivery approach",
    situation:
      "For {project}, requirements are {challenge}-heavy and regulator involvement is significant. The team is asking whether we go predictive, agile, or hybrid.",
    source: "meeting",
    options: [
      {
        id: "A",
        label: "Tailor: use predictive governance for regulated gates and iterative delivery for the customer-facing slices.",
        rationale: "PMBOK 7/8 principle: Tailoring. Match approach to context — one size doesn't fit all.",
        impact: { risk: 8, quality: 4, satisfaction: 4 },
        quality: "excellent",
        consequence: "Team energized; regulators satisfied.",
        pmiPrinciple: "Tailor the delivery approach based on context.",
      },
      {
        id: "B",
        label: "Full agile — self-organizing teams, no baselines, embrace change end-to-end.",
        rationale: "Ignores regulator gates and long-lead items that need firm baselines.",
        impact: { risk: -10, quality: -4 },
        quality: "risky",
        consequence: "Auditor flags lack of traceability at first checkpoint.",
        pmiPrinciple: "Tailoring must respect governance constraints.",
      },
      {
        id: "C",
        label: "Full waterfall — freeze scope now, plan every task upfront.",
        rationale: "Ignores customer feedback loops and technical uncertainty.",
        impact: { satisfaction: -6, morale: -4 },
        quality: "risky",
        consequence: "Requirements churn burns 20% of the budget in change requests.",
        pmiPrinciple: "Rigidity kills value in complex domains.",
      },
    ],
    correctOptionId: "A",
    examTip: "When the question mixes 'regulated' + 'evolving requirements', tailoring/hybrid is almost always the answer.",
  },
  // ---------------- Planning ----------------
  {
    key: "plan-risk",
    phase: "Planning",
    ecoDomain: "Process",
    ecoTask: "PR-2.3 Assess and manage risks",
    pmbokDomain: "Uncertainty",
    title: "Build the risk register",
    situation:
      "Your delivery lead argues the team is 'too senior' to need a formal risk register for {project}. The sponsor asks to see one at gate review.",
    source: "document",
    options: [
      {
        id: "A",
        label: "Facilitate a risk workshop with named owners, qualitative + quantitative scoring, and response strategies.",
        rationale: "Living register with owners is PMI-canonical.",
        impact: { risk: 10, trust: 4 },
        quality: "excellent",
        consequence: "Register surfaces two hidden risks worth $12M.",
        pmiPrinciple: "Optimize risk responses to protect value.",
      },
      {
        id: "B",
        label: "Take the top 5 risks from a similar project and paste them in.",
        rationale: "Stale, unowned register = false confidence.",
        impact: { risk: -6 },
        quality: "risky",
        consequence: "Sponsor's first question exposes the shortcut.",
        pmiPrinciple: "Registers must be tailored, not templated.",
      },
      {
        id: "C",
        label: "Skip it — trust the team.",
        rationale: "Abdicates PM responsibility.",
        impact: { risk: -12, trust: -6 },
        quality: "poor",
        consequence: "Regulator asks for the register at audit; you have nothing.",
        pmiPrinciple: "The PM owns risk management.",
      },
    ],
    correctOptionId: "A",
    examTip: "Risk answers almost always involve: (1) identify, (2) qualitative/quantitative, (3) responses with owners, (4) monitor.",
  },
  {
    key: "plan-comms",
    phase: "Planning",
    ecoDomain: "People",
    ecoTask: "P-1.9 Collaborate with stakeholders",
    pmbokDomain: "Stakeholders",
    title: "Design the communication cadence",
    situation:
      "Executives want weekly; the customer wants monthly; the team wants only what's useful. What communication plan do you publish?",
    source: "meeting",
    options: [
      {
        id: "A",
        label: "Tailor per audience: weekly 1-pager to execs, biweekly demo to customer, daily standup for team, monthly steering deck.",
        rationale: "Tailored cadence + format is PMI-canonical.",
        impact: { trust: 6, satisfaction: 4 },
        quality: "excellent",
        consequence: "All audiences feel heard.",
        pmiPrinciple: "Tailor communication per stakeholder analysis.",
      },
      {
        id: "B",
        label: "Send one all-hands weekly email covering everything.",
        rationale: "Broadcast fails everyone — too much for team, too little for execs.",
        impact: { trust: -4 },
        quality: "risky",
        consequence: "Execs complain the email is unreadable.",
        pmiPrinciple: "One-size-fits-all communication is anti-PMI.",
      },
      {
        id: "C",
        label: "Communicate only on demand — no forced cadence.",
        rationale: "Silence breeds anxiety and rumors.",
        impact: { trust: -10, morale: -4 },
        quality: "poor",
        consequence: "Sponsor stops trusting your status by month 2.",
        pmiPrinciple: "Proactive communication is a PM duty.",
      },
    ],
    correctOptionId: "A",
    examTip: "PMI loves 'tailored communication plan' as the correct answer whenever stakeholders differ.",
  },
  {
    key: "plan-schedule",
    phase: "Planning",
    ecoDomain: "Process",
    ecoTask: "PR-2.6 Plan and manage schedule",
    pmbokDomain: "Planning",
    title: "The sponsor wants a 20% faster schedule",
    situation:
      "For {project}, {sponsor} wants delivery 20% sooner to hit a board commitment. Your team's estimates already assume aggressive pace.",
    source: "email",
    options: [
      {
        id: "A",
        label: "Model crashing vs. fast-tracking with cost/risk trade-offs and present a data-backed recommendation.",
        rationale: "Compression techniques must be analyzed, not felt.",
        impact: { schedule: 4, risk: 2, trust: 4 },
        quality: "excellent",
        consequence: "Sponsor accepts a 10% pull-in with added budget for parallel work.",
        pmiPrinciple: "Realistic estimates + analyzed compression.",
      },
      {
        id: "B",
        label: "Tell the team to work weekends until the date is met.",
        rationale: "Sustained overtime destroys morale and quality.",
        impact: { morale: -12, quality: -8, schedule: 2 },
        quality: "poor",
        consequence: "Two senior engineers resign in month 4.",
        pmiPrinciple: "Servant leadership over command-and-control.",
      },
      {
        id: "C",
        label: "Agree to the date to keep the sponsor happy; figure out how later.",
        rationale: "Anchoring bias creates a schedule you cannot deliver.",
        impact: { trust: -8, risk: -8 },
        quality: "poor",
        consequence: "Miss by 3 months; credibility gone.",
        pmiPrinciple: "Never commit without analysis.",
      },
    ],
    correctOptionId: "A",
    examTip: "'Sponsor wants it faster' → analyze crashing/fast-tracking with cost/risk data, then negotiate.",
  },
  // ---------------- Execution ----------------
  {
    key: "exec-scope-creep",
    phase: "Execution",
    ecoDomain: "Process",
    ecoTask: "PR-2.10 Manage project changes",
    pmbokDomain: "Delivery",
    title: "Customer requests a major scope addition",
    situation:
      "The customer just asked to add {challenge} handling mid-execution — 'small change, right?' It would add 8 weeks.",
    source: "email",
    options: [
      {
        id: "A",
        label: "Submit a formal change request through the CCB with impact analysis on cost, schedule, quality, and risk.",
        rationale: "Integrated Change Control is the PMI gold standard.",
        impact: { risk: 4, trust: 4 },
        quality: "excellent",
        consequence: "CCB defers the change to Phase 2, protecting current baseline.",
        pmiPrinciple: "Prevent scope creep through formal change control.",
      },
      {
        id: "B",
        label: "Just do it — customer relationships matter more than paperwork.",
        rationale: "Undocumented changes destroy baselines.",
        impact: { schedule: -12, budget: -10, risk: -6 },
        quality: "poor",
        consequence: "Project misses gate review; sponsor loses confidence.",
        pmiPrinciple: "Gold plating and scope creep are anti-PMI.",
      },
      {
        id: "C",
        label: "Refuse and cite the contract.",
        rationale: "Legally safe but relationship-damaging without a path.",
        impact: { satisfaction: -8, trust: -4 },
        quality: "risky",
        consequence: "Customer escalates and starts vendor-shopping.",
        pmiPrinciple: "Change enablement — say no with a process, not a slap.",
      },
    ],
    correctOptionId: "A",
    examTip: "Scope change → ALWAYS route through Integrated Change Control (CCB). Never accept verbally.",
  },
  {
    key: "exec-vendor",
    phase: "Execution",
    ecoDomain: "Process",
    ecoTask: "PR-2.11 Plan and manage procurement",
    pmbokDomain: "Project Work",
    title: "Vendor missed a critical milestone",
    situation:
      "The vendor for {project} slipped a critical-path milestone by 3 weeks. They cite 'complexity' and want a schedule extension.",
    source: "meeting",
    options: [
      {
        id: "A",
        label: "Trigger contract remedies, request a written recovery plan with dates, and evaluate liquidated damages exposure.",
        rationale: "Use the contract as your governance tool.",
        impact: { risk: 6, trust: 4 },
        quality: "excellent",
        consequence: "Vendor delivers a credible 6-week recovery plan.",
        pmiPrinciple: "Follow contract terms — that is why they exist.",
      },
      {
        id: "B",
        label: "Verbally agree to the extension to keep the relationship warm.",
        rationale: "Undocumented concessions weaken your position.",
        impact: { schedule: -8, trust: -4 },
        quality: "poor",
        consequence: "Vendor slips again in month 5 with no leverage.",
        pmiPrinciple: "Procurement discipline protects the org.",
      },
      {
        id: "C",
        label: "Fire the vendor and re-bid.",
        rationale: "Nuclear option — costs 3-6 months and burns bridges.",
        impact: { schedule: -16, budget: -10 },
        quality: "risky",
        consequence: "Re-bid takes 4 months; project stalls.",
        pmiPrinciple: "Escalation must be proportional.",
      },
    ],
    correctOptionId: "A",
    examTip: "Vendor slip → contract remedies + recovery plan. Termination is last resort.",
  },
  {
    key: "exec-team-conflict",
    phase: "Execution",
    ecoDomain: "People",
    ecoTask: "P-1.1 Manage conflict",
    pmbokDomain: "Team",
    title: "Two team leads are in open conflict",
    situation:
      "Architecture and Delivery leads are in an escalating fight over technical direction. It's affecting the whole team's productivity.",
    source: "event",
    options: [
      {
        id: "A",
        label: "Facilitate a collaborative problem-solving session — surface both viewpoints, agree criteria, decide together.",
        rationale: "PMI's preferred conflict style: collaborate/problem-solve.",
        impact: { morale: 8, quality: 4 },
        quality: "excellent",
        consequence: "Team unblocks; both leads feel heard.",
        pmiPrinciple: "Servant leadership + emotional intelligence.",
      },
      {
        id: "B",
        label: "Pick one side to end the debate quickly.",
        rationale: "'Force' style — fast but morale-destroying.",
        impact: { morale: -8, trust: -2 },
        quality: "risky",
        consequence: "The 'losing' lead disengages.",
        pmiPrinciple: "Force is a last-resort conflict style.",
      },
      {
        id: "C",
        label: "Let them work it out themselves — they're adults.",
        rationale: "Avoidance is anti-PM leadership.",
        impact: { morale: -6, quality: -4 },
        quality: "poor",
        consequence: "Team splits into camps by month 6.",
        pmiPrinciple: "Address impediments proactively.",
      },
    ],
    correctOptionId: "A",
    examTip: "PMI conflict order (best→worst): collaborate → compromise → smooth → force → withdraw.",
  },
  // ---------------- Monitoring ----------------
  {
    key: "mon-evm",
    phase: "Monitoring",
    ecoDomain: "Process",
    ecoTask: "PR-2.5 Plan and manage budget and resources",
    pmbokDomain: "Measurement",
    title: "EVM shows CPI 0.85, SPI 0.92",
    situation:
      "Earned Value on {project} at midpoint: CPI 0.85 (15% over-budget on work done), SPI 0.92. Trend is worsening.",
    source: "document",
    options: [
      {
        id: "A",
        label: "Do variance & trend analysis, propose corrective actions (rebaseline through change control if needed), report to sponsor.",
        rationale: "EVM is a diagnostic, not just a scoreboard.",
        impact: { budget: 4, trust: 6 },
        quality: "excellent",
        consequence: "Sponsor approves scope-trim change request.",
        pmiPrinciple: "Data-driven decisions protect value.",
      },
      {
        id: "B",
        label: "Hide the numbers until you can 'fix' them.",
        rationale: "Suppressing bad news is a career-ending PM move.",
        impact: { trust: -14, risk: -8 },
        quality: "poor",
        consequence: "Auditor uncovers it in month 8; you're removed.",
        pmiPrinciple: "Stewardship = honesty.",
      },
      {
        id: "C",
        label: "Ask the team to work harder to catch up.",
        rationale: "Doesn't address root cause.",
        impact: { morale: -6, budget: -2 },
        quality: "risky",
        consequence: "Team burns out; numbers get worse.",
        pmiPrinciple: "Root-cause the trend, don't push the team.",
      },
    ],
    correctOptionId: "A",
    examTip: "EVM answers: analyze variance, identify root cause, corrective action, then update baseline via change control.",
  },
  {
    key: "mon-quality",
    phase: "Monitoring",
    ecoDomain: "Process",
    ecoTask: "PR-2.7 Plan and manage quality of products/deliverables",
    pmbokDomain: "Delivery",
    title: "Defect trend is spiking",
    situation:
      "QA reports defect escape rate has tripled in the last two iterations of {project}. Cause unclear.",
    source: "document",
    options: [
      {
        id: "A",
        label: "Root-cause the trend (Ishikawa/5 Whys), fix the process, disclose to customer with a remediation plan.",
        rationale: "Prevention over inspection; disclose defects.",
        impact: { quality: 10, trust: 4 },
        quality: "excellent",
        consequence: "Defect rate drops 60% next iteration.",
        pmiPrinciple: "Build quality into processes.",
      },
      {
        id: "B",
        label: "Increase testing — throw more QA at the problem.",
        rationale: "Inspection > prevention is anti-PMI.",
        impact: { budget: -6, quality: 2 },
        quality: "risky",
        consequence: "Defects continue; budget bleeds.",
        pmiPrinciple: "Prevention beats inspection.",
      },
      {
        id: "C",
        label: "Ship as-is; customer will report critical defects.",
        rationale: "Damages trust and possibly compliance.",
        impact: { quality: -12, trust: -10 },
        quality: "poor",
        consequence: "Customer files a formal quality complaint.",
        pmiPrinciple: "Quality is non-negotiable.",
      },
    ],
    correctOptionId: "A",
    examTip: "Quality question → prevention, root cause, disclose. Never hide defects.",
  },
  // ---------------- Closing ----------------
  {
    key: "close-lessons",
    phase: "Closing",
    ecoDomain: "Process",
    ecoTask: "PR-2.17 Plan and manage project/phase closure",
    pmbokDomain: "Project Work",
    title: "Close the project properly",
    situation:
      "{project} has met its objectives. Sponsor wants to move on to the next initiative and asks you to 'wrap it up quickly'.",
    source: "meeting",
    options: [
      {
        id: "A",
        label: "Run formal acceptance, lessons learned, benefits review, and release resources with knowledge transfer.",
        rationale: "Closing is a discipline. Skipping it destroys OPA value.",
        impact: { trust: 6, quality: 4 },
        quality: "excellent",
        consequence: "Lessons captured; next PM starts from a better place.",
        pmiPrinciple: "Enable change to achieve the envisioned future state.",
      },
      {
        id: "B",
        label: "Send a 'we're done' email and disband the team.",
        rationale: "Skips acceptance, lessons, and benefits review.",
        impact: { quality: -6, trust: -4 },
        quality: "poor",
        consequence: "Next similar project repeats the same mistakes.",
        pmiPrinciple: "Ensure knowledge transfer for project continuity.",
      },
      {
        id: "C",
        label: "Have the team fill out a form; skip the workshop.",
        rationale: "Superficial lessons; misses the value.",
        impact: { quality: -2 },
        quality: "risky",
        consequence: "Sponsor asks 'what did we actually learn?' and you have nothing.",
        pmiPrinciple: "Learning is a facilitated act, not a form.",
      },
    ],
    correctOptionId: "A",
    examTip: "Closing MUST include: acceptance, lessons learned, benefits review, resource release.",
  },
];

export function generateDecisions(industry: IndustryCaseRef): Decision[] {
  return PHASE_DECISIONS.map((tpl) => d(tpl, industry));
}

// -------- Emails --------
export function generateEmails(industry: IndustryCaseRef, decisions: Decision[]): Email[] {
  const now = Date.now();
  const emailDecisions = decisions.filter((d) => d.source === "email");
  return emailDecisions.map((dec, i) => ({
    id: `${industry.id}-email-${i}`,
    from: i % 2 === 0 ? "sponsor" : "customer",
    subject: dec.title,
    preview: dec.situation.slice(0, 100).replace(/\*\*/g, "") + "…",
    body: dec.situation,
    receivedAt: new Date(now - (emailDecisions.length - i) * 3600_000).toISOString(),
    read: false,
    unlocksDecisionId: dec.id,
  }));
}

// -------- Meetings --------
export function generateMeetings(industry: IndustryCaseRef, decisions: Decision[]): Meeting[] {
  const now = Date.now();
  const meets = decisions.filter((d) => d.source === "meeting");
  return meets.map((dec, i) => ({
    id: `${industry.id}-mtg-${i}`,
    title: dec.title,
    time: new Date(now + i * 86_400_000).toISOString(),
    attendees: ["sponsor", "customer", "team-lead", "risk-officer"],
    agenda: [dec.title, "Discussion", "Decision", "Actions"],
    transcript: `**Agenda:** ${dec.title}\n\n${dec.situation}\n\n> The room turns to you for a decision.`,
    unlocksDecisionId: dec.id,
  }));
}

// -------- Documents --------
export function generateDocuments(industry: IndustryCaseRef): SimDocument[] {
  const now = new Date().toISOString();
  return [
    {
      id: `${industry.id}-doc-bc`,
      title: `${industry.projectName} — Business Case`,
      kind: "Business Case",
      updatedAt: now,
      markdown: `# ${industry.projectName}\n\n**Industry:** ${industry.industry}  \n**Sponsor:** ${industry.sponsor}  \n**Budget:** ${industry.budget}  \n**Duration:** ${industry.duration}\n\n## Executive Summary\n\n${industry.body}\n\n## Top Challenges\n\n${industry.challenges.map((c) => `- ${c}`).join("\n")}\n\n## Strategic Alignment\n\nThis initiative directly supports the enterprise ${industry.industry.toLowerCase()} strategy and is expected to unlock measurable business value within the funded window.`,
    },
    {
      id: `${industry.id}-doc-charter`,
      title: `${industry.projectName} — Project Charter (Draft)`,
      kind: "Charter",
      updatedAt: now,
      markdown: `# Project Charter — DRAFT\n\n**Project:** ${industry.projectName}  \n**Sponsor:** ${industry.sponsor}  \n**PM:** You\n\n## Purpose\nAuthorize ${industry.projectName} and provide the PM with authority to apply organizational resources.\n\n## High-Level Objectives\n- Deliver within ${industry.budget} and ${industry.duration}\n- Mitigate: ${industry.challenges.join(", ")}\n- Achieve customer acceptance and measurable business value\n\n## Key Stakeholders\nExecutive Sponsor · Primary Customer · Vendor PM · Delivery Lead · Risk & Compliance\n\n## Assumptions & Constraints\nAssumes funding is committed and regulatory pathway is understood. Constraints: ${industry.challenges[0]}.\n\n## Approval\nAwaiting sponsor signature.`,
    },
    {
      id: `${industry.id}-doc-risk`,
      title: `${industry.projectName} — Risk Register (v0.1)`,
      kind: "Risk Register",
      updatedAt: now,
      markdown: `# Risk Register\n\n| # | Risk | Prob | Impact | Owner | Response |\n|---|---|---|---|---|---|\n| R1 | ${industry.challenges[0]} | H | H | PM | Mitigate |\n| R2 | ${industry.challenges[1] ?? "Vendor performance"} | M | H | Vendor PM | Transfer |\n| R3 | ${industry.challenges[2] ?? "Stakeholder alignment"} | M | M | Sponsor | Accept |\n\nThis register is a living document and should be reviewed at every gate.`,
    },
    {
      id: `${industry.id}-doc-raid`,
      title: `RAID Log — ${industry.projectName}`,
      kind: "RAID",
      updatedAt: now,
      markdown: `# RAID Log\n\n## Risks\nSee Risk Register.\n\n## Assumptions\n- Funding fully committed\n- Regulator engaged early\n\n## Issues\nNone open.\n\n## Dependencies\n- Long-lead procurement per ${industry.challenges[0]}`,
    },
    {
      id: `${industry.id}-doc-status`,
      title: `Weekly Status — ${industry.projectName}`,
      kind: "Status Report",
      updatedAt: now,
      markdown: `# Weekly Status — Week 1\n\n**Overall:** 🟢 Green  \n**Budget:** On plan  \n**Schedule:** On plan  \n**Risks:** 3 open\n\n## Accomplishments\n- Charter drafted\n- Stakeholder register initialized\n- Kickoff scheduled\n\n## Next week\n- Complete risk workshop\n- Finalize communication plan\n- Baseline schedule`,
    },
    {
      id: `${industry.id}-doc-stakes`,
      title: `Stakeholder Register — ${industry.projectName}`,
      kind: "Stakeholder Register",
      updatedAt: now,
      markdown: `# Stakeholder Register\n\n| Name | Role | Power | Interest | Strategy |\n|---|---|---|---|---|\n| Elena Voss | Executive Sponsor | H | H | Manage Closely |\n| Marcus Reid | Primary Customer | M | H | Keep Informed |\n| Priya Anand | Vendor PM | M | M | Keep Satisfied |\n| Jordan Blake | Delivery Lead | L | H | Keep Informed |\n| Amina Osei | Risk & Compliance | H | M | Keep Satisfied |`,
    },
  ];
}
