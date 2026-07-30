import type { LearnerMessageDefinitionId } from "../../shared-kernel/ids";

/**
 * Content-authored learner-message definition (authoritative delivery prerequisite).
 *
 * Immutable, data-driven input for `deliver_learner_message` consequences.
 * Not a Stakeholder Chat / conversation message.
 */

export const LEARNER_MESSAGE_SUBJECT_MAX_LENGTH = 500;
export const LEARNER_MESSAGE_BODY_MAX_LENGTH = 20_000;
export const LEARNER_MESSAGE_SENDER_DISPLAY_NAME_MAX_LENGTH = 200;
export const LEARNER_MESSAGE_SENDER_ROLE_LABEL_MAX_LENGTH = 200;
export const LEARNER_MESSAGE_DEFINITION_VERSION_MAX_LENGTH = 100;

export interface LearnerMessageSenderDefinition {
  /** Optional public sender definition id (learner-safe). */
  readonly senderId: string | null;
  readonly displayName: string;
  readonly roleLabel: string | null;
}

/**
 * Approved learner-visible message content embedded in consequence payloads
 * (and snapshotted into SimulationState on delivery).
 */
export interface LearnerMessageDefinition {
  readonly id: LearnerMessageDefinitionId;
  readonly version: string;
  readonly sender: LearnerMessageSenderDefinition;
  readonly subject: string;
  readonly body: string;
}
