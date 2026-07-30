import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  ConversationId,
  EventId,
  LearnerId,
  MessageId,
  SimulationRunId,
  StakeholderId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { isStakeholderMessageDirection } from "../simulation/run/stakeholder";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";
import {
  STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
  STAKEHOLDERS_PROJECTION_TYPE,
  type StakeholdersCapabilities,
  type StakeholdersConversationItem,
  type StakeholdersItem,
  type StakeholdersLearnerSafeProfile,
  type StakeholdersMessageItem,
  type StakeholdersProjection,
  type StakeholdersSummary,
} from "./stakeholders-contracts";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const FORBIDDEN_ITEM_FIELDS = [
  "originatingCommandId",
  "causationId",
  "correlationId",
  "aggregateVersion",
  "authorActorId",
  "initializedAt",
] as const;

const rejectForbiddenFields = (
  value: Record<string, unknown>,
  label: string,
): Result<void, RuleViolationError> => {
  for (const forbidden of FORBIDDEN_ITEM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `${label} must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }
  return ok(undefined);
};

const parseCapabilities = (
  value: unknown,
): Result<StakeholdersCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.sendMessage !== "unsupported" ||
    value.editProfile !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders capabilities must mark sendMessage/editProfile as unsupported.",
      ),
    );
  }
  return ok({
    sendMessage: "unsupported",
    editProfile: "unsupported",
  });
};

const parseOptionalText = (
  value: unknown,
  field: string,
): Result<string | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  if (typeof value !== "string") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        `Stakeholders profile ${field} must be a string or null.`,
      ),
    );
  }
  return ok(value);
};

const parseProfile = (
  value: unknown,
): Result<StakeholdersLearnerSafeProfile, RuleViolationError> => {
  if (!isPlainObject(value) || typeof value.displayName !== "string") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders profile is invalid.",
      ),
    );
  }
  const roleLabel = parseOptionalText(value.roleLabel, "roleLabel");
  if (!roleLabel.ok) {
    return roleLabel;
  }
  const organization = parseOptionalText(value.organization, "organization");
  if (!organization.ok) {
    return organization;
  }
  const department = parseOptionalText(value.department, "department");
  if (!department.ok) {
    return department;
  }
  const biography = parseOptionalText(value.biography, "biography");
  if (!biography.ok) {
    return biography;
  }
  return ok({
    displayName: value.displayName,
    roleLabel: roleLabel.value,
    organization: organization.value,
    department: department.value,
    biography: biography.value,
  });
};

const parseMessage = (
  value: unknown,
): Result<StakeholdersMessageItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.messageId !== "string" ||
    value.messageId.trim().length === 0 ||
    typeof value.conversationSequence !== "number" ||
    !Number.isInteger(value.conversationSequence) ||
    value.conversationSequence < 1 ||
    typeof value.direction !== "string" ||
    !isStakeholderMessageDirection(value.direction) ||
    !isPlainObject(value.author) ||
    value.author.kind !== "learner" ||
    value.author.label !== "You" ||
    typeof value.body !== "string" ||
    value.body.trim().length === 0 ||
    typeof value.occurredAt !== "string" ||
    Number.isNaN(Date.parse(value.occurredAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders message is invalid.",
      ),
    );
  }
  const forbidden = rejectForbiddenFields(value, "Stakeholders message");
  if (!forbidden.ok) {
    return forbidden;
  }
  return ok({
    messageId: value.messageId as MessageId,
    conversationSequence: value.conversationSequence,
    direction: value.direction,
    author: { kind: "learner", label: "You" },
    body: value.body,
    occurredAt: value.occurredAt as IsoTimestamp,
  });
};

const parseConversation = (
  value: unknown,
): Result<StakeholdersConversationItem | null, RuleViolationError> => {
  if (value === null) {
    return ok(null);
  }
  if (
    !isPlainObject(value) ||
    typeof value.conversationId !== "string" ||
    value.conversationId.trim().length === 0 ||
    !Array.isArray(value.messages)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders conversation is invalid.",
      ),
    );
  }
  const forbidden = rejectForbiddenFields(value, "Stakeholders conversation");
  if (!forbidden.ok) {
    return forbidden;
  }
  const messages: StakeholdersMessageItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.messages) {
    const parsed = parseMessage(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.messageId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders messages must have unique messageId values.",
        ),
      );
    }
    seenIds.add(parsed.value.messageId);
    messages.push(parsed.value);
  }
  for (let index = 1; index < messages.length; index += 1) {
    const previous = messages[index - 1]!;
    const current = messages[index]!;
    if (current.conversationSequence < previous.conversationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders messages must be ordered ascending by conversationSequence.",
        ),
      );
    }
  }
  return ok({
    conversationId: value.conversationId as ConversationId,
    messages,
  });
};

const parseStakeholderItem = (
  value: unknown,
): Result<StakeholdersItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.stakeholderId !== "string" ||
    value.stakeholderId.trim().length === 0 ||
    typeof value.stakeholderDefinitionId !== "string" ||
    value.stakeholderDefinitionId.trim().length === 0 ||
    typeof value.stakeholderDefinitionVersion !== "string" ||
    value.stakeholderDefinitionVersion.trim().length === 0 ||
    typeof value.initializationSequence !== "number" ||
    !Number.isInteger(value.initializationSequence) ||
    value.initializationSequence < 1
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders item is invalid.",
      ),
    );
  }
  const forbidden = rejectForbiddenFields(value, "Stakeholders item");
  if (!forbidden.ok) {
    return forbidden;
  }
  const profile = parseProfile(value.profile);
  if (!profile.ok) {
    return profile;
  }
  const conversation = parseConversation(value.conversation);
  if (!conversation.ok) {
    return conversation;
  }
  return ok({
    stakeholderId: value.stakeholderId as StakeholderId,
    stakeholderDefinitionId: value.stakeholderDefinitionId as StakeholderId,
    stakeholderDefinitionVersion: value.stakeholderDefinitionVersion,
    initializationSequence: value.initializationSequence,
    profile: profile.value,
    conversation: conversation.value,
  });
};

const parseSummary = (
  value: unknown,
  stakeholders: readonly StakeholdersItem[],
): Result<StakeholdersSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalStakeholders !== "number" ||
    !Number.isInteger(value.totalStakeholders) ||
    value.totalStakeholders < 0 ||
    typeof value.stakeholdersWithConversation !== "number" ||
    !Number.isInteger(value.stakeholdersWithConversation) ||
    value.stakeholdersWithConversation < 0 ||
    typeof value.totalMessages !== "number" ||
    !Number.isInteger(value.totalMessages) ||
    value.totalMessages < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders summary is invalid.",
      ),
    );
  }
  if (value.totalStakeholders !== stakeholders.length) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders summary.totalStakeholders must equal stakeholders length.",
      ),
    );
  }
  if (value.isEmpty !== (stakeholders.length === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders summary.isEmpty must match empty stakeholders.",
      ),
    );
  }
  return ok({
    totalStakeholders: value.totalStakeholders,
    stakeholdersWithConversation: value.stakeholdersWithConversation,
    totalMessages: value.totalMessages,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Stakeholders JSON before returning it as a typed contract.
 */
export const parseStakeholdersProjection = (
  value: unknown,
): Result<StakeholdersProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== STAKEHOLDERS_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !== STAKEHOLDERS_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Stakeholders schema version '${String(value.projectionSchemaVersion)}'.`,
      ),
    );
  }
  if (
    typeof value.projectionId !== "string" ||
    typeof value.tenantId !== "string" ||
    typeof value.simulationRunId !== "string" ||
    typeof value.learnerId !== "string" ||
    typeof value.contentPackageVersionId !== "string" ||
    typeof value.sourceAggregateVersion !== "number" ||
    typeof value.sourceStateVersion !== "number" ||
    typeof value.sourceActionSequence !== "number" ||
    typeof value.generatedAt !== "string" ||
    typeof value.semanticHash !== "string" ||
    !Array.isArray(value.stakeholders)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Stakeholders semanticHash is invalid.",
      ),
    );
  }

  const position = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!position.ok) {
    return position;
  }

  const capabilities = parseCapabilities(value.capabilities);
  if (!capabilities.ok) {
    return capabilities;
  }

  const stakeholders: StakeholdersItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.stakeholders) {
    const parsed = parseStakeholderItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.stakeholderId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders items must have unique stakeholderId values.",
        ),
      );
    }
    seenIds.add(parsed.value.stakeholderId);
    stakeholders.push(parsed.value);
  }

  for (let index = 1; index < stakeholders.length; index += 1) {
    const previous = stakeholders[index - 1]!;
    const current = stakeholders[index]!;
    if (current.initializationSequence < previous.initializationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Stakeholders must be ordered ascending by initializationSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, stakeholders);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: STAKEHOLDERS_PROJECTION_TYPE,
    projectionSchemaVersion: STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
    tenantId: value.tenantId as TenantId,
    simulationRunId: value.simulationRunId as SimulationRunId,
    learnerId: value.learnerId as LearnerId,
    contentPackageVersionId:
      value.contentPackageVersionId as ContentPackageVersionId,
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
    sourceEventId:
      value.sourceEventId === null || value.sourceEventId === undefined
        ? null
        : (value.sourceEventId as EventId),
    generatedAt: value.generatedAt as IsoTimestamp,
    semanticHash: asProjectionHash(value.semanticHash),
    stakeholders,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeStakeholdersProjection = (
  projection: StakeholdersProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
