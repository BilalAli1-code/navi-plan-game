import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asCommandId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asSimulationRunId,
  createSimulationActionAcceptedEvent,
  SIMULATION_RUN_AGGREGATE_TYPE,
  type DomainEventPublisher,
  type SimulationDomainEvent,
} from "../../index";

const factoryInput = {
  eventId: asEventId("evt_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  recordedAt: asIsoTimestamp("2026-07-24T00:00:00.100Z"),
  aggregateVersion: 18,
  sequenceNumber: 5,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  tenantId: null,
  simulationRunId: asSimulationRunId("run_1"),
  actionType: "ScheduleMeeting",
  commandId: asCommandId("cmd_1"),
  actionRecordId: asActionRecordId("action_1"),
} as const;

describe("event creation seam (factory)", () => {
  it("given_valid_inputs_when_building_then_it_produces_a_canonical_accepted_event", () => {
    const event = createSimulationActionAcceptedEvent(factoryInput);

    expect(event.eventType).toBe("SimulationActionAccepted");
    expect(event.eventVersion).toBe(1);
    expect(event.aggregateType).toBe(SIMULATION_RUN_AGGREGATE_TYPE);
    expect(event.aggregateId).toBe("run_1");
    expect(event.causationId).toBeNull();
    expect(event.payload.actionType).toBe("ScheduleMeeting");
    expect(event.payload.sequenceNumber).toBe(5);
  });
});

describe("event emission seam (publisher port)", () => {
  it("given_a_publisher_implementation_when_publishing_then_events_flow_through_the_port", async () => {
    const collected: SimulationDomainEvent[] = [];
    const publisher: DomainEventPublisher = {
      publish: (events) => {
        collected.push(...events);
      },
    };

    const event = createSimulationActionAcceptedEvent(factoryInput);
    await publisher.publish([event]);

    expect(collected).toHaveLength(1);
    expect(collected[0]?.eventType).toBe("SimulationActionAccepted");
  });
});
