import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDocumentId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createDocumentLearnerSafeContent,
  createInitialSimulationState,
  parseSimulationState,
  processInitializeDocument,
  serializeSimulationState,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_document");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_document"),
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
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

const initInput = (documentId: string, commandSuffix = documentId) => ({
  documentId: asDocumentId(documentId),
  definitionVersion: "1",
  title: `Document ${documentId}`,
  category: "Briefing",
  description: "Learner-safe summary",
  body: "Line one\nLine two",
  commandId: asCommandId(`cmd_doc_${commandSuffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_doc_${commandSuffix}`),
});

describe("Document runtime domain", () => {
  it("rejects markup in learner-visible content", () => {
    const content = createDocumentLearnerSafeContent({
      title: "Plan",
      body: "Do not render <script>",
    });
    expect(content.ok).toBe(false);
    if (content.ok) {
      return;
    }
    expect(content.error.code).toBe("DOCUMENT_CONTENT_INVALID");
  });

  it("initializes an available plain-text Document with provenance and ordering", () => {
    const first = processInitializeDocument(activeRun(), initInput("doc_a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.identicalNoop).toBe(false);
    expect(first.value.events.map((event) => event.eventType)).toEqual([
      "DocumentInitialized",
    ]);
    expect(first.value.document.creationSequence).toBe(1);
    expect(first.value.document.status).toBe("available");
    expect(first.value.document.content.contentType).toBe("plain_text");
    expect(first.value.run.state.schemaVersion).toBe(8);
    expect(first.value.run.state.documents).toHaveLength(1);

    const second = processInitializeDocument(
      first.value.run,
      initInput("doc_b"),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.document.creationSequence).toBe(2);
    expect(
      second.value.run.state.documents.map((doc) => doc.documentId),
    ).toEqual(["doc_a", "doc_b"]);
  });

  it("treats identical initialization as a no-op without duplicating", () => {
    const first = processInitializeDocument(activeRun(), initInput("doc_a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const retry = processInitializeDocument(
      first.value.run,
      initInput("doc_a", "retry"),
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.value.identicalNoop).toBe(true);
    expect(retry.value.events).toHaveLength(0);
    expect(retry.value.run.state.documents).toHaveLength(1);
    expect(retry.value.run.aggregateVersion).toBe(
      first.value.run.aggregateVersion + 1,
    );
  });

  it("rejects conflicting initialization for the same DocumentId", () => {
    const first = processInitializeDocument(activeRun(), initInput("doc_a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const conflict = processInitializeDocument(first.value.run, {
      ...initInput("doc_a", "conflict"),
      body: "Different body",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.error.code).toBe("DOCUMENT_IDENTITY_CONFLICT");
    expect(first.value.run.state.documents).toHaveLength(1);
  });

  it("round-trips schema v8 and upcasts v5 states to empty Document collections", () => {
    const initialized = processInitializeDocument(
      activeRun(),
      initInput("doc_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const serialized = serializeSimulationState(initialized.value.run.state);
    expect(serialized.schemaVersion).toBe(8);
    expect(serialized.documents).toEqual([
      {
        documentId: "doc_a",
        documentDefinitionId: "doc_a",
        documentDefinitionVersion: "1",
        creationSequence: 1,
        content: {
          title: "Document doc_a",
          category: "Briefing",
          description: "Learner-safe summary",
          contentType: "plain_text",
          body: "Line one\nLine two",
        },
        status: "available",
        createdAt: now,
        originatingCommandId: "cmd_doc_doc_a",
      },
    ]);

    const parsed = parseSimulationState(serialized);
    expect(parsed?.schemaVersion).toBe(8);
    expect(parsed?.documents[0]?.content.body).toBe("Line one\nLine two");

    const upcast = parseSimulationState({
      ...serialized,
      schemaVersion: 5,
      documents: undefined,
      notifications: undefined,
    });
    expect(upcast?.schemaVersion).toBe(8);
    expect(upcast?.documents).toEqual([]);
    expect(upcast?.notifications).toEqual([]);
  });
});
