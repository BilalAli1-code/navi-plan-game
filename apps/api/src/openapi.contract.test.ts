import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("OpenAPI PS-ROADMAP-007/011/012/014/017/019/020/021/022 contracts", () => {
  const yaml = readFileSync(
    resolve(process.cwd(), "../../docs/api/openapi/openapi.yaml"),
    "utf8",
  );

  it("documents projection, mission-control, decision-log, inbox, meetings, stakeholders, documents, notifications, activities, completed-history, and submit-decision routes", () => {
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/projection");
    expect(yaml).toContain(
      "/simulation-runs/{simulationRunId}/mission-control",
    );
    expect(yaml).toContain("getMissionControlProjection");
    expect(yaml).toContain("projectionType: mission_control");
    expect(yaml).toContain("channel_not_implemented");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/decision-log");
    expect(yaml).toContain("getDecisionLogProjection");
    expect(yaml).toContain("projectionType: decision_log");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/inbox");
    expect(yaml).toContain("getInboxProjection");
    expect(yaml).toContain("projectionType: inbox");
    expect(yaml).toContain("readState: unsupported");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/meetings");
    expect(yaml).toContain("getMeetingsProjection");
    expect(yaml).toContain("projectionType: meetings");
    expect(yaml).toContain("scheduleSequence");
    expect(yaml).toContain("status: scheduled");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/stakeholders");
    expect(yaml).toContain("getStakeholdersProjection");
    expect(yaml).toContain("projectionType: stakeholders");
    expect(yaml).toContain("initializationSequence");
    expect(yaml).toContain("sendMessage: unsupported");
    expect(yaml).toContain("learner_to_stakeholder");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/documents");
    expect(yaml).toContain("getDocumentsProjection");
    expect(yaml).toContain("projectionType: documents");
    expect(yaml).toContain("creationSequence");
    expect(yaml).toContain("contentType: plain_text");
    expect(yaml).toContain("upload: unsupported");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/performance");
    expect(yaml).toContain("getPerformanceProjection");
    expect(yaml).toContain("projectionType: performance");
    expect(yaml).toContain("decisionCounts");
    expect(yaml).toContain(
      "/simulation-runs/{simulationRunId}/learner-progression",
    );
    expect(yaml).toContain("getLearnerProgressionProjection");
    expect(yaml).toContain("projectionType: learner_progression");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/achievements");
    expect(yaml).toContain("getAchievementsProjection");
    expect(yaml).toContain("projectionType: achievements");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/mastery");
    expect(yaml).toContain("getMasteryProjection");
    expect(yaml).toContain("projectionType: mastery");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/coaching");
    expect(yaml).toContain("getCoachingProjection");
    expect(yaml).toContain("projectionType: coaching");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/notifications");
    expect(yaml).toContain("getNotificationsProjection");
    expect(yaml).toContain("projectionType: notifications");
    expect(yaml).toContain("authored_consequence");
    expect(yaml).toContain("markRead: unsupported");
    expect(yaml).toContain("/simulation-runs/{simulationRunId}/activities");
    expect(yaml).toContain("getActivitiesProjection");
    expect(yaml).toContain("projectionType: activities");
    expect(yaml).toContain("complete: unsupported");
    expect(yaml).toContain(
      "/simulation-runs/{simulationRunId}/completed-history",
    );
    expect(yaml).toContain("getCompletedHistoryProjection");
    expect(yaml).toContain("projectionType: completed_history");
    expect(yaml).toContain("clear: unsupported");
    expect(yaml).toContain(
      "/simulation-runs/{simulationRunId}/commands/submit-decision",
    );
    expect(yaml).toContain("Idempotency-Key");
    expect(yaml).toContain("If-Match");
    expect(yaml).toContain("freshness");
    expect(yaml).toContain("rebuild_failed");
    expect(yaml).toContain("SubmitDecision");
    expect(yaml).toContain("aggregateVersion");
    expect(yaml).not.toContain("/projections/{projectionType}");
  });

  it("keeps request/response examples aligned with implementation constants", () => {
    expect(yaml).toContain("commandVersion: 1");
    expect(yaml).toContain("apiVersion: v1");
    expect(yaml).toContain("projectionSchemaVersion: 1");
    expect(yaml).not.toMatch(/^\s*semanticHash:/m);
    expect(yaml).not.toMatch(/^\s*sourceEventId:/m);
    expect(yaml).not.toContain("service_role");
  });

  it("does not document development seed routes or development authentication", () => {
    expect(yaml).not.toContain("/dev/");
    expect(yaml).not.toContain("seed-simulation-run");
    expect(yaml).not.toContain("dev.");
    expect(yaml).not.toContain("PROJECTSIM_ALLOW_DEV_AUTH");
  });

  it("does not document opt-in E2E fixture or projection-gate routes", () => {
    expect(yaml).not.toContain("/e2e");
    expect(yaml).not.toContain("PROJECTSIM_ENABLE_E2E_SEAMS");
    expect(yaml).not.toContain("projection-gate");
    expect(yaml).not.toContain("E2E_ALLOW_GLOBAL_RESET");
  });
});
