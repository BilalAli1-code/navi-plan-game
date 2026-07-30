import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { Decision } from "../simulation/run/decision";
import type { DecisionOutcome } from "../simulation/run/decision-outcome";
import type { ActivityRuntime } from "../simulation/run/activity";
import type { CrisisRuntimeState } from "../simulation/run/crisis-runtime";
import type { DocumentRuntime } from "../simulation/run/document";
import type { NotificationRuntime } from "../simulation/run/notification";
import type { LearnerMessageOccurrence } from "../simulation/run/learner-message";
import type { MeetingOccurrence } from "../simulation/run/meeting";
import type { ProjectMetrics } from "../simulation/run/project-metrics";
import type { ProjectState } from "../simulation/run/project-state";
import type { SimulationRun } from "../simulation/run/simulation-run";
import type {
  StakeholderConversation,
  StakeholderRuntime,
} from "../simulation/run/stakeholder";
import { SIMULATION_STATE_SCHEMA_VERSION } from "../simulation/run/state";
import type { SimulationRunStatus } from "../simulation/run/status";

/**
 * Immutable read snapshot for projection building.
 * Read boundary only — not a competing aggregate and not mutable.
 */

export interface SimulationRunReadSnapshot {
  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly status: SimulationRunStatus;
  readonly aggregateVersion: number;
  readonly lastProcessedSequence: number;
  readonly stateVersion: number;
  readonly stateSchemaVersion: number;
  readonly currentChapterId: string | null;
  readonly currentDayId: string | null;
  readonly startedAt: IsoTimestamp | null;
  readonly pausedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly archivedAt: IsoTimestamp | null;
  readonly projectState: ProjectState;
  readonly projectMetrics: ProjectMetrics;
  readonly decisions: readonly Decision[];
  readonly decisionOutcomes: readonly DecisionOutcome[];
  /** Authoritative delivered learner-message occurrences (PS-014 Inbox source). */
  readonly learnerMessages: readonly LearnerMessageOccurrence[];
  /**
   * Authoritative meeting occurrences (PS-ROADMAP-016).
   * Meetings projection/API/UI remain PS-017 — snapshot only exposes authority.
   */
  readonly meetings: readonly MeetingOccurrence[];
  /**
   * Authoritative runtime Stakeholders (PS-ROADMAP-018).
   * Stakeholder projection/API/UI remain PS-019 — snapshot only exposes authority.
   */
  readonly stakeholders: readonly StakeholderRuntime[];
  /**
   * Authoritative Stakeholder conversations (PS-ROADMAP-018).
   * Stakeholder Workplace chat remains PS-019.
   */
  readonly stakeholderConversations: readonly StakeholderConversation[];
  /**
   * Authoritative runtime Documents (PS-ROADMAP-020).
   * Documents projection/API/UI remain derived from this state.
   */
  readonly documents: readonly DocumentRuntime[];
  /**
   * Authoritative runtime Notifications (PS-ROADMAP-021).
   * Notifications projection/API/UI remain derived from this state.
   */
  readonly notifications: readonly NotificationRuntime[];
  /**
   * Authoritative runtime Activities (PS-ROADMAP-022).
   * Activities and Completed History projections/API/UI remain derived from this state.
   */
  readonly activities: readonly ActivityRuntime[];
  /**
   * Authoritative crisis runtime (BC-006 Workstream 4 / schema 8).
   * Learner-facing projections may expose triggered/resolved identity only —
   * never resolver internals or hidden schedule instructions.
   */
  readonly crises: readonly CrisisRuntimeState[];
  /** Authoritative chapter completion records (BC-006 Workstream 4). */
  readonly chapterProgress: readonly unknown[];
}

export const toSimulationRunReadSnapshot = (
  run: SimulationRun,
): Result<SimulationRunReadSnapshot, RuleViolationError> => {
  if (run.state.schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_STATE_UNSUPPORTED",
        `Unsupported SimulationState schemaVersion ${run.state.schemaVersion}.`,
        { schemaVersion: run.state.schemaVersion },
      ),
    );
  }

  return ok({
    tenantId: run.tenantId,
    simulationRunId: run.id,
    learnerId: run.learnerId,
    contentPackageVersionId: run.contentPackageVersionId,
    status: run.status,
    aggregateVersion: run.aggregateVersion,
    lastProcessedSequence: run.lastProcessedSequence,
    stateVersion: run.state.stateVersion,
    stateSchemaVersion: run.state.schemaVersion,
    currentChapterId: run.currentChapterId,
    currentDayId: run.currentDayId,
    startedAt: run.startedAt,
    pausedAt: run.pausedAt,
    completedAt: run.completedAt,
    archivedAt: run.archivedAt,
    projectState: run.state.projectState,
    projectMetrics: run.state.projectMetrics,
    decisions: [...run.state.decisions],
    decisionOutcomes: [...run.state.decisionOutcomes],
    learnerMessages: [...run.state.learnerMessages],
    meetings: [...run.state.meetings],
    stakeholders: [...run.state.stakeholders],
    stakeholderConversations: [...run.state.stakeholderConversations],
    documents: [...run.state.documents],
    notifications: [...run.state.notifications],
    activities: [...run.state.activities],
    crises: [...run.state.crises],
    chapterProgress: [...run.state.chapterProgress],
  });
};
