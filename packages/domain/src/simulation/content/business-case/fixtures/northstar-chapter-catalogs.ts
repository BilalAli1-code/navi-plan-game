/**
 * BC-006 Northstar chapter catalog data for chapters 2–6.
 */

import type { ChapterCatalog } from "./northstar-chapter-assembler";
import { NS } from "./northstar-chapter-assembler";

export const CHAPTER_2_CATALOG: ChapterCatalog = {
  order: 2,
  title: "Planning",
  summary:
    "Build an integrated planning baseline across scope, schedule, resources, governance, quality, risk, procurement, and stakeholder engagement — then recommend baseline approval to steering.",
  priorChapterId: "chapter-01",
  learningObjectives: [
    { id: "lo.chapter-02-integrated-planning", theme: "integrated-planning" },
    { id: "lo.chapter-02-baseline-governance", theme: "baseline-governance" },
    { id: "lo.chapter-02-planning-tradeoffs", theme: "planning-tradeoffs" },
  ],
  notification: {
    id: "notification.chapter-02-ready",
    title: "Chapter Two is ready",
    summary:
      "Chapter 2 activities, evidence, meetings, and decisions are available in the Workplace.",
    body: "Review chapter guidance, complete required activities, and resolve all chapter decisions to progress.",
  },
  documents: [
    {
      id: "document.c2.project-management-plan",
      documentType: "integrated_plan",
      title: "Integrated Project Management Plan",
      summary:
        "Integrated Project Management Plan for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.scope-statement",
      documentType: "scope",
      title: "Scope Statement",
      summary:
        "Scope Statement for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.requirements-register",
      documentType: "requirements",
      title: "Requirements Register",
      summary:
        "Requirements Register for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.delivery-decomposition",
      documentType: "scope",
      title: "Delivery Decomposition",
      summary:
        "Delivery Decomposition for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.milestone-schedule",
      documentType: "schedule",
      title: "Milestone Schedule",
      summary:
        "Milestone Schedule for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.resource-plan",
      documentType: "resources",
      title: "Resource and Capacity Plan",
      summary:
        "Resource and Capacity Plan for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.governance-plan",
      documentType: "governance",
      title: "Governance Plan",
      summary:
        "Governance Plan for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.decision-authority-matrix",
      documentType: "governance",
      title: "Decision Authority Matrix",
      summary:
        "Decision Authority Matrix for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.stakeholder-engagement-plan",
      documentType: "stakeholders",
      title: "Stakeholder Engagement Plan",
      summary:
        "Stakeholder Engagement Plan for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.communications-plan",
      documentType: "communications",
      title: "Communications Plan",
      summary:
        "Communications Plan for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.risk-register-v2",
      documentType: "risk",
      title: "Risk Register — Planning Baseline",
      summary:
        "Risk Register — Planning Baseline for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.dependency-map",
      documentType: "integration",
      title: "Integrated Dependency Map",
      summary:
        "Integrated Dependency Map for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.quality-strategy",
      documentType: "quality",
      title: "Quality Management Strategy",
      summary:
        "Quality Management Strategy for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.acceptance-framework",
      documentType: "quality",
      title: "Acceptance Criteria Framework",
      summary:
        "Acceptance Criteria Framework for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.procurement-plan",
      documentType: "procurement",
      title: "Procurement and Vendor Strategy",
      summary:
        "Procurement and Vendor Strategy for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.vendor-responsibility-matrix",
      documentType: "procurement",
      title: "Vendor Responsibility Matrix",
      summary:
        "Vendor Responsibility Matrix for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.change-control-approach",
      documentType: "governance",
      title: "Integrated Change-Control Approach",
      summary:
        "Integrated Change-Control Approach for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.assumptions-constraints-log",
      documentType: "integration",
      title: "Assumptions and Constraints Log",
      summary:
        "Assumptions and Constraints Log for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.benefits-measurement-draft",
      documentType: "value",
      title: "Benefits Measurement Draft",
      summary:
        "Benefits Measurement Draft for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.baseline-approval-package",
      documentType: "approval",
      title: "Planning Baseline Approval Package",
      summary:
        "Planning Baseline Approval Package for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c2.baseline-decision-record",
      documentType: "governance_record",
      title: "Planning Baseline Decision Record",
      summary:
        "Planning Baseline Decision Record for Connected Care Chapter 2. Supports integrated governance, traceability, and evidence-based decisions.",
    },
  ],
  messages: [
    {
      id: "message.c2.sponsor-launch-target",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Public launch target request",
      body: "Elena requests a public launch target before estimates and dependencies are mature. Review schedule evidence before responding.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-02.launch-target-communication",
    },
    {
      id: "message.c2.clinical-workflow-concern",
      senderStakeholderId: "stakeholder.clinical",
      subject: "Clinical workflow safety constraints",
      body: "Priya describes workflow safety, provider availability, and usability constraints that must shape scope and acceptance planning.",
      catalogClass: "actionable",
    },
    {
      id: "message.c2.privacy-data-boundaries",
      senderStakeholderId: "stakeholder.privacy",
      subject: "Patient data and vendor access boundaries",
      body: "Aisha requests explicit patient-data, vendor-access, retention, and responsible-technology boundaries in planning artifacts.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c2.vendor-client-responsibilities",
      senderStakeholderId: "stakeholder.vendor",
      subject: "Vendor responsibility assumptions",
      body: "Maya states optimistic assumptions about Northstar responsibilities and standard configuration paths.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-02.vendor-responsibility-boundary",
    },
    {
      id: "message.c2.operations-support-coverage",
      senderStakeholderId: "stakeholder.operations",
      subject: "Support coverage warning",
      body: "Renee warns that support coverage and workflow backfill are understated in the resource plan.",
      catalogClass: "actionable",
    },
    {
      id: "message.c2.pmo-baseline-standard",
      senderStakeholderId: "stakeholder.pmo",
      subject: "Integrated baseline standard",
      body: "Marcus Reed and PMO request integrated baseline structure, reporting cadence, and approval evidence.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c2.finance-estimate-confidence",
      senderStakeholderId: "stakeholder.finance",
      subject: "Estimate confidence challenge",
      body: "Thomas challenges estimate confidence, contingency rationale, and benefit sensitivity assumptions.",
      catalogClass: "actionable",
    },
    {
      id: "message.c2.training-effort-warning",
      senderStakeholderId: "stakeholder.change-lead",
      subject: "Training effort underestimated",
      body: "Change lead warns that training and manager engagement effort is underestimated in planning.",
      catalogClass: "actionable",
    },
    {
      id: "message.c2.regulatory-traceability-inquiry",
      senderStakeholderId: "stakeholder.quality",
      subject: "Regulatory traceability request",
      body: "Quality lead requests evidence traceability and approval checkpoints for the baseline.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c2.executive-simple-status",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Simplified planning narrative request",
      body: "Elena asks for a simplified positive planning narrative for leadership review.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-02.planning-baseline-recommendation",
    },
    {
      id: "message.c2.plan-challenge-summary",
      senderStakeholderId: "stakeholder.program-director",
      subject: "Unresolved planning objections",
      body: "Marcus summarizes unresolved objections before baseline approval.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c2.baseline-outcome",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Baseline approval outcome",
      body: "Steering secretariat communicates approval, conditional approval, deferral, or rejection outcome.",
      catalogClass: "informational",
    },
  ],
  meetings: [
    {
      id: "meeting.planning.kickoff",
      title: "Planning Kickoff Workshop",
      purpose:
        "Establish integrated planning process, workstreams, and decision cadence",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Chapter carryover review",
        "Planning workstreams and owners",
        "Evidence gaps and assumptions",
        "Escalation path",
        "Planning deliverables",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.scope-requirements",
      title: "Scope and Requirements Alignment Workshop",
      purpose:
        "Align objectives with clinical, operational, technical, and privacy requirements",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Confirm outcomes",
        "Review workflow needs",
        "Regulatory boundaries",
        "Scope prioritization",
        "Unresolved conflicts",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.governance-rights",
      title: "Governance and Decision Rights Workshop",
      purpose: "Define forums, cadence, tolerances, and escalation routes",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Decision rights review",
        "Escalation thresholds",
        "Change control integration",
        "Reporting cadence",
        "Accountability gaps",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.risk-dependency",
      title: "Risk and Dependency Planning Session",
      purpose: "Integrate risks, dependencies, and response strategies",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Risk review",
        "Dependency mapping",
        "Trigger definitions",
        "Residual uncertainty",
        "Owner confirmation",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.schedule-resource",
      title: "Schedule and Resource Planning Session",
      purpose: "Build milestone schedule and resource capacity plan",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Milestone sequencing",
        "Resource constraints",
        "Backfill assumptions",
        "Critical path review",
        "Confidence assessment",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.quality-acceptance",
      title: "Quality and Acceptance Planning Session",
      purpose: "Define quality strategy and acceptance criteria",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Quality standards",
        "Acceptance evidence",
        "Clinical-operational criteria",
        "Testing approach",
        "Escalation for nonconformance",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.procurement-vendor",
      title: "Procurement and Vendor Planning Session",
      purpose:
        "Align procurement strategy and vendor responsibility boundaries",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Contract boundaries",
        "Vendor assumptions",
        "Onboarding expectations",
        "Commercial escalation",
        "Responsibility matrix",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.integrated-challenge",
      title: "Integrated Plan Challenge Review",
      purpose: "Challenge assumptions and log objections before approval",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Assumption challenge",
        "Objection review",
        "Revision assignments",
        "Residual risk acceptance",
        "Readiness for steering",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.planning.steering-approval",
      title: "Planning Baseline Steering Approval",
      purpose:
        "Present integrated baseline and recommendation to steering committee",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Baseline summary",
        "Residual risks",
        "Stakeholder objections",
        "Recommendation",
        "Steering decision",
      ],
      estimatedMinutes: 60,
    },
  ],
  activities: [
    {
      id: "activity.c2.review-carryover",
      title: "Review Initiation Carryover",
      instructions:
        "Identify unresolved assumptions, commitments, risks, and governance limits from Chapter One.",
      activityType: "review" as const,
    },
    {
      id: "activity.c2.assign-planning-ownership",
      title: "Assign Planning Ownership",
      instructions: "Confirm planning responsibility matrix and decision path.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.align-scope-requirements",
      title: "Align Scope and Requirements",
      instructions:
        "Document scope boundaries, exclusions, conflicts, and owners.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c2.design-governance",
      title: "Design Governance and Decision Rights",
      instructions:
        "Prepare governance plan, authority matrix, escalation thresholds, and change control.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.map-risks-dependencies",
      title: "Map Risks and Dependencies",
      instructions:
        "Update risk register and dependency map with owners and triggers.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c2.build-schedule-resources",
      title: "Build Milestone Schedule and Resource Plan",
      instructions:
        "Record milestones, resources, constraints, and confidence levels.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.define-quality-acceptance",
      title: "Define Quality and Acceptance Approach",
      instructions:
        "Define quality strategy, testing approach, and acceptance criteria.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.plan-vendor-procurement",
      title: "Plan Procurement and Vendor Governance",
      instructions:
        "Prepare procurement plan and vendor responsibility boundaries.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.plan-engagement-communications",
      title: "Plan Stakeholder Engagement and Communications",
      instructions:
        "Prepare engagement and communications plans with cadence and ownership.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.challenge-integrated-plan",
      title: "Challenge the Integrated Plan",
      instructions:
        "Challenge assumptions, log objections, and assign revisions.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c2.prepare-baseline-approval",
      title: "Prepare Planning Baseline Approval Package",
      instructions: "Assemble integrated baseline approval evidence package.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c2.present-baseline",
      title: "Present the Planning Baseline",
      instructions:
        "Complete steering approval meeting and submit baseline recommendation.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c2.chapter-reflection",
      title: "Reflect on Planning Trade-offs",
      instructions:
        "Reflect on tailoring, uncertainty, stakeholder trade-offs, and downstream consequences.",
      activityType: "reflection" as const,
    },
  ],
  decisions: [
    {
      shortName: "scope-baseline",
      name: "scope-baseline-strategy",
      title: "Scope Baseline Strategy",
      situation:
        "Planning must define how scope will be baselined amid unresolved clinical and operational variation.",
      prompt: "Select the scope baseline strategy for the integrated plan.",
      options: [
        {
          label: "Broad fixed scope",
          description: "Lock a comprehensive scope baseline early.",
        },
        {
          label: "Minimum viable scope",
          description:
            "Baseline the smallest scope that delivers measurable access value.",
        },
        {
          label: "Phased scope",
          description: "Sequence scope waves with explicit phase gates.",
        },
        {
          label: "Provisional scope with controlled elaboration",
          description:
            "Maintain provisional boundaries with governed elaboration.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "gov-escalation",
      name: "governance-escalation-model",
      title: "Governance and Escalation Model",
      situation:
        "Chapter One governance choices must be operationalized for planning decisions and escalations.",
      prompt: "Select the governance and escalation model for planning.",
      options: [
        {
          label: "Centralized governance",
          description: "Retain central decision authority for speed.",
        },
        {
          label: "Delegated governance",
          description:
            "Delegate decisions to workstream leads within tolerances.",
        },
        {
          label: "Tiered governance",
          description: "Use tiered forums by decision impact.",
        },
        {
          label: "Risk-based hybrid",
          description: "Escalate based on risk and value impact thresholds.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "launch-target",
      name: "launch-target-communication",
      title: "Launch Target Communication",
      situation:
        "The sponsor requests a public launch target before estimates and dependencies are mature.",
      prompt: "How should launch timing be communicated to leadership?",
      options: [
        {
          label: "Commit to target date",
          description: "Publish a specific launch target date.",
        },
        {
          label: "Communicate range",
          description: "Present a credible date range with assumptions.",
        },
        {
          label: "Defer commitment pending evidence",
          description: "Decline a firm date until dependency evidence matures.",
        },
        {
          label: "Milestone-based commitment",
          description: "Commit to milestones rather than a single launch date.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "quality-accept",
      name: "quality-acceptance-threshold",
      title: "Quality and Acceptance Threshold",
      situation:
        "Stakeholders disagree on how strict acceptance criteria should be before execution.",
      prompt: "Select the quality and acceptance threshold for the baseline.",
      options: [
        {
          label: "Minimum contractual compliance",
          description: "Meet contractual minimums only.",
        },
        {
          label: "Integrated clinical-operational acceptance",
          description:
            "Require joint clinical and operational acceptance evidence.",
        },
        {
          label: "Risk-tiered acceptance",
          description: "Apply stricter criteria to high-risk capabilities.",
        },
        {
          label: "Staged acceptance",
          description:
            "Accept in stages with explicit residual-risk ownership.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "vendor-boundary",
      name: "vendor-responsibility-boundary",
      title: "Vendor Responsibility Boundary",
      situation:
        "The vendor proposes optimistic assumptions about Northstar responsibilities.",
      prompt: "Select the vendor responsibility boundary position.",
      options: [
        {
          label: "Accept vendor assumptions",
          description: "Accept vendor standard-configuration assumptions.",
        },
        {
          label: "Challenge and renegotiate",
          description:
            "Challenge assumptions and renegotiate responsibilities.",
        },
        {
          label: "Split responsibilities",
          description: "Document a split responsibility matrix with owners.",
        },
        {
          label: "Escalate unresolved ambiguity",
          description: "Escalate unresolved boundary ambiguity to governance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "baseline-rec",
      name: "planning-baseline-recommendation",
      title: "Planning Baseline Recommendation",
      situation:
        "Steering committee requests your integrated baseline recommendation.",
      prompt:
        "Recommend planning baseline disposition to the steering committee.",
      options: [
        { label: "Approve", description: "Recommend full baseline approval." },
        {
          label: "Approve with conditions",
          description: "Recommend approval with explicit conditions.",
        },
        { label: "Defer", description: "Recommend deferral for remediation." },
        { label: "Reject", description: "Recommend rejection and replanning." },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
  ],

  learnerGuidance: {
    default:
      "Build an integrated planning baseline across scope, schedule, resources, governance, quality, risk, procurement, and stakeholder engagement — then recommend baseline approval to steering.",
    explorer:
      "Use document evidence and activity instructions as checklists. Compare trade-offs before each decision.",
    practitioner:
      "Balance stakeholder pressure with governance discipline and incomplete evidence.",
    leader:
      "Prioritize accountable trade-offs under ambiguity; keep safety, privacy, quality, and governance non-negotiable.",
  },
};

export const CHAPTER_3_CATALOG: ChapterCatalog = {
  order: 3,
  title: "Early Execution",
  summary:
    "Mobilize delivery teams, govern vendor onboarding, manage dependencies and quality, and navigate first deliverable acceptance under executive milestone pressure.",
  priorChapterId: "chapter-02",
  learningObjectives: [
    { id: "lo.chapter-03-execution-control", theme: "execution-control" },
    {
      id: "lo.chapter-03-dependency-governance",
      theme: "dependency-governance",
    },
    { id: "lo.chapter-03-deliverable-quality", theme: "deliverable-quality" },
  ],
  notification: {
    id: "notification.chapter-03-ready",
    title: "Chapter Three is ready",
    summary:
      "Chapter 3 activities, evidence, meetings, and decisions are available in the Workplace.",
    body: "Review chapter guidance, complete required activities, and resolve all chapter decisions to progress.",
  },
  documents: [
    {
      id: "document.c3.execution-brief",
      documentType: "execution",
      title: "Chapter Execution Brief",
      summary:
        "Chapter Execution Brief for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.team-working-agreement",
      documentType: "team",
      title: "Team Working Agreement",
      summary:
        "Team Working Agreement for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.responsibility-matrix-update",
      documentType: "resources",
      title: "Responsibility Matrix — Execution Update",
      summary:
        "Responsibility Matrix — Execution Update for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.vendor-mobilization-record",
      documentType: "procurement",
      title: "Vendor Mobilization Record",
      summary:
        "Vendor Mobilization Record for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.integrated-schedule-update",
      documentType: "schedule",
      title: "Integrated Schedule Update",
      summary:
        "Integrated Schedule Update for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.dependency-log",
      documentType: "integration",
      title: "Dependency Log",
      summary:
        "Dependency Log for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.issue-log",
      documentType: "issue",
      title: "Issue Log",
      summary:
        "Issue Log for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.risk-register-update",
      documentType: "risk",
      title: "Risk Register — Execution Update",
      summary:
        "Risk Register — Execution Update for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.quality-review-checklist",
      documentType: "quality",
      title: "First Deliverable Quality Checklist",
      summary:
        "First Deliverable Quality Checklist for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.nonconformance-log",
      documentType: "quality",
      title: "Defect and Nonconformance Log",
      summary:
        "Defect and Nonconformance Log for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.deliverable-acceptance-record",
      documentType: "acceptance",
      title: "First Deliverable Acceptance Record",
      summary:
        "First Deliverable Acceptance Record for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.status-report",
      documentType: "measurement",
      title: "Early Execution Status Report",
      summary:
        "Early Execution Status Report for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.corrective-action-plan",
      documentType: "improvement",
      title: "Early Corrective-Action Plan",
      summary:
        "Early Corrective-Action Plan for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.decision-action-log",
      documentType: "governance",
      title: "Decision and Action Log",
      summary:
        "Decision and Action Log for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.stakeholder-engagement-update",
      documentType: "stakeholders",
      title: "Stakeholder Engagement Update",
      summary:
        "Stakeholder Engagement Update for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c3.lessons-improvement-notes",
      documentType: "learning",
      title: "Early Lessons and Improvement Notes",
      summary:
        "Early Lessons and Improvement Notes for Connected Care Chapter 3. Supports integrated governance, traceability, and evidence-based decisions.",
    },
  ],
  messages: [
    {
      id: "message.c3.team-mobilization-welcome",
      senderStakeholderId: "stakeholder.program-director",
      subject: "Transition to execution",
      body: "Marcus confirms transition from planning to execution and sets mobilization expectations.",
      catalogClass: "informational",
    },
    {
      id: "message.c3.vendor-staffing-substitution",
      senderStakeholderId: "stakeholder.vendor",
      subject: "Vendor staffing substitution request",
      body: "Maya requests approval of a vendor staffing substitution and revised onboarding sequence.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-03.vendor-staffing-substitution",
    },
    {
      id: "message.c3.clinical-attendance-conflict",
      senderStakeholderId: "stakeholder.clinical",
      subject: "Clinical attendance conflict",
      body: "Priya explains patient-care demand limits design-workshop attendance.",
      catalogClass: "escalation",
    },
    {
      id: "message.c3.integration-assumption-failure",
      senderStakeholderId: "stakeholder.technology",
      subject: "Integration assumption failure",
      body: "Jordan reports a critical interface assumption is incomplete or incorrect.",
      catalogClass: "escalation",
    },
    {
      id: "message.c3.dependency-ownership-gap",
      senderStakeholderId: "stakeholder.analyst",
      subject: "Unassigned dependency",
      body: "Nia requests a named owner for an unassigned cross-functional dependency.",
      catalogClass: "actionable",
    },
    {
      id: "message.c3.communication-breakdown",
      senderStakeholderId: "stakeholder.operations",
      subject: "Communication breakdown rework",
      body: "Renee reports rework caused by inconsistent dependency communication.",
      catalogClass: "actionable",
    },
    {
      id: "message.c3.quality-evidence-request",
      senderStakeholderId: "stakeholder.quality",
      subject: "Quality evidence before review",
      body: "Quality lead requests evidence before the first deliverable review.",
      catalogClass: "preparation_required",
    },
    // Inbox catalog alias decision.c3.scope-interpretation is realized as
    // integration-assumption-failure; message text matches that decision's situation.
    {
      id: "message.c3.scope-interpretation-conflict",
      senderStakeholderId: "stakeholder.technology",
      subject: "Integration assumption failure",
      body: "Jordan reports a critical interface assumption is incomplete or incorrect and asks for a coordinated response before the first deliverable review.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-03.integration-assumption-failure",
    },
    {
      id: "message.c3.first-deliverable-findings",
      senderStakeholderId: "stakeholder.quality",
      subject: "First deliverable findings",
      body: "Quality lead presents findings and requests an acceptance recommendation.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-03.first-deliverable-acceptance",
    },
    {
      id: "message.c3.executive-compress-remediation",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Compress remediation request",
      body: "Elena requests compressed remediation to preserve the published milestone.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-03.executive-status-position",
    },
    {
      id: "message.c3.checkpoint-outcome",
      senderStakeholderId: "stakeholder.pmo",
      subject: "Checkpoint outcome",
      body: "PMO communicates accepted, conditionally accepted, or rejected checkpoint result.",
      catalogClass: "informational",
    },
  ],
  meetings: [
    {
      id: "meeting.execution.kickoff",
      title: "Execution Kickoff",
      purpose: "Confirm mobilization, cadence, and execution controls",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Mobilization status",
        "Workstream cadence",
        "Control artifacts",
        "Immediate actions",
        "Escalation reminders",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.execution.vendor-mobilization",
      title: "Vendor Mobilization Review",
      purpose: "Review vendor staffing, substitutions, and onboarding",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Staffing plan",
        "Substitution impacts",
        "Reporting routes",
        "Commercial conditions",
        "Escalation triggers",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.execution.dependency-review",
      title: "Cross-Functional Dependency Review",
      purpose: "Review critical dependencies, owners, and schedule impact",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Dependency status",
        "Owner gaps",
        "Schedule implications",
        "Risk triggers",
        "Corrective actions",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.execution.first-quality-review",
      title: "First Deliverable Quality Review",
      purpose: "Review quality evidence and acceptance findings",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Quality evidence",
        "Nonconformance review",
        "Acceptance criteria",
        "Remediation needs",
        "Decision preparation",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.execution.executive-progress",
      title: "Executive Progress Review",
      purpose:
        "Review early execution status and executive communication needs",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Progress summary",
        "Forecast variance",
        "Quality and risk highlights",
        "Decisions needed",
        "Executive messaging",
      ],
      estimatedMinutes: 60,
    },
  ],
  activities: [
    {
      id: "activity.c3.mobilize-teams",
      title: "Mobilize Delivery Teams",
      instructions:
        "Confirm workstream ownership, cadence, actions, and dependencies.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c3.review-vendor-mobilization",
      title: "Review Vendor Mobilization",
      instructions:
        "Review staffing, substitutions, reporting, and escalation routes.",
      activityType: "review" as const,
    },
    {
      id: "activity.c3.manage-clinical-participation",
      title: "Manage Clinical Participation Constraint",
      instructions:
        "Establish proportionate clinical participation and decision-quality response.",
      activityType: "communication" as const,
    },
    {
      id: "activity.c3.review-dependencies",
      title: "Conduct Cross-Functional Dependency Review",
      instructions:
        "Update critical dependencies, owners, dates, and schedule implications.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c3.respond-communication-breakdown",
      title: "Respond to Communication Breakdown",
      instructions:
        "Record root cause, accountability, and corrective communication actions.",
      activityType: "communication" as const,
    },
    {
      id: "activity.c3.evaluate-first-deliverable",
      title: "Evaluate First Major Deliverable",
      instructions:
        "Assess quality evidence and support acceptance recommendation.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c3.provide-executive-update",
      title: "Provide Executive Progress Update",
      instructions:
        "Deliver accurate, concise, decision-useful status communication.",
      activityType: "communication" as const,
    },
    {
      id: "activity.c3.update-control-artifacts",
      title: "Update Execution Control Artifacts",
      instructions:
        "Update schedule, issue log, risk register, status report, and decision log.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c3.chapter-reflection",
      title: "Complete Early Execution Reflection",
      instructions:
        "Connect planning choices to execution outcomes and identify improvements.",
      activityType: "reflection" as const,
    },
  ],
  decisions: [
    {
      shortName: "vendor-staff",
      name: "vendor-staffing-substitution",
      title: "Vendor Staffing Substitution",
      situation:
        "The vendor requests approval of a staffing substitution during mobilization.",
      prompt: "Select the vendor staffing substitution response.",
      options: [
        {
          label: "Accept",
          description: "Accept the substitution without conditions.",
        },
        {
          label: "Conditionally accept",
          description: "Accept with documented conditions and evidence.",
        },
        { label: "Reject", description: "Reject the substitution." },
        {
          label: "Require corrective plan",
          description: "Require a corrective mobilization plan.",
        },
        {
          label: "Escalate commercially",
          description: "Escalate commercially through procurement.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "clinical-part",
      name: "clinical-participation-response",
      title: "Clinical Participation Response",
      situation:
        "Clinical leaders cannot sustain workshop attendance due to patient-care demand.",
      prompt: "Select the clinical participation response.",
      options: [
        {
          label: "Preserve schedule",
          description: "Preserve the original workshop schedule.",
        },
        {
          label: "Adjust engagement model",
          description:
            "Adjust clinical engagement to asynchronous and targeted sessions.",
        },
        {
          label: "Escalate capacity",
          description: "Escalate clinical capacity constraints to leadership.",
        },
        {
          label: "Phase workshops",
          description: "Phase workshops to match clinical availability.",
        },
        {
          label: "Accept reduced participation",
          description: "Accept reduced participation with documented risk.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "integration-fail",
      name: "integration-assumption-failure",
      title: "Integration Assumption Failure",
      situation:
        "A critical interface assumption is incomplete or incorrect during early execution.",
      prompt: "Select the integration assumption failure response.",
      options: [
        {
          label: "Absorb",
          description: "Absorb impact within the current plan.",
        },
        {
          label: "Replan",
          description: "Replan integration sequencing with owners.",
        },
        {
          label: "Raise change request",
          description: "Raise a formal change request.",
        },
        {
          label: "Escalate dependency",
          description: "Escalate the dependency to governance.",
        },
        {
          label: "Reduce scope",
          description: "Reduce scope to match integration reality.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "comm-breakdown",
      name: "communication-breakdown-response",
      title: "Communication Breakdown Response",
      situation:
        "Operations reports rework from inconsistent dependency communication.",
      prompt: "Select the communication breakdown response.",
      options: [
        {
          label: "Blame accountable team",
          description: "Assign blame to the accountable team.",
        },
        {
          label: "Conduct systems review",
          description: "Conduct a systems review of communication controls.",
        },
        {
          label: "Revise communication controls",
          description: "Revise communication controls and ownership.",
        },
        {
          label: "Escalate governance breach",
          description: "Escalate as a governance breach.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "deliverable-acc",
      name: "first-deliverable-acceptance",
      title: "First Deliverable Acceptance",
      situation:
        "Quality review presents findings requiring an acceptance recommendation.",
      prompt: "Recommend first deliverable acceptance disposition.",
      options: [
        { label: "Accept", description: "Accept the deliverable." },
        {
          label: "Conditionally accept",
          description: "Conditionally accept with remediation items.",
        },
        {
          label: "Reject and remediate",
          description: "Reject and require remediation.",
        },
        {
          label: "Escalate for authority",
          description: "Escalate acceptance authority to governance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "exec-status",
      name: "executive-status-position",
      title: "Executive Status Position",
      situation:
        "The sponsor requests compressed remediation to preserve a published milestone.",
      prompt: "Select the executive status communication position.",
      options: [
        {
          label: "Optimistic summary",
          description: "Present an optimistic progress summary.",
        },
        {
          label: "Transparent balanced report",
          description: "Present a transparent balanced status report.",
        },
        {
          label: "Risk-first escalation",
          description: "Lead with risk-first escalation.",
        },
        {
          label: "Defer update pending analysis",
          description: "Defer the executive update pending analysis.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
  ],

  learnerGuidance: {
    default:
      "Mobilize delivery teams, govern vendor onboarding, manage dependencies and quality, and navigate first deliverable acceptance under executive milestone pressure.",
    explorer:
      "Use document evidence and activity instructions as checklists. Compare trade-offs before each decision.",
    practitioner:
      "Balance stakeholder pressure with governance discipline and incomplete evidence.",
    leader:
      "Prioritize accountable trade-offs under ambiguity; keep safety, privacy, quality, and governance non-negotiable.",
  },
};

export const CHAPTER_4_CATALOG: ChapterCatalog = {
  order: 4,
  title: "Mid-Project Recovery",
  summary:
    "Diagnose project health breaches, contain damage, assess vendor and change impacts, and build an integrated recovery recommendation for steering authorization.",
  priorChapterId: "chapter-03",
  learningObjectives: [
    { id: "lo.chapter-04-crisis-diagnosis", theme: "crisis-diagnosis" },
    { id: "lo.chapter-04-recovery-leadership", theme: "recovery-leadership" },
    { id: "lo.chapter-04-governed-tradeoffs", theme: "governed-tradeoffs" },
  ],
  notification: {
    id: "notification.chapter-04-ready",
    title: "Chapter Four is ready",
    summary:
      "Chapter 4 activities, evidence, meetings, and decisions are available in the Workplace.",
    body: "Review chapter guidance, complete required activities, and resolve all chapter decisions to progress.",
  },
  documents: [
    {
      id: "document.c4.health-assessment",
      documentType: "measurement",
      title: "Mid-Project Health Assessment",
      summary:
        "Mid-Project Health Assessment for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.variance-analysis",
      documentType: "measurement",
      title: "Integrated Variance Analysis",
      summary:
        "Integrated Variance Analysis for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.root-cause-analysis",
      documentType: "analysis",
      title: "Root-Cause Analysis",
      summary:
        "Root-Cause Analysis for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.issue-log-update",
      documentType: "issue",
      title: "Issue Log — Recovery Update",
      summary:
        "Issue Log — Recovery Update for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.risk-register-update",
      documentType: "risk",
      title: "Risk Register — Recovery Update",
      summary:
        "Risk Register — Recovery Update for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.integrated-impact-assessment",
      documentType: "integration",
      title: "Integrated Impact Assessment",
      summary:
        "Integrated Impact Assessment for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.vendor-corrective-action",
      documentType: "procurement",
      title: "Vendor Corrective-Action Plan",
      summary:
        "Vendor Corrective-Action Plan for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.compliance-assessment",
      documentType: "compliance",
      title: "Compliance, Privacy, and Quality Assessment",
      summary:
        "Compliance, Privacy, and Quality Assessment for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.change-request",
      documentType: "change",
      title: "Formal Change Request Record",
      summary:
        "Formal Change Request Record for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.recovery-plan",
      documentType: "recovery",
      title: "Integrated Recovery Plan",
      summary:
        "Integrated Recovery Plan for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.revised-forecast",
      documentType: "forecast",
      title: "Revised Forecast",
      summary:
        "Revised Forecast for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.stakeholder-recovery-plan",
      documentType: "stakeholders",
      title: "Stakeholder Recovery Plan",
      summary:
        "Stakeholder Recovery Plan for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c4.steering-decision-record",
      documentType: "governance_record",
      title: "Steering Committee Recovery Decision Record",
      summary:
        "Steering Committee Recovery Decision Record for Connected Care Chapter 4. Supports integrated governance, traceability, and evidence-based decisions.",
    },
  ],
  messages: [
    {
      id: "message.c4.health-escalation",
      senderStakeholderId: "stakeholder.program-director",
      subject: "Project health breach",
      body: "Marcus notifies you that project-health tolerances have been breached.",
      catalogClass: "escalation",
    },
    {
      id: "message.c4.vendor-delay-cost-impact",
      senderStakeholderId: "stakeholder.vendor",
      subject: "Vendor delay and cost impact",
      body: "Maya reports missed commitment, revised timing, and potential commercial impact.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-04.vendor-response",
    },
    {
      id: "message.c4.compliance-quality-concern",
      senderStakeholderId: "stakeholder.privacy",
      subject: "Compliance recovery shortcut risk",
      body: "Aisha identifies a material risk in the proposed recovery shortcut.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-04.compliance-quality-protection",
    },
    {
      id: "message.c4.late-change-request",
      senderStakeholderId: "stakeholder.business-owner",
      subject: "Late change request",
      body: "Business stakeholder requests strategically attractive late scope.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-04.change-request-disposition",
    },
    {
      id: "message.c4.team-capacity-conflict",
      senderStakeholderId: "stakeholder.delivery-lead",
      subject: "Team capacity conflict",
      body: "Delivery lead escalates conflicting priorities and unsustainable workload.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-04.team-conflict-response",
    },
    {
      id: "message.c4.steering-recovery-request",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Integrated recovery request",
      body: "Steering secretariat requests an integrated recovery recommendation.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c4.recovery-authorization",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Recovery authorization outcome",
      body: "Steering secretariat communicates recovery approval, conditions, or escalation.",
      catalogClass: "informational",
    },
  ],
  meetings: [
    {
      id: "meeting.recovery.triage",
      title: "Recovery Triage Session",
      purpose: "Diagnose health breaches and prioritize containment",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Health assessment",
        "Tolerance breaches",
        "Containment options",
        "Immediate owners",
        "Escalation threshold",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.recovery.vendor",
      title: "Vendor Recovery Review",
      purpose: "Evaluate vendor corrective action and commercial options",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Vendor performance",
        "Corrective action plan",
        "Commercial impact",
        "Relationship risk",
        "Recommended response",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.recovery.change-control",
      title: "Recovery Change Control Review",
      purpose: "Assess late change request and integrated impact",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Change rationale",
        "Impact assessment",
        "Governance authority",
        "Disposition options",
        "Baseline implications",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.recovery.steering-review",
      title: "Steering Committee Recovery Review",
      purpose: "Present integrated recovery recommendation",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Recovery strategy",
        "Trade-offs",
        "Quality and compliance protections",
        "Authorization request",
        "Communication direction",
      ],
      estimatedMinutes: 60,
    },
  ],
  activities: [
    {
      id: "activity.c4.diagnose-health",
      title: "Diagnose Project Health",
      instructions:
        "Document evidence-based health assessment and tolerance breaches.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c4.separate-risk-issue",
      title: "Distinguish Risks from Issues",
      instructions:
        "Correct materialized issues, future risks, owners, and response states.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c4.prioritize-containment",
      title: "Prioritize Immediate Containment",
      instructions: "Recommend proportionate containment actions with owners.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c4.evaluate-vendor-recovery",
      title: "Evaluate Vendor Recovery Options",
      instructions:
        "Assess contract, performance, schedule, and commercial recovery options.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c4.assess-compliance-quality",
      title: "Assess Compliance and Quality Protection",
      instructions:
        "Document material concern, controls, authority, and work-continuation position.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c4.assess-change-request",
      title: "Assess Late Change Request",
      instructions:
        "Prepare integrated impact assessment and disposition recommendation.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c4.resolve-team-conflict",
      title: "Resolve or Reduce Team Conflict",
      instructions:
        "Document conflict approach, priorities, workload implications, and next actions.",
      activityType: "communication" as const,
    },
    {
      id: "activity.c4.build-recovery-plan",
      title: "Build Integrated Recovery Plan",
      instructions:
        "Integrate recovery actions, forecast, quality protections, and triggers.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c4.prepare-steering-review",
      title: "Prepare Steering Committee Recovery Recommendation",
      instructions: "Complete decision brief and supporting recovery evidence.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c4.present-recovery",
      title: "Present Recovery Recommendation",
      instructions:
        "Complete steering review and submit recovery recommendation.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c4.update-after-authorization",
      title: "Update Governance Artifacts After Authorization",
      instructions:
        "Update decision record, forecast, risk, issue, schedule, and cost artifacts.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c4.chapter-reflection",
      title: "Complete Recovery Reflection",
      instructions:
        "Analyze recovery trade-offs, leadership behavior, and consequences.",
      activityType: "reflection" as const,
    },
  ],
  decisions: [
    {
      shortName: "containment",
      name: "immediate-containment",
      title: "Immediate Containment",
      situation:
        "Project health tolerances are breached and immediate containment is required.",
      prompt: "Select immediate containment actions.",
      options: [
        {
          label: "Targeted pause",
          description:
            "Pause affected workstreams while continuing safe activities.",
        },
        {
          label: "Continue with controls",
          description: "Continue with enhanced controls and monitoring.",
        },
        {
          label: "Resource reallocation",
          description: "Reallocate resources to critical path recovery.",
        },
        {
          label: "Immediate escalation",
          description: "Escalate immediately to executive governance.",
        },
        {
          label: "No containment",
          description: "Decline containment and proceed as planned.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "vendor-resp",
      name: "vendor-response",
      title: "Vendor Response",
      situation:
        "The vendor reports missed commitments and revised timing with commercial impact.",
      prompt: "Select the vendor response strategy.",
      options: [
        {
          label: "Accept proposal",
          description: "Accept the vendor recovery proposal.",
        },
        {
          label: "Renegotiate",
          description: "Renegotiate commitments and commercial terms.",
        },
        {
          label: "Require corrective action",
          description: "Require a formal corrective-action plan.",
        },
        {
          label: "Invoke remedies",
          description: "Invoke contractual remedies.",
        },
        {
          label: "Replace scope",
          description: "Replace failing scope components.",
        },
        {
          label: "Escalate commercially",
          description: "Escalate commercially through procurement.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "compliance-prot",
      name: "compliance-quality-protection",
      title: "Compliance and Quality Protection",
      situation:
        "A material compliance or quality risk appears in a proposed recovery shortcut.",
      prompt: "Select compliance and quality protection actions.",
      options: [
        {
          label: "Pause affected work",
          description: "Pause affected work until controls are verified.",
        },
        {
          label: "Targeted remediation",
          description: "Implement targeted remediation with evidence.",
        },
        {
          label: "Specialist review",
          description: "Commission specialist review before continuing.",
        },
        {
          label: "Revise criteria through governance",
          description: "Revise acceptance criteria through governance.",
        },
        {
          label: "Reject shortcut",
          description: "Reject the recovery shortcut.",
        },
        {
          label: "Escalate residual risk",
          description: "Escalate residual risk for explicit acceptance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "change-disp",
      name: "change-request-disposition",
      title: "Change Request Disposition",
      situation:
        "A senior stakeholder requests strategically attractive late scope.",
      prompt: "Recommend change request disposition.",
      options: [
        { label: "Approve", description: "Approve the change request." },
        {
          label: "Approve with modification",
          description: "Approve with modifications and conditions.",
        },
        { label: "Defer", description: "Defer pending integrated analysis." },
        { label: "Reject", description: "Reject the change request." },
        {
          label: "Split to later release",
          description: "Split scope to a later release.",
        },
        {
          label: "Request further analysis",
          description: "Request further analysis before disposition.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "team-conflict",
      name: "team-conflict-response",
      title: "Team Conflict Response",
      situation:
        "Delivery lead escalates conflicting priorities and unsustainable workload.",
      prompt: "Select the team conflict response approach.",
      options: [
        {
          label: "Collaborate",
          description: "Facilitate collaborative problem solving.",
        },
        {
          label: "Compromise",
          description: "Negotiate a compromise across priorities.",
        },
        {
          label: "Direct",
          description: "Direct a priority decision from authority.",
        },
        {
          label: "Accommodate",
          description: "Accommodate the escalated concern.",
        },
        {
          label: "Avoid",
          description: "Defer conflict resolution temporarily.",
        },
        {
          label: "Facilitate escalation",
          description: "Facilitate escalation to governance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "recovery-strat",
      name: "recovery-strategy",
      title: "Recovery Strategy",
      situation:
        "Steering committee requests an integrated recovery strategy with explicit trade-offs.",
      prompt: "Select the integrated recovery strategy.",
      options: [
        {
          label: "Extend schedule",
          description: "Extend schedule to protect quality and scope.",
        },
        {
          label: "Reduce scope",
          description: "Reduce scope to recover timeline.",
        },
        {
          label: "Increase investment",
          description: "Increase investment to recover schedule and scope.",
        },
        {
          label: "Phase delivery",
          description: "Phase delivery to reduce exposure.",
        },
        {
          label: "Resequence work",
          description: "Resequence work to address root causes.",
        },
        {
          label: "Replace failing component",
          description: "Replace a failing component or vendor path.",
        },
        {
          label: "Combined controlled recovery",
          description:
            "Combine controlled schedule, scope, and investment actions.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "steering-commit",
      name: "steering-committee-commitment",
      title: "Steering Committee Commitment",
      situation:
        "Steering committee requests a commitment position on recovery authorization.",
      prompt: "Select the steering committee commitment position.",
      options: [
        {
          label: "Fixed guarantee",
          description: "Offer a fixed recovery guarantee.",
        },
        {
          label: "Confidence range",
          description: "Present a confidence range with assumptions.",
        },
        {
          label: "Conditional commitment",
          description: "Offer conditional commitment tied to evidence.",
        },
        {
          label: "No commitment",
          description: "Decline commitment pending further analysis.",
        },
        {
          label: "Request executive direction",
          description: "Request executive direction on tolerances.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
  ],
  crises: [
    {
      id: "crisis.northstar.chapter-04.project-health-breach",
      title: "Project health tolerance breach",
      relatedDecisionIds: [
        "decision.northstar.chapter-04.immediate-containment",
      ],
      relatedStakeholderIds: [
        "stakeholder.program-director",
        "stakeholder.sponsor",
      ],
      resolutionDecisionId: "decision.northstar.chapter-04.recovery-strategy",
    },
  ],
  learnerGuidance: {
    default:
      "Diagnose project health breaches, contain damage, assess vendor and change impacts, and build an integrated recovery recommendation for steering authorization.",
    explorer:
      "Use document evidence and activity instructions as checklists. Compare trade-offs before each decision.",
    practitioner:
      "Balance stakeholder pressure with governance discipline and incomplete evidence.",
    leader:
      "Prioritize accountable trade-offs under ambiguity; keep safety, privacy, quality, and governance non-negotiable.",
  },
};

export const CHAPTER_5_CATALOG: ChapterCatalog = {
  order: 5,
  title: "Delivery and Readiness",
  summary:
    "Assess segmented readiness, classify defects, respond to adoption resistance, resolve operational ownership, and recommend a deployment strategy to steering.",
  priorChapterId: "chapter-04",
  learningObjectives: [
    { id: "lo.chapter-05-readiness-evidence", theme: "readiness-evidence" },
    { id: "lo.chapter-05-adoption-governance", theme: "adoption-governance" },
    { id: "lo.chapter-05-deployment-judgment", theme: "deployment-judgment" },
  ],
  notification: {
    id: "notification.chapter-05-ready",
    title: "Chapter Five is ready",
    summary:
      "Chapter 5 activities, evidence, meetings, and decisions are available in the Workplace.",
    body: "Review chapter guidance, complete required activities, and resolve all chapter decisions to progress.",
  },
  documents: [
    {
      id: "document.c5.recovery-progress-report",
      documentType: "measurement",
      title: "Recovery Progress Report",
      summary:
        "Recovery Progress Report for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.integrated-readiness-checklist",
      documentType: "readiness",
      title: "Integrated Readiness Checklist",
      summary:
        "Integrated Readiness Checklist for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.site-readiness-scorecard",
      documentType: "readiness",
      title: "Site and Department Readiness Scorecard",
      summary:
        "Site and Department Readiness Scorecard for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.defect-exception-register",
      documentType: "quality",
      title: "Defect and Exception Register",
      summary:
        "Defect and Exception Register for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.residual-risk-register",
      documentType: "risk",
      title: "Residual Risk Register",
      summary:
        "Residual Risk Register for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.adoption-issue-log",
      documentType: "stakeholders",
      title: "Adoption Issue Log",
      summary:
        "Adoption Issue Log for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.training-effectiveness-report",
      documentType: "adoption",
      title: "Training Completion and Effectiveness Report",
      summary:
        "Training Completion and Effectiveness Report for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.support-operating-model",
      documentType: "operations",
      title: "Support Operating Model",
      summary:
        "Support Operating Model for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.transition-responsibility-matrix",
      documentType: "governance",
      title: "Transition Responsibility Matrix",
      summary:
        "Transition Responsibility Matrix for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.vendor-obligation-assessment",
      documentType: "procurement",
      title: "Vendor Obligation Assessment",
      summary:
        "Vendor Obligation Assessment for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.deployment-options-analysis",
      documentType: "decision_support",
      title: "Deployment Options Analysis",
      summary:
        "Deployment Options Analysis for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.contingency-rollback-plan",
      documentType: "risk",
      title: "Contingency and Rollback Plan",
      summary:
        "Contingency and Rollback Plan for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.integrated-readiness-recommendation",
      documentType: "approval",
      title: "Integrated Readiness Recommendation",
      summary:
        "Integrated Readiness Recommendation for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.executive-decision-brief",
      documentType: "governance",
      title: "Go-Live Executive Decision Brief",
      summary:
        "Go-Live Executive Decision Brief for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c5.go-live-decision-record",
      documentType: "governance_record",
      title: "Go-Live Decision Record",
      summary:
        "Go-Live Decision Record for Connected Care Chapter 5. Supports integrated governance, traceability, and evidence-based decisions.",
    },
  ],
  messages: [
    {
      id: "message.c5.positive-recovery-summary",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Confident recovery summary request",
      body: "Elena requests a confident executive summary of recovery progress.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-05.recovery-communication-position",
    },
    {
      id: "message.c5.site-readiness-gaps",
      senderStakeholderId: "stakeholder.operations",
      subject: "Site readiness gaps",
      body: "Operations reports uneven readiness across sites and functions.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-05.readiness-segmentation",
    },
    {
      id: "message.c5.defect-classification-escalation",
      senderStakeholderId: "stakeholder.quality",
      subject: "Defect classification dispute",
      body: "Quality challenges classification of a potentially release-blocking defect.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-05.defect-disposition",
    },
    {
      id: "message.c5.frontline-training-complaint",
      senderStakeholderId: "stakeholder.frontline-manager",
      subject: "Frontline training complaint",
      body: "Frontline manager reports workflow burden, low training confidence, and resistance.",
      catalogClass: "actionable",
    },
    {
      id: "message.c5.vendor-additional-cost-claim",
      senderStakeholderId: "stakeholder.vendor",
      subject: "Vendor additional cost claim",
      body: "Maya claims stabilization work is outside contract scope.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-05.vendor-stabilization-responsibility",
    },
    {
      id: "message.c5.support-ownership-gap",
      senderStakeholderId: "stakeholder.support-lead",
      subject: "Support ownership gap",
      body: "Support lead requests named ownership and escalation model for post-deployment service.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-05.operational-ownership-model",
    },
    {
      id: "message.c5.compliance-readiness-evidence",
      senderStakeholderId: "stakeholder.privacy",
      subject: "Compliance readiness evidence",
      body: "Aisha requests traceable readiness evidence and residual-risk ownership.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c5.manager-engagement-warning",
      senderStakeholderId: "stakeholder.change-lead",
      subject: "Manager engagement warning",
      body: "Change lead warns manager support and training reinforcement are inconsistent.",
      catalogClass: "actionable",
    },
    {
      id: "message.c5.remaining-contingency",
      senderStakeholderId: "stakeholder.finance",
      subject: "Remaining contingency request",
      body: "Thomas requests remaining contingency, forecast, and exposure analysis.",
      catalogClass: "actionable",
    },
    {
      id: "message.c5.deployment-recommendation-request",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Deployment recommendation request",
      body: "Steering secretariat requests deployment strategy recommendation.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-05.deployment-strategy-recommendation",
    },
    {
      id: "message.c5.go-live-outcome",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Go-live authorization outcome",
      body: "Steering secretariat communicates go-live authorization, conditions, or delay.",
      catalogClass: "informational",
    },
  ],
  meetings: [
    {
      id: "meeting.readiness.recovery-progress",
      title: "Recovery Progress Review",
      purpose: "Review recovery trends and remaining exposure",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Recovery action status",
        "Trend analysis",
        "Residual exposure",
        "Forecast confidence",
        "Readiness implications",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.readiness.working-session",
      title: "Readiness Working Session",
      purpose: "Address segmented readiness gaps by site and function",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Readiness scorecards",
        "Gap prioritization",
        "Owner assignments",
        "Intervention plans",
        "Confidence review",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.readiness.defect-quality",
      title: "Defect and Quality Disposition Session",
      purpose: "Classify defects and exceptions for release decision",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Defect severity",
        "Workarounds",
        "Residual risk",
        "Release disposition",
        "Quality escalation",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.readiness.adoption-escalation",
      title: "Adoption Escalation Session",
      purpose: "Respond to adoption resistance and training gaps",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Resistance signals",
        "Root causes",
        "Intervention options",
        "Manager engagement",
        "Deployment impact",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.readiness.vendor-commercial-support",
      title: "Vendor Commercial and Support Session",
      purpose: "Resolve vendor obligation and support ownership gaps",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Vendor claims",
        "Contract evidence",
        "Support model",
        "Commercial position",
        "Ownership gaps",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.readiness.integrated-review",
      title: "Integrated Readiness Review",
      purpose: "Present go-live recommendation with evidence",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Readiness by domain",
        "Residual risk",
        "Contingency and rollback",
        "Recommendation",
        "Conditions and owners",
      ],
      estimatedMinutes: 60,
    },
  ],
  activities: [
    {
      id: "activity.c5.review-recovery-evidence",
      title: "Review Recovery Evidence",
      instructions:
        "Reconcile recovery actions with trends and unresolved exposure.",
      activityType: "review" as const,
    },
    {
      id: "activity.c5.reconcile-milestones",
      title: "Reconcile Milestone and Forecast Status",
      instructions:
        "Align milestone status, forecast, confidence, and conditions.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.assess-segmented-readiness",
      title: "Assess Readiness by Function and Site",
      instructions:
        "Complete readiness scorecards with gaps, owners, and confidence.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.classify-defects",
      title: "Classify Defects and Exceptions",
      instructions:
        "Correctly classify release-blocking, workaround, and residual-risk items.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.analyze-adoption",
      title: "Analyze Adoption Resistance",
      instructions:
        "Document resistance signals, root causes, affected groups, and options.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.respond-adoption",
      title: "Respond to Adoption Escalation",
      instructions: "Assign targeted adoption interventions and ownership.",
      activityType: "communication" as const,
    },
    {
      id: "activity.c5.resolve-operational-ownership",
      title: "Establish Operational Ownership",
      instructions:
        "Confirm named roles accept service, support, data, and benefits responsibilities.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c5.evaluate-vendor-obligations",
      title: "Evaluate Vendor Stabilization Obligations",
      instructions:
        "Prepare contract and evidence-based vendor responsibility position.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.validate-training",
      title: "Validate Training Effectiveness",
      instructions:
        "Assess completion, competence, confidence, gaps, and reinforcement actions.",
      activityType: "review" as const,
    },
    {
      id: "activity.c5.update-risks-issues",
      title: "Update Readiness Risks and Issues",
      instructions:
        "Update residual risks, defects, adoption issues, and ownership.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c5.evaluate-deployment-options",
      title: "Evaluate Deployment Strategies",
      instructions:
        "Compare full, phased, pilot, conditional, and delayed deployment options.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c5.prepare-readiness-recommendation",
      title: "Prepare Integrated Readiness Recommendation",
      instructions:
        "Complete evidence package, residual risk, contingency, and recommendation.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c5.present-go-live-recommendation",
      title: "Present Go-Live Recommendation",
      instructions:
        "Complete integrated readiness review and submit recommendation.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c5.chapter-reflection",
      title: "Complete Readiness Reflection",
      instructions:
        "Reflect on evidence, pressure, quality, adoption, and risk acceptance.",
      activityType: "reflection" as const,
    },
  ],
  decisions: [
    {
      shortName: "recovery-comm",
      name: "recovery-communication-position",
      title: "Recovery Communication Position",
      situation:
        "The sponsor requests a confident executive summary of recovery progress.",
      prompt: "Select the recovery communication position.",
      options: [
        {
          label: "Confident executive summary",
          description: "Present a confident recovery narrative.",
        },
        {
          label: "Balanced evidence-based summary",
          description: "Present balanced evidence-based recovery status.",
        },
        {
          label: "Cautious qualified summary",
          description: "Present cautious qualified recovery status.",
        },
        {
          label: "Defer until trends confirmed",
          description: "Defer executive summary until trends are confirmed.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "readiness-seg",
      name: "readiness-segmentation",
      title: "Readiness Segmentation",
      situation:
        "Operations reports uneven readiness across sites and functions.",
      prompt: "Select readiness segmentation approach.",
      options: [
        {
          label: "Enterprise average readiness",
          description: "Report enterprise-average readiness.",
        },
        {
          label: "Segmented readiness by site",
          description: "Segment readiness by site and function.",
        },
        {
          label: "Risk-tiered segmentation",
          description: "Apply risk-tiered readiness segmentation.",
        },
        {
          label: "Defer segmentation pending data",
          description: "Defer segmentation until data quality improves.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "defect-disp",
      name: "defect-disposition",
      title: "Defect Disposition",
      situation:
        "Quality challenges classification of a potentially release-blocking defect.",
      prompt: "Select defect disposition.",
      options: [
        {
          label: "Release blocker",
          description: "Classify as release-blocking.",
        },
        {
          label: "Workaround with residual risk",
          description: "Allow workaround with documented residual risk.",
        },
        {
          label: "Defer to post-go-live",
          description: "Defer remediation to post-go-live with governance.",
        },
        {
          label: "Reclassify as enhancement",
          description: "Reclassify as enhancement.",
        },
        {
          label: "Duplicate or invalid",
          description: "Mark as duplicate or invalid.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "adoption-resp",
      name: "adoption-response",
      title: "Adoption Response",
      situation:
        "Frontline managers report workflow burden and low training confidence.",
      prompt: "Select adoption escalation response.",
      options: [
        {
          label: "Mandatory compliance push",
          description: "Push mandatory compliance without redesign.",
        },
        {
          label: "Targeted consultation and redesign",
          description: "Conduct targeted consultation and redesign.",
        },
        {
          label: "Enhanced support and coaching",
          description: "Deploy enhanced support and coaching.",
        },
        {
          label: "Leadership intervention",
          description: "Request leadership intervention with affected groups.",
        },
        {
          label: "Delay affected wave",
          description: "Delay deployment for affected sites.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "vendor-stab-resp",
      name: "vendor-stabilization-responsibility",
      title: "Vendor Stabilization Responsibility",
      situation: "Vendor claims stabilization work is outside contract scope.",
      prompt: "Select vendor stabilization responsibility position.",
      options: [
        {
          label: "Accept vendor position",
          description: "Accept vendor narrow responsibility position.",
        },
        {
          label: "Negotiate shared responsibility",
          description: "Negotiate shared stabilization responsibilities.",
        },
        {
          label: "Enforce contract obligations",
          description: "Enforce contract stabilization obligations.",
        },
        {
          label: "Escalate commercially",
          description: "Escalate commercially with evidence.",
        },
        {
          label: "Fund internal stabilization",
          description: "Fund internal stabilization and recover later.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "ops-ownership",
      name: "operational-ownership-model",
      title: "Operational Ownership Model",
      situation:
        "Support lead requests named ownership for post-deployment service.",
      prompt: "Select operational ownership model.",
      options: [
        {
          label: "Centralized IT ownership",
          description: "Centralize ownership in IT service management.",
        },
        {
          label: "Distributed functional ownership",
          description:
            "Distribute ownership across functions with coordination.",
        },
        {
          label: "Transitional hypercare ownership",
          description: "Use transitional hypercare then handover.",
        },
        {
          label: "Unresolved pending steering",
          description: "Leave ownership unresolved pending steering decision.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "deploy-strategy",
      name: "deployment-strategy-recommendation",
      title: "Deployment Strategy Recommendation",
      situation:
        "Steering committee requests deployment strategy recommendation.",
      prompt: "Recommend deployment strategy to steering committee.",
      options: [
        {
          label: "Full deployment",
          description: "Recommend full enterprise deployment.",
        },
        {
          label: "Phased deployment",
          description: "Recommend phased deployment by site or capability.",
        },
        {
          label: "Pilot-first",
          description: "Recommend pilot-first with expansion gates.",
        },
        {
          label: "Limited deployment with conditions",
          description: "Recommend limited deployment with conditions.",
        },
        { label: "Postpone", description: "Recommend postponement." },
        {
          label: "Deploy with risk acceptance",
          description:
            "Recommend deployment with formal risk acceptance and enhanced controls.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
  ],

  learnerGuidance: {
    default:
      "Assess segmented readiness, classify defects, respond to adoption resistance, resolve operational ownership, and recommend a deployment strategy to steering.",
    explorer:
      "Use document evidence and activity instructions as checklists. Compare trade-offs before each decision.",
    practitioner:
      "Balance stakeholder pressure with governance discipline and incomplete evidence.",
    leader:
      "Prioritize accountable trade-offs under ambiguity; keep safety, privacy, quality, and governance non-negotiable.",
  },
};

export const CHAPTER_6_CATALOG: ChapterCatalog = {
  order: 6,
  title: "Closure and Benefits Realization",
  summary:
    "Coordinate deployment incidents, manage hypercare exit, verify acceptance, transfer residual obligations, establish benefits monitoring, and recommend formal closure.",
  priorChapterId: "chapter-05",
  learningObjectives: [
    { id: "lo.chapter-06-incident-governance", theme: "incident-governance" },
    {
      id: "lo.chapter-06-benefits-accountability",
      theme: "benefits-accountability",
    },
    { id: "lo.chapter-06-responsible-closure", theme: "responsible-closure" },
  ],
  notification: {
    id: "notification.chapter-06-ready",
    title: "Chapter Six is ready",
    summary:
      "Chapter 6 activities, evidence, meetings, and decisions are available in the Workplace.",
    body: "Review chapter guidance, complete required activities, and resolve all chapter decisions to progress.",
  },
  documents: [
    {
      id: "document.c6.deployment-authorization",
      documentType: "governance",
      title: "Deployment Authorization Record",
      summary:
        "Deployment Authorization Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.command-center-plan",
      documentType: "operations",
      title: "Deployment Coordination Plan",
      summary:
        "Deployment Coordination Plan for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.incident-log",
      documentType: "issue",
      title: "Deployment Incident Log",
      summary:
        "Deployment Incident Log for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.deployment-decision-record",
      documentType: "governance",
      title: "Continue, Pause, Restrict, or Rollback Decision Record",
      summary:
        "Continue, Pause, Restrict, or Rollback Decision Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.contingency-activation-record",
      documentType: "risk",
      title: "Contingency or Rollback Activation Record",
      summary:
        "Contingency or Rollback Activation Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.hypercare-dashboard",
      documentType: "measurement",
      title: "Hypercare Dashboard",
      summary:
        "Hypercare Dashboard for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.stabilization-exit-assessment",
      documentType: "transition",
      title: "Stabilization and Hypercare Exit Assessment",
      summary:
        "Stabilization and Hypercare Exit Assessment for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.formal-acceptance-package",
      documentType: "acceptance",
      title: "Formal Acceptance Package",
      summary:
        "Formal Acceptance Package for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.residual-transfer-register",
      documentType: "transition",
      title: "Residual Risk, Issue, Defect, and Action Transfer Register",
      summary:
        "Residual Risk, Issue, Defect, and Action Transfer Register for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.operational-handover",
      documentType: "transition",
      title: "Operational Handover Document",
      summary:
        "Operational Handover Document for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.knowledge-transfer-record",
      documentType: "learning",
      title: "Knowledge-Transfer Record",
      summary:
        "Knowledge-Transfer Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.benefits-realization-plan",
      documentType: "value",
      title: "Benefits Realization Plan",
      summary:
        "Benefits Realization Plan for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.benefit-measurement-schedule",
      documentType: "measurement",
      title: "Benefit Baseline and Measurement Schedule",
      summary:
        "Benefit Baseline and Measurement Schedule for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.final-financial-report",
      documentType: "finance",
      title: "Final Financial Report",
      summary:
        "Final Financial Report for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.procurement-closure-record",
      documentType: "procurement",
      title: "Procurement Closure Record",
      summary:
        "Procurement Closure Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.vendor-performance-evaluation",
      documentType: "procurement",
      title: "Vendor Performance Evaluation",
      summary:
        "Vendor Performance Evaluation for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.lessons-register",
      documentType: "learning",
      title: "Lessons Learned Register",
      summary:
        "Lessons Learned Register for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.organizational-asset-updates",
      documentType: "pmo",
      title: "Organizational Process Asset Update Record",
      summary:
        "Organizational Process Asset Update Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.resource-release-plan",
      documentType: "resources",
      title: "Resource Release and Recognition Plan",
      summary:
        "Resource Release and Recognition Plan for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.final-project-report",
      documentType: "closure",
      title: "Final Project Report",
      summary:
        "Final Project Report for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
    {
      id: "document.c6.closure-approval-record",
      documentType: "governance_record",
      title: "Project Closure Approval Record",
      summary:
        "Project Closure Approval Record for Connected Care Chapter 6. Supports integrated governance, traceability, and evidence-based decisions.",
    },
  ],
  messages: [
    {
      id: "message.c6.deployment-authorization-confirmation",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Deployment authorization confirmed",
      body: "Steering secretariat confirms active deployment authority and conditions.",
      catalogClass: "informational",
    },
    {
      id: "message.c6.incident-notification",
      senderStakeholderId: "stakeholder.incident-lead",
      subject: "Deployment incident notification",
      body: "Incident lead reports early operational incident and known impact.",
      catalogClass: "escalation",
    },
    {
      id: "message.c6.sponsor-immediate-status",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Immediate executive status",
      body: "Elena requests an immediate executive status position during deployment.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c6.frontline-impact-report",
      senderStakeholderId: "stakeholder.frontline-manager",
      subject: "Frontline impact report",
      body: "Frontline manager describes user impact, workaround burden, and patient-service effects.",
      catalogClass: "informational",
    },
    {
      id: "message.c6.vendor-responsibility-position",
      senderStakeholderId: "stakeholder.vendor",
      subject: "Vendor incident responsibility",
      body: "Maya states vendor responsibility and proposed incident response.",
      catalogClass: "actionable",
    },
    {
      id: "message.c6.compliance-exception",
      senderStakeholderId: "stakeholder.privacy",
      subject: "Compliance exception during deployment",
      body: "Aisha raises a control concern during deployment.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-06.incident-response-strategy",
    },
    {
      id: "message.c6.continue-pause-rollback-request",
      senderStakeholderId: "stakeholder.incident-lead",
      subject: "Continue pause rollback request",
      body: "Incident governance requests deployment-path recommendation.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-06.deployment-continuation",
    },
    {
      id: "message.c6.hypercare-ownership-request",
      senderStakeholderId: "stakeholder.support-lead",
      subject: "Hypercare ownership request",
      body: "Operational owner requests hypercare exit and normal ownership decision.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-06.hypercare-exit",
    },
    {
      id: "message.c6.final-forecast-commitments",
      senderStakeholderId: "stakeholder.finance",
      subject: "Final forecast and commitments",
      body: "Thomas requests final forecast, outstanding commitments, and contingency disposition.",
      catalogClass: "actionable",
    },
    {
      id: "message.c6.vendor-final-claim",
      senderStakeholderId: "stakeholder.procurement",
      subject: "Vendor final claim",
      body: "Procurement presents final invoice, claim, warranty, or support obligation.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-06.vendor-financial-closure",
    },
    {
      id: "message.c6.acceptance-request",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Formal acceptance request",
      body: "Sponsor requests formal acceptance of delivered scope.",
      catalogClass: "decision_triggering",
      relatedDecisionId: "decision.northstar.chapter-06.acceptance-position",
    },
    {
      id: "message.c6.benefits-reporting-request",
      senderStakeholderId: "stakeholder.sponsor",
      subject: "Benefits reporting request",
      body: "Executive leadership requests early benefit results for final reporting.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-06.benefits-reporting-position",
    },
    {
      id: "message.c6.resource-release-question",
      senderStakeholderId: "stakeholder.delivery-lead",
      subject: "Resource release question",
      body: "Functional manager requests release timing and remaining obligations.",
      catalogClass: "actionable",
    },
    {
      id: "message.c6.lessons-learned-invitation",
      senderStakeholderId: "stakeholder.pmo",
      subject: "Lessons learned invitation",
      body: "PMO invites participation and requests evidence-based lessons.",
      catalogClass: "preparation_required",
    },
    {
      id: "message.c6.closure-readiness-request",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Closure readiness request",
      body: "Steering secretariat requests final closure recommendation.",
      catalogClass: "decision_triggering",
      relatedDecisionId:
        "decision.northstar.chapter-06.final-closure-recommendation",
    },
    {
      id: "message.c6.closure-approval",
      senderStakeholderId: "stakeholder.steering-secretariat",
      subject: "Closure approval outcome",
      body: "Steering secretariat communicates closure approval, conditions, or deferral.",
      catalogClass: "informational",
    },
  ],
  meetings: [
    {
      id: "meeting.deployment.command-review",
      title: "Deployment Command Review",
      purpose: "Confirm deployment authority, roles, and thresholds",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Authority confirmation",
        "Command roles",
        "Escalation thresholds",
        "Communications plan",
        "Contingency readiness",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.deployment.incident-coordination",
      title: "Deployment Incident Coordination",
      purpose: "Coordinate incident response and deployment path decisions",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Incident timeline",
        "Impact assessment",
        "Containment status",
        "Deployment path options",
        "Decision authority",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.deployment.hypercare-review",
      title: "Hypercare and Stabilization Review",
      purpose: "Review hypercare trends and exit criteria",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Hypercare metrics",
        "Defect and support trends",
        "Adoption signals",
        "Exit criteria",
        "Ownership transition",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.closure.formal-acceptance",
      title: "Formal Acceptance Review",
      purpose: "Review acceptance package and exceptions",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Delivered scope",
        "Acceptance criteria",
        "Exceptions and warranties",
        "Obligations",
        "Acceptance recommendation",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.closure.benefits-transition",
      title: "Benefits and Transition Review",
      purpose: "Confirm benefits monitoring and operational handover",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Benefits measures",
        "Ownership acceptance",
        "Handover evidence",
        "Residual transfer",
        "Monitoring cadence",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.closure.lessons-learned",
      title: "Lessons Learned Workshop",
      purpose: "Capture validated lessons and improvement owners",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "What worked",
        "What failed",
        "Evidence-based lessons",
        "Improvement recommendations",
        "Asset updates",
      ],
      estimatedMinutes: 60,
    },
    {
      id: "meeting.closure.final-steering-review",
      title: "Final Steering Closure Review",
      purpose: "Present final closure recommendation",
      participantStakeholderIds: [
        ...NS.corePlanning,
        "stakeholder.sponsor",
        "stakeholder.change-lead",
      ],
      agendaTitles: [
        "Final report summary",
        "Obligation transfer",
        "Financial reconciliation",
        "Benefits position",
        "Closure recommendation",
      ],
      estimatedMinutes: 60,
    },
  ],
  activities: [
    {
      id: "activity.c6.confirm-deployment-authority",
      title: "Confirm Deployment Authority",
      instructions:
        "Confirm conditions, roles, thresholds, communications, and rollback authority.",
      activityType: "review" as const,
    },
    {
      id: "activity.c6.coordinate-deployment",
      title: "Coordinate Deployment",
      instructions: "Activate command structure and govern deployment actions.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c6.assess-incident",
      title: "Assess Early Operational Incident",
      instructions:
        "Document impact, evidence, containment, and decision thresholds.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c6.recommend-deployment-path",
      title: "Recommend Continue, Pause, Restrict, or Roll Back",
      instructions:
        "Submit authoritative deployment-path decision with evidence.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.manage-hypercare",
      title: "Manage Hypercare and Stabilization",
      instructions:
        "Review incident, defect, support, adoption, vendor, and ownership trends.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c6.determine-hypercare-exit",
      title: "Determine Hypercare Exit",
      instructions:
        "Recommend hypercare exit based on criteria, trend, and capacity.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c6.verify-acceptance",
      title: "Verify Formal Acceptance Evidence",
      instructions:
        "Trace delivered scope, criteria, exceptions, and obligations.",
      activityType: "review" as const,
    },
    {
      id: "activity.c6.transfer-residual-work",
      title: "Transfer Residual Risks and Actions",
      instructions:
        "Ensure every continuing item has accepted owner, date, and governance path.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.confirm-operational-handover",
      title: "Confirm Operational Handover",
      instructions:
        "Confirm operational, technical, clinical, data, compliance, and support ownership.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c6.establish-benefits-monitoring",
      title: "Establish Benefits Monitoring",
      instructions:
        "Define measures, baselines, targets, data, owners, and escalation.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.reconcile-finance-procurement",
      title: "Reconcile Finance and Procurement",
      instructions:
        "Reconcile actuals, commitments, invoices, claims, and contingency.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c6.evaluate-vendor-performance",
      title: "Evaluate Vendor Performance",
      instructions: "Complete evidence-based vendor performance evaluation.",
      activityType: "analysis" as const,
    },
    {
      id: "activity.c6.facilitate-lessons",
      title: "Facilitate Lessons Learned",
      instructions:
        "Record validated lessons, recommendations, and improvement owners.",
      activityType: "practice" as const,
    },
    {
      id: "activity.c6.update-organizational-assets",
      title: "Update Organizational Process Assets",
      instructions:
        "Identify required standards, templates, controls, or guidance changes.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.plan-resource-release",
      title: "Plan Resource Release and Recognition",
      instructions:
        "Document release sequence, continuity, feedback, and recognition.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.prepare-final-report",
      title: "Prepare Final Project Report",
      instructions:
        "Summarize delivery, acceptance, performance, benefits, finance, and learning.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.recommend-closure",
      title: "Recommend Formal Project Closure",
      instructions:
        "Submit closure decision with evidence that governance can end safely.",
      activityType: "artifact" as const,
    },
    {
      id: "activity.c6.final-reflection",
      title: "Complete Final Simulation Reflection",
      instructions:
        "Evaluate cumulative decisions, outcomes, and transfer to practice.",
      activityType: "reflection" as const,
    },
  ],
  decisions: [
    {
      shortName: "incident-resp",
      name: "incident-response-strategy",
      title: "Incident Response Strategy",
      situation:
        "An early operational incident occurs during deployment with known patient-service impact.",
      prompt: "Select incident response strategy.",
      options: [
        {
          label: "Immediate containment",
          description: "Activate immediate containment protocols.",
        },
        {
          label: "Coordinated cross-functional response",
          description: "Coordinate cross-functional incident response.",
        },
        {
          label: "Executive-led response",
          description: "Escalate to executive-led incident response.",
        },
        {
          label: "Vendor-led technical response",
          description: "Delegate primary response to vendor technical team.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "deploy-cont",
      name: "deployment-continuation",
      title: "Deployment Continuation",
      situation:
        "Incident governance requests continue, pause, restrict, or rollback recommendation.",
      prompt: "Recommend deployment path during incident.",
      options: [
        {
          label: "Continue deployment",
          description: "Continue deployment with monitoring.",
        },
        {
          label: "Pause deployment",
          description: "Pause deployment pending stabilization.",
        },
        {
          label: "Restrict to safe scope",
          description: "Restrict deployment to safe scope only.",
        },
        {
          label: "Rollback affected sites",
          description: "Rollback affected sites or capabilities.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "hypercare-exit",
      name: "hypercare-exit",
      title: "Hypercare Exit",
      situation:
        "Operational owner requests hypercare exit and normal ownership transition.",
      prompt: "Select hypercare exit recommendation.",
      options: [
        {
          label: "Exit hypercare now",
          description: "Exit hypercare and transfer to steady-state ownership.",
        },
        {
          label: "Extend hypercare",
          description: "Extend hypercare with explicit criteria.",
        },
        {
          label: "Phased hypercare exit",
          description: "Phase hypercare exit by site or function.",
        },
        {
          label: "Defer exit pending trends",
          description: "Defer exit until stabilization trends are confirmed.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "acceptance",
      name: "acceptance-position",
      title: "Acceptance Position",
      situation:
        "Sponsor or vendor requests formal acceptance of delivered scope.",
      prompt: "Select formal acceptance position.",
      options: [
        {
          label: "Full acceptance",
          description: "Recommend full formal acceptance.",
        },
        {
          label: "Conditional acceptance",
          description: "Recommend conditional acceptance with obligations.",
        },
        {
          label: "Reject pending remediation",
          description: "Reject acceptance pending remediation.",
        },
        {
          label: "Escalate acceptance authority",
          description: "Escalate acceptance authority to governance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "residual-transfer",
      name: "residual-work-transfer",
      title: "Residual Work Transfer",
      situation:
        "Continuing risks, defects, and actions must transfer to accepted owners.",
      prompt: "Select residual work transfer approach.",
      options: [
        {
          label: "Full transfer with acceptance",
          description: "Transfer all items with explicit owner acceptance.",
        },
        {
          label: "Transfer with governance monitoring",
          description: "Transfer with continued governance monitoring.",
        },
        {
          label: "Retain on project temporarily",
          description: "Retain items on project temporarily with funding.",
        },
        {
          label: "Escalate unresolved items",
          description: "Escalate unresolved transfer items.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "benefits-report",
      name: "benefits-reporting-position",
      title: "Benefits Reporting Position",
      situation:
        "Executive leadership requests early benefit results for final reporting.",
      prompt: "Select benefits reporting position.",
      options: [
        {
          label: "Report forecast as realized",
          description: "Report forecast benefits as realized.",
        },
        {
          label: "Distinguish forecast and realized",
          description: "Distinguish forecast, emerging, and realized benefits.",
        },
        {
          label: "Report early indicators only",
          description: "Report early indicators with explicit limitations.",
        },
        {
          label: "Defer benefits claims",
          description: "Defer benefits claims until measurement matures.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "vendor-closure",
      name: "vendor-financial-closure",
      title: "Vendor Financial Closure",
      situation:
        "Vendor presents final invoice, claim, warranty, or support obligation.",
      prompt: "Select vendor financial closure position.",
      options: [
        {
          label: "Approve final payment",
          description: "Approve final payment as presented.",
        },
        {
          label: "Approve with holdback",
          description: "Approve with holdback for open obligations.",
        },
        {
          label: "Dispute invoice",
          description: "Dispute invoice pending evidence review.",
        },
        {
          label: "Negotiate settlement",
          description: "Negotiate settlement package.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
    {
      shortName: "final-closure",
      name: "final-closure-recommendation",
      title: "Final Closure Recommendation",
      situation:
        "Steering committee requests final project closure recommendation.",
      prompt: "Recommend final project closure.",
      options: [
        {
          label: "Recommend closure",
          description: "Recommend formal project closure.",
        },
        {
          label: "Conditional closure",
          description: "Recommend conditional closure with monitoring.",
        },
        {
          label: "Defer closure",
          description: "Defer closure pending obligation transfer.",
        },
        {
          label: "Recommend administrative closure only",
          description:
            "Recommend administrative closure without value assurance.",
        },
      ],
      stakeholderIdsForEffects: [
        "stakeholder.sponsor",
        "stakeholder.program-director",
      ],
    },
  ],
  crises: [
    {
      id: "crisis.northstar.chapter-06.deployment-incident",
      title: "Early deployment operational incident",
      relatedDecisionIds: [
        "decision.northstar.chapter-06.incident-response-strategy",
        "decision.northstar.chapter-06.deployment-continuation",
      ],
      relatedStakeholderIds: [
        "stakeholder.incident-lead",
        "stakeholder.operations",
      ],
      resolutionDecisionId:
        "decision.northstar.chapter-06.deployment-continuation",
    },
  ],
  learnerGuidance: {
    default:
      "Coordinate deployment incidents, manage hypercare exit, verify acceptance, transfer residual obligations, establish benefits monitoring, and recommend formal closure.",
    explorer:
      "Use document evidence and activity instructions as checklists. Compare trade-offs before each decision.",
    practitioner:
      "Balance stakeholder pressure with governance discipline and incomplete evidence.",
    leader:
      "Prioritize accountable trade-offs under ambiguity; keep safety, privacy, quality, and governance non-negotiable.",
  },
};

export const NORTHSTAR_CHAPTER_CATALOGS = {
  2: CHAPTER_2_CATALOG,
  3: CHAPTER_3_CATALOG,
  4: CHAPTER_4_CATALOG,
  5: CHAPTER_5_CATALOG,
  6: CHAPTER_6_CATALOG,
} as const;
