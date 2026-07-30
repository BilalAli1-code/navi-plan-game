import { describe, expect, it } from "vitest";
import {
  ACTIVITIES_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  MEETINGS_PROJECTION_TYPE,
  MISSION_CONTROL_PROJECTION_TYPE,
  SIMULATION_PROJECTION_TYPE,
  WORKPLACE_PROJECTION_TYPES,
  ok,
} from "@projectsim/domain";
import {
  evaluateWorkplaceConvergenceCompleteness,
  multiProjectionFanOutRoutes,
  WORKPLACE_CONVERGENCE_MANIFEST,
  WORKPLACE_SHELL_NAV_ORDER,
  WORKPLACE_SHELL_PROJECTION_TYPES,
} from "./workplace-convergence-inventory";
import {
  activitiesProjectionRebuildHandler,
  achievementsProjectionRebuildHandler,
  completedHistoryProjectionRebuildHandler,
  coachingProjectionRebuildHandler,
  createWorkplaceProjectionRegistry,
  decisionLogProjectionRebuildHandler,
  defaultWorkplaceProjectionFanOut,
  documentsProjectionRebuildHandler,
  inboxProjectionRebuildHandler,
  learnerProgressionProjectionRebuildHandler,
  masteryProjectionRebuildHandler,
  meetingsProjectionRebuildHandler,
  missionControlProjectionRebuildHandler,
  notificationsProjectionRebuildHandler,
  performanceProjectionRebuildHandler,
  simulationProjectionRebuildHandler,
  stakeholdersProjectionRebuildHandler,
} from "./workplace-projection-registry";

const stub = {
  rebuild: async () => ok({ projection: {} as never, saveResult: "unchanged" }),
};

const productionLikeRegistry = () =>
  createWorkplaceProjectionRegistry({
    handlers: [
      simulationProjectionRebuildHandler(stub as never),
      missionControlProjectionRebuildHandler(stub as never),
      decisionLogProjectionRebuildHandler(stub as never),
      inboxProjectionRebuildHandler(stub as never),
      meetingsProjectionRebuildHandler(stub as never),
      stakeholdersProjectionRebuildHandler(stub as never),
      documentsProjectionRebuildHandler(stub as never),
      notificationsProjectionRebuildHandler(stub as never),
      activitiesProjectionRebuildHandler(stub as never),
      completedHistoryProjectionRebuildHandler(stub as never),
      performanceProjectionRebuildHandler(stub as never),
      learnerProgressionProjectionRebuildHandler(stub as never),
      achievementsProjectionRebuildHandler(stub as never),
      masteryProjectionRebuildHandler(stub as never),
      coachingProjectionRebuildHandler(stub as never),
    ],
  });

describe("workplace convergence inventory (PS-024)", () => {
  it("covers every domain workplace projection type exactly once", () => {
    const types = WORKPLACE_CONVERGENCE_MANIFEST.map(
      (entry) => entry.projectionType,
    );
    expect(new Set(types).size).toBe(types.length);
    expect([...types].sort()).toEqual([...WORKPLACE_PROJECTION_TYPES].sort());
  });

  it("keeps shell nav order aligned with shell-visible manifest entries", () => {
    expect(WORKPLACE_SHELL_NAV_ORDER).toEqual([
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
    expect(WORKPLACE_SHELL_PROJECTION_TYPES).not.toContain(
      SIMULATION_PROJECTION_TYPE,
    );
    const labels = WORKPLACE_CONVERGENCE_MANIFEST.filter(
      (entry) => entry.shellVisible,
    ).map((entry) => entry.shellLabel);
    expect(labels).toEqual([...WORKPLACE_SHELL_NAV_ORDER]);
  });

  it("passes registry completeness against a production-like registry", () => {
    const result = evaluateWorkplaceConvergenceCompleteness({
      registry: productionLikeRegistry(),
    });
    expect(result.ok, result.diagnostics).toBe(true);
  });

  it("fails completeness when a registered type lacks manifest coverage", () => {
    const incomplete = createWorkplaceProjectionRegistry({
      handlers: [
        simulationProjectionRebuildHandler(stub as never),
        missionControlProjectionRebuildHandler(stub as never),
      ],
    });
    const result = evaluateWorkplaceConvergenceCompleteness({
      registry: incomplete,
    });
    expect(result.ok).toBe(false);
    expect(result.missingHandlers.length).toBeGreaterThan(0);
  });

  it("documents multi-projection fan-out including ActivityCompleted", () => {
    const routes = multiProjectionFanOutRoutes();
    const activityCompleted = routes.find(
      (route) => route.eventType === "ActivityCompleted",
    );
    expect(activityCompleted?.targets).toEqual([
      ACTIVITIES_PROJECTION_TYPE,
      COMPLETED_HISTORY_PROJECTION_TYPE,
    ]);
    const meeting = routes.find(
      (route) => route.eventType === "MeetingScheduled",
    );
    expect(meeting?.targets).toEqual([
      MEETINGS_PROJECTION_TYPE,
      MISSION_CONTROL_PROJECTION_TYPE,
    ]);
    expect(defaultWorkplaceProjectionFanOut("LearnerMessageDelivered")).toEqual(
      ["inbox"],
    );
  });

  it("marks Completed History as derived from authoritative Activities", () => {
    const history = WORKPLACE_CONVERGENCE_MANIFEST.find(
      (entry) => entry.projectionType === COMPLETED_HISTORY_PROJECTION_TYPE,
    );
    expect(history?.authoritativeSource).toContain("derived");
    expect(history?.notes).toMatch(/never the activities projection/i);
  });
});
