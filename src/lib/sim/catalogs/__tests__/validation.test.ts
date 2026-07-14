// Catalog validation tests.

import { describe, it, expect } from "vitest";
import { RiskCatalogEntrySchema, ConflictCatalogEntrySchema } from "../types";
import { masterCatalog } from "../index";

describe("Catalog Validation", () => {
  it("should validate all global risks", () => {
    masterCatalog.global.risks.forEach((risk) => {
      const result = RiskCatalogEntrySchema.safeParse(risk);
      expect(result.success).toBe(true);
    });
  });

  it("should validate all global conflicts", () => {
    masterCatalog.global.conflicts.forEach((conflict) => {
      const result = ConflictCatalogEntrySchema.safeParse(conflict);
      expect(result.success).toBe(true);
    });
  });

  it("should validate all software industry risks", () => {
    const software = masterCatalog.industries["Software"];
    if (software) {
      software.risks.forEach((risk) => {
        const result = RiskCatalogEntrySchema.safeParse(risk);
        expect(result.success).toBe(true);
      });
    }
  });

  it("should validate all software industry conflicts", () => {
    const software = masterCatalog.industries["Software"];
    if (software) {
      software.conflicts.forEach((conflict) => {
        const result = ConflictCatalogEntrySchema.safeParse(conflict);
        expect(result.success).toBe(true);
      });
    }
  });

  it("should reject invalid risk entries", () => {
    const invalidRisk = {
      // Missing required fields
      id: "test",
      title: "Test",
    };
    const result = RiskCatalogEntrySchema.safeParse(invalidRisk);
    expect(result.success).toBe(false);
  });

  it("should reject invalid conflict entries", () => {
    const invalidConflict = {
      // Missing required fields
      id: "test",
      title: "Test",
    };
    const result = ConflictCatalogEntrySchema.safeParse(invalidConflict);
    expect(result.success).toBe(false);
  });
});
