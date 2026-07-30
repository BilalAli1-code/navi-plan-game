/**
 * Content-driven chapter completion (BC-004 / BC-006 W7).
 *
 * Resolves required decisions/activities/meetings and ending notification from
 * the pinned content package, then issues CompleteChapter through the command
 * application service. After a successful advance:
 * - initializes the next chapter's workplace content (commands only)
 * - on the final chapter, selects a deterministic ending and completes the run
 *
 * Never writes projection rows.
 */

import {
  asActivityId,
  asActorId,
  asChapterId,
  asCommandId,
  asCorrelationId,
  asDecisionId,
  asIsoTimestamp,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  buildConditionFactsFromRun,
  isAccepted,
  isExperienceLevel,
  resolveExperienceVariant,
  resolveLocalizedText,
  selectFinalEnding,
  type BusinessCaseContentPackage,
  type CommandError,
  type ExperienceLevel,
  type Result,
  type SimulationCommand,
  err,
  ok,
} from "@projectsim/domain";
import type { SimulationCommandApplicationService } from "../simulation/command-application-service";
import type { SimulationRunLifecycleService } from "../simulation/simulation-run-lifecycle-service";
import { initializeChapterFromContent } from "./initialize-chapter";

export interface CompleteChapterFromContentInput {
  readonly actorId: string;
  readonly simulationRunId: string;
  readonly correlationId: string;
  readonly package: BusinessCaseContentPackage;
  readonly chapterId?: string;
  readonly commandId?: string;
  readonly expectedAggregateVersion?: number | null;
}

export interface CompleteChapterFromContentResult {
  readonly simulationRunId: string;
  readonly chapterId: string;
  readonly nextChapterId: string | null;
  readonly aggregateVersion: number;
  readonly identicalNoop: boolean;
  readonly endingNotificationId: string | null;
  readonly finalEndingOutcomeId: string | null;
  readonly runStatus: string;
  readonly nextChapterInitialized: boolean;
}

const buildChapterEndingSummary = (
  pkg: BusinessCaseContentPackage,
  chapterId: string,
  experienceLevel: ExperienceLevel,
  selectedOptions: ReadonlyMap<string, string>,
  finalEnding: ReturnType<typeof selectFinalEnding>,
): {
  readonly title: string;
  readonly summary: string;
  readonly body: string;
} => {
  const locale = pkg.manifest.defaultLocale;
  const text = (localized: {
    readonly values: Readonly<Record<string, string>>;
  }) => resolveLocalizedText(localized, locale, locale) ?? "";

  const chapter = pkg.chapters.find((entry) => entry.id === chapterId);

  const decisionLines: string[] = [];
  for (const decision of pkg.decisions.filter(
    (d) => d.chapterId === chapterId,
  )) {
    const optionId = selectedOptions.get(decision.id);
    const option = decision.options.find((o) => o.id === optionId);
    const feedbackIds = optionId
      ? (decision.consequenceIdsByOption[optionId] ?? [])
      : [];
    const feedback = pkg.consequences.find((c) => feedbackIds.includes(c.id));
    const feedbackText = feedback
      ? resolveLocalizedText(
          resolveExperienceVariant(feedback.learnerFeedback, experienceLevel),
          locale,
          locale,
        )
      : null;
    decisionLines.push(
      [
        text(decision.title),
        option ? text(option.label) : "unresolved",
        feedbackText,
      ]
        .filter((part): part is string => Boolean(part))
        .join(" — "),
    );
  }

  if (finalEnding) {
    const body = [
      finalEnding.summary,
      "",
      "Decision direction:",
      ...decisionLines.map((line) => `• ${line}`),
      "",
      `Ending resolver: ${finalEnding.resolverVersion}`,
      "",
      "This simulation run is ready for formal closure.",
    ].join("\n");
    return {
      title: finalEnding.title,
      summary: finalEnding.summary,
      body,
    };
  }

  const outcome = pkg.outcomes.find(
    (entry) => entry.id.includes(chapterId) || entry.id.includes("chapter-one"),
  );
  const title = outcome
    ? text(outcome.title)
    : `${chapter ? text(chapter.title) : "Chapter"} complete`;
  const summary = outcome
    ? text(outcome.summary)
    : "Chapter requirements are complete. Review the consequences of your decisions before continuing.";
  const reflection = outcome?.reflectionPrompts?.[0]
    ? text(outcome.reflectionPrompts[0])
    : "Prepare for the next chapter’s stakeholder conflict and delivery uncertainty.";
  const body = [
    summary,
    "",
    "Decision direction:",
    ...decisionLines.map((line) => `• ${line}`),
    "",
    reflection,
    "",
    "Continue when ready for the next chapter obligations.",
  ].join("\n");

  return { title, summary, body };
};

export const completeChapterFromContent = async (
  deps: {
    readonly lifecycle: SimulationRunLifecycleService;
    readonly commands: SimulationCommandApplicationService;
    readonly clock?: () => string;
  },
  input: CompleteChapterFromContentInput,
): Promise<Result<CompleteChapterFromContentResult, CommandError>> => {
  const actorId = asActorId(input.actorId);
  const simulationRunId = asSimulationRunId(input.simulationRunId);
  const correlationId = asCorrelationId(input.correlationId);
  const now = asIsoTimestamp(deps.clock?.() ?? new Date().toISOString());

  const loaded = await deps.lifecycle.load(actorId, simulationRunId);
  if (!loaded.ok) {
    return loaded;
  }

  const run = loaded.value;
  const chapterIdRaw =
    input.chapterId ??
    run.currentChapterId ??
    input.package.chapters.find((c) => c.initialUnlock)?.id ??
    input.package.chapters[0]?.id;
  if (!chapterIdRaw) {
    return err({
      kind: "rule_violation",
      code: "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
      retryable: false,
      message: "No chapter is available to complete.",
    });
  }

  const chapter = input.package.chapters.find((c) => c.id === chapterIdRaw);
  if (!chapter) {
    return err({
      kind: "rule_violation",
      code: "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
      retryable: false,
      message: `Chapter '${chapterIdRaw}' is not defined in the pinned content package.`,
    });
  }

  const chapterId = asChapterId(chapter.id);
  const nextChapter =
    input.package.chapters.find((c) => c.order === chapter.order + 1) ?? null;
  const experienceLevel: ExperienceLevel =
    run.experienceLevel !== null && isExperienceLevel(run.experienceLevel)
      ? run.experienceLevel
      : "practitioner";

  const selectedOptions = new Map(
    run.state.decisions.map((decision) => [
      decision.decisionDefinitionId,
      decision.selectedOptionId,
    ]),
  );

  const finalEnding =
    nextChapter === null
      ? selectFinalEnding(
          input.package.outcomes,
          buildConditionFactsFromRun(run),
        )
      : null;

  const ending = buildChapterEndingSummary(
    input.package,
    chapter.id,
    experienceLevel,
    selectedOptions,
    finalEnding,
  );

  const requiredMeetingIds = input.package.meetings
    .filter((meeting) => meeting.chapterId === chapter.id)
    .map((meeting) => asMeetingId(meeting.id));

  const commandId = asCommandId(
    input.commandId ?? `cmd_complete_chapter_${simulationRunId}_${chapter.id}`,
  );

  const command: SimulationCommand = {
    commandId,
    commandType: "CompleteChapter",
    simulationRunId,
    actorId,
    occurredAt: now,
    correlationId,
    causationId: null,
    expectedVersion:
      input.expectedAggregateVersion === undefined
        ? null
        : input.expectedAggregateVersion,
    payload: {
      chapterId,
      nextChapterId: nextChapter ? asChapterId(nextChapter.id) : null,
      requiredDecisionIds: chapter.requiredDecisionIds.map((id) =>
        asDecisionId(id),
      ),
      requiredActivityIds: chapter.requiredActivityIds.map((id) =>
        asActivityId(id),
      ),
      requiredMeetingIds,
      endingNotification: {
        notificationId: asNotificationId(`notification.${chapter.id}-complete`),
        title: ending.title,
        summary: ending.summary,
        body: ending.body,
      },
      crises: input.package.crises,
      completionWhen: chapter.completionWhen,
    },
  };

  const alreadyCompletedAtStart = run.state.chapterProgress.some(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      (entry as { chapterId?: unknown; status?: unknown }).chapterId ===
        chapter.id &&
      (entry as { status?: unknown }).status === "completed",
  );

  const result = await deps.commands.process(command);
  if (!isAccepted(result)) {
    return err(result.error);
  }

  let aggregateVersion = result.aggregateVersion;
  let nextChapterInitialized = false;
  let runStatus = run.status;

  // Side effects run only on the first successful completion (not idempotent retries).
  if (!alreadyCompletedAtStart && nextChapter !== null) {
    const initialized = await initializeChapterFromContent(deps, {
      actorId: input.actorId,
      simulationRunId: input.simulationRunId,
      correlationId: `${input.correlationId}:init-${nextChapter.id}`,
      package: input.package,
      experienceLevel,
      chapterId: nextChapter.id,
    });
    if (!initialized.ok) {
      return initialized;
    }
    nextChapterInitialized = true;
    const reloaded = await deps.lifecycle.load(actorId, simulationRunId);
    if (reloaded.ok) {
      aggregateVersion = reloaded.value.aggregateVersion;
      runStatus = reloaded.value.status;
    }
  } else if (!alreadyCompletedAtStart && nextChapter === null) {
    const completed = await deps.lifecycle.complete({
      actorId,
      simulationRunId,
      correlationId: asCorrelationId(
        `${input.correlationId}:complete-run-${chapter.id}`,
      ),
      causationId: null,
      expectedAggregateVersion: null,
    });
    if (!completed.ok) {
      return completed;
    }
    aggregateVersion = completed.value.run.aggregateVersion;
    runStatus = completed.value.run.status;
  } else {
    const reloaded = await deps.lifecycle.load(actorId, simulationRunId);
    if (reloaded.ok) {
      aggregateVersion = reloaded.value.aggregateVersion;
      runStatus = reloaded.value.status;
    }
  }

  return ok({
    simulationRunId,
    chapterId,
    nextChapterId: nextChapter?.id ?? null,
    aggregateVersion,
    identicalNoop: alreadyCompletedAtStart,
    endingNotificationId: `notification.${chapter.id}-complete`,
    finalEndingOutcomeId: finalEnding?.outcomeId ?? null,
    runStatus,
    nextChapterInitialized,
  });
};
