import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ApiClientError, createApiClient } from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { useDocumentsProjection } from "./useDocumentsProjection";
import "./DocumentsPage.css";

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

const optionalText = (value: string | null): string | null => {
  if (value === null || value.trim().length === 0) {
    return null;
  }
  return value;
};

export function DocumentsPage() {
  const { simulationRunId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthSession();
  const expectedVersionRaw = searchParams.get("expectVersion");
  const expectedSourceAggregateVersion =
    expectedVersionRaw && /^\d+$/.test(expectedVersionRaw)
      ? Number(expectedVersionRaw)
      : null;
  const [convergenceTimedOut, setConvergenceTimedOut] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
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

  const query = useDocumentsProjection({
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

  const documents = useMemo(
    () => data?.data.documents ?? [],
    [data?.data.documents],
  );
  useEffect(() => {
    if (documents.length === 0) {
      setSelectedDocumentId(null);
      return;
    }
    const stillPresent = documents.some(
      (document) => document.documentId === selectedDocumentId,
    );
    if (!stillPresent) {
      setSelectedDocumentId(documents[0]!.documentId);
    }
  }, [documents, selectedDocumentId]);

  if (!session.accessToken) {
    return (
      <main className="documents-page">
        <h1>Documents</h1>
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
          <p>Sign in with Supabase Auth, then reopen Documents.</p>
        )}
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </main>
    );
  }

  if (!simulationRunId) {
    return (
      <main className="documents-page">
        <h1>Documents</h1>
        <p role="alert">A simulation run id is required.</p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const selected =
    documents.find((document) => document.documentId === selectedDocumentId) ??
    null;

  return (
    <main className="documents-page">
      <header className="documents-header">
        <p className="documents-eyebrow">ProjectSim</p>
        <h1>Documents</h1>
        <p className="documents-subtitle">
          Plain-text documents for run{" "}
          <span className="documents-run-id">{simulationRunId}</span>
        </p>
      </header>

      {query.isLoading && !data ? (
        <p role="status" aria-live="polite">
          Loading Documents...
        </p>
      ) : null}

      {error && !data ? (
        <section aria-labelledby="documents-error-heading">
          <h2 id="documents-error-heading">Unable to load Documents</h2>
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
            <p role="status" className="documents-stale">
              Showing the last available Documents. A refresh did not complete.
            </p>
          ) : null}
          {data.meta.freshness === "stale" || converging ? (
            <p role="status" className="documents-stale" aria-live="polite">
              {convergenceTimedOut
                ? "Documents is still catching up. Use Retry or reopen this page."
                : "Documents is catching up with the latest simulation state..."}
            </p>
          ) : null}
          {data.meta.freshness === "current" && !converging ? (
            <p
              className="documents-freshness"
              data-testid="documents-freshness"
            >
              Current
            </p>
          ) : null}

          {data.data.summary.isEmpty || documents.length === 0 ? (
            <p className="documents-empty" data-testid="documents-empty">
              No documents are currently available for this simulation run.
            </p>
          ) : (
            <div className="documents-layout">
              <nav aria-label="Documents">
                <ul className="documents-list" data-testid="documents-list">
                  {documents.map((document) => (
                    <li
                      key={document.documentId}
                      className="documents-list-item"
                    >
                      <button
                        type="button"
                        aria-pressed={
                          document.documentId === selected?.documentId
                        }
                        data-testid="documents-list-button"
                        data-document-id={document.documentId}
                        onClick={() =>
                          setSelectedDocumentId(document.documentId)
                        }
                      >
                        <span className="documents-list-title">
                          {document.title}
                        </span>
                        {optionalText(document.category) ? (
                          <span className="documents-list-category">
                            {document.category}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {selected ? (
                <article
                  className="documents-detail"
                  data-testid="documents-detail"
                >
                  <header>
                    <h2>{selected.title}</h2>
                    <p className="documents-detail-meta">
                      {[
                        optionalText(selected.category),
                        selected.status,
                        formatTimestamp(selected.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {optionalText(selected.description) ? (
                      <p className="documents-description">
                        {selected.description}
                      </p>
                    ) : null}
                  </header>

                  <section aria-label="Document body">
                    <p className="documents-body" data-testid="documents-body">
                      {selected.body}
                    </p>
                  </section>

                  <p className="documents-capabilities">
                    Upload, edit, and comments are not supported in this view.
                  </p>
                </article>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
