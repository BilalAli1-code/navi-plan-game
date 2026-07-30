import { describe, expect, it } from "vitest";
import { asActorId } from "@projectsim/domain";
import {
  createInMemoryMembershipStore,
  createSimulationCommandModule,
} from "@projectsim/infrastructure";
import { createApiApp } from "../create-app";
import type { SimulationModuleRegistry } from "../module-registry";

const encodeDevToken = (actorId: string, tenantId: string) =>
  `dev.${Buffer.from(JSON.stringify({ actorId, tenantId })).toString("base64url")}`;

const createRegistry = (): SimulationModuleRegistry => {
  const membershipStore = createInMemoryMembershipStore([
    {
      actorId: asActorId("actor_ops"),
      tenantId: "tenant_ops",
      roles: ["operator"],
      capabilities: [
        "simulation.run.view",
        "simulation.run.start",
        "simulation.projection.ops",
      ],
    },
    {
      actorId: asActorId("actor_learner"),
      tenantId: "tenant_ops",
      roles: ["learner"],
      capabilities: ["simulation.run.view", "simulation.run.start"],
    },
  ]);
  const module = createSimulationCommandModule({
    tenantId: "tenant_ops",
    membershipStore,
  });
  return {
    get() {
      return {
        tenantId: module.tenantId as never,
        applicationService: module.applicationService,
        lifecycleService: module.lifecycleService,
        getProjectionService: module.getProjectionService,
        getMissionControlProjectionService:
          module.getMissionControlProjectionService,
        getDecisionLogProjectionService: module.getDecisionLogProjectionService,
        getInboxProjectionService: module.getInboxProjectionService,
        getMeetingsProjectionService: module.getMeetingsProjectionService,
        getStakeholdersProjectionService:
          module.getStakeholdersProjectionService,
        getDocumentsProjectionService: module.getDocumentsProjectionService,
        getPerformanceProjectionService: module.getPerformanceProjectionService,
        getLearnerProgressionProjectionService:
          module.getLearnerProgressionProjectionService,
        getNotificationsProjectionService:
          module.getNotificationsProjectionService,
        getActivitiesProjectionService: module.getActivitiesProjectionService,
        getCompletedHistoryProjectionService:
          module.getCompletedHistoryProjectionService,
        module,
      };
    },
  };
};

describe("projection operations API", () => {
  it("denies unauthenticated and learner callers", async () => {
    const app = createApiApp({
      registry: createRegistry(),
      allowDevAuth: true,
    });
    const unauth = await app.request(
      "/api/v1/internal/projection-operations/queue-summary",
    );
    expect(unauth.status).toBe(401);

    const learner = await app.request(
      "/api/v1/internal/projection-operations/queue-summary",
      {
        headers: {
          Authorization: `Bearer ${encodeDevToken("actor_learner", "tenant_ops")}`,
        },
      },
    );
    expect(learner.status).toBe(403);
  });

  it("allows operators to read queue summary", async () => {
    const app = createApiApp({
      registry: createRegistry(),
      allowDevAuth: true,
    });
    const res = await app.request(
      "/api/v1/internal/projection-operations/queue-summary",
      {
        headers: {
          Authorization: `Bearer ${encodeDevToken("actor_ops", "tenant_ops")}`,
        },
      },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { pending: number; exhausted: number };
    };
    expect(body.data.pending).toBe(0);
    expect(body.data.exhausted).toBe(0);
  });
});
