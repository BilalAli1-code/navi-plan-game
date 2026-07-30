import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useCompletedHistoryProjection } from "./useCompletedHistoryProjection";
import "./CompletedHistoryPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const formatTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function CompletedHistoryPage() {
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

  const query = useCompletedHistoryProjection({
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
      <main className="completed-history-page">
        <h1>Completed History</h1>
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
          <p>Sign in with Supabase Auth, then reopen Completed History.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="completed-history-page">
        <h1>Completed History</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const items = data?.data.items ?? [];

  return (
    <main className="completed-history-page">
      <header className="completed-history-header">
        <p className="completed-history-eyebrow">ProjectSim</p>
        <h1>Completed History</h1>
        <p className="completed-history-subtitle">
          Completed activities for run{" "}
          <span className="completed-history-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Completed History...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="completed-history-error-heading">
          <h2 id="completed-history-error-heading">
            Unable to load Completed History
          </h2>
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
            <p role="status" className="completed-history-stale">
              Showing the last available Completed History. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p
              role="status"
              className="completed-history-stale"
              aria-live="polite"
            >
              {convergenceTimedOut
                ? "Completed History is still catching up. Use Retry or reopen this page."
                : "Completed History is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="completed-history-freshness"
              data-testid="completed-history-freshness"
            >
              Current
            </p>
          ) : null}

          {data.data.summary.isEmpty || items.length === 0 ? (
            <p
              className="completed-history-empty"
              data-testid="completed-history-empty"
            >
              No completed activities yet for this simulation run.
            </p>
          ) : (
            <ul
              className="completed-history-list"
              data-testid="completed-history-list"
              aria-label="Completed History"
            >
              {items.map((item) => (
                <li
                  key={item.activityId}
                  className="completed-history-item"
                  data-testid="completed-history-item"
                  data-activity-id={item.activityId}
                >
                  <h2
                    className="completed-history-item-title"
                    data-testid="completed-history-item-title"
                  >
                    {item.title}
                  </h2>
                  <p
                    className="completed-history-item-summary"
                    data-testid="completed-history-item-summary"
                  >
                    {item.summary}
                  </p>
                  {item.body ? (
                    <p
                      className="completed-history-item-body"
                      data-testid="completed-history-item-body"
                    >
                      {item.body}
                    </p>
                  ) : null}
                  <p className="completed-history-item-meta">
                    <span className="completed-history-item-completed-badge">
                      Completed
                    </span>
                    {" · "}
                    <span>{item.source.kind}</span>
                    {" · "}
                    {formatTimestamp(item.completedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="completed-history-capabilities">
            Reopen, clear, and export are not supported in this view.
          </p>
        </>
      ) : null}
    </main>
  );
}
