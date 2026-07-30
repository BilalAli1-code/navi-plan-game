/**
 * Top-level BC-003 content package, manifest, and learner catalog contracts.
 */

import type {
  BusinessCaseId,
  ContentPackageVersionId,
} from "../../../shared-kernel/ids";
import type {
  CaseAvailability,
  ContentPublicationStatus,
  Difficulty,
  ExperienceLevel,
} from "./enums";
import type {
  AchievementDefinition,
  ActivityDefinition,
  AssessmentDefinition,
  ChapterDefinition,
  ContentAssetReference,
  ContentConsequenceDefinition,
  ContentDecisionDefinition,
  ConversationDefinition,
  CrisisDefinition,
  DocumentDefinition,
  MeetingDefinition,
  MessageDefinition,
  NotificationDefinition,
  OutcomeDefinition,
  StakeholderDefinition,
} from "./entities";
import type { LocalizedText } from "./localized";
import type { PmbokAlignmentTag } from "./ids";

export interface BusinessCaseManifest {
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly publicationStatus: ContentPublicationStatus;
  readonly availability: CaseAvailability;
  readonly defaultLocale: string;
  readonly supportedLocales: readonly string[];
  readonly title: LocalizedText;
  readonly shortTitle: LocalizedText;
  readonly summary: LocalizedText;
  readonly industry: LocalizedText;
  readonly organizationType: LocalizedText;
  readonly projectType: LocalizedText;
  readonly estimatedMinutes: number;
  readonly learningDays: number;
  readonly chapterCount: number;
  readonly difficulty: Difficulty;
  readonly supportedExperienceLevels: readonly ExperienceLevel[];
  readonly learningFocus: readonly LocalizedText[];
  readonly pmbokAlignment: readonly PmbokAlignmentTag[];
  readonly learnerRole: LocalizedText;
  readonly prerequisites: readonly LocalizedText[];
  readonly thumbnailAssetId: string | null;
  readonly heroAssetId: string | null;
  readonly accessibilitySummary: LocalizedText;
  readonly runtimeCompatibility: string;
  readonly schemaVersion: number;
  /** Empty string until checksum is computed for publication. */
  readonly checksum: string;
}

/**
 * Declarative authored business-case package.
 * Must not contain executable code, SQL, eval strings, or secrets.
 */
export interface BusinessCaseContentPackage {
  readonly schemaVersion: number;
  readonly runtimeCompatibility: string;
  readonly manifest: BusinessCaseManifest;
  readonly chapters: readonly ChapterDefinition[];
  readonly stakeholders: readonly StakeholderDefinition[];
  readonly messages: readonly MessageDefinition[];
  readonly conversations: readonly ConversationDefinition[];
  readonly meetings: readonly MeetingDefinition[];
  readonly documents: readonly DocumentDefinition[];
  readonly notifications: readonly NotificationDefinition[];
  readonly activities: readonly ActivityDefinition[];
  readonly decisions: readonly ContentDecisionDefinition[];
  readonly consequences: readonly ContentConsequenceDefinition[];
  readonly crises: readonly CrisisDefinition[];
  readonly assessment: AssessmentDefinition;
  readonly achievements: readonly AchievementDefinition[];
  readonly outcomes: readonly OutcomeDefinition[];
  readonly assets: readonly ContentAssetReference[];
}

/** Stored/published package row identity after persistence. */
export interface BusinessCaseContentVersion {
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly publicationStatus: ContentPublicationStatus;
  readonly availability: CaseAvailability;
  readonly isDefaultForNewRuns: boolean;
  readonly checksum: string;
  readonly schemaVersion: number;
  readonly runtimeCompatibility: string;
  readonly publishedAt: string | null;
  readonly package: BusinessCaseContentPackage;
}

/** Learner-safe catalog card (no hidden narrative / rubrics / consequences). */
export interface BusinessCaseCatalogEntry {
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly title: string;
  readonly shortTitle: string;
  readonly summary: string;
  readonly industry: string;
  readonly organizationType: string;
  readonly projectType: string;
  readonly estimatedMinutes: number;
  readonly learningDays: number;
  readonly difficulty: Difficulty;
  readonly supportedExperienceLevels: readonly ExperienceLevel[];
  readonly availability: CaseAvailability;
  readonly selectable: boolean;
  readonly accessibilitySummary: string;
}

export interface BusinessCaseCatalogDetails extends BusinessCaseCatalogEntry {
  readonly learningFocus: readonly string[];
  readonly learnerRole: string;
  readonly prerequisites: readonly string[];
  readonly chapterCount: number;
  readonly pmbokAlignment: readonly string[];
}
