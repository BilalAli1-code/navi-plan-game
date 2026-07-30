/**
 * Unified Workplace Convergence Suite inventory (PS-ROADMAP-024).
 *
 * Registry-backed manifest of learner-facing projections and shell surfaces.
 * Completeness tests fail when registrations drift from suite coverage.
 *
 * Does not introduce a second production registry — it asserts against
 * `WorkplaceProjectionRegistry.registeredTypes` and domain type constants.
 */

import {
  ACTIVITIES_PROJECTION_SCHEMA_VERSION,
  ACTIVITIES_PROJECTION_TYPE,
  ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
  ACHIEVEMENTS_PROJECTION_TYPE,
  COACHING_PROJECTION_SCHEMA_VERSION,
  COACHING_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  DECISION_LOG_PROJECTION_SCHEMA_VERSION,
  DECISION_LOG_PROJECTION_TYPE,
  DOCUMENTS_PROJECTION_SCHEMA_VERSION,
  DOCUMENTS_PROJECTION_TYPE,
  INBOX_PROJECTION_SCHEMA_VERSION,
  INBOX_PROJECTION_TYPE,
  LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  MASTERY_PROJECTION_SCHEMA_VERSION,
  MASTERY_PROJECTION_TYPE,
  MEETINGS_PROJECTION_SCHEMA_VERSION,
  MEETINGS_PROJECTION_TYPE,
  MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
  MISSION_CONTROL_PROJECTION_TYPE,
  NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
  NOTIFICATIONS_PROJECTION_TYPE,
  PERFORMANCE_PROJECTION_SCHEMA_VERSION,
  PERFORMANCE_PROJECTION_TYPE,
  SIMULATION_PROJECTION_SCHEMA_VERSION,
  SIMULATION_PROJECTION_TYPE,
  STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
  STAKEHOLDERS_PROJECTION_TYPE,
  WORKPLACE_PROJECTION_TYPES,
  type WorkplaceProjectionType,
} from "@projectsim/domain";
import type { WorkplaceProjectionRegistry } from "./workplace-projection-registry";
import { defaultWorkplaceProjectionFanOut } from "./workplace-projection-registry";

/** Shell navigation labels in product order (PS-013 / PS-022). */
export const WORKPLACE_SHELL_NAV_ORDER = [
  "Mission Control",
  "Inbox",
  "Meetings",
  "Stakeholders",
  "Documents",
  "Notifications",
  "Activities",
  "Completed History",
  "Decision Log",
  "Performance",
  "Progress",
  "Achievements",
  "Mastery",
  "Coaching",
] as const;

export type WorkplaceShellNavLabel = (typeof WORKPLACE_SHELL_NAV_ORDER)[number];

/**
 * Shell-visible projection types (excludes `simulation`, which backs the
 * Decision workspace identity projection, not a Workplace shell page).
 */
export const WORKPLACE_SHELL_PROJECTION_TYPES = [
  MISSION_CONTROL_PROJECTION_TYPE,
  INBOX_PROJECTION_TYPE,
  MEETINGS_PROJECTION_TYPE,
  STAKEHOLDERS_PROJECTION_TYPE,
  DOCUMENTS_PROJECTION_TYPE,
  NOTIFICATIONS_PROJECTION_TYPE,
  ACTIVITIES_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  DECISION_LOG_PROJECTION_TYPE,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  PERFORMANCE_PROJECTION_TYPE,
  ACHIEVEMENTS_PROJECTION_TYPE,
  MASTERY_PROJECTION_TYPE,
  COACHING_PROJECTION_TYPE,
] as const satisfies readonly WorkplaceProjectionType[];

export type WorkplaceShellProjectionType =
  (typeof WORKPLACE_SHELL_PROJECTION_TYPES)[number];

export interface WorkplaceConvergenceProjectionEntry {
  readonly projectionType: WorkplaceProjectionType;
  readonly schemaVersion: number;
  readonly shellVisible: boolean;
  readonly shellLabel: WorkplaceShellNavLabel | null;
  readonly workplaceRouteSegment: string | null;
  readonly apiPathSuffix: string;
  /** Representative Domain events that fan out to this projection. */
  readonly sampleRoutedEvents: readonly string[];
  readonly supportsCatchUp: true;
  readonly supportsRebuild: true;
  /**
   * Replay = re-queue retained processing targets (PS-023). Not historical
   * event-store replay.
   */
  readonly supportsRetainedTargetReplay: true;
  readonly authoritativeSource: string;
  readonly notes: string;
}

/**
 * Static convergence coverage manifest. Completeness tests assert every
 * registered production projection type appears here exactly once.
 */
export const WORKPLACE_CONVERGENCE_MANIFEST: readonly WorkplaceConvergenceProjectionEntry[] =
  [
    {
      projectionType: SIMULATION_PROJECTION_TYPE,
      schemaVersion: SIMULATION_PROJECTION_SCHEMA_VERSION,
      shellVisible: false,
      shellLabel: null,
      workplaceRouteSegment: null,
      apiPathSuffix: "projection",
      sampleRoutedEvents: ["SimulationRunStarted", "DecisionResolved"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun aggregate",
      notes:
        "Decision workspace identity projection; not a Workplace shell page.",
    },
    {
      projectionType: MISSION_CONTROL_PROJECTION_TYPE,
      schemaVersion: MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Mission Control",
      workplaceRouteSegment: "mission-control",
      apiPathSuffix: "mission-control",
      sampleRoutedEvents: ["DecisionResolved", "MeetingScheduled"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun aggregate",
      notes:
        "Meeting lifecycle also fans out to Mission Control upcoming count.",
    },
    {
      projectionType: INBOX_PROJECTION_TYPE,
      schemaVersion: INBOX_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Inbox",
      workplaceRouteSegment: "inbox",
      apiPathSuffix: "inbox",
      sampleRoutedEvents: ["LearnerMessageDelivered"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.learnerMessages",
      notes: "LearnerMessageDelivered routes to Inbox only.",
    },
    {
      projectionType: MEETINGS_PROJECTION_TYPE,
      schemaVersion: MEETINGS_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Meetings",
      workplaceRouteSegment: "meetings",
      apiPathSuffix: "meetings",
      sampleRoutedEvents: ["MeetingScheduled", "MeetingCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.meetings",
      notes: "Meeting events fan out to meetings + mission_control.",
    },
    {
      projectionType: STAKEHOLDERS_PROJECTION_TYPE,
      schemaVersion: STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Stakeholders",
      workplaceRouteSegment: "stakeholders",
      apiPathSuffix: "stakeholders",
      sampleRoutedEvents: ["StakeholderInitialized", "StakeholderMessageSent"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.stakeholders (+ conversations)",
      notes: "Stakeholder events route to stakeholders only.",
    },
    {
      projectionType: DOCUMENTS_PROJECTION_TYPE,
      schemaVersion: DOCUMENTS_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Documents",
      workplaceRouteSegment: "documents",
      apiPathSuffix: "documents",
      sampleRoutedEvents: ["DocumentInitialized"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.documents",
      notes: "DocumentInitialized routes to documents only.",
    },
    {
      projectionType: NOTIFICATIONS_PROJECTION_TYPE,
      schemaVersion: NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Notifications",
      workplaceRouteSegment: "notifications",
      apiPathSuffix: "notifications",
      sampleRoutedEvents: ["NotificationInitialized"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.notifications",
      notes: "Distinct from Inbox and Activities.",
    },
    {
      projectionType: ACTIVITIES_PROJECTION_TYPE,
      schemaVersion: ACTIVITIES_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Activities",
      workplaceRouteSegment: "activities",
      apiPathSuffix: "activities",
      sampleRoutedEvents: ["ActivityInitialized", "ActivityCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource: "SimulationRun.activities (active)",
      notes: "ActivityCompleted also fans out to completed_history.",
    },
    {
      projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
      schemaVersion: COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Completed History",
      workplaceRouteSegment: "completed-history",
      apiPathSuffix: "completed-history",
      sampleRoutedEvents: ["ActivityCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun.activities (completed) — derived projection",
      notes:
        "Not a separate authoritative model. Rebuild reads authoritative Activities, never the activities projection.",
    },
    {
      projectionType: DECISION_LOG_PROJECTION_TYPE,
      schemaVersion: DECISION_LOG_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Decision Log",
      workplaceRouteSegment: "decision-log",
      apiPathSuffix: "decision-log",
      sampleRoutedEvents: ["DecisionSubmitted", "DecisionResolved"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun.decisions (+ projection-safe content)",
      notes: "Distinct from Completed History; not a generic event log.",
    },
    {
      projectionType: PERFORMANCE_PROJECTION_TYPE,
      schemaVersion: PERFORMANCE_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Performance",
      workplaceRouteSegment: "performance",
      apiPathSuffix: "performance",
      sampleRoutedEvents: ["DecisionResolved", "ActivityCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun aggregate (+ projection-safe decision summaries)",
      notes:
        "Evidence-only performance summary. No XP/mastery/achievements/reflection.",
    },
    {
      projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
      schemaVersion: LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Progress",
      workplaceRouteSegment: "progress",
      apiPathSuffix: "learner-progression",
      sampleRoutedEvents: ["SimulationRunStarted", "DecisionResolved"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun aggregate (+ projection-safe chapter catalogs)",
      notes:
        "Chapter requirement progress only. No XP/mastery/achievements/reflection.",
    },
    {
      projectionType: ACHIEVEMENTS_PROJECTION_TYPE,
      schemaVersion: ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Achievements",
      workplaceRouteSegment: "achievements",
      apiPathSuffix: "achievements",
      sampleRoutedEvents: ["DecisionResolved", "ActivityCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun aggregate (+ learning-safe achievement conditions)",
      notes:
        "Authored achievement awards only. XP summary availability is unavailable.",
    },
    {
      projectionType: MASTERY_PROJECTION_TYPE,
      schemaVersion: MASTERY_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Mastery",
      workplaceRouteSegment: "mastery",
      apiPathSuffix: "mastery",
      sampleRoutedEvents: ["DecisionResolved", "ActivityCompleted"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "Derived competency evidence aggregation (+ learning-safe content)",
      notes:
        "Competency evidence aggregation. Mastery bands unavailable until authored.",
    },
    {
      projectionType: COACHING_PROJECTION_TYPE,
      schemaVersion: COACHING_PROJECTION_SCHEMA_VERSION,
      shellVisible: true,
      shellLabel: "Coaching",
      workplaceRouteSegment: "coaching",
      apiPathSuffix: "coaching",
      sampleRoutedEvents: ["SimulationRunStarted", "DecisionResolved"],
      supportsCatchUp: true,
      supportsRebuild: true,
      supportsRetainedTargetReplay: true,
      authoritativeSource:
        "SimulationRun aggregate (+ learning-safe coaching interventions)",
      notes:
        "Selected interventions with deterministic fallback text only — no AI.",
    },
  ];

export const multiProjectionFanOutRoutes = (): readonly {
  readonly eventType: string;
  readonly targets: readonly WorkplaceProjectionType[];
}[] => {
  const eventTypes = [
    "ActivityCompleted",
    "MeetingScheduled",
    "MeetingMadeAvailable",
    "MeetingStarted",
    "MeetingCompleted",
    "MeetingCancelled",
    "DecisionResolved",
    "SimulationRunStarted",
  ] as const;
  return eventTypes
    .map((eventType) => ({
      eventType,
      targets: defaultWorkplaceProjectionFanOut(eventType),
    }))
    .filter((entry) => entry.targets.length > 1);
};

export interface RegistryCompletenessResult {
  readonly ok: boolean;
  readonly missingFromManifest: readonly WorkplaceProjectionType[];
  readonly extraInManifest: readonly WorkplaceProjectionType[];
  readonly missingHandlers: readonly WorkplaceProjectionType[];
  readonly shellOrderMismatch: boolean;
  readonly domainTypesDrift: boolean;
  readonly diagnostics: string;
}

/**
 * Assert that the production registry, domain type list, shell nav, and
 * convergence manifest stay aligned.
 */
export const evaluateWorkplaceConvergenceCompleteness = (input: {
  readonly registry: WorkplaceProjectionRegistry;
}): RegistryCompletenessResult => {
  const registered = new Set(input.registry.registeredTypes);
  const manifestTypes = WORKPLACE_CONVERGENCE_MANIFEST.map(
    (entry) => entry.projectionType,
  );
  const manifestSet = new Set(manifestTypes);

  const missingFromManifest = [...registered].filter(
    (type) => !manifestSet.has(type),
  );
  const extraInManifest = manifestTypes.filter((type) => !registered.has(type));
  const missingHandlers = WORKPLACE_PROJECTION_TYPES.filter(
    (type) => !registered.has(type) || !input.registry.handlerFor(type),
  );

  const shellFromManifest = WORKPLACE_CONVERGENCE_MANIFEST.filter(
    (entry) => entry.shellVisible,
  ).map((entry) => entry.shellLabel);
  const shellOrderMismatch =
    shellFromManifest.length !== WORKPLACE_SHELL_NAV_ORDER.length ||
    shellFromManifest.some(
      (label, index) => label !== WORKPLACE_SHELL_NAV_ORDER[index],
    );

  const domainTypesDrift =
    WORKPLACE_PROJECTION_TYPES.length !==
      WORKPLACE_CONVERGENCE_MANIFEST.length ||
    WORKPLACE_PROJECTION_TYPES.some((type) => !manifestSet.has(type));

  const ok =
    missingFromManifest.length === 0 &&
    extraInManifest.length === 0 &&
    missingHandlers.length === 0 &&
    !shellOrderMismatch &&
    !domainTypesDrift &&
    new Set(manifestTypes).size === manifestTypes.length;

  const diagnostics = [
    `registered=[${[...registered].join(",")}]`,
    `manifest=[${manifestTypes.join(",")}]`,
    `missingFromManifest=[${missingFromManifest.join(",")}]`,
    `extraInManifest=[${extraInManifest.join(",")}]`,
    `missingHandlers=[${missingHandlers.join(",")}]`,
    `shellOrderMismatch=${shellOrderMismatch}`,
    `domainTypesDrift=${domainTypesDrift}`,
  ].join(" ");

  return {
    ok,
    missingFromManifest,
    extraInManifest,
    missingHandlers,
    shellOrderMismatch,
    domainTypesDrift,
    diagnostics,
  };
};
