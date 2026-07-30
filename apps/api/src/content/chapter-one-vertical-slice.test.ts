/**
 * BC-004 end-to-end API path:
 * catalog → details → level → run create/init → workplace actions →
 * three decisions → chapter complete → ending projection.
 */

import { describe, expect, it } from "vitest";
import { createContentApiModule } from "./content-module";
import { createApiApp } from "../create-app";
import { createInMemorySimulationModuleRegistry } from "../module-registry";

const authHeader = (tenantId: string, actorId: string): string =>
  `Bearer dev.${Buffer.from(JSON.stringify({ tenantId, actorId })).toString(
    "base64url",
  )}`;

const createApp = () => {
  const contentModule = createContentApiModule();
  const registry = createInMemorySimulationModuleRegistry({
    businessCaseRegistry: contentModule.registry,
    authorizedActorsByTenant: {
      tenant_slice: ["learner_slice"],
    },
  });
  return createApiApp({
    registry,
    contentModule,
    allowDevAuth: true,
  });
};

const auth = {
  Authorization: authHeader("tenant_slice", "learner_slice"),
};

const postCommand = async (
  app: ReturnType<typeof createApp>,
  path: string,
  body: Record<string, unknown>,
  aggregateVersion: number,
) => {
  const commandId = String(body.commandId);
  return app.request(path, {
    method: "POST",
    headers: {
      ...auth,
      "Content-Type": "application/json",
      "Idempotency-Key": commandId,
      "If-Match": `"${aggregateVersion}"`,
    },
    body: JSON.stringify(body),
  });
};

describe("BC-004 Chapter One vertical slice", () => {
  it("completes catalog → init → meeting → decisions → activities → chapter end", async () => {
    const app = createApp();

    const catalog = await app.request("/api/v1/business-cases", {
      headers: auth,
    });
    expect(catalog.status).toBe(200);
    const catalogBody = (await catalog.json()) as {
      data: ReadonlyArray<{ businessCaseId: string }>;
    };
    expect(
      catalogBody.data.some(
        (c) => c.businessCaseId === "northstar-connected-care",
      ),
    ).toBe(true);

    const details = await app.request(
      "/api/v1/business-cases/northstar-connected-care",
      { headers: auth },
    );
    expect(details.status).toBe(200);
    const detailsBody = (await details.json()) as {
      data: {
        title: string;
        supportedExperienceLevels: readonly string[];
        pmbokAlignment: readonly string[];
      };
    };
    expect(detailsBody.data.title).toMatch(/Northstar/i);
    expect(detailsBody.data.supportedExperienceLevels).toContain("explorer");
    expect(detailsBody.data.pmbokAlignment.length).toBeGreaterThan(0);
    expect(JSON.stringify(detailsBody.data)).not.toContain("rubric");

    const created = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "explorer",
        simulationRunId: "run_bc004_vertical_slice",
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      data: {
        simulationRunId: string;
        contentPackageVersionId: string;
        contentVersion: string;
        experienceLevel: string;
        chapterId: string;
        status: string;
        initialized: {
          stakeholders: number;
          messages: number;
          documents: number;
          meetings: number;
          activities: number;
        };
      };
    };
    const runId = createdBody.data.simulationRunId;
    expect(createdBody.data.contentVersion).toBe("1.0.0");
    expect(createdBody.data.contentPackageVersionId).toBe(
      "cpv:northstar-connected-care:1.0.0",
    );
    expect(createdBody.data.experienceLevel).toBe("explorer");
    expect(createdBody.data.chapterId).toBe("chapter-01");
    expect(createdBody.data.status).toBe("active");

    const projection = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: auth },
    );
    expect(projection.status).toBe(200);
    const projectionBody = (await projection.json()) as {
      data: {
        sourceAggregateVersion: number;
        availableDecisions: ReadonlyArray<{
          decisionDefinitionId: string;
          prompt: string;
        }>;
        decisionHistory: ReadonlyArray<{ decisionDefinitionId: string }>;
      };
    };
    let version = projectionBody.data.sourceAggregateVersion;
    expect(
      projectionBody.data.availableDecisions.map((d) => d.decisionDefinitionId),
    ).toContain("decision.define-objective");
    // Explorer guidance is richer than a bare label.
    const objective = projectionBody.data.availableDecisions.find(
      (d) => d.decisionDefinitionId === "decision.define-objective",
    );
    expect(objective?.prompt.toLowerCase()).toMatch(/evidence|trade-off|hint/);

    const inbox = await app.request(`/api/v1/simulation-runs/${runId}/inbox`, {
      headers: auth,
    });
    const inboxBody = (await inbox.json()) as {
      data: { messages: ReadonlyArray<{ definitionId: string }> };
    };
    expect(inboxBody.data.messages.length).toBeGreaterThanOrEqual(5);
    expect(
      inboxBody.data.messages.some((m) =>
        m.definitionId.includes("informational"),
      ) || inboxBody.data.messages.length >= 5,
    ).toBe(true);

    const missionControl = await app.request(
      `/api/v1/simulation-runs/${runId}/mission-control`,
      { headers: auth },
    );
    const mcBody = (await missionControl.json()) as {
      data: {
        counts: { pendingDecisions: { count: number } };
        runSummary: { currentChapterId: string | null };
      };
    };
    expect(mcBody.data.counts.pendingDecisions.count).toBeGreaterThanOrEqual(1);
    expect(mcBody.data.runSummary.currentChapterId).toBe("chapter-01");
    // Informational inbox items must not inflate pending decisions beyond authored decisions.
    expect(mcBody.data.counts.pendingDecisions.count).toBeLessThanOrEqual(3);

    // Complete meeting path
    const startMeeting = await postCommand(
      app,
      `/api/v1/simulation-runs/${runId}/commands/start-meeting`,
      {
        commandId: "cmd_slice_start_meeting",
        commandType: "StartMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: "meeting.program-kickoff" },
      },
      version,
    );
    expect(startMeeting.status).toBe(200);
    version = (
      (await startMeeting.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;

    const completeMeeting = await postCommand(
      app,
      `/api/v1/simulation-runs/${runId}/commands/complete-meeting`,
      {
        commandId: "cmd_slice_complete_meeting",
        commandType: "CompleteMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: "meeting.program-kickoff" },
      },
      version,
    );
    expect(completeMeeting.status).toBe(200);
    version = (
      (await completeMeeting.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;

    const meetings = await app.request(
      `/api/v1/simulation-runs/${runId}/meetings`,
      { headers: auth },
    );
    const meetingsBody = (await meetings.json()) as {
      data: {
        meetings: ReadonlyArray<{ status: string }>;
        summary: { completedCount: number };
      };
    };
    expect(meetingsBody.data.summary.completedCount).toBe(1);
    expect(
      meetingsBody.data.meetings.some((m) => m.status === "completed"),
    ).toBe(true);

    const decisions: ReadonlyArray<{
      decisionId: string;
      optionId: string;
      commandId: string;
    }> = [
      {
        decisionId: "decision.define-objective",
        optionId: "option.objective-patient-access",
        commandId: "cmd_slice_decision_1",
      },
      {
        decisionId: "decision.select-delivery-approach",
        optionId: "option.delivery-hybrid",
        commandId: "cmd_slice_decision_2",
      },
      {
        decisionId: "decision.establish-governance",
        optionId: "option.governance-cross-functional",
        commandId: "cmd_slice_decision_3",
      },
    ];

    for (const decision of decisions) {
      const response = await postCommand(
        app,
        `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
        {
          commandId: decision.commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: decision.decisionId,
            optionId: decision.optionId,
            rationale: "Evidence-based Chapter One selection for BC-004 slice.",
          },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }

    // Idempotent decision resubmit
    const duplicateDecision = await postCommand(
      app,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId: "cmd_slice_decision_1",
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-patient-access",
          rationale: "Evidence-based Chapter One selection for BC-004 slice.",
        },
      },
      version,
    );
    expect([200, 409]).toContain(duplicateDecision.status);

    const decisionLog = await app.request(
      `/api/v1/simulation-runs/${runId}/decision-log`,
      { headers: auth },
    );
    const logBody = (await decisionLog.json()) as {
      data: {
        entries: ReadonlyArray<{ decisionDefinitionId: string }>;
        summary: { totalEntries: number };
      };
    };
    expect(logBody.data.summary.totalEntries).toBe(3);
    expect(
      new Set(logBody.data.entries.map((e) => e.decisionDefinitionId)).size,
    ).toBe(3);

    const afterDecisionsProjection = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: auth },
    );
    const afterDecisionsBody = (await afterDecisionsProjection.json()) as {
      data: {
        sourceAggregateVersion: number;
        availableDecisions: ReadonlyArray<{ decisionDefinitionId: string }>;
        decisionHistory: ReadonlyArray<{ decisionDefinitionId: string }>;
      };
    };
    version = afterDecisionsBody.data.sourceAggregateVersion;
    expect(afterDecisionsBody.data.availableDecisions.length).toBe(0);
    expect(afterDecisionsBody.data.decisionHistory.length).toBe(3);

    const activityIds = [
      "activity.review-authorization",
      "activity.analyze-access-evidence",
      "activity.attend-kickoff",
      "activity.review-stakeholder-concerns",
      "activity.submit-chapter-one-decisions",
      "activity.chapter-one-reflection",
    ];
    for (const [index, activityId] of activityIds.entries()) {
      const response = await postCommand(
        app,
        `/api/v1/simulation-runs/${runId}/commands/complete-activity`,
        {
          commandId: `cmd_slice_activity_${index}`,
          commandType: "CompleteActivity",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { activityId },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }

    const completedHistory = await app.request(
      `/api/v1/simulation-runs/${runId}/completed-history`,
      { headers: auth },
    );
    const historyBody = (await completedHistory.json()) as {
      data: { summary: { totalCompleted: number } };
    };
    expect(historyBody.data.summary.totalCompleted).toBeGreaterThanOrEqual(6);

    // Early completion should fail before activities were done — already done;
    // verify completion now succeeds and emits ending notification.
    const completeChapter = await postCommand(
      app,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_slice_complete_chapter",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(completeChapter.status).toBe(200);
    const completeBody = (await completeChapter.json()) as {
      data: {
        chapterId: string;
        nextChapterId: string | null;
        endingNotificationId: string | null;
        aggregateVersion: number;
        nextChapterInitialized?: boolean;
      };
    };
    expect(completeBody.data.chapterId).toBe("chapter-01");
    expect(completeBody.data.nextChapterId).toBe("chapter-02");
    expect(completeBody.data.endingNotificationId).toBe(
      "notification.chapter-01-complete",
    );

    const notifications = await app.request(
      `/api/v1/simulation-runs/${runId}/notifications`,
      { headers: auth },
    );
    const notificationsBody = (await notifications.json()) as {
      data: {
        notifications: ReadonlyArray<{ notificationId: string; title: string }>;
      };
    };
    expect(
      notificationsBody.data.notifications.some(
        (n) => n.notificationId === "notification.chapter-01-complete",
      ),
    ).toBe(true);

    const finalMc = await app.request(
      `/api/v1/simulation-runs/${runId}/mission-control`,
      { headers: auth },
    );
    const finalMcBody = (await finalMc.json()) as {
      data: {
        counts: { pendingDecisions: { count: number } };
        runSummary: { currentChapterId: string | null };
      };
    };
    // Chapter Two workplace content is initialized after CompleteChapter (W7).
    // At least the first Chapter Two decision becomes pending/eligible.
    expect(finalMcBody.data.counts.pendingDecisions.count).toBeGreaterThan(0);
    expect(finalMcBody.data.runSummary.currentChapterId).toBe("chapter-02");
    expect(completeBody.data.nextChapterInitialized).toBe(true);

    // Cross-case isolation: Harbor run must not contain Northstar stakeholders.
    const harbor = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "harbor-logistics-recovery",
        experienceLevel: "practitioner",
        simulationRunId: "run_bc004_harbor_isolation",
      }),
    });
    expect(harbor.status).toBe(201);
    const harborBody = (await harbor.json()) as {
      data: { simulationRunId: string };
    };
    const harborStakeholders = await app.request(
      `/api/v1/simulation-runs/${harborBody.data.simulationRunId}/stakeholders`,
      { headers: auth },
    );
    const harborStakeholderBody = (await harborStakeholders.json()) as {
      data: { stakeholders: ReadonlyArray<{ stakeholderId: string }> };
    };
    expect(JSON.stringify(harborStakeholderBody.data)).not.toMatch(
      /northstar|connected-care|patient-experience/i,
    );

    const northstarStakeholders = await app.request(
      `/api/v1/simulation-runs/${runId}/stakeholders`,
      { headers: auth },
    );
    const northstarStakeholderBody = (await northstarStakeholders.json()) as {
      data: { stakeholders: ReadonlyArray<{ stakeholderId: string }> };
    };
    expect(JSON.stringify(northstarStakeholderBody.data)).not.toMatch(
      /harbor/i,
    );
    expect(
      northstarStakeholderBody.data.stakeholders.some(
        (s) => s.stakeholderId === "stakeholder.sponsor",
      ),
    ).toBe(true);
  });

  it("blocks chapter completion when a required decision is missing", async () => {
    const app = createApp();
    const created = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "practitioner",
        simulationRunId: "run_bc004_block_early",
      }),
    });
    expect(created.status).toBe(201);
    const runId = (
      (await created.json()) as { data: { simulationRunId: string } }
    ).data.simulationRunId;

    const projection = await app.request(
      `/api/v1/simulation-runs/${runId}/projection`,
      { headers: auth },
    );
    const version = (
      (await projection.json()) as {
        data: { sourceAggregateVersion: number };
      }
    ).data.sourceAggregateVersion;

    const completeChapter = await postCommand(
      app,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_slice_block_early",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(completeChapter.status).toBe(422);
    const body = (await completeChapter.json()) as {
      error: { code: string };
    };
    expect(body.error.code).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });
});
