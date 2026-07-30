import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  asCommandId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asIsoTimestamp,
  asSimulationRunId,
  isAccepted,
  type CommandError,
} from "@projectsim/domain";
import type { PostgresDatabase } from "@projectsim/infrastructure";
import { createAuthResolver, type AuthResolver } from "./auth/session";
import { seedDemoSimulationRun } from "./dev/seed";
import {
  e2eSeamsEnabled,
  mountE2eRoutes,
  wrapGetProjectionServiceForE2e,
} from "./e2e/routes";
import { mountProjectionOpsRoutes } from "./projection-ops/routes";
import {
  createContentApiModule,
  type ContentApiModule,
} from "./content/content-module";
import { mountContentRoutes } from "./content/routes";
import { mountWorkplaceCommandRoutes } from "./workplace-commands/routes";
import {
  API_VERSION,
  toClientActivitiesProjection,
  toClientCompletedHistoryProjection,
  toClientDecisionLogProjection,
  toClientDocumentsProjection,
  toClientInboxProjection,
  toClientLearnerProgressionProjection,
  toClientMeetingsProjection,
  toClientMissionControlProjection,
  toClientNotificationsProjection,
  toClientPerformanceProjection,
  toClientCoachingProjection,
  toClientMasteryProjection,
  toClientAchievementsProjection,
  toClientProjection,
  toClientStakeholdersProjection,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type ClientActivitiesProjection,
  type ClientCompletedHistoryProjection,
  type ClientDecisionLogProjection,
  type ClientDocumentsProjection,
  type ClientInboxProjection,
  type ClientLearnerProgressionProjection,
  type ClientMeetingsProjection,
  type ClientMissionControlProjection,
  type ClientNotificationsProjection,
  type ClientPerformanceProjection,
  type ClientAchievementsProjection,
  type ClientMasteryProjection,
  type ClientCoachingProjection,
  type ClientSimulationProjection,
  type ClientStakeholdersProjection,
  type ProjectionApiMeta,
  type SubmitDecisionReceipt,
} from "./http/envelopes";
import {
  createInMemoryIdempotencyFingerprintStore,
  fingerprintSubmitDecisionBody,
  type IdempotencyFingerprintStore,
} from "./http/idempotency-fingerprint";
import { httpError, mapCommandErrorToHttp } from "./http/map-error";
import type { SimulationModuleRegistry } from "./module-registry";

export interface CreateApiAppOptions {
  /** Required — callers must choose memory or postgres registry explicitly. */
  readonly registry: SimulationModuleRegistry & {
    readonly database?: PostgresDatabase;
  };
  /** Optional shared content module (fixtures + catalog). Created when omitted. */
  readonly contentModule?: ContentApiModule;
  readonly resolveAuth?: AuthResolver;
  readonly idempotencyFingerprints?: IdempotencyFingerprintStore;
  readonly clock?: () => string;
  readonly allocateRequestId?: () => string;
  /** Override for tests; defaults to false (opt-in via PROJECTSIM_ENABLE_DEV_ROUTES=1). */
  readonly enableDevRoutes?: boolean;
  readonly allowDevAuth?: boolean;
  /**
   * Opt-in E2E setup/teardown + projection-gate seams (PS-ROADMAP-008).
   * Defaults from PROJECTSIM_ENABLE_E2E_SEAMS=1 when NODE_ENV !== production.
   */
  readonly enableE2eSeams?: boolean;
}

type Variables = {
  requestId: string;
  correlationId: string;
};

const parseIfMatch = (
  header: string | undefined,
):
  | { readonly ok: true; readonly version: number }
  | { readonly ok: false; readonly message: string } => {
  if (header === undefined || header.trim().length === 0) {
    return { ok: false, message: "If-Match header is required." };
  }
  const trimmed = header.trim();
  const quoted = trimmed.match(/^"(\d+)"$/);
  const raw = quoted?.[1] ?? (trimmed.match(/^\d+$/) ? trimmed : null);
  if (raw === null) {
    return {
      ok: false,
      message:
        'If-Match must be a quoted integer aggregate version (e.g. "3").',
    };
  }
  const version = Number(raw);
  if (!Number.isInteger(version) || version < 0) {
    return {
      ok: false,
      message: "If-Match aggregate version must be a non-negative integer.",
    };
  }
  return { ok: true, version };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createApiApp = (options: CreateApiAppOptions) => {
  const registry = options.registry;
  const resolveAuth =
    options.resolveAuth ??
    createAuthResolver({
      allowDevAuth: options.allowDevAuth ?? true,
    });
  const fingerprints =
    options.idempotencyFingerprints ??
    createInMemoryIdempotencyFingerprintStore();
  const clock = options.clock ?? (() => new Date().toISOString());
  const allocateRequestId =
    options.allocateRequestId ??
    (() => {
      let n = 0;
      return () => `req_${Date.now().toString(36)}_${(n += 1)}`;
    })();
  const enableDevRoutes = options.enableDevRoutes === true;
  // Defense-in-depth: never mount E2E seams when NODE_ENV=production,
  // even if a caller forces enableE2eSeams: true.
  const enableE2eSeams =
    process.env.NODE_ENV !== "production" &&
    (options.enableE2eSeams === true ||
      (options.enableE2eSeams === undefined && e2eSeamsEnabled()));

  const app = new Hono<{ Variables: Variables }>();
  app.use("*", cors());

  app.use("*", async (c, next) => {
    const requestId =
      c.req.header("X-Request-ID")?.trim() || allocateRequestId();
    const correlationId = c.req.header("X-Correlation-ID")?.trim() || requestId;
    c.set("requestId", requestId);
    c.set("correlationId", correlationId);
    await next();
  });

  app.onError((error, c) => {
    const requestId = c.get("requestId") || allocateRequestId();
    const correlationId = c.get("correlationId") || requestId;
    const mapped = httpError(
      500,
      "UNEXPECTED_ERROR",
      "An unexpected server error occurred.",
      requestId,
      correlationId,
      { retryable: true },
    );
    // Avoid leaking Infrastructure/SQL details to clients.
    void error;
    return c.json({ error: mapped.body } satisfies ApiErrorResponse, 500);
  });

  app.get("/healthz", (c) => c.json({ ok: true, apiVersion: API_VERSION }));

  const contentModule = options.contentModule ?? createContentApiModule();
  mountContentRoutes(app, {
    content: contentModule,
    simulationRegistry: registry,
    resolveAuth,
  });

  mountWorkplaceCommandRoutes(app, {
    registry,
    content: contentModule,
    resolveAuth,
    fingerprints,
    clock,
  });

  mountProjectionOpsRoutes(app, { registry, resolveAuth });

  if (enableDevRoutes) {
    app.post("/api/v1/dev/seed-simulation-run", async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Request body must be valid JSON.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }
      if (!isRecord(body) || typeof body.simulationRunId !== "string") {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }
      const seeded = await seedDemoSimulationRun(registry, {
        tenantId: auth.session.tenantId,
        actorId: auth.session.actorId,
        simulationRunId: body.simulationRunId,
        correlationId,
        ...(typeof body.learnerId === "string"
          ? { learnerId: body.learnerId }
          : {}),
        ...(typeof body.businessCaseId === "string"
          ? { businessCaseId: body.businessCaseId }
          : {}),
      });
      if (!seeded.ok) {
        const mapped = httpError(
          422,
          "SEED_FAILED",
          seeded.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 422);
      }
      return c.json(
        {
          data: {
            simulationRunId: body.simulationRunId,
            status: "active",
          },
          meta: { requestId, correlationId, apiVersion: API_VERSION },
        },
        200,
      );
    });
  }

  app.get("/api/v1/simulation-runs/:simulationRunId/projection", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const getProjection = enableE2eSeams
      ? wrapGetProjectionServiceForE2e(
          services.getProjectionService,
          auth.session.tenantId,
        )
      : services.getProjectionService;
    const result = await getProjection.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientProjection(projection);
    const response: ApiSuccessResponse<
      ClientSimulationProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    return c.json(response, 200);
  });

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/mission-control",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getMissionControlProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientMissionControlProjection(projection);
      const response: ApiSuccessResponse<
        ClientMissionControlProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/decision-log",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getDecisionLogProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientDecisionLogProjection(projection);
      const response: ApiSuccessResponse<
        ClientDecisionLogProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get("/api/v1/simulation-runs/:simulationRunId/inbox", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getInboxProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientInboxProjection(projection);
    const response: ApiSuccessResponse<
      ClientInboxProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get("/api/v1/simulation-runs/:simulationRunId/meetings", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getMeetingsProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientMeetingsProjection(projection);
    const response: ApiSuccessResponse<
      ClientMeetingsProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/stakeholders",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getStakeholdersProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientStakeholdersProjection(projection);
      const response: ApiSuccessResponse<
        ClientStakeholdersProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get("/api/v1/simulation-runs/:simulationRunId/documents", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getDocumentsProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientDocumentsProjection(projection);
    const response: ApiSuccessResponse<
      ClientDocumentsProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get("/api/v1/simulation-runs/:simulationRunId/performance", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getPerformanceProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientPerformanceProjection(projection);
    const response: ApiSuccessResponse<
      ClientPerformanceProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/learner-progression",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getLearnerProgressionProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientLearnerProgressionProjection(projection);
      const response: ApiSuccessResponse<
        ClientLearnerProgressionProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/achievements",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getAchievementsProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientAchievementsProjection(projection);
      const response: ApiSuccessResponse<
        ClientAchievementsProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get("/api/v1/simulation-runs/:simulationRunId/mastery", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getMasteryProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientMasteryProjection(projection);
    const response: ApiSuccessResponse<
      ClientMasteryProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get("/api/v1/simulation-runs/:simulationRunId/coaching", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getCoachingProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientCoachingProjection(projection);
    const response: ApiSuccessResponse<
      ClientCoachingProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/notifications",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getNotificationsProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientNotificationsProjection(projection);
      const response: ApiSuccessResponse<
        ClientNotificationsProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.get("/api/v1/simulation-runs/:simulationRunId/activities", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await resolveAuth(c.req.header("Authorization"));
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
    }

    const runIdRaw = c.req.param("simulationRunId");
    if (!runIdRaw || runIdRaw.trim().length === 0) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "simulationRunId path parameter is required.",
        requestId,
        correlationId,
        { fieldErrors: { simulationRunId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const services = registry.get(auth.session.tenantId);
    const result = await services.getActivitiesProjectionService.get({
      simulationRunId: asSimulationRunId(runIdRaw),
      actorId: auth.session.actorId,
      correlationId: asCorrelationId(correlationId),
      causationId: null,
    });

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const projection = result.value.projection;
    const data = toClientActivitiesProjection(projection);
    const response: ApiSuccessResponse<
      ClientActivitiesProjection,
      ProjectionApiMeta
    > = {
      data,
      meta: {
        requestId,
        correlationId,
        apiVersion: API_VERSION,
        projectionSchemaVersion: projection.projectionSchemaVersion,
        sourceAggregateVersion: projection.sourceAggregateVersion,
        freshness: result.value.freshness,
        generatedAt: projection.generatedAt,
      },
    };
    c.header("Cache-Control", "private, no-store");
    return c.json(response, 200);
  });

  app.get(
    "/api/v1/simulation-runs/:simulationRunId/completed-history",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const runIdRaw = c.req.param("simulationRunId");
      if (!runIdRaw || runIdRaw.trim().length === 0) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "simulationRunId path parameter is required.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const services = registry.get(auth.session.tenantId);
      const result = await services.getCompletedHistoryProjectionService.get({
        simulationRunId: asSimulationRunId(runIdRaw),
        actorId: auth.session.actorId,
        correlationId: asCorrelationId(correlationId),
        causationId: null,
      });

      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const projection = result.value.projection;
      const data = toClientCompletedHistoryProjection(projection);
      const response: ApiSuccessResponse<
        ClientCompletedHistoryProjection,
        ProjectionApiMeta
      > = {
        data,
        meta: {
          requestId,
          correlationId,
          apiVersion: API_VERSION,
          projectionSchemaVersion: projection.projectionSchemaVersion,
          sourceAggregateVersion: projection.sourceAggregateVersion,
          freshness: result.value.freshness,
          generatedAt: projection.generatedAt,
        },
      };
      c.header("Cache-Control", "private, no-store");
      return c.json(response, 200);
    },
  );

  app.post(
    "/api/v1/simulation-runs/:simulationRunId/commands/submit-decision",
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const auth = await resolveAuth(c.req.header("Authorization"));
      if (!auth.ok) {
        const mapped = httpError(
          401,
          auth.code,
          auth.message,
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 401);
      }

      const contentType = c.req.header("Content-Type") ?? "";
      if (!contentType.includes("application/json")) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Content-Type must be application/json.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const idempotencyKey = c.req.header("Idempotency-Key")?.trim();
      if (!idempotencyKey) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Idempotency-Key header is required.",
          requestId,
          correlationId,
          { fieldErrors: { "header.Idempotency-Key": ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const ifMatch = parseIfMatch(c.req.header("If-Match"));
      if (!ifMatch.ok) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          ifMatch.message,
          requestId,
          correlationId,
          { fieldErrors: { "header.If-Match": ["invalid"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Request body must be valid JSON.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (!isRecord(body)) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Request body must be an object.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const pathRunId = c.req.param("simulationRunId");
      if (
        typeof body.simulationRunId === "string" &&
        body.simulationRunId !== pathRunId
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Path simulationRunId must match body.simulationRunId.",
          requestId,
          correlationId,
          { fieldErrors: { simulationRunId: ["mismatch"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (body.commandType !== "SubmitDecision") {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          'commandType must be "SubmitDecision".',
          requestId,
          correlationId,
          { fieldErrors: { commandType: ["invalid"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (body.commandVersion !== 1) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "commandVersion must be 1.",
          requestId,
          correlationId,
          { fieldErrors: { commandVersion: ["unsupported"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (
        typeof body.commandId !== "string" ||
        body.commandId.trim().length === 0
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "commandId is required.",
          requestId,
          correlationId,
          { fieldErrors: { commandId: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (body.commandId !== idempotencyKey) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "Idempotency-Key must equal commandId for SubmitDecision.",
          requestId,
          correlationId,
          { fieldErrors: { "header.Idempotency-Key": ["mismatch"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (
        typeof body.expectedAggregateVersion !== "number" ||
        !Number.isInteger(body.expectedAggregateVersion)
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "expectedAggregateVersion must be an integer.",
          requestId,
          correlationId,
          { fieldErrors: { expectedAggregateVersion: ["invalid"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (body.expectedAggregateVersion !== ifMatch.version) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "If-Match must match body.expectedAggregateVersion.",
          requestId,
          correlationId,
          { fieldErrors: { "header.If-Match": ["mismatch"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (!isRecord(body.payload)) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload is required.",
          requestId,
          correlationId,
          { fieldErrors: { payload: ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (
        typeof body.payload.decisionId !== "string" ||
        typeof body.payload.optionId !== "string"
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload.decisionId and payload.optionId are required.",
          requestId,
          correlationId,
          {
            fieldErrors: {
              "payload.decisionId": ["required"],
              "payload.optionId": ["required"],
            },
          },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (
        body.payload.rationale !== undefined &&
        typeof body.payload.rationale !== "string"
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload.rationale must be a string when provided.",
          requestId,
          correlationId,
          { fieldErrors: { "payload.rationale": ["invalid"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      if (
        typeof body.payload.rationale === "string" &&
        body.payload.rationale.length > 4000
      ) {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload.rationale exceeds the maximum length of 4000.",
          requestId,
          correlationId,
          { fieldErrors: { "payload.rationale": ["too_long"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const fingerprint = fingerprintSubmitDecisionBody({
        commandType: body.commandType,
        commandVersion: body.commandVersion,
        expectedAggregateVersion: body.expectedAggregateVersion,
        payload: body.payload,
        simulationRunId: pathRunId,
      });
      const fingerprinted = fingerprints.rememberOrConflict(
        auth.session.tenantId,
        idempotencyKey,
        fingerprint,
      );
      if (fingerprinted === "conflict") {
        const mapped = httpError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency-Key was reused with a different payload.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 409);
      }

      const services = registry.get(auth.session.tenantId);
      const command = {
        commandId: asCommandId(body.commandId),
        commandType: "SubmitDecision" as const,
        simulationRunId: asSimulationRunId(pathRunId),
        actorId: auth.session.actorId,
        occurredAt: asIsoTimestamp(clock()),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: body.expectedAggregateVersion,
        payload: {
          decisionId: asDecisionId(body.payload.decisionId),
          optionId: asDecisionOptionId(body.payload.optionId),
          ...(typeof body.payload.rationale === "string"
            ? { rationale: body.payload.rationale }
            : {}),
        },
      };

      const result = await services.applicationService.process(command);
      if (isAccepted(result)) {
        const receipt: SubmitDecisionReceipt = {
          commandId: result.commandId,
          status: "accepted",
          aggregateVersion: result.aggregateVersion,
          simulationRunId: result.simulationRunId,
          correlationId: result.correlationId,
        };
        const response: ApiSuccessResponse<SubmitDecisionReceipt> = {
          data: receipt,
          meta: {
            requestId,
            correlationId,
            apiVersion: API_VERSION,
          },
        };
        return c.json(response, 200);
      }

      const mapped = mapCommandErrorToHttp(
        result.error as CommandError,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 400 | 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    },
  );

  if (enableE2eSeams) {
    mountE2eRoutes(app, { registry });
  }

  return app;
};

export type ApiApp = ReturnType<typeof createApiApp>;
