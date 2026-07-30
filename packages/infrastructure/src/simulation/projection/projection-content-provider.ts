import type { DecisionProjectionContentProvider } from "@projectsim/application";
import {
  createScaffoldDecisionDefinition,
  emptyProjectionSafeCatalog,
  type ContentPackageVersionId,
  type DecisionDefinition,
  type DecisionId,
  type ProjectionSafeContent,
  type ProjectionSafeDecisionDefinition,
  type TenantId,
} from "@projectsim/domain";

export interface InMemoryProjectionContentRecord {
  readonly tenantId: TenantId;
  readonly definition: DecisionDefinition;
  readonly authoredOrder: number;
  readonly title: string;
  readonly prompt: string;
  readonly description: string | null;
  readonly optionLabels: Readonly<Record<string, string>>;
  readonly publicResultSummaryByOptionId: Readonly<
    Record<string, string | null>
  >;
}

/**
 * Scaffolding projection-safe content adapter (not production Content Aggregate).
 */
export const createInMemoryDecisionProjectionContentProvider = (
  records: readonly InMemoryProjectionContentRecord[] = [],
): DecisionProjectionContentProvider & {
  seed(record: InMemoryProjectionContentRecord): void;
} => {
  const store: InMemoryProjectionContentRecord[] = [...records];

  const matching = (
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
  ) =>
    store.filter(
      (record) =>
        record.tenantId === tenantId &&
        record.definition.contentPackageVersionId === contentPackageVersionId,
    );

  return {
    seed(record) {
      store.push(record);
    },
    async listProjectionSafeContent(tenantId, contentPackageVersionId) {
      const matched = matching(tenantId, contentPackageVersionId);
      if (matched.length === 0) {
        return null;
      }
      const decisions: ProjectionSafeDecisionDefinition[] = matched
        .slice()
        .sort((a, b) =>
          a.authoredOrder !== b.authoredOrder
            ? a.authoredOrder - b.authoredOrder
            : a.definition.id.localeCompare(b.definition.id),
        )
        .map((record) => ({
          id: record.definition.id,
          contentPackageVersionId: record.definition.contentPackageVersionId,
          authoredOrder: record.authoredOrder,
          title: record.title,
          prompt: record.prompt,
          description: record.description,
          availability: record.definition.availability,
          expiresAt: record.definition.expiresAt,
          options: record.definition.options.map((option, index) => ({
            id: option.id,
            authoredOrder: index,
            label: record.optionLabels[option.id] ?? option.id,
          })),
          publicResultSummaryByOptionId: record.publicResultSummaryByOptionId,
        }));
      return {
        contentPackageVersionId,
        ...emptyProjectionSafeCatalog(),
        decisions,
      } satisfies ProjectionSafeContent;
    },
    async listEligibilityDefinitions(tenantId, contentPackageVersionId) {
      const matched = matching(tenantId, contentPackageVersionId);
      if (matched.length === 0) {
        return null;
      }
      return matched.map((record) => record.definition);
    },
  };
};

/** Deterministic scaffold record for tests/local MVP. */
export const createScaffoldProjectionContentRecord = (input: {
  readonly tenantId: TenantId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly decisionId?: DecisionId;
  readonly authoredOrder?: number;
}): InMemoryProjectionContentRecord => {
  const definition = createScaffoldDecisionDefinition(
    input.decisionId === undefined
      ? { contentPackageVersionId: input.contentPackageVersionId }
      : {
          id: input.decisionId,
          contentPackageVersionId: input.contentPackageVersionId,
        },
  );
  return {
    tenantId: input.tenantId,
    definition,
    authoredOrder: input.authoredOrder ?? 0,
    title: "Scaffold Decision",
    prompt: "Choose how to proceed.",
    description: "Deterministic fixture decision for projection tests.",
    optionLabels: {
      option_a: "Conservative option",
      option_b: "Balanced option",
    },
    publicResultSummaryByOptionId: {
      option_a: "You chose a conservative path.",
      option_b: "You chose a balanced path.",
    },
  };
};
