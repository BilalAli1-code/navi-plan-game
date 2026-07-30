import { useQuery } from "@tanstack/react-query";
import type { ApiClient, DecisionLogApiResult } from "../../api/client";
import { decisionLogQueryKey } from "./queryKeys";

export const useDecisionLogProjection = (input: {
  readonly apiClient: ApiClient;
  readonly simulationRunId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
  /** When set, poll until sourceAggregateVersion reaches this value or timeout. */
  readonly expectedSourceAggregateVersion?: number | null;
}) =>
  useQuery<DecisionLogApiResult>({
    queryKey: decisionLogQueryKey(input.simulationRunId, input.actorId),
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
      const result = await input.apiClient.getDecisionLog(
        input.simulationRunId,
        signal ? { signal } : {},
      );
      if (result.data.projectionType !== "decision_log") {
        throw new Error("Unexpected Decision Log projection type.");
      }
      if (result.data.projectionSchemaVersion !== 1) {
        throw new Error("Unsupported Decision Log schema version.");
      }
      return result;
    },
  });
