import type { LearningProjectionContentProvider } from "@projectsim/application";
import {
  emptyLearningSafeContent,
  type ContentPackageVersionId,
  type LearningSafeContent,
  type TenantId,
} from "@projectsim/domain";

export interface InMemoryLearningContentRecord {
  readonly tenantId: TenantId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly content: LearningSafeContent;
}

/**
 * Scaffolding learning-safe content adapter (not production Content Aggregate).
 */
export const createInMemoryLearningProjectionContentProvider = (
  records: readonly InMemoryLearningContentRecord[] = [],
): LearningProjectionContentProvider & {
  seed(record: InMemoryLearningContentRecord): void;
} => {
  const store: InMemoryLearningContentRecord[] = [...records];

  const matching = (
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
  ) =>
    store.find(
      (record) =>
        record.tenantId === tenantId &&
        record.contentPackageVersionId === contentPackageVersionId,
    );

  return {
    seed(record) {
      store.push(record);
    },
    async listLearningSafeContent(tenantId, contentPackageVersionId) {
      const matched = matching(tenantId, contentPackageVersionId);
      if (!matched) {
        return null;
      }
      return matched.content;
    },
  };
};

/** Deterministic scaffold learning content for tests/local MVP. */
export const createScaffoldLearningContentRecord = (input: {
  readonly tenantId: TenantId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}): InMemoryLearningContentRecord => ({
  tenantId: input.tenantId,
  contentPackageVersionId: input.contentPackageVersionId,
  content: emptyLearningSafeContent(input.contentPackageVersionId),
});
