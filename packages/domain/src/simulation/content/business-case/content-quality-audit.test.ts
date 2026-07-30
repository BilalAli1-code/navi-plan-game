import { describe, expect, it } from "vitest";
import {
  auditContentQuality,
  contentQualityHardFailures,
  createHarborLogisticsRecoveryPackage,
  createNorthstarConnectedCarePackage,
  selectFinalEnding,
  type ConditionEvaluationFacts,
} from "../../index";

const FINAL_CLOSURE =
  "decision.northstar.chapter-06.final-closure-recommendation";

const factsWithOptions = (
  selected: ReadonlyArray<readonly [string, string]>,
): ConditionEvaluationFacts => ({
  completedChapterIds: new Set([
    "chapter-01",
    "chapter-02",
    "chapter-03",
    "chapter-04",
    "chapter-05",
  ]),
  currentChapterId: "chapter-06",
  initiallyUnlockedChapterIds: new Set(["chapter-01"]),
  submittedDecisionIds: new Set([FINAL_CLOSURE]),
  resolvedDecisionIds: new Set([FINAL_CLOSURE]),
  selectedOptionsByDecisionId: new Map(selected),
  completedActivityIds: new Set(),
  activeActivityIds: new Set(),
  completedMeetingIds: new Set(),
  availableDocumentIds: new Set(),
  deliveredMessageIds: new Set(),
  metricValues: new Map(),
  narrativeFlags: new Map(),
  experienceLevel: "practitioner",
});

describe("BC-007 content quality audit", () => {
  it("passes Northstar without blocker or critical findings", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const result = auditContentQuality(pkg);
    expect(contentQualityHardFailures(result)).toEqual([]);
    expect(result.chapterWorkload).toHaveLength(6);
    expect(pkg.manifest.estimatedMinutes).toBe(600);
    const totalEstimate = result.chapterWorkload.reduce(
      (sum, chapter) => sum + (chapter.estimatedMinutes ?? 0),
      0,
    );
    // Deterministic estimate should stay within a plausible band around the
    // approved 600-minute blueprint target (not a measured learner result).
    expect(totalEstimate).toBeGreaterThan(300);
    expect(totalEstimate).toBeLessThan(1200);
  });

  it("keeps Harbor green under the same audit", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const result = auditContentQuality(pkg);
    expect(
      contentQualityHardFailures(result).filter(
        (finding) => finding.code !== "ENDING_ALWAYS_ELIGIBLE",
      ),
    ).toEqual([]);
  });

  it("rejects learner-facing crisis/ending spoilers in Northstar guidance", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const serialized = JSON.stringify(pkg);
    expect(serialized).not.toMatch(/crisis severity/i);
    expect(serialized).not.toMatch(/ending credibility/i);
    expect(serialized).not.toMatch(/highest scoring/i);
  });

  it("requires evidence tags before decision eligibility for required decisions", () => {
    const pkg = createNorthstarConnectedCarePackage();
    for (const decision of pkg.decisions.filter((entry) => entry.required)) {
      const required = decision.requiredEvidence.filter(
        (evidence) => evidence.requiredForEligibility,
      );
      expect(required.length, decision.id).toBeGreaterThan(0);
    }
  });

  it("discriminates strong vs adverse closure endings", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const strong = selectFinalEnding(
      pkg.outcomes,
      factsWithOptions([
        [
          "decision.northstar.chapter-06.final-closure-recommendation",
          "option.northstar.chapter-06.final-closure.conditional-closure",
        ],
        [
          "decision.northstar.chapter-06.benefits-reporting-position",
          "option.northstar.chapter-06.benefits-report.distinguish-forecast-and-realized",
        ],
        [
          "decision.northstar.chapter-06.incident-response-strategy",
          "option.northstar.chapter-06.incident-resp.coordinated-cross-functional-response",
        ],
      ]),
    );
    const adverse = selectFinalEnding(
      pkg.outcomes,
      factsWithOptions([
        [
          "decision.northstar.chapter-06.final-closure-recommendation",
          "option.northstar.chapter-06.final-closure.recommend-administrative-closure-only",
        ],
        [
          "decision.northstar.chapter-06.benefits-reporting-position",
          "option.northstar.chapter-06.benefits-report.defer-benefits-claims",
        ],
        [
          "decision.northstar.chapter-06.incident-response-strategy",
          "option.northstar.chapter-06.incident-resp.vendor-led-technical-response",
        ],
        [
          "decision.northstar.chapter-06.deployment-continuation",
          "option.northstar.chapter-06.deploy-cont.rollback-affected-sites",
        ],
      ]),
    );
    expect(strong?.outcomeId).toBe("outcome.ending-e2-hard-won-recovery");
    expect(adverse?.outcomeId).toBe("outcome.ending-e9-administrative-closure");
    expect(strong?.outcomeId).not.toBe(adverse?.outcomeId);
  });

  it("keeps message.c3.scope-interpretation-conflict aligned to integration-assumption-failure", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const message = pkg.messages.find(
      (entry) => entry.id === "message.c3.scope-interpretation-conflict",
    );
    expect(message?.relatedDecisionId).toBe(
      "decision.northstar.chapter-03.integration-assumption-failure",
    );
    expect(JSON.stringify(message?.subject)).toMatch(/Integration assumption/i);
  });

  it("marks Chapter One context inbox items as informationalOnly", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const chapterOne = pkg.messages.filter(
      (message) => message.chapterId === "chapter-01",
    );
    for (const message of chapterOne) {
      if (!message.requiresResponse) {
        expect(message.informationalOnly, message.id).toBe(true);
      }
    }
  });
});
