/**
 * Additional BC-004 Issue #76 acceptance-criteria coverage.
 */

import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asLearnerId,
  asSimulationRunId,
  createNorthstarConnectedCarePackage,
  mapBusinessCasePackageToProjectionSafeContent,
  mapBusinessCasePackageToRuntimeDecisions,
} from "@projectsim/domain";
import { initializeChapterFromContent } from "@projectsim/application";
import { createContentApiModule } from "./content-module";
import { createApiApp } from "../create-app";
import { createInMemorySimulationModuleRegistry } from "../module-registry";

const authHeader = (tenantId: string, actorId: string): string =>
  `Bearer dev.${Buffer.from(JSON.stringify({ tenantId, actorId })).toString(
    "base64url",
  )}`;

const createHarness = (tenantId: string, actorId: string) => {
  const contentModule = createContentApiModule();
  const registry = createInMemorySimulationModuleRegistry({
    businessCaseRegistry: contentModule.registry,
    authorizedActorsByTenant: {
      [tenantId]: [actorId],
    },
  });
  const app = createApiApp({
    registry,
    contentModule,
    allowDevAuth: true,
  });
  return { app, contentModule, registry };
};

const authFor = (tenantId: string, actorId: string) => ({
  Authorization: authHeader(tenantId, actorId),
});

const postCommand = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
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

const createNorthstarRun = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
  simulationRunId: string,
  experienceLevel: "explorer" | "practitioner" | "leader",
) => {
  const created = await app.request("/api/v1/simulation-runs", {
    method: "POST",
    headers: {
      ...auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessCaseId: "northstar-connected-care",
      experienceLevel,
      simulationRunId,
    }),
  });
  expect(created.status).toBe(201);
  return (await created.json()) as {
    data: {
      simulationRunId: string;
      experienceLevel: string;
      contentPackageVersionId: string;
      initialized: {
        messages: number;
        documents: number;
        stakeholders: number;
        activities: number;
        meetings: number;
      };
    };
  };
};

describe("BC-004 Issue #76 acceptance criteria", () => {
  it("requires experienceLevel and rejects missing selection", async () => {
    const { app } = createHarness("tenant_ac_level", "learner_ac_level");
    const auth = authFor("tenant_ac_level", "learner_ac_level");
    const response = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        simulationRunId: "run_ac_missing_level",
      }),
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { fieldErrors?: Record<string, string[]> };
    };
    expect(body.error.fieldErrors?.experienceLevel).toBeDefined();
  });

  it("differs Explorer/Practitioner/Leader guidance without changing option consequences", async () => {
    const pkg = createNorthstarConnectedCarePackage();
    const cpv = asContentPackageVersionId("cpv:northstar-connected-care:1.0.0");
    const explorer = mapBusinessCasePackageToProjectionSafeContent(
      pkg,
      cpv,
      "explorer",
    );
    const practitioner = mapBusinessCasePackageToProjectionSafeContent(
      pkg,
      cpv,
      "practitioner",
    );
    const leader = mapBusinessCasePackageToProjectionSafeContent(
      pkg,
      cpv,
      "leader",
    );
    const decisionId = "decision.define-objective";
    const explorerPrompt = explorer.decisions.find(
      (d) => d.id === decisionId,
    )?.prompt;
    const practitionerPrompt = practitioner.decisions.find(
      (d) => d.id === decisionId,
    )?.prompt;
    const leaderPrompt = leader.decisions.find(
      (d) => d.id === decisionId,
    )?.prompt;
    expect(explorerPrompt).toBeTruthy();
    expect(practitionerPrompt).toBeTruthy();
    expect(leaderPrompt).toBeTruthy();
    expect(explorerPrompt).not.toEqual(practitionerPrompt);
    expect(practitionerPrompt).not.toEqual(leaderPrompt);
    expect(explorerPrompt!.toLowerCase()).toMatch(/hint|trade-off|evidence/);
    expect(leaderPrompt!.toLowerCase()).toMatch(/ambiguity|north-star|crisis/);

    const runtime = mapBusinessCasePackageToRuntimeDecisions(pkg, cpv);
    const objective = runtime.find((d) => d.id === decisionId);
    expect(objective?.options.map((o) => o.id).sort()).toEqual([
      "option.objective-operational-efficiency",
      "option.objective-patient-access",
      "option.objective-privacy-quality",
      "option.objective-tech-speed",
    ]);
    // Core option outcomes are identical regardless of experience-level projection text.
    for (const levelContent of [explorer, practitioner, leader]) {
      const safe = levelContent.decisions.find((d) => d.id === decisionId);
      expect(safe?.options.map((o) => o.id).sort()).toEqual(
        objective?.options.map((o) => o.id).sort(),
      );
    }
  });

  it("maps required evidence documents onto runtime decision eligibility", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const runtime = mapBusinessCasePackageToRuntimeDecisions(
      pkg,
      asContentPackageVersionId("cpv:northstar-connected-care:1.0.0"),
    );
    const objective = runtime.find((d) => d.id === "decision.define-objective");
    expect(objective?.requiredEvidenceDocumentIds).toEqual(
      expect.arrayContaining([
        "document.authorization-summary",
        "document.business-case-initial",
      ]),
    );
    const delivery = runtime.find(
      (d) => d.id === "decision.select-delivery-approach",
    );
    expect(delivery?.requiredEvidenceDocumentIds).toEqual(
      expect.arrayContaining([
        "document.access-performance-dashboard",
        "document.scope-assumptions",
      ]),
    );
  });

  it("schedules delayed consequences as schedule_event instructions", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const runtime = mapBusinessCasePackageToRuntimeDecisions(
      pkg,
      asContentPackageVersionId("cpv:northstar-connected-care:1.0.0"),
    );
    const objective = runtime.find((d) => d.id === "decision.define-objective");
    const accessOption = objective?.options.find(
      (o) => o.id === "option.objective-patient-access",
    );
    const delayed = accessOption?.outcome.consequenceDefinitions.filter(
      (c) => c.timing === "delayed" || c.type === "schedule_event",
    );
    expect((delayed ?? []).length).toBeGreaterThan(0);
  });

  it("does not count informational inbox messages as pending decisions", async () => {
    const { app } = createHarness("tenant_ac_info", "learner_ac_info");
    const auth = authFor("tenant_ac_info", "learner_ac_info");
    const created = await createNorthstarRun(
      app,
      auth,
      "run_ac_informational",
      "practitioner",
    );
    const inbox = await app.request(
      `/api/v1/simulation-runs/${created.data.simulationRunId}/inbox`,
      { headers: auth },
    );
    const inboxBody = (await inbox.json()) as {
      data: { messages: ReadonlyArray<{ definitionId: string }> };
    };
    expect(
      inboxBody.data.messages.some(
        (m) => m.definitionId === "message.info-kickoff-reminder",
      ),
    ).toBe(true);
    const mc = await app.request(
      `/api/v1/simulation-runs/${created.data.simulationRunId}/mission-control`,
      { headers: auth },
    );
    const mcBody = (await mc.json()) as {
      data: { counts: { pendingDecisions: { count: number } } };
    };
    expect(mcBody.data.counts.pendingDecisions.count).toBeLessThanOrEqual(3);
    expect(mcBody.data.counts.pendingDecisions.count).toBeGreaterThanOrEqual(1);
    expect(mcBody.data.counts.pendingDecisions.count).not.toBe(
      inboxBody.data.messages.length,
    );
  });

  it("re-initializes Chapter One without duplicating workplace content", async () => {
    const { contentModule, registry } = createHarness(
      "tenant_ac_init",
      "learner_ac_init",
    );
    const services = registry.get("tenant_ac_init");
    const created = await contentModule.createRunFromCase(registry, {
      tenantId: "tenant_ac_init",
      actorId: "learner_ac_init",
      learnerId: asLearnerId("learner_ac_init"),
      businessCaseId: asBusinessCaseId("northstar-connected-care"),
      experienceLevel: "explorer",
      correlationId: "corr_ac_init",
      causationId: null,
      simulationRunId: "run_ac_init_idempotent",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const version = await contentModule.registry.getPublishedVersion(
      created.value.contentPackageVersionId,
    );
    expect(version).toBeTruthy();
    const first = await services.lifecycleService.load(
      asActorId("learner_ac_init"),
      asSimulationRunId(created.value.simulationRunId),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const countsBefore = {
      messages: first.value.state.learnerMessages.length,
      documents: first.value.state.documents.length,
      stakeholders: first.value.state.stakeholders.length,
      activities: first.value.state.activities.length,
      meetings: first.value.state.meetings.length,
    };

    const retry = await initializeChapterFromContent(
      {
        lifecycle: services.lifecycleService,
        commands: services.applicationService,
      },
      {
        actorId: "learner_ac_init",
        simulationRunId: created.value.simulationRunId,
        correlationId: "corr_ac_init_retry",
        package: version!.package,
        experienceLevel: "explorer",
      },
    );
    expect(retry.ok).toBe(true);

    const second = await services.lifecycleService.load(
      asActorId("learner_ac_init"),
      asSimulationRunId(created.value.simulationRunId),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.state.learnerMessages.length).toBe(
      countsBefore.messages,
    );
    expect(second.value.state.documents.length).toBe(countsBefore.documents);
    expect(second.value.state.stakeholders.length).toBe(
      countsBefore.stakeholders,
    );
    expect(second.value.state.activities.length).toBe(countsBefore.activities);
    expect(second.value.state.meetings.length).toBe(countsBefore.meetings);
  });

  it("blocks chapter completion when the required meeting is incomplete", async () => {
    const { app } = createHarness("tenant_ac_meet", "learner_ac_meet");
    const auth = authFor("tenant_ac_meet", "learner_ac_meet");
    const created = await createNorthstarRun(
      app,
      auth,
      "run_ac_missing_meeting",
      "practitioner",
    );
    const runId = created.data.simulationRunId;
    let version = (
      (await (
        await app.request(`/api/v1/simulation-runs/${runId}/projection`, {
          headers: auth,
        })
      ).json()) as { data: { sourceAggregateVersion: number } }
    ).data.sourceAggregateVersion;

    const decisions = [
      {
        decisionId: "decision.define-objective",
        optionId: "option.objective-patient-access",
        commandId: "cmd_ac_meet_d1",
      },
      {
        decisionId: "decision.select-delivery-approach",
        optionId: "option.delivery-hybrid",
        commandId: "cmd_ac_meet_d2",
      },
      {
        decisionId: "decision.establish-governance",
        optionId: "option.governance-cross-functional",
        commandId: "cmd_ac_meet_d3",
      },
    ];
    for (const decision of decisions) {
      const response = await postCommand(
        app,
        auth,
        `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
        {
          commandId: decision.commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: decision.decisionId,
            optionId: decision.optionId,
          },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }

    for (const [index, activityId] of [
      "activity.review-authorization",
      "activity.analyze-access-evidence",
      "activity.attend-kickoff",
      "activity.review-stakeholder-concerns",
      "activity.submit-chapter-one-decisions",
      "activity.chapter-one-reflection",
    ].entries()) {
      const response = await postCommand(
        app,
        auth,
        `/api/v1/simulation-runs/${runId}/commands/complete-activity`,
        {
          commandId: `cmd_ac_meet_a_${index}`,
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

    const completeChapter = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_ac_meet_complete",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(completeChapter.status).toBe(422);
    const body = (await completeChapter.json()) as { error: { code: string } };
    expect(body.error.code).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });

  it("blocks chapter completion when a required activity is incomplete", async () => {
    const { app } = createHarness("tenant_ac_act", "learner_ac_act");
    const auth = authFor("tenant_ac_act", "learner_ac_act");
    const created = await createNorthstarRun(
      app,
      auth,
      "run_ac_missing_activity",
      "leader",
    );
    const runId = created.data.simulationRunId;
    let version = (
      (await (
        await app.request(`/api/v1/simulation-runs/${runId}/projection`, {
          headers: auth,
        })
      ).json()) as { data: { sourceAggregateVersion: number } }
    ).data.sourceAggregateVersion;

    const startMeeting = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/start-meeting`,
      {
        commandId: "cmd_ac_act_start_meeting",
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
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-meeting`,
      {
        commandId: "cmd_ac_act_complete_meeting",
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

    for (const decision of [
      {
        decisionId: "decision.define-objective",
        optionId: "option.objective-patient-access",
        commandId: "cmd_ac_act_d1",
      },
      {
        decisionId: "decision.select-delivery-approach",
        optionId: "option.delivery-hybrid",
        commandId: "cmd_ac_act_d2",
      },
      {
        decisionId: "decision.establish-governance",
        optionId: "option.governance-cross-functional",
        commandId: "cmd_ac_act_d3",
      },
    ]) {
      const response = await postCommand(
        app,
        auth,
        `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
        {
          commandId: decision.commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: decision.decisionId,
            optionId: decision.optionId,
          },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }

    // Leave reflection incomplete.
    for (const [index, activityId] of [
      "activity.review-authorization",
      "activity.analyze-access-evidence",
      "activity.attend-kickoff",
      "activity.review-stakeholder-concerns",
      "activity.submit-chapter-one-decisions",
    ].entries()) {
      const response = await postCommand(
        app,
        auth,
        `/api/v1/simulation-runs/${runId}/commands/complete-activity`,
        {
          commandId: `cmd_ac_act_a_${index}`,
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

    const completeChapter = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_ac_act_complete",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(completeChapter.status).toBe(422);
    const body = (await completeChapter.json()) as { error: { code: string } };
    expect(body.error.code).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });

  it("keeps two Northstar runs isolated from each other", async () => {
    const { app } = createHarness("tenant_ac_runs", "learner_ac_runs");
    const auth = authFor("tenant_ac_runs", "learner_ac_runs");
    const runA = await createNorthstarRun(
      app,
      auth,
      "run_ac_northstar_a",
      "explorer",
    );
    const runB = await createNorthstarRun(
      app,
      auth,
      "run_ac_northstar_b",
      "leader",
    );

    const versionA = (
      (await (
        await app.request(
          `/api/v1/simulation-runs/${runA.data.simulationRunId}/projection`,
          { headers: auth },
        )
      ).json()) as { data: { sourceAggregateVersion: number } }
    ).data.sourceAggregateVersion;

    const submitted = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runA.data.simulationRunId}/commands/submit-decision`,
      {
        commandId: "cmd_ac_iso_d1",
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: versionA,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-patient-access",
        },
      },
      versionA,
    );
    expect(submitted.status).toBe(200);

    const logA = await app.request(
      `/api/v1/simulation-runs/${runA.data.simulationRunId}/decision-log`,
      { headers: auth },
    );
    const logB = await app.request(
      `/api/v1/simulation-runs/${runB.data.simulationRunId}/decision-log`,
      { headers: auth },
    );
    const bodyA = (await logA.json()) as {
      data: { summary: { totalEntries: number } };
    };
    const bodyB = (await logB.json()) as {
      data: { summary: { totalEntries: number } };
    };
    expect(bodyA.data.summary.totalEntries).toBe(1);
    expect(bodyB.data.summary.totalEntries).toBe(0);
    expect(runA.data.experienceLevel).toBe("explorer");
    expect(runB.data.experienceLevel).toBe("leader");
  });
});
