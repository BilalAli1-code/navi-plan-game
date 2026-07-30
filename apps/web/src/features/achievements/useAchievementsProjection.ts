import { useQuery } from "@tanstack/react-query";
import type { ApiClient, AchievementsApiResult } from "../../api/client";
import { achievementsQueryKey } from "./queryKeys";

export const useAchievementsProjection = (input: {
  readonly apiClient: ApiClient;
  readonly simulationRunId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
  readonly expectedSourceAggregateVersion?: number | null;
}) =>
  useQuery<AchievementsApiResult>({
    queryKey: achievementsQueryKey(input.simulationRunId, input.actorId),
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
      const result = await input.apiClient.getAchievements(
        input.simulationRunId,
        signal ? { signal } : {},
      );
      if (result.data.projectionType !== "achievements") {
        throw new Error("Unexpected Achievements projection type.");
      }
      if (result.data.projectionSchemaVersion !== 1) {
        throw new Error("Unsupported Achievements schema version.");
      }
      return result;
    },
  });
