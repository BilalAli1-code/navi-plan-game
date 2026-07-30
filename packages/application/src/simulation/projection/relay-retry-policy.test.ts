import { describe, expect, it } from "vitest";
import {
  classifyProjectionTargetError,
  computeRetryDelayMs,
  computeRetryDelayMsWithJitter,
  DEFAULT_RELAY_RETRY_POLICY,
  shouldExhaust,
  summarizeProjectionTargetError,
  validateRelayRetryPolicy,
} from "./relay-retry-policy";

describe("relay retry policy", () => {
  it("validates safe defaults and rejects invalid bounds", () => {
    expect(validateRelayRetryPolicy({})).toEqual(DEFAULT_RELAY_RETRY_POLICY);
    expect(() => validateRelayRetryPolicy({ maxAttempts: 0 })).toThrow(
      /RELAY_MAX_ATTEMPTS/,
    );
    expect(() =>
      validateRelayRetryPolicy({ baseDelayMs: 10, maxDelayMs: 1 }),
    ).toThrow(/RELAY_RETRY_MAX_DELAY_MS/);
  });

  it("computes exponential backoff with a ceiling", () => {
    const policy = validateRelayRetryPolicy({
      baseDelayMs: 1000,
      maxDelayMs: 8000,
      jitterRatio: 0,
    });
    expect(computeRetryDelayMs(1, policy)).toBe(1000);
    expect(computeRetryDelayMs(2, policy)).toBe(2000);
    expect(computeRetryDelayMs(3, policy)).toBe(4000);
    expect(computeRetryDelayMs(4, policy)).toBe(8000);
    expect(computeRetryDelayMs(10, policy)).toBe(8000);
  });

  it("applies deterministic jitter when random is injected", () => {
    const policy = validateRelayRetryPolicy({
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      jitterRatio: 0.2,
    });
    expect(computeRetryDelayMsWithJitter(1, policy, () => 0.5)).toBe(1000);
    expect(computeRetryDelayMsWithJitter(1, policy, () => 1)).toBe(1200);
    expect(computeRetryDelayMsWithJitter(1, policy, () => 0)).toBe(800);
  });

  it("exhausts deterministic failures immediately and retryable at max", () => {
    const policy = DEFAULT_RELAY_RETRY_POLICY;
    expect(shouldExhaust(1, policy, "malformed_event")).toBe(true);
    expect(shouldExhaust(1, policy, "transient")).toBe(false);
    expect(shouldExhaust(5, policy, "transient")).toBe(true);
  });

  it("classifies and summarizes errors without payloads", () => {
    expect(
      classifyProjectionTargetError(
        Object.assign(new Error("x"), { classification: "concurrency" }),
      ),
    ).toBe("concurrency");
    expect(
      classifyProjectionTargetError(new Error("could not serialize")),
    ).toBe("concurrency");
    expect(
      summarizeProjectionTargetError(new Error("a".repeat(300))).length,
    ).toBe(240);
  });
});
