import type { Hono } from "hono";
import {
  asActivityId,
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDocumentId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  isAccepted,
  isActivitySourceKind,
  isNotificationSourceKind,
  ok,
  type SimulationCommand,
  type SimulationProjection,
} from "@projectsim/domain";
import type { GetSimulationProjectionService } from "@projectsim/application";
import {
  upsertPostgresMembership,
  type PostgresDatabase,
} from "@projectsim/infrastructure";
import type { SimulationModuleRegistry } from "../module-registry";
import { seedDemoSimulationRun } from "../dev/seed";
import {
  getProjectionGate,
  resetProjectionGate,
  setProjectionGate,
  type ProjectionGateMode,
} from "./projection-gate";
import {
  E2E_SEAM_HEADER,
  filterAllowedCapabilities,
  globalE2eResetAllowed,
  isFixtureId,
  requireE2eSeamSecret,
} from "./seam-guard";

export { e2eSeamsEnabled } from "./projection-gate";
export {
  e2eSeamsAllowedInProcess,
  E2E_SEAM_HEADER,
  isFixtureId,
} from "./seam-guard";

type Variables = {
  requestId: string;
  correlationId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const lastGoodProjection = new Map<string, SimulationProjection>();

const projectionCacheKey = (tenantId: string, runId: string): string =>
  `${tenantId}::${runId}`;

/**
 * Wrap GetSimulationProjection for opt-in E2E lag / rebuild_failed seams.
 *
 * - hold: return the retained pre-submit projection (no rebuild) so the UI can
 *   observe accepted/refreshing and bounded poll timeout against real lag.
 * - fail_rebuild: return retained projection with freshness rebuild_failed.
 */
export const wrapGetProjectionServiceForE2e = (
  inner: GetSimulationProjectionService,
  tenantId: string,
): GetSimulationProjectionService => ({
  async get(input) {
    const key = projectionCacheKey(tenantId, input.simulationRunId);
    const gate = getProjectionGate().mode;
    if (gate === "hold") {
      const cached = lastGoodProjection.get(key);
      if (cached) {
        return ok({
          projection: cached,
          freshness: "current",
        });
      }
    }
    if (gate === "fail_rebuild") {
      const cached = lastGoodProjection.get(key);
      if (cached) {
        return ok({
          projection: cached,
          freshness: "rebuild_failed",
        });
      }
    }
    const result = await inner.get(input);
    if (result.ok) {
      lastGoodProjection.set(key, result.value.projection);
    }
    return result;
  },
});

export const clearE2eProjectionCache = (tenantId?: string): void => {
  if (!tenantId) {
    lastGoodProjection.clear();
    return;
  }
  const prefix = `${tenantId}::`;
  for (const key of lastGoodProjection.keys()) {
    if (key.startsWith(prefix)) {
      lastGoodProjection.delete(key);
    }
  }
};

const adminConnectionString = (): string | null =>
  process.env.DATABASE_ADMIN_URL?.trim() ||
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@") ||
  null;

const deleteTenantRows = async (
  client: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
  tenantId: string,
): Promise<void> => {
  // Ordered deletes keep FK/inbox/outbox rows tenant-scoped.
  await client.query(
    `delete from projection_processing_target where tenant_id = $1`,
    [tenantId],
  );
  await client.query(
    `delete from projection_event_inbox where tenant_id = $1`,
    [tenantId],
  );
  await client.query(`delete from simulation_projection where tenant_id = $1`, [
    tenantId,
  ]);
  await client.query(`delete from event_outbox where tenant_id = $1`, [
    tenantId,
  ]);
  await client.query(`delete from idempotency_receipts where tenant_id = $1`, [
    tenantId,
  ]);
  await client.query(`delete from simulation_state where tenant_id = $1`, [
    tenantId,
  ]);
  await client.query(`delete from tenant_memberships where tenant_id = $1`, [
    tenantId,
  ]);
};

/**
 * Mount opt-in E2E setup/teardown routes. Never registered in production.
 * These helpers create fixtures and control projection gates; learner actions
 * still go through public projection/command routes.
 */
export const mountE2eRoutes = (
  app: Hono<{ Variables: Variables }>,
  options: {
    readonly registry: SimulationModuleRegistry & {
      readonly database?: PostgresDatabase;
    };
  },
): void => {
  const { registry } = options;

  app.use("/api/v1/e2e/*", async (c, next) => {
    const secret = requireE2eSeamSecret(c.req.header(E2E_SEAM_HEADER));
    if (!secret.ok) {
      // Opaque denial — do not advertise seam details.
      return c.json({ error: { message: "Not found." } }, 404);
    }
    return next();
  });

  app.post("/api/v1/e2e/projection-gate", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (!isRecord(body) || typeof body.mode !== "string") {
      return c.json({ error: { message: "mode is required." } }, 400);
    }
    if (
      body.mode !== "open" &&
      body.mode !== "hold" &&
      body.mode !== "fail_rebuild"
    ) {
      return c.json(
        { error: { message: "Unsupported projection gate mode." } },
        400,
      );
    }
    setProjectionGate(body.mode as ProjectionGateMode);
    return c.json({ data: getProjectionGate() }, 200);
  });

  app.post("/api/v1/e2e/projection-gate/reset", async (c) => {
    resetProjectionGate();
    return c.json({ data: getProjectionGate() }, 200);
  });

  app.post("/api/v1/e2e/fixtures/decision-lifecycle", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string"
    ) {
      return c.json(
        {
          error: {
            message: "tenantId, actorId, and simulationRunId are required.",
          },
        },
        400,
      );
    }

    const tenantId = body.tenantId.trim();
    const actorId = body.actorId.trim();
    const simulationRunId = body.simulationRunId.trim();
    const learnerId = (
      typeof body.learnerId === "string" ? body.learnerId : `learner_${actorId}`
    ).trim();
    const businessCaseId = (
      typeof body.businessCaseId === "string"
        ? body.businessCaseId
        : `case_${simulationRunId}`
    ).trim();
    const contentPackageVersionId = (
      typeof body.contentPackageVersionId === "string"
        ? body.contentPackageVersionId
        : "cpv_1"
    ).trim();

    for (const [name, value] of [
      ["tenantId", tenantId],
      ["actorId", actorId],
      ["simulationRunId", simulationRunId],
      ["learnerId", learnerId],
      ["businessCaseId", businessCaseId],
      ["contentPackageVersionId", contentPackageVersionId],
    ] as const) {
      if (!isFixtureId(value)) {
        return c.json(
          { error: { message: `${name} is not a valid fixture identifier.` } },
          400,
        );
      }
    }

    const capabilitiesRaw = Array.isArray(body.capabilities)
      ? body.capabilities.filter(
          (value): value is string => typeof value === "string",
        )
      : ["simulation.run.view", "simulation.run.start"];
    const capabilities = filterAllowedCapabilities(capabilitiesRaw);
    if (capabilities === null) {
      return c.json(
        { error: { message: "One or more capabilities are not allowed." } },
        400,
      );
    }

    const skipMembership = body.skipMembership === true;
    const completeAfterSeed = body.completeAfterSeed === true;
    const postSeedCapabilitiesRaw = Array.isArray(body.postSeedCapabilities)
      ? body.postSeedCapabilities.filter(
          (value): value is string => typeof value === "string",
        )
      : null;
    const postSeedCapabilities =
      postSeedCapabilitiesRaw === null
        ? null
        : filterAllowedCapabilities(postSeedCapabilitiesRaw);
    if (postSeedCapabilitiesRaw !== null && postSeedCapabilities === null) {
      return c.json(
        {
          error: {
            message: "One or more postSeedCapabilities are not allowed.",
          },
        },
        400,
      );
    }

    const adminUrl = adminConnectionString();
    if (adminUrl) {
      const pg = await import("pg");
      const client = new pg.default.Client({ connectionString: adminUrl });
      await client.connect();
      try {
        // Refuse overwrite for this tenant+run or any pre-existing run id.
        const existing = await client.query(
          `select 1 from simulation_state
            where simulation_run_id = $1
               or (tenant_id = $2 and simulation_run_id = $1)
            limit 1`,
          [simulationRunId, tenantId],
        );
        if ((existing.rowCount ?? 0) > 0) {
          return c.json(
            {
              error: {
                message: "SimulationRun already exists. Refusing to overwrite.",
              },
            },
            409,
          );
        }
      } finally {
        await client.end();
      }
    }

    const services = registry.get(tenantId);

    if (!skipMembership) {
      if (!registry.database) {
        return c.json(
          {
            error: {
              message:
                "E2E fixtures require the postgres registry (membership upsert).",
            },
          },
          500,
        );
      }
      // Lifecycle seed requires start capability; tests may downgrade afterward.
      await upsertPostgresMembership(registry.database, {
        actorId: asActorId(actorId),
        tenantId,
        roles: ["learner"],
        capabilities:
          postSeedCapabilities !== null
            ? ["simulation.run.view", "simulation.run.start"]
            : capabilities,
      });
    }

    const seeded = await seedDemoSimulationRun(registry, {
      tenantId,
      actorId,
      simulationRunId,
      learnerId,
      businessCaseId,
      contentPackageVersionId,
      correlationId: `corr_e2e_seed_${simulationRunId}`,
    });
    if (!seeded.ok) {
      return c.json({ error: { message: seeded.message } }, 422);
    }

    if (completeAfterSeed) {
      const completed = await services.lifecycleService.complete({
        actorId: asActorId(actorId),
        simulationRunId: asSimulationRunId(simulationRunId),
        correlationId: asCorrelationId(`corr_e2e_complete_${simulationRunId}`),
        causationId: null,
        expectedAggregateVersion: null,
      });
      if (!completed.ok) {
        return c.json({ error: { message: completed.error.message } }, 422);
      }
    }

    if (!completeAfterSeed) {
      const projection = await services.getProjectionService.get({
        simulationRunId: asSimulationRunId(simulationRunId),
        actorId: asActorId(actorId),
        correlationId: asCorrelationId(`corr_e2e_warm_${simulationRunId}`),
        causationId: null,
      });
      if (!projection.ok) {
        return c.json({ error: { message: projection.error.message } }, 422);
      }
      lastGoodProjection.set(
        projectionCacheKey(tenantId, simulationRunId),
        projection.value.projection,
      );
    }

    let appliedCapabilities = capabilities;
    if (postSeedCapabilities !== null) {
      if (!registry.database) {
        return c.json(
          {
            error: {
              message:
                "Postgres registry database is required for postSeedCapabilities.",
            },
          },
          500,
        );
      }
      await upsertPostgresMembership(registry.database, {
        actorId: asActorId(actorId),
        tenantId,
        roles: ["learner"],
        capabilities: postSeedCapabilities,
      });
      appliedCapabilities = postSeedCapabilities;
    }

    return c.json(
      {
        data: {
          tenantId: asTenantId(tenantId),
          actorId: asActorId(actorId),
          learnerId: asLearnerId(learnerId),
          simulationRunId: asSimulationRunId(simulationRunId),
          contentPackageVersionId: asContentPackageVersionId(
            contentPackageVersionId,
          ),
          businessCaseId: asBusinessCaseId(businessCaseId),
          capabilities: appliedCapabilities,
          expected: {
            selectedOptionId: "option_b",
            selectedOptionLabel: "Balanced option",
            projectStatus: "planning",
            budget: 105,
            decisionDefinitionId: "decision_1",
            consequenceDefinitionCount: 7,
          },
        },
      },
      200,
    );
  });

  app.post("/api/v1/e2e/fixtures/cleanup", async (c) => {
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    if (!isRecord(body)) {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }

    const adminUrl = adminConnectionString();
    if (!adminUrl) {
      return c.json(
        { error: { message: "DATABASE_ADMIN_URL is required for cleanup." } },
        500,
      );
    }

    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: adminUrl });
    await client.connect();
    try {
      if (body.global === true) {
        if (!globalE2eResetAllowed()) {
          return c.json(
            {
              error: {
                message:
                  "Global E2E reset requires E2E_ALLOW_GLOBAL_RESET=1 on the server.",
              },
            },
            403,
          );
        }
        resetProjectionGate();
        clearE2eProjectionCache();
        await client.query(
          "truncate simulation_state, idempotency_receipts, event_outbox, tenant_memberships, simulation_projection, projection_event_inbox, projection_processing_target",
        );
        return c.json({ data: { ok: true, scope: "global" } }, 200);
      }

      if (typeof body.tenantId !== "string" || !isFixtureId(body.tenantId)) {
        return c.json(
          {
            error: {
              message:
                "tenantId is required for tenant-scoped cleanup (or global=true with E2E_ALLOW_GLOBAL_RESET=1).",
            },
          },
          400,
        );
      }
      clearE2eProjectionCache(body.tenantId);
      await deleteTenantRows(client, body.tenantId);
      return c.json(
        { data: { ok: true, scope: "tenant", tenantId: body.tenantId } },
        200,
      );
    } finally {
      await client.end();
    }
  });

  /**
   * Test-only Meeting command seam (not a public Meetings mutation API).
   * Uses the authoritative SimulationCommandApplicationService so Playwright
   * can drive PS-017 projection convergence without a production REST write path.
   */
  app.post("/api/v1/e2e/commands/meeting", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.commandType !== "string" ||
      typeof body.meetingId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.meetingId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, commandType, and meetingId are required fixture ids.",
          },
        },
        400,
      );
    }

    const allowedTypes = new Set([
      "ScheduleMeeting",
      "MakeMeetingAvailable",
      "StartMeeting",
      "CompleteMeeting",
      "CancelMeeting",
    ]);
    if (!allowedTypes.has(body.commandType)) {
      return c.json(
        { error: { message: "Unsupported Meeting commandType." } },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_meeting_${body.meetingId}_${body.commandType}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_meeting_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    let command: SimulationCommand;
    if (body.commandType === "ScheduleMeeting") {
      if (
        typeof body.title !== "string" ||
        body.title.trim().length === 0 ||
        typeof body.scheduledFor !== "string" ||
        Number.isNaN(Date.parse(body.scheduledFor)) ||
        !Array.isArray(body.participantIds) ||
        body.participantIds.length === 0 ||
        !body.participantIds.every(
          (value): value is string => typeof value === "string",
        )
      ) {
        return c.json(
          {
            error: {
              message:
                "ScheduleMeeting requires title, scheduledFor, and participantIds.",
            },
          },
          400,
        );
      }
      const displayNames = isRecord(body.participantDisplayNames)
        ? Object.fromEntries(
            Object.entries(body.participantDisplayNames).filter(
              (entry): entry is [string, string] =>
                typeof entry[0] === "string" && typeof entry[1] === "string",
            ),
          )
        : undefined;
      command = {
        commandId: asCommandId(commandId),
        simulationRunId: asSimulationRunId(body.simulationRunId),
        actorId: asActorId(body.actorId),
        occurredAt: asIsoTimestamp(occurredAt),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: run.aggregateVersion,
        commandType: "ScheduleMeeting",
        payload: {
          meetingId: asMeetingId(body.meetingId),
          title: body.title,
          scheduledFor: asIsoTimestamp(body.scheduledFor),
          participantIds: body.participantIds.map((id) => asStakeholderId(id)),
          ...(typeof body.agenda === "string" ? { agenda: body.agenda } : {}),
          ...(typeof body.definitionVersion === "string"
            ? { definitionVersion: body.definitionVersion }
            : {}),
          ...(typeof body.durationMinutes === "number"
            ? { durationMinutes: body.durationMinutes }
            : {}),
          ...(typeof body.channel === "string"
            ? { channel: body.channel }
            : {}),
          ...(typeof body.location === "string"
            ? { location: body.location }
            : {}),
          ...(displayNames ? { participantDisplayNames: displayNames } : {}),
        },
      };
    } else {
      command = {
        commandId: asCommandId(commandId),
        simulationRunId: asSimulationRunId(body.simulationRunId),
        actorId: asActorId(body.actorId),
        occurredAt: asIsoTimestamp(occurredAt),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: run.aggregateVersion,
        commandType: body.commandType as
          | "MakeMeetingAvailable"
          | "StartMeeting"
          | "CompleteMeeting"
          | "CancelMeeting",
        payload: { meetingId: asMeetingId(body.meetingId) },
      };
    }

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  /**
   * Test-only Stakeholder command seam (not a public Stakeholder mutation API).
   * Uses the authoritative SimulationCommandApplicationService so Playwright
   * can drive PS-019 projection convergence without a production REST write path.
   */
  app.post("/api/v1/e2e/commands/stakeholder", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.commandType !== "string" ||
      typeof body.stakeholderId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.stakeholderId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, commandType, and stakeholderId are required fixture ids.",
          },
        },
        400,
      );
    }

    const allowedTypes = new Set([
      "InitializeStakeholder",
      "SendStakeholderMessage",
    ]);
    if (!allowedTypes.has(body.commandType)) {
      return c.json(
        { error: { message: "Unsupported Stakeholder commandType." } },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_stakeholder_${body.stakeholderId}_${body.commandType}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_stakeholder_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    let command: SimulationCommand;
    if (body.commandType === "InitializeStakeholder") {
      if (
        typeof body.displayName !== "string" ||
        body.displayName.trim().length === 0
      ) {
        return c.json(
          {
            error: {
              message: "InitializeStakeholder requires displayName.",
            },
          },
          400,
        );
      }
      command = {
        commandId: asCommandId(commandId),
        simulationRunId: asSimulationRunId(body.simulationRunId),
        actorId: asActorId(body.actorId),
        occurredAt: asIsoTimestamp(occurredAt),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: run.aggregateVersion,
        commandType: "InitializeStakeholder",
        payload: {
          stakeholderId: asStakeholderId(body.stakeholderId),
          displayName: body.displayName,
          ...(typeof body.definitionVersion === "string"
            ? { definitionVersion: body.definitionVersion }
            : {}),
          ...(typeof body.roleLabel === "string"
            ? { roleLabel: body.roleLabel }
            : {}),
          ...(typeof body.organization === "string"
            ? { organization: body.organization }
            : {}),
          ...(typeof body.department === "string"
            ? { department: body.department }
            : {}),
          ...(typeof body.biography === "string"
            ? { biography: body.biography }
            : {}),
        },
      };
    } else {
      if (typeof body.body !== "string" || body.body.trim().length === 0) {
        return c.json(
          {
            error: {
              message: "SendStakeholderMessage requires body.",
            },
          },
          400,
        );
      }
      command = {
        commandId: asCommandId(commandId),
        simulationRunId: asSimulationRunId(body.simulationRunId),
        actorId: asActorId(body.actorId),
        occurredAt: asIsoTimestamp(occurredAt),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: run.aggregateVersion,
        commandType: "SendStakeholderMessage",
        payload: {
          recipientId: asStakeholderId(body.stakeholderId),
          body: body.body,
        },
      };
    }

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  /**
   * Test-only Document command seam (not a public Documents mutation API).
   * Supports InitializeDocument only so Playwright can drive PS-020 projection
   * convergence through the authoritative command application service.
   */
  app.post("/api/v1/e2e/commands/document", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.documentId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.documentId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, and documentId are required fixture ids.",
          },
        },
        400,
      );
    }

    if (
      body.commandType !== undefined &&
      body.commandType !== "InitializeDocument"
    ) {
      return c.json(
        { error: { message: "Unsupported Document commandType." } },
        400,
      );
    }
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      typeof body.body !== "string" ||
      body.body.trim().length === 0
    ) {
      return c.json(
        { error: { message: "InitializeDocument requires title and body." } },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_document_${body.documentId}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_document_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    const command: SimulationCommand = {
      commandId: asCommandId(commandId),
      simulationRunId: asSimulationRunId(body.simulationRunId),
      actorId: asActorId(body.actorId),
      occurredAt: asIsoTimestamp(occurredAt),
      correlationId: asCorrelationId(correlationId),
      causationId: null,
      expectedVersion: run.aggregateVersion,
      commandType: "InitializeDocument",
      payload: {
        documentId: asDocumentId(body.documentId),
        title: body.title,
        body: body.body,
        ...(typeof body.definitionVersion === "string"
          ? { definitionVersion: body.definitionVersion }
          : {}),
        ...(typeof body.category === "string"
          ? { category: body.category }
          : {}),
        ...(typeof body.description === "string"
          ? { description: body.description }
          : {}),
      },
    };

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  /**
   * Test-only Notification command seam (not a public Notifications mutation API).
   * Supports InitializeNotification only so Playwright can drive PS-021 projection
   * convergence through the authoritative command application service.
   */
  app.post("/api/v1/e2e/commands/notification", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.notificationId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.notificationId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, and notificationId are required fixture ids.",
          },
        },
        400,
      );
    }

    if (
      body.commandType !== undefined &&
      body.commandType !== "InitializeNotification"
    ) {
      return c.json(
        { error: { message: "Unsupported Notification commandType." } },
        400,
      );
    }
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      typeof body.summary !== "string" ||
      body.summary.trim().length === 0 ||
      typeof body.sourceKind !== "string" ||
      !isNotificationSourceKind(body.sourceKind)
    ) {
      return c.json(
        {
          error: {
            message:
              "InitializeNotification requires title, summary, and a valid sourceKind.",
          },
        },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_notification_${body.notificationId}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_notification_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    const command: SimulationCommand = {
      commandId: asCommandId(commandId),
      simulationRunId: asSimulationRunId(body.simulationRunId),
      actorId: asActorId(body.actorId),
      occurredAt: asIsoTimestamp(occurredAt),
      correlationId: asCorrelationId(correlationId),
      causationId: null,
      expectedVersion: run.aggregateVersion,
      commandType: "InitializeNotification",
      payload: {
        notificationId: asNotificationId(body.notificationId),
        title: body.title,
        summary: body.summary,
        ...(typeof body.body === "string" ? { body: body.body } : {}),
        sourceKind: body.sourceKind,
        ...(typeof body.sourceId === "string"
          ? { sourceId: body.sourceId }
          : {}),
        ...(typeof body.sourceReason === "string"
          ? { sourceReason: body.sourceReason }
          : {}),
      },
    };

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  /**
   * Test-only Activity command seam (not a public Activities mutation API).
   * Supports InitializeActivity so Playwright can drive PS-022 projection
   * convergence through the authoritative command application service.
   */
  app.post("/api/v1/e2e/commands/activity", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.activityId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.activityId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, and activityId are required fixture ids.",
          },
        },
        400,
      );
    }

    if (
      body.commandType !== undefined &&
      body.commandType !== "InitializeActivity"
    ) {
      return c.json(
        { error: { message: "Unsupported Activity commandType." } },
        400,
      );
    }
    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      typeof body.summary !== "string" ||
      body.summary.trim().length === 0 ||
      typeof body.sourceKind !== "string" ||
      !isActivitySourceKind(body.sourceKind)
    ) {
      return c.json(
        {
          error: {
            message:
              "InitializeActivity requires title, summary, and a valid sourceKind.",
          },
        },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_activity_${body.activityId}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_activity_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    const command: SimulationCommand = {
      commandId: asCommandId(commandId),
      simulationRunId: asSimulationRunId(body.simulationRunId),
      actorId: asActorId(body.actorId),
      occurredAt: asIsoTimestamp(occurredAt),
      correlationId: asCorrelationId(correlationId),
      causationId: null,
      expectedVersion: run.aggregateVersion,
      commandType: "InitializeActivity",
      payload: {
        activityId: asActivityId(body.activityId),
        title: body.title,
        summary: body.summary,
        ...(typeof body.body === "string" ? { body: body.body } : {}),
        sourceKind: body.sourceKind,
        ...(typeof body.sourceId === "string"
          ? { sourceId: body.sourceId }
          : {}),
        ...(typeof body.sourceReason === "string"
          ? { sourceReason: body.sourceReason }
          : {}),
      },
    };

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  /**
   * Test-only Activity complete seam (not a public Activities mutation API).
   * Supports CompleteActivity so Playwright can drive PS-022 completed-history
   * projection convergence through the authoritative command application service.
   */
  app.post("/api/v1/e2e/commands/activity/complete", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.actorId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      typeof body.activityId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.actorId) ||
      !isFixtureId(body.simulationRunId) ||
      !isFixtureId(body.activityId)
    ) {
      return c.json(
        {
          error: {
            message:
              "tenantId, actorId, simulationRunId, and activityId are required fixture ids.",
          },
        },
        400,
      );
    }

    const services = registry.get(body.tenantId);
    const run = await services.module.runRepository.getById(
      asTenantId(body.tenantId),
      asSimulationRunId(body.simulationRunId),
    );
    if (!run) {
      return c.json({ error: { message: "SimulationRun not found." } }, 404);
    }

    const commandId =
      typeof body.commandId === "string" && isFixtureId(body.commandId)
        ? body.commandId
        : `cmd_activity_complete_${body.activityId}_${Date.now()}`;
    const correlationId =
      typeof body.correlationId === "string" && body.correlationId.trim()
        ? body.correlationId
        : `corr_activity_complete_${commandId}`;
    const occurredAt =
      typeof body.occurredAt === "string" &&
      !Number.isNaN(Date.parse(body.occurredAt))
        ? body.occurredAt
        : new Date().toISOString();

    const command: SimulationCommand = {
      commandId: asCommandId(commandId),
      simulationRunId: asSimulationRunId(body.simulationRunId),
      actorId: asActorId(body.actorId),
      occurredAt: asIsoTimestamp(occurredAt),
      correlationId: asCorrelationId(correlationId),
      causationId: null,
      expectedVersion: run.aggregateVersion,
      commandType: "CompleteActivity",
      payload: {
        activityId: asActivityId(body.activityId),
      },
    };

    const result = await services.applicationService.process(command);
    if (!isAccepted(result)) {
      return c.json(
        {
          error: {
            message: result.error.message,
            code: result.error.code,
          },
        },
        422,
      );
    }
    return c.json(
      {
        data: {
          commandId: result.commandId,
          aggregateVersion: result.aggregateVersion,
          simulationRunId: body.simulationRunId,
          eventTypes: result.emittedEvents.map((event) => event.eventType),
        },
      },
      200,
    );
  });

  app.post("/api/v1/e2e/relay/tick", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      !isFixtureId(body.tenantId)
    ) {
      return c.json({ error: { message: "Valid tenantId is required." } }, 400);
    }
    const services = registry.get(body.tenantId);
    const module = services.module as {
      outboxRelay?: { tick: () => Promise<unknown> };
    };
    if (!module.outboxRelay) {
      return c.json(
        {
          error: { message: "Outbox relay is unavailable for this registry." },
        },
        500,
      );
    }
    const result = await module.outboxRelay.tick();
    return c.json({ data: result }, 200);
  });

  app.post("/api/v1/e2e/events/redeliver-last", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { message: "Invalid JSON body." } }, 400);
    }
    if (
      !isRecord(body) ||
      typeof body.tenantId !== "string" ||
      typeof body.simulationRunId !== "string" ||
      !isFixtureId(body.tenantId) ||
      !isFixtureId(body.simulationRunId)
    ) {
      return c.json(
        {
          error: {
            message: "Valid tenantId and simulationRunId are required.",
          },
        },
        400,
      );
    }
    const services = registry.get(body.tenantId);
    const module = services.module as {
      projectionEventConsumer?: {
        handle: (event: unknown) => Promise<unknown>;
      };
    };
    const adminUrl = adminConnectionString();
    if (!adminUrl || !module.projectionEventConsumer) {
      return c.json(
        { error: { message: "Event redelivery helpers unavailable." } },
        500,
      );
    }
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: adminUrl });
    await client.connect();
    try {
      const rows = await client.query<{
        event_id: string;
        event_type: string;
        payload: unknown;
      }>(
        `select event_id, event_type, payload
           from event_outbox
          where tenant_id = $1 and simulation_run_id = $2
          order by id desc
          limit 1`,
        [body.tenantId, body.simulationRunId],
      );
      if (rows.rowCount === 0) {
        return c.json({ error: { message: "No outbox event found." } }, 404);
      }
      const row = rows.rows[0]!;
      const payload =
        typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
      await module.projectionEventConsumer.handle(payload);
      await module.projectionEventConsumer.handle(payload);
      return c.json(
        {
          data: {
            eventId: row.event_id,
            eventType: row.event_type,
            redelivered: 2,
          },
        },
        200,
      );
    } finally {
      await client.end();
    }
  });
};
