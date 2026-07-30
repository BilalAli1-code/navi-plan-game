import { describe, expect, it } from "vitest";
import {
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asDocumentId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createDocumentLearnerSafeContent,
  createDocumentRuntime,
  createInitialSimulationState,
  type DocumentRuntime,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  buildDocumentsProjection,
  computeDocumentsSemanticHash,
} from "./documents-builder";
import {
  DOCUMENTS_PROJECTION_SCHEMA_VERSION,
  DOCUMENTS_PROJECTION_TYPE,
} from "./documents-contracts";
import { parseDocumentsProjection } from "./documents-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: null,
  currentDayId: null,
  startedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  state: createInitialSimulationState(),
  ...overrides,
});

const runtime = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly title?: string;
  readonly body?: string;
}): DocumentRuntime => {
  const content = createDocumentLearnerSafeContent({
    title: input.title ?? `Document ${input.id}`,
    category: "Briefing",
    description: "A learner-safe document",
    body: input.body ?? "Line one\nLine two",
  });
  if (!content.ok) {
    throw new Error("content failed");
  }
  const created = createDocumentRuntime({
    documentId: asDocumentId(input.id),
    documentDefinitionVersion: "1",
    creationSequence: input.sequence,
    content: content.value,
    createdAt: now,
    originatingCommandId: asCommandId(`cmd_doc_${input.sequence}`),
  });
  if (!created.ok) {
    throw new Error("runtime failed");
  }
  return created.value;
};

const stateWith = (documents: readonly DocumentRuntime[]): SimulationState => ({
  ...createInitialSimulationState(),
  documents: [...documents],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildDocumentsProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("buildDocumentsProjection", () => {
  it("builds schema v1 empty Documents projection", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(DOCUMENTS_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      DOCUMENTS_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:documents:tenant_1:run_1",
    );
    expect(result.value.documents).toEqual([]);
    expect(result.value.summary).toEqual({
      totalDocuments: 0,
      isEmpty: true,
    });
    expect(result.value.capabilities).toEqual({
      upload: "unsupported",
      edit: "unsupported",
      comment: "unsupported",
    });
  });

  it("orders Documents by creationSequence and maps plain-text body", () => {
    const result = buildFor(
      activeRun({
        state: stateWith([
          runtime({ id: "doc_b", sequence: 2, title: "Second" }),
          runtime({ id: "doc_a", sequence: 1, title: "First" }),
        ]),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.documents.map((item) => item.documentId)).toEqual([
      "doc_a",
      "doc_b",
    ]);
    expect(result.value.documents[0]).toMatchObject({
      documentId: "doc_a",
      title: "First",
      category: "Briefing",
      contentType: "plain_text",
      body: "Line one\nLine two",
      status: "available",
    });
    expect(result.value.documents[0]).not.toHaveProperty(
      "originatingCommandId",
    );
    expect(result.value.summary).toEqual({
      totalDocuments: 2,
      isEmpty: false,
    });
  });

  it("keeps semantic hash stable across generatedAt/sourceEventId changes", () => {
    const first = buildFor(
      activeRun({
        state: stateWith([runtime({ id: "doc_a", sequence: 1 })]),
      }),
      asIsoTimestamp("2026-07-26T12:00:00.000Z"),
    );
    const second = buildFor(
      activeRun({
        state: stateWith([runtime({ id: "doc_a", sequence: 1 })]),
      }),
      asIsoTimestamp("2026-07-26T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(
      computeDocumentsSemanticHash({
        ...first.value,
        generatedAt: second.value.generatedAt,
        sourceEventId: null,
      }),
    ).toBe(first.value.semanticHash);

    const changed = buildFor(
      activeRun({
        state: stateWith([
          runtime({ id: "doc_a", sequence: 1, body: "Changed" }),
        ]),
      }),
    );
    expect(changed.ok).toBe(true);
    if (!changed.ok) {
      return;
    }
    expect(changed.value.semanticHash).not.toBe(first.value.semanticHash);
  });
});

describe("parseDocumentsProjection", () => {
  it("round-trips a built projection and rejects hidden fields", () => {
    const built = buildFor(
      activeRun({
        state: stateWith([runtime({ id: "doc_a", sequence: 1 })]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }

    const parsed = parseDocumentsProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.documents[0]?.body).toBe("Line one\nLine two");

    const hidden = parseDocumentsProjection({
      ...built.value,
      documents: [
        {
          ...built.value.documents[0],
          originatingCommandId: "cmd_doc_1",
        },
      ],
    });
    expect(hidden.ok).toBe(false);
    if (hidden.ok) {
      return;
    }
    expect(hidden.error.code).toBe("PROJECTION_PAYLOAD_INVALID");
  });
});
