/**
 * Simulation bounded context: the canonical simulation-action command contract
 * (PS-002) — command envelope, payloads, command union, result, and the domain
 * events those commands produce. No business-case-specific logic lives here.
 *
 * ============================================================================
 * MVP status & roadmap (TODO markers only — see referenced files for detail)
 * ============================================================================
 * Current decisions:
 *   - Every accepted command emits `SimulationActionAccepted`.
 *   - `SubmitDecision` emits `SimulationActionAccepted`, `DecisionSubmitted`,
 *     consequence/resolution events (PS-ROADMAP-005), and may emit
 *     `LearnerMessageDelivered` when a `deliver_learner_message` consequence
 *     applies, with one shared action sequence number for the accepted action.
 *   - Rejection is a `CommandResult` (`CommandRejected`), not an event.
 *   - `commandVersion` is omitted (no MVP command-schema versioning).
 *   - Event creation is isolated behind factories (`events/factory.ts`).
 *   - `packages/domain` is the single source of truth for `SimulationActionType`.
 *
 * Current meeting lifecycle (PS-ROADMAP-016 / PS-ROADMAP-017):
 *   - ScheduleMeeting / MakeMeetingAvailable / StartMeeting / CompleteMeeting /
 *     CancelMeeting emit SimulationActionAccepted plus dedicated Meeting* events
 *     and mutate SimulationState.meetings. Meetings workplace projection is
 *     separate (PS-017).
 *
 * Current Stakeholder authority (PS-ROADMAP-018):
 *   - InitializeStakeholder / SendStakeholderMessage mutate SimulationState
 *     stakeholders + stakeholderConversations (introduced in schema v5).
 *   - Dedicated events: StakeholderInitialized, StakeholderConversationOpened,
 *     StakeholderMessageSent. No Stakeholder projection/API/UI (PS-019).
 *
 * Deferred (later roadmap items):
 *   - DecisionValidated / DecisionRejected / ConsequenceCompensated
 *   - ArtifactUploaded, ActivityCompleted
 *   - Optional `SimulationActionRejected` / `SimulationActionProcessed` events
 *   - `commandVersion` when API/distributed compatibility is required
 *   - Documents projection/API/UI (PS-ROADMAP-020)
 * ============================================================================
 */
export * from "./commands";
export * from "./events";
export * from "./action-contract";
export * from "./content";
export * from "./run";
