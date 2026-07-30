import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { useAuthSession } from "../../auth/session";
import { useAchievementsProjection } from "./useAchievementsProjection";
import "./AchievementsPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function AchievementsPage() {
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

  const query = useAchievementsProjection({
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
    const timer = window.setTimeout(() => setConvergenceTimedOut(true), 8_000);
    return () => window.clearTimeout(timer);
  }, [converging]);

  if (!session.accessToken) {
    return (
      <main className="achievements-page">
        <h1>Achievements</h1>
        <p role="alert">Authentication required.</p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="achievements-page">
        <h1>Achievements</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="achievements-page">
      <header className="achievements-header">
        <p className="achievements-eyebrow">ProjectSim</p>
        <h1>Achievements</h1>
        <p className="achievements-subtitle">
          Authored achievement awards for run{" "}
          <span className="achievements-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Achievements...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="achievements-error-heading">
          <h2 id="achievements-error-heading">Unable to load Achievements</h2>
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
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="achievements-freshness"
              data-testid="achievements-freshness"
            >
              Current
            </p>
          ) : (
            <p role="status" className="achievements-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Achievements is still catching up."
                : "Achievements is catching up..."}
            </p>
          )}

          <p data-testid="achievements-xp-summary">
            XP: {data.data.xpSummary.availability} ({data.data.xpSummary.reason}
            )
          </p>

          {data.data.awards.length === 0 ? (
            <p data-testid="achievements-empty">No achievements awarded yet.</p>
          ) : (
            <ul className="achievements-list" data-testid="achievements-list">
              {data.data.awards.map((award) => (
                <li key={award.awardId} data-testid="achievements-award">
                  <strong>{award.title}</strong> — {award.description}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      <p>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  );
}
