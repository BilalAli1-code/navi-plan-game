// Case-specific catalog overrides.

import type { RiskCatalogEntry, ConflictCatalogEntry } from "./types";

/**
 * Empty case overrides structure.
 * This can be populated with case-specific scenarios that override industry defaults.
 */
export const caseOverrides: Record<string, { risks: RiskCatalogEntry[]; conflicts: ConflictCatalogEntry[] }> = {
  // Example structure (currently empty)
  // "case_001_healthcare_ehr": {
  //   risks: [...],
  //   conflicts: [...],
  // },
};
