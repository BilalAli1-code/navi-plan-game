/**
 * PS-ROADMAP-024 — Bounded reliability cycles (PR-tier).
 *
 * Small deterministic cycle count for pull-request CI. Larger soak belongs in
 * scheduled/manual runs (documented; not inventing a nightly workflow).
 */
import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
  redeliverLastOutboxEvent,
} from "./helpers/api";
import {
  completeActivityViaE2e,
  fetchActivities,
  fetchCompletedHistory,
  initializeActivityViaE2e,
} from "./helpers/activities";
import { initializeDocumentViaE2e } from "./helpers/documents";
import { requireE2eDatabase } from "./helpers/env";
import {
  convergeRelay,
  openShellSurface,
  rebuildAllProjectionsViaOps,
} from "./helpers/convergence";

/** PR-tier cycle count — keep bounded for CI runtime. */
const RELIABILITY_CYCLES = 3;
const RELIABILITY_SEED = "ps024-reliability-v1";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  requireE2eDatabase();
});

test.beforeEach(async () => {
  await cleanupAllE2eFixtures();
});

test.afterEach(async () => {
  await cleanupAllE2eFixtures();
});

test("given_repeated_mutate_relay_duplicate_rebuild_cycles_then_no_learner_visible_drift", async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({
    type: "seed",
    description: RELIABILITY_SEED,
  });

  const identity = uniqueIdentity("conv-reliability");
  await createDecisionLifecycleFixture(identity, {
    capabilities: [
      "simulation.run.view",
      "simulation.run.start",
      "simulation.projection.ops",
    ],
  });
  const token = await createE2eAccessToken(identity);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });

  for (let cycle = 1; cycle <= RELIABILITY_CYCLES; cycle += 1) {
    const activityId = `activity_rel_${cycle}`;
    const documentId = `document_rel_${cycle}`;

    await initializeDocumentViaE2e(identity, {
      documentId,
      title: `Reliability doc ${cycle}`,
      body: `Body for cycle ${cycle}`,
      commandId: `cmd_rel_doc_${cycle}`,
    });
    await initializeActivityViaE2e(identity, {
      activityId,
      title: `Reliability activity ${cycle}`,
      summary: `Summary for cycle ${cycle}`,
      commandId: `cmd_rel_act_${cycle}`,
    });
    await convergeRelay(identity.tenantId);

    // Duplicate delivery of last outbox event
    await redeliverLastOutboxEvent({
      tenantId: identity.tenantId,
      simulationRunId: identity.simulationRunId,
    });
    await convergeRelay(identity.tenantId);

    const activitiesBefore = await fetchActivities(
      token,
      identity.simulationRunId,
    );
    // Prior cycles completed their activities — only the current cycle's
    // activity remains active among activity_rel_* ids.
    expect(
      activitiesBefore.data.activities.filter((item) =>
        item.activityId.startsWith("activity_rel_"),
      ),
    ).toEqual([expect.objectContaining({ activityId })]);

    await completeActivityViaE2e(identity, {
      activityId,
      commandId: `cmd_rel_complete_${cycle}`,
    });
    await convergeRelay(identity.tenantId);

    // Duplicate complete command (idempotent receipt)
    await completeActivityViaE2e(identity, {
      activityId,
      commandId: `cmd_rel_complete_${cycle}`,
    });
    await convergeRelay(identity.tenantId);

    const rebuild = await rebuildAllProjectionsViaOps({
      accessToken: token,
      simulationRunId: identity.simulationRunId,
    });
    expect(rebuild.status, `cycle ${cycle} rebuild`).toBe(200);

    const activitiesAfter = await fetchActivities(
      token,
      identity.simulationRunId,
    );
    expect(
      activitiesAfter.data.activities.some(
        (item) => item.activityId === activityId,
      ),
    ).toBe(false);

    const history = await fetchCompletedHistory(
      token,
      identity.simulationRunId,
    );
    const completedCount = history.data.items.filter((item) =>
      item.activityId.startsWith("activity_rel_"),
    ).length;
    expect(completedCount).toBe(cycle);

    await openShellSurface(page, identity.simulationRunId, "Completed History");
    await expect(page.getByTestId("completed-history-item")).toHaveCount(cycle);

    await page.reload();
    await expect(page.getByTestId("completed-history-item")).toHaveCount(cycle);
    await expect(page.getByTestId("workplace-run-id")).toContainText(
      identity.simulationRunId,
    );
  }
});
