import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useActivitiesProjection } from "./useActivitiesProjection";
import "./ActivitiesPage.css";

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

export function ActivitiesPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [completingActivityId, setCompletingActivityId] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useActivitiesProjection({
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

  const completeActivity = async (activityId: string) => {
    if (!data || completingActivityId !== null) {
      return;
    }
    setActionError(null);
    setActionStatus(null);
    setCompletingActivityId(activityId);
    try {
      const receipt = await apiClient.completeActivity({
        simulationRunId,
        commandId: `cmd_${crypto.randomUUID()}`,
        correlationId: `corr_${crypto.randomUUID()}`,
        expectedAggregateVersion: data.meta.sourceAggregateVersion,
        activityId,
      });
      setActionStatus("Activity completed. Refreshing Activities…");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("expectVersion", String(receipt.data.aggregateVersion));
          return next;
        },
        { replace: true },
      );
      await query.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to complete activity.",
      );
    } finally {
      setCompletingActivityId(null);
    }
  };

  if (!session.accessToken) {
    return (
      <main className="activities-page">
        <h1>Activities</h1>
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
          <p>Sign in with Supabase Auth, then reopen Activities.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="activities-page">
        <h1>Activities</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const activities = data?.data.activities ?? [];

  return (
    <main className="activities-page">
      <header className="activities-header">
        <p className="activities-eyebrow">ProjectSim</p>
        <h1>Activities</h1>
        <p className="activities-subtitle">
          Active items for run{" "}
          <span className="activities-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Activities...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="activities-error-heading">
          <h2 id="activities-error-heading">Unable to load Activities</h2>
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
            <p role="status" className="activities-stale">
              Showing the last available Activities. A refresh did not complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="activities-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Activities is still catching up. Use Retry or reopen this page."
                : "Activities is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="activities-freshness"
              data-testid="activities-freshness"
            >
              Current
            </p>
          ) : null}

          {actionError ? (
            <p role="alert" className="activities-action-error">
              {actionError}
            </p>
          ) : null}
          {actionStatus ? (
            <p
              role="status"
              className="activities-action-status"
              aria-live="polite"
            >
              {actionStatus}
            </p>
          ) : null}

          {data.data.summary.isEmpty || activities.length === 0 ? (
            <p className="activities-empty" data-testid="activities-empty">
              No active activities are currently available for this simulation
              run.
            </p>
          ) : (
            <ul
              className="activities-list"
              data-testid="activities-list"
              aria-label="Activities"
            >
              {activities.map((activity) => (
                <li
                  key={activity.activityId}
                  className="activities-item"
                  data-testid="activities-item"
                  data-activity-id={activity.activityId}
                >
                  <h2
                    className="activities-item-title"
                    data-testid="activities-item-title"
                  >
                    {activity.title}
                  </h2>
                  <p
                    className="activities-item-summary"
                    data-testid="activities-item-summary"
                  >
                    {activity.summary}
                  </p>
                  {activity.body ? (
                    <p
                      className="activities-item-body"
                      data-testid="activities-item-body"
                    >
                      {activity.body}
                    </p>
                  ) : null}
                  <p className="activities-item-meta">
                    <span className="activities-item-source">
                      {activity.source.kind}
                    </span>
                    {" · "}
                    {activity.status}
                    {" · "}
                    {formatTimestamp(activity.createdAt)}
                  </p>
                  <div className="activities-item-actions">
                    <button
                      type="button"
                      data-testid="activities-complete"
                      disabled={completingActivityId !== null}
                      onClick={() => void completeActivity(activity.activityId)}
                    >
                      {completingActivityId === activity.activityId
                        ? "Completing…"
                        : "Complete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="activities-capabilities">
            Reopen and assign are not supported in this view.
          </p>
        </>
      ) : null}
    </main>
  );
}
