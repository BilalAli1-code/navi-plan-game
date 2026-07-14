// Industry catalog exports.

import { softwareRisks, softwareConflicts } from "./software";
import { healthcareRisks, healthcareConflicts } from "./healthcare";
import type { RiskCatalogEntry, ConflictCatalogEntry } from "../types";

// Placeholder catalogs for industries to be populated
const constructionRisks: RiskCatalogEntry[] = [];
const constructionConflicts: ConflictCatalogEntry[] = [];

const manufacturingRisks: RiskCatalogEntry[] = [];
const manufacturingConflicts: ConflictCatalogEntry[] = [];

const governmentRisks: RiskCatalogEntry[] = [];
const governmentConflicts: ConflictCatalogEntry[] = [];

const financeRisks: RiskCatalogEntry[] = [];
const financeConflicts: ConflictCatalogEntry[] = [];

const telecomRisks: RiskCatalogEntry[] = [];
const telecomConflicts: ConflictCatalogEntry[] = [];

const energyRisks: RiskCatalogEntry[] = [];
const energyConflicts: ConflictCatalogEntry[] = [];

const logisticsRisks: RiskCatalogEntry[] = [];
const logisticsConflicts: ConflictCatalogEntry[] = [];

const retailRisks: RiskCatalogEntry[] = [];
const retailConflicts: ConflictCatalogEntry[] = [];

const educationRisks: RiskCatalogEntry[] = [];
const educationConflicts: ConflictCatalogEntry[] = [];

const infrastructureRisks: RiskCatalogEntry[] = [];
const infrastructureConflicts: ConflictCatalogEntry[] = [];

const pharmaRisks: RiskCatalogEntry[] = [];
const pharmaConflicts: ConflictCatalogEntry[] = [];

const aerospaceRisks: RiskCatalogEntry[] = [];
const aerospaceConflicts: ConflictCatalogEntry[] = [];

const nonprofitRisks: RiskCatalogEntry[] = [];
const nonprofitConflicts: ConflictCatalogEntry[] = [];

export const industryCatalogs: Record<string, { risks: RiskCatalogEntry[]; conflicts: ConflictCatalogEntry[] }> = {
  Software: { risks: softwareRisks, conflicts: softwareConflicts },
  SaaS: { risks: softwareRisks, conflicts: softwareConflicts },
  Healthcare: { risks: healthcareRisks, conflicts: healthcareConflicts },
  Construction: { risks: constructionRisks, conflicts: constructionConflicts },
  Manufacturing: { risks: manufacturingRisks, conflicts: manufacturingConflicts },
  Government: { risks: governmentRisks, conflicts: governmentConflicts },
  Finance: { risks: financeRisks, conflicts: financeConflicts },
  Telecommunications: { risks: telecomRisks, conflicts: telecomConflicts },
  Energy: { risks: energyRisks, conflicts: energyConflicts },
  Logistics: { risks: logisticsRisks, conflicts: logisticsConflicts },
  Retail: { risks: retailRisks, conflicts: retailConflicts },
  Education: { risks: educationRisks, conflicts: educationConflicts },
  Infrastructure: { risks: infrastructureRisks, conflicts: infrastructureConflicts },
  Pharmaceutical: { risks: pharmaRisks, conflicts: pharmaConflicts },
  Aerospace: { risks: aerospaceRisks, conflicts: aerospaceConflicts },
  "Non-Profit": { risks: nonprofitRisks, conflicts: nonprofitConflicts },
};
