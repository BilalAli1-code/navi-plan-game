import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useInboxProjection } from "./useInboxProjection";
import "./InboxPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const formatDeliveredAt = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function InboxPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useInboxProjection({
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
      <main className="inbox-page">
        <h1>Inbox</h1>
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
          <p>Sign in with Supabase Auth, then reopen Inbox.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="inbox-page">
        <h1>Inbox</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="inbox-page">
      <header className="inbox-header">
        <p className="inbox-eyebrow">ProjectSim</p>
        <h1>Inbox</h1>
        <p className="inbox-subtitle">
          Delivered messages for run{" "}
          <span className="inbox-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Inbox…
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="inbox-error-heading">
          <h2 id="inbox-error-heading">Unable to load Inbox</h2>
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
            <p role="status" className="inbox-stale">
              Showing the last available Inbox. A refresh did not complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="inbox-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Inbox is still catching up. Use Retry or reopen this page."
                : "Inbox is catching up with the latest simulation state…"}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p className="inbox-freshness" data-testid="inbox-freshness">
              Current
            </p>
          ) : null}

          <section aria-labelledby="inbox-messages-heading">
            <h2 id="inbox-messages-heading">Messages</h2>
            {data.data.summary.isEmpty || data.data.messages.length === 0 ? (
              <p className="inbox-empty" data-testid="inbox-empty">
                No messages are currently available in your Inbox.
              </p>
            ) : (
              <ul className="inbox-messages" data-testid="inbox-messages">
                {data.data.messages.map((message) => {
                  const expanded = expandedMessageId === message.messageId;
                  const deliveredLabel = formatDeliveredAt(message.deliveredAt);
                  return (
                    <li
                      key={message.messageId}
                      className="inbox-message"
                      data-testid="inbox-message"
                      data-message-id={message.messageId}
                    >
                      <h3 className="inbox-message-subject">
                        {message.subject}
                      </h3>
                      <p className="inbox-message-meta">
                        <span className="inbox-message-sender">
                          {message.sender.displayName}
                          {message.sender.roleLabel
                            ? ` · ${message.sender.roleLabel}`
                            : ""}
                        </span>
                        {deliveredLabel ? (
                          <>
                            {" · "}
                            <time dateTime={message.deliveredAt ?? undefined}>
                              {deliveredLabel}
                            </time>
                          </>
                        ) : (
                          <span> · Delivery time unavailable</span>
                        )}
                      </p>
                      <p className="inbox-message-preview">{message.preview}</p>
                      <button
                        type="button"
                        className="inbox-message-toggle"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedMessageId(
                            expanded ? null : message.messageId,
                          )
                        }
                      >
                        {expanded ? "Hide message" : "Show message"}
                      </button>
                      {expanded ? (
                        <div
                          className="inbox-message-body"
                          data-testid="inbox-message-body"
                        >
                          <p>{message.body}</p>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(error || data.meta.freshness === "rebuild_failed") && retryable ? (
            <button type="button" onClick={() => void query.refetch()}>
              Retry
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
