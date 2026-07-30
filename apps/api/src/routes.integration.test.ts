import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asLearnerId,
  asSimulationRunId,
  err,
} from "@projectsim/domain";
import { createDevAccessToken } from "./auth/session";
import { createContentApiModule } from "./content/content-module";
import { createApiApp } from "./create-app";
import { createInMemorySimulationModuleRegistry } from "./module-registry";

const tenantId = "tenant_api_1";
const actorId = "actor_1";
const runId = "run_1";
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const authHeader = (
  claims: { actorId: string; tenantId: string } = {
    actorId,
    tenantId,
  },
) => `Bearer ${createDevAccessToken(claims)}`;

const seedActiveRun = async (
  registryOptions?: Parameters<
    typeof createInMemorySimulationModuleRegistry
  >[0],
) => {
  const localRegistry = createInMemorySimulationModuleRegistry(registryOptions);
  const localApp = createApiApp({
    registry: localRegistry,
    clock: () => "2026-07-25T12:00:00.000Z",
    allocateRequestId: () => "req_test_1",
    enableDevRoutes: true,
  });
  const services = localRegistry.get(tenantId);
  const created = await services.lifecycleService.create({
    actorId: asActorId(actorId),
    learnerId: asLearnerId("learner_1"),
    businessCaseId: asBusinessCaseId("case_1"),
    contentPackageVersionId,
    runtimeVersion: "runtime-1",
    correlationId: asCorrelationId("corr_seed"),
    causationId: null,
    simulationRunId: asSimulationRunId(runId),
  });
  expect(created.ok).toBe(true);
  const started = await services.lifecycleService.start({
    actorId: asActorId(actorId),
    simulationRunId: asSimulationRunId(runId),
    correlationId: asCorrelationId("corr_seed"),
    causationId: null,
    expectedAggregateVersion: null,
  });
  expect(started.ok).toBe(true);
  return { app: localApp, services, registry: localRegistry };
};

const submitHeaders = (version: number, commandId: string) => ({
  Authorization: authHeader(),
  "Content-Type": "application/json",
  "Idempotency-Key": commandId,
  "X-Correlation-ID": "corr_submit",
  "If-Match": `"${version}"`,
});

describe("PS-ROADMAP-007 API routes", () => {
  it("rejects unauthenticated projection reads", async () => {
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      allocateRequestId: () => "req_test_1",
      allowDevAuth: true,
    });
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(body.error.requestId).toBe("req_test_1");
  });

  it("rejects service-role style tokens", async () => {
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      allowDevAuth: true,
    });
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: "Bearer service_role.secret" } },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for a missing run", async () => {
    const registry = createInMemorySimulationModuleRegistry();
    const app = createApiApp({ registry, allowDevAuth: true });
    const res = await app.request(
      `/api/v1/simulation-runs/missing_run/projection`,
      { headers: { Authorization: authHeader() } },
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("SIMULATION_RUN_NOT_FOUND");
  });

  it("denies unauthorized projection reads", async () => {
    const { app } = await seedActiveRun({
      authorizedActorsByTenant: {
        [tenantId]: [actorId],
      },
    });
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      {
        headers: {
          Authorization: authHeader({ actorId: "actor_outsider", tenantId }),
        },
      },
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("TENANT_ACCESS_DENIED");
  });

  it("denies cross-tenant run access", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      {
        headers: {
          Authorization: authHeader({
            actorId,
            tenantId: "tenant_other",
          }),
        },
      },
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("SIMULATION_RUN_NOT_FOUND");
  });

  it("returns current projection for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      {
        headers: { Authorization: authHeader(), "X-Correlation-ID": "corr_1" },
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.apiVersion).toBe("v1");
    expect(body.meta.correlationId).toBe("corr_1");
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.availableDecisions).toHaveLength(1);
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
  });

  it("keeps scaffold cpv_1 projection available when business-case registry is wired", async () => {
    // E2E fixtures still pin scaffold cpv_1 while the API process also installs
    // Northstar/Harbor packages. Registry-backed providers must fall back.
    const contentModule = createContentApiModule();
    const { app } = await seedActiveRun({
      businessCaseRegistry: contentModule.registry,
    });
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: authHeader() } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.availableDecisions).toHaveLength(1);
  });

  it("returns current Mission Control projection for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/mission-control`,
      {
        headers: { Authorization: authHeader(), "X-Correlation-ID": "corr_mc" },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("mission_control");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.counts.pendingDecisions).toEqual({
      availability: "available",
      count: 1,
    });
    expect(body.data.counts.unreadActionRequiredInboxItems).toEqual({
      availability: "unavailable",
      reason: "channel_not_implemented",
    });
    expect(body.data.counts.upcomingMeetings).toEqual({
      availability: "available",
      count: 0,
    });
    expect(body.data.counts.activeActivities).toEqual({
      availability: "available",
      count: 0,
    });
    expect(body.data.counts.blockingCrises).toEqual({
      availability: "available",
      count: 0,
    });
    expect(body.data.nextRecommendedActions).toHaveLength(1);
    expect(body.data.nextRecommendedActions[0]?.targetKind).toBe("decision");
    expect(body.data.recentRevealedOutcome).toBeNull();
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
  });

  it("rejects unauthenticated Mission Control reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/mission-control`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Decision Log for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/decision-log`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_dlog",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("decision_log");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.entries).toEqual([]);
    expect(body.data.summary).toEqual({ totalEntries: 0, isEmpty: true });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain("qualityClassification");
  });

  it("rejects unauthenticated Decision Log reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/decision-log`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Inbox for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/inbox`, {
      headers: {
        Authorization: authHeader(),
        "X-Correlation-ID": "corr_inbox",
      },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("inbox");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.messages).toEqual([]);
    expect(body.data.summary).toEqual({
      totalMessages: 0,
      isEmpty: true,
      classificationCounts: {
        informational: 0,
        action_required: 0,
        decision_bearing: 0,
      },
    });
    expect(body.data.capabilities).toEqual({
      readState: "unsupported",
      archive: "unsupported",
      reply: "unsupported",
      compose: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain('"unread"');
    expect(JSON.stringify(body)).not.toContain('"archived"');
  });

  it("rejects unauthenticated Inbox reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/inbox`);
    expect(res.status).toBe(401);
  });

  it("returns current empty Meetings for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/meetings`, {
      headers: {
        Authorization: authHeader(),
        "X-Correlation-ID": "corr_meetings",
      },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("meetings");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.meetings).toEqual([]);
    expect(body.data.summary).toEqual({
      totalMeetings: 0,
      upcomingCount: 0,
      activeCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      start: "unsupported",
      complete: "unsupported",
      cancel: "unsupported",
      reschedule: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain("originatingCommandId");
  });

  it("rejects unauthenticated Meetings reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/meetings`);
    expect(res.status).toBe(401);
  });

  it("returns current empty Stakeholders for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/stakeholders`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_stakeholders",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("stakeholders");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.stakeholders).toEqual([]);
    expect(body.data.summary).toEqual({
      totalStakeholders: 0,
      stakeholdersWithConversation: 0,
      totalMessages: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      sendMessage: "unsupported",
      editProfile: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain("originatingCommandId");
    expect(JSON.stringify(body)).not.toContain("authorActorId");
  });

  it("rejects unauthenticated Stakeholders reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/stakeholders`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Documents for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/documents`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_documents",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("documents");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.documents).toEqual([]);
    expect(body.data.summary).toEqual({
      totalDocuments: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      upload: "unsupported",
      edit: "unsupported",
      comment: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain("originatingCommandId");
  });

  it("rejects unauthenticated Documents reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/documents`);
    expect(res.status).toBe(401);
  });

  it("returns current empty Performance for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/performance`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_performance",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("performance");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.decisionCounts).toEqual({ submitted: 0, resolved: 0 });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain('"xp"');
    expect(JSON.stringify(body)).not.toContain('"mastery"');
  });

  it("rejects unauthenticated Performance reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/performance`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Learner Progression for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/learner-progression`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_learner_progression",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("learner_progression");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.chapters).toEqual([]);
    expect(body.data.summary).toEqual({
      totalChapters: 0,
      completedChapterCount: 0,
      activeChapterId: null,
      blockedChapterCount: 0,
      lockedChapterCount: 0,
      availableChapterCount: 0,
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(JSON.stringify(body)).not.toContain("facilitator");
    expect(JSON.stringify(body)).not.toContain("consequenceDefinitions");
    expect(JSON.stringify(body)).not.toContain('"xp"');
    expect(JSON.stringify(body)).not.toContain('"mastery"');
  });

  it("rejects unauthenticated Learner Progression reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/learner-progression`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Achievements for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/achievements`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_achievements",
        },
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.projectionType).toBe("achievements");
    expect(body.data.awards).toEqual([]);
    expect(body.data.xpSummary).toEqual({
      availability: "unavailable",
      reason: "xp_amounts_not_authored",
      totalXp: 0,
    });
  });

  it("returns current empty Mastery for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/mastery`, {
      headers: {
        Authorization: authHeader(),
        "X-Correlation-ID": "corr_mastery",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.projectionType).toBe("mastery");
    expect(body.data.competencies).toEqual([]);
    expect(body.data.xpSummary.availability).toBe("unavailable");
  });

  it("returns current empty Coaching for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(`/api/v1/simulation-runs/${runId}/coaching`, {
      headers: {
        Authorization: authHeader(),
        "X-Correlation-ID": "corr_coaching",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.projectionType).toBe("coaching");
    expect(body.data.interventions).toEqual([]);
  });

  it("returns current empty Notifications for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/notifications`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_notifications",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("notifications");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.notifications).toEqual([]);
    expect(body.data.summary).toEqual({
      totalNotifications: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      markRead: "unsupported",
      dismiss: "unsupported",
      preferences: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("originatingCommandId");
  });

  it("rejects unauthenticated Notifications reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/notifications`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Activities for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/activities`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_activities",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("activities");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.activities).toEqual([]);
    expect(body.data.summary).toEqual({
      totalActivities: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      complete: "unsupported",
      reopen: "unsupported",
      assign: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
  });

  it("rejects unauthenticated Activities reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/activities`,
    );
    expect(res.status).toBe(401);
  });

  it("returns current empty Completed History for an authenticated learner", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/completed-history`,
      {
        headers: {
          Authorization: authHeader(),
          "X-Correlation-ID": "corr_completed_history",
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await res.json();
    expect(body.meta.freshness).toBe("current");
    expect(body.meta.projectionSchemaVersion).toBe(1);
    expect(body.data.projectionType).toBe("completed_history");
    expect(body.data.projectionSchemaVersion).toBe(1);
    expect(body.data.items).toEqual([]);
    expect(body.data.summary).toEqual({
      totalCompleted: 0,
      isEmpty: true,
    });
    expect(body.data.capabilities).toEqual({
      reopen: "unsupported",
      clear: "unsupported",
      export: "unsupported",
    });
    expect(body.data.semanticHash).toBeUndefined();
    expect(body.data.sourceEventId).toBeUndefined();
  });

  it("rejects unauthenticated Completed History reads", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/completed-history`,
    );
    expect(res.status).toBe(401);
  });

  it("returns rebuild_failed freshness when rebuild fails with retained cache", async () => {
    const { app, services } = await seedActiveRun();
    const first = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: authHeader() } },
    );
    expect(first.status).toBe(200);

    const repo = services.module.projectionRepository as {
      readonly rows: Map<string, { sourceAggregateVersion: number } & object>;
    };
    const mapKey = `${services.tenantId}:${runId}:simulation`;
    const cached = repo.rows.get(mapKey);
    expect(cached).toBeTruthy();
    if (!cached) {
      return;
    }
    repo.rows.set(mapKey, {
      ...cached,
      sourceAggregateVersion: Math.max(0, cached.sourceAggregateVersion - 1),
    });

    services.module.rebuildProjectionService.rebuild = async () =>
      err({
        kind: "rule_violation",
        code: "PROJECTION_CONTENT_UNAVAILABLE",
        retryable: true,
        message: "forced rebuild failure",
      });

    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: authHeader() } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.freshness).toBe("rebuild_failed");
  });

  it("submits a decision and returns an accepted receipt", async () => {
    const { app } = await seedActiveRun();
    const projectionRes = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: authHeader() } },
    );
    const projection = await projectionRes.json();
    const version = projection.meta.sourceAggregateVersion as number;
    const commandId = "cmd_submit_1";
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(version, commandId),
        body: JSON.stringify({
          commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: "decision_1",
            optionId: "option_b",
            rationale: "Stakeholder alignment",
          },
        }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("accepted");
    expect(body.data.aggregateVersion).toBeGreaterThan(version);
    expect(body.data.commandId).toBe(commandId);
    expect(body.meta.correlationId).toBe("corr_submit");

    const refreshed = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: { Authorization: authHeader() } },
    );
    const refreshedBody = await refreshed.json();
    expect(refreshedBody.data.availableDecisions).toEqual([]);
    expect(refreshedBody.data.decisionHistory).toHaveLength(1);
    expect(refreshedBody.data.decisionHistory[0]?.status).toBe("resolved");
    expect(refreshedBody.meta.sourceAggregateVersion).toBe(
      body.data.aggregateVersion,
    );
  });

  it("requires Idempotency-Key and rejects key/payload reuse conflicts", async () => {
    const { app } = await seedActiveRun();
    const projection = await (
      await app.request(`/api/v1/simulation-runs/${runId}/projection`, {
        headers: { Authorization: authHeader() },
      })
    ).json();
    const version = projection.meta.sourceAggregateVersion as number;
    const headers = {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "If-Match": `"${version}"`,
    };
    const missing = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          commandId: "cmd_x",
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(missing.status).toBe(400);

    const commandId = "cmd_conflict";
    const first = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": commandId },
        body: JSON.stringify({
          commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(first.status).toBe(200);

    const changed = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": commandId },
        body: JSON.stringify({
          commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { decisionId: "decision_1", optionId: "option_b" },
        }),
      },
    );
    expect(changed.status).toBe(409);
    expect((await changed.json()).error.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });

  it("returns the same accepted receipt for same-key idempotent retry", async () => {
    const { app } = await seedActiveRun();
    const projection = await (
      await app.request(`/api/v1/simulation-runs/${runId}/projection`, {
        headers: { Authorization: authHeader() },
      })
    ).json();
    const version = projection.meta.sourceAggregateVersion as number;
    const commandId = "cmd_idempotent";
    const body = {
      commandId,
      commandType: "SubmitDecision",
      commandVersion: 1,
      expectedAggregateVersion: version,
      payload: { decisionId: "decision_1", optionId: "option_a" },
    };
    const first = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(version, commandId),
        body: JSON.stringify(body),
      },
    );
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    const second = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(version, commandId),
        body: JSON.stringify(body),
      },
    );
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.data.commandId).toBe(firstBody.data.commandId);
    expect(secondBody.data.aggregateVersion).toBe(
      firstBody.data.aggregateVersion,
    );
  });

  it("returns 412 on aggregate version conflict", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          "Idempotency-Key": "cmd_stale",
          "If-Match": '"999"',
        },
        body: JSON.stringify({
          commandId: "cmd_stale",
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: 999,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(res.status).toBe(412);
    const body = await res.json();
    expect(body.error.code).toBe("AGGREGATE_VERSION_CONFLICT");
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(body)).not.toContain("SQL");
  });

  it("rejects If-Match / body version mismatch before processing", async () => {
    const { app } = await seedActiveRun();
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          "Idempotency-Key": "cmd_mismatch",
          "If-Match": '"2"',
        },
        body: JSON.stringify({
          commandId: "cmd_mismatch",
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: 3,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error.fieldErrors["header.If-Match"]).toContain(
      "mismatch",
    );
  });

  it("rejects wrong command type/version and path/body run mismatch", async () => {
    const { app } = await seedActiveRun();
    const badType = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(1, "cmd_bad_type"),
        body: JSON.stringify({
          commandId: "cmd_bad_type",
          commandType: "CompleteActivity",
          commandVersion: 1,
          expectedAggregateVersion: 1,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(badType.status).toBe(400);

    const badVersion = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(1, "cmd_bad_ver"),
        body: JSON.stringify({
          commandId: "cmd_bad_ver",
          commandType: "SubmitDecision",
          commandVersion: 2,
          expectedAggregateVersion: 1,
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(badVersion.status).toBe(400);

    const mismatch = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(1, "cmd_path"),
        body: JSON.stringify({
          commandId: "cmd_path",
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: 1,
          simulationRunId: "other_run",
          payload: { decisionId: "decision_1", optionId: "option_a" },
        }),
      },
    );
    expect(mismatch.status).toBe(400);
  });

  it("returns business-rule rejection for an invalid option", async () => {
    const { app } = await seedActiveRun();
    const projection = await (
      await app.request(`/api/v1/simulation-runs/${runId}/projection`, {
        headers: { Authorization: authHeader() },
      })
    ).json();
    const version = projection.meta.sourceAggregateVersion as number;
    const res = await app.request(
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        method: "POST",
        headers: submitHeaders(version, "cmd_bad_option"),
        body: JSON.stringify({
          commandId: "cmd_bad_option",
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { decisionId: "decision_1", optionId: "option_missing" },
        }),
      },
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.requestId).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain("pg_");
  });

  it("seeds a demo run through the authenticated dev route", async () => {
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableDevRoutes: true,
      allowDevAuth: true,
    });
    const res = await app.request("/api/v1/dev/seed-simulation-run", {
      method: "POST",
      headers: {
        Authorization: authHeader({ actorId, tenantId: "tenant_local" }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ simulationRunId: "run_demo" }),
    });
    expect(res.status).toBe(200);
    const projection = await app.request(
      `/api/v1/simulation-runs/run_demo/projection`,
      {
        headers: {
          Authorization: authHeader({ actorId, tenantId: "tenant_local" }),
        },
      },
    );
    expect(projection.status).toBe(200);
    expect((await projection.json()).meta.freshness).toBe("current");
  });

  it("does not expose the seed route unless explicitly enabled", async () => {
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableDevRoutes: false,
      allowDevAuth: true,
    });
    const res = await app.request("/api/v1/dev/seed-simulation-run", {
      method: "POST",
      headers: {
        Authorization: authHeader({ actorId, tenantId: "tenant_local" }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ simulationRunId: "run_demo" }),
    });
    expect(res.status).toBe(404);
  });
});
