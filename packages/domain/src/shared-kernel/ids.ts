/**
 * Branded identifiers (shared kernel).
 *
 * Per docs/architecture/02-domain-model/02_Bounded_Contexts.md the shared kernel
 * may contain branded identifiers, and docs/handbook/03_TypeScript_Standards.md
 * mandates branded identifiers for domain IDs. Branding prevents accidentally
 * passing one kind of identifier where another is expected, while the runtime
 * representation remains a plain string.
 */

declare const brand: unique symbol;

/** A nominal (branded) type over a base value. */
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

/** A branded string identifier. */
export type Id<TBrand extends string> = Brand<string, TBrand>;

export type CommandId = Id<"CommandId">;
export type EventId = Id<"EventId">;
export type SimulationRunId = Id<"SimulationRunId">;
export type ActorId = Id<"ActorId">;
export type TenantId = Id<"TenantId">;
export type CorrelationId = Id<"CorrelationId">;
export type CausationId = Id<"CausationId">;

export type DecisionId = Id<"DecisionId">;
export type DecisionOptionId = Id<"DecisionOptionId">;
/** Authoritative Decision instance identity (distinct from content DecisionId). */
export type DecisionRecordId = Id<"DecisionRecordId">;
/** Authoritative DecisionOutcome instance identity. */
export type DecisionOutcomeId = Id<"DecisionOutcomeId">;
/** Content-authored outcome definition identity. */
export type DecisionOutcomeDefinitionId = Id<"DecisionOutcomeDefinitionId">;
/** Authoritative Consequence instance identity. */
export type ConsequenceId = Id<"ConsequenceId">;
/** Content-authored consequence definition identity. */
export type ConsequenceDefinitionId = Id<"ConsequenceDefinitionId">;
/** Runtime-owned delayed schedule instruction identity. */
export type ScheduledEventId = Id<"ScheduledEventId">;
/** Stable project metric key. */
export type MetricKey = Id<"MetricKey">;
/** Deterministic decision-resolver version (content/runtime contract). */
export type ResolverVersion = Id<"ResolverVersion">;
/** Cross-context learning signal identity. */
export type LearningSignalId = Id<"LearningSignalId">;
/** Cross-context stakeholder signal identity. */
export type StakeholderSignalId = Id<"StakeholderSignalId">;
/** Cross-context analytics signal identity. */
export type AnalyticsSignalId = Id<"AnalyticsSignalId">;
export type ActivityId = Id<"ActivityId">;
export type StakeholderId = Id<"StakeholderId">;
export type ConversationId = Id<"ConversationId">;
export type MessageId = Id<"MessageId">;
/** Authoritative system-delivered learner message occurrence identity. */
export type LearnerMessageOccurrenceId = Id<"LearnerMessageOccurrenceId">;
/** Content-authored learner message definition identity. */
export type LearnerMessageDefinitionId = Id<"LearnerMessageDefinitionId">;
/** Content-authored or learner-supplied meeting definition identity. */
export type MeetingId = Id<"MeetingId">;
/** Content-authored meeting definition identity (alias brand for provenance). */
export type MeetingDefinitionId = Id<"MeetingDefinitionId">;
/** Authoritative runtime meeting occurrence identity. */
export type MeetingOccurrenceId = Id<"MeetingOccurrenceId">;
export type ArtifactId = Id<"ArtifactId">;
/** Authoritative runtime Document identity (PS-ROADMAP-020). */
export type DocumentId = Id<"DocumentId">;
/** Authoritative runtime Notification identity (PS-ROADMAP-021). */
export type NotificationId = Id<"NotificationId">;
export type ActionRecordId = Id<"ActionRecordId">;
export type LearnerId = Id<"LearnerId">;
export type BusinessCaseId = Id<"BusinessCaseId">;
export type ContentPackageVersionId = Id<"ContentPackageVersionId">;
export type ChapterId = Id<"ChapterId">;
export type DayId = Id<"DayId">;

/**
 * Brands a raw string as a typed identifier. This is a pure, unchecked cast:
 * boundary validation (non-empty, format) is the responsibility of the
 * validation layer, not the identifier constructor.
 */
export const asId = <TBrand extends string>(value: string): Id<TBrand> =>
  value as Id<TBrand>;

export const asCommandId = (value: string): CommandId => asId(value);
export const asEventId = (value: string): EventId => asId(value);
export const asSimulationRunId = (value: string): SimulationRunId =>
  asId(value);
export const asActorId = (value: string): ActorId => asId(value);
export const asTenantId = (value: string): TenantId => asId(value);
export const asCorrelationId = (value: string): CorrelationId => asId(value);
export const asCausationId = (value: string): CausationId => asId(value);

export const asDecisionId = (value: string): DecisionId => asId(value);
export const asDecisionOptionId = (value: string): DecisionOptionId =>
  asId(value);
export const asDecisionRecordId = (value: string): DecisionRecordId =>
  asId(value);
export const asDecisionOutcomeId = (value: string): DecisionOutcomeId =>
  asId(value);
export const asDecisionOutcomeDefinitionId = (
  value: string,
): DecisionOutcomeDefinitionId => asId(value);
export const asConsequenceId = (value: string): ConsequenceId => asId(value);
export const asConsequenceDefinitionId = (
  value: string,
): ConsequenceDefinitionId => asId(value);
export const asScheduledEventId = (value: string): ScheduledEventId =>
  asId(value);
export const asMetricKey = (value: string): MetricKey => asId(value);
export const asResolverVersion = (value: string): ResolverVersion =>
  asId(value);
export const asLearningSignalId = (value: string): LearningSignalId =>
  asId(value);
export const asStakeholderSignalId = (value: string): StakeholderSignalId =>
  asId(value);
export const asAnalyticsSignalId = (value: string): AnalyticsSignalId =>
  asId(value);
export const asActivityId = (value: string): ActivityId => asId(value);
export const asStakeholderId = (value: string): StakeholderId => asId(value);
export const asConversationId = (value: string): ConversationId => asId(value);
export const asMessageId = (value: string): MessageId => asId(value);
export const asLearnerMessageOccurrenceId = (
  value: string,
): LearnerMessageOccurrenceId => asId(value);
export const asLearnerMessageDefinitionId = (
  value: string,
): LearnerMessageDefinitionId => asId(value);
export const asMeetingId = (value: string): MeetingId => asId(value);
export const asMeetingDefinitionId = (value: string): MeetingDefinitionId =>
  asId(value);
export const asMeetingOccurrenceId = (value: string): MeetingOccurrenceId =>
  asId(value);
export const asArtifactId = (value: string): ArtifactId => asId(value);
export const asDocumentId = (value: string): DocumentId => asId(value);
export const asNotificationId = (value: string): NotificationId => asId(value);
export const asActionRecordId = (value: string): ActionRecordId => asId(value);
export const asLearnerId = (value: string): LearnerId => asId(value);
export const asBusinessCaseId = (value: string): BusinessCaseId => asId(value);
export const asContentPackageVersionId = (
  value: string,
): ContentPackageVersionId => asId(value);
export const asChapterId = (value: string): ChapterId => asId(value);
export const asDayId = (value: string): DayId => asId(value);
