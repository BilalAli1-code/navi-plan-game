/** Presentation contracts for Decision UI — projection-shaped, no Domain imports. */

export type ProjectionFreshness = "current" | "stale" | "rebuild_failed";

export type DecisionUiPhase =
  | "ready"
  | "confirming"
  | "submitting"
  | "accepted_refreshing"
  | "resolved"
  | "rejected"
  | "conflict"
  | "retryable_failure";

export interface AvailableDecisionOptionView {
  readonly optionId: string;
  readonly label: string;
  readonly authoredOrder: number;
}

export interface AvailableDecisionView {
  readonly decisionDefinitionId: string;
  readonly title: string;
  readonly prompt: string;
  readonly description: string | null;
  readonly expiresAt: string | null;
  readonly authoredOrder: number;
  readonly options: readonly AvailableDecisionOptionView[];
}

export interface DecisionHistoryView {
  readonly decisionRecordId: string;
  readonly decisionDefinitionId: string;
  readonly selectedOptionId: string;
  readonly selectedOptionLabel: string | null;
  readonly submittedAt: string;
  readonly resolvedAt: string | null;
  readonly status: "submitted" | "resolved";
  readonly qualityClassification: string | null;
  readonly publicResultSummary: string | null;
}

export interface ProjectMetricView {
  readonly metricKey: string;
  readonly value: number;
  readonly unit: string | null;
}

export interface DecisionWorkspaceViewModel {
  readonly simulationRunId: string;
  readonly freshness: ProjectionFreshness;
  readonly sourceAggregateVersion: number;
  readonly runStatus: string;
  readonly projectStatus: string;
  readonly metrics: readonly ProjectMetricView[];
  readonly availableDecisions: readonly AvailableDecisionView[];
  readonly decisionHistory: readonly DecisionHistoryView[];
}
