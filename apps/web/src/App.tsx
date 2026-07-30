import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import {
  AuthSessionProvider,
  createDevBrowserToken,
  useAuthSession,
} from "./auth/session";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { CaseDetailsPage } from "./features/catalog/CaseDetailsPage";
import { DecisionPage } from "./features/decision/DecisionPage";
import { DecisionLogPage } from "./features/decision-log/DecisionLogPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { ActivitiesPage } from "./features/activities/ActivitiesPage";
import { CompletedHistoryPage } from "./features/completed-history/CompletedHistoryPage";
import { LearnerProgressionPage } from "./features/learner-progression/LearnerProgressionPage";
import { AchievementsPage } from "./features/achievements/AchievementsPage";
import { MasteryPage } from "./features/mastery/MasteryPage";
import { CoachingPage } from "./features/coaching/CoachingPage";
import { NotificationsPage } from "./features/notifications/NotificationsPage";
import { PerformancePage } from "./features/performance/PerformancePage";
import { InboxPage } from "./features/inbox/InboxPage";
import { MeetingsPage } from "./features/meetings/MeetingsPage";
import { MissionControlPage } from "./features/mission-control/MissionControlPage";
import { StakeholdersPage } from "./features/stakeholders/StakeholdersPage";
import { DefaultRunRedirect } from "./features/workplace/DefaultRunRedirect";
import {
  workplaceActivitiesPath,
  workplaceCompletedHistoryPath,
  workplaceDecisionLogPath,
  workplaceDocumentsPath,
  workplaceInboxPath,
  workplaceMeetingsPath,
  workplaceMissionControlPath,
  workplaceNotificationsPath,
  workplacePerformancePath,
  workplaceProgressPath,
  workplaceRunPath,
  workplaceStakeholdersPath,
} from "./features/workplace/routes";
import { WorkplaceShell } from "./features/workplace/WorkplaceShell";
import "./App.css";

function DevSessionControls() {
  const session = useAuthSession();
  const [actorId, setActorId] = useState("actor_1");
  const [tenantId, setTenantId] = useState("tenant_local");
  const [runId, setRunId] = useState("run_1");
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

  return (
    <section className="app-actions" aria-label="Development session">
      <p>
        Local demo controls (Vite DEV only). Production builds use Supabase Auth
        sessions against the postgres-backed API.
      </p>
      <label>
        Actor
        <input value={actorId} onChange={(e) => setActorId(e.target.value)} />
      </label>
      <label>
        Tenant
        <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      </label>
      <label>
        Run
        <input value={runId} onChange={(e) => setRunId(e.target.value)} />
      </label>
      <button
        type="button"
        onClick={() =>
          session.setSession({
            actorId,
            tenantId,
            accessToken: createDevBrowserToken({ actorId, tenantId }),
            authSource: "dev",
          })
        }
      >
        Sign in (dev)
      </button>
      <button
        type="button"
        onClick={() => {
          const token =
            session.accessToken ?? createDevBrowserToken({ actorId, tenantId });
          if (!session.accessToken) {
            session.setSession({
              actorId,
              tenantId,
              accessToken: token,
              authSource: "dev",
            });
          }
          void fetch(`${apiBaseUrl}/api/v1/dev/seed-simulation-run`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ simulationRunId: runId }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const body = (await response.json().catch(() => null)) as {
                  error?: { message?: string };
                } | null;
                setSeedStatus(
                  body?.error?.message ?? `Seed failed (${response.status})`,
                );
                return;
              }
              setSeedStatus(`Seeded active run ${runId}.`);
            })
            .catch(() => {
              setSeedStatus(
                "Seed request failed. Start API with PROJECTSIM_ENABLE_DEV_ROUTES=1.",
              );
            });
        }}
      >
        Seed demo run
      </button>
      <Link to={`/app/runs/${encodeURIComponent(runId)}/decisions`}>
        Open Decision UI
      </Link>
      <Link to={workplaceMissionControlPath(runId)}>Open Mission Control</Link>
      <Link to={workplaceInboxPath(runId)}>Open Inbox</Link>
      <Link to={workplaceMeetingsPath(runId)}>Open Meetings</Link>
      <Link to={workplaceStakeholdersPath(runId)}>Open Stakeholders</Link>
      <Link to={workplaceDocumentsPath(runId)}>Open Documents</Link>
      <Link to={workplaceNotificationsPath(runId)}>Open Notifications</Link>
      <Link to={workplaceActivitiesPath(runId)}>Open Activities</Link>
      <Link to={workplaceCompletedHistoryPath(runId)}>
        Open Completed History
      </Link>
      <Link to={workplaceDecisionLogPath(runId)}>Open Decision Log</Link>
      <Link to={workplacePerformancePath(runId)}>Open Performance</Link>
      <Link to={workplaceProgressPath(runId)}>Open Progress</Link>
      <Link to={workplaceRunPath(runId)}>Open Workplace</Link>
      <Link to="/catalog">Open Business Case Catalog</Link>
      {seedStatus ? <p role="status">{seedStatus}</p> : null}
    </section>
  );
}

function HomePage() {
  const session = useAuthSession();
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">ProjectSim 2.0</p>
        <h1>Decision UI</h1>
        <p className="app-subtitle">
          Projection-driven Decision experience connected to the authoritative
          API (PS-ROADMAP-007).
        </p>
      </header>
      {import.meta.env.DEV ? <DevSessionControls /> : null}
      {!import.meta.env.DEV && session.accessToken ? (
        <p role="status">
          Signed in via Supabase Auth as {session.actorId} / {session.tenantId}.
        </p>
      ) : null}
      {!import.meta.env.DEV && !session.accessToken ? (
        <p role="status">
          Sign in with Supabase Auth to load Decision projections.
        </p>
      ) : null}
      <p>
        <Link to="/catalog">Business Case Catalog</Link>
      </p>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/catalog/:businessCaseId" element={<CaseDetailsPage />} />
      <Route
        path="/app/runs/:simulationRunId/decisions"
        element={<DecisionPage />}
      />
      <Route path="/app/runs/:simulationRunId" element={<WorkplaceShell />}>
        <Route index element={<DefaultRunRedirect />} />
        <Route path="mission-control" element={<MissionControlPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="stakeholders" element={<StakeholdersPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="completed-history" element={<CompletedHistoryPage />} />
        <Route path="decision-log" element={<DecisionLogPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="progress" element={<LearnerProgressionPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="mastery" element={<MasteryPage />} />
        <Route path="coaching" element={<CoachingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    [],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
