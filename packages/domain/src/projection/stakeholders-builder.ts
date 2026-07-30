import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  StakeholderConversation,
  StakeholderRuntime,
} from "../simulation/run/stakeholder";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import type { SimulationRunReadSnapshot } from "./read-snapshot";
import {
  STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
  STAKEHOLDERS_PROJECTION_TYPE,
  type StakeholdersCapabilities,
  type StakeholdersConversationItem,
  type StakeholdersItem,
  type StakeholdersMessageItem,
  type StakeholdersProjection,
  type StakeholdersSummary,
} from "./stakeholders-contracts";

export interface BuildStakeholdersProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: StakeholdersCapabilities = {
  sendMessage: "unsupported",
  editProfile: "unsupported",
};

const LEARNER_AUTHOR = {
  kind: "learner",
  label: "You",
} as const;

const toConversation = (
  conversation: StakeholderConversation,
): Result<StakeholdersConversationItem, RuleViolationError> => {
  const seenMessageIds = new Set<string>();
  const ordered = [...conversation.messages].sort((a, b) => {
    if (a.conversationSequence !== b.conversationSequence) {
      return a.conversationSequence - b.conversationSequence;
    }
    return a.messageId.localeCompare(b.messageId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.conversationSequence <= previous.conversationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholder message conversationSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const messages: StakeholdersMessageItem[] = [];
  for (const message of ordered) {
    if (seenMessageIds.has(message.messageId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders conversation contains duplicate message IDs.",
          { messageId: message.messageId },
        ),
      );
    }
    seenMessageIds.add(message.messageId);
    if (message.direction !== "learner_to_stakeholder") {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Unsupported Stakeholder message direction '${message.direction}'.`,
        ),
      );
    }
    messages.push({
      messageId: message.messageId,
      conversationSequence: message.conversationSequence,
      direction: message.direction,
      author: LEARNER_AUTHOR,
      body: message.body,
      occurredAt: message.occurredAt,
    });
  }

  return ok({
    conversationId: conversation.conversationId,
    messages,
  });
};

const toStakeholdersItem = (
  stakeholder: StakeholderRuntime,
  conversation: StakeholderConversation | undefined,
): Result<StakeholdersItem, RuleViolationError> => {
  let conversationItem: StakeholdersConversationItem | null = null;
  if (conversation) {
    if (conversation.stakeholderId !== stakeholder.stakeholderId) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholder conversation owner does not match Stakeholder identity.",
        ),
      );
    }
    const mapped = toConversation(conversation);
    if (!mapped.ok) {
      return mapped;
    }
    conversationItem = mapped.value;
  }

  return ok({
    stakeholderId: stakeholder.stakeholderId,
    stakeholderDefinitionId: stakeholder.stakeholderDefinitionId,
    stakeholderDefinitionVersion: stakeholder.stakeholderDefinitionVersion,
    initializationSequence: stakeholder.initializationSequence,
    profile: {
      displayName: stakeholder.profile.displayName,
      roleLabel: stakeholder.profile.roleLabel,
      organization: stakeholder.profile.organization,
      department: stakeholder.profile.department,
      biography: stakeholder.profile.biography,
    },
    conversation: conversationItem,
  });
};

const summarize = (
  stakeholders: readonly StakeholdersItem[],
): StakeholdersSummary => {
  let stakeholdersWithConversation = 0;
  let totalMessages = 0;
  for (const stakeholder of stakeholders) {
    if (stakeholder.conversation) {
      stakeholdersWithConversation += 1;
      totalMessages += stakeholder.conversation.messages.length;
    }
  }
  return {
    totalStakeholders: stakeholders.length,
    stakeholdersWithConversation,
    totalMessages,
    isEmpty: stakeholders.length === 0,
  };
};

/**
 * Pure Stakeholders projection builder (PS-ROADMAP-019).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, clock, AI, repository
 * access, aggregate mutation, or browser lifecycle inference.
 *
 * Source of truth: authoritative SimulationRun snapshot stakeholders +
 * stakeholderConversations.
 * Ordering: initializationSequence ascending; stable tie-break by StakeholderId.
 * Conversations: null until authoritative conversation exists (no fabricated IDs).
 * Author display: stable `{ kind: "learner", label: "You" }` for v1 directions.
 */
export const buildStakeholdersProjection = (
  input: BuildStakeholdersProjectionInput,
): Result<StakeholdersProjection, RuleViolationError> => {
  const { snapshot, generatedAt } = input;
  const runtimes = snapshot.stakeholders;
  const conversations = snapshot.stakeholderConversations;

  const seenStakeholderIds = new Set<string>();
  for (const stakeholder of runtimes) {
    if (seenStakeholderIds.has(stakeholder.stakeholderId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders source contains duplicate Stakeholder IDs.",
          { stakeholderId: stakeholder.stakeholderId },
        ),
      );
    }
    seenStakeholderIds.add(stakeholder.stakeholderId);
  }

  const conversationByStakeholder = new Map<string, StakeholderConversation>();
  const seenConversationIds = new Set<string>();
  for (const conversation of conversations) {
    if (seenConversationIds.has(conversation.conversationId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders source contains duplicate conversation IDs.",
          { conversationId: conversation.conversationId },
        ),
      );
    }
    seenConversationIds.add(conversation.conversationId);
    if (conversationByStakeholder.has(conversation.stakeholderId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders source contains more than one conversation per Stakeholder.",
          { stakeholderId: conversation.stakeholderId },
        ),
      );
    }
    if (!seenStakeholderIds.has(conversation.stakeholderId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders conversation references an unknown Stakeholder.",
          { stakeholderId: conversation.stakeholderId },
        ),
      );
    }
    conversationByStakeholder.set(conversation.stakeholderId, conversation);
  }

  const ordered = [...runtimes].sort((a, b) => {
    if (a.initializationSequence !== b.initializationSequence) {
      return a.initializationSequence - b.initializationSequence;
    }
    return a.stakeholderId.localeCompare(b.stakeholderId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.initializationSequence <= previous.initializationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholder initializationSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const stakeholders: StakeholdersItem[] = [];
  for (const stakeholder of ordered) {
    const mapped = toStakeholdersItem(
      stakeholder,
      conversationByStakeholder.get(stakeholder.stakeholderId),
    );
    if (!mapped.ok) {
      return mapped;
    }
    stakeholders.push(mapped.value);
  }

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: STAKEHOLDERS_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: STAKEHOLDERS_PROJECTION_TYPE,
    projectionSchemaVersion: STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    stakeholders,
    summary: summarize(stakeholders),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeStakeholdersSemanticHash(withoutHash),
  });
};

export type SemanticStakeholdersInput = Omit<
  StakeholdersProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticStakeholdersPayload = (
  projection: SemanticStakeholdersInput,
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
  stakeholders: projection.stakeholders,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeStakeholdersSemanticHash = (
  projection: SemanticStakeholdersInput,
) =>
  computeSemanticHashFromStableValue(semanticStakeholdersPayload(projection));
