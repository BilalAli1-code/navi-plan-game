import { Hono } from "hono";
import {
  PROJECTION_OPS_CAPABILITY,
  type ProjectionOperationsService,
} from "@projectsim/application";
import { asActorId, asTenantId } from "@projectsim/domain";
import type { MembershipStore } from "@projectsim/infrastructure";
import type { AuthResolver } from "../auth/session";
import {
  API_VERSION,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from "../http/envelopes";
import { httpError, mapCommandErrorToHttp } from "../http/map-error";
import type { SimulationModuleRegistry } from "../module-registry";

type Variables = {
  requestId: string;
  correlationId: string;
};

export interface MountProjectionOpsRoutesOptions {
  readonly registry: SimulationModuleRegistry;
  readonly resolveAuth: AuthResolver;
}

const getOpsService = (
  registry: SimulationModuleRegistry,
  tenantId: string,
): {
  readonly ops: ProjectionOperationsService | null;
  readonly membershipStore: MembershipStore | null;
} => {
  const services = registry.get(tenantId);
  const module = services.module as {
    readonly projectionOperationsService?: ProjectionOperationsService | null;
    readonly membershipStore?: MembershipStore;
  };
  return {
    ops: module.projectionOperationsService ?? null,
    membershipStore: module.membershipStore ?? null,
  };
};

/**
 * Privileged projection operations (PS-ROADMAP-023).
 * Not a learner Workplace API. Requires `simulation.projection.ops`.
 * Excluded from public OpenAPI; documented in internal ops contract.
 */
export const mountProjectionOpsRoutes = (
  app: Hono<{ Variables: Variables }>,
  options: MountProjectionOpsRoutesOptions,
) => {
  const resolveActor = async (
    authorization: string | undefined,
    requestId: string,
    correlationId: string,
  ) => {
    const auth = await options.resolveAuth(authorization);
    if (!auth.ok) {
      const mapped = httpError(
        401,
        auth.code,
        auth.message,
        requestId,
        correlationId,
      );
      return { ok: false as const, response: mapped };
    }
    const { ops, membershipStore } = getOpsService(
      options.registry,
      auth.session.tenantId,
    );
    if (!ops || !membershipStore) {
      const mapped = httpError(
        503,
        "UNEXPECTED_ERROR",
        "Projection operations are unavailable in this composition.",
        requestId,
        correlationId,
        { retryable: true },
      );
      return { ok: false as const, response: mapped };
    }
    const membership = await membershipStore.findMembership(
      auth.session.tenantId,
      auth.session.actorId,
    );
    if (!membership) {
      const mapped = httpError(
        403,
        "TENANT_ACCESS_DENIED",
        "Actor is not a member of this tenant.",
        requestId,
        correlationId,
      );
      return { ok: false as const, response: mapped };
    }
    if (!membership.capabilities.includes(PROJECTION_OPS_CAPABILITY)) {
      const mapped = httpError(
        403,
        "PERMISSION_DENIED",
        "Missing simulation.projection.ops capability.",
        requestId,
        correlationId,
      );
      return { ok: false as const, response: mapped };
    }
    return {
      ok: true as const,
      ops,
      actor: {
        actorId: asActorId(auth.session.actorId),
        tenantId: asTenantId(auth.session.tenantId),
        capabilities: membership.capabilities,
      },
    };
  };

  const base = "/api/v1/internal/projection-operations";

  app.get(`${base}/worker-status`, async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const resolved = await resolveActor(
      c.req.header("Authorization"),
      requestId,
      correlationId,
    );
    if (!resolved.ok) {
      return c.json(
        { error: resolved.response.body } satisfies ApiErrorResponse,
        resolved.response.status as 401 | 403 | 503,
      );
    }
    const queue = await resolved.ops.getQueueSummary(resolved.actor);
    if (!queue.ok) {
      const mapped = mapCommandErrorToHttp(
        queue.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 422 | 500,
      );
    }
    const body: ApiSuccessResponse<{
      mode: "external_worker";
      note: string;
      queue: typeof queue.value;
    }> = {
      data: {
        mode: "external_worker",
        note: "Continuous relay runs in @projectsim/worker. Inspect /healthz on RELAY_HEALTH_PORT for process liveness/readiness.",
        queue: queue.value,
      },
      meta: { requestId, correlationId, apiVersion: API_VERSION },
    };
    return c.json(body, 200);
  });

  app.get(`${base}/queue-summary`, async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const resolved = await resolveActor(
      c.req.header("Authorization"),
      requestId,
      correlationId,
    );
    if (!resolved.ok) {
      return c.json(
        { error: resolved.response.body } satisfies ApiErrorResponse,
        resolved.response.status as 401 | 403 | 503,
      );
    }
    const result = await resolved.ops.getQueueSummary(resolved.actor);
    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 422 | 500,
      );
    }
    return c.json(
      {
        data: result.value,
        meta: { requestId, correlationId, apiVersion: API_VERSION },
      } satisfies ApiSuccessResponse<typeof result.value>,
      200,
    );
  });

  app.get(`${base}/failed-targets`, async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const resolved = await resolveActor(
      c.req.header("Authorization"),
      requestId,
      correlationId,
    );
    if (!resolved.ok) {
      return c.json(
        { error: resolved.response.body } satisfies ApiErrorResponse,
        resolved.response.status as 401 | 403 | 503,
      );
    }
    const limit = Number(c.req.query("limit") ?? "50");
    const offset = Number(c.req.query("offset") ?? "0");
    const simulationRunId = c.req.query("simulationRunId") ?? undefined;
    const projectionType = c.req.query("projectionType") ?? undefined;
    const result = await resolved.ops.listFailedTargets(resolved.actor, {
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
      ...(simulationRunId ? { simulationRunId } : {}),
      ...(projectionType ? { projectionType } : {}),
    });
    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 422 | 500,
      );
    }
    // Strip nothing sensitive beyond already-safe error summaries.
    return c.json(
      {
        data: {
          items: result.value.map((target) => ({
            eventId: target.eventId,
            projectionType: target.projectionType,
            simulationRunId: target.simulationRunId,
            eventType: target.eventType,
            status: target.status,
            attemptCount: target.attemptCount,
            nextAttemptAt: target.nextAttemptAt,
            exhaustedAt: target.exhaustedAt,
            lastErrorClassification: target.lastErrorClassification,
            lastErrorSummary: target.lastErrorSummary,
            updatedAt: target.updatedAt,
          })),
          limit: Number.isFinite(limit) ? limit : 50,
          offset: Number.isFinite(offset) ? offset : 0,
        },
        meta: { requestId, correlationId, apiVersion: API_VERSION },
      },
      200,
    );
  });

  app.get(`${base}/failed-targets/:eventId/:projectionType`, async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const resolved = await resolveActor(
      c.req.header("Authorization"),
      requestId,
      correlationId,
    );
    if (!resolved.ok) {
      return c.json(
        { error: resolved.response.body } satisfies ApiErrorResponse,
        resolved.response.status as 401 | 403 | 503,
      );
    }
    const result = await resolved.ops.getFailedTarget(
      resolved.actor,
      c.req.param("eventId"),
      c.req.param("projectionType"),
    );
    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 422 | 500,
      );
    }
    const target = result.value;
    return c.json(
      {
        data: {
          eventId: target.eventId,
          projectionType: target.projectionType,
          simulationRunId: target.simulationRunId,
          eventType: target.eventType,
          status: target.status,
          attemptCount: target.attemptCount,
          nextAttemptAt: target.nextAttemptAt,
          exhaustedAt: target.exhaustedAt,
          lastErrorClassification: target.lastErrorClassification,
          lastErrorSummary: target.lastErrorSummary,
          updatedAt: target.updatedAt,
        },
        meta: { requestId, correlationId, apiVersion: API_VERSION },
      },
      200,
    );
  });

  app.get(`${base}/simulation-runs/:simulationRunId/projections`, async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const resolved = await resolveActor(
      c.req.header("Authorization"),
      requestId,
      correlationId,
    );
    if (!resolved.ok) {
      return c.json(
        { error: resolved.response.body } satisfies ApiErrorResponse,
        resolved.response.status as 401 | 403 | 503,
      );
    }
    const projectionType = c.req.query("projectionType") ?? undefined;
    const result = await resolved.ops.getProjectionStatus(resolved.actor, {
      simulationRunId: c.req.param("simulationRunId"),
      ...(projectionType ? { projectionType } : {}),
    });
    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 401 | 403 | 404 | 422 | 500,
      );
    }
    return c.json(
      {
        data: result.value,
        meta: { requestId, correlationId, apiVersion: API_VERSION },
      },
      200,
    );
  });

  app.post(
    `${base}/simulation-runs/:simulationRunId/projections/:projectionType/rebuild`,
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const resolved = await resolveActor(
        c.req.header("Authorization"),
        requestId,
        correlationId,
      );
      if (!resolved.ok) {
        return c.json(
          { error: resolved.response.body } satisfies ApiErrorResponse,
          resolved.response.status as 401 | 403 | 503,
        );
      }
      const result = await resolved.ops.rebuildOne(resolved.actor, {
        simulationRunId: c.req.param("simulationRunId"),
        projectionType: c.req.param("projectionType"),
        correlationId,
      });
      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 422 | 500,
        );
      }
      return c.json(
        {
          data: result.value,
          meta: { requestId, correlationId, apiVersion: API_VERSION },
        },
        200,
      );
    },
  );

  app.post(
    `${base}/simulation-runs/:simulationRunId/projections/rebuild-all`,
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const resolved = await resolveActor(
        c.req.header("Authorization"),
        requestId,
        correlationId,
      );
      if (!resolved.ok) {
        return c.json(
          { error: resolved.response.body } satisfies ApiErrorResponse,
          resolved.response.status as 401 | 403 | 503,
        );
      }
      const result = await resolved.ops.rebuildAllForRun(resolved.actor, {
        simulationRunId: c.req.param("simulationRunId"),
        correlationId,
      });
      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 422 | 500,
        );
      }
      return c.json(
        {
          data: result.value,
          meta: { requestId, correlationId, apiVersion: API_VERSION },
        },
        200,
      );
    },
  );

  app.post(
    `${base}/failed-targets/:eventId/:projectionType/retry`,
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const resolved = await resolveActor(
        c.req.header("Authorization"),
        requestId,
        correlationId,
      );
      if (!resolved.ok) {
        return c.json(
          { error: resolved.response.body } satisfies ApiErrorResponse,
          resolved.response.status as 401 | 403 | 503,
        );
      }
      const result = await resolved.ops.retryFailedTarget(resolved.actor, {
        eventId: c.req.param("eventId"),
        projectionType: c.req.param("projectionType"),
      });
      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 422 | 500,
        );
      }
      return c.json(
        {
          data: result.value,
          meta: { requestId, correlationId, apiVersion: API_VERSION },
        },
        200,
      );
    },
  );

  app.post(
    `${base}/failed-targets/:eventId/:projectionType/replay`,
    async (c) => {
      const requestId = c.get("requestId");
      const correlationId = c.get("correlationId");
      const resolved = await resolveActor(
        c.req.header("Authorization"),
        requestId,
        correlationId,
      );
      if (!resolved.ok) {
        return c.json(
          { error: resolved.response.body } satisfies ApiErrorResponse,
          resolved.response.status as 401 | 403 | 503,
        );
      }
      const result = await resolved.ops.replayTarget(resolved.actor, {
        eventId: c.req.param("eventId"),
        projectionType: c.req.param("projectionType"),
      });
      if (!result.ok) {
        const mapped = mapCommandErrorToHttp(
          result.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 401 | 403 | 404 | 422 | 500,
        );
      }
      return c.json(
        {
          data: result.value,
          meta: { requestId, correlationId, apiVersion: API_VERSION },
        },
        200,
      );
    },
  );
};
