import { useEffect, useId, useRef, useState } from "react";
import { DecisionHistoryList } from "./DecisionHistoryList";
import { DecisionOptionGroup } from "./DecisionOptionGroup";
import { ProjectionFreshnessBanner } from "./ProjectionFreshnessBanner";
import type {
  AvailableDecisionView,
  DecisionUiPhase,
  DecisionWorkspaceViewModel,
} from "./types";

export interface DecisionSubmitIntent {
  readonly decisionId: string;
  readonly optionId: string;
  readonly rationale: string;
  readonly expectedAggregateVersion: number;
}

export interface DecisionWorkspaceProps {
  readonly model: DecisionWorkspaceViewModel | null;
  readonly loading?: boolean;
  readonly errorMessage?: string | null;
  readonly phase: DecisionUiPhase;
  readonly statusMessage?: string | null;
  readonly onRefresh: () => void;
  readonly onSubmit: (intent: DecisionSubmitIntent) => void;
  readonly onCancelConfirm?: () => void;
  /** Uncertain transport retry — reuses the same command/idempotency identity. */
  readonly onRetryUncertain?: () => void;
}

export function DecisionWorkspace({
  model,
  loading = false,
  errorMessage = null,
  phase,
  statusMessage = null,
  onRefresh,
  onSubmit,
  onCancelConfirm,
  onRetryUncertain,
}: DecisionWorkspaceProps) {
  const headingId = useId();
  const statusRef = useRef<HTMLDivElement>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [confirming, setConfirming] = useState(false);

  const available: AvailableDecisionView | null =
    model?.availableDecisions[0] ?? null;
  const phaseLocksControls =
    phase === "submitting" || phase === "accepted_refreshing";
  const submissionEnabled =
    model?.freshness === "current" && available !== null && !phaseLocksControls;

  useEffect(() => {
    if (!available) {
      setSelectedOptionId(null);
      setConfirming(false);
      return;
    }
    if (
      selectedOptionId &&
      !available.options.some((option) => option.optionId === selectedOptionId)
    ) {
      setSelectedOptionId(null);
    }
  }, [available, selectedOptionId]);

  useEffect(() => {
    if (
      phase === "resolved" ||
      phase === "accepted_refreshing" ||
      phase === "conflict" ||
      phase === "rejected"
    ) {
      statusRef.current?.focus();
    }
  }, [phase]);

  if (loading && !model) {
    return (
      <section aria-busy="true" aria-labelledby={headingId}>
        <h1 id={headingId}>Decision</h1>
        <p role="status">Loading simulation projection…</p>
      </section>
    );
  }

  if (errorMessage && !model) {
    return (
      <section aria-labelledby={headingId}>
        <h1 id={headingId}>Decision</h1>
        <p role="alert">{errorMessage}</p>
        <button type="button" onClick={onRefresh}>
          Retry
        </button>
      </section>
    );
  }

  if (!model) {
    return (
      <section aria-labelledby={headingId}>
        <h1 id={headingId}>Decision</h1>
        <p role="status">Projection unavailable.</p>
      </section>
    );
  }

  const pending = phaseLocksControls || confirming;
  const statusFromPhase =
    phase === "submitting"
      ? "Submitting decision…"
      : phase === "accepted_refreshing"
        ? "Decision accepted. Refreshing authoritative projection…"
        : phase === "resolved"
          ? "Decision resolved."
          : null;

  return (
    <section className="ps-decision-workspace" aria-labelledby={headingId}>
      <h1 id={headingId}>Decision</h1>
      <ProjectionFreshnessBanner
        freshness={model.freshness}
        onRetry={onRefresh}
      />
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="ps-decision-status"
      >
        {statusMessage ?? statusFromPhase}
      </div>
      {phase === "retryable_failure" && onRetryUncertain ? (
        <button type="button" onClick={onRetryUncertain}>
          Retry submission
        </button>
      ) : null}
      {phase === "accepted_refreshing" ? (
        <button type="button" onClick={onRefresh}>
          Refresh projection
        </button>
      ) : null}

      <section aria-labelledby="project-heading">
        <h2 id="project-heading">Project</h2>
        <p>Run status: {model.runStatus}</p>
        <p>Project state: {model.projectStatus}</p>
        <ul>
          {model.metrics.map((metric) => (
            <li key={metric.metricKey}>
              {metric.metricKey}: {metric.value}
              {metric.unit ? ` ${metric.unit}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="available-heading">
        <h2 id="available-heading">Available decision</h2>
        {!available ? (
          <p role="status">No decisions available.</p>
        ) : confirming ? (
          <div className="ps-confirm">
            <h3>Confirm submission</h3>
            <p>{available.title}</p>
            <p>{available.prompt}</p>
            <p>
              Selected option:{" "}
              {available.options.find((o) => o.optionId === selectedOptionId)
                ?.label ?? selectedOptionId}
            </p>
            {rationale.trim().length > 0 ? <p>Rationale: {rationale}</p> : null}
            <button
              type="button"
              disabled={phaseLocksControls}
              onClick={() => {
                if (!selectedOptionId) {
                  return;
                }
                onSubmit({
                  decisionId: available.decisionDefinitionId,
                  optionId: selectedOptionId,
                  rationale,
                  expectedAggregateVersion: model.sourceAggregateVersion,
                });
              }}
            >
              Submit decision
            </button>
            <button
              type="button"
              disabled={phaseLocksControls}
              onClick={() => {
                setConfirming(false);
                onCancelConfirm?.();
              }}
            >
              Back
            </button>
          </div>
        ) : (
          <article>
            <h3>{available.title}</h3>
            <p>{available.prompt}</p>
            {available.description ? <p>{available.description}</p> : null}
            <DecisionOptionGroup
              decisionId={available.decisionDefinitionId}
              options={available.options}
              selectedOptionId={selectedOptionId}
              disabled={!submissionEnabled || pending}
              onSelect={setSelectedOptionId}
            />
            <label htmlFor="decision-rationale">
              Rationale (optional)
              <textarea
                id="decision-rationale"
                value={rationale}
                maxLength={4000}
                disabled={!submissionEnabled || pending}
                onChange={(event) => setRationale(event.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={!submissionEnabled || !selectedOptionId || pending}
              onClick={() => setConfirming(true)}
            >
              Review and submit
            </button>
          </article>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Decision history</h2>
        <DecisionHistoryList items={model.decisionHistory} />
      </section>
    </section>
  );
}
