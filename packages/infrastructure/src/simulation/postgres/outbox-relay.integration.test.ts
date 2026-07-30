import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createScaffoldDecisionDefinition,
  isAccepted,
  isRejected,
  type DecisionDefinition,
  type SubmitDecisionCommand,
} from "@projectsim/domain";
import {
  createInMemoryMembershipStore,
  upsertPostgresMembership,
} from "../authorization";
import { createPermitAllLifecycleAuthorizer } from "../authorization/lifecycle-authorizer";
import { createInMemoryDecisionDefinitionProvider } from "../decision-definition-provider";
import { createInMemoryEventBus } from "./event-bus";
import { createPostgresSimulationCommandModule } from "./postgres-composition-root";
import type { PostgresSimulationCommandModule } from "./postgres-composition-root";
import { cleanupPostgresTenants } from "./test-db-cleanup";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb = DATABASE_URL ? describe : describe.skip;
const TENANT = "tenant_relay";
const contentPackageVersionId = asContentPackageVersionId("cpv_relay");

const definition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const buildCommand = (commandId: string): SubmitDecisionCommand => ({
  commandId: asCommandId(commandId),
  simulationRunId: asSimulationRunId("run_relay"),
  actorId: asActorId("actor_relay"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_relay"),
  causationId: null,
  expectedVersion: null,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
});

const truncateAll = async (): Promise<void> => {
  await cleanupPostgresTenants({
    adminUrl: DATABASE_ADMIN_URL,
    tenantIds: [TENANT],
  });
};

const seedActiveRun = async (
  module: PostgresSimulationCommandModule,
): Promise<void> => {
  await module.lifecycleService.create({
    actorId: asActorId("actor_relay"),
    learnerId: asLearnerId("learner_relay"),
    businessCaseId: asBusinessCaseId("case_relay"),
    contentPackageVersionId,
    runtimeVersion: "runtime-1",
    correlationId: asCorrelationId("corr_relay"),
    causationId: null,
    simulationRunId: asSimulationRunId("run_relay"),
  });
  await module.lifecycleService.start({
    actorId: asActorId("actor_relay"),
    simulationRunId: asSimulationRunId("run_relay"),
    correlationId: asCorrelationId("corr_relay"),
    causationId: null,
    expectedAggregateVersion: null,
  });
};

describeIfDb(
  "PS-004C/PS-ROADMAP-004 outbox relay + capability authorization",
  () => {
    let module: PostgresSimulationCommandModule;
    let eventBus: ReturnType<typeof createInMemoryEventBus>;

    beforeAll(() => {
      eventBus = createInMemoryEventBus();
      module = createPostgresSimulationCommandModule({
        database: { connectionString: DATABASE_URL! },
        tenantId: TENANT,
        eventBus,
        lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
        decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
          { tenantId: asTenantId(TENANT), definition },
        ]),
      });
    });

    afterAll(async () => {
      await module.close();
    });

    beforeEach(async () => {
      await truncateAll();
      await upsertPostgresMembership(module.database, {
        actorId: asActorId("actor_relay"),
        tenantId: TENANT,
        roles: ["learner"],
        capabilities: ["simulation.run.view", "simulation.run.start"],
      });
      await seedActiveRun(module);
    });

    it("given_an_accepted_command_when_relay_ticks_then_lifecycle_and_action_events_publish", async () => {
      const result = await module.applicationService.process(
        buildCommand("cmd_relay_1"),
      );
      expect(isAccepted(result)).toBe(true);

      // Drain pending outbox rows (lifecycle + action + resolution events).
      let published = 0;
      for (let i = 0; i < 40; i += 1) {
        const tick = await module.outboxRelay.tick();
        published += tick.published;
        if (tick.claimed === 0) {
          break;
        }
      }

      expect(published).toBeGreaterThanOrEqual(4);
      expect(
        eventBus.published.some(
          (e) => e.eventType === "SimulationActionAccepted",
        ),
      ).toBe(true);
      expect(
        eventBus.published.some((e) => e.eventType === "DecisionSubmitted"),
      ).toBe(true);
      expect(
        eventBus.published.some((e) => e.eventType === "DecisionResolved"),
      ).toBe(true);
      expect(
        eventBus.published.some((e) => e.eventType === "SimulationRunCreated"),
      ).toBe(true);
    });

    it("given_a_bus_failure_when_relay_ticks_then_the_row_is_retried_and_not_dead_yet", async () => {
      let attempts = 0;
      const flakyBus = {
        async publish() {
          attempts += 1;
          throw new Error("bus unavailable");
        },
        subscribe() {
          // No-op: failure path does not need projection fan-out.
        },
      };
      const flakyModule = createPostgresSimulationCommandModule({
        database: { connectionString: DATABASE_URL! },
        tenantId: TENANT,
        eventBus: flakyBus,
        enableProjectionConsumer: false,
        lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
        decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
          { tenantId: asTenantId(TENANT), definition },
        ]),
        membershipStore: createInMemoryMembershipStore([
          {
            actorId: asActorId("actor_relay"),
            tenantId: TENANT,
            roles: ["learner"],
            capabilities: ["simulation.run.view", "simulation.run.start"],
          },
        ]),
      });

      try {
        await seedActiveRun(flakyModule);
        await flakyModule.applicationService.process(
          buildCommand("cmd_retry_1"),
        );
        const tick = await flakyModule.outboxRelay.tick();

        expect(tick.claimed).toBeGreaterThanOrEqual(1);
        expect(tick.failed).toBeGreaterThanOrEqual(1);
        expect(tick.dead).toBe(0);
        expect(attempts).toBeGreaterThanOrEqual(1);
      } finally {
        await flakyModule.close();
      }
    });

    it("given_an_actor_without_membership_when_processing_then_it_is_denied", async () => {
      const result = await module.applicationService.process({
        ...buildCommand("cmd_denied_1"),
        actorId: asActorId("stranger"),
      });

      expect(isRejected(result)).toBe(true);
      if (isRejected(result)) {
        expect(result.error.code).toBe("TENANT_ACCESS_DENIED");
      }
    });
  },
);
