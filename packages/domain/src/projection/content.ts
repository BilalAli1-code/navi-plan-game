import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { DecisionAvailability } from "../simulation/content/decision-definition";

/**
 * Projection-safe content contracts (PS-ROADMAP-006 / BC-006 Workstream 5).
 *
 * Must not contain outcomes, consequences, signals, resolver versions,
 * or other hidden authored effects.
 */

export interface ProjectionSafeOptionDefinition {
  readonly id: DecisionOptionId;
  readonly authoredOrder: number;
  readonly label: string;
}

export interface ProjectionSafeDecisionDefinition {
  readonly id: DecisionId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly authoredOrder: number;
  readonly title: string;
  readonly prompt: string;
  readonly description: string | null;
  readonly availability: DecisionAvailability;
  readonly expiresAt: IsoTimestamp | null;
  readonly options: readonly ProjectionSafeOptionDefinition[];
  /**
   * Explicitly authored learner-visible result summary keyed by option id.
   * Absent entries mean no public summary (not a hidden outcome dump).
   */
  readonly publicResultSummaryByOptionId: Readonly<
    Record<string, string | null>
  >;
}

/**
 * Learner-safe Inbox classification mirrored from authored MessageDefinition.
 * Informational messages never count as Decisions.
 */
export type ProjectionSafeInboxClassification =
  "informational" | "action_required" | "decision_bearing";

export interface ProjectionSafeMessageDefinition {
  readonly id: string;
  readonly classification: ProjectionSafeInboxClassification;
  readonly relatedDecisionId: DecisionId | null;
  readonly relatedMeetingId: string | null;
  readonly relatedDocumentIds: readonly string[];
  readonly chapterId: string | null;
}

export interface ProjectionSafeChapterDefinition {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly requiredDecisionIds: readonly DecisionId[];
  readonly requiredActivityIds: readonly string[];
  readonly requiredMeetingIds: readonly string[];
}

export interface ProjectionSafeMeetingDefinition {
  readonly id: string;
  readonly chapterId: string | null;
  readonly required: boolean;
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedDocumentIds: readonly string[];
}

export interface ProjectionSafeDocumentDefinition {
  readonly id: string;
  readonly chapterId: string | null;
  readonly evidenceTags: readonly string[];
  readonly supportsDecisionIds: readonly DecisionId[];
}

export interface ProjectionSafeActivityDefinition {
  readonly id: string;
  readonly chapterId: string | null;
  readonly required: boolean;
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedDocumentIds: readonly string[];
}

export interface ProjectionSafeContent {
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly decisions: readonly ProjectionSafeDecisionDefinition[];
  /** Projection-safe Inbox message metadata (classification + links). */
  readonly messages: readonly ProjectionSafeMessageDefinition[];
  /** Projection-safe chapter requirement catalogs for learner progression. */
  readonly chapters: readonly ProjectionSafeChapterDefinition[];
  readonly meetings: readonly ProjectionSafeMeetingDefinition[];
  readonly documents: readonly ProjectionSafeDocumentDefinition[];
  readonly activities: readonly ProjectionSafeActivityDefinition[];
}

/** Empty catalog extras for decision-only fixtures and scaffold providers. */
export const emptyProjectionSafeCatalog = (): Pick<
  ProjectionSafeContent,
  "messages" | "chapters" | "meetings" | "documents" | "activities"
> => ({
  messages: [],
  chapters: [],
  meetings: [],
  documents: [],
  activities: [],
});
