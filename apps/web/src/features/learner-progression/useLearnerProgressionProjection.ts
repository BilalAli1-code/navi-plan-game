import { useQuery } from "@tanstack/react-query";
import type { ApiClient, LearnerProgressionApiResult } from "../../api/client";
import { learnerProgressionQueryKey } from "./queryKeys";

export const useLearnerProgressionProjection = (input: {
  readonly apiClient: ApiClient;
  readonly simulationRunId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
  readonly expectedSourceAggregateVersion?: number | null;
}) =>
  useQuery<LearnerProgressionApiResult>({
    queryKey: learnerProgressionQueryKey(input.simulationRunId, input.actorId),
    enabled: input.enabled !== false && Boolean(input.simulationRunId),
    staleTime: 5_000,
    refetchInterval: (query) => {
      const expected = input.expectedSourceAggregateVersion;
      if (expected === undefined || expected === null) {
        return false;
      }
      const data = query.state.data;
      if (!data) {
        return 250;
      }
      if (
        data.meta.freshness === "current" &&
        data.meta.sourceAggregateVersion >= expected
      ) {
        return false;
      }
      return 250;
    },
    queryFn: async ({ signal }) => {
      const result = await input.apiClient.getLearnerProgression(
        input.simulationRunId,
        signal ? { signal } : {},
      );
      if (result.data.projectionType !== "learner_progression") {
        throw new Error("Unexpected Learner Progression projection type.");
      }
      if (result.data.projectionSchemaVersion !== 1) {
        throw new Error("Unsupported Learner Progression schema version.");
      }
      return result;
    },
  });
