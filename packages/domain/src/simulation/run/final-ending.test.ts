import { describe, expect, it } from "vitest";
import {
  createNorthstarConnectedCarePackage,
  selectFinalEnding,
  FINAL_ENDING_RESOLVER_VERSION,
  type ConditionEvaluationFacts,
} from "../../index";

const FINAL_CLOSURE =
  "decision.northstar.chapter-06.final-closure-recommendation";

const baseFacts = (
  overrides: Partial<ConditionEvaluationFacts> = {},
): ConditionEvaluationFacts => ({
  completedChapterIds: new Set(["chapter-01", "chapter-05"]),
  currentChapterId: "chapter-06",
  initiallyUnlockedChapterIds: new Set(["chapter-01"]),
  submittedDecisionIds: new Set([FINAL_CLOSURE]),
  resolvedDecisionIds: new Set([FINAL_CLOSURE]),
  selectedOptionsByDecisionId: new Map(),
  completedActivityIds: new Set(),
  activeActivityIds: new Set(),
  completedMeetingIds: new Set(),
  availableDocumentIds: new Set(),
  deliveredMessageIds: new Set(),
  metricValues: new Map(),
  narrativeFlags: new Map(),
  experienceLevel: "practitioner",
  ...overrides,
});

describe("selectFinalEnding", () => {
  it("falls back to E9 when final closure is resolved without stronger matches", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const first = selectFinalEnding(pkg.outcomes, baseFacts());
    const second = selectFinalEnding(pkg.outcomes, baseFacts());
    expect(first).not.toBeNull();
    expect(first).toEqual(second);
    expect(first?.resolverVersion).toBe(FINAL_ENDING_RESOLVER_VERSION);
    expect(first?.outcomeId).toBe("outcome.ending-e9-administrative-closure");
    expect(first?.classificationRank).toBe(10);
    expect(first?.eligibleCandidateIds).toEqual([
      "outcome.ending-e9-administrative-closure",
    ]);
  });

  it("selects E2 for the responsible mid-option closure path", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const facts = baseFacts({
      selectedOptionsByDecisionId: new Map([
        [
          FINAL_CLOSURE,
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
    });
    const selected = selectFinalEnding(pkg.outcomes, facts);
    expect(selected?.outcomeId).toBe("outcome.ending-e2-hard-won-recovery");
  });

  it("selects E1 only when full acceptance and recommend-closure align", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const facts = baseFacts({
      selectedOptionsByDecisionId: new Map([
        [
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.recommend-closure",
        ],
        [
          "decision.northstar.chapter-06.benefits-reporting-position",
          "option.northstar.chapter-06.benefits-report.distinguish-forecast-and-realized",
        ],
        [
          "decision.northstar.chapter-06.acceptance-position",
          "option.northstar.chapter-06.acceptance.full-acceptance",
        ],
      ]),
    });
    const selected = selectFinalEnding(pkg.outcomes, facts);
    expect(selected?.outcomeId).toBe("outcome.ending-e1-sustainable-value");
  });

  it("keeps endings ineligible before final closure is resolved", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const facts = baseFacts({
      submittedDecisionIds: new Set(),
      resolvedDecisionIds: new Set(),
      selectedOptionsByDecisionId: new Map(),
    });
    expect(selectFinalEnding(pkg.outcomes, facts)).toBeNull();
  });
});
