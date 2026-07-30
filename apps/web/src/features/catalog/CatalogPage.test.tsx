import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider } from "../../auth/session";
import { CatalogPage } from "./CatalogPage";
import { CaseDetailsPage } from "./CaseDetailsPage";

const listBusinessCases = vi.fn();
const getBusinessCase = vi.fn();
const createSimulationRun = vi.fn();

vi.mock("../../api/client", async () => {
  const actual =
    await vi.importActual<typeof import("../../api/client")>(
      "../../api/client",
    );
  return {
    ...actual,
    createApiClient: () => ({
      listBusinessCases,
      getBusinessCase,
      createSimulationRun,
      getMissionControl: vi.fn(),
      getProjection: vi.fn(),
      submitDecision: vi.fn(),
    }),
  };
});

const renderCatalog = (initialEntry = "/catalog") => {
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
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/catalog" element={<CatalogPage />} />
            <Route
              path="/catalog/:businessCaseId"
              element={<CaseDetailsPage />}
            />
            <Route
              path="/app/runs/:simulationRunId/mission-control"
              element={<div data-testid="mission-control">Mission Control</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthSessionProvider>
    </QueryClientProvider>,
  );
};

describe("CatalogPage", () => {
  beforeEach(() => {
    listBusinessCases.mockReset();
    getBusinessCase.mockReset();
    createSimulationRun.mockReset();
  });

  it("renders selectable catalog cards from the API", async () => {
    listBusinessCases.mockResolvedValue({
      data: [
        {
          businessCaseId: "case-alpha",
          contentVersion: "1.0.0",
          contentPackageVersionId: "cpv_1",
          title: "Alpha Recovery",
          shortTitle: "Alpha",
          summary: "Stabilize a delayed logistics program.",
          industry: "Logistics",
          organizationType: "Enterprise",
          projectType: "Recovery",
          estimatedMinutes: 90,
          learningDays: 5,
          difficulty: "intermediate",
          supportedExperienceLevels: ["explorer", "practitioner"],
          availability: "available",
          selectable: true,
          accessibilitySummary: "Text alternatives provided.",
        },
      ],
      meta: {
        requestId: "req_1",
        correlationId: "corr_1",
        apiVersion: "v1",
      },
    });

    renderCatalog();

    expect(
      await screen.findByTestId(
        "catalog-card-case-alpha",
        {},
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Business Case Catalog" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alpha Recovery")).toBeInTheDocument();
    expect(screen.getByText("Logistics")).toBeInTheDocument();
    expect(
      screen.getByText("Stabilize a delayed logistics program."),
    ).toBeInTheDocument();
    expect(screen.getByText("1 hr 30 min")).toBeInTheDocument();
    expect(screen.getByText("intermediate")).toBeInTheDocument();
    expect(screen.getByText("explorer")).toBeInTheDocument();
    expect(screen.getByText("practitioner")).toBeInTheDocument();
    expect(screen.getByText(/Availability:\s*available/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review case/i })).toHaveAttribute(
      "href",
      "/catalog/case-alpha",
    );
  });

  it("requires experience level before starting and navigates to mission control", async () => {
    const user = userEvent.setup();
    getBusinessCase.mockResolvedValue({
      data: {
        businessCaseId: "case-alpha",
        contentVersion: "1.0.0",
        contentPackageVersionId: "cpv_1",
        title: "Alpha Recovery",
        shortTitle: "Alpha",
        summary: "Stabilize a delayed logistics program.",
        industry: "Logistics",
        organizationType: "Enterprise",
        projectType: "Recovery",
        estimatedMinutes: 90,
        learningDays: 5,
        difficulty: "intermediate",
        supportedExperienceLevels: ["explorer", "practitioner"],
        availability: "available",
        selectable: true,
        accessibilitySummary: "Text alternatives provided.",
        learningFocus: ["Stakeholder alignment"],
        learnerRole: "Project manager",
        prerequisites: ["Basic PM vocabulary"],
        chapterCount: 3,
        pmbokAlignment: ["Stakeholder Engagement"],
      },
      meta: {
        requestId: "req_2",
        correlationId: "corr_2",
        apiVersion: "v1",
      },
    });
    createSimulationRun.mockResolvedValue({
      data: {
        simulationRunId: "run_new_1",
        businessCaseId: "case-alpha",
        contentVersion: "1.0.0",
        contentPackageVersionId: "cpv_1",
        experienceLevel: "explorer",
        status: "active",
        runtimeVersion: "projectsim-runtime/1",
        chapterId: "chapter-01",
        initialized: {
          stakeholders: 1,
          documents: 1,
          notifications: 0,
          activities: 1,
          messages: 1,
          meetings: 0,
        },
      },
      meta: {
        requestId: "req_3",
        correlationId: "corr_3",
        apiVersion: "v1",
      },
    });

    renderCatalog("/catalog/case-alpha");

    expect(
      await screen.findByTestId("case-details-summary", {}, { timeout: 5_000 }),
    ).toHaveTextContent(/Stabilize a delayed logistics program/i);
    expect(screen.getByTestId("case-learning-focus")).toHaveTextContent(
      /Stakeholder alignment/i,
    );

    const startButton = screen.getByTestId("case-start-button");
    expect(startButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /explorer/i }));
    expect(startButton).toBeEnabled();

    await user.click(startButton);

    expect(createSimulationRun).toHaveBeenCalledWith({
      businessCaseId: "case-alpha",
      experienceLevel: "explorer",
      contentPackageVersionId: "cpv_1",
    });
    expect(
      await screen.findByTestId("mission-control", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });
});
