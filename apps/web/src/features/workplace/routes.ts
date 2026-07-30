/**
 * Trusted run-scoped workplace route builders (PS-ROADMAP-013).
 * Destinations are hard-bound — never built from projection payload URLs.
 */

export const workplaceRunPath = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}`;

export const workplaceMissionControlPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/mission-control`;

export const workplaceInboxPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/inbox`;

export const workplaceMeetingsPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/meetings`;

export const workplaceStakeholdersPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/stakeholders`;

export const workplaceDocumentsPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/documents`;

export const workplaceNotificationsPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/notifications`;

export const workplaceActivitiesPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/activities`;

export const workplaceCompletedHistoryPath = (
  simulationRunId: string,
): string => `${workplaceRunPath(simulationRunId)}/completed-history`;

export const workplaceDecisionLogPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/decision-log`;

export const workplacePerformancePath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/performance`;

export const workplaceProgressPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/progress`;

export const workplaceAchievementsPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/achievements`;

export const workplaceMasteryPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/mastery`;

export const workplaceCoachingPath = (simulationRunId: string): string =>
  `${workplaceRunPath(simulationRunId)}/coaching`;

/** Default workplace surface after visiting `/app/runs/:simulationRunId`. */
export const workplaceDefaultChildPath = "mission-control" as const;
