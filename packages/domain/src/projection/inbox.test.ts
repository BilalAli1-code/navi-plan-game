import { describe, expect, it } from "vitest";
import {
  asBusinessCaseId,
  asContentPackageVersionId,
  asIsoTimestamp,
  asLearnerId,
  asLearnerMessageDefinitionId,
  asLearnerMessageOccurrenceId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createLearnerMessageOccurrence,
  type LearnerMessageOccurrence,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import {
  buildInboxProjection,
  computeInboxSemanticHash,
  deriveInboxMessagePreview,
} from "./inbox-builder";
import {
  INBOX_PROJECTION_SCHEMA_VERSION,
  INBOX_PROJECTION_TYPE,
} from "./inbox-contracts";
import { parseInboxProjection } from "./inbox-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const projectionContent = (): ProjectionSafeContent => ({
  contentPackageVersionId,
  ...emptyProjectionSafeCatalog(),
  decisions: [],
  messages: [
    {
      id: "msg_def_1",
      classification: "informational",
      relatedDecisionId: null,
      relatedMeetingId: null,
      relatedDocumentIds: [],
      chapterId: null,
    },
  ],
});

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

const occurrence = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly subject?: string;
  readonly body?: string;
  readonly deliveredAt?: string | null;
  readonly definitionId?: string;
}): LearnerMessageOccurrence => {
  const created = createLearnerMessageOccurrence({
    occurrenceId: asLearnerMessageOccurrenceId(input.id),
    definitionId: asLearnerMessageDefinitionId(
      input.definitionId ?? "msg_def_1",
    ),
    definitionVersion: "1",
    deliverySequence: input.sequence,
    deliveredAt:
      input.deliveredAt === undefined
        ? asIsoTimestamp("2026-07-26T10:00:00.000Z")
        : input.deliveredAt === null
          ? null
          : asIsoTimestamp(input.deliveredAt),
    sender: {
      senderId: "stakeholder_sponsor",
      displayName: "Alex Sponsor",
      roleLabel: "Executive Sponsor",
    },
    subject: input.subject ?? `Subject ${input.sequence}`,
    body: input.body ?? `Body ${input.sequence}`,
  });
  if (!created.ok) {
    throw new Error("createLearnerMessageOccurrence failed");
  }
  return created.value;
};

const stateWithMessages = (
  messages: readonly LearnerMessageOccurrence[],
): SimulationState => ({
  ...createInitialSimulationState(),
  learnerMessages: [...messages],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildInboxProjection({
    snapshot: snapshot.value,
    projectionContent: projectionContent(),
    generatedAt,
  });
};

describe("buildInboxProjection", () => {
  it("builds schema v1 inbox envelope with empty available history", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(INBOX_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      INBOX_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe("projection:inbox:tenant_1:run_1");
    expect(result.value.messages).toEqual([]);
    expect(result.value.summary).toEqual({
      totalMessages: 0,
      isEmpty: true,
      classificationCounts: {
        informational: 0,
        action_required: 0,
        decision_bearing: 0,
      },
    });
    expect(result.value.capabilities).toEqual({
      readState: "unsupported",
      archive: "unsupported",
      reply: "unsupported",
      compose: "unsupported",
    });
  });

  it("maps one authoritative occurrence with stable identity and preview", () => {
    const message = occurrence({
      id: "learner_message:c1",
      sequence: 1,
      body: "  Hello   world  ",
    });
    const result = buildFor(activeRun({ state: stateWithMessages([message]) }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.messages).toHaveLength(1);
    const item = result.value.messages[0]!;
    expect(item.messageId).toBe("learner_message:c1");
    expect(item.definitionId).toBe("msg_def_1");
    expect(item.definitionVersion).toBe("1");
    expect(item.sequence).toBe(1);
    expect(item.deliveredAt).toBe("2026-07-26T10:00:00.000Z");
    expect(item.sender.displayName).toBe("Alex Sponsor");
    expect(item.subject).toBe("Subject 1");
    expect(item.body).toBe("Hello   world");
    expect(item.preview).toBe("Hello world");
    expect(result.value.summary).toEqual({
      totalMessages: 1,
      isEmpty: false,
      classificationCounts: {
        informational: 1,
        action_required: 0,
        decision_bearing: 0,
      },
    });
  });

  it("orders newest-first while preserving distinct sequence and ids", () => {
    const older = occurrence({
      id: "learner_message:c1",
      sequence: 1,
      subject: "Older",
    });
    const newer = occurrence({
      id: "learner_message:c2",
      sequence: 2,
      subject: "Newer",
      definitionId: "msg_def_1",
      body: "Same body text",
    });
    const alsoSameBody = occurrence({
      id: "learner_message:c3",
      sequence: 3,
      subject: "Also same body",
      definitionId: "msg_def_1",
      body: "Same body text",
    });
    const result = buildFor(
      activeRun({ state: stateWithMessages([newer, alsoSameBody, older]) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.messages.map((m) => m.messageId)).toEqual([
      "learner_message:c3",
      "learner_message:c2",
      "learner_message:c1",
    ]);
    expect(result.value.messages.map((m) => m.sequence)).toEqual([3, 2, 1]);
  });

  it("preserves null deliveredAt and does not fabricate timestamps", () => {
    const message = occurrence({
      id: "learner_message:c1",
      sequence: 1,
      deliveredAt: null,
    });
    const result = buildFor(activeRun({ state: stateWithMessages([message]) }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.messages[0]?.deliveredAt).toBeNull();
  });

  it("produces identical payload and semantic hash for identical source", () => {
    const messages = [
      occurrence({ id: "learner_message:c1", sequence: 1 }),
      occurrence({ id: "learner_message:c2", sequence: 2 }),
    ];
    const first = buildFor(activeRun({ state: stateWithMessages(messages) }));
    const second = buildFor(
      activeRun({ state: stateWithMessages(messages) }),
      asIsoTimestamp("2026-07-26T99:00:00.000Z".replace("99", "13")),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.messages).toEqual(second.value.messages);
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(first.value.semanticHash).toBe(
      computeInboxSemanticHash({
        ...first.value,
      }),
    );
  });

  it("changes semantic hash when learner-visible body changes", () => {
    const base = occurrence({
      id: "learner_message:c1",
      sequence: 1,
      body: "Body A",
    });
    const changed = occurrence({
      id: "learner_message:c1",
      sequence: 1,
      body: "Body B",
    });
    const first = buildFor(activeRun({ state: stateWithMessages([base]) }));
    const second = buildFor(activeRun({ state: stateWithMessages([changed]) }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).not.toBe(second.value.semanticHash);
  });

  it("rejects duplicate occurrence IDs", () => {
    const message = occurrence({ id: "learner_message:c1", sequence: 1 });
    const result = buildFor(
      activeRun({
        state: stateWithMessages([
          message,
          occurrence({ id: "learner_message:c1", sequence: 2 }),
        ]),
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("round-trips through parseInboxProjection", () => {
    const result = buildFor(
      activeRun({
        state: stateWithMessages([
          occurrence({ id: "learner_message:c1", sequence: 1 }),
        ]),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const parsed = parseInboxProjection(result.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.messages[0]?.messageId).toBe("learner_message:c1");
  });

  it("rejects fabricated read/archive fields on stored messages", () => {
    const built = buildFor(
      activeRun({
        state: stateWithMessages([
          occurrence({ id: "learner_message:c1", sequence: 1 }),
        ]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const raw = {
      ...built.value,
      messages: [{ ...built.value.messages[0], unread: true }],
    };
    const parsed = parseInboxProjection(raw);
    expect(parsed.ok).toBe(false);
  });
});

describe("deriveInboxMessagePreview", () => {
  it("normalizes whitespace and truncates by code point", () => {
    expect(deriveInboxMessagePreview("  a   b  ")).toBe("a b");
    const long = "x".repeat(200);
    const preview = deriveInboxMessagePreview(long);
    expect(Array.from(preview.replace(/…$/u, "")).length).toBe(160);
    expect(preview.endsWith("…")).toBe(true);
  });
});
