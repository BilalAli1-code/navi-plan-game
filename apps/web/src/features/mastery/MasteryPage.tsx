import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { useAuthSession } from "../../auth/session";
import { useMasteryProjection } from "./useMasteryProjection";
import "./MasteryPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function MasteryPage() {
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

  const query = useMasteryProjection({
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
      <main className="mastery-page">
        <h1>Mastery</h1>
        <p role="alert">Authentication required.</p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="mastery-page">
        <h1>Mastery</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="mastery-page">
      <header className="mastery-header">
        <p className="mastery-eyebrow">ProjectSim</p>
        <h1>Mastery</h1>
        <p className="mastery-subtitle">
          Competency evidence for run{" "}
          <span className="mastery-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Mastery...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="mastery-error-heading">
          <h2 id="mastery-error-heading">Unable to load Mastery</h2>
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
            <p className="mastery-freshness" data-testid="mastery-freshness">
              Current
            </p>
          ) : (
            <p role="status" className="mastery-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Mastery is still catching up."
                : "Mastery is catching up..."}
            </p>
          )}

          <p data-testid="mastery-xp-summary">
            XP: {data.data.xpSummary.availability}
          </p>

          {data.data.competencies.length === 0 ? (
            <p data-testid="mastery-empty">No competency evidence yet.</p>
          ) : (
            <ul
              className="mastery-list"
              data-testid="mastery-competencies"
              aria-label="Competency evidence"
            >
              {data.data.competencies.map((entry) => (
                <li key={entry.competencyId} data-testid="mastery-competency">
                  <strong>{entry.title}</strong>: delta {entry.totalDelta} (
                  {entry.bandAvailability})
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
