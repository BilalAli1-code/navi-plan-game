import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type { MetricKey } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";

/**
 * Authoritative project metrics (PS-ROADMAP-005).
 *
 * Bound policy: reject (fail closed) when next value would leave [lowerBound,
 * upperBound]. Clamp is not approved in current architecture docs.
 */

export interface ProjectMetric {
  readonly key: MetricKey;
  readonly value: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly unit: string | null;
  readonly lastReasonCode: string | null;
}

export type ProjectMetrics = Readonly<Record<string, ProjectMetric>>;

export interface ApplyMetricDeltaInput {
  readonly metricKey: MetricKey;
  readonly delta: number;
  readonly reasonCode: string;
}

export interface MetricDeltaApplication {
  readonly previousValue: number;
  readonly nextValue: number;
  readonly metrics: ProjectMetrics;
}

export const createProjectMetric = (input: {
  readonly key: MetricKey;
  readonly value: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly unit?: string | null;
  readonly lastReasonCode?: string | null;
}): Result<ProjectMetric, RuleViolationError> => {
  if (input.key.trim().length === 0) {
    return err(
      ruleViolationError(
        "METRIC_NOT_FOUND",
        "Metric key must be a non-empty string.",
      ),
    );
  }
  if (
    !Number.isFinite(input.value) ||
    !Number.isFinite(input.lowerBound) ||
    !Number.isFinite(input.upperBound)
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Metric bounds and value must be finite numbers.",
        { metricKey: input.key },
      ),
    );
  }
  if (input.lowerBound > input.upperBound) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Metric lowerBound must be <= upperBound.",
        { metricKey: input.key },
      ),
    );
  }
  if (input.value < input.lowerBound || input.value > input.upperBound) {
    return err(
      ruleViolationError(
        "METRIC_BOUNDS_EXCEEDED",
        `Metric '${input.key}' value ${input.value} is outside [${input.lowerBound}, ${input.upperBound}].`,
        {
          metricKey: input.key,
          value: input.value,
          lowerBound: input.lowerBound,
          upperBound: input.upperBound,
        },
      ),
    );
  }
  return ok({
    key: input.key,
    value: input.value,
    lowerBound: input.lowerBound,
    upperBound: input.upperBound,
    unit: input.unit ?? null,
    lastReasonCode: input.lastReasonCode ?? null,
  });
};

export const applyMetricDelta = (
  metrics: ProjectMetrics,
  input: ApplyMetricDeltaInput,
): Result<MetricDeltaApplication, RuleViolationError> => {
  const current = metrics[input.metricKey];
  if (!current) {
    return err(
      ruleViolationError(
        "METRIC_NOT_FOUND",
        `Metric '${input.metricKey}' was not found in authoritative state.`,
        { metricKey: input.metricKey },
      ),
    );
  }
  if (!Number.isFinite(input.delta)) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_DEFINITION_INVALID",
        "Metric delta must be a finite number.",
        { metricKey: input.metricKey, delta: input.delta },
      ),
    );
  }
  if (input.reasonCode.trim().length === 0) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_DEFINITION_INVALID",
        "Metric reasonCode must be a non-empty string.",
        { metricKey: input.metricKey },
      ),
    );
  }

  const nextValue = current.value + input.delta;
  if (nextValue < current.lowerBound || nextValue > current.upperBound) {
    return err(
      ruleViolationError(
        "METRIC_BOUNDS_EXCEEDED",
        `Metric '${input.metricKey}' next value ${nextValue} exceeds bounds [${current.lowerBound}, ${current.upperBound}].`,
        {
          metricKey: input.metricKey,
          previousValue: current.value,
          delta: input.delta,
          nextValue,
          lowerBound: current.lowerBound,
          upperBound: current.upperBound,
        },
      ),
    );
  }

  const nextMetric: ProjectMetric = {
    ...current,
    value: nextValue,
    lastReasonCode: input.reasonCode,
  };
  return ok({
    previousValue: current.value,
    nextValue,
    metrics: {
      ...metrics,
      [input.metricKey]: nextMetric,
    },
  });
};

export const serializeProjectMetrics = (
  metrics: ProjectMetrics,
): Readonly<Record<string, unknown>> => {
  const out: Record<string, unknown> = {};
  for (const [key, metric] of Object.entries(metrics)) {
    out[key] = {
      key: metric.key,
      value: metric.value,
      lowerBound: metric.lowerBound,
      upperBound: metric.upperBound,
      unit: metric.unit,
      lastReasonCode: metric.lastReasonCode,
    };
  }
  return out;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Rehydrate schema v2 metrics, or upgrade legacy v1 `Record<string, number>`
 * with open bounds (documented compatibility path).
 */
export const rehydrateProjectMetrics = (
  value: unknown,
): Result<ProjectMetrics, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "projectMetrics must be an object.",
      ),
    );
  }

  const entries = Object.entries(value);
  if (entries.every(([, entry]) => typeof entry === "number")) {
    const upgraded: Record<string, ProjectMetric> = {};
    for (const [key, numeric] of entries) {
      const created = createProjectMetric({
        key: key as MetricKey,
        value: numeric as number,
        lowerBound: Number.MIN_SAFE_INTEGER,
        upperBound: Number.MAX_SAFE_INTEGER,
        unit: null,
        lastReasonCode: null,
      });
      if (!created.ok) {
        return created;
      }
      upgraded[key] = created.value;
    }
    return ok(upgraded);
  }

  const metrics: Record<string, ProjectMetric> = {};
  for (const [key, entry] of entries) {
    if (!isPlainObject(entry)) {
      return err(
        ruleViolationError(
          "SIMULATION_RUN_REHYDRATION_FAILED",
          `projectMetrics['${key}'] must be an object.`,
        ),
      );
    }
    if (typeof entry.key !== "string" || entry.key !== key) {
      return err(
        ruleViolationError(
          "SIMULATION_RUN_REHYDRATION_FAILED",
          `projectMetrics['${key}'] key mismatch.`,
        ),
      );
    }
    if (
      typeof entry.value !== "number" ||
      typeof entry.lowerBound !== "number" ||
      typeof entry.upperBound !== "number"
    ) {
      return err(
        ruleViolationError(
          "SIMULATION_RUN_REHYDRATION_FAILED",
          `projectMetrics['${key}'] has invalid numeric fields.`,
        ),
      );
    }
    const created = createProjectMetric({
      key: entry.key as MetricKey,
      value: entry.value,
      lowerBound: entry.lowerBound,
      upperBound: entry.upperBound,
      unit:
        entry.unit === undefined || entry.unit === null
          ? null
          : String(entry.unit),
      lastReasonCode:
        entry.lastReasonCode === undefined || entry.lastReasonCode === null
          ? null
          : String(entry.lastReasonCode),
    });
    if (!created.ok) {
      return created;
    }
    metrics[key] = created.value;
  }
  return ok(metrics);
};
