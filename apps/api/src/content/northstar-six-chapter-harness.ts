/**
 * BC-006 Workstream 7 — deterministic Northstar six-chapter path helpers.
 *
 * Drives authoritative workplace commands only. Option selection is scripted
 * (strong = first option; adverse = last option) — not UI-owned.
 */

import {
  createNorthstarConnectedCarePackage,
  type BusinessCaseContentPackage,
} from "@projectsim/domain";
import type { createApiApp } from "../create-app";

type App = ReturnType<typeof createApiApp>;

export type ExperienceLevelChoice = "explorer" | "practitioner" | "leader";

export type PathProfile = "strong" | "adverse";

export const authHeader = (tenantId: string, actorId: string): string =>
  `Bearer dev.${Buffer.from(JSON.stringify({ tenantId, actorId })).toString(
    "base64url",
  )}`;

export const authFor = (tenantId: string, actorId: string) => ({
  Authorization: authHeader(tenantId, actorId),
});

export const postCommand = async (
  app: App,
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

export const createNorthstarRun = async (
  app: App,
  auth: { Authorization: string },
  simulationRunId: string,
  experienceLevel: ExperienceLevelChoice,
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
  return created;
};

export const loadVersion = async (
  app: App,
  auth: { Authorization: string },
  runId: string,
): Promise<number> => {
  const projection = await app.request(
    `/api/v1/simulation-runs/${runId}/projection`,
    { headers: auth },
  );
  if (projection.status !== 200) {
    throw new Error(`projection status ${projection.status}`);
  }
  return (
    (await projection.json()) as { data: { sourceAggregateVersion: number } }
  ).data.sourceAggregateVersion;
};

const optionForProfile = (
  decision: BusinessCaseContentPackage["decisions"][number],
  profile: PathProfile,
): string => {
  if (decision.options.length === 0) {
    throw new Error(`Decision ${decision.id} has no options`);
  }
  if (profile === "adverse") {
    return decision.options[decision.options.length - 1]!.id;
  }
  // Prefer a mid/responsible option when available. Option 0 in buildDecision
  // always applies a positive metric delta; repeated selection across six
  // chapters can hit fail-closed metric bounds.
  if (decision.options.length >= 2) {
    return decision.options[1]!.id;
  }
  return decision.options[0]!.id;
};

export const completeChapterPath = async (input: {
  readonly app: App;
  readonly auth: { Authorization: string };
  readonly runId: string;
  readonly chapterId: string;
  readonly package: BusinessCaseContentPackage;
  readonly profile: PathProfile;
  readonly commandPrefix: string;
  readonly startingVersion: number;
}): Promise<{
  readonly version: number;
  readonly nextChapterId: string | null;
  readonly finalEndingOutcomeId: string | null;
  readonly runStatus: string;
  readonly nextChapterInitialized: boolean;
}> => {
  const { app, auth, runId, chapterId, profile, commandPrefix } = input;
  let version = input.startingVersion;
  const meetings = input.package.meetings.filter(
    (meeting) => meeting.chapterId === chapterId,
  );
  const decisions = input.package.decisions.filter(
    (decision) => decision.chapterId === chapterId && decision.required,
  );
  const activities = input.package.activities.filter(
    (activity) => activity.chapterId === chapterId,
  );

  for (const [index, meeting] of meetings.entries()) {
    const start = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/start-meeting`,
      {
        commandId: `${commandPrefix}_${chapterId}_m${index}_start`,
        commandType: "StartMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: meeting.id },
      },
      version,
    );
    if (start.status !== 200) {
      throw new Error(
        `start-meeting ${meeting.id} failed: ${start.status} ${await start.text()}`,
      );
    }
    version = ((await start.json()) as { data: { aggregateVersion: number } })
      .data.aggregateVersion;

    const complete = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-meeting`,
      {
        commandId: `${commandPrefix}_${chapterId}_m${index}_complete`,
        commandType: "CompleteMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: meeting.id },
      },
      version,
    );
    if (complete.status !== 200) {
      throw new Error(
        `complete-meeting ${meeting.id} failed: ${complete.status} ${await complete.text()}`,
      );
    }
    version = (
      (await complete.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;
  }

  for (const [index, decision] of decisions.entries()) {
    const response = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/submit-decision`,
      {
        commandId: `${commandPrefix}_${chapterId}_d${index}`,
        commandType: "SubmitDecision",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: {
          decisionId: decision.id,
          optionId: optionForProfile(decision, profile),
        },
      },
      version,
    );
    if (response.status !== 200) {
      throw new Error(
        `submit-decision ${decision.id} failed: ${response.status} ${await response.text()}`,
      );
    }
    version = (
      (await response.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;
  }

  for (const [index, activity] of activities.entries()) {
    const response = await postCommand(
      app,
      auth,
      `/api/v1/simulation-runs/${runId}/commands/complete-activity`,
      {
        commandId: `${commandPrefix}_${chapterId}_a${index}`,
        commandType: "CompleteActivity",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { activityId: activity.id },
      },
      version,
    );
    if (response.status !== 200) {
      throw new Error(
        `complete-activity ${activity.id} failed: ${response.status} ${await response.text()}`,
      );
    }
    version = (
      (await response.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;
  }

  const completeChapter = await postCommand(
    app,
    auth,
    `/api/v1/simulation-runs/${runId}/commands/complete-chapter`,
    {
      commandId: `${commandPrefix}_${chapterId}_complete`,
      commandType: "CompleteChapter",
      commandVersion: 1,
      expectedAggregateVersion: version,
      payload: { chapterId },
    },
    version,
  );
  if (completeChapter.status !== 200) {
    throw new Error(
      `complete-chapter ${chapterId} failed: ${completeChapter.status} ${await completeChapter.text()}`,
    );
  }
  const receipt = (await completeChapter.json()) as {
    data: {
      aggregateVersion: number;
      nextChapterId: string | null;
      finalEndingOutcomeId: string | null;
      runStatus: string;
      nextChapterInitialized: boolean;
    };
  };
  return {
    version: receipt.data.aggregateVersion,
    nextChapterId: receipt.data.nextChapterId,
    finalEndingOutcomeId: receipt.data.finalEndingOutcomeId,
    runStatus: receipt.data.runStatus,
    nextChapterInitialized: receipt.data.nextChapterInitialized,
  };
};

export const runNorthstarSixChapterPath = async (input: {
  readonly app: App;
  readonly auth: { Authorization: string };
  readonly runId: string;
  readonly experienceLevel: ExperienceLevelChoice;
  readonly profile: PathProfile;
  readonly commandPrefix: string;
}): Promise<{
  readonly contentPackageVersionId: string;
  readonly chapterResults: readonly {
    readonly chapterId: string;
    readonly nextChapterId: string | null;
    readonly nextChapterInitialized: boolean;
  }[];
  readonly finalEndingOutcomeId: string | null;
  readonly runStatus: string;
  readonly elapsedMs: number;
  readonly package: BusinessCaseContentPackage;
}> => {
  const started = Date.now();
  const pkg = createNorthstarConnectedCarePackage();
  const created = await createNorthstarRun(
    input.app,
    input.auth,
    input.runId,
    input.experienceLevel,
  );
  if (created.status !== 201) {
    throw new Error(
      `create run failed: ${created.status} ${await created.text()}`,
    );
  }
  const createdBody = (await created.json()) as {
    data: { contentPackageVersionId: string; chapterId: string };
  };

  let version = await loadVersion(input.app, input.auth, input.runId);
  const chapterResults: {
    chapterId: string;
    nextChapterId: string | null;
    nextChapterInitialized: boolean;
  }[] = [];
  let finalEndingOutcomeId: string | null = null;
  let runStatus = "active";

  const chapters = [...pkg.chapters].sort((a, b) => a.order - b.order);
  for (const chapter of chapters) {
    const result = await completeChapterPath({
      app: input.app,
      auth: input.auth,
      runId: input.runId,
      chapterId: chapter.id,
      package: pkg,
      profile: input.profile,
      commandPrefix: input.commandPrefix,
      startingVersion: version,
    });
    version = result.version;
    finalEndingOutcomeId = result.finalEndingOutcomeId;
    runStatus = result.runStatus;
    chapterResults.push({
      chapterId: chapter.id,
      nextChapterId: result.nextChapterId,
      nextChapterInitialized: result.nextChapterInitialized,
    });
  }

  return {
    contentPackageVersionId: createdBody.data.contentPackageVersionId,
    chapterResults,
    finalEndingOutcomeId,
    runStatus,
    elapsedMs: Date.now() - started,
    package: pkg,
  };
};
