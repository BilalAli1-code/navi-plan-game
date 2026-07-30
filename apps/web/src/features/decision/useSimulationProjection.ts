import { useQuery } from "@tanstack/react-query";
import type { DecisionWorkspaceViewModel } from "@projectsim/ui";
import type { ApiClient, ProjectionApiResult } from "../../api/client";
import { simulationProjectionQueryKey } from "./queryKeys";

export const toDecisionWorkspaceViewModel = (
  result: ProjectionApiResult,
): DecisionWorkspaceViewModel => ({
  simulationRunId: result.data.simulationRunId,
  freshness: result.meta.freshness,
  sourceAggregateVersion: result.meta.sourceAggregateVersion,
  runStatus: result.data.run.status,
  projectStatus: result.data.project.status,
  metrics: result.data.project.metrics,
  availableDecisions: result.data.availableDecisions.map((decision) => ({
    decisionDefinitionId: decision.decisionDefinitionId,
    title: decision.title,
    prompt: decision.prompt,
    description: decision.description,
    expiresAt: decision.expiresAt,
    authoredOrder: decision.authoredOrder,
    options: decision.options,
  })),
  decisionHistory: result.data.decisionHistory,
});

export const useSimulationProjection = (input: {
  readonly apiClient: ApiClient;
  readonly simulationRunId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
}) =>
  useQuery({
    queryKey: simulationProjectionQueryKey(
      input.simulationRunId,
      input.actorId,
    ),
    enabled: input.enabled !== false && Boolean(input.simulationRunId),
    staleTime: 5_000,
    queryFn: async () => {
      const result = await input.apiClient.getProjection(input.simulationRunId);
      return {
        result,
        model: toDecisionWorkspaceViewModel(result),
      };
    },
  });
