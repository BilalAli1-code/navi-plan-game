import { useQuery } from "@tanstack/react-query";
import type { ApiClient, StakeholdersApiResult } from "../../api/client";
import { stakeholdersQueryKey } from "./queryKeys";

export const useStakeholdersProjection = (input: {
  readonly apiClient: ApiClient;
  readonly simulationRunId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
  /** When set, poll until sourceAggregateVersion reaches this value or timeout. */
  readonly expectedSourceAggregateVersion?: number | null;
}) =>
  useQuery<StakeholdersApiResult>({
    queryKey: stakeholdersQueryKey(input.simulationRunId, input.actorId),
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
      const result = await input.apiClient.getStakeholders(
        input.simulationRunId,
        signal ? { signal } : {},
      );
      if (result.data.projectionType !== "stakeholders") {
        throw new Error("Unexpected Stakeholders projection type.");
      }
      if (result.data.projectionSchemaVersion !== 1) {
        throw new Error("Unsupported Stakeholders schema version.");
      }
      return result;
    },
  });
