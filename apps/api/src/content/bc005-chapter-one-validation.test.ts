/**
 * BC-005 Issue #78 — Chapter One reliability / isolation / hidden-content checks
 * (memory composition). Complements bc004-acceptance-criteria + vertical-slice.
 */

import { describe, expect, it } from "vitest";
import {
  createNorthstarConnectedCarePackage,
  mapBusinessCasePackageToProjectionSafeContent,
  asContentPackageVersionId,
} from "@projectsim/domain";
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
      chapterId: string;
    };
  };
};

const loadVersion = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
  runId: string,
): Promise<number> => {
  const projection = await app.request(
    `/api/v1/simulation-runs/${runId}/projection`,
    { headers: auth },
  );
  expect(projection.status).toBe(200);
  return (
    (await projection.json()) as { data: { sourceAggregateVersion: number } }
  ).data.sourceAggregateVersion;
};

const DECISIONS = [
  {
    decisionId: "decision.define-objective",
    optionId: "option.objective-patient-access",
  },
  {
    decisionId: "decision.select-delivery-approach",
    optionId: "option.delivery-hybrid",
  },
  {
    decisionId: "decision.establish-governance",
    optionId: "option.governance-cross-functional",
  },
] as const;

const ACTIVITY_IDS = [
  "activity.review-authorization",
  "activity.analyze-access-evidence",
  "activity.attend-kickoff",
  "activity.review-stakeholder-concerns",
  "activity.submit-chapter-one-decisions",
  "activity.chapter-one-reflection",
] as const;

const completeMeeting = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
  runId: string,
  version: number,
  prefix: string,
): Promise<number> => {
  const start = await postCommand(
    app,
    auth,
    `/api/v1/simulation-runs/${runId}/commands/start-meeting`,
    {
      commandId: `${prefix}_start_meeting`,
      commandType: "StartMeeting",
      commandVersion: 1,
      expectedAggregateVersion: version,
      payload: { meetingId: "meeting.program-kickoff" },
    },
    version,
  );
  expect(start.status).toBe(200);
  version = ((await start.json()) as { data: { aggregateVersion: number } })
    .data.aggregateVersion;
  const complete = await postCommand(
    app,
    auth,
    `/api/v1/simulation-runs/${runId}/commands/complete-meeting`,
    {
      commandId: `${prefix}_complete_meeting`,
      commandType: "CompleteMeeting",
      commandVersion: 1,
      expectedAggregateVersion: version,
      payload: { meetingId: "meeting.program-kickoff" },
    },
    version,
  );
  expect(complete.status).toBe(200);
  return ((await complete.json()) as { data: { aggregateVersion: number } })
    .data.aggregateVersion;
};

const submitAllDecisions = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
  runId: string,
  version: number,
  prefix: string,
): Promise<number> => {
  for (const [index, decision] of DECISIONS.entries()) {
    const response = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId: `${prefix}_d${index}`,
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
  return version;
};

const completeAllActivities = async (
  app: ReturnType<typeof createApiApp>,
  auth: { Authorization: string },
  runId: string,
  version: number,
  prefix: string,
  activityIds: readonly string[] = ACTIVITY_IDS,
): Promise<number> => {
  for (const [index, activityId] of activityIds.entries()) {
    const response = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-activity`,
      {
        commandId: `${prefix}_a${index}`,
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
  return version;
};

const assertNoHiddenTokens = (label: string, payload: unknown): void => {
  const json = JSON.stringify(payload);
  for (const token of [
    "rubric",
    "consequenceDefinitions",
    "schedule_event",
    "competencyWeights",
    "learning_signal",
  ]) {
    expect(json, `${label} must not expose ${token}`).not.toContain(token);
  }
};

describe("BC-005 Chapter One validation (memory)", () => {
  it("rejects stale If-Match then succeeds after refresh (REL-004)", async () => {
    const tenantId = "tenant_bc005_stale";
    const actorId = "learner_bc005_stale";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_stale",
      "practitioner",
    );
    const runId = created.data.simulationRunId;
    const version = await loadVersion(app, auth, runId);

    const stale = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId: "cmd_bc005_stale",
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: version + 99,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-patient-access",
        },
      },
      version + 99,
    );
    expect(stale.status).toBe(412);
    expect(
      ((await stale.json()) as { error: { code: string } }).error.code,
    ).toBe("AGGREGATE_VERSION_CONFLICT");

    const refreshed = await loadVersion(app, auth, runId);
    const retry = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId: "cmd_bc005_stale_retry",
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: refreshed,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-patient-access",
        },
      },
      refreshed,
    );
    expect(retry.status).toBe(200);
  });

  it("fails closed when commandId is reused with a changed payload (REL-003)", async () => {
    const tenantId = "tenant_bc005_reuse";
    const actorId = "learner_bc005_reuse";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_reuse",
      "explorer",
    );
    const runId = created.data.simulationRunId;
    const version = await loadVersion(app, auth, runId);
    const commandId = "cmd_bc005_reuse_payload";

    const first = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId,
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-patient-access",
        },
      },
      version,
    );
    expect(first.status).toBe(200);

    const changed = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId,
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: {
          decisionId: "decision.define-objective",
          optionId: "option.objective-tech-speed",
        },
      },
      version,
    );
    expect(changed.status).toBe(409);
    expect(
      ((await changed.json()) as { error: { code: string } }).error.code,
    ).toBe("IDEMPOTENCY_KEY_REUSED");
  });

  it("CompleteChapter same-commandId retry does not duplicate ending notification", async () => {
    const tenantId = "tenant_bc005_end";
    const actorId = "learner_bc005_end";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_end",
      "leader",
    );
    const runId = created.data.simulationRunId;
    let version = await loadVersion(app, auth, runId);
    version = await completeMeeting(app, auth, runId, version, "cmd_bc005_end");
    version = await submitAllDecisions(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_end",
    );
    version = await completeAllActivities(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_end",
    );

    const body = {
      commandId: "cmd_bc005_complete_chapter",
      commandType: "CompleteChapter",
      commandVersion: 1,
      expectedAggregateVersion: version,
      payload: { chapterId: "chapter-01" },
    };
    const first = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      body,
      version,
    );
    expect(first.status).toBe(200);
    const firstReceipt = (await first.json()) as {
      data: { endingNotificationId: string | null; aggregateVersion: number };
    };
    expect(firstReceipt.data.endingNotificationId).toBe(
      "notification.chapter-01-complete",
    );

    const notificationsAfterFirst = await app.request(
      `/api/v1/simulation-runs/${runId}/notifications`,
      { headers: auth },
    );
    const endingCount = (
      (await notificationsAfterFirst.json()) as {
        data: { notifications: ReadonlyArray<{ notificationId: string }> };
      }
    ).data.notifications.filter(
      (n) => n.notificationId === "notification.chapter-01-complete",
    ).length;
    expect(endingCount).toBe(1);

    // Same commandId + payload + original If-Match → idempotent receipt.
    const retry = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      body,
      version,
    );
    expect(retry.status).toBe(200);
    const retryReceipt = (await retry.json()) as {
      data: { aggregateVersion: number };
    };
    expect(retryReceipt.data.aggregateVersion).toBe(
      firstReceipt.data.aggregateVersion,
    );

    const notificationsAfterRetry = await app.request(
      `/api/v1/simulation-runs/${runId}/notifications`,
      { headers: auth },
    );
    const endingCountAfter = (
      (await notificationsAfterRetry.json()) as {
        data: { notifications: ReadonlyArray<{ notificationId: string }> };
      }
    ).data.notifications.filter(
      (n) => n.notificationId === "notification.chapter-01-complete",
    ).length;
    expect(endingCountAfter).toBe(1);
  });

  it("blocks CompleteChapter when required meeting is missing", async () => {
    const tenantId = "tenant_bc005_miss_meet";
    const actorId = "learner_bc005_miss_meet";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_miss_meet",
      "practitioner",
    );
    const runId = created.data.simulationRunId;
    let version = await loadVersion(app, auth, runId);
    version = await submitAllDecisions(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_mm",
    );
    version = await completeAllActivities(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_mm",
    );
    const complete = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_bc005_mm_complete",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(complete.status).toBe(422);
    expect(
      ((await complete.json()) as { error: { code: string } }).error.code,
    ).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });

  it("blocks CompleteChapter when a required activity is missing", async () => {
    const tenantId = "tenant_bc005_miss_act";
    const actorId = "learner_bc005_miss_act";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_miss_act",
      "explorer",
    );
    const runId = created.data.simulationRunId;
    let version = await loadVersion(app, auth, runId);
    version = await completeMeeting(app, auth, runId, version, "cmd_bc005_ma");
    version = await submitAllDecisions(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_ma",
    );
    version = await completeAllActivities(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_ma",
      ACTIVITY_IDS.slice(0, -1),
    );
    const complete = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_bc005_ma_complete",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(complete.status).toBe(422);
    expect(
      ((await complete.json()) as { error: { code: string } }).error.code,
    ).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });

  it("blocks CompleteChapter when a required decision is missing", async () => {
    const tenantId = "tenant_bc005_miss_dec";
    const actorId = "learner_bc005_miss_dec";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_miss_dec",
      "practitioner",
    );
    const runId = created.data.simulationRunId;
    let version = await loadVersion(app, auth, runId);
    version = await completeMeeting(app, auth, runId, version, "cmd_bc005_md");
    version = await completeAllActivities(
      app,
      auth,
      runId,
      version,
      "cmd_bc005_md",
    );
    const complete = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
      {
        commandId: "cmd_bc005_md_complete",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(complete.status).toBe(422);
    expect(
      ((await complete.json()) as { error: { code: string } }).error.code,
    ).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });

  it("keeps hidden content out of catalog, details, mission-control, decision-log, and inbox", async () => {
    const tenantId = "tenant_bc005_hidden";
    const actorId = "learner_bc005_hidden";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);

    const catalog = await app.request("/api/v1/business-cases", {
      headers: auth,
    });
    expect(catalog.status).toBe(200);
    assertNoHiddenTokens("catalog", await catalog.json());

    const details = await app.request(
      "/api/v1/business-cases/northstar-connected-care",
      { headers: auth },
    );
    expect(details.status).toBe(200);
    assertNoHiddenTokens("case details", await details.json());

    const created = await createNorthstarRun(
      app,
      auth,
      "run_bc005_hidden",
      "practitioner",
    );
    const runId = created.data.simulationRunId;

    for (const path of ["mission-control", "decision-log", "inbox"] as const) {
      const response = await app.request(
        `/api/v1/simulation-runs/${runId}/${path}`,
        { headers: auth },
      );
      expect(response.status).toBe(200);
      assertNoHiddenTokens(path, await response.json());
    }
  });

  it("shares decision IDs across experience levels while differing prompts", async () => {
    const pkg = createNorthstarConnectedCarePackage();
    const cpv = asContentPackageVersionId("cpv:northstar-connected-care:1.0.0");
    const levels = ["explorer", "practitioner", "leader"] as const;
    const prompts = levels.map((level) =>
      mapBusinessCasePackageToProjectionSafeContent(pkg, cpv, level),
    );
    const ids = (content: (typeof prompts)[number]) =>
      content.decisions.map((d) => d.id).sort();
    expect(ids(prompts[0]!)).toEqual(ids(prompts[1]!));
    expect(ids(prompts[1]!)).toEqual(ids(prompts[2]!));

    const decisionId = "decision.define-objective";
    const levelPrompts = prompts.map(
      (content) => content.decisions.find((d) => d.id === decisionId)?.prompt,
    );
    expect(levelPrompts[0]).toBeTruthy();
    expect(levelPrompts[0]).not.toEqual(levelPrompts[1]);
    expect(levelPrompts[1]).not.toEqual(levelPrompts[2]);

    const tenantId = "tenant_bc005_levels";
    const actorId = "learner_bc005_levels";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const apiPrompts: string[] = [];
    for (const level of levels) {
      const created = await createNorthstarRun(
        app,
        auth,
        `run_bc005_level_${level}`,
        level,
      );
      const projection = await app.request(
        `/api/v1/simulation-runs/${created.data.simulationRunId}/projection`,
        { headers: auth },
      );
      const body = (await projection.json()) as {
        data: {
          availableDecisions: ReadonlyArray<{
            decisionDefinitionId: string;
            prompt: string;
          }>;
        };
      };
      const prompt = body.data.availableDecisions.find(
        (d) => d.decisionDefinitionId === decisionId,
      )?.prompt;
      expect(prompt).toBeTruthy();
      apiPrompts.push(prompt!);
    }
    expect(apiPrompts[0]).not.toEqual(apiPrompts[1]);
    expect(apiPrompts[1]).not.toEqual(apiPrompts[2]);
  });

  it("isolates Northstar and Harbor stakeholders", async () => {
    const tenantId = "tenant_bc005_cases";
    const actorId = "learner_bc005_cases";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const northstar = await createNorthstarRun(
      app,
      auth,
      "run_bc005_northstar",
      "explorer",
    );
    const harbor = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "harbor-logistics-recovery",
        experienceLevel: "practitioner",
        simulationRunId: "run_bc005_harbor",
      }),
    });
    expect(harbor.status).toBe(201);
    const harborId = (
      (await harbor.json()) as { data: { simulationRunId: string } }
    ).data.simulationRunId;

    const nsStakeholders = await (
      await app.request(
        `/api/v1/simulation-runs/${northstar.data.simulationRunId}/stakeholders`,
        { headers: auth },
      )
    ).json();
    const harborStakeholders = await (
      await app.request(`/api/v1/simulation-runs/${harborId}/stakeholders`, {
        headers: auth,
      })
    ).json();

    expect(JSON.stringify(nsStakeholders)).not.toMatch(/harbor/i);
    expect(JSON.stringify(harborStakeholders)).not.toMatch(
      /northstar|connected-care|patient-experience/i,
    );
    expect(
      (
        nsStakeholders as {
          data: { stakeholders: ReadonlyArray<{ stakeholderId: string }> };
        }
      ).data.stakeholders.some(
        (s) => s.stakeholderId === "stakeholder.sponsor",
      ),
    ).toBe(true);
  });

  it("keeps two Northstar runs isolated", async () => {
    const tenantId = "tenant_bc005_runs";
    const actorId = "learner_bc005_runs";
    const { app } = createHarness(tenantId, actorId);
    const auth = authFor(tenantId, actorId);
    const runA = await createNorthstarRun(
      app,
      auth,
      "run_bc005_iso_a",
      "explorer",
    );
    const runB = await createNorthstarRun(
      app,
      auth,
      "run_bc005_iso_b",
      "leader",
    );
    const versionA = await loadVersion(app, auth, runA.data.simulationRunId);
    const submitted = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runA.data.simulationRunId}/commands/submit-decision`,
      {
        commandId: "cmd_bc005_iso_d1",
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

    const logA = (await (
      await app.request(
        `/api/v1/simulation-runs/${runA.data.simulationRunId}/decision-log`,
        { headers: auth },
      )
    ).json()) as { data: { summary: { totalEntries: number } } };
    const logB = (await (
      await app.request(
        `/api/v1/simulation-runs/${runB.data.simulationRunId}/decision-log`,
        { headers: auth },
      )
    ).json()) as { data: { summary: { totalEntries: number } } };
    expect(logA.data.summary.totalEntries).toBe(1);
    expect(logB.data.summary.totalEntries).toBe(0);
  });
});
