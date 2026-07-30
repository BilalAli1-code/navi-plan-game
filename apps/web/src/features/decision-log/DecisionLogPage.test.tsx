import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider } from "../../auth/session";
import { DecisionLogPage } from "./DecisionLogPage";

const getDecisionLog = vi.fn();

vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>(
      "../../api/client",
    );
  return {
    ...actual,
    createApiClient: () => ({
      getDecisionLog,
      getMissionControl: vi.fn(),
      getProjection: vi.fn(),
      submitDecision: vi.fn(),
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
        <MemoryRouter initialEntries={["/app/runs/run_1/decision-log"]}>
          <Routes>
            <Route
              path="/app/runs/:simulationRunId/decision-log"
              element={<DecisionLogPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthSessionProvider>
    </QueryClientProvider>,
  );
};

describe("DecisionLogPage", () => {
  beforeEach(() => {
    getDecisionLog.mockReset();
  });

  it("renders empty available Decision Log", async () => {
    getDecisionLog.mockResolvedValue({
      data: {
        projectionType: "decision_log",
        projectionSchemaVersion: 1,
        tenantId: "tenant_local",
        simulationRunId: "run_1",
        learnerId: "learner_1",
        contentPackageVersionId: "cpv_1",
        sourceAggregateVersion: 2,
        sourceStateVersion: 0,
        sourceActionSequence: 0,
        generatedAt: "2026-07-25T12:00:00.000Z",
        entries: [],
        summary: { totalEntries: 0, isEmpty: true },
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
      await screen.findByTestId("dlog-empty", {}, { timeout: 5_000 }),
    ).toHaveTextContent(/No completed decisions/i);
    expect(screen.getByTestId("dlog-freshness")).toHaveTextContent(/Current/i);
    expect(screen.queryByTestId("dlog-entries")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Decision Log" }),
    ).toBeInTheDocument();
  });

  it("renders entries in server order without hidden fields", async () => {
    getDecisionLog.mockResolvedValue({
      data: {
        projectionType: "decision_log",
        projectionSchemaVersion: 1,
        tenantId: "tenant_local",
        simulationRunId: "run_1",
        learnerId: "learner_1",
        contentPackageVersionId: "cpv_1",
        sourceAggregateVersion: 4,
        sourceStateVersion: 2,
        sourceActionSequence: 1,
        generatedAt: "2026-07-25T12:00:00.000Z",
        entries: [
          {
            entryId: "drec_2",
            decisionRecordId: "drec_2",
            decisionDefinitionId: "decision_2",
            sequence: 2,
            decidedAt: "2026-07-25T11:00:00.000Z",
            title: "Newer decision",
            selectedOption: { optionId: "option_b", label: "Option B" },
            status: "resolved",
            revealedOutcome: { summary: "Public outcome B" },
          },
          {
            entryId: "drec_1",
            decisionRecordId: "drec_1",
            decisionDefinitionId: "decision_1",
            sequence: 1,
            decidedAt: "2026-07-25T10:00:00.000Z",
            title: "Older decision",
            selectedOption: { optionId: "option_a", label: "Option A" },
            status: "submitted",
            revealedOutcome: null,
          },
        ],
        summary: { totalEntries: 2, isEmpty: false },
      },
      meta: {
        requestId: "req_1",
        correlationId: "corr_1",
        apiVersion: "v1",
        projectionSchemaVersion: 1,
        sourceAggregateVersion: 4,
        freshness: "current",
        generatedAt: "2026-07-25T12:00:00.000Z",
      },
    });

    renderPage();
    expect(await screen.findByText("Newer decision")).toBeInTheDocument();
    const entries = screen.getByTestId("dlog-entries");
    const items = entries.querySelectorAll("li");
    expect(items[0]).toHaveTextContent("Newer decision");
    expect(items[1]).toHaveTextContent("Older decision");
    expect(screen.getByText(/Public outcome B/)).toBeInTheDocument();
    expect(screen.getByText(/Option A/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("qualityClassification");
    expect(document.body.textContent).not.toContain("facilitator");
    expect(document.body.textContent).not.toContain("semanticHash");
  });
});
