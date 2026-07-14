// Master catalog index and resolution logic.

import type { CatalogIndex, CatalogResolverOptions, ResolvedCatalog } from "./types";
import { globalCatalog } from "./global";
import { industryCatalogs } from "./industries";
import { caseOverrides } from "./cases";

/**
 * Build the master catalog index.
 */
export const masterCatalog: CatalogIndex = {
  global: globalCatalog,
  industries: industryCatalogs,
  cases: caseOverrides,
};

/**
 * Resolve the correct catalog for a case.
 *
 * Resolution order:
 * 1. Case-specific overrides
 * 2. Industry catalog
 * 3. Global fallback
 */
export function resolveCatalog(
  options: CatalogResolverOptions,
): ResolvedCatalog {
  const { caseId, industry } = options;

  const resolved: ResolvedCatalog = {
    risks: [],
    conflicts: [],
    sources: { risks: [], conflicts: [] },
  };

  const seenRiskIds = new Set<string>();
  const seenConflictIds = new Set<string>();

  // 1. Case-specific overrides (highest priority)
  if (caseId && masterCatalog.cases[caseId]) {
    const caseRisks = masterCatalog.cases[caseId].risks || [];
    const caseConflicts = masterCatalog.cases[caseId].conflicts || [];

    caseRisks.forEach((risk) => {
      if (!seenRiskIds.has(risk.id)) {
        resolved.risks.push(risk);
        resolved.sources.risks.push({ entryId: risk.id, source: "case" });
        seenRiskIds.add(risk.id);
      }
    });

    caseConflicts.forEach((conflict) => {
      if (!seenConflictIds.has(conflict.id)) {
        resolved.conflicts.push(conflict);
        resolved.sources.conflicts.push({ entryId: conflict.id, source: "case" });
        seenConflictIds.add(conflict.id);
      }
    });
  }

  // 2. Industry catalog (medium priority)
  if (industry && masterCatalog.industries[industry]) {
    const industryRisks = masterCatalog.industries[industry].risks || [];
    const industryConflicts = masterCatalog.industries[industry].conflicts || [];

    industryRisks.forEach((risk) => {
      if (!seenRiskIds.has(risk.id)) {
        resolved.risks.push(risk);
        resolved.sources.risks.push({ entryId: risk.id, source: "industry" });
        seenRiskIds.add(risk.id);
      }
    });

    industryConflicts.forEach((conflict) => {
      if (!seenConflictIds.has(conflict.id)) {
        resolved.conflicts.push(conflict);
        resolved.sources.conflicts.push({ entryId: conflict.id, source: "industry" });
        seenConflictIds.add(conflict.id);
      }
    });
  }

  // 3. Global fallback (lowest priority)
  masterCatalog.global.risks.forEach((risk) => {
    if (!seenRiskIds.has(risk.id)) {
      resolved.risks.push(risk);
      resolved.sources.risks.push({ entryId: risk.id, source: "global" });
      seenRiskIds.add(risk.id);
    }
  });

  masterCatalog.global.conflicts.forEach((conflict) => {
    if (!seenConflictIds.has(conflict.id)) {
      resolved.conflicts.push(conflict);
      resolved.sources.conflicts.push({ entryId: conflict.id, source: "global" });
      seenConflictIds.add(conflict.id);
    }
  });

  return resolved;
}

/**
 * Get risks for a case, validating against duplicates.
 */
export function getRiskCatalog(options: CatalogResolverOptions) {
  const resolved = resolveCatalog(options);
  
  // Validate no duplicate IDs
  const ids = new Set<string>();
  for (const risk of resolved.risks) {
    if (ids.has(risk.id)) {
      throw new Error(`Duplicate risk ID: ${risk.id}`);
    }
    ids.add(risk.id);
  }

  return resolved.risks;
}

/**
 * Get conflicts for a case, validating against duplicates.
 */
export function getConflictCatalog(options: CatalogResolverOptions) {
  const resolved = resolveCatalog(options);

  // Validate no duplicate IDs
  const ids = new Set<string>();
  for (const conflict of resolved.conflicts) {
    if (ids.has(conflict.id)) {
      throw new Error(`Duplicate conflict ID: ${conflict.id}`);
    }
    ids.add(conflict.id);
  }

  return resolved.conflicts;
}

export { type CatalogIndex, type CatalogResolverOptions, type ResolvedCatalog } from "./types";
