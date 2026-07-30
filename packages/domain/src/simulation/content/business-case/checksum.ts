/**
 * Deterministic content checksum (BC-003).
 *
 * Consistency fingerprint for published packages — not cryptographic auth.
 * Reuses the same FNV-1a 64-bit approach as projection semantic hashing.
 */

import { stableStringify } from "../../../projection/hash";
import type { BusinessCaseContentPackage } from "./package";

const fnv1a64Hex = (input: string): string => {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, "0");
};

/**
 * Canonicalize package for checksum: omit volatile checksum field itself so
 * hashing is stable before/after stamping.
 */
export const canonicalizeBusinessCasePackage = (
  pkg: BusinessCaseContentPackage,
): unknown => ({
  ...pkg,
  manifest: {
    ...pkg.manifest,
    checksum: "",
  },
});

export const computeBusinessCasePackageChecksum = (
  pkg: BusinessCaseContentPackage,
): string => {
  const canonical = stableStringify(canonicalizeBusinessCasePackage(pkg));
  return `fnv1a64:v1:${fnv1a64Hex(canonical)}`;
};

export const stampPackageChecksum = (
  pkg: BusinessCaseContentPackage,
): BusinessCaseContentPackage => {
  const checksum = computeBusinessCasePackageChecksum(pkg);
  return {
    ...pkg,
    manifest: {
      ...pkg.manifest,
      checksum,
    },
  };
};
