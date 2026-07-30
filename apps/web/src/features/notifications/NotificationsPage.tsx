import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useNotificationsProjection } from "./useNotificationsProjection";
import "./NotificationsPage.css";

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

export function NotificationsPage() {
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

  const query = useNotificationsProjection({
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
      <main className="notifications-page">
        <h1>Notifications</h1>
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
          <p>Sign in with Supabase Auth, then reopen Notifications.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="notifications-page">
        <h1>Notifications</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const notifications = data?.data.notifications ?? [];

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <p className="notifications-eyebrow">ProjectSim</p>
        <h1>Notifications</h1>
        <p className="notifications-subtitle">
          Attention items for run{" "}
          <span className="notifications-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Notifications...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="notifications-error-heading">
          <h2 id="notifications-error-heading">Unable to load Notifications</h2>
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
            <p role="status" className="notifications-stale">
              Showing the last available Notifications. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="notifications-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Notifications is still catching up. Use Retry or reopen this page."
                : "Notifications is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="notifications-freshness"
              data-testid="notifications-freshness"
            >
              Current
            </p>
          ) : null}

          {data.data.summary.isEmpty || notifications.length === 0 ? (
            <p
              className="notifications-empty"
              data-testid="notifications-empty"
            >
              No notifications are currently available for this simulation run.
            </p>
          ) : (
            <ul
              className="notifications-list"
              data-testid="notifications-list"
              aria-label="Notifications"
            >
              {notifications.map((notification) => (
                <li
                  key={notification.notificationId}
                  className="notifications-item"
                  data-testid="notifications-item"
                  data-notification-id={notification.notificationId}
                >
                  <h2
                    className="notifications-item-title"
                    data-testid="notifications-item-title"
                  >
                    {notification.title}
                  </h2>
                  <p
                    className="notifications-item-summary"
                    data-testid="notifications-item-summary"
                  >
                    {notification.summary}
                  </p>
                  {notification.body ? (
                    <p
                      className="notifications-item-body"
                      data-testid="notifications-item-body"
                    >
                      {notification.body}
                    </p>
                  ) : null}
                  <p className="notifications-item-meta">
                    <span className="notifications-item-source">
                      {notification.source.kind}
                    </span>
                    {" · "}
                    {notification.status}
                    {" · "}
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="notifications-capabilities">
            Mark as read, dismiss, and preferences are not supported in this
            view.
          </p>
        </>
      ) : null}
    </main>
  );
}
