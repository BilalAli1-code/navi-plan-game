/**
 * Northstar Connected Care — Chapter One structured content (BC-004).
 *
 * Full Chapter One entities for assembly by `createNorthstarConnectedCarePackage`.
 * Chapters 2–6 remain placeholders in the package assembler.
 */

import {
  asActivityId,
  asChapterId,
  asDecisionId,
  asDecisionOptionId,
  asDocumentId,
  asMeetingDefinitionId,
  asMetricKey,
  asNotificationId,
  asStakeholderId,
} from "../../../../shared-kernel/ids";
import { always } from "../conditions";
import type {
  AchievementDefinition,
  ActivityDefinition,
  AssessmentDefinition,
  ChapterDefinition,
  ContentConsequenceDefinition,
  ContentDecisionDefinition,
  DocumentDefinition,
  MeetingDefinition,
  MessageDefinition,
  NotificationDefinition,
  OutcomeDefinition,
  StakeholderDefinition,
} from "../entities";
import {
  asAchievementId,
  asCompetencyId,
  asEvidenceTag,
  asLearningObjectiveId,
  asMessageDefinitionId,
  asOutcomeId,
} from "../ids";
import { localizedText } from "../localized";

export const NORTHSTAR_CHAPTER_ONE_ID = asChapterId("chapter-01");

export interface NorthstarChapterOneEntities {
  readonly chapter: ChapterDefinition;
  readonly stakeholders: readonly StakeholderDefinition[];
  readonly messages: readonly MessageDefinition[];
  readonly meetings: readonly MeetingDefinition[];
  readonly documents: readonly DocumentDefinition[];
  readonly notifications: readonly NotificationDefinition[];
  readonly activities: readonly ActivityDefinition[];
  readonly decisions: readonly ContentDecisionDefinition[];
  readonly consequences: readonly ContentConsequenceDefinition[];
  readonly assessment: AssessmentDefinition;
  readonly achievements: readonly AchievementDefinition[];
  readonly outcomes: readonly OutcomeDefinition[];
}

export const buildNorthstarChapterOneEntities =
  (): NorthstarChapterOneEntities => {
    const chapterId = NORTHSTAR_CHAPTER_ONE_ID;

    // Stakeholders
    const sponsorId = asStakeholderId("stakeholder.sponsor");
    const programDirectorId = asStakeholderId("stakeholder.program-director");
    const operationsId = asStakeholderId("stakeholder.operations");
    const clinicalId = asStakeholderId("stakeholder.clinical");
    const technologyId = asStakeholderId("stakeholder.technology");
    const privacyId = asStakeholderId("stakeholder.privacy");
    const financeId = asStakeholderId("stakeholder.finance");
    const patientExperienceId = asStakeholderId(
      "stakeholder.patient-experience",
    );
    const vendorId = asStakeholderId("stakeholder.vendor");
    const analystId = asStakeholderId("stakeholder.analyst");

    // Documents
    const authorizationDocId = asDocumentId("document.authorization-summary");
    const businessCaseDocId = asDocumentId("document.business-case-initial");
    const dashboardDocId = asDocumentId(
      "document.access-performance-dashboard",
    );
    const briefingDocId = asDocumentId("document.stakeholder-briefing");
    const scopeDocId = asDocumentId("document.scope-assumptions");
    const riskDocId = asDocumentId("document.risk-constraints");

    // Evidence tags
    const evidenceAuthorization = asEvidenceTag("evidence.authorization");
    const evidenceBusinessCase = asEvidenceTag("evidence.business-case");
    const evidenceAccessDashboard = asEvidenceTag("evidence.access-dashboard");
    const evidenceScopeAssumptions = asEvidenceTag(
      "evidence.scope-assumptions",
    );
    const evidenceStakeholderBriefing = asEvidenceTag(
      "evidence.stakeholder-briefing",
    );
    const evidenceRiskConstraints = asEvidenceTag("evidence.risk-constraints");

    // Meeting / messages / notification
    const kickoffMeetingId = asMeetingDefinitionId("meeting.program-kickoff");
    const msgSponsorWelcome = asMessageDefinitionId("message.sponsor-welcome");
    const msgOperationsScheduling = asMessageDefinitionId(
      "message.operations-scheduling",
    );
    const msgPrivacyCaution = asMessageDefinitionId("message.privacy-caution");
    const msgAnalystIncomplete = asMessageDefinitionId(
      "message.analyst-incomplete-evidence",
    );
    const msgKickoffReminder = asMessageDefinitionId(
      "message.info-kickoff-reminder",
    );
    const notificationReadyId = asNotificationId(
      "notification.chapter-one-ready",
    );

    // Activities
    const activityReviewAuth = asActivityId("activity.review-authorization");
    const activityAnalyzeEvidence = asActivityId(
      "activity.analyze-access-evidence",
    );
    const activityAttendKickoff = asActivityId("activity.attend-kickoff");
    const activityReviewConcerns = asActivityId(
      "activity.review-stakeholder-concerns",
    );
    const activitySubmitDecisions = asActivityId(
      "activity.submit-chapter-one-decisions",
    );
    const activityReflection = asActivityId("activity.chapter-one-reflection");

    // Decisions
    const decisionDefineObjective = asDecisionId("decision.define-objective");
    const decisionSelectDelivery = asDecisionId(
      "decision.select-delivery-approach",
    );
    const decisionEstablishGovernance = asDecisionId(
      "decision.establish-governance",
    );

    // Decision 1 options
    const optObjectiveTech = asDecisionOptionId("option.objective-tech-speed");
    const optObjectiveAccess = asDecisionOptionId(
      "option.objective-patient-access",
    );
    const optObjectiveOps = asDecisionOptionId(
      "option.objective-operational-efficiency",
    );
    const optObjectivePrivacy = asDecisionOptionId(
      "option.objective-privacy-quality",
    );

    // Decision 2 options
    const optDeliveryPredictive = asDecisionOptionId(
      "option.delivery-predictive",
    );
    const optDeliveryAdaptive = asDecisionOptionId("option.delivery-adaptive");
    const optDeliveryHybrid = asDecisionOptionId("option.delivery-hybrid");

    // Decision 3 options
    const optGovSponsorLed = asDecisionOptionId(
      "option.governance-sponsor-led",
    );
    const optGovCrossFunctional = asDecisionOptionId(
      "option.governance-cross-functional",
    );
    const optGovStaged = asDecisionOptionId("option.governance-staged");

    // Consequences
    const cObjectiveTech = "consequence.objective-tech-speed";
    const cObjectiveAccess = "consequence.objective-patient-access";
    const cObjectiveOps = "consequence.objective-operational-efficiency";
    const cObjectivePrivacy = "consequence.objective-privacy-quality";
    const cDeliveryPredictive = "consequence.delivery-predictive";
    const cDeliveryAdaptive = "consequence.delivery-adaptive";
    const cDeliveryHybrid = "consequence.delivery-hybrid";
    const cGovSponsorLed = "consequence.governance-sponsor-led";
    const cGovCrossFunctional = "consequence.governance-cross-functional";
    const cGovStaged = "consequence.governance-staged";

    // Assessment / learning
    const competencyDecisionQuality = asCompetencyId(
      "competency.decision-quality",
    );
    const competencyStakeholderEngagement = asCompetencyId(
      "competency.stakeholder-engagement",
    );
    const competencyGovernance = asCompetencyId("competency.governance");
    const competencyValueDelivery = asCompetencyId("competency.value-delivery");

    const loOrientation = asLearningObjectiveId("lo.chapter-one-orientation");
    const loEvidence = asLearningObjectiveId("lo.chapter-one-evidence");
    const loGovernance = asLearningObjectiveId("lo.chapter-one-governance");

    const org = localizedText("Northstar Community Health Network");

    const chapter: ChapterDefinition = {
      id: chapterId,
      order: 1,
      title: localizedText("The Access Problem"),
      summary: localizedText(
        "Inherit an approved but incompletely defined Connected Care Access Program. Review authorization and performance evidence, meet key stakeholders, and set the initial objective, delivery posture, and governance approach.",
      ),
      learningObjectiveIds: [loOrientation, loEvidence, loGovernance],
      initialUnlock: true,
      unlockWhen: null,
      completionWhen: {
        kind: "all",
        conditions: [
          {
            kind: "activity_status",
            activityId: activitySubmitDecisions,
            status: "completed",
          },
          {
            kind: "activity_status",
            activityId: activityReflection,
            status: "completed",
          },
          {
            kind: "decision_status",
            decisionId: decisionDefineObjective,
            status: "resolved",
          },
          {
            kind: "decision_status",
            decisionId: decisionSelectDelivery,
            status: "resolved",
          },
          {
            kind: "decision_status",
            decisionId: decisionEstablishGovernance,
            status: "resolved",
          },
        ],
      },
      requiredActivityIds: [
        activityReviewAuth,
        activityAnalyzeEvidence,
        activityAttendKickoff,
        activityReviewConcerns,
        activitySubmitDecisions,
        activityReflection,
      ],
      requiredDecisionIds: [
        decisionDefineObjective,
        decisionSelectDelivery,
        decisionEstablishGovernance,
      ],
      entryEventIds: [],
      completionEventIds: [],
      estimatedMinutes: 100,
      learnerGuidance: {
        default: localizedText(
          "Review the available evidence before committing to an objective, delivery posture, or governance model. Stakeholders will disagree — document trade-offs.",
        ),
        explorer: localizedText(
          "Start with the authorization summary and business case, then open the access dashboard. Use hints on each decision to compare trade-offs. You do not need a perfect answer — you need a defensible one.",
        ),
        practitioner: localizedText(
          "Balance executive pressure for speed against incomplete evidence and privacy constraints. Your three Chapter One decisions set the tone for later stakeholder tension.",
        ),
        leader: localizedText(
          "Leadership expects judgment under ambiguity. Prioritize value signals, engagement posture, and governance credibility — hybrid delivery is not automatically the safest choice.",
        ),
      },
    };

    const stakeholders: StakeholderDefinition[] = [
      {
        id: sponsorId,
        displayName: localizedText("Elena Marquez"),
        roleTitle: localizedText(
          "Executive Sponsor and Chief Operating Officer",
        ),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Chief Operating Officer and executive sponsor. Under board pressure to show visible access improvement quickly.",
        ),
        motivations: [
          localizedText("Board-visible progress within the first two quarters"),
        ],
        goals: [localizedText("Demonstrate that Connected Care is delivering")],
        concerns: [
          localizedText("Extended analysis delaying rollout commitments"),
        ],
        influence: "critical",
        interest: "high",
        initialTrust: 68,
        relationships: [
          {
            otherStakeholderId: programDirectorId,
            relationship: localizedText(
              "Expects program director to keep momentum",
            ),
          },
          {
            otherStakeholderId: operationsId,
            relationship: localizedText("Allied on speed of access relief"),
          },
        ],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Pushes for a clear objective and visible near-term milestones.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Elena Marquez, Executive Sponsor and Chief Operating Officer",
        ),
      },
      {
        id: programDirectorId,
        displayName: localizedText("Marcus Reed"),
        roleTitle: localizedText("Program Director, Strategic Transformation"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Learner’s manager. Values evidence, governance, and practical delivery without creating escalation dependency.",
        ),
        motivations: [
          localizedText(
            "Credible plans that executives and clinics can both accept",
          ),
        ],
        goals: [
          localizedText(
            "Keep transformation coordinated and escalations timely",
          ),
        ],
        concerns: [
          localizedText(
            "Over-promising before evidence and readiness are clear",
          ),
        ],
        influence: "high",
        interest: "high",
        initialTrust: 75,
        relationships: [
          {
            otherStakeholderId: sponsorId,
            relationship: localizedText(
              "Reports progress and risk to the sponsor",
            ),
          },
        ],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Coaches the learner to gather evidence and propose a tailored posture.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Marcus Reed, Program Director",
        ),
      },
      {
        id: operationsId,
        displayName: localizedText("Renee Wallace"),
        roleTitle: localizedText("Vice President of Patient Access"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Owns scheduling and call-center operations. Urgently wants relief from current performance problems.",
        ),
        motivations: [
          localizedText("Reduce call abandonment and appointment gaps"),
        ],
        goals: [localizedText("Stabilize frontline scheduling performance")],
        concerns: [
          localizedText(
            "Enterprise designs that ignore clinic and call-center realities",
          ),
        ],
        influence: "high",
        interest: "high",
        initialTrust: 62,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Shares painful scheduling metrics and favors faster operational relief.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Renee Wallace, Operations leader",
        ),
      },
      {
        id: clinicalId,
        displayName: localizedText("Priya Shah"),
        roleTitle: localizedText("Chief Medical Officer"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Clinical representative prioritizing quality, patient safety, and provider workflow integrity.",
        ),
        motivations: [
          localizedText("Protect clinical quality while improving access"),
        ],
        goals: [
          localizedText("Avoid unsafe standardization of clinical workflows"),
        ],
        concerns: [
          localizedText("Operational pressure overriding clinical judgment"),
        ],
        influence: "high",
        interest: "medium",
        initialTrust: 64,
        relationships: [
          {
            otherStakeholderId: privacyId,
            relationship: localizedText(
              "Aligned on safeguards and accountability",
            ),
          },
        ],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Will challenge objectives that treat access as a pure volume metric.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Priya Shah, Chief Medical Officer",
        ),
      },
      {
        id: technologyId,
        displayName: localizedText("Jordan Kim"),
        roleTitle: localizedText("Chief Information Officer"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Technology leader concerned about integration capacity, cybersecurity, technical debt, and vendor claims.",
        ),
        motivations: [
          localizedText("Disciplined architecture and release controls"),
        ],
        goals: [
          localizedText(
            "Modernize platforms without creating unmanageable debt",
          ),
        ],
        concerns: [
          localizedText("Aggressive timelines that skip integration readiness"),
        ],
        influence: "high",
        interest: "high",
        initialTrust: 60,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Questions vendor confidence and pushes for realistic technical sequencing.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Jordan Kim, Technology leader",
        ),
      },
      {
        id: privacyId,
        displayName: localizedText("Aisha Bennett"),
        roleTitle: localizedText("Chief Privacy and Compliance Officer"),
        organization: org,
        stakeholderType: "governance",
        profileSummary: localizedText(
          "Protects privacy, legal, ethical, and regulatory requirements — especially patient data and vendor access.",
        ),
        motivations: [
          localizedText("Early involvement and clear accountability"),
        ],
        goals: [
          localizedText("Prevent privacy and compliance surprises later"),
        ],
        concerns: [
          localizedText(
            "AI-assisted features and vendor data access without controls",
          ),
        ],
        influence: "high",
        interest: "high",
        initialTrust: 58,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Issues an early caution that privacy must shape scope, not follow it.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Aisha Bennett, Privacy and Compliance leader",
        ),
      },
      {
        id: financeId,
        displayName: localizedText("Thomas Grant"),
        roleTitle: localizedText("Chief Financial Officer"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Finance and procurement scrutiny. Expects measurable benefits and challenges optimistic assumptions.",
        ),
        motivations: [
          localizedText("Cost discipline and credible benefit realization"),
        ],
        goals: [
          localizedText("Protect contingency and challenge soft value claims"),
        ],
        concerns: [localizedText("Benefit estimates that outpace evidence")],
        influence: "high",
        interest: "medium",
        initialTrust: 55,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Watches whether the initial objective is tied to measurable value.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Thomas Grant, Chief Financial Officer",
        ),
      },
      {
        id: patientExperienceId,
        displayName: localizedText("Sofia Nguyen"),
        roleTitle: localizedText("Director of Patient Experience"),
        organization: org,
        stakeholderType: "customer",
        profileSummary: localizedText(
          "Represents patient usability, accessibility, communication, and equity concerns.",
        ),
        motivations: [
          localizedText(
            "Designs that work for vulnerable and digitally limited patients",
          ),
        ],
        goals: [localizedText("Keep patient voice in early framing")],
        concerns: [
          localizedText(
            "Operationally efficient designs that exclude patients who need human support",
          ),
        ],
        influence: "medium",
        interest: "high",
        initialTrust: 66,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Asks whether access metrics include equity and patient effort, not only volume.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Sofia Nguyen, Patient experience",
        ),
      },
      {
        id: vendorId,
        displayName: localizedText("Maya Chen"),
        roleTitle: localizedText("Vendor Engagement Lead"),
        organization: localizedText("Apex Care Systems"),
        stakeholderType: "vendor",
        profileSummary: localizedText(
          "Represents the preferred implementation vendor. Confident in product and timeline; may minimize customization complexity.",
        ),
        motivations: [
          localizedText("Standard product adoption and contractual clarity"),
        ],
        goals: [
          localizedText("Keep scope aligned to the proposed platform path"),
        ],
        concerns: [
          localizedText(
            "Open-ended discovery that expands customization beyond contract",
          ),
        ],
        influence: "medium",
        interest: "high",
        initialTrust: 50,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Offers a confident delivery narrative; expect optimistic assumptions.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Maya Chen, Vendor representative",
        ),
      },
      {
        id: analystId,
        displayName: localizedText("Nia Brooks"),
        roleTitle: localizedText("Project Business Analyst"),
        organization: org,
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Supports evidence collection and decision preparation. Sees inconsistencies others overlook.",
        ),
        motivations: [
          localizedText("Complete evidence before major commitments"),
        ],
        goals: [
          localizedText("Surface gaps in workflows and benefit assumptions"),
        ],
        concerns: [localizedText("Being overloaded without prioritization")],
        influence: "medium",
        interest: "high",
        initialTrust: 72,
        relationships: [
          {
            otherStakeholderId: programDirectorId,
            relationship: localizedText(
              "Escalates evidence gaps through the program director",
            ),
          },
        ],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Flags that current evidence packs are incomplete for a firm objective.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText(
          "Portrait of Nia Brooks, Project Business Analyst",
        ),
      },
    ];

    const messages: MessageDefinition[] = [
      {
        id: msgSponsorWelcome,
        chapterId,
        senderStakeholderId: sponsorId,
        channel: "inbox",
        subject: localizedText("Welcome — Connected Care needs a clear start"),
        body: localizedText(
          "Welcome aboard. The board expects visible access improvement, and I need you to establish a clear initial objective for Connected Care this week. Review the authorization summary and come prepared to the program kickoff. This message is context — not a decision request — but I do expect momentum.",
        ),
        availableWhen: always,
        relatedDecisionId: decisionDefineObjective,
        relatedMeetingId: kickoffMeetingId,
        relatedDocumentIds: [authorizationDocId, businessCaseDocId],
        informationalOnly: true,
        requiresResponse: false,
        urgency: "urgent",
        accessibilitySummary: localizedText(
          "Urgent welcome message from the executive sponsor",
        ),
      },
      {
        id: msgOperationsScheduling,
        chapterId,
        senderStakeholderId: operationsId,
        channel: "inbox",
        subject: localizedText(
          "Scheduling and call-center pressure is unsustainable",
        ),
        body: localizedText(
          "Our average new-patient wait exceeds 28 days at four clinics, call abandonment is above 22% during peak hours, and clinic managers are inventing local workarounds. Whatever objective you recommend, it has to address frontline scheduling pain — not only platform deployment milestones.",
        ),
        availableWhen: always,
        relatedDecisionId: decisionDefineObjective,
        relatedMeetingId: kickoffMeetingId,
        relatedDocumentIds: [dashboardDocId],
        informationalOnly: true,
        requiresResponse: false,
        urgency: "important",
        accessibilitySummary: localizedText(
          "Operations message describing scheduling problems",
        ),
      },
      {
        id: msgPrivacyCaution,
        chapterId,
        senderStakeholderId: privacyId,
        channel: "inbox",
        subject: localizedText("Privacy caution before scope hardens"),
        body: localizedText(
          "Please do not frame Connected Care as a pure technology rollout. Patient data sharing, vendor access, and any AI-assisted scheduling recommendations need privacy and compliance involvement from the start. I will escalate if early decisions lock in design without those controls.",
        ),
        availableWhen: always,
        relatedDecisionId: decisionEstablishGovernance,
        relatedMeetingId: null,
        relatedDocumentIds: [riskDocId, authorizationDocId],
        informationalOnly: true,
        requiresResponse: false,
        urgency: "important",
        accessibilitySummary: localizedText(
          "Privacy and compliance caution about early scope decisions",
        ),
      },
      {
        id: msgAnalystIncomplete,
        chapterId,
        senderStakeholderId: analystId,
        channel: "inbox",
        subject: localizedText(
          "Evidence pack is incomplete for a firm objective",
        ),
        body: localizedText(
          "I assembled what we have: authorization summary, initial business case, and a partial access dashboard. We still lack consistent clinic workflow maps, equity-split wait-time data, and a validated benefit sensitivity model. You can decide with imperfect evidence — but please treat gaps as risks, not as settled facts.",
        ),
        availableWhen: always,
        relatedDecisionId: decisionDefineObjective,
        relatedMeetingId: null,
        relatedDocumentIds: [
          authorizationDocId,
          businessCaseDocId,
          dashboardDocId,
          scopeDocId,
        ],
        informationalOnly: true,
        requiresResponse: false,
        urgency: "important",
        accessibilitySummary: localizedText(
          "Analyst message noting incomplete evidence",
        ),
      },
      {
        id: msgKickoffReminder,
        chapterId,
        senderStakeholderId: programDirectorId,
        channel: "inbox",
        subject: localizedText("Reminder: Connected Care Program Kickoff"),
        body: localizedText(
          "Calendar reminder only: the Connected Care Program Kickoff is on your Workplace agenda. Bring notes from the authorization summary and access dashboard. No reply required.",
        ),
        availableWhen: always,
        relatedDecisionId: null,
        relatedMeetingId: kickoffMeetingId,
        relatedDocumentIds: [authorizationDocId, dashboardDocId],
        informationalOnly: true,
        requiresResponse: false,
        urgency: "routine",
        accessibilitySummary: localizedText(
          "Informational kickoff reminder from the program director",
        ),
      },
    ];

    const meetings: MeetingDefinition[] = [
      {
        id: kickoffMeetingId,
        chapterId,
        title: localizedText("Connected Care Program Kickoff"),
        purpose: localizedText(
          "Align on the access problem, competing expectations, and the decisions needed to start Chapter One on solid footing.",
        ),
        participantStakeholderIds: [
          sponsorId,
          programDirectorId,
          operationsId,
          clinicalId,
          technologyId,
        ],
        agendaItems: [
          {
            title: localizedText("Program authorization and constraints"),
            durationMinutes: 15,
          },
          {
            title: localizedText("Current access performance signals"),
            durationMinutes: 20,
          },
          {
            title: localizedText("Stakeholder concerns and open questions"),
            durationMinutes: 20,
          },
          {
            title: localizedText(
              "Next decisions: objective, delivery, governance",
            ),
            durationMinutes: 15,
          },
        ],
        availableWhen: always,
        completionWhen: {
          kind: "meeting_status",
          meetingId: kickoffMeetingId,
          status: "completed",
        },
        relatedDecisionIds: [
          decisionDefineObjective,
          decisionSelectDelivery,
          decisionEstablishGovernance,
        ],
        relatedDocumentIds: [
          authorizationDocId,
          businessCaseDocId,
          dashboardDocId,
          briefingDocId,
        ],
        estimatedMinutes: 70,
        required: true,
        accessibilitySummary: localizedText(
          "Required Connected Care Program Kickoff meeting",
        ),
      },
    ];

    const documents: DocumentDefinition[] = [
      {
        id: authorizationDocId,
        chapterId,
        documentType: "authorization",
        title: localizedText("Program Authorization Summary"),
        summary: localizedText(
          "Executive authorization for the Connected Care Access Program, including approved budget envelope and open constraints.",
        ),
        body: localizedText(
          "Northstar’s executive team authorized the Connected Care Access Program with a $4.8 million budget and a $480,000 contingency reserve controlled by the steering committee. The program is expected to select, configure, integrate, pilot, and deploy a unified patient-access and scheduling platform across twelve outpatient clinics. Authorization is conditional: success measures are not yet finalized, clinic workflow variation is acknowledged but not mapped, and privacy/compliance must approve any vendor data-access model before production use. The sponsor expects a defensible initial objective within the first learning cycle. The authorization does not prescribe predictive, adaptive, or hybrid delivery — that choice remains a project-management recommendation. Contested items include rollout pace, standardization depth, and whether patient-access outcomes or platform go-live dates define success.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceAuthorization],
        supportsDecisionIds: [
          decisionDefineObjective,
          decisionEstablishGovernance,
        ],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Program Authorization Summary"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the program authorization summary",
          ),
          readingOrderNotes: null,
        },
      },
      {
        id: businessCaseDocId,
        chapterId,
        documentType: "business_case",
        title: localizedText("Initial Business Case"),
        summary: localizedText(
          "Approved business case estimating annual benefits and listing major investment categories.",
        ),
        body: localizedText(
          "The initial business case estimates $3.2 million in annual value after stabilization through reduced appointment leakage, improved schedule utilization, lower avoidable call volume, reduced manual rework, improved retention, and better access reporting. Investment categories include platform and integration ($1.75M), implementation services ($850K), internal staffing and backfill ($650K), workflow redesign and training ($500K), data migration and quality ($350K), change communication ($220K), security/privacy/compliance ($180K), and measurement/stabilization ($300K). Assumptions include clinic willingness to adopt standard scheduling rules, vendor integration capacity matching the proposed timeline, and benefit realization beginning after a controlled pilot. Finance has already flagged that benefit sensitivity to delayed adoption or weaker utilization gains is under-analyzed. Clinical and privacy leaders note that quality and equity outcomes are mentioned but not operationalized as primary success measures.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceBusinessCase],
        supportsDecisionIds: [decisionDefineObjective, decisionSelectDelivery],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Initial Business Case"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the initial business case",
          ),
          readingOrderNotes: null,
        },
      },
      {
        id: dashboardDocId,
        chapterId,
        documentType: "dashboard",
        title: localizedText("Access Performance Dashboard (Partial)"),
        summary: localizedText(
          "Partial network access metrics showing wait times, abandonment, and clinic variation.",
        ),
        body: localizedText(
          "Network snapshot (latest 90 days): median new-patient wait 21 days (range 9–41 by clinic); four clinics above 28 days. Call abandonment 18% overall, 22–27% at peak. Same-week appointment fill rate 61%. No-show rate 11%. Avoidable appointment gaps estimated at 7% of open slots. Patient satisfaction (access domain) declined from 78 to 71 over two quarters. Equity split is incomplete: rural and interpreter-dependent patients appear under-served in two clinics, but sample sizes are thin. Dashboard caveats: clinic coding of wait reasons is inconsistent; call-center data excludes after-hours overflow; digital self-scheduling uptake is measured only for three clinics. The dashboard supports problem framing for delivery approach and sequencing, but does not alone justify a single success metric.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceAccessDashboard],
        supportsDecisionIds: [decisionSelectDelivery, decisionDefineObjective],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Access Performance Dashboard"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the access performance dashboard",
          ),
          readingOrderNotes: null,
        },
      },
      {
        id: briefingDocId,
        chapterId,
        documentType: "briefing",
        title: localizedText("Stakeholder Briefing — Chapter One"),
        summary: localizedText(
          "Concise map of stakeholder pressures entering the Connected Care kickoff.",
        ),
        body: localizedText(
          "Sponsor (Elena): wants rapid, board-visible progress; dislikes prolonged analysis. Program Director (Marcus): expects evidence-based recommendations and early escalation without dependency. Operations (Renee): demands relief for scheduling and call-center pain; fears designs built without frontline input. Clinical (Priya): supports access improvement but resists unsafe standardization. Technology (Jordan): supports modernization with disciplined architecture; skeptical of vendor timeline claims. Privacy (Aisha): requires early controls for data sharing, vendor access, and any AI features. Finance (Thomas): challenges benefit confidence and contingency use. Patient Experience (Sofia): insists equity and accessibility are design constraints. Vendor (Maya): promotes standard product path and contractual clarity. Use this briefing when choosing how much participation early governance should require.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceStakeholderBriefing],
        supportsDecisionIds: [decisionEstablishGovernance],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Stakeholder Briefing"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the stakeholder briefing",
          ),
          readingOrderNotes: null,
        },
      },
      {
        id: scopeDocId,
        chapterId,
        documentType: "scope",
        title: localizedText("Scope and Assumptions Working Draft"),
        summary: localizedText(
          "Working draft of in-scope capabilities, out-of-scope items, and unverified assumptions.",
        ),
        body: localizedText(
          "In-scope (working): unified scheduling rules engine, call-center integration, patient self-scheduling for eligible visit types, clinic staff workflow updates, access reporting, pilot in two clinics then phased rollout. Out-of-scope (working): full EHR replacement, inpatient bed management, retail partnership portals. Unverified assumptions: (1) twelve clinics can converge on a common rule set within six months; (2) vendor APIs support Northstar’s eligibility and interpreter workflows without major customization; (3) call-center staffing can absorb training load during pilot; (4) benefit model remains valid if rollout slips one quarter. Discovery needs: workflow variation map, data-quality baseline, privacy impact assessment, and patient accessibility review. Delivery approach selection should explicitly address how much discovery remains before commitments harden.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceScopeAssumptions],
        supportsDecisionIds: [decisionSelectDelivery, decisionDefineObjective],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Scope and Assumptions Working Draft"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the scope and assumptions draft",
          ),
          readingOrderNotes: null,
        },
      },
      {
        id: riskDocId,
        chapterId,
        documentType: "risk",
        title: localizedText("Initial Risk and Constraint Register"),
        summary: localizedText(
          "Early risks and hard constraints that should influence governance and engagement design.",
        ),
        body: localizedText(
          "Hard constraints: contingency spend requires steering approval; privacy must approve vendor data-access patterns before production; clinical quality governance can pause workflow changes that harm safety. High risks: (R1) over-commitment to go-live dates before integration readiness; (R2) clinic resistance if local workflows are ignored; (R3) benefit confidence collapses under finance scrutiny; (R4) privacy findings late in design create rework; (R5) vendor optimism hides customization debt; (R6) incomplete equity data leads to access designs that worsen disparities. Engagement implication: lightweight sponsor-only governance can accelerate early decisions but increases later rework and trust damage if clinical, privacy, operations, and patient-experience voices arrive too late. Cross-functional early engagement slows initial pace but improves decision durability.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceRiskConstraints],
        supportsDecisionIds: [
          decisionEstablishGovernance,
          decisionSelectDelivery,
        ],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText(
            "Initial Risk and Constraint Register",
          ),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text of the initial risk and constraint register",
          ),
          readingOrderNotes: null,
        },
      },
    ];

    const notifications: NotificationDefinition[] = [
      {
        id: notificationReadyId,
        chapterId,
        title: localizedText("Chapter One is ready"),
        summary: localizedText(
          "Your Connected Care Chapter One activities, evidence, and decisions are available in the Workplace.",
        ),
        body: localizedText(
          "Begin with the authorization summary and access dashboard, attend the program kickoff, then complete the three required decisions in order.",
        ),
        availableWhen: always,
        accessibilitySummary: localizedText("Chapter One ready notification"),
      },
    ];

    const activities: ActivityDefinition[] = [
      {
        id: activityReviewAuth,
        chapterId,
        title: localizedText("Review program authorization"),
        instructions: {
          default: localizedText(
            "Read the Program Authorization Summary and note budget, constraints, and unresolved success measures.",
          ),
          explorer: localizedText(
            "Open document.authorization-summary. List three constraints that should shape your initial objective.",
          ),
        },
        activityType: "review",
        availableWhen: always,
        completionWhen: {
          kind: "activity_status",
          activityId: activityReviewAuth,
          status: "completed",
        },
        required: true,
        relatedDocumentIds: [authorizationDocId, businessCaseDocId],
        relatedDecisionIds: [decisionDefineObjective],
        learningObjectiveIds: [loOrientation],
        estimatedMinutes: 15,
      },
      {
        id: activityAnalyzeEvidence,
        chapterId,
        title: localizedText("Analyze access evidence"),
        instructions: {
          default: localizedText(
            "Compare the access dashboard with scope assumptions. Identify what is known, unknown, and contested.",
          ),
          practitioner: localizedText(
            "Flag which metrics are decision-ready versus which require further discovery before delivery commitments.",
          ),
        },
        activityType: "analysis",
        availableWhen: always,
        completionWhen: {
          kind: "activity_status",
          activityId: activityAnalyzeEvidence,
          status: "completed",
        },
        required: true,
        relatedDocumentIds: [dashboardDocId, scopeDocId, businessCaseDocId],
        relatedDecisionIds: [decisionSelectDelivery, decisionDefineObjective],
        learningObjectiveIds: [loEvidence],
        estimatedMinutes: 20,
      },
      {
        id: activityAttendKickoff,
        chapterId,
        title: localizedText("Attend Connected Care Program Kickoff"),
        instructions: {
          default: localizedText(
            "Complete the required kickoff meeting and capture competing stakeholder expectations.",
          ),
        },
        activityType: "practice",
        availableWhen: always,
        completionWhen: {
          kind: "all",
          conditions: [
            {
              kind: "meeting_status",
              meetingId: kickoffMeetingId,
              status: "completed",
            },
            {
              kind: "activity_status",
              activityId: activityAttendKickoff,
              status: "completed",
            },
          ],
        },
        required: true,
        relatedDocumentIds: [briefingDocId, authorizationDocId],
        relatedDecisionIds: [
          decisionDefineObjective,
          decisionSelectDelivery,
          decisionEstablishGovernance,
        ],
        learningObjectiveIds: [loOrientation, loGovernance],
        estimatedMinutes: 70,
      },
      {
        id: activityReviewConcerns,
        chapterId,
        title: localizedText("Review stakeholder concerns"),
        instructions: {
          default: localizedText(
            "Review the stakeholder briefing and risk register. Note who gains or loses under speed-first versus participation-first governance.",
          ),
          leader: localizedText(
            "Map engagement posture to Chapter Two risk: who must be inside early governance to avoid later crisis amplification.",
          ),
        },
        activityType: "review",
        availableWhen: always,
        completionWhen: {
          kind: "activity_status",
          activityId: activityReviewConcerns,
          status: "completed",
        },
        required: true,
        relatedDocumentIds: [briefingDocId, riskDocId],
        relatedDecisionIds: [decisionEstablishGovernance],
        learningObjectiveIds: [loGovernance],
        estimatedMinutes: 15,
      },
      {
        id: activitySubmitDecisions,
        chapterId,
        title: localizedText("Submit Chapter One decisions"),
        instructions: {
          default: localizedText(
            "Resolve the three required decisions in order: objective, delivery approach, then governance/engagement.",
          ),
          explorer: localizedText(
            "Complete decision.define-objective first. The later decisions unlock after prior ones are resolved. Cite evidence in your rationale.",
          ),
        },
        activityType: "artifact",
        availableWhen: {
          kind: "all",
          conditions: [
            {
              kind: "activity_status",
              activityId: activityReviewAuth,
              status: "completed",
            },
            {
              kind: "activity_status",
              activityId: activityAnalyzeEvidence,
              status: "completed",
            },
          ],
        },
        completionWhen: {
          kind: "all",
          conditions: [
            {
              kind: "decision_status",
              decisionId: decisionDefineObjective,
              status: "resolved",
            },
            {
              kind: "decision_status",
              decisionId: decisionSelectDelivery,
              status: "resolved",
            },
            {
              kind: "decision_status",
              decisionId: decisionEstablishGovernance,
              status: "resolved",
            },
            {
              kind: "activity_status",
              activityId: activitySubmitDecisions,
              status: "completed",
            },
          ],
        },
        required: true,
        relatedDocumentIds: [
          authorizationDocId,
          businessCaseDocId,
          dashboardDocId,
          scopeDocId,
          briefingDocId,
          riskDocId,
        ],
        relatedDecisionIds: [
          decisionDefineObjective,
          decisionSelectDelivery,
          decisionEstablishGovernance,
        ],
        learningObjectiveIds: [loOrientation, loEvidence, loGovernance],
        estimatedMinutes: 35,
      },
      {
        id: activityReflection,
        chapterId,
        title: localizedText("Chapter One reflection"),
        instructions: {
          default: localizedText(
            "Reflect on which evidence most shaped your objective and whether your governance posture prepares Chapter Two for conflict.",
          ),
          explorer: localizedText(
            "Write a short reflection: What trade-off did you accept, and which stakeholder will challenge it next?",
          ),
        },
        activityType: "reflection",
        availableWhen: {
          kind: "decision_status",
          decisionId: decisionEstablishGovernance,
          status: "resolved",
        },
        completionWhen: {
          kind: "activity_status",
          activityId: activityReflection,
          status: "completed",
        },
        required: true,
        relatedDocumentIds: [briefingDocId],
        relatedDecisionIds: [
          decisionDefineObjective,
          decisionSelectDelivery,
          decisionEstablishGovernance,
        ],
        learningObjectiveIds: [loOrientation],
        estimatedMinutes: 15,
      },
    ];

    const decisions: ContentDecisionDefinition[] = [
      {
        id: decisionDefineObjective,
        chapterId,
        title: localizedText("Define Initial Project Objective"),
        situation: localizedText(
          "Connected Care is authorized, but leaders disagree on whether success means fast platform deployment, measurable patient-access outcomes, operational efficiency, or privacy/quality safeguards.",
        ),
        prompt: {
          default: localizedText(
            "Select the primary objective that will guide Chapter One planning and stakeholder communication.",
          ),
          explorer: localizedText(
            "Choose one primary objective. Use the authorization summary and business case. There is no single correct answer — pick a defensible trade-off and note who may push back.",
          ),
          practitioner: localizedText(
            "Recommend a primary objective that executives can track. Balance sponsor urgency against incomplete evidence and privacy constraints.",
          ),
          leader: localizedText(
            "Set the north-star objective under ambiguity. Balance sponsor urgency, incomplete evidence, and professional accountability.",
          ),
        },
        decisionType: "single_select",
        availableWhen: always,
        requiredEvidence: [
          {
            evidenceTag: evidenceAuthorization,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
          {
            evidenceTag: evidenceBusinessCase,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
        ],
        options: [
          {
            id: optObjectiveTech,
            label: localizedText("Prioritize rapid platform deployment"),
            description: localizedText(
              "Define success primarily as on-time platform configuration, integration milestones, and clinic go-live dates.",
            ),
            rationalePrompt: localizedText(
              "Why should technology deployment pace be the primary objective now?",
            ),
            availableWhen: always,
          },
          {
            id: optObjectiveAccess,
            label: localizedText("Prioritize patient-access outcomes"),
            description: localizedText(
              "Define success primarily as wait-time, abandonment, and equitable access improvements — even if deployment slows.",
            ),
            rationalePrompt: localizedText(
              "Why should patient-access outcomes lead the objective framing?",
            ),
            availableWhen: always,
          },
          {
            id: optObjectiveOps,
            label: localizedText("Prioritize operational efficiency"),
            description: localizedText(
              "Define success primarily as call-center relief, schedule utilization, and reduced frontline rework.",
            ),
            rationalePrompt: localizedText(
              "Why should operational efficiency be the primary near-term objective?",
            ),
            availableWhen: always,
          },
          {
            id: optObjectivePrivacy,
            label: localizedText(
              "Prioritize privacy, quality, and safe adoption",
            ),
            description: localizedText(
              "Define success primarily as safe data use, clinical workflow integrity, and controlled adoption — accepting slower visible gains.",
            ),
            rationalePrompt: localizedText(
              "Why should privacy and quality safeguards lead the objective framing?",
            ),
            availableWhen: always,
          },
        ],
        rubric: {
          competencyWeights: {
            [competencyDecisionQuality]: 40,
            [competencyValueDelivery]: 35,
            [competencyStakeholderEngagement]: 25,
          },
          notes: localizedText(
            "Score evidence use, value framing, and awareness of stakeholder trade-offs. No option is automatically correct.",
          ),
        },
        consequenceIdsByOption: {
          [optObjectiveTech]: [cObjectiveTech],
          [optObjectiveAccess]: [cObjectiveAccess],
          [optObjectiveOps]: [cObjectiveOps],
          [optObjectivePrivacy]: [cObjectivePrivacy],
        },
        required: true,
        reversible: false,
        learningObjectiveIds: [loOrientation, loEvidence],
        accessibilitySummary: localizedText(
          "Decision to define the initial project objective",
        ),
      },
      {
        id: decisionSelectDelivery,
        chapterId,
        title: localizedText("Select Initial Delivery Approach"),
        situation: localizedText(
          "With an initial objective set, leadership asks how Connected Care should sequence discovery and delivery. Predictive, adaptive, and hybrid postures each fit some Northstar constraints and conflict with others.",
        ),
        prompt: {
          default: localizedText(
            "Select an initial delivery approach tailored to Northstar’s evidence gaps and access pressures.",
          ),
          explorer: localizedText(
            "Compare predictive (plan-driven), adaptive (discovery-driven), and hybrid. Hybrid is common in healthcare — but it is not automatically best for Northstar’s current unknowns.",
          ),
          practitioner: localizedText(
            "Tailor the delivery posture to remaining discovery needs, clinic variation, and executive milestone pressure. Justify with dashboard and scope evidence.",
          ),
          leader: localizedText(
            "Choose a delivery posture that you can defend when sponsor speed and technical caution collide. Avoid defaulting to hybrid without a clear control strategy.",
          ),
        },
        decisionType: "single_select",
        availableWhen: {
          kind: "decision_status",
          decisionId: decisionDefineObjective,
          status: "resolved",
        },
        requiredEvidence: [
          {
            evidenceTag: evidenceAccessDashboard,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
          {
            evidenceTag: evidenceScopeAssumptions,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
        ],
        options: [
          {
            id: optDeliveryPredictive,
            label: localizedText("Predictive (plan-driven) start"),
            description: localizedText(
              "Lock a phase plan, milestones, and baseline scope early to reassure executives and finance.",
            ),
            rationalePrompt: localizedText(
              "Why is a predictive start appropriate given current evidence?",
            ),
            availableWhen: always,
          },
          {
            id: optDeliveryAdaptive,
            label: localizedText("Adaptive (discovery-driven) start"),
            description: localizedText(
              "Keep near-term increments flexible while workflows, data quality, and clinic variation are still poorly mapped.",
            ),
            rationalePrompt: localizedText(
              "Why should discovery lead before firmer commitments?",
            ),
            availableWhen: always,
          },
          {
            id: optDeliveryHybrid,
            label: localizedText("Hybrid tailored approach"),
            description: localizedText(
              "Combine a thin predictive backbone for governance milestones with adaptive discovery loops for clinic workflows.",
            ),
            rationalePrompt: localizedText(
              "How will hybrid controls prevent either false certainty or endless discovery?",
            ),
            availableWhen: always,
          },
        ],
        rubric: {
          competencyWeights: {
            [competencyDecisionQuality]: 35,
            [competencyValueDelivery]: 30,
            [competencyGovernance]: 35,
          },
          notes: localizedText(
            "Score tailoring quality by how well the approach fits constraints, evidence, and governance needs.",
          ),
        },
        consequenceIdsByOption: {
          [optDeliveryPredictive]: [cDeliveryPredictive],
          [optDeliveryAdaptive]: [cDeliveryAdaptive],
          [optDeliveryHybrid]: [cDeliveryHybrid],
        },
        required: true,
        reversible: false,
        learningObjectiveIds: [loEvidence],
        accessibilitySummary: localizedText(
          "Decision to select the initial delivery approach",
        ),
      },
      {
        id: decisionEstablishGovernance,
        chapterId,
        title: localizedText(
          "Establish Early Governance and Stakeholder Engagement",
        ),
        situation: localizedText(
          "You must recommend how Connected Care will make early decisions: sponsor-led speed, broad cross-functional participation, or a staged engagement model. The choice prepares Chapter Two stakeholder tension.",
        ),
        prompt: {
          default: localizedText(
            "Select an early governance and stakeholder engagement posture.",
          ),
          explorer: localizedText(
            "Faster governance can feel efficient, but excluding clinical, privacy, operations, or patient-experience voices often creates later conflict. Review the stakeholder briefing and risk register.",
          ),
          practitioner: localizedText(
            "Trade speed against participation. Your engagement posture will affect trust signals heading into investigation and conflict.",
          ),
          leader: localizedText(
            "Design governance for durability under pressure. Consider who must be inside the tent before scope and vendor assumptions harden.",
          ),
        },
        decisionType: "single_select",
        availableWhen: {
          kind: "decision_status",
          decisionId: decisionSelectDelivery,
          status: "resolved",
        },
        requiredEvidence: [
          {
            evidenceTag: evidenceStakeholderBriefing,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
          {
            evidenceTag: evidenceRiskConstraints,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
        ],
        options: [
          {
            id: optGovSponsorLed,
            label: localizedText("Sponsor-led lightweight governance"),
            description: localizedText(
              "Centralize early decisions with the sponsor and program director to move quickly; broaden engagement later.",
            ),
            rationalePrompt: localizedText(
              "Why is speed-first, centralized governance the right early posture?",
            ),
            availableWhen: always,
          },
          {
            id: optGovCrossFunctional,
            label: localizedText("Cross-functional steering from day one"),
            description: localizedText(
              "Include clinical, operations, technology, privacy, finance, and patient-experience voices in early steering — accepting slower starts.",
            ),
            rationalePrompt: localizedText(
              "Why should broad participation outweigh early speed?",
            ),
            availableWhen: always,
          },
          {
            id: optGovStaged,
            label: localizedText("Staged engagement with expanding circle"),
            description: localizedText(
              "Start with a core decision group, then formally expand participation at defined discovery gates.",
            ),
            rationalePrompt: localizedText(
              "How will staged gates protect both pace and inclusion?",
            ),
            availableWhen: always,
          },
        ],
        rubric: {
          competencyWeights: {
            [competencyGovernance]: 40,
            [competencyStakeholderEngagement]: 40,
            [competencyDecisionQuality]: 20,
          },
          notes: localizedText(
            "Score engagement design and governance judgment for Chapter Two readiness.",
          ),
        },
        consequenceIdsByOption: {
          [optGovSponsorLed]: [cGovSponsorLed],
          [optGovCrossFunctional]: [cGovCrossFunctional],
          [optGovStaged]: [cGovStaged],
        },
        required: true,
        reversible: false,
        learningObjectiveIds: [loGovernance],
        accessibilitySummary: localizedText(
          "Decision to establish early governance and stakeholder engagement",
        ),
      },
    ];

    const consequences: ContentConsequenceDefinition[] = [
      {
        id: cObjectiveTech,
        sourceDecisionId: decisionDefineObjective,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionDefineObjective,
          optionId: optObjectiveTech,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("schedule_pressure"),
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: technologyId,
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: clinicalId,
            delta: -6,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyValueDelivery,
            delta: -2,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "The sponsor welcomes deployment-focused clarity. Clinical leaders worry access quality is being reduced to go-live dates.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cObjectiveAccess,
        sourceDecisionId: decisionDefineObjective,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionDefineObjective,
          optionId: optObjectiveAccess,
        },
        timing: {
          kind: "delayed",
          afterSimulationDays: 2,
          triggerEventId: null,
        },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("value_confidence"),
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: patientExperienceId,
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: operationsId,
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: -4,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyValueDelivery,
            delta: 6,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "After a short delay, patient-experience and operations support rises — while the sponsor presses for more tangible near-term milestones.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cObjectiveOps,
        sourceDecisionId: decisionDefineObjective,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionDefineObjective,
          optionId: optObjectiveOps,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("operational_stability"),
            delta: 7,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: operationsId,
            delta: 12,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: financeId,
            delta: 4,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: privacyId,
            delta: -3,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyDecisionQuality,
            delta: 3,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Operations rallies behind efficiency-focused framing. Privacy notes that speed of operational change still needs control design.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cObjectivePrivacy,
        sourceDecisionId: decisionDefineObjective,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionDefineObjective,
          optionId: optObjectivePrivacy,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("risk_exposure"),
            delta: -6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: privacyId,
            delta: 12,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: clinicalId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: -8,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyGovernance,
            delta: 5,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Privacy and clinical leaders gain confidence. The sponsor worries visible access gains will slip.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cDeliveryPredictive,
        sourceDecisionId: decisionSelectDelivery,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionSelectDelivery,
          optionId: optDeliveryPredictive,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("plan_certainty"),
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: financeId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: technologyId,
            delta: -5,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyDecisionQuality,
            delta: 2,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Finance and the sponsor appreciate plan certainty. Technology warns that unknowns may make early baselining brittle.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cDeliveryAdaptive,
        sourceDecisionId: decisionSelectDelivery,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionSelectDelivery,
          optionId: optDeliveryAdaptive,
        },
        timing: {
          kind: "delayed",
          afterSimulationDays: 1,
          triggerEventId: null,
        },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("discovery_coverage"),
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: technologyId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: analystId,
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: -7,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyValueDelivery,
            delta: 3,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "As discovery expands, technology and analysis confidence rise — while sponsor impatience grows about delayed commitments.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cDeliveryHybrid,
        sourceDecisionId: decisionSelectDelivery,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionSelectDelivery,
          optionId: optDeliveryHybrid,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("tailoring_coherence"),
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: programDirectorId,
            delta: 7,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: vendorId,
            delta: -3,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyGovernance,
            delta: 4,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyDecisionQuality,
            delta: 3,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Hybrid is accepted as a workable compromise if controls stay explicit. The vendor prefers firmer standard-product sequencing.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cGovSponsorLed,
        sourceDecisionId: decisionEstablishGovernance,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionEstablishGovernance,
          optionId: optGovSponsorLed,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("decision_velocity"),
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: privacyId,
            delta: -8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: clinicalId,
            delta: -6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: patientExperienceId,
            delta: -5,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyStakeholderEngagement,
            delta: -3,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Early decisions will move faster, but privacy, clinical, and patient-experience trust dips — Chapter Two conflict risk rises.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cGovCrossFunctional,
        sourceDecisionId: decisionEstablishGovernance,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionEstablishGovernance,
          optionId: optGovCrossFunctional,
        },
        timing: {
          kind: "delayed",
          afterSimulationDays: 2,
          triggerEventId: null,
        },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("decision_velocity"),
            delta: -6,
          },
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("engagement_breadth"),
            delta: 12,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: privacyId,
            delta: 10,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: clinicalId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: operationsId,
            delta: 6,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: patientExperienceId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: sponsorId,
            delta: -5,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyStakeholderEngagement,
            delta: 7,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyGovernance,
            delta: 5,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Broader steering slows early velocity, but delayed trust gains across privacy, clinical, operations, and patient experience strengthen Chapter Two readiness.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: cGovStaged,
        sourceDecisionId: decisionEstablishGovernance,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId: decisionEstablishGovernance,
          optionId: optGovStaged,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("governance_clarity"),
            delta: 7,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: programDirectorId,
            delta: 8,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: financeId,
            delta: 4,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: operationsId,
            delta: 2,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId: privacyId,
            delta: 3,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyGovernance,
            delta: 6,
          },
          {
            kind: "emit_competency_signal",
            competencyId: competencyStakeholderEngagement,
            delta: 4,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Staged gates give the program director a controllable engagement path. Stakeholders accept the model if expansion criteria stay explicit.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
    ];

    const assessment: AssessmentDefinition = {
      competencies: [
        {
          id: competencyDecisionQuality,
          title: localizedText("Decision quality"),
          description: localizedText(
            "Evidence-based judgment under ambiguity and competing pressures.",
          ),
        },
        {
          id: competencyStakeholderEngagement,
          title: localizedText("Stakeholder engagement"),
          description: localizedText(
            "Building trust and participation across conflicting stakeholder interests.",
          ),
        },
        {
          id: competencyGovernance,
          title: localizedText("Governance"),
          description: localizedText(
            "Designing decision rights, escalation, and accountable controls.",
          ),
        },
        {
          id: competencyValueDelivery,
          title: localizedText("Value delivery"),
          description: localizedText(
            "Connecting project choices to patient-access and organizational value outcomes.",
          ),
        },
      ],
      weights: {
        [competencyDecisionQuality]: 30,
        [competencyStakeholderEngagement]: 25,
        [competencyGovernance]: 25,
        [competencyValueDelivery]: 20,
      },
      decisionRubrics: [
        {
          competencyWeights: {
            [competencyDecisionQuality]: 40,
            [competencyValueDelivery]: 35,
            [competencyStakeholderEngagement]: 25,
          },
          notes: localizedText("Chapter One objective decision rubric"),
        },
        {
          competencyWeights: {
            [competencyDecisionQuality]: 35,
            [competencyValueDelivery]: 30,
            [competencyGovernance]: 35,
          },
          notes: localizedText("Chapter One delivery approach rubric"),
        },
        {
          competencyWeights: {
            [competencyGovernance]: 40,
            [competencyStakeholderEngagement]: 40,
            [competencyDecisionQuality]: 20,
          },
          notes: localizedText("Chapter One governance decision rubric"),
        },
      ],
    };

    const achievements: AchievementDefinition[] = [
      {
        id: asAchievementId("achievement.evidence-first"),
        title: localizedText("Evidence First"),
        description: localizedText(
          "Completed access-evidence analysis before locking Chapter One decisions.",
        ),
        awardedWhen: {
          kind: "activity_status",
          activityId: activityAnalyzeEvidence,
          status: "completed",
        },
        iconAssetId: null,
      },
      {
        id: asAchievementId("achievement.value-guardian"),
        title: localizedText("Value Guardian"),
        description: localizedText(
          "Resolved the initial objective decision with value-aware framing.",
        ),
        awardedWhen: {
          kind: "decision_status",
          decisionId: decisionDefineObjective,
          status: "resolved",
        },
        iconAssetId: null,
      },
      {
        id: asAchievementId("achievement.trusted-communicator"),
        title: localizedText("Trusted Communicator"),
        description: localizedText(
          "Established an early governance and engagement posture stakeholders can understand.",
        ),
        awardedWhen: {
          kind: "decision_status",
          decisionId: decisionEstablishGovernance,
          status: "resolved",
        },
        iconAssetId: null,
      },
      {
        id: asAchievementId("achievement.adaptive-planner"),
        title: localizedText("Adaptive Planner"),
        description: localizedText(
          "Selected a tailored delivery approach after defining the objective.",
        ),
        awardedWhen: {
          kind: "decision_status",
          decisionId: decisionSelectDelivery,
          status: "resolved",
        },
        iconAssetId: null,
      },
    ];

    const outcomes: OutcomeDefinition[] = [
      {
        id: asOutcomeId("outcome.chapter-one-foundation"),
        title: localizedText("Chapter One foundation set"),
        summary: localizedText(
          "The learner established an initial objective, delivery posture, and governance/engagement model for Connected Care using available evidence despite incomplete information.",
        ),
        classificationRank: 1,
        eligibleWhen: {
          kind: "all",
          conditions: [
            {
              kind: "decision_status",
              decisionId: decisionDefineObjective,
              status: "resolved",
            },
            {
              kind: "decision_status",
              decisionId: decisionSelectDelivery,
              status: "resolved",
            },
            {
              kind: "decision_status",
              decisionId: decisionEstablishGovernance,
              status: "resolved",
            },
            {
              kind: "activity_status",
              activityId: activityReflection,
              status: "completed",
            },
          ],
        },
        reflectionPrompts: [
          localizedText(
            "Which evidence most influenced your initial objective, and what remains unverified?",
          ),
          localizedText(
            "How might your governance posture amplify or reduce Chapter Two stakeholder conflict?",
          ),
        ],
      },
    ];

    return {
      chapter,
      stakeholders,
      messages,
      meetings,
      documents,
      notifications,
      activities,
      decisions,
      consequences,
      assessment,
      achievements,
      outcomes,
    };
  };
