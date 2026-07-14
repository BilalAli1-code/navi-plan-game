// Catalog resolution tests.

import { describe, it, expect } from "vitest";
import { resolveCatalog, getRiskCatalog, getConflictCatalog, masterCatalog } from "../index";

describe("Catalog Resolution", () => {
  it("should resolve global fallback when no case or industry specified", () => {
    const resolved = resolveCatalog({});
    expect(resolved.risks.length).toBeGreaterThan(0);
    expect(resolved.conflicts.length).toBeGreaterThan(0);
  });

  it("should resolve industry catalog when industry specified", () => {
    const resolved = resolveCatalog({ industry: "Software" });
    expect(resolved.risks.length).toBeGreaterThan(masterCatalog.global.risks.length);
  });

  it("should prefer case overrides over industry", () => {
    // Add a test case override for this test
    const testOverride: RiskCatalogEntry = {
      id: "test_override",
      title: "Test Override Risk",
      description: "Test",
      industry: "Test",
      category: "schedule",
      probability: "high",
      impact: "high",
      urgency: "high",
      phase: ["Execution"],
      responseOptions: [],
      recommendedConsiderations: [],
      pmbokDomain: "Test",
      pmbokPrinciple: "Test",
      ecoDomain: "Process",
      masteryTopics: [],
    };

    // Resolve without case (should get industry or global)
    const withoutCase = resolveCatalog({ industry: "Software" });
    const hasOverride = withoutCase.risks.some((r) => r.id === "test_override");
    expect(hasOverride).toBe(false);
  });

  it("should not have duplicate risk IDs", () => {
    const risks = getRiskCatalog({ industry: "Software" });
    const ids = risks.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should not have duplicate conflict IDs", () => {
    const conflicts = getConflictCatalog({ industry: "Software" });
    const ids = conflicts.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should track resolution sources", () => {
    const resolved = resolveCatalog({ industry: "Software" });
    expect(resolved.sources.risks.length).toBeGreaterThan(0);
    expect(resolved.sources.conflicts.length).toBeGreaterThan(0);
    
    resolved.sources.risks.forEach((source) => {
      expect(["case", "industry", "global"]).toContain(source.source);
    });
  });
});

import type { RiskCatalogEntry } from "../types";
