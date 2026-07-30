import { describe, expect, it } from "vitest";
import { always } from "./conditions";
import { createHarborLogisticsRecoveryPackage } from "./fixtures/harbor";
import { createNorthstarConnectedCarePackage } from "./fixtures/northstar";
import { localizedText } from "./localized";
import { validateBusinessCasePackage } from "./validate";
import {
  classifyInboxMessage,
  listCanonicalContentReferences,
  validateCanonicalContentContractSet,
  type CanonicalContentContractSet,
  type CoachingInterventionDefinition,
} from "./canonical-contracts";

const createContractSet = (): CanonicalContentContractSet => ({
  package: createNorthstarConnectedCarePackage(),
  assessmentId: "assessment.northstar",
  coachingInterventions: [],
  traceability: [],
});

const createCoaching = (
  contractSet: CanonicalContentContractSet,
  id = "coaching.chapter-one-orientation",
): CoachingInterventionDefinition => ({
  id,
  chapterId: contractSet.package.chapters[0]!.id,
  interventionType: "orientation",
  triggerWhen: always,
  audience: ["explorer", "practitioner", "leader"],
  title: localizedText("Chapter orientation"),
  guidance: localizedText("Review the available evidence before deciding."),
  relatedDecisionIds: [contractSet.package.decisions[0]!.id],
  relatedActivityIds: [contractSet.package.activities[0]!.id],
});

describe("BC-006 canonical content contracts", () => {
  it("preserves existing BC-003 package compatibility", () => {
    expect(
      validateBusinessCasePackage(createNorthstarConnectedCarePackage()).status,
    ).toBe("passed");
    expect(
      validateBusinessCasePackage(createHarborLogisticsRecoveryPackage())
        .status,
    ).toBe("passed");
  });

  it("classifies informational Inbox content without counting it as a Decision", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const informational = pkg.messages.find(
      (message) => message.id === "message.info-kickoff-reminder",
    )!;
    expect(classifyInboxMessage(informational)).toBe("informational");

    const decisionBearing = {
      ...informational,
      informationalOnly: false,
      requiresResponse: true,
      relatedDecisionId: pkg.decisions[0]!.id,
    };
    expect(classifyInboxMessage(decisionBearing)).toBe("decision_bearing");
  });

  it("enumerates stable package and companion references", () => {
    const base = createContractSet();
    const coaching = createCoaching(base);
    const contractSet = {
      ...base,
      coachingInterventions: [coaching],
    };
    const references = listCanonicalContentReferences(contractSet);

    expect(
      references.some(
        (reference) =>
          reference.kind === "assessment" &&
          reference.id === "assessment.northstar",
      ),
    ).toBe(true);
    expect(
      references.some(
        (reference) =>
          reference.kind === "coaching_intervention" &&
          reference.id === coaching.id,
      ),
    ).toBe(true);
  });

  it("rejects duplicate coaching intervention IDs", () => {
    const base = createContractSet();
    const coaching = createCoaching(base);
    const result = validateCanonicalContentContractSet({
      ...base,
      coachingInterventions: [coaching, coaching],
    });

    expect(result.status).toBe("failed");
    expect(
      result.errors.some((error) => error.code === "DUPLICATE_COACHING_ID"),
    ).toBe(true);
  });

  it("rejects broken coaching references", () => {
    const base = createContractSet();
    const coaching = {
      ...createCoaching(base),
      chapterId: "chapter.missing",
      relatedDecisionIds: ["decision.missing"],
      relatedActivityIds: ["activity.missing"],
    };
    const result = validateCanonicalContentContractSet({
      ...base,
      coachingInterventions: [coaching],
    });

    expect(result.status).toBe("failed");
    expect(
      result.errors.filter(
        (error) => error.code === "BROKEN_COACHING_REFERENCE",
      ),
    ).toHaveLength(3);
  });

  it("rejects traceability that points to an unknown canonical entity", () => {
    const base = createContractSet();
    const result = validateCanonicalContentContractSet({
      ...base,
      traceability: [
        {
          entity: { kind: "decision", id: "decision.missing" },
          sources: [
            {
              documentPath:
                "docs/business-cases/06-decision-system/01_Decision_Catalog.md",
              section: "Decision catalog",
              anchor: null,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("failed");
    expect(
      result.errors.some(
        (error) => error.code === "BROKEN_TRACEABILITY_REFERENCE",
      ),
    ).toBe(true);
  });

  it("reports uncovered entities when strict traceability is enabled", () => {
    const result = validateCanonicalContentContractSet(createContractSet(), {
      requireTraceabilityCoverage: true,
    });

    expect(result.status).toBe("failed");
    expect(
      result.errors.some(
        (error) => error.code === "MISSING_TRACEABILITY_COVERAGE",
      ),
    ).toBe(true);
  });
});
