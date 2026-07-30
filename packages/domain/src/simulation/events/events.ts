import type { DomainEvent } from "../../shared-kernel/event-envelope";
import type { SimulationRunLifecycleEvent } from "../run/lifecycle-events";
import type {
  ActivityCompletedPayload,
  ActivityInitializedPayload,
  AnalyticsSignalEmittedPayload,
  ConsequenceAppliedPayload,
  ConsequenceCreatedPayload,
  ConsequenceScheduledPayload,
  DecisionResolvedPayload,
  DecisionSubmittedPayload,
  LearnerMessageDeliveredPayload,
  LearningSignalEmittedPayload,
  MeetingCancelledPayload,
  MeetingCompletedPayload,
  MeetingMadeAvailablePayload,
  MeetingScheduledPayload,
  MeetingStartedPayload,
  ProjectMetricChangedPayload,
  ProjectStateTransitionedPayload,
  SimulationActionAcceptedPayload,
  StakeholderConversationOpenedPayload,
  StakeholderInitializedPayload,
  StakeholderMessageSentPayload,
  StakeholderSignalEmittedPayload,
  DocumentInitializedPayload,
  NotificationInitializedPayload,
} from "./payloads";

export type SimulationActionAcceptedEvent = DomainEvent<
  "SimulationActionAccepted",
  SimulationActionAcceptedPayload
>;

export type DecisionSubmittedEvent = DomainEvent<
  "DecisionSubmitted",
  DecisionSubmittedPayload
>;

export type DecisionResolvedEvent = DomainEvent<
  "DecisionResolved",
  DecisionResolvedPayload
>;

export type ConsequenceCreatedEvent = DomainEvent<
  "ConsequenceCreated",
  ConsequenceCreatedPayload
>;

export type ConsequenceAppliedEvent = DomainEvent<
  "ConsequenceApplied",
  ConsequenceAppliedPayload
>;

export type ConsequenceScheduledEvent = DomainEvent<
  "ConsequenceScheduled",
  ConsequenceScheduledPayload
>;

export type ProjectMetricChangedEvent = DomainEvent<
  "ProjectMetricChanged",
  ProjectMetricChangedPayload
>;

export type ProjectStateTransitionedEvent = DomainEvent<
  "ProjectStateTransitioned",
  ProjectStateTransitionedPayload
>;

export type LearningSignalEmittedEvent = DomainEvent<
  "LearningSignalEmitted",
  LearningSignalEmittedPayload
>;

export type StakeholderSignalEmittedEvent = DomainEvent<
  "StakeholderSignalEmitted",
  StakeholderSignalEmittedPayload
>;

export type AnalyticsSignalEmittedEvent = DomainEvent<
  "AnalyticsSignalEmitted",
  AnalyticsSignalEmittedPayload
>;

export type LearnerMessageDeliveredEvent = DomainEvent<
  "LearnerMessageDelivered",
  LearnerMessageDeliveredPayload
>;

export type MeetingScheduledEvent = DomainEvent<
  "MeetingScheduled",
  MeetingScheduledPayload
>;

export type MeetingMadeAvailableEvent = DomainEvent<
  "MeetingMadeAvailable",
  MeetingMadeAvailablePayload
>;

export type MeetingStartedEvent = DomainEvent<
  "MeetingStarted",
  MeetingStartedPayload
>;

export type MeetingCompletedEvent = DomainEvent<
  "MeetingCompleted",
  MeetingCompletedPayload
>;

export type MeetingCancelledEvent = DomainEvent<
  "MeetingCancelled",
  MeetingCancelledPayload
>;

export type StakeholderInitializedEvent = DomainEvent<
  "StakeholderInitialized",
  StakeholderInitializedPayload
>;

export type StakeholderConversationOpenedEvent = DomainEvent<
  "StakeholderConversationOpened",
  StakeholderConversationOpenedPayload
>;

export type StakeholderMessageSentEvent = DomainEvent<
  "StakeholderMessageSent",
  StakeholderMessageSentPayload
>;

export type DocumentInitializedEvent = DomainEvent<
  "DocumentInitialized",
  DocumentInitializedPayload
>;

export type NotificationInitializedEvent = DomainEvent<
  "NotificationInitialized",
  NotificationInitializedPayload
>;

export type ActivityInitializedEvent = DomainEvent<
  "ActivityInitialized",
  ActivityInitializedPayload
>;

export type ActivityCompletedEvent = DomainEvent<
  "ActivityCompleted",
  ActivityCompletedPayload
>;

export type SimulationDomainEvent =
  | SimulationActionAcceptedEvent
  | DecisionSubmittedEvent
  | DecisionResolvedEvent
  | ConsequenceCreatedEvent
  | ConsequenceAppliedEvent
  | ConsequenceScheduledEvent
  | ProjectMetricChangedEvent
  | ProjectStateTransitionedEvent
  | LearningSignalEmittedEvent
  | StakeholderSignalEmittedEvent
  | AnalyticsSignalEmittedEvent
  | LearnerMessageDeliveredEvent
  | MeetingScheduledEvent
  | MeetingMadeAvailableEvent
  | MeetingStartedEvent
  | MeetingCompletedEvent
  | MeetingCancelledEvent
  | StakeholderInitializedEvent
  | StakeholderConversationOpenedEvent
  | StakeholderMessageSentEvent
  | DocumentInitializedEvent
  | NotificationInitializedEvent
  | ActivityInitializedEvent
  | ActivityCompletedEvent
  | SimulationRunLifecycleEvent;

export type SimulationDomainEventType = SimulationDomainEvent["eventType"];
