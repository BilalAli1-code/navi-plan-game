import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { usePerformanceProjection } from "./usePerformanceProjection";
import "./PerformancePage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function PerformancePage() {
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

  const query = usePerformanceProjection({
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
      <main className="performance-page">
        <h1>Performance</h1>
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
          <p>Sign in with Supabase Auth, then reopen Performance.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="performance-page">
        <h1>Performance</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="performance-page">
      <header className="performance-header">
        <p className="performance-eyebrow">ProjectSim</p>
        <h1>Performance</h1>
        <p className="performance-subtitle">
          Evidence-only performance summary for run{" "}
          <span className="performance-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Performance...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="performance-error-heading">
          <h2 id="performance-error-heading">Unable to load Performance</h2>
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
            <p role="status" className="performance-stale">
              Showing the last available Performance. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="performance-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Performance is still catching up. Use Retry or reopen this page."
                : "Performance is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="performance-freshness"
              data-testid="performance-freshness"
            >
              Current
            </p>
          ) : null}

          <section className="performance-summary" aria-label="Run status">
            <p>
              Run status:{" "}
              <strong data-testid="performance-run-status">
                {data.data.runSummary.status}
              </strong>
            </p>
            <p>
              Project status: <strong>{data.data.projectSummary.status}</strong>
            </p>
          </section>

          <section aria-label="Evidence counts">
            <h2>Counts</h2>
            <ul className="performance-counts" data-testid="performance-counts">
              <li>
                Decisions — submitted: {data.data.decisionCounts.submitted},
                resolved: {data.data.decisionCounts.resolved}
              </li>
              <li>
                Activities — active: {data.data.activityCounts.active},
                completed: {data.data.activityCounts.completed}
              </li>
              <li>
                Meetings — upcoming: {data.data.meetingCounts.upcoming}, active:{" "}
                {data.data.meetingCounts.active}, completed:{" "}
                {data.data.meetingCounts.completed}, cancelled:{" "}
                {data.data.meetingCounts.cancelled}
              </li>
              <li>Documents: {data.data.documentCount}</li>
              <li>
                Crises — active: {data.data.crisisSummary.activeCount},
                resolved: {data.data.crisisSummary.resolvedCount}
              </li>
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
