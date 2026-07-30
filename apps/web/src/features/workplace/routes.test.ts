import { describe, expect, it } from "vitest";
import {
  workplaceActivitiesPath,
  workplaceCompletedHistoryPath,
  workplaceDecisionLogPath,
  workplaceDefaultChildPath,
  workplaceDocumentsPath,
  workplaceInboxPath,
  workplaceMeetingsPath,
  workplaceMissionControlPath,
  workplaceNotificationsPath,
  workplacePerformancePath,
  workplaceProgressPath,
  workplaceAchievementsPath,
  workplaceMasteryPath,
  workplaceCoachingPath,
  workplaceRunPath,
  workplaceStakeholdersPath,
} from "./routes";

describe("workplace route helpers", () => {
  it("builds trusted encoded paths and preserves run identity", () => {
    expect(workplaceRunPath("run_1")).toBe("/app/runs/run_1");
    expect(workplaceMissionControlPath("run_1")).toBe(
      "/app/runs/run_1/mission-control",
    );
    expect(workplaceInboxPath("run_1")).toBe("/app/runs/run_1/inbox");
    expect(workplaceMeetingsPath("run_1")).toBe("/app/runs/run_1/meetings");
    expect(workplaceStakeholdersPath("run_1")).toBe(
      "/app/runs/run_1/stakeholders",
    );
    expect(workplaceDocumentsPath("run_1")).toBe("/app/runs/run_1/documents");
    expect(workplaceNotificationsPath("run_1")).toBe(
      "/app/runs/run_1/notifications",
    );
    expect(workplaceActivitiesPath("run_1")).toBe("/app/runs/run_1/activities");
    expect(workplaceCompletedHistoryPath("run_1")).toBe(
      "/app/runs/run_1/completed-history",
    );
    expect(workplaceDecisionLogPath("run_1")).toBe(
      "/app/runs/run_1/decision-log",
    );
    expect(workplacePerformancePath("run_1")).toBe(
      "/app/runs/run_1/performance",
    );
    expect(workplaceProgressPath("run_1")).toBe("/app/runs/run_1/progress");
    expect(workplaceAchievementsPath("run_1")).toBe(
      "/app/runs/run_1/achievements",
    );
    expect(workplaceMasteryPath("run_1")).toBe("/app/runs/run_1/mastery");
    expect(workplaceCoachingPath("run_1")).toBe("/app/runs/run_1/coaching");
    expect(workplaceDefaultChildPath).toBe("mission-control");
    expect(workplaceMissionControlPath("run/with spaces")).toBe(
      "/app/runs/run%2Fwith%20spaces/mission-control",
    );
  });
});
