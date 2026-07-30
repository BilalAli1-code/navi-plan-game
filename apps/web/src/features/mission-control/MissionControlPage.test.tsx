import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider } from "../../auth/session";
import { MissionControlPage } from "./MissionControlPage";

const getMissionControl = vi.fn();

vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>(
      "../../api/client",
    );
  return {
    ...actual,
    createApiClient: () => ({
      getMissionControl,
      getProjection: vi.fn(),
      submitDecision: vi.fn(),
      completeChapter: vi.fn(),
    }),
  };
});

const renderPage = () => {
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
        <MemoryRouter initialEntries={["/app/runs/run_1/mission-control"]}>
          <Routes>
            <Route
              path="/app/runs/:simulationRunId/mission-control"
              element={<MissionControlPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthSessionProvider>
    </QueryClientProvider>,
  );
};

describe("MissionControlPage", () => {
  beforeEach(() => {
    getMissionControl.mockReset();
  });

  it("renders available counts, unavailable channels, and Decision links", async () => {
    getMissionControl.mockResolvedValue({
      data: {
        projectionType: "mission_control",
        projectionSchemaVersion: 1,
        tenantId: "tenant_local",
        simulationRunId: "run_1",
        learnerId: "learner_1",
        contentPackageVersionId: "cpv_1",
        sourceAggregateVersion: 2,
        sourceStateVersion: 0,
        sourceActionSequence: 0,
        generatedAt: "2026-07-25T12:00:00.000Z",
        runSummary: {
          simulationRunId: "run_1",
          status: "active",
          startedAt: null,
          completedAt: null,
          currentChapterId: null,
          currentDayId: null,
          contentPackageVersionId: "cpv_1",
        },
        projectSummary: {
          status: "initiated",
          metrics: [{ metricKey: "budget", value: 100, unit: "points" }],
        },
        counts: {
          pendingDecisions: { availability: "available", count: 1 },
          unreadActionRequiredInboxItems: {
            availability: "unavailable",
            reason: "channel_not_implemented",
          },
          upcomingMeetings: {
            availability: "available",
            count: 0,
          },
          activeActivities: { availability: "available", count: 0 },
          blockingCrises: { availability: "available", count: 0 },
        },
        nextRecommendedActions: [
          {
            actionId: "decision:decision_1",
            label: "Scaffold Decision",
            targetKind: "decision",
            targetId: "decision_1",
            authoredOrder: 0,
          },
        ],
        recentRevealedOutcome: null,
      },
      meta: {
        requestId: "req_1",
        correlationId: "corr_1",
        apiVersion: "v1",
        projectionSchemaVersion: 1,
        sourceAggregateVersion: 2,
        freshness: "current",
        generatedAt: "2026-07-25T12:00:00.000Z",
      },
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mission Control" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Pending decisions")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Scaffold Decision" }),
    ).toHaveAttribute("href", "/app/runs/run_1/decisions?decision=decision_1");
    expect(screen.getByText("No revealed outcomes yet.")).toBeInTheDocument();
    expect(screen.queryByText("facilitator")).not.toBeInTheDocument();
    const completeChapter = screen.getByTestId("mc-complete-chapter");
    expect(completeChapter).toBeDisabled();
    expect(
      screen.getByText(
        "Complete all pending decisions before completing the chapter.",
      ),
    ).toBeInTheDocument();
  });
});
