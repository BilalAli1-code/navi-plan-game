import { describe, expect, it } from "vitest";
import {
  ACTIVITIES_PROJECTION_TYPE,
  ACHIEVEMENTS_PROJECTION_TYPE,
  COACHING_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  DECISION_LOG_PROJECTION_TYPE,
  DOCUMENTS_PROJECTION_TYPE,
  INBOX_PROJECTION_TYPE,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  MASTERY_PROJECTION_TYPE,
  MEETINGS_PROJECTION_TYPE,
  MISSION_CONTROL_PROJECTION_TYPE,
  NOTIFICATIONS_PROJECTION_TYPE,
  PERFORMANCE_PROJECTION_TYPE,
  SIMULATION_PROJECTION_TYPE,
  STAKEHOLDERS_PROJECTION_TYPE,
  ok,
} from "@projectsim/domain";
import type { RebuildDecisionLogProjectionService } from "./rebuild-decision-log-projection-service";
import type { RebuildDocumentsProjectionService } from "./rebuild-documents-projection-service";
import type { RebuildInboxProjectionService } from "./rebuild-inbox-projection-service";
import type { RebuildMeetingsProjectionService } from "./rebuild-meetings-projection-service";
import type { RebuildMissionControlProjectionService } from "./rebuild-mission-control-projection-service";
import type { RebuildNotificationsProjectionService } from "./rebuild-notifications-projection-service";
import type { RebuildSimulationProjectionService } from "./rebuild-simulation-projection-service";
import type { RebuildStakeholdersProjectionService } from "./rebuild-stakeholders-projection-service";
import {
  createWorkplaceProjectionRegistry,
  decisionLogProjectionRebuildHandler,
  defaultWorkplaceProjectionFanOut,
  documentsProjectionRebuildHandler,
  inboxProjectionRebuildHandler,
  meetingsProjectionRebuildHandler,
  missionControlProjectionRebuildHandler,
  notificationsProjectionRebuildHandler,
  simulationProjectionRebuildHandler,
  stakeholdersProjectionRebuildHandler,
} from "./workplace-projection-registry";

const stubRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildSimulationProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubMissionControlRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildMissionControlProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubDecisionLogRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildDecisionLogProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubInboxRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildInboxProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubMeetingsRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildMeetingsProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubStakeholdersRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildStakeholdersProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubDocumentsRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildDocumentsProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

const stubNotificationsRebuildService = (
  onRebuild?: (runId: string) => void,
): RebuildNotificationsProjectionService => ({
  rebuild: async (input) => {
    onRebuild?.(input.simulationRunId);
    return ok({
      projection: {} as never,
      saveResult: "unchanged",
      emittedEvents: [],
    });
  },
});

describe("workplace projection registry (PS-ROADMAP-021/022)", () => {
  it("fans out DecisionResolved to the full production family including activities and completed_history", () => {
    expect(defaultWorkplaceProjectionFanOut("DecisionResolved")).toEqual([
      SIMULATION_PROJECTION_TYPE,
      MISSION_CONTROL_PROJECTION_TYPE,
      DECISION_LOG_PROJECTION_TYPE,
      INBOX_PROJECTION_TYPE,
      MEETINGS_PROJECTION_TYPE,
      STAKEHOLDERS_PROJECTION_TYPE,
      DOCUMENTS_PROJECTION_TYPE,
      NOTIFICATIONS_PROJECTION_TYPE,
      ACTIVITIES_PROJECTION_TYPE,
      COMPLETED_HISTORY_PROJECTION_TYPE,
      PERFORMANCE_PROJECTION_TYPE,
      LEARNER_PROGRESSION_PROJECTION_TYPE,
      ACHIEVEMENTS_PROJECTION_TYPE,
      MASTERY_PROJECTION_TYPE,
      COACHING_PROJECTION_TYPE,
    ]);
    expect(defaultWorkplaceProjectionFanOut("ProjectionRebuilt")).toEqual([]);
  });

  it("routes LearnerMessageDelivered to inbox only", () => {
    expect(defaultWorkplaceProjectionFanOut("LearnerMessageDelivered")).toEqual(
      [INBOX_PROJECTION_TYPE],
    );
  });

  it.each([
    [
      "MeetingScheduled",
      [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE],
    ],
    [
      "MeetingMadeAvailable",
      [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE],
    ],
    [
      "MeetingStarted",
      [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE],
    ],
    [
      "MeetingCompleted",
      [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE],
    ],
    [
      "MeetingCancelled",
      [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE],
    ],
  ] as const)(
    "routes %s to meetings and mission_control",
    (eventType, expected) => {
      expect(defaultWorkplaceProjectionFanOut(eventType)).toEqual([
        ...expected,
      ]);
    },
  );

  it.each([
    ["StakeholderInitialized", [STAKEHOLDERS_PROJECTION_TYPE]],
    ["StakeholderConversationOpened", [STAKEHOLDERS_PROJECTION_TYPE]],
    ["StakeholderMessageSent", [STAKEHOLDERS_PROJECTION_TYPE]],
  ] as const)("routes %s to stakeholders only", (eventType, expected) => {
    expect(defaultWorkplaceProjectionFanOut(eventType)).toEqual([...expected]);
  });

  it("routes DocumentInitialized to documents only", () => {
    expect(defaultWorkplaceProjectionFanOut("DocumentInitialized")).toEqual([
      DOCUMENTS_PROJECTION_TYPE,
    ]);
  });

  it("routes NotificationInitialized to notifications only", () => {
    expect(defaultWorkplaceProjectionFanOut("NotificationInitialized")).toEqual(
      [NOTIFICATIONS_PROJECTION_TYPE],
    );
  });

  it("routes ActivityInitialized to activities only", () => {
    expect(defaultWorkplaceProjectionFanOut("ActivityInitialized")).toEqual([
      ACTIVITIES_PROJECTION_TYPE,
    ]);
  });

  it("routes ActivityCompleted to activities and completed_history", () => {
    expect(defaultWorkplaceProjectionFanOut("ActivityCompleted")).toEqual([
      ACTIVITIES_PROJECTION_TYPE,
      COMPLETED_HISTORY_PROJECTION_TYPE,
    ]);
  });

  it("registers documents and notifications and leaves later reserved types unregistered", async () => {
    const rebuildCalls: string[] = [];
    const registry = createWorkplaceProjectionRegistry({
      handlers: [
        simulationProjectionRebuildHandler(
          stubRebuildService((runId) => {
            rebuildCalls.push(`simulation:${runId}`);
          }),
        ),
        missionControlProjectionRebuildHandler(
          stubMissionControlRebuildService((runId) => {
            rebuildCalls.push(`mission_control:${runId}`);
          }),
        ),
        decisionLogProjectionRebuildHandler(
          stubDecisionLogRebuildService((runId) => {
            rebuildCalls.push(`decision_log:${runId}`);
          }),
        ),
        inboxProjectionRebuildHandler(
          stubInboxRebuildService((runId) => {
            rebuildCalls.push(`inbox:${runId}`);
          }),
        ),
        meetingsProjectionRebuildHandler(
          stubMeetingsRebuildService((runId) => {
            rebuildCalls.push(`meetings:${runId}`);
          }),
        ),
        stakeholdersProjectionRebuildHandler(
          stubStakeholdersRebuildService((runId) => {
            rebuildCalls.push(`stakeholders:${runId}`);
          }),
        ),
        documentsProjectionRebuildHandler(
          stubDocumentsRebuildService((runId) => {
            rebuildCalls.push(`documents:${runId}`);
          }),
        ),
        notificationsProjectionRebuildHandler(
          stubNotificationsRebuildService((runId) => {
            rebuildCalls.push(`notifications:${runId}`);
          }),
        ),
      ],
    });

    expect(registry.registeredTypes).toEqual([
      SIMULATION_PROJECTION_TYPE,
      MISSION_CONTROL_PROJECTION_TYPE,
      DECISION_LOG_PROJECTION_TYPE,
      INBOX_PROJECTION_TYPE,
      MEETINGS_PROJECTION_TYPE,
      STAKEHOLDERS_PROJECTION_TYPE,
      DOCUMENTS_PROJECTION_TYPE,
      NOTIFICATIONS_PROJECTION_TYPE,
    ]);
    expect(registry.projectionTypesForEvent("DecisionResolved")).toEqual([
      SIMULATION_PROJECTION_TYPE,
      MISSION_CONTROL_PROJECTION_TYPE,
      DECISION_LOG_PROJECTION_TYPE,
      INBOX_PROJECTION_TYPE,
      MEETINGS_PROJECTION_TYPE,
      STAKEHOLDERS_PROJECTION_TYPE,
      DOCUMENTS_PROJECTION_TYPE,
      NOTIFICATIONS_PROJECTION_TYPE,
    ]);
    expect(registry.projectionTypesForEvent("LearnerMessageDelivered")).toEqual(
      [INBOX_PROJECTION_TYPE],
    );
    expect(registry.projectionTypesForEvent("StakeholderInitialized")).toEqual([
      STAKEHOLDERS_PROJECTION_TYPE,
    ]);
    expect(registry.handlerFor("stakeholders")?.projectionType).toBe(
      "stakeholders",
    );
    expect(registry.projectionTypesForEvent("DocumentInitialized")).toEqual([
      DOCUMENTS_PROJECTION_TYPE,
    ]);
    expect(registry.handlerFor("documents")?.projectionType).toBe("documents");
    expect(registry.projectionTypesForEvent("NotificationInitialized")).toEqual(
      [NOTIFICATIONS_PROJECTION_TYPE],
    );
    expect(registry.handlerFor("notifications")?.projectionType).toBe(
      "notifications",
    );
    for (const type of ["activities", "completed_history"] as const) {
      expect(registry.handlerFor(type)).toBeUndefined();
    }

    const stakeholdersHandler = registry.handlerFor(
      STAKEHOLDERS_PROJECTION_TYPE,
    );
    expect(stakeholdersHandler).toBeDefined();
    await stakeholdersHandler!.rebuild({
      simulationRunId: "run_1" as never,
      correlationId: "corr_1" as never,
      causationId: null,
      actorId: null,
    });
    expect(rebuildCalls).toEqual(["stakeholders:run_1"]);
  });

  it("rejects duplicate handlers for the same projection type", () => {
    const handler = simulationProjectionRebuildHandler(stubRebuildService());
    expect(() =>
      createWorkplaceProjectionRegistry({ handlers: [handler, handler] }),
    ).toThrow(/Duplicate workplace projection handler/);
  });
});
