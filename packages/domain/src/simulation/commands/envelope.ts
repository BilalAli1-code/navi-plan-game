import type {
  ActorId,
  CausationId,
  CommandId,
  CorrelationId,
  SimulationRunId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";

/**
 * The canonical set of simulation-action command types (imperative names, per
 * docs/handbook/05_Domain_and_Application_Coding_Standards.md). Every command is
 * a "Simulation Action": a typed learner or system intent submitted for
 * validation (docs/architecture/02-domain-model/01_Platform_Foundation.md).
 */
export type SimulationCommandType =
  | "SubmitDecision"
  | "InitializeActivity"
  | "CompleteActivity"
  | "InitializeStakeholder"
  | "SendStakeholderMessage"
  | "ScheduleMeeting"
  | "MakeMeetingAvailable"
  | "StartMeeting"
  | "CompleteMeeting"
  | "CancelMeeting"
  | "InitializeDocument"
  | "InitializeNotification"
  | "DeliverLearnerMessage"
  | "CompleteChapter"
  | "UploadArtifact";

/**
 * Canonical action-type identifier for a Simulation Action.
 *
 * This is the SAME closed set as {@link SimulationCommandType} — a command's
 * `commandType` and the `actionType` recorded on `SimulationActionAccepted` are
 * one and the same ubiquitous-language concept. It is aliased (not duplicated)
 * so both usages share a single source of truth.
 *
 * Application-layer note (single source of truth): future application/API
 * layers MUST import `SimulationActionType` / `SimulationCommandType` (and the
 * runtime `simulationCommandTypes` registry) from `@projectsim/domain` rather
 * than redefining their own enum or string literals. Do not duplicate this set
 * across layers.
 */
export type SimulationActionType = SimulationCommandType;

/**
 * Shared command envelope carried by every simulation command.
 *
 * Combines the command-identity fields from
 * docs/architecture/05-api-architecture/02_Resource_and_Command_Model.md with
 * the correlation/causation and actor tracing required by the domain-event
 * catalog.
 *
 * Concurrency metadata rule: `causationId` and `expectedVersion` are
 * **required-but-nullable** — the keys are always present in every envelope. A
 * root command sets `causationId: null`; a non-version-sensitive command sets
 * `expectedVersion: null`. They are explicitly set to `null` rather than
 * omitted so serializers, validators, and types stay consistent.
 *
 * MVP note: `commandVersion` is intentionally omitted (no command-schema
 * versioning for MVP). No validator or serializer should expect that field.
 *
 * TODO(next-domain-model-iteration / API versioning): introduce an optional
 * `commandVersion` ONLY when API versioning or distributed/cross-service
 * compatibility becomes necessary. Add it as an optional field first so
 * existing (unversioned) commands keep validating, then tighten once all
 * producers emit it. Envelope validation is expected to evolve additively —
 * validators must treat unknown/absent versioning fields leniently until then.
 *
 * @typeParam TType    Discriminant identifying the concrete command.
 * @typeParam TPayload Command-specific payload.
 */
export interface SimulationCommandEnvelope<
  TType extends SimulationCommandType,
  TPayload,
> {
  readonly commandId: CommandId;
  readonly commandType: TType;
  readonly simulationRunId: SimulationRunId;
  readonly actorId: ActorId;
  readonly occurredAt: IsoTimestamp;
  readonly correlationId: CorrelationId;
  /** Causing command/event id; `null` for a root command. Always present. */
  readonly causationId: CausationId | null;
  /**
   * Optimistic-concurrency expectation (`If-Match`); `null` when not required.
   * Always present (required-but-nullable), never omitted.
   */
  readonly expectedVersion: number | null;
  readonly payload: TPayload;
}
