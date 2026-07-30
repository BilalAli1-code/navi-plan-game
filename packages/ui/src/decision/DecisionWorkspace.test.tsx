import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DecisionWorkspace } from "./DecisionWorkspace";
import type { DecisionWorkspaceViewModel } from "./types";

const model = (
  overrides: Partial<DecisionWorkspaceViewModel> = {},
): DecisionWorkspaceViewModel => ({
  simulationRunId: "run_1",
  freshness: "current",
  sourceAggregateVersion: 2,
  runStatus: "active",
  projectStatus: "initiated",
  metrics: [{ metricKey: "budget", value: 100, unit: "USD" }],
  availableDecisions: [
    {
      decisionDefinitionId: "decision_1",
      title: "Scaffold Decision",
      prompt: "Choose how to proceed.",
      description: null,
      expiresAt: null,
      authoredOrder: 0,
      options: [
        {
          optionId: "option_a",
          label: "Conservative option",
          authoredOrder: 0,
        },
        { optionId: "option_b", label: "Balanced option", authoredOrder: 1 },
      ],
    },
  ],
  decisionHistory: [],
  ...overrides,
});

describe("DecisionWorkspace", () => {
  it("renders loading and unavailable states", () => {
    const { rerender } = render(
      <DecisionWorkspace
        model={null}
        loading
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByText(/loading simulation projection/i)).toBeTruthy();

    rerender(
      <DecisionWorkspace
        model={null}
        errorMessage="Permission denied."
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/permission denied/i);
  });

  it("renders available decision and disables submit when freshness is rebuild_failed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <DecisionWorkspace
        model={model({ freshness: "rebuild_failed" })}
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText(/may not be current/i)).toBeTruthy();
    await user.click(screen.getByLabelText("Conservative option"));
    expect(
      screen.getByRole("button", { name: /review and submit/i }),
    ).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports keyboard option selection, rationale, and confirmation submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <DecisionWorkspace
        model={model()}
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByLabelText("Balanced option"));
    await user.type(
      screen.getByLabelText(/rationale/i),
      "Need stakeholder buy-in",
    );
    await user.click(
      screen.getByRole("button", { name: /review and submit/i }),
    );
    expect(screen.getByText(/confirm submission/i)).toBeTruthy();
    expect(screen.getByText(/Need stakeholder buy-in/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /submit decision/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      decisionId: "decision_1",
      optionId: "option_b",
      rationale: "Need stakeholder buy-in",
      expectedAggregateVersion: 2,
    });
  });

  it("disables duplicate submission while pending and announces status", () => {
    render(
      <DecisionWorkspace
        model={model()}
        phase="submitting"
        statusMessage="Submitting decision…"
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(
      screen.getByText(/submitting decision/i, {
        selector: ".ps-decision-status",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /review and submit/i }),
    ).toBeDisabled();
  });

  it("renders empty available decisions and project metrics from projection", () => {
    render(
      <DecisionWorkspace
        model={model({
          availableDecisions: [],
          metrics: [{ metricKey: "schedule", value: 3, unit: "days" }],
        })}
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByText(/no decisions available/i)).toBeTruthy();
    expect(screen.getByText(/schedule: 3 days/i)).toBeTruthy();
  });

  it("renders null qualityClassification without inventing a score", () => {
    render(
      <DecisionWorkspace
        model={model({
          availableDecisions: [],
          decisionHistory: [
            {
              decisionRecordId: "dr_1",
              decisionDefinitionId: "decision_1",
              selectedOptionId: "option_a",
              selectedOptionLabel: "Conservative option",
              submittedAt: "2026-07-25T12:00:00.000Z",
              resolvedAt: "2026-07-25T12:00:00.000Z",
              status: "resolved",
              qualityClassification: null,
              publicResultSummary: "You chose a conservative path.",
            },
          ],
        })}
        phase="resolved"
        statusMessage="Decision resolved."
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByText(/quality classification: none/i)).toBeTruthy();
    expect(screen.queryByText(/correct/i)).toBeNull();
    expect(screen.queryByText(/FIXTURE_BUDGET_DELTA/i)).toBeNull();
  });

  it("does not expose hidden consequence or schedule fields in the DOM", () => {
    const { container } = render(
      <DecisionWorkspace
        model={model()}
        phase="ready"
        onRefresh={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(container.innerHTML).not.toContain("consequence");
    expect(container.innerHTML).not.toContain("resolverVersion");
    expect(container.innerHTML).not.toContain("learningSignal");
  });
});
