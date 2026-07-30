import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { decisionWorkspacePath } from "./decisionRoute";
import { useMissionControlProjection } from "./useMissionControlProjection";
import "./MissionControlPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const ChannelCountView = (input: {
  readonly label: string;
  readonly value:
    | { readonly availability: "available"; readonly count: number }
    | {
        readonly availability: "unavailable";
        readonly reason: "channel_not_implemented";
      };
}) => {
  if (input.value.availability === "unavailable") {
    return (
      <li>
        <span className="mc-count-label">{input.label}</span>
        <span className="mc-count-unavailable">Unavailable</span>
      </li>
    );
  }
  return (
    <li>
      <span className="mc-count-label">{input.label}</span>
      <span className="mc-count-value">{input.value.count}</span>
    </li>
  );
};

export function MissionControlPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [completingChapter, setCompletingChapter] = useState(false);
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

  const query = useMissionControlProjection({
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

  const completeChapter = async () => {
    if (!data || completingChapter) {
      return;
    }
    setActionError(null);
    setActionStatus(null);
    setCompletingChapter(true);
    try {
      const chapterId = data.data.runSummary.currentChapterId;
      const receipt = await apiClient.completeChapter({
        simulationRunId,
        commandId: `cmd_${crypto.randomUUID()}`,
        correlationId: `corr_${crypto.randomUUID()}`,
        expectedAggregateVersion: data.meta.sourceAggregateVersion,
        ...(chapterId !== null ? { chapterId } : {}),
      });
      const parts = ["Chapter completed."];
      if (receipt.data.nextChapterId) {
        parts.push(`Next chapter: ${receipt.data.nextChapterId}.`);
      }
      if (receipt.data.endingNotificationId) {
        parts.push(
          `Ending notification: ${receipt.data.endingNotificationId}.`,
        );
      }
      parts.push("Refreshing Mission Control…");
      setActionStatus(parts.join(" "));
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
        error instanceof Error ? error.message : "Unable to complete chapter.",
      );
    } finally {
      setCompletingChapter(false);
    }
  };

  if (!session.accessToken) {
    return (
      <main className="mc-page">
        <h1>Mission Control</h1>
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
          <p>Sign in with Supabase Auth, then reopen Mission Control.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="mc-page">
        <h1>Mission Control</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const pendingDecisionsCount =
    data?.data.counts.pendingDecisions.count ?? null;
  const canCompleteChapter = pendingDecisionsCount === 0;

  return (
    <main className="mc-page">
      <header className="mc-header">
        <p className="mc-eyebrow">ProjectSim</p>
        <h1>Mission Control</h1>
        <p className="mc-subtitle">
          Authoritative learner overview for run{" "}
          <span className="mc-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Mission Control…
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="mc-error-heading">
          <h2 id="mc-error-heading">Unable to load Mission Control</h2>
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
            <p role="status" className="mc-stale">
              Showing the last available Mission Control view. A refresh did not
              complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="mc-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Mission Control is still catching up. Use Retry or reopen this page."
                : "Mission Control is catching up with the latest simulation state…"}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p className="mc-freshness" data-testid="mc-freshness">
              Current
            </p>
          ) : null}

          <section aria-labelledby="mc-run-heading">
            <h2 id="mc-run-heading">Run summary</h2>
            <dl className="mc-summary">
              <div>
                <dt>Status</dt>
                <dd>{data.data.runSummary.status}</dd>
              </div>
              <div>
                <dt>Chapter</dt>
                <dd>{data.data.runSummary.currentChapterId ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Day</dt>
                <dd>{data.data.runSummary.currentDayId ?? "Not set"}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="mc-project-heading">
            <h2 id="mc-project-heading">Project status</h2>
            <p>
              Status: <strong>{data.data.projectSummary.status}</strong>
            </p>
            {data.data.projectSummary.metrics.length === 0 ? (
              <p>No key metrics are available.</p>
            ) : (
              <ul className="mc-metrics">
                {data.data.projectSummary.metrics.map((metric) => (
                  <li key={metric.metricKey}>
                    <span>{metric.metricKey}</span>
                    <span>
                      {metric.value}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="mc-counts-heading">
            <h2 id="mc-counts-heading">Counts</h2>
            <ul className="mc-counts">
              <ChannelCountView
                label="Pending decisions"
                value={data.data.counts.pendingDecisions}
              />
              <ChannelCountView
                label="Unread action-required inbox items"
                value={data.data.counts.unreadActionRequiredInboxItems}
              />
              <ChannelCountView
                label="Upcoming meetings"
                value={data.data.counts.upcomingMeetings}
              />
            </ul>
          </section>

          <section aria-labelledby="mc-actions-heading">
            <h2 id="mc-actions-heading">Recommended actions</h2>
            {data.data.nextRecommendedActions.length === 0 ? (
              <p>No recommended actions right now.</p>
            ) : (
              <ul className="mc-actions">
                {data.data.nextRecommendedActions.map((action) => (
                  <li key={action.actionId}>
                    {action.targetKind === "decision" ? (
                      <Link
                        to={decisionWorkspacePath(
                          simulationRunId,
                          action.targetId,
                        )}
                      >
                        {action.label}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="mc-chapter-heading">
            <h2 id="mc-chapter-heading">Chapter</h2>
            {actionError ? (
              <p role="alert" className="mc-action-error">
                {actionError}
              </p>
            ) : null}
            {actionStatus ? (
              <p role="status" className="mc-action-status" aria-live="polite">
                {actionStatus}
              </p>
            ) : null}
            <div className="mc-chapter-actions">
              <button
                type="button"
                data-testid="mc-complete-chapter"
                disabled={!canCompleteChapter || completingChapter}
                onClick={() => void completeChapter()}
              >
                {completingChapter ? "Completing…" : "Complete Chapter"}
              </button>
              {!canCompleteChapter ? (
                <p className="mc-chapter-hint">
                  Complete all pending decisions before completing the chapter.
                </p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="mc-outcome-heading">
            <h2 id="mc-outcome-heading">Recent revealed outcome</h2>
            {data.data.recentRevealedOutcome === null ? (
              <p>No revealed outcomes yet.</p>
            ) : (
              <article className="mc-outcome">
                <p>{data.data.recentRevealedOutcome.publicResultSummary}</p>
                <p>
                  Choice:{" "}
                  {data.data.recentRevealedOutcome.selectedOptionLabel ??
                    "Selected option"}
                </p>
                <p>Resolved at {data.data.recentRevealedOutcome.resolvedAt}</p>
              </article>
            )}
          </section>

          <p className="mc-nav">
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
