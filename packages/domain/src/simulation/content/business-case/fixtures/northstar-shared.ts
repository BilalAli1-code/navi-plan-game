/**
 * BC-006 Northstar shared assessment, achievements, and outcomes (chapters 2–6 merge).
 */

import type { ConditionExpression } from "../conditions";
import type {
  AchievementDefinition,
  AssessmentDefinition,
  OutcomeDefinition,
} from "../entities";
import { asAchievementId, asCompetencyId, asOutcomeId } from "../ids";
import { localizedText } from "../localized";
import {
  asDecisionId,
  asDecisionOptionId,
} from "../../../../shared-kernel/ids";

const EXPANDED_COMPETENCY_DEFS = [
  {
    id: "competency.team-leadership",
    title: "Team leadership",
    description:
      "Building sustainable team capacity, resolving conflict, and maintaining delivery discipline under pressure.",
  },
  {
    id: "competency.risk-uncertainty",
    title: "Risk and uncertainty",
    description:
      "Identifying, assessing, and responding to risk and uncertainty with explicit assumptions and controls.",
  },
  {
    id: "competency.quality-compliance",
    title: "Quality and compliance",
    description:
      "Protecting patient safety, regulatory integrity, and evidence-based acceptance decisions.",
  },
  {
    id: "competency.procurement-vendor",
    title: "Procurement and vendor management",
    description:
      "Governing vendor obligations, commercial boundaries, and accountable partnership through delivery and closure.",
  },
  {
    id: "competency.change-adaptation",
    title: "Change and adaptation",
    description:
      "Leading adoption, stakeholder engagement, and adaptive responses when plans meet operational reality.",
  },
  {
    id: "competency.benefits-closure",
    title: "Benefits and closure",
    description:
      "Establishing benefits accountability, transferring obligations, and closing projects without orphaned risk.",
  },
  {
    id: "competency.reflective-practice",
    title: "Reflective practice",
    description:
      "Learning from decisions, documenting lessons, and transferring judgment to future practice.",
  },
] as const;

const ADDITIONAL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: asAchievementId("achievement.recovery-leader"),
    title: localizedText("Recovery Leader"),
    description: localizedText(
      "Submitted an integrated recovery recommendation supported by evidence during mid-project recovery.",
    ),
    awardedWhen: {
      kind: "decision_status",
      decisionId: asDecisionId(
        "decision.northstar.chapter-04.recovery-strategy",
      ),
      status: "resolved",
    },
    iconAssetId: null,
  },
  {
    id: asAchievementId("achievement.readiness-guardian"),
    title: localizedText("Readiness Guardian"),
    description: localizedText(
      "Prepared a segmented readiness recommendation that protected operational safety before go-live.",
    ),
    awardedWhen: {
      kind: "decision_status",
      decisionId: asDecisionId(
        "decision.northstar.chapter-05.deployment-strategy-recommendation",
      ),
      status: "resolved",
    },
    iconAssetId: null,
  },
  {
    id: asAchievementId("achievement.closure-steward"),
    title: localizedText("Closure Steward"),
    description: localizedText(
      "Recommended formal closure with explicit transfer of residual obligations and governance.",
    ),
    awardedWhen: {
      kind: "decision_status",
      decisionId: asDecisionId(
        "decision.northstar.chapter-06.final-closure-recommendation",
      ),
      status: "resolved",
    },
    iconAssetId: null,
  },
  {
    id: asAchievementId("achievement.benefits-owner"),
    title: localizedText("Benefits Owner"),
    description: localizedText(
      "Established credible benefits monitoring and reporting accountability at project closure.",
    ),
    awardedWhen: {
      kind: "decision_status",
      decisionId: asDecisionId(
        "decision.northstar.chapter-06.benefits-reporting-position",
      ),
      status: "resolved",
    },
    iconAssetId: null,
  },
];

const optionSelected = (
  decisionId: string,
  optionId: string,
): ConditionExpression => ({
  kind: "decision_option_selected",
  decisionId: asDecisionId(decisionId),
  optionId: asDecisionOptionId(optionId),
});

const FINAL_CLOSURE =
  "decision.northstar.chapter-06.final-closure-recommendation";
const BENEFITS_REPORT =
  "decision.northstar.chapter-06.benefits-reporting-position";
const ACCEPTANCE = "decision.northstar.chapter-06.acceptance-position";
const DEPLOYMENT = "decision.northstar.chapter-06.deployment-continuation";
const INCIDENT = "decision.northstar.chapter-06.incident-response-strategy";

/**
 * Final ending selection runs during CompleteChapter for Chapter Six, before
 * that chapter is marked completed. Gate on the resolved final-closure decision
 * (observable at selection time) rather than chapter_status=completed.
 */
const FINAL_CLOSURE_RESOLVED: ConditionExpression = {
  kind: "decision_status",
  decisionId: asDecisionId(FINAL_CLOSURE),
  status: "resolved",
};

/**
 * Discriminative ending eligibility (BC-007).
 *
 * Conditions use observable Chapter Six decision options already authored in
 * the Northstar package. Rank still breaks ties. E9 remains the catch-all when
 * final closure is resolved so final ending selection never returns null.
 */
const ENDING_OUTCOMES: readonly {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly rank: number;
  readonly eligibleWhen: ConditionExpression;
}[] = [
  {
    id: "outcome.ending-e1-sustainable-value",
    title: "E1 — Sustainable Value Delivered",
    summary:
      "The solution is deployed responsibly, operations accepts ownership, benefits accountability is established, stakeholder trust is strong, and residual obligations are controlled.",
    rank: 18,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.recommend-closure",
        ),
        optionSelected(
          BENEFITS_REPORT,
          "option.northstar.chapter-06.benefits-report.distinguish-forecast-and-realized",
        ),
        optionSelected(
          ACCEPTANCE,
          "option.northstar.chapter-06.acceptance.full-acceptance",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e2-hard-won-recovery",
    title: "E2 — Successful but Hard-Won Recovery",
    summary:
      "Material disruption was recovered through transparent leadership, disciplined governance, and controlled trade-offs. Some benefits are delayed, but the operating model is sustainable.",
    rank: 17,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.conditional-closure",
        ),
        optionSelected(
          BENEFITS_REPORT,
          "option.northstar.chapter-06.benefits-report.distinguish-forecast-and-realized",
        ),
        optionSelected(
          INCIDENT,
          "option.northstar.chapter-06.incident-resp.coordinated-cross-functional-response",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e3-conditional-success",
    title: "E3 — Conditional Success",
    summary:
      "Core capabilities are delivered, but adoption, benefits, vendor, or operational obligations remain. Closure is defensible because ownership and governance are explicit.",
    rank: 16,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.conditional-closure",
        ),
        optionSelected(
          BENEFITS_REPORT,
          "option.northstar.chapter-06.benefits-report.distinguish-forecast-and-realized",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e4-weak-adoption",
    title: "E4 — Technical Delivery, Weak Adoption",
    summary:
      "The platform is deployed, but workflow acceptance, training effectiveness, or frontline trust is weak. Benefits remain at risk and support demand is elevated.",
    rank: 15,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        {
          kind: "any",
          conditions: [
            optionSelected(
              BENEFITS_REPORT,
              "option.northstar.chapter-06.benefits-report.report-early-indicators-only",
            ),
            optionSelected(
              BENEFITS_REPORT,
              "option.northstar.chapter-06.benefits-report.defer-benefits-claims",
            ),
          ],
        },
        {
          kind: "any",
          conditions: [
            optionSelected(
              FINAL_CLOSURE,
              "option.northstar.chapter-06.final-closure.recommend-closure",
            ),
            optionSelected(
              FINAL_CLOSURE,
              "option.northstar.chapter-06.final-closure.conditional-closure",
            ),
          ],
        },
      ],
    },
  },
  {
    id: "outcome.ending-e5-controlled-delay",
    title: "E5 — Controlled Delay Protects Value",
    summary:
      "Deployment was postponed or phased because readiness or safety thresholds were not met. Near-term executive satisfaction declined, but avoidable operational harm was prevented.",
    rank: 14,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.defer-closure",
        ),
        {
          kind: "any",
          conditions: [
            optionSelected(
              DEPLOYMENT,
              "option.northstar.chapter-06.deploy-cont.pause-deployment",
            ),
            optionSelected(
              DEPLOYMENT,
              "option.northstar.chapter-06.deploy-cont.restrict-to-safe-scope",
            ),
          ],
        },
      ],
    },
  },
  {
    id: "outcome.ending-e6-governance-breakdown",
    title: "E6 — Governance and Credibility Breakdown",
    summary:
      "Unsupported commitments, hidden risk, weak change control, or inconsistent reporting led to executive intervention and reduced learner authority.",
    rank: 13,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          BENEFITS_REPORT,
          "option.northstar.chapter-06.benefits-report.report-forecast-as-realized",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e7-unstable-transition",
    title: "E7 — Operationally Unstable Transition",
    summary:
      "Deployment proceeded without adequate ownership, support, or readiness. Incidents, unresolved obligations, and stakeholder distrust remain after closure.",
    rank: 12,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          DEPLOYMENT,
          "option.northstar.chapter-06.deploy-cont.continue-deployment",
        ),
        optionSelected(
          INCIDENT,
          "option.northstar.chapter-06.incident-resp.vendor-led-technical-response",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e8-responsible-stop",
    title: "E8 — Responsible Stop or Redirection",
    summary:
      "Stopping or materially redirecting an unsustainable component protected value, ethics, and organizational learning even though the original plan was not met.",
    rank: 11,
    eligibleWhen: {
      kind: "all",
      conditions: [
        FINAL_CLOSURE_RESOLVED,
        optionSelected(
          FINAL_CLOSURE,
          "option.northstar.chapter-06.final-closure.defer-closure",
        ),
      ],
    },
  },
  {
    id: "outcome.ending-e9-administrative-closure",
    title: "E9 — Administrative Closure Without Value Assurance",
    summary:
      "Records and contracts are closed, but benefits ownership, residual risk, or operational accountability is incomplete. Formally complete but professionally weak.",
    rank: 10,
    // Catch-all once final closure is resolved (selection-time gate).
    // Higher-ranked endings win when they also match.
    eligibleWhen: FINAL_CLOSURE_RESOLVED,
  },
];

/** Merge Chapter One assessment with expanded competencies and rebalanced weights. */
export const createNorthstarAssessment = (
  chapterOneAssessment: AssessmentDefinition,
): AssessmentDefinition => {
  const existingIds = new Set(
    chapterOneAssessment.competencies.map((c) => c.id),
  );
  const additional = EXPANDED_COMPETENCY_DEFS.filter(
    (c) => !existingIds.has(asCompetencyId(c.id)),
  ).map((c) => ({
    id: asCompetencyId(c.id),
    title: localizedText(c.title),
    description: localizedText(c.description),
  }));

  const competencies = [...chapterOneAssessment.competencies, ...additional];
  const weights: Record<string, number> = {
    ...chapterOneAssessment.weights,
    [asCompetencyId("competency.team-leadership")]: 8,
    [asCompetencyId("competency.risk-uncertainty")]: 8,
    [asCompetencyId("competency.quality-compliance")]: 8,
    [asCompetencyId("competency.procurement-vendor")]: 7,
    [asCompetencyId("competency.change-adaptation")]: 7,
    [asCompetencyId("competency.benefits-closure")]: 7,
    [asCompetencyId("competency.reflective-practice")]: 5,
  };

  return {
    competencies,
    weights,
    decisionRubrics: chapterOneAssessment.decisionRubrics,
  };
};

export const createNorthstarAchievements = (
  chapterOneAchievements: readonly AchievementDefinition[],
): AchievementDefinition[] => {
  const existing = new Set(chapterOneAchievements.map((a) => a.id));
  const merged = [...chapterOneAchievements];
  for (const achievement of ADDITIONAL_ACHIEVEMENTS) {
    if (!existing.has(achievement.id)) {
      merged.push(achievement);
    }
  }
  return merged;
};

export const createNorthstarOutcomes = (
  chapterOneOutcomes: readonly OutcomeDefinition[],
): OutcomeDefinition[] => {
  const existing = new Set(chapterOneOutcomes.map((o) => o.id));
  const merged: OutcomeDefinition[] = [...chapterOneOutcomes];
  for (const ending of ENDING_OUTCOMES) {
    if (!existing.has(asOutcomeId(ending.id))) {
      merged.push({
        id: asOutcomeId(ending.id),
        title: localizedText(ending.title),
        summary: localizedText(ending.summary),
        classificationRank: ending.rank,
        eligibleWhen: ending.eligibleWhen,
        reflectionPrompts: [
          localizedText(
            "Which decisions most shaped the final Connected Care outcome you reached?",
          ),
          localizedText(
            "What would you do differently to strengthen sustainable value and stakeholder trust?",
          ),
        ],
      });
    }
  }
  return merged;
};
