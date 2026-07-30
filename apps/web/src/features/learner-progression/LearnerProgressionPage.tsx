import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useLearnerProgressionProjection } from "./useLearnerProgressionProjection";
import "./LearnerProgressionPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function LearnerProgressionPage() {
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

  const query = useLearnerProgressionProjection({
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
      <main className="learner-progression-page">
        <h1>Progress</h1>
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
          <p>Sign in with Supabase Auth, then reopen Progress.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="learner-progression-page">
        <h1>Progress</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const chapters = data?.data.chapters ?? [];

  return (
    <main className="learner-progression-page">
      <header className="learner-progression-header">
        <p className="learner-progression-eyebrow">ProjectSim</p>
        <h1>Progress</h1>
        <p className="learner-progression-subtitle">
          Chapter requirement progress for run{" "}
          <span className="learner-progression-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Progress...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="progress-error-heading">
          <h2 id="progress-error-heading">Unable to load Progress</h2>
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
            <p role="status" className="learner-progression-stale">
              Showing the last available Progress. A refresh did not complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p
              role="status"
              className="learner-progression-stale"
              aria-live="polite"
            >
              {convergenceTimedOut
                ? "Progress is still catching up. Use Retry or reopen this page."
                : "Progress is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="learner-progression-freshness"
              data-testid="learner-progression-freshness"
            >
              Current
            </p>
          ) : null}

          <section aria-label="Progress summary">
            <p data-testid="learner-progression-summary">
              {data.data.summary.completedChapterCount} of{" "}
              {data.data.summary.totalChapters} chapters completed
              {data.data.summary.activeChapterId
                ? ` · active chapter ${data.data.summary.activeChapterId}`
                : ""}
            </p>
          </section>

          {chapters.length === 0 ? (
            <p
              className="learner-progression-empty"
              data-testid="learner-progression-empty"
            >
              No chapter catalog is available for this simulation run.
            </p>
          ) : (
            <ul
              className="learner-progression-chapters"
              data-testid="learner-progression-chapters"
            >
              {chapters.map((chapter) => (
                <li
                  key={chapter.chapterId}
                  className="learner-progression-chapter"
                  data-testid="learner-progression-chapter"
                  data-chapter-id={chapter.chapterId}
                >
                  <h3>
                    {chapter.title}{" "}
                    <span aria-label="status">({chapter.status})</span>
                  </h3>
                  {chapter.requirements.length > 0 ? (
                    <ul className="learner-progression-requirements">
                      {chapter.requirements.map((requirement) => (
                        <li key={`${requirement.kind}:${requirement.targetId}`}>
                          {requirement.kind} {requirement.targetId} —{" "}
                          {requirement.status}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No requirements listed.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </main>
  );
}
