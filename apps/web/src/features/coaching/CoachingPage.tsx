import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { useAuthSession } from "../../auth/session";
import { useCoachingProjection } from "./useCoachingProjection";
import "./CoachingPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function CoachingPage() {
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

  const query = useCoachingProjection({
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
      <main className="coaching-page">
        <h1>Coaching</h1>
        <p role="alert">Authentication required.</p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="coaching-page">
        <h1>Coaching</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);

  return (
    <main className="coaching-page">
      <header className="coaching-header">
        <p className="coaching-eyebrow">ProjectSim</p>
        <h1>Coaching</h1>
        <p className="coaching-subtitle">
          Selected interventions for run{" "}
          <span className="coaching-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Coaching...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="coaching-error-heading">
          <h2 id="coaching-error-heading">Unable to load Coaching</h2>
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
            <p className="coaching-freshness" data-testid="coaching-freshness">
              Current
            </p>
          ) : (
            <p role="status" className="coaching-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Coaching is still catching up."
                : "Coaching is catching up..."}
            </p>
          )}

          {data.data.interventions.length === 0 ? (
            <p data-testid="coaching-empty">
              No coaching interventions selected.
            </p>
          ) : (
            <ul
              className="coaching-list"
              data-testid="coaching-interventions"
              aria-label="Coaching interventions"
            >
              {data.data.interventions.map((item) => (
                <li key={item.id} data-testid="coaching-intervention">
                  <h2>{item.title}</h2>
                  <p>{item.fallbackText}</p>
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
