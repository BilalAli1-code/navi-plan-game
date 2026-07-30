import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useStakeholdersProjection } from "./useStakeholdersProjection";
import "./StakeholdersPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const DIRECTION_LABELS: Record<"learner_to_stakeholder", string> = {
  learner_to_stakeholder: "You to stakeholder",
};

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

const optionalText = (value: string | null): string | null => {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  return value;
};

export function StakeholdersPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<
    string | null
  >(null);

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useStakeholdersProjection({
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

  const stakeholders = useMemo(
    () => data?.data.stakeholders ?? [],
    [data?.data.stakeholders],
  );
  useEffect(() => {
    if (stakeholders.length === 0) {
      setSelectedStakeholderId(null);
      return;
    }
    const stillPresent = stakeholders.some(
      (stakeholder) => stakeholder.stakeholderId === selectedStakeholderId,
    );
    if (!stillPresent) {
      setSelectedStakeholderId(stakeholders[0]!.stakeholderId);
    }
  }, [stakeholders, selectedStakeholderId]);

  if (!session.accessToken) {
    return (
      <main className="stakeholders-page">
        <h1>Stakeholders</h1>
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
          <p>Sign in with Supabase Auth, then reopen Stakeholders.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="stakeholders-page">
        <h1>Stakeholders</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const selected =
    stakeholders.find(
      (stakeholder) => stakeholder.stakeholderId === selectedStakeholderId,
    ) ?? null;

  return (
    <main className="stakeholders-page">
      <header className="stakeholders-header">
        <p className="stakeholders-eyebrow">ProjectSim</p>
        <h1>Stakeholders</h1>
        <p className="stakeholders-subtitle">
          Stakeholder profiles and conversations for run{" "}
          <span className="stakeholders-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Stakeholders…
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="stakeholders-error-heading">
          <h2 id="stakeholders-error-heading">Unable to load Stakeholders</h2>
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
            <p role="status" className="stakeholders-stale">
              Showing the last available Stakeholders. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="stakeholders-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Stakeholders is still catching up. Use Retry or reopen this page."
                : "Stakeholders is catching up with the latest simulation state…"}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="stakeholders-freshness"
              data-testid="stakeholders-freshness"
            >
              Current
            </p>
          ) : null}

          {data.data.summary.isEmpty || stakeholders.length === 0 ? (
            <p className="stakeholders-empty" data-testid="stakeholders-empty">
              No stakeholders are currently initialized for this simulation run.
            </p>
          ) : (
            <div className="stakeholders-layout">
              <nav aria-label="Stakeholders">
                <ul
                  className="stakeholders-list"
                  data-testid="stakeholders-list"
                >
                  {stakeholders.map((stakeholder) => {
                    const role = optionalText(stakeholder.profile.roleLabel);
                    return (
                      <li
                        key={stakeholder.stakeholderId}
                        className="stakeholders-list-item"
                      >
                        <button
                          type="button"
                          aria-pressed={
                            stakeholder.stakeholderId ===
                            selected?.stakeholderId
                          }
                          data-testid="stakeholders-list-button"
                          data-stakeholder-id={stakeholder.stakeholderId}
                          onClick={() =>
                            setSelectedStakeholderId(stakeholder.stakeholderId)
                          }
                        >
                          <span className="stakeholders-list-name">
                            {stakeholder.profile.displayName}
                          </span>
                          {role ? (
                            <span className="stakeholders-list-role">
                              {role}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {selected ? (
                <div data-testid="stakeholders-detail">
                  <section
                    className="stakeholders-profile"
                    aria-labelledby="stakeholders-profile-heading"
                  >
                    <h2 id="stakeholders-profile-heading">
                      {selected.profile.displayName}
                    </h2>
                    <p className="stakeholders-profile-meta">
                      {[
                        optionalText(selected.profile.roleLabel),
                        optionalText(selected.profile.organization),
                        optionalText(selected.profile.department),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {optionalText(selected.profile.biography) ? (
                      <p className="stakeholders-biography">
                        {selected.profile.biography}
                      </p>
                    ) : null}
                  </section>

                  <section
                    className="stakeholders-conversation"
                    aria-labelledby="stakeholders-conversation-heading"
                  >
                    <h2 id="stakeholders-conversation-heading">Conversation</h2>
                    {!selected.conversation ||
                    selected.conversation.messages.length === 0 ? (
                      <p
                        className="stakeholders-conversation-empty"
                        data-testid="stakeholders-conversation-empty"
                      >
                        No conversation messages yet for this stakeholder.
                      </p>
                    ) : (
                      <ol
                        className="stakeholders-messages"
                        data-testid="stakeholders-messages"
                      >
                        {selected.conversation.messages.map((message) => (
                          <li
                            key={message.messageId}
                            className="stakeholders-message"
                            data-testid="stakeholders-message"
                            data-message-id={message.messageId}
                            data-direction={message.direction}
                          >
                            <p className="stakeholders-message-meta">
                              <span className="stakeholders-message-author">
                                {message.author.label}
                              </span>
                              {" · "}
                              <span className="stakeholders-message-direction">
                                {DIRECTION_LABELS[message.direction]}
                              </span>
                            </p>
                            <p className="stakeholders-message-body">
                              {message.body}
                            </p>
                            <p className="stakeholders-message-time">
                              <time dateTime={message.occurredAt}>
                                {formatTimestamp(message.occurredAt)}
                              </time>
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
