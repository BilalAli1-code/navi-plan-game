import { describe, expect, it } from "vitest";
import { createContentApiModule } from "./content-module";
import { createApiApp } from "../create-app";
import { createInMemorySimulationModuleRegistry } from "../module-registry";

const authHeader = (tenantId: string, actorId: string): string =>
  `Bearer dev.${Buffer.from(JSON.stringify({ tenantId, actorId })).toString(
    "base64url",
  )}`;

const createApp = () => {
  const contentModule = createContentApiModule();
  const registry = createInMemorySimulationModuleRegistry({
    businessCaseRegistry: contentModule.registry,
    authorizedActorsByTenant: {
      tenant_1: ["actor_1"],
    },
  });
  return createApiApp({
    registry,
    contentModule,
    allowDevAuth: true,
  });
};

describe("BC-004 content API routes", () => {
  it("returns both selectable cases in the catalog", async () => {
    const app = createApp();
    const response = await app.request("/api/v1/business-cases", {
      headers: { Authorization: authHeader("tenant_1", "actor_1") },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: ReadonlyArray<{ businessCaseId: string; title: string }>;
    };
    expect(body.data.map((c) => c.businessCaseId).sort()).toEqual([
      "harbor-logistics-recovery",
      "northstar-connected-care",
    ]);
    expect(JSON.stringify(body.data)).not.toContain("consequence");
    expect(JSON.stringify(body.data)).not.toContain("rubric");
  });

  it("creates a Northstar run, initializes Chapter One, and pins version", async () => {
    const app = createApp();
    const response = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        Authorization: authHeader("tenant_1", "actor_1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "explorer",
        simulationRunId: "run_api_northstar_ch1",
      }),
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      data: {
        simulationRunId: string;
        businessCaseId: string;
        contentVersion: string;
        contentPackageVersionId: string;
        experienceLevel: string;
        status: string;
        chapterId: string;
        initialized: {
          stakeholders: number;
          documents: number;
          meetings: number;
          messages: number;
          activities: number;
          notifications: number;
        };
      };
    };
    expect(body.data.businessCaseId).toBe("northstar-connected-care");
    expect(body.data.contentVersion).toBe("1.0.0");
    expect(body.data.experienceLevel).toBe("explorer");
    expect(body.data.status).toBe("active");
    expect(body.data.chapterId).toBe("chapter-01");
    expect(body.data.initialized.stakeholders).toBeGreaterThanOrEqual(9);
    expect(body.data.initialized.documents).toBeGreaterThanOrEqual(6);
    expect(body.data.initialized.meetings).toBe(1);
    expect(body.data.initialized.messages).toBeGreaterThanOrEqual(5);
    expect(body.data.initialized.activities).toBeGreaterThanOrEqual(6);

    const stakeholders = await app.request(
      `/api/v1/simulation-runs/${body.data.simulationRunId}/stakeholders`,
      { headers: { Authorization: authHeader("tenant_1", "actor_1") } },
    );
    expect(stakeholders.status).toBe(200);
    const stakeholderBody = (await stakeholders.json()) as {
      data: { stakeholders: ReadonlyArray<{ stakeholderId: string }> };
    };
    expect(
      stakeholderBody.data.stakeholders.some(
        (s) => s.stakeholderId === "stakeholder.sponsor",
      ),
    ).toBe(true);

    const inbox = await app.request(
      `/api/v1/simulation-runs/${body.data.simulationRunId}/inbox`,
      { headers: { Authorization: authHeader("tenant_1", "actor_1") } },
    );
    expect(inbox.status).toBe(200);
    const inboxBody = (await inbox.json()) as {
      data: { messages: ReadonlyArray<{ subject: string }> };
    };
    expect(inboxBody.data.messages.length).toBeGreaterThanOrEqual(5);

    const projection = await app.request(
      `/api/v1/simulation-runs/${body.data.simulationRunId}/projection`,
      { headers: { Authorization: authHeader("tenant_1", "actor_1") } },
    );
    expect(projection.status).toBe(200);
    const projectionBody = (await projection.json()) as {
      data: {
        availableDecisions: ReadonlyArray<{ decisionDefinitionId: string }>;
      };
    };
    const decisionIds = projectionBody.data.availableDecisions.map(
      (d) => d.decisionDefinitionId,
    );
    expect(decisionIds).toContain("decision.define-objective");
    expect(decisionIds).not.toContain("decision.delivery-approach");
  });

  it("rejects unauthorized client contentPackageVersionId substitution", async () => {
    const app = createApp();
    const response = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        Authorization: authHeader("tenant_1", "actor_1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "leader",
        contentPackageVersionId: "cpv:harbor-logistics-recovery:1.0.0",
        simulationRunId: "run_api_reject_1",
      }),
    });
    expect(response.status).not.toBe(201);
  });

  it("keeps Harbor content out of a Northstar-initialized run", async () => {
    const app = createApp();
    const created = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        Authorization: authHeader("tenant_1", "actor_1"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "practitioner",
        simulationRunId: "run_api_isolation_ns",
      }),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      data: { simulationRunId: string };
    };
    const docs = await app.request(
      `/api/v1/simulation-runs/${body.data.simulationRunId}/documents`,
      { headers: { Authorization: authHeader("tenant_1", "actor_1") } },
    );
    const docsBody = (await docs.json()) as {
      data: { documents: ReadonlyArray<{ title: string }> };
    };
    expect(JSON.stringify(docsBody.data)).not.toMatch(/Harbor/i);
    expect(JSON.stringify(docsBody.data)).toMatch(
      /authorization|Access|Connected Care/i,
    );
  });
});
