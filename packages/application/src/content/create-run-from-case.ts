/**
 * Server-authoritative Simulation Run creation from case + experience level (BC-003).
 *
 * The client must not supply an authoritative contentPackageVersionId.
 * The server resolves the selectable published default version and pins it.
 */

import {
  asActorId,
  asChapterId,
  asCorrelationId,
  asCausationId,
  asSimulationRunId,
  buildInitialProjectMetricsFromPackage,
  CURRENT_RUNTIME_COMPATIBILITY,
  isExperienceLevel,
  isSelectableForNewRuns,
  ruleViolationError,
  validationError,
  type CommandError,
  type ContentValidationResult,
  type Result,
  err,
  ok,
} from "@projectsim/domain";
import type { SimulationRunLifecycleService } from "../simulation/simulation-run-lifecycle-service";
import type {
  BusinessCaseRegistry,
  CreateSimulationRunFromCaseInput,
  CreateSimulationRunFromCaseResult,
} from "./ports";

export interface CreateSimulationRunFromCaseDeps {
  readonly registry: BusinessCaseRegistry;
  readonly lifecycle: SimulationRunLifecycleService;
  readonly getValidationResult: (
    contentPackageVersionId: string,
  ) => ContentValidationResult;
  readonly runtimeVersion?: string;
}

const unauthorizedVersion = (): CommandError =>
  ruleViolationError(
    "CONTENT_PACKAGE_VERSION_IMMUTABLE",
    "Client-supplied content package version is not authorized for new-run selection.",
  );

const unavailableCase = (businessCaseId: string): CommandError =>
  ruleViolationError(
    "DECISION_DEFINITION_NOT_FOUND",
    `No selectable published version is available for business case '${businessCaseId}'.`,
    { businessCaseId },
  );

export const createSimulationRunFromCase = async (
  deps: CreateSimulationRunFromCaseDeps,
  input: CreateSimulationRunFromCaseInput,
): Promise<Result<CreateSimulationRunFromCaseResult, CommandError>> => {
  if (!isExperienceLevel(input.experienceLevel)) {
    return err(
      validationError(
        [
          {
            path: "experienceLevel",
            reason: "invalid",
            message: `Unsupported experience level '${String(input.experienceLevel)}'.`,
          },
        ],
        "experienceLevel is invalid.",
      ),
    );
  }

  const resolved = await deps.registry.resolveDefaultPublishedVersion(
    input.businessCaseId,
  );
  if (!resolved) {
    return err(unavailableCase(input.businessCaseId));
  }

  if (
    input.clientContentPackageVersionId !== undefined &&
    input.clientContentPackageVersionId !== resolved.contentPackageVersionId
  ) {
    return err(unauthorizedVersion());
  }

  const validation = deps.getValidationResult(resolved.contentPackageVersionId);
  if (!isSelectableForNewRuns(resolved.package, validation)) {
    return err(unavailableCase(input.businessCaseId));
  }

  if (
    !resolved.package.manifest.supportedExperienceLevels.includes(
      input.experienceLevel,
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_NOT_ELIGIBLE",
        `Experience level '${input.experienceLevel}' is not supported by case '${input.businessCaseId}'.`,
        {
          businessCaseId: input.businessCaseId,
          experienceLevel: input.experienceLevel,
        },
      ),
    );
  }

  if (resolved.runtimeCompatibility !== CURRENT_RUNTIME_COMPATIBILITY) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        `Runtime compatibility '${resolved.runtimeCompatibility}' is not supported.`,
      ),
    );
  }

  const initialChapterId =
    resolved.package.chapters.find((chapter) => chapter.initialUnlock)?.id ??
    resolved.package.chapters[0]?.id ??
    null;

  const created = await deps.lifecycle.create({
    actorId: asActorId(input.actorId),
    learnerId: input.learnerId,
    businessCaseId: input.businessCaseId,
    contentPackageVersionId: resolved.contentPackageVersionId,
    experienceLevel: input.experienceLevel,
    runtimeVersion: deps.runtimeVersion ?? CURRENT_RUNTIME_COMPATIBILITY,
    correlationId: asCorrelationId(input.correlationId),
    causationId:
      input.causationId === null ? null : asCausationId(input.causationId),
    initialProjectMetrics: buildInitialProjectMetricsFromPackage(
      resolved.package,
    ),
    ...(initialChapterId !== null
      ? { currentChapterId: asChapterId(initialChapterId) }
      : {}),
    ...(input.simulationRunId !== undefined
      ? { simulationRunId: asSimulationRunId(input.simulationRunId) }
      : {}),
  });

  if (!created.ok) {
    return created;
  }

  return ok({
    simulationRunId: created.value.run.id,
    businessCaseId: created.value.run.businessCaseId,
    contentVersion: resolved.contentVersion,
    contentPackageVersionId: created.value.run.contentPackageVersionId,
    experienceLevel: input.experienceLevel,
    status: created.value.run.status,
    runtimeVersion: created.value.run.runtimeVersion,
  });
};
