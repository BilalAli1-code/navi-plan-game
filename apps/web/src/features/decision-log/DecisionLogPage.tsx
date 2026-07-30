import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { decisionWorkspacePath } from "../mission-control/decisionRoute";
import { useDecisionLogProjection } from "./useDecisionLogProjection";
import "./DecisionLogPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const formatDecidedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function DecisionLogPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useDecisionLogProjection({
    apiClient,
    simulationRunId,
    actorId: session.actorId,
    enabled: Boolean(session.accessToken && simulationRunId),
    expectedSourceAggregateVersion,
  });

  const data = query.data;
  const converging =
    expectedSourceAggregateVersion !== null &&
    data !== undefined &&
    !(
      data.meta.freshness === "current" &&
      data.meta.sourceAggregateVersion >= expectedSourceAggregateVersion
    );

  useEffect(() => {
    if (!converging) {
      setConvergenceTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setConvergenceTimedOut(true);
    }, 8_000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [converging]);

  if (!session.accessToken) {
    return (
      <main className="dlog-page">
        <h1>Decision Log</h1>
        <p role="alert">Authentication required.</p>
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={() =>
              session.setSession({
                actorId: "actor_1",
                tenantId: "tenant_local",
                accessToken: createDevBrowserToken({
                  actorId: "actor_1",
                  tenantId: "tenant_local",
                }),
                authSource: "dev",
              })
            }
          >
            Sign in (dev)
          </button>
        ) : (
          <p>Sign in with Supabase Auth, then reopen Decision Log.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="dlog-page">
        <h1>Decision Log</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="dlog-page">
      <header className="dlog-header">
        <p className="dlog-eyebrow">ProjectSim</p>
        <h1>Decision Log</h1>
        <p className="dlog-subtitle">
          Authoritative completed decisions for run{" "}
          <span className="dlog-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Decision Log…
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="dlog-error-heading">
          <h2 id="dlog-error-heading">Unable to load Decision Log</h2>
          <p role="alert">
            {error instanceof Error ? error.message : "Unexpected error."}
          </p>
          {retryable ? (
            <button type="button" onClick={() => void query.refetch()}>
              Retry
            </button>
          ) : null}
        </section>
      ) : null}

      {data ? (
        <>
          {data.meta.freshness === "rebuild_failed" ? (
            <p role="status" className="dlog-stale">
              Showing the last available Decision Log. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="dlog-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Decision Log is still catching up. Use Retry or reopen this page."
                : "Decision Log is catching up with the latest simulation state…"}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p className="dlog-freshness" data-testid="dlog-freshness">
              Current
            </p>
          ) : null}

          <section aria-labelledby="dlog-entries-heading">
            <h2 id="dlog-entries-heading">Completed decisions</h2>
            {data.data.summary.isEmpty || data.data.entries.length === 0 ? (
              <p className="dlog-empty" data-testid="dlog-empty">
                No completed decisions are currently available in your Decision
                Log.
              </p>
            ) : (
              <ol className="dlog-entries" data-testid="dlog-entries">
                {data.data.entries.map((entry) => (
                  <li key={entry.entryId} className="dlog-entry">
                    <h3 className="dlog-entry-title">{entry.title}</h3>
                    <p className="dlog-entry-meta">
                      <time dateTime={entry.decidedAt}>
                        {formatDecidedAt(entry.decidedAt)}
                      </time>
                    </p>
                    <p className="dlog-entry-option">
                      Selected option:{" "}
                      {entry.selectedOption.label ??
                        entry.selectedOption.optionId}
                    </p>
                    <p className="dlog-entry-status">Status: {entry.status}</p>
                    {entry.revealedOutcome ? (
                      <p className="dlog-entry-outcome">
                        Outcome: {entry.revealedOutcome.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p className="dlog-nav">
            <Link to={decisionWorkspacePath(simulationRunId)}>
              Open Decision workspace
            </Link>
            {" · "}
            <button type="button" onClick={() => void query.refetch()}>
              Retry
            </button>
          </p>
        </>
      ) : null}
    </main>
  );
}
