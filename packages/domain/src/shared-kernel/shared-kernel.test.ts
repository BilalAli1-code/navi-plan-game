import { describe, expect, expectTypeOf, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asCommandId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asSimulationRunId,
  assertNever,
  concurrencyError,
  err,
  isErr,
  isOk,
  ok,
  validationError,
  type CommandError,
  type Result,
  type SimulationActionAcceptedEvent,
  type SimulationRunId,
  type ValidationError,
} from "../index";

describe("Result", () => {
  it("given_ok_when_inspected_then_it_carries_the_value", () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (isOk(result)) {
      expect(result.value).toBe(42);
      expectTypeOf(result.value).toEqualTypeOf<number>();
    }
  });

  it("given_err_when_inspected_then_it_carries_the_error", () => {
    const result: Result<number, string> = err("nope");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe("nope");
    }
  });
});

describe("branded identifiers", () => {
  it("given_a_raw_string_when_branded_then_runtime_value_is_unchanged", () => {
    const id = asSimulationRunId("run_1");
    expect(id).toBe("run_1");
    expectTypeOf(id).toEqualTypeOf<SimulationRunId>();
  });
});

describe("assertNever", () => {
  it("given_an_unexpected_value_when_called_then_it_throws", () => {
    expect(() => assertNever("boom" as never)).toThrow(/Unexpected/);
  });
});

describe("error contracts", () => {
  it("given_field_errors_when_building_a_validation_error_then_it_is_shaped_correctly", () => {
    const error = validationError([
      {
        path: "payload.body",
        reason: "required",
        message: "Body is required.",
      },
    ]);
    expect(error.kind).toBe("validation");
    expect(error.code).toBe("COMMAND_VALIDATION_FAILED");
    expect(error.retryable).toBe(false);
    expect(error.fieldErrors).toHaveLength(1);
    expectTypeOf(error).toEqualTypeOf<ValidationError>();
  });

  it("given_a_version_mismatch_when_building_a_concurrency_error_then_versions_are_reported", () => {
    const error = concurrencyError(17, 18);
    expect(error.code).toBe("AGGREGATE_VERSION_CONFLICT");
    expect(error.expectedVersion).toBe(17);
    expect(error.actualVersion).toBe(18);
  });

  it("given_a_command_error_union_when_narrowed_then_kinds_are_exhaustive", () => {
    const errors: CommandError[] = [
      validationError([]),
      concurrencyError(1, 2),
      {
        kind: "idempotency",
        code: "IDEMPOTENCY_KEY_REUSED",
        retryable: false,
        message: "reused",
      },
      {
        kind: "authorization",
        code: "PERMISSION_DENIED",
        retryable: false,
        message: "denied",
      },
      {
        kind: "rule_violation",
        code: "SIMULATION_RUN_NOT_ACTIVE",
        retryable: false,
        message: "not active",
      },
    ];

    const codes = errors.map((error): string => {
      switch (error.kind) {
        case "validation":
          return error.code;
        case "concurrency":
          return error.code;
        case "idempotency":
          return error.code;
        case "authorization":
          return error.code;
        case "rule_violation":
          return error.code;
        default:
          return assertNever(error);
      }
    });

    expect(codes).toEqual([
      "COMMAND_VALIDATION_FAILED",
      "AGGREGATE_VERSION_CONFLICT",
      "IDEMPOTENCY_KEY_REUSED",
      "PERMISSION_DENIED",
      "SIMULATION_RUN_NOT_ACTIVE",
    ]);
  });
});

describe("DomainEvent envelope", () => {
  it("given_a_domain_event_when_constructed_then_it_matches_the_canonical_envelope", () => {
    const event: SimulationActionAcceptedEvent = {
      eventId: asEventId("evt_1"),
      eventType: "SimulationActionAccepted",
      eventVersion: 1,
      aggregateId: "run_1",
      aggregateType: "SimulationRun",
      aggregateVersion: 18,
      sequenceNumber: 5,
      occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-24T00:00:00.100Z"),
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      tenantId: null,
      simulationRunId: asSimulationRunId("run_1"),
      payload: {
        actionType: "SendStakeholderMessage",
        commandId: asCommandId("cmd_1"),
        actionRecordId: asActionRecordId("action_1"),
        sequenceNumber: 5,
      },
    };

    expect(event.eventType).toBe("SimulationActionAccepted");
    expect(event.payload.actionType).toBe("SendStakeholderMessage");
    expectTypeOf(event.eventType).toEqualTypeOf<"SimulationActionAccepted">();
  });
});
