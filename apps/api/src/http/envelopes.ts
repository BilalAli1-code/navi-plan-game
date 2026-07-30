import type { ProjectionFreshness } from "@projectsim/application";
import type {
  ActivitiesProjection,
  CompletedHistoryProjection,
  DecisionLogProjection,
  DocumentsProjection,
  InboxProjection,
  LearnerProgressionProjection,
  MeetingsProjection,
  MissionControlProjection,
  NotificationsProjection,
  PerformanceProjection,
  AchievementsProjection,
  MasteryProjection,
  CoachingProjection,
  SimulationProjection,
  StakeholdersProjection,
} from "@projectsim/domain";

export const API_VERSION = "v1" as const;

export interface ApiSuccessMeta {
  readonly requestId: string;
  readonly correlationId: string;
  readonly apiVersion: typeof API_VERSION;
}

export interface ProjectionApiMeta extends ApiSuccessMeta {
  readonly projectionSchemaVersion: number;
  readonly sourceAggregateVersion: number;
  readonly freshness: ProjectionFreshness;
  readonly generatedAt: string;
}

export interface ApiSuccessResponse<
  T,
  M extends ApiSuccessMeta = ApiSuccessMeta,
> {
  readonly data: T;
  readonly meta: M;
}

export interface ApiFieldErrors {
  readonly [path: string]: readonly string[];
}

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly fieldErrors?: ApiFieldErrors;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly requestId: string;
  readonly correlationId: string;
}

export interface ApiErrorResponse {
  readonly error: ApiErrorBody;
}

/** Learner-safe projection payload — strips server-only fingerprint/provenance. */
export type ClientSimulationProjection = Omit<
  SimulationProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Mission Control payload — strips server-only fingerprint/provenance. */
export type ClientMissionControlProjection = Omit<
  MissionControlProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Decision Log payload — strips server-only fingerprint/provenance. */
export type ClientDecisionLogProjection = Omit<
  DecisionLogProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Inbox payload — strips server-only fingerprint/provenance. */
export type ClientInboxProjection = Omit<
  InboxProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Meetings payload — strips server-only fingerprint/provenance. */
export type ClientMeetingsProjection = Omit<
  MeetingsProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Stakeholders payload — strips server-only fingerprint/provenance. */
export type ClientStakeholdersProjection = Omit<
  StakeholdersProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Documents payload — strips server-only fingerprint/provenance. */
export type ClientDocumentsProjection = Omit<
  DocumentsProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Performance payload — strips server-only fingerprint/provenance. */
export type ClientPerformanceProjection = Omit<
  PerformanceProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Learner Progression payload — strips server-only fingerprint/provenance. */
export type ClientLearnerProgressionProjection = Omit<
  LearnerProgressionProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Achievements payload — strips server-only fingerprint/provenance. */
export type ClientAchievementsProjection = Omit<
  AchievementsProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Mastery payload — strips server-only fingerprint/provenance. */
export type ClientMasteryProjection = Omit<
  MasteryProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Coaching payload — strips server-only fingerprint/provenance. */
export type ClientCoachingProjection = Omit<
  CoachingProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Notifications payload — strips server-only fingerprint/provenance. */
export type ClientNotificationsProjection = Omit<
  NotificationsProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Activities payload — strips server-only fingerprint/provenance. */
export type ClientActivitiesProjection = Omit<
  ActivitiesProjection,
  "semanticHash" | "sourceEventId"
>;

/** Learner-safe Completed History payload — strips server-only fingerprint/provenance, renames completedItems → items. */
export type ClientCompletedHistoryProjection = Omit<
  CompletedHistoryProjection,
  "semanticHash" | "sourceEventId" | "completedItems"
> & {
  readonly items: CompletedHistoryProjection["completedItems"];
};

export interface SubmitDecisionReceipt {
  readonly commandId: string;
  readonly status: "accepted";
  readonly aggregateVersion: number;
  readonly simulationRunId: string;
  readonly correlationId: string;
}

export const toClientProjection = (
  projection: SimulationProjection,
): ClientSimulationProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientMissionControlProjection = (
  projection: MissionControlProjection,
): ClientMissionControlProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientDecisionLogProjection = (
  projection: DecisionLogProjection,
): ClientDecisionLogProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientInboxProjection = (
  projection: InboxProjection,
): ClientInboxProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientMeetingsProjection = (
  projection: MeetingsProjection,
): ClientMeetingsProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientStakeholdersProjection = (
  projection: StakeholdersProjection,
): ClientStakeholdersProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientDocumentsProjection = (
  projection: DocumentsProjection,
): ClientDocumentsProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientPerformanceProjection = (
  projection: PerformanceProjection,
): ClientPerformanceProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientLearnerProgressionProjection = (
  projection: LearnerProgressionProjection,
): ClientLearnerProgressionProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientCoachingProjection = (
  projection: CoachingProjection,
): ClientCoachingProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientMasteryProjection = (
  projection: MasteryProjection,
): ClientMasteryProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientAchievementsProjection = (
  projection: AchievementsProjection,
): ClientAchievementsProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientNotificationsProjection = (
  projection: NotificationsProjection,
): ClientNotificationsProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientActivitiesProjection = (
  projection: ActivitiesProjection,
): ClientActivitiesProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    ...safe
  } = projection;
  return safe;
};

export const toClientCompletedHistoryProjection = (
  projection: CompletedHistoryProjection,
): ClientCompletedHistoryProjection => {
  const {
    semanticHash: _semanticHash,
    sourceEventId: _sourceEventId,
    completedItems,
    ...rest
  } = projection;
  return { ...rest, items: completedItems };
};
