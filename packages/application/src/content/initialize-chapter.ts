/**
 * Content-driven Chapter One (or first unlocked chapter) initialization (BC-004).
 *
 * Issues authoritative commands only — never writes projection rows.
 * Idempotent / retry-safe via command-level identical-noop semantics.
 */

import {
  asActivityId,
  asActorId,
  asChapterId,
  asCommandId,
  asCorrelationId,
  asDocumentId,
  asIsoTimestamp,
  asLearnerMessageDefinitionId,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  isAccepted,
  resolveLocalizedText,
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

export interface InitializeChapterFromContentInput {
  readonly actorId: string;
  readonly simulationRunId: string;
  readonly correlationId: string;
  readonly package: BusinessCaseContentPackage;
  readonly experienceLevel: ExperienceLevel;
  readonly chapterId?: string;
}

export interface InitializeChapterFromContentResult {
  readonly simulationRunId: string;
  readonly chapterId: string;
  readonly initialized: {
    readonly stakeholders: number;
    readonly documents: number;
    readonly notifications: number;
    readonly activities: number;
    readonly messages: number;
    readonly meetings: number;
  };
  readonly status: string;
}

const nextCommand = (
  base: Omit<SimulationCommand, "commandId" | "commandType" | "payload"> & {
    readonly commandType: SimulationCommand["commandType"];
    readonly payload: SimulationCommand["payload"];
  },
  chapterId: string,
  index: number,
): SimulationCommand =>
  ({
    ...base,
    // Chapter-scoped command IDs prevent cross-chapter idempotency collisions
    // when later chapters are initialized after CompleteChapter (BC-006 W7).
    commandId: asCommandId(
      `cmd_init_${base.simulationRunId}_${chapterId}_${index}`,
    ),
  }) as SimulationCommand;

export const initializeChapterFromContent = async (
  deps: {
    readonly lifecycle: SimulationRunLifecycleService;
    readonly commands: SimulationCommandApplicationService;
    readonly clock?: () => string;
  },
  input: InitializeChapterFromContentInput,
): Promise<Result<InitializeChapterFromContentResult, CommandError>> => {
  const actorId = asActorId(input.actorId);
  const simulationRunId = asSimulationRunId(input.simulationRunId);
  const correlationId = asCorrelationId(input.correlationId);
  const now = asIsoTimestamp(deps.clock?.() ?? new Date().toISOString());

  const loaded = await deps.lifecycle.load(actorId, simulationRunId);
  if (!loaded.ok) {
    return loaded;
  }

  let status = loaded.value.status;
  if (status === "created") {
    const started = await deps.lifecycle.start({
      actorId,
      simulationRunId,
      correlationId,
      causationId: null,
      expectedAggregateVersion: null,
    });
    if (!started.ok) {
      return started;
    }
    status = started.value.run.status;
  }

  const chapterId =
    input.chapterId ??
    input.package.chapters.find((c) => c.initialUnlock)?.id ??
    input.package.chapters[0]?.id;
  if (!chapterId) {
    return err({
      kind: "rule_violation",
      code: "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
      retryable: false,
      message: "Content package has no initial chapter to initialize.",
    });
  }

  const locale = input.package.manifest.defaultLocale;
  const text = (localized: {
    readonly values: Readonly<Record<string, string>>;
  }) => resolveLocalizedText(localized, locale, locale) ?? "";

  const stakeholders = input.package.stakeholders;
  const documents = input.package.documents.filter(
    (d) => d.chapterId === null || d.chapterId === chapterId,
  );
  const notifications = input.package.notifications.filter(
    (n) => n.chapterId === null || n.chapterId === chapterId,
  );
  const activities = input.package.activities.filter(
    (a) => a.chapterId === chapterId,
  );
  const messages = input.package.messages.filter(
    (m) => m.chapterId === chapterId,
  );
  const meetings = input.package.meetings.filter(
    (m) => m.chapterId === chapterId,
  );

  let commandIndex = 0;
  const envelopeBase = {
    simulationRunId,
    actorId,
    occurredAt: now,
    correlationId,
    causationId: null as null,
    expectedVersion: null as null,
  };

  const process = async (
    command: SimulationCommand,
  ): Promise<Result<void, CommandError>> => {
    const result = await deps.commands.process(command);
    if (isAccepted(result)) {
      return ok(undefined);
    }
    return err(result.error);
  };

  for (const stakeholder of stakeholders) {
    const command = nextCommand(
      {
        ...envelopeBase,
        commandType: "InitializeStakeholder",
        payload: {
          stakeholderId: asStakeholderId(stakeholder.id),
          definitionVersion: input.package.manifest.contentVersion,
          displayName: text(stakeholder.displayName),
          roleLabel: text(stakeholder.roleTitle),
          organization: text(stakeholder.organization),
          biography: text(stakeholder.profileSummary),
        },
      },
      chapterId,
      commandIndex++,
    );
    const result = await process(command);
    if (!result.ok) return result;
  }

  for (const document of documents) {
    const command = nextCommand(
      {
        ...envelopeBase,
        commandType: "InitializeDocument",
        payload: {
          documentId: asDocumentId(document.id),
          definitionVersion: input.package.manifest.contentVersion,
          title: text(document.title),
          body: text(document.body ?? document.summary),
          category: document.documentType,
          description: text(document.summary),
        },
      },
      chapterId,
      commandIndex++,
    );
    const result = await process(command);
    if (!result.ok) return result;
  }

  for (const notification of notifications) {
    const command = nextCommand(
      {
        ...envelopeBase,
        commandType: "InitializeNotification",
        payload: {
          notificationId: asNotificationId(notification.id),
          title: text(notification.title),
          summary: text(notification.summary),
          ...(notification.body ? { body: text(notification.body) } : {}),
          sourceKind: "authored_consequence" as const,
          sourceId: notification.id,
          sourceReason: "chapter_initialization",
        },
      },
      chapterId,
      commandIndex++,
    );
    const result = await process(command);
    if (!result.ok) return result;
  }

  for (const activity of activities) {
    const command = nextCommand(
      {
        ...envelopeBase,
        commandType: "InitializeActivity",
        payload: {
          activityId: asActivityId(activity.id),
          title: text(activity.title),
          summary: text(activity.instructions.default),
          sourceKind: "authored_consequence" as const,
          sourceId: activity.id,
          sourceReason: "chapter_initialization",
        },
      },
      chapterId,
      commandIndex++,
    );
    const result = await process(command);
    if (!result.ok) return result;
  }

  for (const meeting of meetings) {
    const participantDisplayNames: Record<string, string> = {};
    for (const sid of meeting.participantStakeholderIds) {
      const stakeholder = stakeholders.find((s) => s.id === sid);
      participantDisplayNames[sid] = stakeholder
        ? text(stakeholder.displayName)
        : sid;
    }
    const schedule = nextCommand(
      {
        ...envelopeBase,
        commandType: "ScheduleMeeting",
        payload: {
          meetingId: asMeetingId(meeting.id),
          title: text(meeting.title),
          scheduledFor: now,
          participantIds: meeting.participantStakeholderIds.map((id) =>
            asStakeholderId(id),
          ),
          agenda: text(meeting.purpose),
          definitionVersion: input.package.manifest.contentVersion,
          durationMinutes: meeting.estimatedMinutes,
          participantDisplayNames,
        },
      },
      chapterId,
      commandIndex++,
    );
    const scheduled = await process(schedule);
    if (!scheduled.ok) return scheduled;

    const available = nextCommand(
      {
        ...envelopeBase,
        commandType: "MakeMeetingAvailable",
        payload: { meetingId: asMeetingId(meeting.id) },
      },
      chapterId,
      commandIndex++,
    );
    const madeAvailable = await process(available);
    if (!madeAvailable.ok) return madeAvailable;
  }

  for (const message of messages) {
    const sender = message.senderStakeholderId
      ? stakeholders.find((s) => s.id === message.senderStakeholderId)
      : null;
    const command = nextCommand(
      {
        ...envelopeBase,
        commandType: "DeliverLearnerMessage",
        payload: {
          messageDefinitionId: asLearnerMessageDefinitionId(message.id),
          definitionVersion: input.package.manifest.contentVersion,
          senderId: message.senderStakeholderId,
          senderDisplayName: sender
            ? text(sender.displayName)
            : "Program Office",
          senderRoleLabel: sender ? text(sender.roleTitle) : "System",
          subject: message.subject
            ? text(message.subject)
            : text(message.body).slice(0, 80),
          body: text(message.body),
        },
      },
      chapterId,
      commandIndex++,
    );
    const result = await process(command);
    if (!result.ok) return result;
  }

  // Pin current chapter after initialization (create already may have null).
  void asChapterId(chapterId);
  void input.experienceLevel;

  const reloaded = await deps.lifecycle.load(actorId, simulationRunId);
  if (!reloaded.ok) {
    return reloaded;
  }

  return ok({
    simulationRunId,
    chapterId,
    initialized: {
      stakeholders: stakeholders.length,
      documents: documents.length,
      notifications: notifications.length,
      activities: activities.length,
      messages: messages.length,
      meetings: meetings.length,
    },
    status: reloaded.value.status,
  });
};
