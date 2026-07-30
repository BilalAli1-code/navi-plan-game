import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { LearnerMessageOccurrence } from "../simulation/run/learner-message";
import type { DecisionId } from "../shared-kernel/ids";
import type {
  ProjectionSafeContent,
  ProjectionSafeInboxClassification,
  ProjectionSafeMessageDefinition,
} from "./content";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  INBOX_PROJECTION_SCHEMA_VERSION,
  INBOX_PROJECTION_TYPE,
  type InboxCapabilities,
  type InboxMessage,
  type InboxProjection,
} from "./inbox-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildInboxProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

/** Max Unicode code points for deterministic list preview. */
export const INBOX_MESSAGE_PREVIEW_MAX_CODE_POINTS = 160;

const UNSUPPORTED_CAPABILITIES: InboxCapabilities = {
  readState: "unsupported",
  archive: "unsupported",
  reply: "unsupported",
  compose: "unsupported",
};

/**
 * Derive a deterministic learner-safe preview from the authoritative body.
 * Normalizes whitespace; truncates by Unicode code point (not CSS).
 */
export const deriveInboxMessagePreview = (body: string): string => {
  const normalized = body.trim().replace(/\s+/gu, " ");
  const codePoints = Array.from(normalized);
  if (codePoints.length <= INBOX_MESSAGE_PREVIEW_MAX_CODE_POINTS) {
    return normalized;
  }
  return `${codePoints.slice(0, INBOX_MESSAGE_PREVIEW_MAX_CODE_POINTS).join("")}…`;
};

const deriveLinkedDecisionStatus = (
  relatedDecisionId: string | null,
  snapshot: SimulationRunReadSnapshot,
): "none" | "pending" | "submitted" | "resolved" => {
  if (relatedDecisionId === null) {
    return "none";
  }
  const decision = snapshot.decisions.find(
    (entry) => entry.decisionDefinitionId === (relatedDecisionId as DecisionId),
  );
  if (!decision) {
    return "pending";
  }
  if (decision.status === "resolved") {
    return "resolved";
  }
  return "submitted";
};

const deriveActionState = (
  classification: ProjectionSafeInboxClassification,
  linkedDecisionStatus: "none" | "pending" | "submitted" | "resolved",
): "informational" | "action_required" | "completed" => {
  if (classification === "informational") {
    return "informational";
  }
  if (linkedDecisionStatus === "resolved") {
    return "completed";
  }
  return "action_required";
};

const failClosedMessageMetadata = (
  definitionId: string,
): ProjectionSafeMessageDefinition => ({
  id: definitionId,
  classification: "informational",
  relatedDecisionId: null,
  relatedMeetingId: null,
  relatedDocumentIds: [],
  chapterId: null,
});

const toInboxMessage = (
  occurrence: LearnerMessageOccurrence,
  snapshot: SimulationRunReadSnapshot,
  metadataByDefinitionId: ReadonlyMap<string, ProjectionSafeMessageDefinition>,
): InboxMessage => {
  const metadata =
    metadataByDefinitionId.get(occurrence.definitionId) ??
    failClosedMessageMetadata(occurrence.definitionId);
  const linkedDecisionStatus = deriveLinkedDecisionStatus(
    metadata.relatedDecisionId,
    snapshot,
  );
  return {
    messageId: occurrence.occurrenceId,
    definitionId: occurrence.definitionId,
    definitionVersion: occurrence.definitionVersion,
    sequence: occurrence.deliverySequence,
    deliveredAt: occurrence.deliveredAt,
    sender: {
      senderId: occurrence.sender.senderId,
      displayName: occurrence.sender.displayName,
      roleLabel: occurrence.sender.roleLabel,
    },
    subject: occurrence.subject,
    preview: deriveInboxMessagePreview(occurrence.body),
    body: occurrence.body,
    classification: metadata.classification,
    relatedDecisionId: metadata.relatedDecisionId,
    relatedMeetingId: metadata.relatedMeetingId,
    relatedDocumentIds: [...metadata.relatedDocumentIds],
    linkedDecisionStatus,
    actionState: deriveActionState(
      metadata.classification,
      linkedDecisionStatus,
    ),
  };
};

/**
 * Pure Inbox projection builder (PS-ROADMAP-014).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, clock, AI, repository
 * access, aggregate mutation, content re-resolution, or browser logic.
 *
 * Source of truth: authoritative SimulationRun snapshot `learnerMessages`.
 * Only delivered occurrences are present in authoritative state (v1 atomic
 * delivered-and-revealed). Does not read Mission Control or Decision Log.
 *
 * Ordering:
 * - `sequence` = authoritative deliverySequence
 * - `messages` array is newest-first (sequence desc, messageId desc)
 */
export const buildInboxProjection = (
  input: BuildInboxProjectionInput,
): Result<InboxProjection, RuleViolationError> => {
  const { snapshot, projectionContent, generatedAt } = input;

  if (
    projectionContent.contentPackageVersionId !==
    snapshot.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_CONTENT_VERSION_MISMATCH",
        "Projection content version does not match the run contentPackageVersionId.",
      ),
    );
  }

  const metadataByDefinitionId = new Map(
    projectionContent.messages.map((message) => [message.id, message]),
  );

  const occurrences = snapshot.learnerMessages;

  const seenIds = new Set<string>();
  for (const occurrence of occurrences) {
    if (seenIds.has(occurrence.occurrenceId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox source contains duplicate occurrence IDs.",
          { occurrenceId: occurrence.occurrenceId },
        ),
      );
    }
    seenIds.add(occurrence.occurrenceId);
    if (occurrence.deliveryStatus !== "delivered") {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox source contains a non-delivered occurrence.",
          { occurrenceId: occurrence.occurrenceId },
        ),
      );
    }
  }

  // Chronological by deliverySequence; stable tie-break by occurrenceId.
  const chronological = [...occurrences].sort((a, b) => {
    if (a.deliverySequence !== b.deliverySequence) {
      return a.deliverySequence - b.deliverySequence;
    }
    return a.occurrenceId.localeCompare(b.occurrenceId);
  });

  for (let index = 1; index < chronological.length; index += 1) {
    const previous = chronological[index - 1]!;
    const current = chronological[index]!;
    if (current.deliverySequence <= previous.deliverySequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox deliverySequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const messagesChronological = chronological.map((occurrence) =>
    toInboxMessage(occurrence, snapshot, metadataByDefinitionId),
  );
  // Newest-first presentation; sequence remains authoritative identity.
  const messages = [...messagesChronological].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return b.sequence - a.sequence;
    }
    return b.messageId.localeCompare(a.messageId);
  });

  const classificationCounts = {
    informational: 0,
    action_required: 0,
    decision_bearing: 0,
  };
  for (const message of messages) {
    classificationCounts[message.classification] += 1;
  }

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: INBOX_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: INBOX_PROJECTION_TYPE,
    projectionSchemaVersion: INBOX_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    messages,
    summary: {
      totalMessages: messages.length,
      isEmpty: messages.length === 0,
      classificationCounts,
    },
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeInboxSemanticHash(withoutHash),
  });
};

export type SemanticInboxInput = Omit<
  InboxProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticInboxPayload = (
  projection: SemanticInboxInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  messages: projection.messages,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeInboxSemanticHash = (projection: SemanticInboxInput) =>
  computeSemanticHashFromStableValue(semanticInboxPayload(projection));
