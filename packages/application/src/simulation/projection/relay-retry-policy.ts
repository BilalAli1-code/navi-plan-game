/**
 * Bounded retry policy for projection processing targets (PS-ROADMAP-023).
 *
 * Attempt semantics: the first processing attempt is attempt 1. After a
 * retryable failure with attemptCount >= maxAttempts the target is exhausted.
 */

export type ProjectionTargetErrorClassification =
  | "transient"
  | "concurrency"
  | "unavailable"
  | "malformed_event"
  | "unsupported_event"
  | "missing_registration"
  | "payload_validation"
  | "authorization"
  | "invariant"
  | "unknown";

export interface RelayRetryPolicyConfig {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  /** 0..1 inclusive; 0 disables jitter. */
  readonly jitterRatio: number;
  readonly claimLeaseMs: number;
}

export const DEFAULT_RELAY_RETRY_POLICY: RelayRetryPolicyConfig = {
  maxAttempts: 5,
  baseDelayMs: 1_000,
  maxDelayMs: 300_000,
  jitterRatio: 0.1,
  claimLeaseMs: 60_000,
};

export const validateRelayRetryPolicy = (
  input: Partial<RelayRetryPolicyConfig>,
): RelayRetryPolicyConfig => {
  const maxAttempts =
    input.maxAttempts ?? DEFAULT_RELAY_RETRY_POLICY.maxAttempts;
  const baseDelayMs =
    input.baseDelayMs ?? DEFAULT_RELAY_RETRY_POLICY.baseDelayMs;
  const maxDelayMs = input.maxDelayMs ?? DEFAULT_RELAY_RETRY_POLICY.maxDelayMs;
  const jitterRatio =
    input.jitterRatio ?? DEFAULT_RELAY_RETRY_POLICY.jitterRatio;
  const claimLeaseMs =
    input.claimLeaseMs ?? DEFAULT_RELAY_RETRY_POLICY.claimLeaseMs;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
    throw new Error("RELAY_MAX_ATTEMPTS must be an integer in [1, 100].");
  }
  if (
    !Number.isFinite(baseDelayMs) ||
    baseDelayMs < 0 ||
    baseDelayMs > 3_600_000
  ) {
    throw new Error("RELAY_RETRY_BASE_DELAY_MS must be in [0, 3600000].");
  }
  if (
    !Number.isFinite(maxDelayMs) ||
    maxDelayMs < baseDelayMs ||
    maxDelayMs > 3_600_000
  ) {
    throw new Error(
      "RELAY_RETRY_MAX_DELAY_MS must be >= base delay and <= 3600000.",
    );
  }
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1) {
    throw new Error("RELAY_RETRY_JITTER_RATIO must be in [0, 1].");
  }
  if (
    !Number.isFinite(claimLeaseMs) ||
    claimLeaseMs < 1_000 ||
    claimLeaseMs > 3_600_000
  ) {
    throw new Error("RELAY_CLAIM_LEASE_MS must be in [1000, 3600000].");
  }

  return {
    maxAttempts,
    baseDelayMs,
    maxDelayMs,
    jitterRatio,
    claimLeaseMs,
  };
};

/** Deterministic backoff without jitter (unit-test friendly). */
export const computeRetryDelayMs = (
  attemptCount: number,
  policy: RelayRetryPolicyConfig,
): number => {
  const safeAttempt = Math.max(1, attemptCount);
  const exp = Math.min(
    policy.maxDelayMs,
    policy.baseDelayMs * 2 ** (safeAttempt - 1),
  );
  return Math.min(policy.maxDelayMs, Math.floor(exp));
};

/**
 * Backoff with optional bounded jitter. `random` must return [0, 1).
 * Inject a constant in tests.
 */
export const computeRetryDelayMsWithJitter = (
  attemptCount: number,
  policy: RelayRetryPolicyConfig,
  random: () => number = Math.random,
): number => {
  const base = computeRetryDelayMs(attemptCount, policy);
  if (policy.jitterRatio <= 0) {
    return base;
  }
  const span = base * policy.jitterRatio;
  const delta = (random() * 2 - 1) * span;
  return Math.max(0, Math.min(policy.maxDelayMs, Math.floor(base + delta)));
};

export const shouldExhaust = (
  nextAttemptCount: number,
  policy: RelayRetryPolicyConfig,
  classification: ProjectionTargetErrorClassification,
): boolean => {
  if (
    classification === "malformed_event" ||
    classification === "missing_registration" ||
    classification === "payload_validation" ||
    classification === "unsupported_event" ||
    classification === "invariant" ||
    classification === "authorization"
  ) {
    return true;
  }
  return nextAttemptCount >= policy.maxAttempts;
};

export const classifyProjectionTargetError = (
  error: unknown,
): ProjectionTargetErrorClassification => {
  if (error && typeof error === "object" && "classification" in error) {
    const value = (error as { classification: unknown }).classification;
    if (
      typeof value === "string" &&
      [
        "transient",
        "concurrency",
        "unavailable",
        "malformed_event",
        "unsupported_event",
        "missing_registration",
        "payload_validation",
        "authorization",
        "invariant",
        "unknown",
      ].includes(value)
    ) {
      return value as ProjectionTargetErrorClassification;
    }
  }
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  if (
    message.includes("serialization") ||
    message.includes("could not serialize") ||
    message.includes("40001")
  ) {
    return "concurrency";
  }
  if (
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("57p01")
  ) {
    return "transient";
  }
  if (message.includes("unavailable")) {
    return "unavailable";
  }
  return "unknown";
};

/** Safe, bounded error summary for persistence/APIs (no payloads/secrets). */
export const summarizeProjectionTargetError = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw.replace(/\s+/g, " ").trim().slice(0, 240);
  return cleaned.length > 0 ? cleaned : "unknown_error";
};
