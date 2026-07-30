/**
 * BC-006 Workstream 7 — deterministic final ending selection.
 *
 * Selects among authored package outcomes whose `eligibleWhen` matches
 * authoritative facts. Tie-break: higher classificationRank, then stable id.
 * Version: ending-resolver/v1.
 *
 * Northstar E1–E9 author discriminative `eligibleWhen` conditions on Chapter
 * Six decisions (BC-007). Gates use resolved final-closure (selection runs
 * before chapter_status=completed). E9 is the catch-all; higher ranks win.
 */

import { evaluateConditionExpression } from "../content/business-case/evaluate-condition";
import type { ConditionEvaluationFacts } from "../content/business-case/evaluate-condition";
import type { OutcomeDefinition } from "../content/business-case/entities";

export const FINAL_ENDING_RESOLVER_VERSION = "ending-resolver/v1";

export interface FinalEndingSelection {
  readonly outcomeId: string;
  readonly title: string;
  readonly summary: string;
  readonly classificationRank: number;
  readonly resolverVersion: typeof FINAL_ENDING_RESOLVER_VERSION;
  readonly eligibleCandidateIds: readonly string[];
}

const isFinalEndingOutcome = (outcome: OutcomeDefinition): boolean =>
  outcome.id.startsWith("outcome.ending-");

/**
 * Deterministically select one final ending profile from authored outcomes.
 */
export const selectFinalEnding = (
  outcomes: readonly OutcomeDefinition[],
  facts: ConditionEvaluationFacts,
): FinalEndingSelection | null => {
  const eligible = outcomes
    .filter(isFinalEndingOutcome)
    .filter((outcome) =>
      evaluateConditionExpression(outcome.eligibleWhen, facts),
    )
    .slice()
    .sort((left, right) => {
      if (left.classificationRank !== right.classificationRank) {
        return right.classificationRank - left.classificationRank;
      }
      return left.id.localeCompare(right.id);
    });

  const selected = eligible[0];
  if (!selected) {
    return null;
  }

  const title =
    Object.values(selected.title.values).find((value) => value.length > 0) ??
    selected.id;
  const summary =
    Object.values(selected.summary.values).find((value) => value.length > 0) ??
    "";

  return {
    outcomeId: selected.id,
    title,
    summary,
    classificationRank: selected.classificationRank,
    resolverVersion: FINAL_ENDING_RESOLVER_VERSION,
    eligibleCandidateIds: eligible.map((outcome) => outcome.id),
  };
};
