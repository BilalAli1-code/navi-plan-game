// Customer Self-Service Portal — case-specific content pack.
// Extends the base generator with day/phase-mapped decisions, emails, meetings,
// documents, and an expanded stakeholder cast. Architecture is unchanged;
// this pack is merged in by the generator when caseId === "software".

import type {
  Decision,
  Email,
  Meeting,
  SimDocument,
  Stakeholder,
} from "../types";

export const CUSTOMER_PORTAL_CASE_ID = "software";

// ---------- Stakeholders (extended cast) ----------
export const customerPortalStakeholders: Stakeholder[] = [
  {
    id: "sponsor",
    name: "Elena Voss",
    role: "Executive Sponsor · VP Customer Experience",
    personality:
      "Decisive, ROI-focused. Owns CSAT and support-cost KPIs. Wants a one-page executive summary each week and clear go/no-go recommendations.",
    priorities: ["+15 CSAT lift", "25% support cost reduction", "Zero-drama go-live"],
    avatarInitial: "E",
    color: "bg-indigo-500",
  },
  {
    id: "product-owner",
    name: "Nadia Rahim",
    role: "Product Owner",
    personality:
      "Customer-obsessed, ruthless prioritizer. Runs the backlog, protects MVP scope, negotiates trade-offs with executives daily.",
    priorities: ["Clear MVP", "Backlog health", "Value per sprint"],
    avatarInitial: "N",
    color: "bg-fuchsia-500",
  },
  {
    id: "cs-director",
    name: "Derek Malone",
    role: "Customer Service Director",
    personality:
      "Ex-support agent turned director. Cares about ticket deflection, agent workflow, and the reality of angry customers on hold.",
    priorities: ["Ticket deflection", "Agent adoption", "Real customer voice"],
    avatarInitial: "D",
    color: "bg-emerald-500",
  },
  {
    id: "it-manager",
    name: "Yuki Tanaka",
    role: "IT Manager",
    personality:
      "Pragmatic infrastructure lead. Worries about SSO, uptime, change windows, and being paged at 3am.",
    priorities: ["SSO/IdP integration", "SLAs & uptime", "Safe change windows"],
    avatarInitial: "Y",
    color: "bg-cyan-500",
  },
  {
    id: "architect",
    name: "Rafael Costa",
    role: "Solution Architect",
    personality:
      "Systems thinker. Draws diagrams before opinions. Pushes back on shortcuts that create technical debt.",
    priorities: ["Clean integrations", "Scalability", "Long-term maintainability"],
    avatarInitial: "R",
    color: "bg-violet-500",
  },
  {
    id: "ux",
    name: "Sara Lindqvist",
    role: "UX Designer",
    personality:
      "Evidence-driven. Runs user research, measures task success, defends accessibility. Kind but firm.",
    priorities: ["Task success rate", "Accessibility (WCAG 2.2)", "Design consistency"],
    avatarInitial: "S",
    color: "bg-pink-500",
  },
  {
    id: "team-lead",
    name: "Jordan Blake",
    role: "Dev Team Lead",
    personality:
      "Servant leader. Protects team focus, honest about capacity, hates surprise scope.",
    priorities: ["Team focus", "Sustainable pace", "Engineering quality"],
    avatarInitial: "J",
    color: "bg-sky-500",
  },
  {
    id: "qa-lead",
    name: "Priya Anand",
    role: "QA Lead",
    personality:
      "Detail-obsessed. Runs UAT with real customers, publishes defect trends daily during test phases.",
    priorities: ["Defect containment", "UAT quality", "Test coverage"],
    avatarInitial: "P",
    color: "bg-amber-500",
  },
  {
    id: "infra",
    name: "Marcus Reid",
    role: "Infrastructure Manager",
    personality:
      "Calm under pressure. Owns cutover runbooks, DR, monitoring. Says no when the change window is too tight.",
    priorities: ["Deployment safety", "Monitoring/DR", "Rollback plan"],
    avatarInitial: "M",
    color: "bg-teal-500",
  },
  {
    id: "risk-officer",
    name: "Dr. Amina Osei",
    role: "Security & Compliance Officer",
    personality:
      "Meticulous. Quotes GDPR/CCPA verbatim. Wants a living register with owners and mitigation dates.",
    priorities: ["Data protection", "AuthN/AuthZ", "Auditability"],
    avatarInitial: "A",
    color: "bg-rose-500",
  },
  {
    id: "finance",
    name: "Hannah Weber",
    role: "Finance Manager",
    personality:
      "Numbers-first. Tracks CapEx vs. OpEx, wants monthly variance with narrative, allergic to surprise overruns.",
    priorities: ["Budget discipline", "Benefits realization", "Vendor invoicing"],
    avatarInitial: "H",
    color: "bg-lime-500",
  },
  {
    id: "procurement",
    name: "Luis Ortega",
    role: "Procurement Lead",
    personality:
      "Contract-focused. Negotiates SOWs, MSAs, DPA addendums. Insists on measurable acceptance criteria.",
    priorities: ["Contract clarity", "SLA teeth", "Change-order discipline"],
    avatarInitial: "L",
    color: "bg-orange-500",
  },
  {
    id: "vendor",
    name: "Aiko Mori",
    role: "External Vendor PM",
    personality:
      "Delivery-oriented but protects margin. Escalates change requests aggressively when scope drifts.",
    priorities: ["Contract scope", "Milestones", "Change orders"],
    avatarInitial: "A",
    color: "bg-yellow-500",
  },
  {
    id: "customer",
    name: "Grace Okafor",
    role: "Pilot Customer (Voice of Customer)",
    personality:
      "Represents 12 pilot customers. Direct, articulate, allergic to jargon. Wants working software over promises.",
    priorities: ["Ease of use", "Reliability", "Meaningful notifications"],
    avatarInitial: "G",
    color: "bg-emerald-600",
  },
];

// ---------- Decisions (added per phase; brand-specific to the portal) ----------
// Every decision uses PMBOK 6/7/8 vocabulary and reinforces principles.
export const customerPortalDecisions: Decision[] = [
  // ================== Day 2 · INITIATION ==================
  {
    id: "cp-init-benefits",
    phase: "Initiation",
    ecoDomain: "Business Environment",
    ecoTask: "BE-3.1 Plan and manage project compliance and business benefits",
    pmbokDomain: "Business Analysis · Benefits Realization",
    title: "Define benefits realization for the portal",
    situation:
      "Elena, your sponsor, wants to see how you'll prove the portal actually reduces support cost and lifts CSAT — not just that it ships. She asks: 'How will we know this worked, 12 months after go-live?'",
    source: "meeting",
    options: [
      {
        id: "A",
        label:
          "Draft a Benefits Realization Plan with baseline CSAT, current cost-per-ticket, target deflection rate, and quarterly measurement owners.",
        rationale:
          "PMBOK 7 · Value Delivery principle: outcomes over outputs. Benefits without owners and baselines cannot be proven.",
        impact: { trust: 6, satisfaction: 4, risk: 2 },
        quality: "excellent",
        consequence: "Elena signs the charter with the Benefits Realization Plan attached.",
        pmiPrinciple: "Focus on value; measure outcomes not outputs.",
      },
      {
        id: "B",
        label: "Promise a case study 12 months after go-live and move on.",
        rationale: "No baseline means no proof. Value goes unmeasured.",
        impact: { trust: -4, satisfaction: -2 },
        quality: "risky",
        consequence: "Finance quietly de-prioritizes the project's benefits case.",
        pmiPrinciple: "Value delivery must be measurable.",
      },
      {
        id: "C",
        label: "Argue benefits are the sponsor's job, not the PM's.",
        rationale: "Modern PM owns outcomes end-to-end.",
        impact: { trust: -8 },
        quality: "poor",
        consequence: "Elena starts questioning your fit for the role.",
        pmiPrinciple: "Stewardship — the PM co-owns benefits.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Benefits Realization = baseline + target + owner + measurement cadence. If any are missing, the answer is wrong.",
  },
  {
    id: "cp-init-stakeholder-map",
    phase: "Initiation",
    ecoDomain: "People",
    ecoTask: "P-1.9 Collaborate with stakeholders",
    pmbokDomain: "Stakeholders",
    title: "Build the initial stakeholder register",
    situation:
      "The portal touches Support, IT, Security, Finance, Procurement, an external vendor, and pilot customers. Nadia (Product Owner) suggests you 'skip the register and just chat with people as needed.'",
    source: "email",
    options: [
      {
        id: "A",
        label:
          "Run a stakeholder analysis workshop: power/interest grid, engagement level, and tailored communication cadence per group.",
        rationale: "PMI-canonical. Tailored engagement beats broadcast.",
        impact: { trust: 6, risk: 4 },
        quality: "excellent",
        consequence: "Register surfaces two silent blockers (Security, Procurement).",
        pmiPrinciple: "Engage stakeholders effectively and proactively.",
      },
      {
        id: "B",
        label: "Copy last project's register and edit names.",
        rationale: "Stale register hides real influence patterns.",
        impact: { risk: -4 },
        quality: "risky",
        consequence: "You miss Finance's monthly variance requirement.",
        pmiPrinciple: "Registers must be tailored, not templated.",
      },
      {
        id: "C",
        label: "Skip it — 'agile teams don't need registers.'",
        rationale: "Agile still requires stakeholder engagement.",
        impact: { trust: -6, risk: -6 },
        quality: "poor",
        consequence: "Security escalates two weeks later; project loses a sprint.",
        pmiPrinciple: "Stakeholder analysis is continuous.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Whenever the exam presents 'many groups, competing needs' → tailored engagement plan is almost always the answer.",
  },

  // ================== Day 3 · PLANNING ==================
  {
    id: "cp-plan-mvp",
    phase: "Planning",
    ecoDomain: "Process",
    ecoTask: "PR-2.1 Execute project with the urgency required to deliver business value",
    pmbokDomain: "Planning · Product Backlog",
    title: "Slice the MVP",
    situation:
      "Nadia wants MVP = accounts + tickets + invoices. Derek (CS Director) demands live chat in MVP. Elena wants notifications for exec dashboards. Vendor says 'all three or nothing — same contract.'",
    source: "meeting",
    options: [
      {
        id: "A",
        label:
          "Facilitate an MVP workshop using MoSCoW + value/effort mapping; publish a decision log with rationale and a Phase-2 backlog for excluded items.",
        rationale: "Transparent trade-offs beat political trade-offs.",
        impact: { satisfaction: 4, quality: 4, trust: 4 },
        quality: "excellent",
        consequence: "Live chat moves to Phase 2 with committed date; nobody leaves angry.",
        pmiPrinciple: "Tailor delivery to value; make trade-offs visible.",
      },
      {
        id: "B",
        label: "Include everything to keep peace and add a buffer to the schedule.",
        rationale: "Buffer never survives contact with reality.",
        impact: { schedule: -8, quality: -4, budget: -4 },
        quality: "poor",
        consequence: "MVP slips 6 weeks; sponsor loses confidence.",
        pmiPrinciple: "Scope inflation destroys value velocity.",
      },
      {
        id: "C",
        label: "Let Elena decide unilaterally to end the argument.",
        rationale: "Bypasses Product Owner authority and disempowers the team.",
        impact: { morale: -6, trust: -2 },
        quality: "risky",
        consequence: "Nadia stops bringing hard trade-offs to you.",
        pmiPrinciple: "Empower Product Owner; escalate framed, not raw.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "MVP conflicts → facilitate value-based prioritization (MoSCoW / weighted shortest job first), don't arbitrate by seniority.",
  },
  {
    id: "cp-plan-security",
    phase: "Planning",
    ecoDomain: "Business Environment",
    ecoTask: "BE-3.2 Evaluate and address external business environment changes",
    pmbokDomain: "Uncertainty · Compliance",
    title: "Security and privacy baseline",
    situation:
      "Dr. Osei (Security) demands SSO, MFA, GDPR-compliant DPA, and a threat model before any code ships. The vendor calls it 'over-engineering for an MVP.'",
    source: "email",
    options: [
      {
        id: "A",
        label:
          "Bake security into the Definition of Done: threat model in design, SSO/MFA in MVP, DPA addendum signed before data flows.",
        rationale: "Shift-left security is PMBOK 8 practice guidance.",
        impact: { risk: 10, quality: 6, trust: 4 },
        quality: "excellent",
        consequence: "Security signs off on the architecture package.",
        pmiPrinciple: "Build quality (and security) into processes.",
      },
      {
        id: "B",
        label: "Defer security review to just before go-live to save sprint time.",
        rationale: "Late security = expensive rework and go-live risk.",
        impact: { risk: -10, quality: -6 },
        quality: "poor",
        consequence: "Pen test finds critical issue in week 34; go-live slips.",
        pmiPrinciple: "Prevention beats inspection.",
      },
      {
        id: "C",
        label: "Ask Security to 'trust the vendor's certifications' and move on.",
        rationale: "Vendor certifications don't replace your own controls.",
        impact: { risk: -6, trust: -4 },
        quality: "risky",
        consequence: "Dr. Osei escalates to Elena the same day.",
        pmiPrinciple: "The buyer owns residual risk.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Security/compliance answers almost always favor shift-left, threat modeling, and DoD integration.",
  },

  // ================== Day 4 · EXECUTION ==================
  {
    id: "cp-exec-standups",
    phase: "Execution",
    ecoDomain: "People",
    ecoTask: "P-1.4 Empower team members and stakeholders",
    pmbokDomain: "Team · Delivery",
    title: "Daily standups are becoming status reports",
    situation:
      "Jordan (Dev Team Lead) says standups have turned into 15-minute updates for you and Elena — the team is disengaging. Elena wants more visibility, not less.",
    source: "event",
    options: [
      {
        id: "A",
        label:
          "Return standups to the team (what's blocked, what's next); replace exec visibility with a live dashboard + weekly written update.",
        rationale: "Servant leadership: separate team ceremonies from exec reporting.",
        impact: { morale: 8, trust: 4, quality: 2 },
        quality: "excellent",
        consequence: "Standups shrink to 10 min; execs get a better dashboard.",
        pmiPrinciple: "Empower the team; report through the right channel.",
      },
      {
        id: "B",
        label: "Extend standups to 30 min and invite Elena.",
        rationale: "Kills team ceremony and morale.",
        impact: { morale: -8, quality: -4 },
        quality: "poor",
        consequence: "Two engineers stop attending; velocity drops.",
        pmiPrinciple: "Ceremonies belong to their owners.",
      },
      {
        id: "C",
        label: "Cancel standups and switch to written updates only.",
        rationale: "Kills team sync and blocker resolution speed.",
        impact: { morale: -4, schedule: -4 },
        quality: "risky",
        consequence: "Blockers linger longer; sprint slips.",
        pmiPrinciple: "Cadence matters; don't remove without replacing.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Team ceremonies are for the team. Executive visibility uses different artifacts (dashboards, weekly summary).",
  },
  {
    id: "cp-exec-integration-slip",
    phase: "Execution",
    ecoDomain: "Process",
    ecoTask: "PR-2.11 Plan and manage procurement",
    pmbokDomain: "Project Work",
    title: "SSO integration is 3 weeks late",
    situation:
      "The vendor blames your IdP team; Yuki (IT Manager) blames the vendor's docs. It's on the critical path for UAT.",
    source: "meeting",
    options: [
      {
        id: "A",
        label:
          "Convene a joint working session, contract a written recovery plan with owners, add contract-remedy language to the next steering pack.",
        rationale: "Root-cause + governance in one move.",
        impact: { schedule: 4, risk: 4, trust: 4 },
        quality: "excellent",
        consequence: "Integration recovers in 10 days with clear ownership.",
        pmiPrinciple: "Address root cause; use contract as governance.",
      },
      {
        id: "B",
        label: "Pick a side and pressure the other publicly.",
        rationale: "Political theater; both sides disengage.",
        impact: { trust: -6, morale: -4 },
        quality: "poor",
        consequence: "IT-vendor collaboration collapses.",
        pmiPrinciple: "Attack the problem, not the people.",
      },
      {
        id: "C",
        label: "Extend UAT by 3 weeks silently.",
        rationale: "Hides slippage from sponsor; erodes trust when discovered.",
        impact: { trust: -10, schedule: -4 },
        quality: "poor",
        consequence: "Elena finds out from Finance's cost report.",
        pmiPrinciple: "Stewardship = honesty.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Cross-party slippage → joint root-cause + written recovery plan + contract remedies. Never hide.",
  },

  // ================== Day 5 · MONITORING ==================
  {
    id: "cp-mon-change-request",
    phase: "Monitoring",
    ecoDomain: "Process",
    ecoTask: "PR-2.10 Manage project changes",
    pmbokDomain: "Delivery · Change Control",
    title: "Elena wants a new AI chatbot feature added mid-project",
    situation:
      "A board conversation gave Elena a 'must have AI chatbot' idea. She wants it in MVP without extending the timeline or budget.",
    source: "email",
    options: [
      {
        id: "A",
        label:
          "Submit a formal Change Request with impact on scope, schedule, cost, risk, quality; propose Phase-2 slot as alternative.",
        rationale: "Integrated Change Control — the PMI gold standard.",
        impact: { risk: 4, trust: 6, quality: 2 },
        quality: "excellent",
        consequence: "CCB approves Phase 2 slot; MVP stays intact.",
        pmiPrinciple: "Change enablement through analyzed trade-offs.",
      },
      {
        id: "B",
        label: "Say yes to keep Elena happy and figure it out later.",
        rationale: "Undocumented scope destroys the baseline.",
        impact: { schedule: -10, budget: -10, quality: -6 },
        quality: "poor",
        consequence: "MVP slips 8 weeks and blows budget by $180K.",
        pmiPrinciple: "Prevent scope creep through formal control.",
      },
      {
        id: "C",
        label: "Refuse and cite the plan.",
        rationale: "Legally safe, politically toxic without an alternative.",
        impact: { trust: -6, satisfaction: -4 },
        quality: "risky",
        consequence: "Elena questions your business partnership.",
        pmiPrinciple: "Say no with a process, not a slap.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "New scope from a sponsor → formal CR through CCB, always. Never verbal, never 'we'll figure it out.'",
  },
  {
    id: "cp-mon-priority-shift",
    phase: "Monitoring",
    ecoDomain: "Business Environment",
    ecoTask: "BE-3.2 Evaluate and address external business environment changes",
    pmbokDomain: "Business Environment",
    title: "Executive priority shift: competitor launched a similar portal",
    situation:
      "A competitor just launched. Elena wants to pull go-live in by 4 weeks. Team says the security review and UAT cannot be compressed safely.",
    source: "event",
    options: [
      {
        id: "A",
        label:
          "Present a compression analysis (crashing vs. fast-tracking) with risk profile; recommend pulling in launch marketing while preserving UAT + security windows.",
        rationale: "Data-backed compression; protects quality gates.",
        impact: { schedule: 2, trust: 6, risk: 2 },
        quality: "excellent",
        consequence: "Elena accepts a 2-week pull-in with expanded marketing.",
        pmiPrinciple: "Analyze before you compress.",
      },
      {
        id: "B",
        label: "Order the team to work weekends for 4 weeks.",
        rationale: "Sustained overtime kills quality and morale.",
        impact: { morale: -12, quality: -8 },
        quality: "poor",
        consequence: "Two engineers resign the following month.",
        pmiPrinciple: "Servant leadership over command-and-control.",
      },
      {
        id: "C",
        label: "Skip pen test and shorten UAT to hit the date.",
        rationale: "Trades a competitor headline for a security incident.",
        impact: { risk: -14, quality: -10 },
        quality: "poor",
        consequence: "Pen test after launch reveals critical CVE; PR nightmare.",
        pmiPrinciple: "Quality gates protect value.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "'Pull in the date' → compression analysis, protect quality gates, negotiate scope or resources — never skip QA.",
  },

  // ================== Day 6 · TESTING & GO/NO-GO (Monitoring) ==================
  {
    id: "cp-uat-defects",
    phase: "Monitoring",
    ecoDomain: "Process",
    ecoTask: "PR-2.7 Plan and manage quality of products/deliverables",
    pmbokDomain: "Delivery · Quality",
    title: "UAT surfaces 3 Sev-1 defects two weeks from go-live",
    situation:
      "Priya (QA Lead) reports 3 Sev-1 defects in ticket submission and invoice download. The vendor claims fixes need 3 weeks. Elena asks about Go/No-Go readiness on Friday.",
    source: "meeting",
    options: [
      {
        id: "A",
        label:
          "Recommend No-Go for full launch; propose limited pilot with 20 customers while Sev-1s are fixed; publish a transparent Go/No-Go pack.",
        rationale: "Progressive rollout + honest readiness reporting.",
        impact: { quality: 8, trust: 6, risk: 6 },
        quality: "excellent",
        consequence: "Sponsor approves controlled pilot; brand protected.",
        pmiPrinciple: "Progressive elaboration; disclose defects.",
      },
      {
        id: "B",
        label: "Launch on time with a 'known issues' banner.",
        rationale: "Sev-1 in a customer-facing feature = brand damage.",
        impact: { quality: -12, satisfaction: -12, trust: -6 },
        quality: "poor",
        consequence: "Angry customers on social media within 48 hours.",
        pmiPrinciple: "Quality is non-negotiable at launch.",
      },
      {
        id: "C",
        label: "Delay full launch by 4 weeks with no pilot.",
        rationale: "Loses momentum and delays benefit realization.",
        impact: { trust: -2, satisfaction: -4, schedule: -6 },
        quality: "risky",
        consequence: "Executive team questions delivery credibility.",
        pmiPrinciple: "Balance speed and safety with progressive rollout.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Sev-1 close to launch → progressive/limited release beats both 'ship it' and 'stop everything.'",
  },
  {
    id: "cp-training-adoption",
    phase: "Monitoring",
    ecoDomain: "People",
    ecoTask: "P-1.14 Promote team performance through emotional intelligence",
    pmbokDomain: "Team · Change Management",
    title: "Support agents fear the portal will replace them",
    situation:
      "Derek reports agents believe the portal will cut headcount. Adoption training attendance is at 40%. Without agents, deflection benefits won't materialize.",
    source: "email",
    options: [
      {
        id: "A",
        label:
          "Partner with Derek on an agent value story (portal handles Tier-1, agents move to complex cases + coaching); redesign training around real workflows and career growth.",
        rationale: "OCM: address 'what's in it for me' before technique.",
        impact: { morale: 8, satisfaction: 6, trust: 4 },
        quality: "excellent",
        consequence: "Training attendance jumps to 92%.",
        pmiPrinciple: "Enable change; lead with why.",
      },
      {
        id: "B",
        label: "Mandate training and threaten performance reviews for no-shows.",
        rationale: "Compliance without belief; adoption craters post-launch.",
        impact: { morale: -10, satisfaction: -6 },
        quality: "poor",
        consequence: "Agents follow letter, not spirit; deflection stalls.",
        pmiPrinciple: "Command-and-control fails at adoption.",
      },
      {
        id: "C",
        label: "Delegate adoption to Derek and move on.",
        rationale: "PM co-owns benefits realization, not just delivery.",
        impact: { satisfaction: -4, trust: -2 },
        quality: "risky",
        consequence: "Adoption plan lacks resources you could have secured.",
        pmiPrinciple: "PM ownership extends through adoption.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Low adoption → OCM: address fears, connect change to identity, redesign for the human. Never mandate first.",
  },

  // ================== Day 7 · CLOSING ==================
  {
    id: "cp-close-benefits",
    phase: "Closing",
    ecoDomain: "Business Environment",
    ecoTask: "BE-3.1 Plan and manage project compliance and business benefits",
    pmbokDomain: "Closing · Benefits Realization",
    title: "Handover benefits ownership to Operations",
    situation:
      "The portal is live. Elena wants to redeploy you to the next initiative next Monday. Derek's team owns support, but no one owns the CSAT/deflection KPIs long-term.",
    source: "meeting",
    options: [
      {
        id: "A",
        label:
          "Run a formal benefits handover: named owner, KPI dashboard, quarterly review cadence, and a lessons-learned workshop with the extended team.",
        rationale: "Closing is a discipline; benefits require post-project owners.",
        impact: { trust: 6, quality: 4, satisfaction: 4 },
        quality: "excellent",
        consequence: "Derek signs the benefits acceptance letter.",
        pmiPrinciple: "Enable change to achieve the envisioned future state.",
      },
      {
        id: "B",
        label: "Send a closure email and archive the workspace.",
        rationale: "Skips benefits handover, lessons, and knowledge transfer.",
        impact: { trust: -6, quality: -6 },
        quality: "poor",
        consequence: "6 months later no one can explain the CSAT numbers.",
        pmiPrinciple: "Superficial closure destroys OPA value.",
      },
      {
        id: "C",
        label: "Fill in the templates alone to save the team time.",
        rationale: "Individual paperwork ≠ team learning.",
        impact: { quality: -2 },
        quality: "risky",
        consequence: "Lessons stay in your head, not the organization.",
        pmiPrinciple: "Learning is facilitated, not filed.",
      },
    ],
    correctOptionId: "A",
    examTip:
      "Closing MUST include: acceptance, lessons learned, benefits handover with owner, resource release.",
  },
];

// ---------- Emails, meetings, documents built from decisions + narrative ----------
export function customerPortalEmails(now: number): Email[] {
  const emails: Email[] = customerPortalDecisions
    .filter((d) => d.source === "email")
    .map((d, i) => ({
      id: `cp-email-dec-${i}`,
      from:
        d.id === "cp-init-stakeholder-map"
          ? "product-owner"
          : d.id === "cp-plan-security"
            ? "risk-officer"
            : d.id === "cp-mon-change-request"
              ? "sponsor"
              : d.id === "cp-training-adoption"
                ? "cs-director"
                : "sponsor",
      subject: d.title,
      preview: d.situation.slice(0, 100).replace(/\*\*/g, "") + "…",
      body: d.situation,
      receivedAt: new Date(now - (10 - i) * 3600_000).toISOString(),
      read: false,
      unlocksDecisionId: d.id,
    }));

  // Extra narrative emails that don't gate a decision but add texture.
  emails.push(
    {
      id: "cp-email-welcome",
      from: "sponsor",
      subject: "Welcome aboard — Customer Portal is yours",
      preview:
        "Excited to have you leading this. Board is watching CSAT and support cost. Let's move fast, but move right…",
      body: "Welcome aboard. You know the story: our current support process is embarrassing us with customers and burning our agents out. The Customer Self-Service Portal is our chance to reset both. Board is watching two numbers — CSAT and cost-per-ticket. I'll defend the runway; you deliver the product. Let's talk on Monday.\n\n— Elena",
      receivedAt: new Date(now - 20 * 3600_000).toISOString(),
      read: false,
    },
    {
      id: "cp-email-vendor-intro",
      from: "vendor",
      subject: "Introducing the vendor delivery team",
      preview:
        "Attaching our SOW acceptance criteria and change-order process. Please confirm PM & architecture reviewers…",
      body: "Hi PM,\n\nAttaching the SOW acceptance criteria, milestone plan, and our change-order process. Please confirm the PM, architecture, and security reviewers on your side. We assume weekly delivery syncs starting next Tuesday.\n\n— Aiko, Vendor PM",
      receivedAt: new Date(now - 6 * 3600_000).toISOString(),
      read: false,
    },
    {
      id: "cp-email-customer-voice",
      from: "customer",
      subject: "Pilot customer expectations — read before Day 3",
      preview:
        "12 of us signed up for the pilot. Three things we don't want to see repeated from last vendor…",
      body: "Hi,\n\nWe've got 12 pilot customers signed up. Three things we do NOT want to repeat from the previous portal:\n1. Login that forgets us every 15 minutes.\n2. Ticket status that lies (says 'in progress' for 2 weeks).\n3. Notifications for things we didn't ask for.\n\nMake those three right and we'll be your loudest advocates.\n\n— Grace, on behalf of the pilot group",
      receivedAt: new Date(now - 2 * 3600_000).toISOString(),
      read: false,
    },
  );

  return emails;
}

export function customerPortalMeetings(now: number): Meeting[] {
  const meetings: Meeting[] = customerPortalDecisions
    .filter((d) => d.source === "meeting")
    .map((d, i) => ({
      id: `cp-mtg-dec-${i}`,
      title: d.title,
      time: new Date(now + i * 86_400_000).toISOString(),
      attendees:
        d.id === "cp-init-benefits"
          ? ["sponsor", "finance", "cs-director"]
          : d.id === "cp-plan-mvp"
            ? ["product-owner", "cs-director", "sponsor", "vendor"]
            : d.id === "cp-exec-integration-slip"
              ? ["it-manager", "vendor", "architect"]
              : d.id === "cp-uat-defects"
                ? ["qa-lead", "sponsor", "product-owner", "customer"]
                : ["sponsor", "cs-director", "finance"],
      agenda: [d.title, "Context & data", "Options", "Decision", "Actions & owners"],
      transcript: `**Agenda:** ${d.title}\n\n${d.situation}\n\n> The room turns to you for a decision.`,
      unlocksDecisionId: d.id,
    }));

  meetings.push({
    id: "cp-mtg-go-no-go",
    title: "Executive Go/No-Go — Customer Portal",
    time: new Date(now + 5 * 86_400_000).toISOString(),
    attendees: ["sponsor", "cs-director", "qa-lead", "risk-officer", "it-manager", "customer"],
    agenda: [
      "Readiness scorecard (scope, quality, security, ops)",
      "UAT & defect status",
      "Cutover plan & rollback",
      "Pilot vs. full launch options",
      "Decision & communications",
    ],
    transcript:
      "**Go/No-Go pack**\n\n- Scope: MVP complete, live chat deferred to Phase 2 with committed date.\n- Quality: UAT completion 96%; open Sev-1/Sev-2 count reviewed.\n- Security: pen test complete; residual risks accepted with sign-off.\n- Ops: runbook rehearsed twice; rollback tested end-to-end.\n- Pilot readiness: 20 customers on standby.\n\n> Elena asks: 'Full launch, pilot, or delay?' The room waits for your recommendation.",
  });

  return meetings;
}

export function customerPortalDocuments(nowIso: string): SimDocument[] {
  return [
    {
      id: "cp-doc-benefits",
      title: "Customer Portal — Benefits Realization Plan",
      kind: "Business Case",
      updatedAt: nowIso,
      markdown:
        "# Benefits Realization Plan — Customer Self-Service Portal\n\n| Benefit | Baseline | Target (12 mo post-launch) | Owner | Measurement |\n|---|---|---|---|---|\n| Customer Satisfaction (CSAT) | 68 | 83 (+15) | VP CX | Quarterly survey |\n| Cost per support ticket | $18.40 | $13.80 (-25%) | Finance | Monthly report |\n| Tier-1 deflection rate | 12% | 45% | CS Director | Weekly dashboard |\n| Average ticket resolution time | 32h | 18h | CS Director | Weekly dashboard |\n| Agent NPS (internal) | 22 | 45 | CS Director | Quarterly pulse |\n\n**Governance:** Quarterly Benefits Review chaired by Sponsor. Deviations trigger a corrective action review.\n",
    },
    {
      id: "cp-doc-charter",
      title: "Customer Portal — Project Charter",
      kind: "Charter",
      updatedAt: nowIso,
      markdown:
        "# Project Charter — Customer Self-Service Portal\n\n**Sponsor:** Elena Voss, VP Customer Experience  \n**PM:** You  \n**Budget:** $2.4M  \n**Duration:** 9 months  \n**Approach:** Hybrid (predictive governance, iterative delivery)\n\n## Purpose\nReplace the legacy support process with a modern self-service portal that lifts CSAT and reduces support cost.\n\n## High-Level Scope\n- Customer accounts & profiles\n- Product/service catalog browsing\n- Ticket submission & tracking\n- Invoice download\n- Notifications & preferences\n- Support chat (Phase 2)\n\n## Success Criteria\n- +15 CSAT within 12 months of launch\n- 25% support-cost reduction within 12 months\n- Zero Sev-1 defects at go-live\n- SSO/MFA and GDPR/CCPA compliance\n\n## Assumptions & Constraints\n- Existing IdP available for SSO\n- Vendor SOW covers integrations listed above\n- Regulatory posture unchanged during delivery\n\n## Approval\nSponsor signature pending steering review.\n",
    },
    {
      id: "cp-doc-stakes",
      title: "Customer Portal — Stakeholder Register",
      kind: "Stakeholder Register",
      updatedAt: nowIso,
      markdown:
        "# Stakeholder Register\n\n| Stakeholder | Role | Power | Interest | Strategy | Cadence |\n|---|---|---|---|---|---|\n| Elena Voss | Executive Sponsor | H | H | Manage closely | Weekly 1-pager + monthly steering |\n| Nadia Rahim | Product Owner | M | H | Partner | Daily |\n| Derek Malone | CS Director | M | H | Partner | Biweekly |\n| Yuki Tanaka | IT Manager | M | H | Partner | Weekly |\n| Rafael Costa | Solution Architect | M | H | Partner | Weekly |\n| Sara Lindqvist | UX Designer | M | H | Partner | Sprint |\n| Jordan Blake | Dev Team Lead | M | H | Partner | Daily |\n| Priya Anand | QA Lead | M | H | Partner | Sprint |\n| Marcus Reid | Infrastructure Manager | M | M | Keep informed | Weekly |\n| Dr. Amina Osei | Security & Compliance | H | H | Manage closely | Sprint + gate reviews |\n| Hannah Weber | Finance Manager | H | M | Keep satisfied | Monthly variance |\n| Luis Ortega | Procurement | M | M | Keep informed | Per contract event |\n| Aiko Mori | External Vendor PM | M | H | Manage closely | Weekly |\n| Grace Okafor | Pilot Customer (VoC) | L | H | Keep informed + involve | Sprint demo |\n",
    },
    {
      id: "cp-doc-risk",
      title: "Customer Portal — Risk Register",
      kind: "Risk Register",
      updatedAt: nowIso,
      markdown:
        "# Risk Register (living document)\n\n| # | Risk | Prob | Impact | Owner | Response |\n|---|---|---|---|---|---|\n| R1 | Legacy data migration errors | H | H | Solution Architect | Mitigate — dry runs + reconciliation |\n| R2 | SSO/IdP integration slip | M | H | IT Manager | Mitigate — early spike + fallback plan |\n| R3 | Security vulnerability at launch | M | Critical | Security Officer | Avoid — threat model + pen test |\n| R4 | Scope creep from executive priority shift | M | H | PM | Control — CCB + Phase-2 backlog |\n| R5 | Low agent adoption | M | H | CS Director | Mitigate — OCM plan + value story |\n| R6 | Vendor performance | M | M | Procurement | Transfer — contract remedies |\n| R7 | Notification fatigue harming CSAT | M | M | Product Owner | Mitigate — preferences UX + defaults |\n",
    },
    {
      id: "cp-doc-plan",
      title: "Customer Portal — Project Management Plan",
      kind: "Plan",
      updatedAt: nowIso,
      markdown:
        "# Project Management Plan — Customer Self-Service Portal\n\n## Delivery Approach\nHybrid: predictive governance (charter, gates, baselines, CCB) with iterative delivery in 2-week sprints and rolling-wave planning.\n\n## Schedule Baseline\n- M1 · Charter & Kickoff (Wk 2)\n- M2 · Architecture & Security Baseline (Wk 6)\n- M3 · MVP Feature Complete (Wk 22)\n- M4 · UAT + Pen Test (Wk 28)\n- M5 · Go/No-Go (Wk 32)\n- M6 · Pilot Launch (Wk 34)\n- M7 · Full Launch (Wk 36)\n\n## Cost Baseline\n$2.4M with 10% management reserve, tracked via EVM at each gate.\n\n## Communication Plan\n- Team: daily standup, sprint review, retro\n- Sponsor: weekly 1-pager + monthly steering\n- Customer pilot: sprint demo\n- Broader org: monthly update\n\n## Quality Plan\n- Definition of Done includes security review, accessibility (WCAG 2.2 AA), and test coverage thresholds.\n- Pen test before go-live; defect trend published each sprint.\n\n## Change Control\nAll scope changes route through CCB; verbal changes not accepted.\n",
    },
    {
      id: "cp-doc-status",
      title: "Weekly Executive Status — Customer Portal",
      kind: "Status Report",
      updatedAt: nowIso,
      markdown:
        "# Weekly Executive Status — Customer Portal\n\n**Overall:** 🟢 Green  \n**Budget:** On plan  \n**Schedule:** On plan  \n**Quality:** DoD holding  \n**Risks:** 7 open (2 High)\n\n## This week\n- Charter signed; benefits plan approved\n- Stakeholder register complete\n- Vendor SOW baseline reviewed by Procurement\n\n## Next week\n- Architecture & security baseline workshop\n- Sprint 1 planning\n- Pilot customer intake begins\n",
    },
    {
      id: "cp-doc-lessons",
      title: "Lessons Learned Register (living)",
      kind: "RAID",
      updatedAt: nowIso,
      markdown:
        "# Lessons Learned Register\n\nCaptured continuously throughout the project — not just at closing.\n\n| Sprint | Lesson | Action taken |\n|---|---|---|\n| 0 | Benefits without baselines can't be proved | Baseline CSAT and cost-per-ticket measured before design |\n| 1 | Standups drift into status when execs attend | Split forum: standup for team, weekly written for execs |\n| — | Add more as the project unfolds. | — |\n",
    },
  ];
}
