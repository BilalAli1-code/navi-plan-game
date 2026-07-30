import type {
  ContentPackageVersionId,
  DecisionDefinition,
  DecisionId,
  TenantId,
} from "@projectsim/domain";
import type { DecisionDefinitionProvider } from "@projectsim/application";

export interface InMemoryDecisionDefinitionRecord {
  readonly tenantId: TenantId;
  readonly definition: DecisionDefinition;
}

/**
 * Deterministic in-memory DecisionDefinitionProvider for tests and local MVP.
 *
 * Scaffolding only — not production content. There is no persistent Content
 * Aggregate yet. Prefer `createScaffoldDecisionDefinition` from domain for
 * PS-ROADMAP-005 outcome/consequence fixtures. Lookup is scoped by tenant +
 * contentPackageVersionId + id.
 */
export const createInMemoryDecisionDefinitionProvider = (
  records: readonly InMemoryDecisionDefinitionRecord[] = [],
): DecisionDefinitionProvider & {
  seed(record: InMemoryDecisionDefinitionRecord): void;
} => {
  const byKey = new Map<string, DecisionDefinition>();
  const key = (
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
    decisionDefinitionId: DecisionId,
  ) => `${tenantId}:${contentPackageVersionId}:${decisionDefinitionId}`;

  for (const record of records) {
    byKey.set(
      key(
        record.tenantId,
        record.definition.contentPackageVersionId,
        record.definition.id,
      ),
      record.definition,
    );
  }

  return {
    seed(record) {
      byKey.set(
        key(
          record.tenantId,
          record.definition.contentPackageVersionId,
          record.definition.id,
        ),
        record.definition,
      );
    },
    async getDecisionDefinition(
      tenantId,
      contentPackageVersionId,
      decisionDefinitionId,
    ) {
      return (
        byKey.get(
          key(tenantId, contentPackageVersionId, decisionDefinitionId),
        ) ?? null
      );
    },
  };
};
