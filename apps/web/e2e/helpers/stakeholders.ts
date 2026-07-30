import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { expectWorkplaceShell } from "./workplace";

export const workplaceStakeholdersRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/stakeholders`;

export const openStakeholdersPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceStakeholdersRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Stakeholders$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentStakeholders = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("stakeholders-freshness")).toHaveText(
    "Current",
    {
      timeout: 20_000,
    },
  );
};

export const fetchStakeholders = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly stakeholders: readonly {
      readonly stakeholderId: string;
      readonly initializationSequence: number;
      readonly profile: {
        readonly displayName: string;
        readonly roleLabel: string | null;
      };
      readonly conversation: {
        readonly conversationId: string;
        readonly messages: readonly {
          readonly messageId: string;
          readonly conversationSequence: number;
          readonly direction: string;
          readonly author: { readonly label: string };
          readonly body: string;
        }[];
      } | null;
    }[];
    readonly summary: {
      readonly totalStakeholders: number;
      readonly stakeholdersWithConversation: number;
      readonly totalMessages: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/stakeholders`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-stakeholders-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<
    ReturnType<typeof fetchStakeholders>
  >;
};

export const initializeStakeholderViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly stakeholderId?: string;
    readonly displayName?: string;
    readonly roleLabel?: string;
    readonly organization?: string;
    readonly department?: string;
    readonly biography?: string;
    readonly commandId?: string;
  },
): Promise<{
  readonly aggregateVersion: number;
  readonly commandId: string;
}> => {
  const stakeholderId = input?.stakeholderId ?? "stakeholder_1";
  const commandId =
    input?.commandId ?? `cmd_init_${stakeholderId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/stakeholder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": E2E_SEAM_SECRET,
      },
      body: JSON.stringify({
        tenantId: identity.tenantId,
        actorId: identity.actorId,
        simulationRunId: identity.simulationRunId,
        commandType: "InitializeStakeholder",
        stakeholderId,
        commandId,
        displayName: input?.displayName ?? "Alex Sponsor",
        roleLabel: input?.roleLabel ?? "Executive Sponsor",
        organization: input?.organization ?? "Acme",
        department: input?.department ?? "Strategy",
        biography: input?.biography ?? "Seasoned executive sponsor.",
        definitionVersion: "1",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `initializeStakeholderViaE2e failed (${response.status}): ${await response.text()}`,
    );
  }
  const json = (await response.json()) as {
    data: { aggregateVersion: number; commandId: string };
  };
  return {
    aggregateVersion: json.data.aggregateVersion,
    commandId: json.data.commandId,
  };
};

export const sendStakeholderMessageViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly stakeholderId?: string;
    readonly body?: string;
    readonly commandId?: string;
  },
): Promise<{
  readonly aggregateVersion: number;
  readonly commandId: string;
}> => {
  const stakeholderId = input?.stakeholderId ?? "stakeholder_1";
  const commandId =
    input?.commandId ?? `cmd_msg_${stakeholderId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/stakeholder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": E2E_SEAM_SECRET,
      },
      body: JSON.stringify({
        tenantId: identity.tenantId,
        actorId: identity.actorId,
        simulationRunId: identity.simulationRunId,
        commandType: "SendStakeholderMessage",
        stakeholderId,
        commandId,
        body: input?.body ?? "Hello Alex",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `sendStakeholderMessageViaE2e failed (${response.status}): ${await response.text()}`,
    );
  }
  const json = (await response.json()) as {
    data: { aggregateVersion: number; commandId: string };
  };
  return {
    aggregateVersion: json.data.aggregateVersion,
    commandId: json.data.commandId,
  };
};

export const assertStakeholdersHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("FIXTURE_BUDGET_DELTA");
  expect(content).not.toContain("facilitator");
  expect(content).not.toContain("consequenceDefinitions");
  expect(content).not.toContain("semanticHash");
  expect(content).not.toContain("originatingCommandId");
  expect(content).not.toContain("authorActorId");
  expect(content).not.toContain("textarea");
  expect(content).not.toMatch(/composer|send message|type a message/i);
};
