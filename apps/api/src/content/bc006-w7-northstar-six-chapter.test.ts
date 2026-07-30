/**
 * BC-006 Workstream 7 — complete Northstar six-chapter integrated path.
 */

import { describe, expect, it } from "vitest";
import { WORKPLACE_PROJECTION_TYPES } from "@projectsim/domain";
import { createContentApiModule } from "./content-module";
import { createApiApp } from "../create-app";
import { createInMemorySimulationModuleRegistry } from "../module-registry";
import {
  authFor,
  runNorthstarSixChapterPath,
  type PathProfile,
} from "./northstar-six-chapter-harness";

const HIDDEN_LEAK_MARKERS = [
  "semanticHash",
  "hiddenConsequence",
  "answerKey",
  "resolverInternals",
  "outbox",
  "projection_event_inbox",
  "secretWeight",
] as const;

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

const assertNoHiddenLeak = (payload: unknown): void => {
  const serialized = JSON.stringify(payload);
  for (const marker of HIDDEN_LEAK_MARKERS) {
    expect(serialized.includes(marker)).toBe(false);
  }
};

const runPath = async (
  profile: PathProfile,
  experienceLevel: "explorer" | "practitioner" | "leader" = "practitioner",
) => {
  const tenantId = `tenant_w7_${profile}_${experienceLevel}`;
  const actorId = `learner_w7_${profile}_${experienceLevel}`;
  const { app } = createHarness(tenantId, actorId);
  const auth = authFor(tenantId, actorId);
  const runId = `run_w7_${profile}_${experienceLevel}`;
  const result = await runNorthstarSixChapterPath({
    app,
    auth,
    runId,
    experienceLevel,
    profile,
    commandPrefix: `cmd_w7_${profile}_${experienceLevel}`,
  });
  return { app, auth, result, runId };
};

describe("BC-006 W7 Northstar six-chapter integrated path", () => {
  it("completes all six chapters on the strong/responsible path and closes the run", async () => {
    const { app, auth, result, runId } = await runPath(
      "strong",
      "practitioner",
    );

    expect(result.chapterResults).toHaveLength(6);
    expect(result.chapterResults.map((c) => c.chapterId)).toEqual([
      "chapter-01",
      "chapter-02",
      "chapter-03",
      "chapter-04",
      "chapter-05",
      "chapter-06",
    ]);
    expect(
      result.chapterResults.slice(0, 5).every((c) => c.nextChapterInitialized),
    ).toBe(true);
    expect(result.chapterResults[5]?.nextChapterId).toBeNull();
    expect(result.chapterResults[5]?.nextChapterInitialized).toBe(false);
    expect(result.runStatus).toBe("completed");
    expect(result.finalEndingOutcomeId).toBe(
      "outcome.ending-e2-hard-won-recovery",
    );
    expect(result.contentPackageVersionId).toBe(
      "cpv:northstar-connected-care:1.0.0",
    );
    expect(result.elapsedMs).toBeLessThan(120_000);

    const progression = await app.request(
      `/api/v1/simulation-runs/${runId}/learner-progression`,
      { headers: auth },
    );
    expect(progression.status).toBe(200);
    const progressionBody = await progression.json();
    assertNoHiddenLeak(progressionBody);

    const achievements = await app.request(
      `/api/v1/simulation-runs/${runId}/achievements`,
      { headers: auth },
    );
    expect(achievements.status).toBe(200);
    const achievementsBody = (await achievements.json()) as {
      data: {
        awards: ReadonlyArray<{ achievementId: string }>;
        xpSummary: { availability: string; reason: string };
      };
    };
    assertNoHiddenLeak(achievementsBody);
    expect(achievementsBody.data.xpSummary.availability).toBe("unavailable");
    expect(achievementsBody.data.xpSummary.reason).toBe(
      "xp_amounts_not_authored",
    );
    expect(
      achievementsBody.data.awards.some(
        (award) => award.achievementId === "achievement.closure-steward",
      ),
    ).toBe(true);

    const mastery = await app.request(
      `/api/v1/simulation-runs/${runId}/mastery`,
      { headers: auth },
    );
    expect(mastery.status).toBe(200);
    const masteryBody = (await mastery.json()) as {
      data: {
        competencies: ReadonlyArray<{ bandAvailability: string }>;
        xpSummary: { availability: string };
      };
    };
    assertNoHiddenLeak(masteryBody);
    expect(masteryBody.data.xpSummary.availability).toBe("unavailable");
    expect(
      masteryBody.data.competencies.every(
        (entry) => entry.bandAvailability === "unavailable",
      ),
    ).toBe(true);

    const coaching = await app.request(
      `/api/v1/simulation-runs/${runId}/coaching`,
      { headers: auth },
    );
    expect(coaching.status).toBe(200);
    assertNoHiddenLeak(await coaching.json());

    for (const projectionType of WORKPLACE_PROJECTION_TYPES) {
      const suffix =
        projectionType === "simulation"
          ? "projection"
          : projectionType === "learner_progression"
            ? "learner-progression"
            : projectionType === "decision_log"
              ? "decision-log"
              : projectionType === "mission_control"
                ? "mission-control"
                : projectionType === "completed_history"
                  ? "completed-history"
                  : projectionType;
      const response = await app.request(
        `/api/v1/simulation-runs/${runId}/${suffix}`,
        { headers: auth },
      );
      expect(response.status, projectionType).toBe(200);
      assertNoHiddenLeak(await response.json());
    }
  }, 180_000);

  it("keeps Explorer / Practitioner / Leader final endings stable for the strong path", async () => {
    const explorer = await runPath("strong", "explorer");
    const practitioner = await runPath("strong", "practitioner");
    const leader = await runPath("strong", "leader");

    expect(explorer.result.finalEndingOutcomeId).toBe(
      practitioner.result.finalEndingOutcomeId,
    );
    expect(leader.result.finalEndingOutcomeId).toBe(
      practitioner.result.finalEndingOutcomeId,
    );
    expect(explorer.result.runStatus).toBe("completed");
    expect(practitioner.result.runStatus).toBe("completed");
    expect(leader.result.runStatus).toBe("completed");
  }, 360_000);

  it("completes an adverse option path without inventing XP", async () => {
    const { result, runId, app, auth } = await runPath(
      "adverse",
      "practitioner",
    );
    expect(result.runStatus).toBe("completed");
    expect(result.finalEndingOutcomeId).toBe(
      "outcome.ending-e9-administrative-closure",
    );

    const mastery = await app.request(
      `/api/v1/simulation-runs/${runId}/mastery`,
      { headers: auth },
    );
    const body = (await mastery.json()) as {
      data: { xpSummary: { availability: string } };
    };
    expect(body.data.xpSummary.availability).toBe("unavailable");
  }, 180_000);
});
