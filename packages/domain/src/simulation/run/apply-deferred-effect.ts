/**
 * Apply a deferred authored effect snapshot from a ScheduledEventInstruction.
 *
 * BC-006 Workstream 4 — used when a schedule transitions to applied.
 * Deterministic. Fail closed. No wall clock, randomness, AI, or projections.
 */

import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import {
  asMetricKey,
  asStakeholderId,
  type MetricKey,
  type StakeholderId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { applyMetricDelta, type ProjectMetrics } from "./project-metrics";
import { transitionProjectState, type ProjectState } from "./project-state";
import type { ScheduledEventInstruction } from "./scheduled-event";

export interface StakeholderBehaviorState {
  readonly trust: number;
  readonly support: number;
  readonly resistance: number;
}

export type StakeholderBehaviorMap = Readonly<
  Record<string, StakeholderBehaviorState>
>;

export interface DeferredEffectApplicationInput {
  readonly schedule: ScheduledEventInstruction;
  readonly projectMetrics: ProjectMetrics;
  readonly projectState: ProjectState;
  readonly narrativeFlags: Readonly<Record<string, boolean>>;
  readonly stakeholderBehavior: StakeholderBehaviorMap;
}

export interface DeferredEffectApplicationResult {
  readonly projectMetrics: ProjectMetrics;
  readonly projectState: ProjectState;
  readonly narrativeFlags: Readonly<Record<string, boolean>>;
  readonly stakeholderBehavior: StakeholderBehaviorMap;
  readonly effectSummary: string;
  readonly metricKey: MetricKey | null;
  readonly metricPrevious: number | null;
  readonly metricNext: number | null;
  readonly stakeholderId: StakeholderId | null;
  readonly stakeholderDelta: number | null;
}

const DEFAULT_BEHAVIOR: StakeholderBehaviorState = {
  trust: 50,
  support: 50,
  resistance: 0,
};

const clampBehavior = (value: number): number =>
  Math.max(0, Math.min(100, value));

const applyStakeholderDelta = (
  behavior: StakeholderBehaviorMap,
  stakeholderId: string,
  delta: number,
): StakeholderBehaviorMap => {
  const current = behavior[stakeholderId] ?? DEFAULT_BEHAVIOR;
  return {
    ...behavior,
    [stakeholderId]: {
      trust: clampBehavior(current.trust + delta),
      support: clampBehavior(current.support + Math.trunc(delta / 2)),
      resistance: clampBehavior(current.resistance - Math.trunc(delta / 2)),
    },
  };
};

/**
 * Apply one deferred effect. Unsupported kinds that are unlock/intent-only set
 * narrative flags or no-op with a summary — they do not invent Workplace rows.
 */
export const applyDeferredEffectFromSchedule = (
  input: DeferredEffectApplicationInput,
): Result<DeferredEffectApplicationResult, RuleViolationError> => {
  const { schedule } = input;
  if (schedule.status === "applied") {
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: input.projectState,
      narrativeFlags: input.narrativeFlags,
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `already_applied:${schedule.id}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  const kind = schedule.deferredEffectKind;
  const payloadRaw = schedule.deferredEffectPayload;
  let payload: Record<string, unknown> = {};
  if (payloadRaw !== null && payloadRaw.trim().length > 0) {
    try {
      const parsed: unknown = JSON.parse(payloadRaw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      return err(
        ruleViolationError(
          "SCHEDULED_EVENT_INSTRUCTION_INVALID",
          `Schedule '${schedule.id}' deferredEffectPayload is not valid JSON.`,
        ),
      );
    }
  }

  if (kind === "change_project_metric") {
    const metricKey = asMetricKey(String(payload.metricKey ?? ""));
    const delta = Number(payload.delta);
    if (!Number.isFinite(delta)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Schedule '${schedule.id}' metric delta is invalid.`,
        ),
      );
    }
    const applied = applyMetricDelta(input.projectMetrics, {
      metricKey,
      delta,
      reasonCode: schedule.reasonCode,
    });
    if (!applied.ok) {
      return applied;
    }
    return ok({
      projectMetrics: applied.value.metrics,
      projectState: input.projectState,
      narrativeFlags: input.narrativeFlags,
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `metric:${metricKey}:${applied.value.previousValue}->${applied.value.nextValue}`,
      metricKey,
      metricPrevious: applied.value.previousValue,
      metricNext: applied.value.nextValue,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  if (kind === "change_stakeholder_signal") {
    const stakeholderId = asStakeholderId(String(payload.stakeholderId ?? ""));
    const delta = Number(payload.delta);
    if (!Number.isFinite(delta)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Schedule '${schedule.id}' stakeholder delta is invalid.`,
        ),
      );
    }
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: input.projectState,
      narrativeFlags: input.narrativeFlags,
      stakeholderBehavior: applyStakeholderDelta(
        input.stakeholderBehavior,
        stakeholderId,
        delta,
      ),
      effectSummary: `stakeholder:${stakeholderId}:${delta}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId,
      stakeholderDelta: delta,
    });
  }

  if (kind === "transition_project_state") {
    const nextStatus = String(payload.status ?? "");
    if (
      nextStatus !== "initiated" &&
      nextStatus !== "planning" &&
      nextStatus !== "executing" &&
      nextStatus !== "closing" &&
      nextStatus !== "closed"
    ) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Schedule '${schedule.id}' project state '${nextStatus}' is unsupported.`,
        ),
      );
    }
    const transitioned = transitionProjectState(
      input.projectState,
      nextStatus,
      schedule.reasonCode,
    );
    if (!transitioned.ok) {
      return transitioned;
    }
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: transitioned.value.next,
      narrativeFlags: input.narrativeFlags,
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `project_state:${transitioned.value.previousStatus}->${transitioned.value.next.status}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  if (kind === "set_case_flag" || kind === "record_narrative_flag") {
    const flag = String(payload.flag ?? "");
    const flagValue = Boolean(payload.value);
    if (flag.trim().length === 0) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Schedule '${schedule.id}' narrative flag is empty.`,
        ),
      );
    }
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: input.projectState,
      narrativeFlags: { ...input.narrativeFlags, [flag]: flagValue },
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `flag:${flag}:${flagValue}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  if (kind === "unlock_chapter") {
    const chapterId = String(
      payload.chapterId ?? schedule.targetChapterId ?? "",
    );
    if (chapterId.trim().length === 0) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_DEFINITION_INVALID",
          `Schedule '${schedule.id}' unlock_chapter missing chapterId.`,
        ),
      );
    }
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: input.projectState,
      narrativeFlags: {
        ...input.narrativeFlags,
        [`chapter_unlocked:${chapterId}`]: true,
      },
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `unlock_chapter:${chapterId}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  if (
    kind === "emit_competency_signal" ||
    kind === "emit_assessment_signal" ||
    kind === "make_message_available" ||
    kind === "make_meeting_available" ||
    kind === "make_document_available" ||
    kind === "make_notification_available" ||
    kind === "initialize_activity" ||
    kind === "complete_activity" ||
    kind === "make_decision_available" ||
    kind === "schedule_message" ||
    kind === "schedule_meeting" ||
    kind === "schedule_crisis" ||
    kind === null
  ) {
    // Record a narrative acknowledgement flag; Workplace materialization remains
    // chapter-init / Workstream 5 projection work.
    const flag = `deferred_applied:${schedule.id}`;
    return ok({
      projectMetrics: input.projectMetrics,
      projectState: input.projectState,
      narrativeFlags: { ...input.narrativeFlags, [flag]: true },
      stakeholderBehavior: input.stakeholderBehavior,
      effectSummary: `deferred_ack:${kind ?? "unknown"}`,
      metricKey: null,
      metricPrevious: null,
      metricNext: null,
      stakeholderId: null,
      stakeholderDelta: null,
    });
  }

  return err(
    ruleViolationError(
      "CONSEQUENCE_TYPE_UNSUPPORTED",
      `Deferred effect kind '${String(kind)}' is unsupported.`,
      { scheduleId: schedule.id, deferredEffectKind: kind },
    ),
  );
};
