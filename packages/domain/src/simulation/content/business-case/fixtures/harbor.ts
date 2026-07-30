/**
 * Harbor Logistics Recovery — independent second case fixture (BC-003).
 *
 * Deliberately reuses local entity IDs such as chapter.orientation and
 * decision.delivery-approach to prove package-scoped identity.
 */

import { asBusinessCaseId } from "../../../../shared-kernel/ids";
import { buildMinimalPackage } from "../fixture-builder";
import type { BusinessCaseContentPackage } from "../package";

export const HARBOR_BUSINESS_CASE_ID = asBusinessCaseId(
  "harbor-logistics-recovery",
);
export const HARBOR_CONTENT_VERSION = "1.0.0";

export const createHarborLogisticsRecoveryPackage =
  (): BusinessCaseContentPackage =>
    buildMinimalPackage({
      businessCaseId: HARBOR_BUSINESS_CASE_ID,
      contentVersion: HARBOR_CONTENT_VERSION,
      title: "Harbor Logistics Recovery",
      shortTitle: "Harbor Logistics",
      summary:
        "Stabilize a regional logistics recovery program after a major disruption. Technical fixture for multi-case isolation — not a production Content Bible.",
      industry: "Logistics and transportation",
      organizationType: "Regional freight operator",
      projectType: "Operational recovery program",
      difficulty: "intermediate",
      estimatedMinutes: 240,
      learningDays: 4,
      chapterCount: 2,
      publicationStatus: "published",
      availability: "available",
      experienceLevels: ["explorer", "practitioner", "leader"],
    });
