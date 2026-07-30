export const catalogListQueryKey = (actorId: string): readonly string[] => [
  "business-cases",
  actorId,
];

export const catalogDetailsQueryKey = (
  businessCaseId: string,
  actorId: string,
): readonly string[] => ["business-cases", businessCaseId, actorId];
