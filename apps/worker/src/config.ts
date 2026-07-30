import {
  DEFAULT_RELAY_RETRY_POLICY,
  validateRelayRetryPolicy,
  type RelayRetryPolicyConfig,
} from "@projectsim/application";
import {
  DEFAULT_RELAY_WORKER_CONFIG,
  validateRelayWorkerConfig,
  type RelayWorkerConfig,
} from "@projectsim/infrastructure";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";

export interface WorkerRuntimeConfig {
  readonly enabled: boolean;
  readonly databaseUrl: string;
  readonly databaseAdminUrl: string;
  readonly healthPort: number;
  readonly worker: RelayWorkerConfig;
  readonly retry: RelayRetryPolicyConfig;
}

const parseIntEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
  return value;
};

const parseFloatEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
  return value;
};

export const loadWorkerRuntimeConfig = (
  env: NodeJS.ProcessEnv = process.env,
): WorkerRuntimeConfig => {
  const enabled = (env.RELAY_ENABLED ?? "1").trim() !== "0";
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const databaseAdminUrl =
    env.DATABASE_ADMIN_URL?.trim() || env.DATABASE_URL?.trim() || "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the relay worker.");
  }
  if (!databaseAdminUrl) {
    throw new Error("DATABASE_ADMIN_URL is required for tenant discovery.");
  }

  const workerId =
    env.RELAY_WORKER_ID?.trim() ||
    `relay:${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;

  const worker = validateRelayWorkerConfig({
    pollIntervalMs: parseIntEnv(
      "RELAY_POLL_INTERVAL_MS",
      DEFAULT_RELAY_WORKER_CONFIG.pollIntervalMs,
    ),
    batchSize: parseIntEnv(
      "RELAY_BATCH_SIZE",
      DEFAULT_RELAY_WORKER_CONFIG.batchSize,
    ),
    concurrency: parseIntEnv(
      "RELAY_CONCURRENCY",
      DEFAULT_RELAY_WORKER_CONFIG.concurrency,
    ),
    shutdownTimeoutMs: parseIntEnv(
      "RELAY_SHUTDOWN_TIMEOUT_MS",
      DEFAULT_RELAY_WORKER_CONFIG.shutdownTimeoutMs,
    ),
    workerId,
  });

  const retry = validateRelayRetryPolicy({
    maxAttempts: parseIntEnv(
      "RELAY_MAX_ATTEMPTS",
      DEFAULT_RELAY_RETRY_POLICY.maxAttempts,
    ),
    baseDelayMs: parseIntEnv(
      "RELAY_RETRY_BASE_DELAY_MS",
      DEFAULT_RELAY_RETRY_POLICY.baseDelayMs,
    ),
    maxDelayMs: parseIntEnv(
      "RELAY_RETRY_MAX_DELAY_MS",
      DEFAULT_RELAY_RETRY_POLICY.maxDelayMs,
    ),
    jitterRatio: parseFloatEnv(
      "RELAY_RETRY_JITTER_RATIO",
      DEFAULT_RELAY_RETRY_POLICY.jitterRatio,
    ),
    claimLeaseMs: parseIntEnv(
      "RELAY_CLAIM_LEASE_MS",
      DEFAULT_RELAY_RETRY_POLICY.claimLeaseMs,
    ),
  });

  const healthPort = parseIntEnv("RELAY_HEALTH_PORT", 8790);
  if (!Number.isInteger(healthPort) || healthPort < 1 || healthPort > 65535) {
    throw new Error("RELAY_HEALTH_PORT must be an integer in [1, 65535].");
  }

  return {
    enabled,
    databaseUrl,
    databaseAdminUrl,
    healthPort,
    worker,
    retry,
  };
};
