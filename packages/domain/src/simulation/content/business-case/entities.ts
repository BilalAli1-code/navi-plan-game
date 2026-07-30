/**
 * BC-003 business-case content entity contracts.
 *
 * Naming note: ContentDecisionDefinition / ContentConsequenceDefinition avoid
 * colliding with the existing minimal runtime DecisionDefinition and
 * ConsequenceDefinition used by SubmitDecision resolution.
 */

import type {
  ActivityId,
  ChapterId,
  DecisionId,
  DecisionOptionId,
  DocumentId,
  MeetingDefinitionId,
  NotificationId,
  StakeholderId,
} from "../../../shared-kernel/ids";
import type { ConditionExpression } from "./conditions";
import type { ConsequenceEffect, ContentConsequenceTiming } from "./effects";
import type {
  AchievementId,
  AssetId,
  CompetencyId,
  ContentEventId,
  CrisisId,
  EvidenceTag,
  LearningObjectiveId,
  MessageDefinitionId,
  NarrativeFlag,
  OutcomeId,
} from "./ids";
import type { ExperienceVariant, LocalizedText } from "./localized";

export interface ContentAssetReference {
  readonly id: AssetId;
  readonly kind: "image" | "pdf" | "audio" | "video" | "data";
  readonly uri: string;
  readonly checksum: string;
  readonly mimeType: string;
  readonly locale: string | null;
  readonly accessibilityLabel: LocalizedText;
  readonly transcriptAssetId: AssetId | null;
  readonly captionAssetId: AssetId | null;
}

export interface DocumentAccessibilityMetadata {
  readonly accessibleTitle: LocalizedText;
  readonly language: string;
  readonly textAlternative: LocalizedText | null;
  readonly readingOrderNotes: LocalizedText | null;
}

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly order: number;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly learningObjectiveIds: readonly LearningObjectiveId[];
  readonly initialUnlock: boolean;
  readonly unlockWhen: ConditionExpression | null;
  readonly completionWhen: ConditionExpression;
  readonly requiredActivityIds: readonly ActivityId[];
  readonly requiredDecisionIds: readonly DecisionId[];
  readonly entryEventIds: readonly ContentEventId[];
  readonly completionEventIds: readonly ContentEventId[];
  readonly estimatedMinutes: number;
  readonly learnerGuidance: ExperienceVariant<LocalizedText>;
}

export interface StakeholderRelationship {
  readonly otherStakeholderId: StakeholderId;
  readonly relationship: LocalizedText;
}

export interface StakeholderChapterBehavior {
  readonly chapterId: ChapterId;
  readonly stance: LocalizedText;
}

export interface StakeholderDefinition {
  readonly id: StakeholderId;
  readonly displayName: LocalizedText;
  readonly roleTitle: LocalizedText;
  readonly organization: LocalizedText;
  readonly stakeholderType:
    "internal" | "external" | "vendor" | "customer" | "governance";
  readonly profileSummary: LocalizedText;
  readonly motivations: readonly LocalizedText[];
  readonly goals: readonly LocalizedText[];
  readonly concerns: readonly LocalizedText[];
  readonly influence: "low" | "medium" | "high" | "critical";
  readonly interest: "low" | "medium" | "high";
  readonly initialTrust: number;
  readonly relationships: readonly StakeholderRelationship[];
  readonly chapterBehavior: readonly StakeholderChapterBehavior[];
  readonly portraitAssetId: AssetId | null;
  readonly accessibilityLabel: LocalizedText;
}

export interface MessageDefinition {
  readonly id: MessageDefinitionId;
  readonly chapterId: ChapterId;
  readonly senderStakeholderId: StakeholderId | null;
  readonly channel: "inbox" | "stakeholder_chat" | "system";
  readonly subject: LocalizedText | null;
  readonly body: LocalizedText;
  readonly availableWhen: ConditionExpression;
  readonly relatedDecisionId: DecisionId | null;
  readonly relatedMeetingId: MeetingDefinitionId | null;
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly informationalOnly: boolean;
  readonly requiresResponse: boolean;
  readonly urgency: "routine" | "important" | "urgent" | "critical";
  readonly accessibilitySummary: LocalizedText;
}

/** Authored conversation thread grouping messages (BC-003). */
export interface ConversationDefinition {
  readonly id: string;
  readonly chapterId: ChapterId | null;
  readonly participantStakeholderIds: readonly StakeholderId[];
  readonly messageIds: readonly MessageDefinitionId[];
  readonly title: LocalizedText;
  readonly availableWhen: ConditionExpression;
  readonly accessibilitySummary: LocalizedText;
}

/** Alias for stakeholder chapter-scoped stance metadata. */
export type StakeholderBehaviorDefinition = StakeholderChapterBehavior;

export interface MeetingAgendaItem {
  readonly title: LocalizedText;
  readonly durationMinutes: number;
}

export interface MeetingDefinition {
  readonly id: MeetingDefinitionId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly purpose: LocalizedText;
  readonly participantStakeholderIds: readonly StakeholderId[];
  readonly agendaItems: readonly MeetingAgendaItem[];
  readonly availableWhen: ConditionExpression;
  readonly completionWhen: ConditionExpression;
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly estimatedMinutes: number;
  readonly required: boolean;
  readonly accessibilitySummary: LocalizedText;
}

export interface DocumentDefinition {
  readonly id: DocumentId;
  readonly chapterId: ChapterId | null;
  readonly documentType: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly body: LocalizedText | null;
  readonly assetId: AssetId | null;
  readonly availableWhen: ConditionExpression;
  readonly evidenceTags: readonly EvidenceTag[];
  readonly supportsDecisionIds: readonly DecisionId[];
  readonly containsHiddenSections: boolean;
  readonly accessibility: DocumentAccessibilityMetadata;
}

export interface NotificationDefinition {
  readonly id: NotificationId;
  readonly chapterId: ChapterId | null;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly body: LocalizedText | null;
  readonly availableWhen: ConditionExpression;
  readonly accessibilitySummary: LocalizedText;
}

export interface ActivityDefinition {
  readonly id: ActivityId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly instructions: ExperienceVariant<LocalizedText>;
  readonly activityType:
    | "review"
    | "analysis"
    | "artifact"
    | "practice"
    | "reflection"
    | "communication";
  readonly availableWhen: ConditionExpression;
  readonly completionWhen: ConditionExpression;
  readonly required: boolean;
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly learningObjectiveIds: readonly LearningObjectiveId[];
  readonly estimatedMinutes: number;
}

export interface EvidenceRequirement {
  readonly evidenceTag: EvidenceTag;
  readonly minimumItems: number;
  readonly sourceTypes: readonly (
    "document" | "message" | "meeting" | "conversation" | "metric"
  )[];
  readonly requiredForEligibility: boolean;
  readonly contributesToScoring: boolean;
}

export interface DecisionRubric {
  readonly competencyWeights: Readonly<Record<string, number>>;
  readonly notes: LocalizedText | null;
}

export interface ContentDecisionOptionDefinition {
  readonly id: DecisionOptionId;
  readonly label: LocalizedText;
  readonly description: LocalizedText;
  readonly rationalePrompt: LocalizedText | null;
  readonly availableWhen: ConditionExpression;
}

export interface ContentDecisionDefinition {
  readonly id: DecisionId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly situation: LocalizedText;
  readonly prompt: ExperienceVariant<LocalizedText>;
  readonly decisionType:
    | "single_select"
    | "multi_select"
    | "rank"
    | "sequence"
    | "structured_response"
    | "evidence_select";
  readonly availableWhen: ConditionExpression;
  readonly requiredEvidence: readonly EvidenceRequirement[];
  readonly options: readonly ContentDecisionOptionDefinition[];
  readonly rubric: DecisionRubric;
  readonly consequenceIdsByOption: Readonly<Record<string, readonly string[]>>;
  readonly required: boolean;
  readonly reversible: boolean;
  readonly learningObjectiveIds: readonly LearningObjectiveId[];
  readonly accessibilitySummary: LocalizedText;
}

export interface ContentConsequenceDefinition {
  readonly id: string;
  readonly sourceDecisionId: DecisionId | null;
  readonly sourceEventId: ContentEventId | null;
  readonly applyWhen: ConditionExpression;
  readonly timing: ContentConsequenceTiming;
  readonly effects: readonly ConsequenceEffect[];
  readonly learnerFeedback: ExperienceVariant<LocalizedText>;
  readonly reversible: boolean;
  readonly recoveryActivityIds: readonly ActivityId[];
}

export interface CrisisDefinition {
  readonly id: CrisisId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly triggerWhen: ConditionExpression;
  readonly initialEventIds: readonly ContentEventId[];
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedStakeholderIds: readonly StakeholderId[];
  readonly resolutionWhen: ConditionExpression;
  readonly outcomeFlags: readonly NarrativeFlag[];
}

export interface CompetencyDefinition {
  readonly id: CompetencyId;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
}

export interface AssessmentDefinition {
  readonly competencies: readonly CompetencyDefinition[];
  readonly weights: Readonly<Record<string, number>>;
  readonly decisionRubrics: readonly DecisionRubric[];
}

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly awardedWhen: ConditionExpression;
  readonly iconAssetId: AssetId | null;
}

export interface OutcomeDefinition {
  readonly id: OutcomeId;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly classificationRank: number;
  readonly eligibleWhen: ConditionExpression;
  readonly reflectionPrompts: readonly LocalizedText[];
}
