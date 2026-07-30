import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asConversationId,
  asIsoTimestamp,
  asLearnerId,
  asMessageId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createInitialSimulationState,
  createStakeholderConversation,
  createStakeholderLearnerSafeProfile,
  createStakeholderMessageOccurrence,
  createStakeholderRuntime,
  type SimulationRun,
  type SimulationState,
  type StakeholderConversation,
  type StakeholderRuntime,
} from "../index";
import { toSimulationRunReadSnapshot } from "./read-snapshot";
import {
  buildStakeholdersProjection,
  computeStakeholdersSemanticHash,
} from "./stakeholders-builder";
import {
  STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
  STAKEHOLDERS_PROJECTION_TYPE,
} from "./stakeholders-contracts";
import { parseStakeholdersProjection } from "./stakeholders-payload";

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
  readonly displayName?: string;
}): StakeholderRuntime => {
  const profile = createStakeholderLearnerSafeProfile({
    displayName: input.displayName ?? `Name ${input.id}`,
    roleLabel: "Sponsor",
    organization: "Acme",
    department: "PMO",
    biography: "Bio",
  });
  if (!profile.ok) {
    throw new Error("profile failed");
  }
  const created = createStakeholderRuntime({
    stakeholderId: asStakeholderId(input.id),
    stakeholderDefinitionVersion: "1",
    initializationSequence: input.sequence,
    profile: profile.value,
    initializedAt: now,
    originatingCommandId: asCommandId(`cmd_init_${input.sequence}`),
  });
  if (!created.ok) {
    throw new Error("runtime failed");
  }
  return created.value;
};

const conversation = (input: {
  readonly stakeholderId: string;
  readonly bodies: readonly string[];
}): StakeholderConversation => {
  const conversationId = asConversationId(
    `conversation:${input.stakeholderId}`,
  );
  const messages = input.bodies.map((body, index) => {
    const message = createStakeholderMessageOccurrence({
      messageId: asMessageId(`stakeholder_message:cmd_msg_${index + 1}`),
      conversationId,
      stakeholderId: asStakeholderId(input.stakeholderId),
      conversationSequence: index + 1,
      direction: "learner_to_stakeholder",
      authorActorId: asActorId("actor_1"),
      body,
      occurredAt: now,
      originatingCommandId: asCommandId(`cmd_msg_${index + 1}`),
    });
    if (!message.ok) {
      throw new Error("message failed");
    }
    return message.value;
  });
  const created = createStakeholderConversation({
    conversationId,
    stakeholderId: asStakeholderId(input.stakeholderId),
    openedAt: now,
    originatingCommandId: asCommandId("cmd_msg_1"),
    messages,
  });
  if (!created.ok) {
    throw new Error("conversation failed");
  }
  return created.value;
};

const stateWith = (input: {
  readonly stakeholders: readonly StakeholderRuntime[];
  readonly conversations?: readonly StakeholderConversation[];
}): SimulationState => ({
  ...createInitialSimulationState(),
  stakeholders: [...input.stakeholders],
  stakeholderConversations: [...(input.conversations ?? [])],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildStakeholdersProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("buildStakeholdersProjection", () => {
  it("builds schema v1 empty Stakeholders projection", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(STAKEHOLDERS_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      STAKEHOLDERS_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:stakeholders:tenant_1:run_1",
    );
    expect(result.value.stakeholders).toEqual([]);
    expect(result.value.summary).toEqual({
      totalStakeholders: 0,
      stakeholdersWithConversation: 0,
      totalMessages: 0,
      isEmpty: true,
    });
    expect(result.value.capabilities).toEqual({
      sendMessage: "unsupported",
      editProfile: "unsupported",
    });
  });

  it("maps learner-safe profile and null conversation before first message", () => {
    const result = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [runtime({ id: "stakeholder_a", sequence: 1 })],
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.stakeholders).toHaveLength(1);
    expect(result.value.stakeholders[0]).toMatchObject({
      stakeholderId: "stakeholder_a",
      stakeholderDefinitionVersion: "1",
      initializationSequence: 1,
      profile: {
        displayName: "Name stakeholder_a",
        roleLabel: "Sponsor",
        organization: "Acme",
        department: "PMO",
        biography: "Bio",
      },
      conversation: null,
    });
    expect(result.value.stakeholders[0]).not.toHaveProperty(
      "originatingCommandId",
    );
  });

  it("orders Stakeholders by initializationSequence and messages by conversationSequence", () => {
    const orderedConversation = conversation({
      stakeholderId: "stakeholder_a",
      bodies: ["First", "Second"],
    });
    // Force unsorted conversation messages in source; builder reorders.
    const swapped = {
      ...orderedConversation,
      messages: [
        orderedConversation.messages[1]!,
        orderedConversation.messages[0]!,
      ],
    };
    const result = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [
            runtime({ id: "stakeholder_b", sequence: 2 }),
            runtime({ id: "stakeholder_a", sequence: 1 }),
          ],
          conversations: [swapped],
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.stakeholders.map((item) => item.stakeholderId)).toEqual(
      ["stakeholder_a", "stakeholder_b"],
    );
    expect(
      result.value.stakeholders[0]?.conversation?.messages.map(
        (message) => message.body,
      ),
    ).toEqual(["First", "Second"]);
    expect(
      result.value.stakeholders[0]?.conversation?.messages[0]?.author,
    ).toEqual({ kind: "learner", label: "You" });
    expect(result.value.summary).toEqual({
      totalStakeholders: 2,
      stakeholdersWithConversation: 1,
      totalMessages: 2,
      isEmpty: false,
    });
  });

  it("keeps semantic hash stable across generatedAt/sourceEventId changes", () => {
    const first = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [runtime({ id: "stakeholder_a", sequence: 1 })],
        }),
      }),
      asIsoTimestamp("2026-07-26T12:00:00.000Z"),
    );
    const second = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [runtime({ id: "stakeholder_a", sequence: 1 })],
        }),
      }),
      asIsoTimestamp("2026-07-26T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(
      computeStakeholdersSemanticHash({
        ...first.value,
        generatedAt: second.value.generatedAt,
        sourceEventId: null,
      }),
    ).toBe(first.value.semanticHash);

    const withMessage = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [runtime({ id: "stakeholder_a", sequence: 1 })],
          conversations: [
            conversation({
              stakeholderId: "stakeholder_a",
              bodies: ["Hello"],
            }),
          ],
        }),
      }),
    );
    expect(withMessage.ok).toBe(true);
    if (!withMessage.ok) {
      return;
    }
    expect(withMessage.value.semanticHash).not.toBe(first.value.semanticHash);
  });
});

describe("parseStakeholdersProjection", () => {
  it("round-trips a built projection and rejects hidden fields", () => {
    const built = buildFor(
      activeRun({
        state: stateWith({
          stakeholders: [runtime({ id: "stakeholder_a", sequence: 1 })],
          conversations: [
            conversation({
              stakeholderId: "stakeholder_a",
              bodies: ["Hello"],
            }),
          ],
        }),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseStakeholdersProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.stakeholders[0]?.conversation?.messages[0]?.body).toBe(
      "Hello",
    );

    const withHidden = JSON.parse(JSON.stringify(built.value)) as {
      stakeholders: Array<Record<string, unknown>>;
    };
    withHidden.stakeholders[0]!.originatingCommandId = "cmd_secret";
    const rejected = parseStakeholdersProjection(withHidden);
    expect(rejected.ok).toBe(false);
  });
});
