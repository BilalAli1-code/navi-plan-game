/**
 * Shared builders for BC-003 representative content fixtures.
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
  type BusinessCaseId,
} from "../../../shared-kernel/ids";
import { always } from "./conditions";
import type { CaseAvailability, Difficulty, ExperienceLevel } from "./enums";
import {
  BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
  CURRENT_RUNTIME_COMPATIBILITY,
} from "./enums";
import {
  asCompetencyId,
  asEvidenceTag,
  asLearningObjectiveId,
  asMessageDefinitionId,
  asOutcomeId,
  asPmbokAlignmentTag,
} from "./ids";
import { localizedText } from "./localized";
import type { BusinessCaseContentPackage } from "./package";
import { stampPackageChecksum } from "./checksum";

export interface FixtureSeed {
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly industry: string;
  readonly organizationType: string;
  readonly projectType: string;
  readonly difficulty: Difficulty;
  readonly estimatedMinutes: number;
  readonly learningDays: number;
  readonly chapterCount: number;
  readonly publicationStatus:
    "draft" | "validated" | "approved" | "published" | "retired";
  readonly availability: CaseAvailability;
  readonly experienceLevels?: readonly ExperienceLevel[];
}

export const buildMinimalPackage = (
  seed: FixtureSeed,
): BusinessCaseContentPackage => {
  const levels = seed.experienceLevels ?? [
    "explorer",
    "practitioner",
    "leader",
  ];
  const chapterId = asChapterId("chapter.orientation");
  const stakeholderId = asStakeholderId("stakeholder.sponsor");
  const decisionId = asDecisionId("decision.delivery-approach");
  const optionA = asDecisionOptionId("option.conservative");
  const optionB = asDecisionOptionId("option.balanced");
  const documentId = asDocumentId("document.project-charter");
  const activityId = asActivityId("activity.review-charter");
  const meetingId = asMeetingDefinitionId("meeting.kickoff");
  const messageId = asMessageDefinitionId("message.sponsor-welcome");
  const notificationId = asNotificationId("notification.orientation");
  const consequenceA = "consequence.conservative-selected";
  const consequenceB = "consequence.balanced-selected";
  const competencyId = asCompetencyId("competency.decision-quality");
  const learningObjectiveId = asLearningObjectiveId("lo.orientation");
  const evidenceTag = asEvidenceTag("evidence.charter");
  const outcomeId = asOutcomeId("outcome.solid-start");

  const chapters = Array.from({ length: seed.chapterCount }, (_, index) => {
    const order = index + 1;
    const id =
      order === 1
        ? chapterId
        : asChapterId(`chapter.${String(order).padStart(2, "0")}`);
    return {
      id,
      order,
      title: localizedText(
        order === 1 ? "Orientation" : `Chapter ${order} (placeholder)`,
      ),
      summary: localizedText(
        order === 1
          ? "Establish context and review the project charter."
          : `Representative placeholder for chapter ${order}.`,
      ),
      learningObjectiveIds: [learningObjectiveId],
      initialUnlock: order === 1,
      unlockWhen:
        order === 1
          ? null
          : {
              kind: "chapter_status" as const,
              chapterId: asChapterId(
                order === 2
                  ? "chapter.orientation"
                  : `chapter.${String(order - 1).padStart(2, "0")}`,
              ),
              status: "completed",
            },
      completionWhen:
        order === 1
          ? {
              kind: "all" as const,
              conditions: [
                {
                  kind: "activity_status" as const,
                  activityId,
                  status: "completed",
                },
                {
                  kind: "decision_status" as const,
                  decisionId,
                  status: "resolved",
                },
              ],
            }
          : always,
      requiredActivityIds: order === 1 ? [activityId] : [],
      requiredDecisionIds: order === 1 ? [decisionId] : [],
      entryEventIds: [],
      completionEventIds: [],
      estimatedMinutes: Math.max(
        30,
        Math.floor(seed.estimatedMinutes / seed.chapterCount),
      ),
      learnerGuidance: {
        default: localizedText(
          "Follow the Workplace activities for this chapter.",
        ),
        explorer: localizedText("Hints are available for Explorer learners."),
      },
    };
  });

  const pkg: BusinessCaseContentPackage = {
    schemaVersion: BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
    runtimeCompatibility: CURRENT_RUNTIME_COMPATIBILITY,
    manifest: {
      businessCaseId: seed.businessCaseId,
      contentVersion: seed.contentVersion,
      publicationStatus: seed.publicationStatus,
      availability: seed.availability,
      defaultLocale: "en-US",
      supportedLocales: ["en-US"],
      title: localizedText(seed.title),
      shortTitle: localizedText(seed.shortTitle),
      summary: localizedText(seed.summary),
      industry: localizedText(seed.industry),
      organizationType: localizedText(seed.organizationType),
      projectType: localizedText(seed.projectType),
      estimatedMinutes: seed.estimatedMinutes,
      learningDays: seed.learningDays,
      chapterCount: seed.chapterCount,
      difficulty: seed.difficulty,
      supportedExperienceLevels: [...levels],
      learningFocus: [
        localizedText("Decision quality under stakeholder pressure"),
      ],
      pmbokAlignment: [asPmbokAlignmentTag("stakeholder-engagement")],
      learnerRole: localizedText("Project Manager"),
      prerequisites: [localizedText("Basic project management familiarity")],
      thumbnailAssetId: null,
      heroAssetId: null,
      accessibilitySummary: localizedText(
        "Keyboard-navigable Workplace with text alternatives for key assets.",
      ),
      runtimeCompatibility: CURRENT_RUNTIME_COMPATIBILITY,
      schemaVersion: BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
      checksum: "",
    },
    chapters,
    stakeholders: [
      {
        id: stakeholderId,
        displayName: localizedText("Alex Sponsor"),
        roleTitle: localizedText("Executive Sponsor"),
        organization: localizedText(seed.shortTitle),
        stakeholderType: "internal",
        profileSummary: localizedText(
          "Sponsors the transformation and cares about delivery confidence.",
        ),
        motivations: [
          localizedText("Visible progress without major disruption"),
        ],
        goals: [localizedText("Protect patient/customer outcomes")],
        concerns: [localizedText("Budget overruns and vendor risk")],
        influence: "critical",
        interest: "high",
        initialTrust: 70,
        relationships: [],
        chapterBehavior: [
          {
            chapterId,
            stance: localizedText(
              "Expects a clear delivery approach decision.",
            ),
          },
        ],
        portraitAssetId: null,
        accessibilityLabel: localizedText("Portrait of Alex Sponsor"),
      },
    ],
    conversations: [],
    messages: [
      {
        id: messageId,
        chapterId,
        senderStakeholderId: stakeholderId,
        channel: "inbox",
        subject: localizedText("Welcome and charter review"),
        body: localizedText(
          "Please review the project charter and recommend a delivery approach.",
        ),
        availableWhen: always,
        relatedDecisionId: decisionId,
        relatedMeetingId: meetingId,
        relatedDocumentIds: [documentId],
        informationalOnly: false,
        requiresResponse: false,
        urgency: "important",
        accessibilitySummary: localizedText("Welcome message from the sponsor"),
      },
    ],
    meetings: [
      {
        id: meetingId,
        chapterId,
        title: localizedText("Project kickoff"),
        purpose: localizedText("Align on goals and delivery approach."),
        participantStakeholderIds: [stakeholderId],
        agendaItems: [
          { title: localizedText("Goals"), durationMinutes: 15 },
          { title: localizedText("Delivery approach"), durationMinutes: 20 },
        ],
        availableWhen: always,
        completionWhen: {
          kind: "meeting_status",
          meetingId,
          status: "completed",
        },
        relatedDecisionIds: [decisionId],
        relatedDocumentIds: [documentId],
        estimatedMinutes: 45,
        required: true,
        accessibilitySummary: localizedText(
          "Kickoff meeting agenda and participants",
        ),
      },
    ],
    documents: [
      {
        id: documentId,
        chapterId,
        documentType: "charter",
        title: localizedText("Project charter"),
        summary: localizedText("Approved charter for the transformation."),
        body: localizedText(
          "Representative charter body for BC-003 validation. Replace with full BC-002 content later.",
        ),
        assetId: null,
        availableWhen: always,
        evidenceTags: [evidenceTag],
        supportsDecisionIds: [decisionId],
        containsHiddenSections: false,
        accessibility: {
          accessibleTitle: localizedText("Project charter"),
          language: "en-US",
          textAlternative: localizedText(
            "Accessible text version of the charter",
          ),
          readingOrderNotes: null,
        },
      },
    ],
    notifications: [
      {
        id: notificationId,
        chapterId,
        title: localizedText("Orientation ready"),
        summary: localizedText("Your orientation activities are available."),
        body: null,
        availableWhen: always,
        accessibilitySummary: localizedText("Orientation notification"),
      },
    ],
    activities: [
      {
        id: activityId,
        chapterId,
        title: localizedText("Review project charter"),
        instructions: {
          default: localizedText(
            "Read the charter and note delivery constraints.",
          ),
        },
        activityType: "review",
        availableWhen: always,
        completionWhen: {
          kind: "activity_status",
          activityId,
          status: "completed",
        },
        required: true,
        relatedDocumentIds: [documentId],
        relatedDecisionIds: [decisionId],
        learningObjectiveIds: [learningObjectiveId],
        estimatedMinutes: 20,
      },
    ],
    decisions: [
      {
        id: decisionId,
        chapterId,
        title: localizedText("Delivery approach"),
        situation: localizedText(
          "Leadership asks how you will sequence delivery for the first phase.",
        ),
        prompt: {
          default: localizedText("Select a delivery approach."),
          explorer: localizedText(
            "Select a delivery approach. Consider risk and stakeholder confidence.",
          ),
        },
        decisionType: "single_select",
        availableWhen: always,
        requiredEvidence: [
          {
            evidenceTag,
            minimumItems: 1,
            sourceTypes: ["document"],
            requiredForEligibility: true,
            contributesToScoring: true,
          },
        ],
        options: [
          {
            id: optionA,
            label: localizedText("Conservative rollout"),
            description: localizedText(
              "Slower rollout with lower disruption risk.",
            ),
            rationalePrompt: localizedText("Why choose the conservative path?"),
            availableWhen: always,
          },
          {
            id: optionB,
            label: localizedText("Balanced rollout"),
            description: localizedText("Balances speed and risk."),
            rationalePrompt: localizedText("Why choose the balanced path?"),
            availableWhen: always,
          },
        ],
        rubric: {
          competencyWeights: { [competencyId]: 100 },
          notes: localizedText(
            "Score decision quality and stakeholder alignment.",
          ),
        },
        consequenceIdsByOption: {
          [optionA]: [consequenceA],
          [optionB]: [consequenceB],
        },
        required: true,
        reversible: false,
        learningObjectiveIds: [learningObjectiveId],
        accessibilitySummary: localizedText("Delivery approach decision"),
      },
    ],
    consequences: [
      {
        id: consequenceA,
        sourceDecisionId: decisionId,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId,
          optionId: optionA,
        },
        timing: { kind: "immediate" },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("schedule_pressure"),
            delta: -5,
          },
          {
            kind: "change_stakeholder_signal",
            stakeholderId,
            delta: 5,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "Stakeholders appreciate the lower-risk path.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
      {
        id: consequenceB,
        sourceDecisionId: decisionId,
        sourceEventId: null,
        applyWhen: {
          kind: "decision_option_selected",
          decisionId,
          optionId: optionB,
        },
        timing: {
          kind: "delayed",
          afterSimulationDays: 2,
          triggerEventId: null,
        },
        effects: [
          {
            kind: "change_project_metric",
            metricKey: asMetricKey("schedule_pressure"),
            delta: 5,
          },
          {
            kind: "make_notification_available",
            notificationId,
          },
        ],
        learnerFeedback: {
          default: localizedText(
            "The balanced path increases near-term pressure.",
          ),
        },
        reversible: false,
        recoveryActivityIds: [],
      },
    ],
    crises: [],
    assessment: {
      competencies: [
        {
          id: competencyId,
          title: localizedText("Decision quality"),
          description: localizedText("Evidence-based decision making."),
        },
      ],
      weights: { [competencyId]: 100 },
      decisionRubrics: [
        {
          competencyWeights: { [competencyId]: 100 },
          notes: null,
        },
      ],
    },
    achievements: [],
    outcomes: [
      {
        id: outcomeId,
        title: localizedText("Solid start"),
        summary: localizedText(
          "The learner established orientation and selected a delivery approach.",
        ),
        classificationRank: 1,
        eligibleWhen: always,
        reflectionPrompts: [
          localizedText(
            "What evidence most influenced your delivery approach?",
          ),
        ],
      },
    ],
    assets: [],
  };

  return stampPackageChecksum(pkg);
};
