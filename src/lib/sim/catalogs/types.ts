// Industry-aware risk and conflict catalogs with layered resolution.

import { z } from "zod";
import type { SimPhase, DeliveryApproach, MetricImpact, EcoDomain } from "./types";

/**
 * Risk catalog entry: describes an identifiable risk event with outcomes.
 */
export const RiskCatalogEntrySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(500),
  industry: z.string().min(1).max(50),  // e.g. "Software", "Healthcare"
  category: z.enum([
    "schedule",
    "budget",
    "scope",
    "quality",
    "resource",
    "external",
    "technical",
    "organizational",
    "regulatory",
  ]),
  probability: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high", "critical"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  phase: z.array(z.enum(["Tailoring", "Initiation", "Planning", "Execution", "Monitoring", "Closing", "Complete"])),
  responseOptions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      effectiveness: z.enum(["avoid", "mitigate", "accept", "escalate"]),
      estimatedCost: z.enum(["low", "medium", "high"]),
      requiredResources: z.array(z.string()).optional(),
    })
  ),
  recommendedConsiderations: z.array(z.string()),
  immediateMetricEffects: z.record(z.string(), z.number()).optional(),  // metric -> delta
  delayedEffects: z.array(
    z.object({
      trigger: z.string(),  // condition that triggers this
      daysDelay: z.number().min(1),
      metricEffects: z.record(z.string(), z.number()),
    })
  ).optional(),
  stakeholderIds: z.array(z.string()).optional(),
  pmbokDomain: z.string(),  // e.g. "Schedule Management"
  pmbokPrinciple: z.string(),  // e.g. "Steer the project"
  ecoDomain: z.enum(["People", "Process", "Business Environment"]),
  masteryTopics: z.array(z.string()),
  requiredInSections: z.array(z.string()).optional(),  // e.g. ["Risk Register"]
});

export type RiskCatalogEntry = z.infer<typeof RiskCatalogEntrySchema>;

/**
 * Conflict catalog entry: describes a predictable stakeholder or organizational conflict.
 */
export const ConflictCatalogEntrySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(500),
  industry: z.string().min(1).max(50),
  conflictType: z.enum(["stakeholder", "organizational", "technical", "values", "resource", "process"]),
  parties: z.array(z.string()),  // stakeholder roles or teams
  rootCause: z.string(),
  phase: z.array(z.enum(["Tailoring", "Initiation", "Planning", "Execution", "Monitoring", "Closing", "Complete"])),
  availableTechniques: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      effectiveness: z.enum(["poor", "fair", "good", "excellent"]),
      timeToResolve: z.enum(["immediate", "days", "weeks", "months"]),
    })
  ),
  likelyConsequences: z.array(z.string()),
  immediateMetricEffects: z.record(z.string(), z.number()).optional(),
  delayedEffects: z.array(
    z.object({
      trigger: z.string(),
      daysDelay: z.number().min(1),
      metricEffects: z.record(z.string(), z.number()),
    })
  ).optional(),
  pmbokDomain: z.string(),
  pmbokPrinciple: z.string(),
  ecoDomain: z.enum(["People", "Process", "Business Environment"]),
  masteryTopics: z.array(z.string()),
});

export type ConflictCatalogEntry = z.infer<typeof ConflictCatalogEntrySchema>;

/**
 * Catalog index: maps case/industry to specific catalog entries.
 */
export interface CatalogIndex {
  // global: always available
  global: {
    risks: RiskCatalogEntry[];
    conflicts: ConflictCatalogEntry[];
  };
  // industry-specific fallback
  industries: Record<string, {
    risks: RiskCatalogEntry[];
    conflicts: ConflictCatalogEntry[];
  }>;
  // case-specific overrides
  cases: Record<string, {
    risks: RiskCatalogEntry[];
    conflicts: ConflictCatalogEntry[];
  }>;
}

/**
 * Catalog resolver options.
 */
export interface CatalogResolverOptions {
  caseId?: string;
  industry?: string;
  phase?: SimPhase;
  approach?: DeliveryApproach;
}

/**
 * Resolved catalog result.
 */
export interface ResolvedCatalog {
  risks: RiskCatalogEntry[];
  conflicts: ConflictCatalogEntry[];
  sources: {
    risks: { entryId: string; source: "case" | "industry" | "global" }[];
    conflicts: { entryId: string; source: "case" | "industry" | "global" }[];
  };
}
