// Workplace narrative artifacts for scenarios. Data-driven so a scenario
// can be presented as emails, meetings, docs, and cards instead of plain text.

import type { PhaseId, Scenario } from "./types";

export type ArtifactKind =
  | "email"
  | "meeting"
  | "document"
  | "risk-register"
  | "change-request"
  | "stakeholder-card"
  | "vendor-card";

export interface EmailArtifact {
  kind: "email";
  from: { name: string; role: string; email: string };
  to: string;
  subject: string;
  time: string;
  body: string;
  priority?: "normal" | "urgent";
}
export interface MeetingArtifact {
  kind: "meeting";
  title: string;
  organizer: string;
  when: string;
  where: string;
  attendees: string[];
  agenda: string[];
}
export interface DocumentArtifact {
  kind: "document";
  title: string;
  docType: "Charter" | "Business Case" | "Scope Statement" | "Status Report" | "Plan" | "Contract" | "Memo";
  author: string;
  date: string;
  sections: { heading: string; body: string }[];
}
export interface RiskRegisterArtifact {
  kind: "risk-register";
  rows: {
    id: string;
    risk: string;
    prob: "L" | "M" | "H";
    impact: "L" | "M" | "H";
    response: string;
    owner: string;
  }[];
}
export interface ChangeRequestArtifact {
  kind: "change-request";
  crId: string;
  requester: string;
  submitted: string;
  summary: string;
  reason: string;
  impact: { scope: string; schedule: string; cost: string; risk: string };
  status: "Draft" | "Under Review" | "Pending CCB";
}
export interface StakeholderCardArtifact {
  kind: "stakeholder-card";
  people: {
    name: string;
    role: string;
    influence: "Low" | "Medium" | "High";
    interest: "Low" | "Medium" | "High";
    stance: "Champion" | "Supporter" | "Neutral" | "Critic";
    avatar: string; // initials
  }[];
}
export interface VendorCardArtifact {
  kind: "vendor-card";
  vendors: {
    name: string;
    scope: string;
    contract: string;
    performance: "Excellent" | "On Track" | "At Risk" | "Underperforming";
    slaNotes: string;
  }[];
}

export type NarrativeArtifact =
  | EmailArtifact
  | MeetingArtifact
  | DocumentArtifact
  | RiskRegisterArtifact
  | ChangeRequestArtifact
  | StakeholderCardArtifact
  | VendorCardArtifact;

export interface ScenarioNarrative {
  hero: { emoji: string; tone: string; heroTitle: string; subline: string };
  intro: string; // 1-2 sentence workplace framing
  artifacts: NarrativeArtifact[];
}

// ---------- Hand-crafted narratives for key scenarios ----------

const NARRATIVES: Record<string, ScenarioNarrative> = {
  "biz-case": {
    hero: {
      emoji: "📊",
      tone: "from-primary/30 to-primary/5",
      heroTitle: "Project: Atlas — Customer Portal Replacement",
      subline: "Executive review · $2.4M · 9 months",
    },
    intro:
      "Monday, 8:47 AM. You just walked into the office and your inbox is already loaded. The exec sponsor wants a recommendation by end of day.",
    artifacts: [
      {
        kind: "email",
        from: { name: "Diana Reyes", role: "VP Product / Sponsor", email: "d.reyes@northwind.co" },
        to: "You",
        subject: "Project Atlas — need your recommendation today",
        time: "Today, 07:52",
        priority: "urgent",
        body: "I need your go/no-go recommendation for the customer-portal replacement by 5pm. Board reviews tomorrow. Business case attached — NPV looks solid, but market's shifting. I trust your judgment. — Diana",
      },
      {
        kind: "document",
        title: "Atlas — Business Case v0.9",
        docType: "Business Case",
        author: "Strategy Office",
        date: "Draft — this week",
        sections: [
          { heading: "Strategic Alignment", body: "Retire legacy portal (2011). Supports 3-yr digital strategy pillar #2 (customer self-service)." },
          { heading: "Financials", body: "Cost: $2.4M over 9 months. NPV: $6M over 3 years. IRR ~28%. Payback ~14 months." },
          { heading: "Assumptions", body: "Migration rate 60% Y1, 90% Y2. Support cost -35%. Assumes stable market conditions." },
          { heading: "Risks (top 3)", body: "Market shift may erode adoption. Legacy data quality unknown. Vendor market consolidating." },
        ],
      },
    ],
  },

  "init-2": {
    hero: {
      emoji: "🤝",
      tone: "from-emerald-500/25 to-primary/10",
      heroTitle: "Stakeholder Identification Sprint",
      subline: "48 hours to kickoff · 27 names, no analysis",
    },
    intro:
      "The charter is signed. Kickoff is Wednesday. You have a raw list of names and titles from HR and PMO — but no analysis, no engagement plan.",
    artifacts: [
      {
        kind: "stakeholder-card",
        people: [
          { name: "Diana Reyes", role: "VP Product (Sponsor)", influence: "High", interest: "High", stance: "Champion", avatar: "DR" },
          { name: "Marcus Chen", role: "Head of Engineering", influence: "High", interest: "Medium", stance: "Neutral", avatar: "MC" },
          { name: "Priya Anand", role: "Customer Success Lead", influence: "Medium", interest: "High", stance: "Supporter", avatar: "PA" },
          { name: "Rob Weller", role: "CFO's delegate", influence: "High", interest: "Low", stance: "Critic", avatar: "RW" },
        ],
      },
      {
        kind: "meeting",
        title: "Kickoff — Project Atlas",
        organizer: "You",
        when: "Wed 10:00 – 11:00",
        where: "Boardroom 3 / Teams",
        attendees: ["Sponsor", "PMO Chair", "Eng Lead", "CS Lead", "Vendor CSM"],
        agenda: [
          "Charter walkthrough",
          "Stakeholder power/interest review",
          "Comms cadence + escalation path",
          "Next 2 weeks",
        ],
      },
    ],
  },

  "plan-1": {
    hero: {
      emoji: "🗓️",
      tone: "from-amber-500/25 to-rose-500/10",
      heroTitle: "Schedule vs. Reality",
      subline: "Sponsor date immovable · team estimates +20% effort",
    },
    intro:
      "Your team just finished bottom-up estimating and the number came in 20% over the sponsor's target date. The tech lead is watching you to see what you do next.",
    artifacts: [
      {
        kind: "email",
        from: { name: "Marcus Chen", role: "Tech Lead", email: "m.chen@northwind.co" },
        to: "You",
        subject: "Estimates back — we're over the date",
        time: "Yesterday, 18:41",
        body: "Team ran bottom-up on the plan. We're ~20% over Diana's target. Team is asking me if we're going to be honest about it. Your call. — M",
      },
      {
        kind: "document",
        title: "Schedule Baseline — Draft",
        docType: "Plan",
        author: "You + Tech Lead",
        date: "Planning",
        sections: [
          { heading: "Committed date", body: "Sponsor target: Nov 30. Team estimate: Dec 24 (~20% variance)." },
          { heading: "Reserve analysis", body: "No management reserve currently allocated." },
          { heading: "Options", body: "Reduce scope · Add resources (crash) · Fast-track (parallelize) · Rebaseline." },
        ],
      },
    ],
  },

  "mon-1": {
    hero: {
      emoji: "📉",
      tone: "from-rose-500/25 to-amber-500/10",
      heroTitle: "Mid-Project Health Check",
      subline: "CPI 0.88 · SPI 0.92 · Steering meeting Thursday",
    },
    intro:
      "The EVM report just dropped. You're under on cost performance and behind on schedule. The steering deck template is open on your other monitor.",
    artifacts: [
      {
        kind: "document",
        title: "EVM Dashboard — Week 18",
        docType: "Status Report",
        author: "PMO Analyst",
        date: "This morning",
        sections: [
          { heading: "Cost Performance Index (CPI)", body: "0.88 — spending 12¢ more per $1 of earned value than planned." },
          { heading: "Schedule Performance Index (SPI)", body: "0.92 — earning 8¢ less per $1 planned per period." },
          { heading: "Variance drivers", body: "Vendor rework on ingestion module; QA cycle longer than baseline." },
          { heading: "Forecast (EAC)", body: "$2.72M vs BAC $2.4M — projected +$320K overrun without corrective action." },
        ],
      },
      {
        kind: "email",
        from: { name: "Diana Reyes", role: "Sponsor", email: "d.reyes@northwind.co" },
        to: "You",
        subject: "Status for Thursday steering",
        time: "Today, 09:12",
        body: "Give me the honest number for Thursday. If we're off, I need to know AND I need a plan. — D",
      },
    ],
  },

  "mon-2": {
    hero: {
      emoji: "📝",
      tone: "from-primary/30 to-amber-500/10",
      heroTitle: "Incoming Change Request",
      subline: "Senior stakeholder · 'small' UI change",
    },
    intro:
      "Rob from Finance just emailed. He wants a 'small' UI tweak. You know it touches the core data flow — this is not small.",
    artifacts: [
      {
        kind: "email",
        from: { name: "Rob Weller", role: "CFO's delegate", email: "r.weller@northwind.co" },
        to: "You",
        subject: "Quick UI change on the reconciliation screen",
        time: "Today, 11:04",
        priority: "urgent",
        body: "Small tweak — need the reconciliation screen to also show FX rate at time of posting. Should be quick, right? Finance really needs this before quarter-end. — Rob",
      },
      {
        kind: "change-request",
        crId: "CR-0042",
        requester: "R. Weller (Finance)",
        submitted: "Today",
        summary: "Add historical FX rate column to reconciliation screen",
        reason: "Quarter-end reporting needs point-in-time FX for audit trail",
        impact: {
          scope: "Touches transaction store + posting service (not just UI)",
          schedule: "~2 sprint-weeks if data migration required",
          cost: "TBD — dependent on data availability",
          risk: "Medium — historical FX may not be captured at posting time",
        },
        status: "Draft",
      },
    ],
  },

  "mon-3": {
    hero: {
      emoji: "🛡️",
      tone: "from-primary/25 to-rose-500/10",
      heroTitle: "Risk Register — Overdue Review",
      subline: "Last updated 4 weeks ago · 2 new risks in retros",
    },
    intro:
      "You open the risk register. It hasn't been touched in a month. Two risks came up in retros but never made it in. The team is going to notice.",
    artifacts: [
      {
        kind: "risk-register",
        rows: [
          { id: "R-01", risk: "Legacy data quality unknown", prob: "H", impact: "H", response: "Discovery spike sprint 3", owner: "Marcus" },
          { id: "R-02", risk: "Vendor delivery slip", prob: "M", impact: "H", response: "Weekly SLA review", owner: "You" },
          { id: "R-03", risk: "Key engineer resignation risk", prob: "M", impact: "H", response: "Cross-train + docs", owner: "Marcus" },
          { id: "R-04", risk: "(unlogged) SSO integration scope", prob: "M", impact: "M", response: "—", owner: "—" },
          { id: "R-05", risk: "(unlogged) Regulatory change Q4", prob: "L", impact: "H", response: "—", owner: "—" },
        ],
      },
    ],
  },

  "ev-vendor": {
    hero: {
      emoji: "🏗️",
      tone: "from-amber-500/30 to-rose-500/15",
      heroTitle: "Vendor Slip — 3 Weeks",
      subline: "Critical path · late-delivery clause available",
    },
    intro:
      "The vendor CSM just called. Their ingestion module is slipping three weeks. It's on your critical path. The contract has a late-delivery clause.",
    artifacts: [
      {
        kind: "email",
        from: { name: "Sofia Bianchi", role: "Vendor CSM (Ingenix)", email: "s.bianchi@ingenix.io" },
        to: "You",
        subject: "Heads up — ingestion module slip",
        time: "Today, 14:20",
        priority: "urgent",
        body: "Wanted to give you a direct heads-up: we're slipping ~3 weeks on the ingestion module. Happy to jump on a call to discuss options — but we're firm on the new date. — Sofia",
      },
      {
        kind: "vendor-card",
        vendors: [
          {
            name: "Ingenix",
            scope: "Data ingestion + transformation module",
            contract: "Fixed-price, milestone-based · late-delivery clause 5%/wk",
            performance: "At Risk",
            slaNotes: "Slipped 2 minor milestones. Now slipping a major (critical path).",
          },
        ],
      },
    ],
  },
};

// ---------- Fallback synthesizer ----------

const PHASE_TONE: Record<PhaseId, string> = {
  initiation: "from-primary/25 to-primary/5",
  planning: "from-emerald-500/20 to-primary/10",
  execution: "from-amber-500/20 to-primary/10",
  monitoring: "from-rose-500/20 to-amber-500/10",
  closing: "from-primary/25 to-emerald-500/10",
};

const PHASE_EMOJI: Record<PhaseId, string> = {
  initiation: "🚀",
  planning: "🗂️",
  execution: "⚙️",
  monitoring: "📈",
  closing: "🏁",
};

function synthesizeFallback(scenario: Scenario): ScenarioNarrative {
  const body = scenario.body;
  const artifacts: NarrativeArtifact[] = [];

  // Simple heuristics from scenario text.
  if (/email|sends|writes/i.test(body)) {
    artifacts.push({
      kind: "email",
      from: { name: "Diana Reyes", role: "Project Sponsor", email: "sponsor@northwind.co" },
      to: "You",
      subject: scenario.title,
      time: "Today",
      body,
    });
  } else if (/meeting|standup|steering|kickoff|workshop|review session/i.test(body)) {
    artifacts.push({
      kind: "meeting",
      title: scenario.title,
      organizer: "You",
      when: "This week",
      where: "Teams / Boardroom",
      attendees: ["Sponsor", "Tech Lead", "PMO", "Vendor CSM"],
      agenda: [scenario.title, "Discussion", "Decisions & owners"],
    });
  } else if (/risk|register/i.test(body)) {
    artifacts.push({
      kind: "risk-register",
      rows: [
        { id: "R-01", risk: "Emerging risk from this scenario", prob: "M", impact: "H", response: "TBD", owner: "You" },
      ],
    });
  } else if (/change|scope change|CR/i.test(body)) {
    artifacts.push({
      kind: "change-request",
      crId: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
      requester: "Stakeholder",
      submitted: "Today",
      summary: scenario.title,
      reason: body.slice(0, 140),
      impact: { scope: "TBD", schedule: "TBD", cost: "TBD", risk: "TBD" },
      status: "Draft",
    });
  } else if (/vendor|contract|procurement/i.test(body)) {
    artifacts.push({
      kind: "vendor-card",
      vendors: [
        { name: "Ingenix", scope: "Contracted deliverable", contract: "Fixed-price", performance: "On Track", slaNotes: "See scenario" },
      ],
    });
  } else if (/stakeholder|sponsor|client/i.test(body)) {
    artifacts.push({
      kind: "stakeholder-card",
      people: [
        { name: "Diana Reyes", role: "Sponsor", influence: "High", interest: "High", stance: "Champion", avatar: "DR" },
        { name: "Rob Weller", role: "Finance", influence: "High", interest: "Low", stance: "Critic", avatar: "RW" },
      ],
    });
  } else {
    artifacts.push({
      kind: "document",
      title: scenario.title,
      docType: "Memo",
      author: "PMO",
      date: "This week",
      sections: [{ heading: "Situation", body }],
    });
  }

  return {
    hero: {
      emoji: PHASE_EMOJI[scenario.phase],
      tone: PHASE_TONE[scenario.phase],
      heroTitle: scenario.title,
      subline: scenario.kind === "event" ? "Unplanned event — respond now" : "Live decision",
    },
    intro: body,
    artifacts,
  };
}

export function getScenarioNarrative(scenario: Scenario): ScenarioNarrative {
  return NARRATIVES[scenario.id] ?? synthesizeFallback(scenario);
}
