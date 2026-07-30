/**
 * Trusted internal Decision workspace route helper.
 * Never renders arbitrary payload URLs.
 */
export const decisionWorkspacePath = (
  simulationRunId: string,
  decisionDefinitionId?: string,
): string => {
  const base = `/app/runs/${encodeURIComponent(simulationRunId)}/decisions`;
  if (!decisionDefinitionId) {
    return base;
  }
  return `${base}?decision=${encodeURIComponent(decisionDefinitionId)}`;
};
