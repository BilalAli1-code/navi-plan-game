/**
 * Build initial project metrics from authored content consequences (BC-004).
 *
 * SimulationState fails closed when a consequence references a missing metric.
 * Content-driven run creation seeds every metric key referenced by the package.
 */

import { asMetricKey } from "../../../shared-kernel/ids";
import {
  createProjectMetric,
  type ProjectMetrics,
} from "../../run/project-metrics";
import { createDefaultProjectMetrics } from "../../run/state";
import type { BusinessCaseContentPackage } from "./package";

const DEFAULT_VALUE = 50;
const DEFAULT_LOWER = 0;
const DEFAULT_UPPER = 100;

export const collectMetricKeysFromPackage = (
  pkg: BusinessCaseContentPackage,
): readonly string[] => {
  const keys = new Set<string>();
  for (const consequence of pkg.consequences) {
    for (const effect of consequence.effects) {
      if (effect.kind === "change_project_metric") {
        keys.add(effect.metricKey);
      }
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
};

export const buildInitialProjectMetricsFromPackage = (
  pkg: BusinessCaseContentPackage,
): ProjectMetrics => {
  const metrics: Record<string, ProjectMetrics[string]> = {
    ...createDefaultProjectMetrics(),
  };
  for (const key of collectMetricKeysFromPackage(pkg)) {
    if (metrics[key]) {
      continue;
    }
    const created = createProjectMetric({
      key: asMetricKey(key),
      value: DEFAULT_VALUE,
      lowerBound: DEFAULT_LOWER,
      upperBound: DEFAULT_UPPER,
      unit: "points",
    });
    if (!created.ok) {
      throw new Error(
        `Failed to seed content metric '${key}': ${created.error.message}`,
      );
    }
    metrics[key] = created.value;
  }
  return metrics;
};
