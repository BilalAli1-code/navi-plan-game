import type {
  RuleViolationCode,
  RuleViolationError,
} from "../../shared-kernel/errors";
import { ruleViolationError } from "../../shared-kernel/errors";
import type {
  ActorId,
  CommandId,
  ConversationId,
  MessageId,
  StakeholderId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Stakeholder runtime state owned by SimulationRun (PS-ROADMAP-018).
 *
 * Distinct from authored content definitions and from the reserved
 * `stakeholders` projection (PS-019). Relationship scoring (trust/influence/
 * sentiment aggregates) is intentionally out of v1 — Core continues to emit
 * `StakeholderSignalEmitted` without duplicating those signals here.
 */

export const STAKEHOLDER_DISPLAY_NAME_MAX_LENGTH = 120;
export const STAKEHOLDER_ROLE_LABEL_MAX_LENGTH = 120;
export const STAKEHOLDER_ORGANIZATION_MAX_LENGTH = 120;
export const STAKEHOLDER_DEPARTMENT_MAX_LENGTH = 120;
export const STAKEHOLDER_BIOGRAPHY_MAX_LENGTH = 4000;
export const STAKEHOLDER_DEFINITION_VERSION_MAX_LENGTH = 64;
export const STAKEHOLDER_MESSAGE_BODY_MAX_LENGTH = 4000;

export const stakeholderMessageDirections = ["learner_to_stakeholder"] as const;

export type StakeholderMessageDirection =
  (typeof stakeholderMessageDirections)[number];

export const isStakeholderMessageDirection = (
  value: string,
): value is StakeholderMessageDirection =>
  (stakeholderMessageDirections as readonly string[]).includes(value);

/** Learner-safe profile snapshot pinned at initialization. */
export interface StakeholderLearnerSafeProfile {
  readonly displayName: string;
  readonly roleLabel: string | null;
  readonly organization: string | null;
  readonly department: string | null;
  readonly biography: string | null;
}

/**
 * One runtime Stakeholder per StakeholderId per SimulationRun.
 *
 * Identity: StakeholderId (content definition identity). Ordering:
 * monotonic initializationSequence (1-based).
 */
export interface StakeholderRuntime {
  readonly stakeholderId: StakeholderId;
  /** Content definition identity (v1: same as stakeholderId). */
  readonly stakeholderDefinitionId: StakeholderId;
  readonly stakeholderDefinitionVersion: string;
  /** 1-based monotonic initialization order within the run. */
  readonly initializationSequence: number;
  readonly profile: StakeholderLearnerSafeProfile;
  readonly initializedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export interface StakeholderMessageOccurrence {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  /** 1-based monotonic order within the conversation. */
  readonly conversationSequence: number;
  readonly direction: StakeholderMessageDirection;
  readonly authorActorId: ActorId;
  readonly body: string;
  readonly occurredAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

/**
 * One conversation per runtime Stakeholder (v1 cardinality).
 * Identity: `conversation:${stakeholderId}`.
 */
export interface StakeholderConversation {
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly openedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
  readonly messages: readonly StakeholderMessageOccurrence[];
}

const requireBoundedNonEmpty = (
  value: string,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string, RuleViolationError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(
      ruleViolationError(
        code,
        `Stakeholder.${field} must be a non-empty string.`,
        {
          field,
        },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Stakeholder.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Stakeholder.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

const requireOptionalBounded = (
  value: string | null | undefined,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return ok(null);
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Stakeholder.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Stakeholder.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

export const createStakeholderLearnerSafeProfile = (input: {
  readonly displayName: string;
  readonly roleLabel?: string | null;
  readonly organization?: string | null;
  readonly department?: string | null;
  readonly biography?: string | null;
}): Result<StakeholderLearnerSafeProfile, RuleViolationError> => {
  const displayName = requireBoundedNonEmpty(
    input.displayName,
    "displayName",
    STAKEHOLDER_DISPLAY_NAME_MAX_LENGTH,
    "STAKEHOLDER_PROFILE_INVALID",
  );
  if (!displayName.ok) {
    return displayName;
  }
  const roleLabel = requireOptionalBounded(
    input.roleLabel,
    "roleLabel",
    STAKEHOLDER_ROLE_LABEL_MAX_LENGTH,
    "STAKEHOLDER_PROFILE_INVALID",
  );
  if (!roleLabel.ok) {
    return roleLabel;
  }
  const organization = requireOptionalBounded(
    input.organization,
    "organization",
    STAKEHOLDER_ORGANIZATION_MAX_LENGTH,
    "STAKEHOLDER_PROFILE_INVALID",
  );
  if (!organization.ok) {
    return organization;
  }
  const department = requireOptionalBounded(
    input.department,
    "department",
    STAKEHOLDER_DEPARTMENT_MAX_LENGTH,
    "STAKEHOLDER_PROFILE_INVALID",
  );
  if (!department.ok) {
    return department;
  }
  const biography = requireOptionalBounded(
    input.biography,
    "biography",
    STAKEHOLDER_BIOGRAPHY_MAX_LENGTH,
    "STAKEHOLDER_PROFILE_INVALID",
  );
  if (!biography.ok) {
    return biography;
  }
  return ok({
    displayName: displayName.value,
    roleLabel: roleLabel.value,
    organization: organization.value,
    department: department.value,
    biography: biography.value,
  });
};

export const createStakeholderRuntime = (input: {
  readonly stakeholderId: StakeholderId;
  readonly stakeholderDefinitionVersion: string;
  readonly initializationSequence: number;
  readonly profile: StakeholderLearnerSafeProfile;
  readonly initializedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}): Result<StakeholderRuntime, RuleViolationError> => {
  if (input.stakeholderId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_IDENTITY_INVALID",
        "Stakeholder.stakeholderId must be non-empty.",
      ),
    );
  }
  const definitionVersion = requireBoundedNonEmpty(
    input.stakeholderDefinitionVersion,
    "stakeholderDefinitionVersion",
    STAKEHOLDER_DEFINITION_VERSION_MAX_LENGTH,
    "STAKEHOLDER_DEFINITION_INVALID",
  );
  if (!definitionVersion.ok) {
    return definitionVersion;
  }
  if (
    !Number.isInteger(input.initializationSequence) ||
    input.initializationSequence < 1
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_SEQUENCE_INVALID",
        "Stakeholder.initializationSequence must be a positive integer.",
        { initializationSequence: input.initializationSequence },
      ),
    );
  }
  if (Number.isNaN(Date.parse(input.initializedAt))) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_OCCURRENCE_INVALID",
        "Stakeholder.initializedAt must be a valid ISO timestamp.",
      ),
    );
  }
  if (input.originatingCommandId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_OCCURRENCE_INVALID",
        "Stakeholder.originatingCommandId must be non-empty.",
      ),
    );
  }
  return ok({
    stakeholderId: input.stakeholderId,
    stakeholderDefinitionId: input.stakeholderId,
    stakeholderDefinitionVersion: definitionVersion.value,
    initializationSequence: input.initializationSequence,
    profile: input.profile,
    initializedAt: asIsoTimestamp(input.initializedAt),
    originatingCommandId: input.originatingCommandId,
  });
};

export const stakeholderRuntimeSemanticEqual = (
  left: StakeholderRuntime,
  right: StakeholderRuntime,
): boolean =>
  left.stakeholderId === right.stakeholderId &&
  left.stakeholderDefinitionId === right.stakeholderDefinitionId &&
  left.stakeholderDefinitionVersion === right.stakeholderDefinitionVersion &&
  left.profile.displayName === right.profile.displayName &&
  left.profile.roleLabel === right.profile.roleLabel &&
  left.profile.organization === right.profile.organization &&
  left.profile.department === right.profile.department &&
  left.profile.biography === right.profile.biography;

/** Semantic equality for message-level idempotency / conflict detection. */
export const stakeholderMessageSemanticEqual = (
  left: Pick<
    StakeholderMessageOccurrence,
    "conversationId" | "stakeholderId" | "direction" | "authorActorId" | "body"
  >,
  right: Pick<
    StakeholderMessageOccurrence,
    "conversationId" | "stakeholderId" | "direction" | "authorActorId" | "body"
  >,
): boolean =>
  left.conversationId === right.conversationId &&
  left.stakeholderId === right.stakeholderId &&
  left.direction === right.direction &&
  left.authorActorId === right.authorActorId &&
  left.body === right.body;

export const createStakeholderMessageOccurrence = (input: {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly conversationSequence: number;
  readonly direction: StakeholderMessageDirection;
  readonly authorActorId: ActorId;
  readonly body: string;
  readonly occurredAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}): Result<StakeholderMessageOccurrence, RuleViolationError> => {
  if (input.messageId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_IDENTITY_INVALID",
        "StakeholderMessage.messageId must be non-empty.",
      ),
    );
  }
  if (input.conversationId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_IDENTITY_INVALID",
        "StakeholderMessage.conversationId must be non-empty.",
      ),
    );
  }
  if (input.stakeholderId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_IDENTITY_INVALID",
        "StakeholderMessage.stakeholderId must be non-empty.",
      ),
    );
  }
  if (
    !Number.isInteger(input.conversationSequence) ||
    input.conversationSequence < 1
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_SEQUENCE_INVALID",
        "StakeholderMessage.conversationSequence must be a positive integer.",
        { conversationSequence: input.conversationSequence },
      ),
    );
  }
  if (!isStakeholderMessageDirection(input.direction)) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_DIRECTION_INVALID",
        `Unsupported StakeholderMessage direction '${input.direction}'.`,
      ),
    );
  }
  if (input.authorActorId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_AUTHOR_INVALID",
        "StakeholderMessage.authorActorId must be non-empty.",
      ),
    );
  }
  const body = requireBoundedNonEmpty(
    input.body,
    "body",
    STAKEHOLDER_MESSAGE_BODY_MAX_LENGTH,
    "STAKEHOLDER_MESSAGE_CONTENT_INVALID",
  );
  if (!body.ok) {
    return body;
  }
  if (Number.isNaN(Date.parse(input.occurredAt))) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_OCCURRENCE_INVALID",
        "StakeholderMessage.occurredAt must be a valid ISO timestamp.",
      ),
    );
  }
  if (input.originatingCommandId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_OCCURRENCE_INVALID",
        "StakeholderMessage.originatingCommandId must be non-empty.",
      ),
    );
  }
  return ok({
    messageId: input.messageId,
    conversationId: input.conversationId,
    stakeholderId: input.stakeholderId,
    conversationSequence: input.conversationSequence,
    direction: input.direction,
    authorActorId: input.authorActorId,
    body: body.value,
    occurredAt: asIsoTimestamp(input.occurredAt),
    originatingCommandId: input.originatingCommandId,
  });
};

export const createStakeholderConversation = (input: {
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly openedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
  readonly messages?: readonly StakeholderMessageOccurrence[];
}): Result<StakeholderConversation, RuleViolationError> => {
  if (input.conversationId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_IDENTITY_INVALID",
        "StakeholderConversation.conversationId must be non-empty.",
      ),
    );
  }
  if (input.stakeholderId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_IDENTITY_INVALID",
        "StakeholderConversation.stakeholderId must be non-empty.",
      ),
    );
  }
  if (Number.isNaN(Date.parse(input.openedAt))) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_INVALID",
        "StakeholderConversation.openedAt must be a valid ISO timestamp.",
      ),
    );
  }
  if (input.originatingCommandId.trim().length === 0) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_INVALID",
        "StakeholderConversation.originatingCommandId must be non-empty.",
      ),
    );
  }
  const messages = input.messages ?? [];
  for (const message of messages) {
    if (message.conversationId !== input.conversationId) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_MESSAGE_CONVERSATION_MISMATCH",
          "StakeholderMessage.conversationId must match its conversation.",
        ),
      );
    }
    if (message.stakeholderId !== input.stakeholderId) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_MESSAGE_STAKEHOLDER_MISMATCH",
          "StakeholderMessage.stakeholderId must match its conversation owner.",
        ),
      );
    }
  }
  return ok({
    conversationId: input.conversationId,
    stakeholderId: input.stakeholderId,
    openedAt: asIsoTimestamp(input.openedAt),
    originatingCommandId: input.originatingCommandId,
    messages: [...messages],
  });
};

export const serializeStakeholderRuntime = (
  stakeholder: StakeholderRuntime,
): Readonly<Record<string, unknown>> => ({
  stakeholderId: stakeholder.stakeholderId,
  stakeholderDefinitionId: stakeholder.stakeholderDefinitionId,
  stakeholderDefinitionVersion: stakeholder.stakeholderDefinitionVersion,
  initializationSequence: stakeholder.initializationSequence,
  profile: { ...stakeholder.profile },
  initializedAt: stakeholder.initializedAt,
  originatingCommandId: stakeholder.originatingCommandId,
});

export const rehydrateStakeholderRuntime = (
  value: unknown,
): Result<StakeholderRuntime, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_OCCURRENCE_INVALID",
        "Persisted StakeholderRuntime must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.stakeholderId !== "string" ||
    typeof record.stakeholderDefinitionVersion !== "string" ||
    typeof record.initializationSequence !== "number" ||
    typeof record.initializedAt !== "string" ||
    typeof record.originatingCommandId !== "string" ||
    typeof record.profile !== "object" ||
    record.profile === null ||
    Array.isArray(record.profile)
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_OCCURRENCE_INVALID",
        "Persisted StakeholderRuntime fields are incomplete.",
      ),
    );
  }
  const profileRecord = record.profile as Record<string, unknown>;
  const profile = createStakeholderLearnerSafeProfile({
    displayName: String(profileRecord.displayName ?? ""),
    roleLabel:
      profileRecord.roleLabel === null || profileRecord.roleLabel === undefined
        ? null
        : String(profileRecord.roleLabel),
    organization:
      profileRecord.organization === null ||
      profileRecord.organization === undefined
        ? null
        : String(profileRecord.organization),
    department:
      profileRecord.department === null ||
      profileRecord.department === undefined
        ? null
        : String(profileRecord.department),
    biography:
      profileRecord.biography === null || profileRecord.biography === undefined
        ? null
        : String(profileRecord.biography),
  });
  if (!profile.ok) {
    return profile;
  }
  const created = createStakeholderRuntime({
    stakeholderId: record.stakeholderId as StakeholderId,
    stakeholderDefinitionVersion: record.stakeholderDefinitionVersion,
    initializationSequence: record.initializationSequence,
    profile: profile.value,
    initializedAt: asIsoTimestamp(record.initializedAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
  if (!created.ok) {
    return created;
  }
  const definitionId =
    typeof record.stakeholderDefinitionId === "string" &&
    record.stakeholderDefinitionId.trim().length > 0
      ? (record.stakeholderDefinitionId as StakeholderId)
      : created.value.stakeholderDefinitionId;
  return ok({
    ...created.value,
    stakeholderDefinitionId: definitionId,
  });
};

export const serializeStakeholderMessageOccurrence = (
  message: StakeholderMessageOccurrence,
): Readonly<Record<string, unknown>> => ({
  messageId: message.messageId,
  conversationId: message.conversationId,
  stakeholderId: message.stakeholderId,
  conversationSequence: message.conversationSequence,
  direction: message.direction,
  authorActorId: message.authorActorId,
  body: message.body,
  occurredAt: message.occurredAt,
  originatingCommandId: message.originatingCommandId,
});

export const rehydrateStakeholderMessageOccurrence = (
  value: unknown,
): Result<StakeholderMessageOccurrence, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_OCCURRENCE_INVALID",
        "Persisted StakeholderMessage must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.messageId !== "string" ||
    typeof record.conversationId !== "string" ||
    typeof record.stakeholderId !== "string" ||
    typeof record.conversationSequence !== "number" ||
    typeof record.direction !== "string" ||
    typeof record.authorActorId !== "string" ||
    typeof record.body !== "string" ||
    typeof record.occurredAt !== "string" ||
    typeof record.originatingCommandId !== "string"
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_OCCURRENCE_INVALID",
        "Persisted StakeholderMessage fields are incomplete.",
      ),
    );
  }
  return createStakeholderMessageOccurrence({
    messageId: record.messageId as MessageId,
    conversationId: record.conversationId as ConversationId,
    stakeholderId: record.stakeholderId as StakeholderId,
    conversationSequence: record.conversationSequence,
    direction: record.direction as StakeholderMessageDirection,
    authorActorId: record.authorActorId as ActorId,
    body: record.body,
    occurredAt: asIsoTimestamp(record.occurredAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
};

export const serializeStakeholderConversation = (
  conversation: StakeholderConversation,
): Readonly<Record<string, unknown>> => ({
  conversationId: conversation.conversationId,
  stakeholderId: conversation.stakeholderId,
  openedAt: conversation.openedAt,
  originatingCommandId: conversation.originatingCommandId,
  messages: conversation.messages.map(serializeStakeholderMessageOccurrence),
});

export const rehydrateStakeholderConversation = (
  value: unknown,
): Result<StakeholderConversation, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_INVALID",
        "Persisted StakeholderConversation must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.conversationId !== "string" ||
    typeof record.stakeholderId !== "string" ||
    typeof record.openedAt !== "string" ||
    typeof record.originatingCommandId !== "string" ||
    !Array.isArray(record.messages)
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_INVALID",
        "Persisted StakeholderConversation fields are incomplete.",
      ),
    );
  }
  const messages: StakeholderMessageOccurrence[] = [];
  for (const entry of record.messages) {
    const parsed = rehydrateStakeholderMessageOccurrence(entry);
    if (!parsed.ok) {
      return parsed;
    }
    messages.push(parsed.value);
  }
  return createStakeholderConversation({
    conversationId: record.conversationId as ConversationId,
    stakeholderId: record.stakeholderId as StakeholderId,
    openedAt: asIsoTimestamp(record.openedAt),
    originatingCommandId: record.originatingCommandId as CommandId,
    messages,
  });
};
