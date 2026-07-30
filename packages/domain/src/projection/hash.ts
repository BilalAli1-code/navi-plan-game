import type { SimulationProjection } from "./contracts";
import { asProjectionHash, type ProjectionHash } from "./ids";

/**
 * Deterministic semantic hash (FNV-1a 64-bit hex).
 *
 * Consistency fingerprint only — not cryptographic integrity, authentication,
 * authorization, signatures, or adversarial tamper protection.
 *
 * Excludes non-semantic rebuild provenance:
 * - generatedAt (changes every rebuild)
 * - sourceEventId (multiple events may share one action sequence; provenance only)
 */

export const PROJECTION_SEMANTIC_HASH_PATTERN = /^fnv1a64:v1:[0-9a-f]{16}$/;

const fnv1a64Hex = (input: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, "0");
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Stable JSON with sorted object keys for hash input. */
export const stableStringify = (value: unknown): string => {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
};

export type SemanticProjectionInput = Omit<
  SimulationProjection,
  "semanticHash" | "generatedAt"
>;

export const semanticProjectionPayload = (
  projection: SemanticProjectionInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  run: projection.run,
  project: projection.project,
  availableDecisions: projection.availableDecisions,
  decisionHistory: projection.decisionHistory,
});

export const computeSemanticHashFromStableValue = (
  value: unknown,
): ProjectionHash =>
  asProjectionHash(`fnv1a64:v1:${fnv1a64Hex(stableStringify(value))}`);

export const computeProjectionSemanticHash = (
  projection: SemanticProjectionInput,
): ProjectionHash =>
  computeSemanticHashFromStableValue(semanticProjectionPayload(projection));
