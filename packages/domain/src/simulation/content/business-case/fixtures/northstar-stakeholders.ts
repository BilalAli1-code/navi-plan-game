/**
 * BC-006 Northstar stakeholders — org constant, additional roles, chapter behaviors.
 */

import { asStakeholderId } from "../../../../shared-kernel/ids";
import type {
  StakeholderChapterBehavior,
  StakeholderDefinition,
} from "../entities";
import { localizedText } from "../localized";
import { chapterIdForOrder } from "./northstar-builders";

export const NORTHSTAR_ORG = localizedText(
  "Northstar Community Health Network",
);

export const ADDITIONAL_STAKEHOLDER_IDS = [
  "stakeholder.pmo",
  "stakeholder.change-lead",
  "stakeholder.site-leader",
  "stakeholder.benefits-owner",
  "stakeholder.quality",
  "stakeholder.steering-secretariat",
  "stakeholder.support-lead",
  "stakeholder.delivery-lead",
  "stakeholder.business-owner",
  "stakeholder.frontline-manager",
  "stakeholder.procurement",
  "stakeholder.incident-lead",
] as const;

const ch2 = chapterIdForOrder(2);
const ch3 = chapterIdForOrder(3);
const ch4 = chapterIdForOrder(4);
const ch5 = chapterIdForOrder(5);
const ch6 = chapterIdForOrder(6);

/** Chapter 2–6 stance arcs adapted to Chapter One stakeholder names and IDs. */
export const buildNorthstarChapterBehaviors = (): Record<
  string,
  readonly StakeholderChapterBehavior[]
> => ({
  "stakeholder.sponsor": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Pushes for a credible integrated baseline and may pressure for commitments before uncertainty is fully resolved.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Seeks evidence that early delivery problems are normal mobilization rather than structural weakness.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Confidence becomes conditional; expects concise recovery, ownership, and defensible transparency.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Wants a clear go-live recommendation and responds positively when unsafe compression is resisted.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Evaluates value delivery, leadership, stakeholder confidence, and whether benefits ownership is real.",
      ),
    },
  ],
  "stakeholder.program-director": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Coaches integrated planning discipline, baseline integrity, and timely escalation without dependency.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Monitors mobilization quality, vendor onboarding, and whether execution controls are functioning.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Escalates health breaches and expects evidence-based recovery with explicit trade-offs.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Balances recovery narrative credibility with readiness evidence and operational ownership gaps.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Supports disciplined closure, lessons capture, and transfer of continuing obligations.",
      ),
    },
  ],
  "stakeholder.operations": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Warns that support coverage, workflow backfill, and scheduling assumptions are understated.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Reports rework from inconsistent dependency communication and frontline capacity strain.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Escalates uneven workload and competing priorities affecting service continuity.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Reports segmented readiness gaps across sites and functions before deployment.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Coordinates deployment incidents and hypercare transition with patient-service impact focus.",
      ),
    },
  ],
  "stakeholder.clinical": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Insists on explicit clinical requirements, quality criteria, and clinician governance representation.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Limits workshop attendance due to patient-care demand; challenges workflow gaps in early deliverables.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "May escalate material clinical risk if recovery shortcuts threaten safety or acceptance integrity.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Central readiness voice — may support conditional go-live, limited deployment, or delay by evidence.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Judges whether clinical work improved, residual risks transferred responsibly, and benefits claims hold.",
      ),
    },
  ],
  "stakeholder.technology": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Maps integration dependencies, interface assumptions, and technical capacity constraints into the baseline.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Surfaces failed integration assumptions and dependency ownership gaps early in execution.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Assesses vendor technical recovery proposals and integration rework impacts.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Validates technical readiness, defect severity, and support model for deployment.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Supports incident coordination, hypercare technical stabilization, and operational handover.",
      ),
    },
  ],
  "stakeholder.privacy": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Requires explicit patient-data, vendor-access, retention, and responsible-technology boundaries in planning.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Requests traceable evidence before first deliverable acceptance and scope interpretations harden.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Identifies material compliance risk in proposed recovery shortcuts and demands controlled remediation.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Requests traceable readiness evidence and clear residual-risk ownership before go-live.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Raises control concerns during deployment and verifies compliance evidence in closure packages.",
      ),
    },
  ],
  "stakeholder.finance": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Challenges estimate confidence, contingency rationale, and benefit sensitivity in the baseline.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Tracks forecast variance and whether early execution spend aligns with authorized baseline.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Scrutinizes recovery cost impacts, vendor commercial exposure, and contingency use.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Requests remaining contingency, forecast exposure, and financial implications of deployment options.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Reconciles final actuals, commitments, invoices, and continuing cost obligations at closure.",
      ),
    },
  ],
  "stakeholder.patient-experience": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Ensures patient usability, equity, and accessibility requirements are represented in scope and acceptance.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Monitors whether workflow designs reflect patient effort and vulnerable-population needs.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Flags when recovery plans risk worsening access equity or patient communication quality.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Reviews adoption signals and whether training reaches patients who need human support pathways.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Advocates for credible patient-impact narrative in benefits reporting and closure.",
      ),
    },
  ],
  "stakeholder.vendor": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Promotes standard configuration and optimistic assumptions about Northstar responsibilities.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Requests staffing substitutions and defends mobilization assumptions when challenged.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Reports missed commitments and negotiates corrective-action scope and commercial impact.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Claims stabilization work is out of scope and positions vendor obligations narrowly.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Presents final invoice, warranty, and support positions during financial closure.",
      ),
    },
  ],
  "stakeholder.analyst": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Supports integrated baseline assembly and surfaces planning evidence gaps before approval.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Tracks dependency ownership gaps and documents decision/action follow-through.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Maintains impact assessments, variance analysis, and recovery evidence traceability.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Prepares readiness scorecards, defect registers, and deployment options evidence.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Consolidates closure artifacts, lessons evidence, and benefits measurement schedules.",
      ),
    },
  ],
  "stakeholder.pmo": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Requests integrated baseline structure, reporting cadence, and approval evidence standards.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Confirms execution mobilization and communicates checkpoint outcomes to governance.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Facilitates recovery triage governance and steering committee decision records.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Coordinates integrated readiness review and go-live decision packaging.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Invites lessons learned participation and requests evidence-based closure recommendation.",
      ),
    },
  ],
  "stakeholder.change-lead": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Warns that training and manager engagement effort is underestimated in the resource plan.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Updates engagement plans as execution reveals adoption and communication friction.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Re-engages stakeholders whose trust eroded during recovery turbulence.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Escalates inconsistent manager support and designs targeted adoption interventions.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Facilitates organizational learning transfer and reinforcement after deployment.",
      ),
    },
  ],
  "stakeholder.site-leader": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Represents clinic-level scheduling realities and local workflow variation in scope workshops.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Balances frontline participation with patient-service demand during early execution.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Reports site-level capacity conflicts complicating recovery resequencing.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Provides site readiness truth data that may diverge from enterprise averages.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Accepts or challenges operational handover and hypercare exit at the site level.",
      ),
    },
  ],
  "stakeholder.benefits-owner": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Partners on preliminary benefits measures, baselines, and ownership for value tracking.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Monitors whether early deliverables connect to measurable access and value indicators.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Assesses whether recovery choices protect or delay benefit realization paths.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Evaluates deployment timing against benefit sensitivity and adoption prerequisites.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Owns benefits reporting position and ongoing measurement accountability after closure.",
      ),
    },
  ],
  "stakeholder.quality": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Defines quality strategy, acceptance criteria, and regulatory traceability checkpoints.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Leads first deliverable quality review and documents nonconformance findings.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Protects quality and compliance when recovery shortcuts threaten evidence integrity.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Challenges defect classification and release-blocking determinations before go-live.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Verifies formal acceptance evidence and residual quality obligation transfer.",
      ),
    },
  ],
  "stakeholder.steering-secretariat": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Schedules baseline approval and communicates steering decisions and conditions.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Records checkpoint outcomes and chapter transition conditions for governance.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Requests integrated recovery recommendations and publishes authorization outcomes.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Requests deployment strategy recommendation and communicates go-live authorization.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Requests final closure recommendation and records project closure approval.",
      ),
    },
  ],
  "stakeholder.support-lead": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Surfaces support coverage assumptions and service-desk capacity constraints in planning.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Prepares support readiness for early execution artifacts and pilot dependencies.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Flags support model gaps that recovery plans must address before re-baselining.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Requests named ownership and escalation model for post-deployment service.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Manages hypercare trends and negotiates transition to steady-state support ownership.",
      ),
    },
  ],
  "stakeholder.delivery-lead": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Owns workstream decomposition and delivery sequencing inputs for the integrated plan.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Mobilizes delivery teams and maintains execution cadence across workstreams.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Escalates team capacity conflict and unsustainable workload during recovery.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Coordinates readiness working sessions and defect remediation ownership.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Supports deployment command activities and residual work transfer acceptance.",
      ),
    },
  ],
  "stakeholder.business-owner": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Clarifies business outcomes, scope priorities, and acceptance accountability in planning.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Challenges scope interpretations and defends business value of disputed work packages.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Originates late change requests that must be governed through integrated impact assessment.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Partners on readiness segmentation and business sign-off for deployment waves.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Participates in formal acceptance and benefits ownership confirmation at closure.",
      ),
    },
  ],
  "stakeholder.frontline-manager": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Provides frontline perspective on training load and workflow change feasibility.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Balances staff participation in design activities with patient-service coverage needs.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Reports morale and workload impacts as recovery reshuffles priorities.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Reports workflow burden, low training confidence, and local resistance before go-live.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Describes user impact, workaround burden, and patient-service effects during incidents.",
      ),
    },
  ],
  "stakeholder.procurement": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Defines procurement strategy, vendor boundaries, and contractual escalation paths.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Records vendor mobilization, substitutions, and commercial conditions.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Supports vendor corrective-action governance and remedy evaluation.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Assesses vendor obligation claims against contract and change history.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Leads procurement closure, invoice reconciliation, and vendor performance evaluation.",
      ),
    },
  ],
  "stakeholder.incident-lead": [
    {
      chapterId: ch2,
      stance: localizedText(
        "Advises on incident and contingency planning assumptions embedded in the baseline.",
      ),
    },
    {
      chapterId: ch3,
      stance: localizedText(
        "Monitors early operational signals that may indicate mobilization or design weaknesses.",
      ),
    },
    {
      chapterId: ch4,
      stance: localizedText(
        "Supports containment decisions when project health breaches threaten service continuity.",
      ),
    },
    {
      chapterId: ch5,
      stance: localizedText(
        "Reviews contingency, rollback thresholds, and deployment command readiness.",
      ),
    },
    {
      chapterId: ch6,
      stance: localizedText(
        "Leads deployment incident governance and continue/pause/rollback recommendations.",
      ),
    },
  ],
});

export const buildNorthstarAdditionalStakeholders =
  (): StakeholderDefinition[] => {
    const programDirectorId = asStakeholderId("stakeholder.program-director");
    const sponsorId = asStakeholderId("stakeholder.sponsor");
    const behaviors = buildNorthstarChapterBehaviors();

    const mk = (
      id: string,
      displayName: string,
      roleTitle: string,
      stakeholderType: StakeholderDefinition["stakeholderType"],
      profileSummary: string,
      relationships: StakeholderDefinition["relationships"] = [],
    ): StakeholderDefinition => ({
      id: asStakeholderId(id),
      displayName: localizedText(displayName),
      roleTitle: localizedText(roleTitle),
      organization: NORTHSTAR_ORG,
      stakeholderType,
      profileSummary: localizedText(profileSummary),
      motivations: [
        localizedText("Credible Connected Care delivery and governance"),
      ],
      goals: [
        localizedText("Reduce program risk through clear accountability"),
      ],
      concerns: [localizedText("Ambiguous ownership delaying decisions")],
      influence: "medium",
      interest: "high",
      initialTrust: 60,
      relationships,
      chapterBehavior: behaviors[id] ?? [],
      portraitAssetId: null,
      accessibilityLabel: localizedText(
        `Portrait of ${displayName}, ${roleTitle}`,
      ),
    });

    return [
      mk(
        "stakeholder.pmo",
        "Jordan Alvarez",
        "PMO Lead",
        "internal",
        "Owns integrated planning standards, baseline packaging, and governance cadence for Connected Care.",
        [
          {
            otherStakeholderId: programDirectorId,
            relationship: localizedText(
              "Reports planning integrity to the program director",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.change-lead",
        "Camila Ortiz",
        "Change and Adoption Lead",
        "internal",
        "Leads stakeholder engagement, training readiness, and adoption interventions across clinics and call centers.",
      ),
      mk(
        "stakeholder.site-leader",
        "David Nguyen",
        "Regional Clinic Operations Director",
        "internal",
        "Represents multi-site frontline operations and local workflow variation during planning and readiness.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.operations"),
            relationship: localizedText(
              "Aligns site realities with network access strategy",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.benefits-owner",
        "Laura Simmons",
        "Benefits Realization Manager",
        "internal",
        "Accountable for benefit measures, baselines, and post-deployment value tracking.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.finance"),
            relationship: localizedText(
              "Partners with finance on benefit credibility",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.quality",
        "Dr. James Whitfield",
        "Quality and Regulatory Lead",
        "governance",
        "Defines quality evidence, acceptance criteria, and regulatory traceability for deliverables and readiness.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.clinical"),
            relationship: localizedText(
              "Aligned on clinical quality and safety evidence",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.steering-secretariat",
        "Patricia Cole",
        "Steering Committee Secretariat",
        "governance",
        "Schedules steering forums, records decisions, and communicates authorization outcomes.",
        [
          {
            otherStakeholderId: sponsorId,
            relationship: localizedText(
              "Supports executive steering committee logistics",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.support-lead",
        "Andre Williams",
        "IT Service Management Lead",
        "internal",
        "Owns post-deployment support tiers, incident routing, and hypercare transition planning.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.technology"),
            relationship: localizedText(
              "Coordinates technical and service support models",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.delivery-lead",
        "Hannah Brooks",
        "Integrated Delivery Lead",
        "internal",
        "Coordinates workstream delivery, team capacity, and execution cadence after baseline approval.",
        [
          {
            otherStakeholderId: programDirectorId,
            relationship: localizedText(
              "Reports delivery performance to program leadership",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.business-owner",
        "Rachel Kim",
        "Connected Care Product Owner",
        "internal",
        "Owns business outcomes, scope prioritization, and acceptance accountability for access capabilities.",
      ),
      mk(
        "stakeholder.frontline-manager",
        "Tony Martinez",
        "Call Center Operations Manager",
        "internal",
        "Represents frontline scheduling staff burden, training confidence, and adoption resistance signals.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.operations"),
            relationship: localizedText(
              "Escalates frontline capacity and workflow concerns",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.procurement",
        "Diane Foster",
        "Procurement Manager",
        "internal",
        "Governs vendor contracts, commercial escalations, and procurement closure.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.vendor"),
            relationship: localizedText(
              "Manages Apex Care Systems contractual relationship",
            ),
          },
        ],
      ),
      mk(
        "stakeholder.incident-lead",
        "Chris Palmer",
        "Incident Governance Lead",
        "internal",
        "Leads deployment incident coordination, rollback authority, and service continuity decisions.",
        [
          {
            otherStakeholderId: asStakeholderId("stakeholder.support-lead"),
            relationship: localizedText(
              "Partners on hypercare and incident escalation",
            ),
          },
        ],
      ),
    ];
  };

/** Merge chapter 2–6 behaviors onto Chapter One stakeholders and append additional roles. */
export const enrichNorthstarStakeholders = (
  chapterOneStakeholders: readonly StakeholderDefinition[],
): StakeholderDefinition[] => {
  const behaviors = buildNorthstarChapterBehaviors();
  const enriched = chapterOneStakeholders.map((stakeholder) => ({
    ...stakeholder,
    chapterBehavior: [
      ...stakeholder.chapterBehavior,
      ...(behaviors[stakeholder.id] ?? []),
    ],
  }));
  return [...enriched, ...buildNorthstarAdditionalStakeholders()];
};
