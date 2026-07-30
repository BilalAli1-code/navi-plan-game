import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useBusinessCaseList } from "./useCatalogQueries";
import "./CatalogPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return hours === 1 ? "1 hr" : `${hours} hr`;
  }
  return `${hours} hr ${remainder} min`;
};

const formatLabel = (value: string): string => value.replace(/_/g, " ");

export function CatalogPage() {
  const session = useAuthSession();

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useBusinessCaseList({
    apiClient,
    actorId: session.actorId,
    enabled: Boolean(session.accessToken),
  });

  if (!session.accessToken) {
    return (
      <main className="catalog-page">
        <h1>Business Case Catalog</h1>
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
          <p>Sign in with Supabase Auth, then reopen the catalog.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const cases = query.data?.data ?? [];

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="catalog-eyebrow">ProjectSim</p>
        <h1>Business Case Catalog</h1>
        <p className="catalog-subtitle">
          Choose a selectable business case to review details and start a
          simulation run.
        </p>
      </header>

      <nav className="catalog-nav" aria-label="Catalog navigation">
        <Link to="/">Home</Link>
        <button
          type="button"
          onClick={() => {
            void query.refetch();
          }}
          disabled={query.isFetching}
        >
          Refresh
        </button>
      </nav>

      {query.isLoading ? (
        <p className="catalog-status" role="status">
          Loading business cases…
        </p>
      ) : null}

      {error ? (
        <p role="alert" data-testid="catalog-error">
          {error instanceof ApiClientError
            ? error.message
            : "Failed to load business cases."}
          {retryable ? " You can retry." : null}
        </p>
      ) : null}

      {!query.isLoading && !error && cases.length === 0 ? (
        <p className="catalog-empty" data-testid="catalog-empty">
          No selectable business cases are available right now.
        </p>
      ) : null}

      {cases.length > 0 ? (
        <ul className="catalog-list" data-testid="catalog-list">
          {cases.map((entry) => (
            <li
              key={entry.businessCaseId}
              className="catalog-card"
              data-testid={`catalog-card-${entry.businessCaseId}`}
            >
              <h2 className="catalog-card-title">{entry.title}</h2>
              <p className="catalog-card-meta">
                <span>{entry.industry}</span>
                <span>{formatDuration(entry.estimatedMinutes)}</span>
                <span>{formatLabel(entry.difficulty)}</span>
              </p>
              <p className="catalog-card-summary">{entry.summary}</p>
              <p className="catalog-card-levels" aria-label="Experience levels">
                {entry.supportedExperienceLevels.map((level) => (
                  <span key={level} className="catalog-chip">
                    {level}
                  </span>
                ))}
              </p>
              <p className="catalog-availability">
                Availability: {formatLabel(entry.availability)}
              </p>
              <p className="catalog-card-actions">
                <Link
                  to={`/catalog/${encodeURIComponent(entry.businessCaseId)}`}
                >
                  Review case
                </Link>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
