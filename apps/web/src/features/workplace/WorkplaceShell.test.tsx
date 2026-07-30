import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider } from "../../auth/session";
import { DefaultRunRedirect } from "./DefaultRunRedirect";
import { WorkplaceShell } from "./WorkplaceShell";

const getMissionControl = vi.fn();
const getDecisionLog = vi.fn();
const getInbox = vi.fn();
const getMeetings = vi.fn();
const getStakeholders = vi.fn();

vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>(
      "../../api/client",
    );
  return {
    ...actual,
    createApiClient: () => ({
      getMissionControl,
      getDecisionLog,
      getInbox,
      getMeetings,
      getStakeholders,
      getProjection: vi.fn(),
      submitDecision: vi.fn(),
    }),
  };
});

const MissionControlStub = () => (
  <main>
    <h1>Mission Control</h1>
    <p data-testid="mc-stub">MC content</p>
  </main>
);

const InboxStub = () => (
  <main>
    <h1>Inbox</h1>
    <p data-testid="inbox-stub">Inbox content</p>
  </main>
);

const MeetingsStub = () => (
  <main>
    <h1>Meetings</h1>
    <p data-testid="meetings-stub">Meetings content</p>
  </main>
);

const StakeholdersStub = () => (
  <main>
    <h1>Stakeholders</h1>
    <p data-testid="stakeholders-stub">Stakeholders content</p>
  </main>
);

const DocumentsStub = () => (
  <main>
    <h1>Documents</h1>
    <p data-testid="documents-stub">Documents content</p>
  </main>
);

const NotificationsStub = () => (
  <main>
    <h1>Notifications</h1>
    <p data-testid="notifications-stub">Notifications content</p>
  </main>
);

const ActivitiesStub = () => (
  <main>
    <h1>Activities</h1>
    <p data-testid="activities-stub">Activities content</p>
  </main>
);

const CompletedHistoryStub = () => (
  <main>
    <h1>Completed History</h1>
    <p data-testid="completed-history-stub">Completed History content</p>
  </main>
);

const DecisionLogStub = () => (
  <main>
    <h1>Decision Log</h1>
    <p data-testid="dlog-stub">Log content</p>
  </main>
);

const PerformanceStub = () => (
  <main>
    <h1>Performance</h1>
    <p data-testid="performance-stub">Performance content</p>
  </main>
);

const ProgressStub = () => (
  <main>
    <h1>Progress</h1>
    <p data-testid="progress-stub">Progress content</p>
  </main>
);

const AchievementsStub = () => (
  <main>
    <h1>Achievements</h1>
    <p data-testid="achievements-stub">Achievements content</p>
  </main>
);

const MasteryStub = () => (
  <main>
    <h1>Mastery</h1>
    <p data-testid="mastery-stub">Mastery content</p>
  </main>
);

const CoachingStub = () => (
  <main>
    <h1>Coaching</h1>
    <p data-testid="coaching-stub">Coaching content</p>
  </main>
);

const renderShell = (initialPath: string) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AuthSessionProvider
        initial={{
          actorId: "actor_1",
          tenantId: "tenant_local",
          accessToken: "dev.actor_1.tenant_local",
          authSource: "dev",
        }}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route
              path="/app/runs/:simulationRunId"
              element={<WorkplaceShell />}
            >
              <Route index element={<DefaultRunRedirect />} />
              <Route path="mission-control" element={<MissionControlStub />} />
              <Route path="inbox" element={<InboxStub />} />
              <Route path="meetings" element={<MeetingsStub />} />
              <Route path="stakeholders" element={<StakeholdersStub />} />
              <Route path="documents" element={<DocumentsStub />} />
              <Route path="notifications" element={<NotificationsStub />} />
              <Route path="activities" element={<ActivitiesStub />} />
              <Route
                path="completed-history"
                element={<CompletedHistoryStub />}
              />
              <Route path="decision-log" element={<DecisionLogStub />} />
              <Route path="performance" element={<PerformanceStub />} />
              <Route path="progress" element={<ProgressStub />} />
              <Route path="achievements" element={<AchievementsStub />} />
              <Route path="mastery" element={<MasteryStub />} />
              <Route path="coaching" element={<CoachingStub />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthSessionProvider>
    </QueryClientProvider>,
  );
};

describe("WorkplaceShell", () => {
  beforeEach(() => {
    getMissionControl.mockReset();
    getDecisionLog.mockReset();
    getInbox.mockReset();
    getMeetings.mockReset();
    getStakeholders.mockReset();
  });

  it("renders workplace nav with Mission Control, Inbox, Meetings, Stakeholders, Documents, Notifications, Activities, Completed History, Decision Log, Performance, and Progress", () => {
    renderShell("/app/runs/run_1/mission-control");
    const nav = screen.getByTestId("workplace-nav");
    const links = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(links).toEqual([
      "Mission Control",
      "Inbox",
      "Meetings",
      "Stakeholders",
      "Documents",
      "Notifications",
      "Activities",
      "Completed History",
      "Decision Log",
      "Performance",
      "Progress",
      "Achievements",
      "Mastery",
      "Coaching",
    ]);
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
    expect(screen.getByTestId("mc-stub")).toBeInTheDocument();
    expect(getMissionControl).not.toHaveBeenCalled();
    expect(getDecisionLog).not.toHaveBeenCalled();
    expect(getInbox).not.toHaveBeenCalled();
    expect(getMeetings).not.toHaveBeenCalled();
    expect(getStakeholders).not.toHaveBeenCalled();
  });

  it("marks Inbox current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Inbox" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(within(nav).getByRole("link", { name: "Inbox" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("inbox-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("marks Meetings current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Meetings" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(within(nav).getByRole("link", { name: "Meetings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("meetings-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("marks Stakeholders current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Stakeholders" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(
      within(nav).getByRole("link", { name: "Stakeholders" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("stakeholders-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("marks Decision Log current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Decision Log" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(
      within(nav).getByRole("link", { name: "Decision Log" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("dlog-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("marks Documents current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Documents" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(
      within(nav).getByRole("link", { name: "Documents" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("documents-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("marks Notifications current and preserves run id on navigation", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    await user.click(screen.getByRole("link", { name: "Notifications" }));
    const nav = screen.getByTestId("workplace-nav");
    expect(
      within(nav).getByRole("link", { name: "Notifications" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Mission Control" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("notifications-stub")).toBeInTheDocument();
    expect(screen.getByTestId("workplace-run-id")).toHaveTextContent("run_1");
  });

  it("redirects default run route to Mission Control", () => {
    renderShell("/app/runs/run_1");
    expect(screen.getByTestId("mc-stub")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("workplace-nav")).getByRole("link", {
        name: "Mission Control",
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("toggles mobile menu expanded state", async () => {
    const user = userEvent.setup();
    renderShell("/app/runs/run_1/mission-control");
    const toggle = screen.getByRole("button", { name: /Workplace menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
