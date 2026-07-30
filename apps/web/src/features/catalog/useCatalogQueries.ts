import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ApiClient,
  BusinessCaseDetailsApiResult,
  BusinessCaseListApiResult,
  CreateSimulationRunApiResult,
  ExperienceLevel,
} from "../../api/client";
import { catalogDetailsQueryKey, catalogListQueryKey } from "./queryKeys";

export const useBusinessCaseList = (input: {
  readonly apiClient: ApiClient;
  readonly actorId: string;
  readonly enabled?: boolean;
}) =>
  useQuery<BusinessCaseListApiResult>({
    queryKey: catalogListQueryKey(input.actorId),
    enabled: input.enabled !== false,
    staleTime: 30_000,
    queryFn: async ({ signal }) =>
      input.apiClient.listBusinessCases(signal ? { signal } : {}),
  });

export const useBusinessCaseDetails = (input: {
  readonly apiClient: ApiClient;
  readonly businessCaseId: string;
  readonly actorId: string;
  readonly enabled?: boolean;
}) =>
  useQuery<BusinessCaseDetailsApiResult>({
    queryKey: catalogDetailsQueryKey(input.businessCaseId, input.actorId),
    enabled: input.enabled !== false && Boolean(input.businessCaseId),
    staleTime: 30_000,
    queryFn: async ({ signal }) =>
      input.apiClient.getBusinessCase(
        input.businessCaseId,
        signal ? { signal } : {},
      ),
  });

export const useCreateSimulationRun = (input: {
  readonly apiClient: ApiClient;
}) =>
  useMutation<
    CreateSimulationRunApiResult,
    Error,
    {
      readonly businessCaseId: string;
      readonly experienceLevel: ExperienceLevel;
      readonly contentPackageVersionId?: string;
    }
  >({
    mutationFn: (vars) =>
      input.apiClient.createSimulationRun({
        businessCaseId: vars.businessCaseId,
        experienceLevel: vars.experienceLevel,
        ...(vars.contentPackageVersionId !== undefined
          ? { contentPackageVersionId: vars.contentPackageVersionId }
          : {}),
      }),
  });
