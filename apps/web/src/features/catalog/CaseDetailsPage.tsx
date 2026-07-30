import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ApiClientError,
  createApiClient,
  type ExperienceLevel,
} from "../../api/client";
import { createDevBrowserToken, useAuthSession } from "../../auth/session";
import { workplaceMissionControlPath } from "../workplace/routes";
import {
  useBusinessCaseDetails,
  useCreateSimulationRun,
} from "./useCatalogQueries";
import "./CaseDetailsPage.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = [
  "explorer",
  "practitioner",
  "leader",
];

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

export function CaseDetailsPage() {
  const { businessCaseId = "" } = useParams();
  const navigate = useNavigate();
  const session = useAuthSession();
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(
    "",
  );

  const apiClient = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl,
        getAccessToken: () => session.accessToken,
      }),
    [session.accessToken],
  );

  const query = useBusinessCaseDetails({
    apiClient,
    businessCaseId,
    actorId: session.actorId,
    enabled: Boolean(session.accessToken && businessCaseId),
  });

  const createRun = useCreateSimulationRun({ apiClient });

  if (!session.accessToken) {
    return (
      <main className="case-details-page">
        <h1>Business case</h1>
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
          <p>Sign in with Supabase Auth, then reopen this case.</p>
        )}
        <p>
          <Link to="/catalog">Back to catalog</Link>
        </p>
      </main>
    );
  }

  if (!businessCaseId) {
    return (
      <main className="case-details-page">
        <h1>Business case</h1>
        <p role="alert">A business case id is required.</p>
        <p>
          <Link to="/catalog">Back to catalog</Link>
        </p>
      </main>
    );
  }

  const error = query.error;
  const retryable =
    error instanceof ApiClientError ? error.retryable : Boolean(error);
  const details = query.data?.data;
  const supported = new Set(details?.supportedExperienceLevels ?? []);
  const canStart =
    experienceLevel !== "" &&
    supported.has(experienceLevel) &&
    details?.selectable === true &&
    !createRun.isPending;

  const onStart = () => {
    if (!details || experienceLevel === "") {
      return;
    }
    createRun.mutate(
      {
        businessCaseId: details.businessCaseId,
        experienceLevel,
        contentPackageVersionId: details.contentPackageVersionId,
      },
      {
        onSuccess: (result) => {
          void navigate(
            workplaceMissionControlPath(result.data.simulationRunId),
          );
        },
      },
    );
  };

  return (
    <main className="case-details-page">
      <header className="case-details-header">
        <p className="case-details-eyebrow">ProjectSim</p>
        <h1>{details?.title ?? "Business case"}</h1>
        {details ? (
          <p className="case-details-subtitle">
            {details.industry} · {formatLabel(details.difficulty)} ·{" "}
            {formatDuration(details.estimatedMinutes)}
          </p>
        ) : null}
      </header>

      <nav className="case-details-nav" aria-label="Case details navigation">
        <Link to="/catalog">Back to catalog</Link>
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
        <p className="case-details-status" role="status">
          Loading case details…
        </p>
      ) : null}

      {error ? (
        <p role="alert" data-testid="case-details-error">
          {error instanceof ApiClientError
            ? error.message
            : "Failed to load business case."}
          {retryable ? " You can retry." : null}
        </p>
      ) : null}

      {details ? (
        <>
          <p
            className="case-details-summary"
            data-testid="case-details-summary"
          >
            {details.summary}
          </p>

          <dl className="case-details-meta" data-testid="case-details-meta">
            <div>
              <dt>Organization</dt>
              <dd>{details.organizationType}</dd>
            </div>
            <div>
              <dt>Project type</dt>
              <dd>{details.projectType}</dd>
            </div>
            <div>
              <dt>Learner role</dt>
              <dd>{details.learnerRole}</dd>
            </div>
            <div>
              <dt>Learning days</dt>
              <dd>{details.learningDays}</dd>
            </div>
            <div>
              <dt>Chapters</dt>
              <dd>{details.chapterCount}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{formatLabel(details.availability)}</dd>
            </div>
            <div>
              <dt>Accessibility</dt>
              <dd>{details.accessibilitySummary}</dd>
            </div>
          </dl>

          {details.learningFocus.length > 0 ? (
            <section aria-labelledby="case-learning-focus">
              <h2 id="case-learning-focus">Learning focus</h2>
              <ul
                className="case-details-list"
                data-testid="case-learning-focus"
              >
                {details.learningFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {details.prerequisites.length > 0 ? (
            <section aria-labelledby="case-prerequisites">
              <h2 id="case-prerequisites">Prerequisites</h2>
              <ul
                className="case-details-list"
                data-testid="case-prerequisites"
              >
                {details.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {details.pmbokAlignment.length > 0 ? (
            <section aria-labelledby="case-pmbok">
              <h2 id="case-pmbok">PMBOK alignment</h2>
              <ul className="case-details-list" data-testid="case-pmbok">
                {details.pmbokAlignment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            className="case-start-panel"
            aria-labelledby="case-start-heading"
          >
            <h2 id="case-start-heading">Start simulation</h2>
            <p className="case-start-hint">
              Select an experience level supported by this case, then start a
              new run. Progress is tracked by the API, not in the browser.
            </p>

            <fieldset className="case-level-options">
              <legend>Experience level (required)</legend>
              {EXPERIENCE_LEVELS.map((level) => {
                const enabled = supported.has(level);
                return (
                  <label key={level} className="case-level-option">
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level}
                      checked={experienceLevel === level}
                      disabled={!enabled}
                      onChange={() => {
                        setExperienceLevel(level);
                      }}
                    />
                    <span>{level}</span>
                  </label>
                );
              })}
            </fieldset>

            <div className="case-start-actions">
              <button
                type="button"
                data-testid="case-start-button"
                disabled={!canStart}
                onClick={onStart}
              >
                {createRun.isPending ? "Starting…" : "Start simulation"}
              </button>
            </div>

            {createRun.error ? (
              <p
                role="alert"
                className="case-start-error"
                data-testid="case-start-error"
              >
                {createRun.error instanceof ApiClientError
                  ? createRun.error.message
                  : "Failed to create simulation run."}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
