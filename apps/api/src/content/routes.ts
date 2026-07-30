/**
 * Learner-facing business-case catalog and run-creation routes (BC-003).
 */

import type { Hono } from "hono";
import {
  asBusinessCaseId,
  asContentPackageVersionId,
  asLearnerId,
  isExperienceLevel,
  type ExperienceLevel,
} from "@projectsim/domain";
import type { AuthResolver } from "../auth/session";
import type { ApiErrorResponse, ApiSuccessResponse } from "../http/envelopes";
import { API_VERSION } from "../http/envelopes";
import { httpError, mapCommandErrorToHttp } from "../http/map-error";
import type { SimulationModuleRegistry } from "../module-registry";
import type { ContentApiModule } from "./content-module";

type Variables = {
  requestId: string;
  correlationId: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const mountContentRoutes = (
  app: Hono<{ Variables: Variables }>,
  deps: {
    readonly content: ContentApiModule;
    readonly simulationRegistry: SimulationModuleRegistry;
    readonly resolveAuth: AuthResolver;
  },
): void => {
  app.get("/api/v1/business-cases", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await deps.resolveAuth(c.req.header("Authorization"));
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

    const locale = c.req.query("locale") ?? "en-US";
    const learnerId = asLearnerId(auth.session.actorId);
    const cases = await deps.content.catalog.listSelectableCases({
      tenantId: auth.session.tenantId,
      learnerId,
      locale,
    });

    const body: ApiSuccessResponse<typeof cases> = {
      data: cases,
      meta: { requestId, correlationId, apiVersion: API_VERSION },
    };
    return c.json(body, 200);
  });

  app.get("/api/v1/business-cases/:businessCaseId", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await deps.resolveAuth(c.req.header("Authorization"));
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

    const locale = c.req.query("locale") ?? "en-US";
    const version = c.req.query("version");
    const learnerId = asLearnerId(auth.session.actorId);
    const details = await deps.content.catalog.getCaseDetails({
      tenantId: auth.session.tenantId,
      learnerId,
      businessCaseId: asBusinessCaseId(c.req.param("businessCaseId")),
      locale,
      ...(version !== undefined ? { contentVersion: version } : {}),
    });

    if (!details) {
      const errorBody: ApiErrorResponse = {
        error: {
          code: "DECISION_DEFINITION_NOT_FOUND",
          message: "Business case not found or not selectable.",
          retryable: false,
          requestId,
          correlationId,
        },
      };
      return c.json(errorBody, 404);
    }

    const body: ApiSuccessResponse<typeof details> = {
      data: details,
      meta: { requestId, correlationId, apiVersion: API_VERSION },
    };
    return c.json(body, 200);
  });

  app.post("/api/v1/simulation-runs", async (c) => {
    const requestId = c.get("requestId");
    const correlationId = c.get("correlationId");
    const auth = await deps.resolveAuth(c.req.header("Authorization"));
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

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "Request body must be JSON.",
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }
    if (!isRecord(payload)) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "Request body must be an object.",
        requestId,
        correlationId,
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const businessCaseIdRaw = payload.businessCaseId;
    const experienceLevelRaw = payload.experienceLevel;
    if (
      typeof businessCaseIdRaw !== "string" ||
      businessCaseIdRaw.trim() === ""
    ) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "businessCaseId is required.",
        requestId,
        correlationId,
        { fieldErrors: { businessCaseId: ["required"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }
    if (
      typeof experienceLevelRaw !== "string" ||
      !isExperienceLevel(experienceLevelRaw)
    ) {
      const mapped = httpError(
        400,
        "COMMAND_VALIDATION_FAILED",
        "experienceLevel must be explorer, practitioner, or leader.",
        requestId,
        correlationId,
        { fieldErrors: { experienceLevel: ["invalid"] } },
      );
      return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
    }

    const clientVersion = payload.contentPackageVersionId;
    const result = await deps.content.createRunFromCase(
      deps.simulationRegistry,
      {
        tenantId: auth.session.tenantId,
        actorId: auth.session.actorId,
        learnerId: asLearnerId(auth.session.actorId),
        businessCaseId: asBusinessCaseId(businessCaseIdRaw),
        experienceLevel: experienceLevelRaw as ExperienceLevel,
        correlationId,
        causationId: null,
        ...(typeof payload.simulationRunId === "string"
          ? { simulationRunId: payload.simulationRunId }
          : {}),
        ...(typeof clientVersion === "string"
          ? {
              clientContentPackageVersionId:
                asContentPackageVersionId(clientVersion),
            }
          : {}),
      },
    );

    if (!result.ok) {
      const mapped = mapCommandErrorToHttp(
        result.error,
        requestId,
        correlationId,
      );
      return c.json(
        { error: mapped.body } satisfies ApiErrorResponse,
        mapped.status as 400 | 401 | 403 | 404 | 409 | 412 | 422 | 500,
      );
    }

    const body: ApiSuccessResponse<{
      simulationRunId: string;
      businessCaseId: string;
      contentVersion: string;
      contentPackageVersionId: string;
      experienceLevel: ExperienceLevel;
      status: string;
      runtimeVersion: string;
      chapterId: string;
      initialized: {
        stakeholders: number;
        documents: number;
        notifications: number;
        activities: number;
        messages: number;
        meetings: number;
      };
    }> = {
      data: {
        simulationRunId: result.value.simulationRunId,
        businessCaseId: result.value.businessCaseId,
        contentVersion: result.value.contentVersion,
        contentPackageVersionId: result.value.contentPackageVersionId,
        experienceLevel: result.value.experienceLevel,
        status: result.value.status,
        runtimeVersion: result.value.runtimeVersion,
        chapterId: result.value.chapterId,
        initialized: result.value.initialized,
      },
      meta: { requestId, correlationId, apiVersion: API_VERSION },
    };
    return c.json(body, 201);
  });
};
