/**
 * Learner-facing workplace command routes (BC-004).
 *
 * CompleteActivity, StartMeeting, CompleteMeeting, and CompleteChapter.
 * Follows SubmitDecision envelope conventions (Idempotency-Key = commandId,
 * If-Match = expectedAggregateVersion).
 */

import type { Context, Hono } from "hono";
import {
  asActivityId,
  asCommandId,
  asCorrelationId,
  asIsoTimestamp,
  asMeetingId,
  asSimulationRunId,
  isAccepted,
  type CommandError,
  type SimulationCommand,
} from "@projectsim/domain";
import { completeChapterFromContent } from "@projectsim/application";
import type { AuthResolver } from "../auth/session";
import type { ContentApiModule } from "../content/content-module";
import {
  API_VERSION,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type SubmitDecisionReceipt,
} from "../http/envelopes";
import {
  type IdempotencyFingerprintStore,
  fingerprintSubmitDecisionBody,
} from "../http/idempotency-fingerprint";
import { httpError, mapCommandErrorToHttp } from "../http/map-error";
import type { SimulationModuleRegistry } from "../module-registry";

type Variables = {
  requestId: string;
  correlationId: string;
};

type AppContext = Context<{ Variables: Variables }>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
      message: 'If-Match must be an integer ETag such as "3".',
    };
  }
  return { ok: true, version: Number(raw) };
};

type EnvelopeOk = {
  readonly ok: true;
  readonly pathRunId: string;
  readonly idempotencyKey: string;
  readonly ifMatchVersion: number;
  readonly body: Record<string, unknown>;
};

type EnvelopeErr = {
  readonly ok: false;
  readonly status: 400;
  readonly body: ApiErrorResponse;
};

const readCommandEnvelope = async (
  c: AppContext,
  requestId: string,
  correlationId: string,
  expectedCommandType: string,
): Promise<EnvelopeOk | EnvelopeErr> => {
  const contentType = c.req.header("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      "Content-Type must be application/json.",
      requestId,
      correlationId,
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  const idempotencyKeyHeader = c.req.header("Idempotency-Key")?.trim();
  if (!idempotencyKeyHeader) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      "Idempotency-Key header is required.",
      requestId,
      correlationId,
      { fieldErrors: { "header.Idempotency-Key": ["required"] } },
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  if (!isRecord(body)) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      "Request body must be an object.",
      requestId,
      correlationId,
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  const pathRunId = c.req.param("simulationRunId");
  if (typeof pathRunId !== "string" || pathRunId.trim().length === 0) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      "simulationRunId path parameter is required.",
      requestId,
      correlationId,
      { fieldErrors: { simulationRunId: ["required"] } },
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
  }
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
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  if (body.commandType !== expectedCommandType) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      `commandType must be "${expectedCommandType}".`,
      requestId,
      correlationId,
      { fieldErrors: { commandType: ["invalid"] } },
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  if (body.commandId !== idempotencyKeyHeader) {
    const mapped = httpError(
      400,
      "COMMAND_VALIDATION_FAILED",
      `Idempotency-Key must equal commandId for ${expectedCommandType}.`,
      requestId,
      correlationId,
      { fieldErrors: { "header.Idempotency-Key": ["mismatch"] } },
    );
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  const idempotencyKey = idempotencyKeyHeader;

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
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
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
    return { ok: false, status: 400, body: { error: mapped.body } };
  }

  return {
    ok: true,
    pathRunId,
    idempotencyKey,
    ifMatchVersion: ifMatch.version,
    body,
  };
};

export const mountWorkplaceCommandRoutes = (
  app: Hono<{ Variables: Variables }>,
  deps: {
    readonly registry: SimulationModuleRegistry;
    readonly content: ContentApiModule;
    readonly resolveAuth: AuthResolver;
    readonly fingerprints: IdempotencyFingerprintStore;
    readonly clock: () => string;
  },
): void => {
  app.post(
    "/api/v1/simulation-runs/:simulationRunId/commands/complete-activity",
    async (c) => {
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

      const envelope = await readCommandEnvelope(
        c,
        requestId,
        correlationId,
        "CompleteActivity",
      );
      if (!envelope.ok) {
        return c.json(envelope.body, envelope.status);
      }

      const payload = envelope.body.payload as Record<string, unknown>;
      if (typeof payload.activityId !== "string") {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload.activityId is required.",
          requestId,
          correlationId,
          { fieldErrors: { "payload.activityId": ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const fingerprint = fingerprintSubmitDecisionBody({
        commandType: "CompleteActivity",
        commandVersion: 1,
        expectedAggregateVersion: envelope.body.expectedAggregateVersion,
        payload,
        simulationRunId: envelope.pathRunId,
      });
      if (
        deps.fingerprints.rememberOrConflict(
          auth.session.tenantId,
          envelope.idempotencyKey,
          fingerprint,
        ) === "conflict"
      ) {
        const mapped = httpError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency-Key was reused with a different payload.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 409);
      }

      const services = deps.registry.get(auth.session.tenantId);
      const command: SimulationCommand = {
        commandId: asCommandId(String(envelope.body.commandId)),
        commandType: "CompleteActivity",
        simulationRunId: asSimulationRunId(envelope.pathRunId),
        actorId: auth.session.actorId,
        occurredAt: asIsoTimestamp(deps.clock()),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: envelope.ifMatchVersion,
        payload: {
          activityId: asActivityId(payload.activityId),
          ...(typeof payload.note === "string" ? { note: payload.note } : {}),
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
          meta: { requestId, correlationId, apiVersion: API_VERSION },
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

  const mountMeetingCommand = (
    path: string,
    commandType: "StartMeeting" | "CompleteMeeting",
  ) => {
    app.post(path, async (c) => {
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

      const envelope = await readCommandEnvelope(
        c,
        requestId,
        correlationId,
        commandType,
      );
      if (!envelope.ok) {
        return c.json(envelope.body, envelope.status);
      }

      const payload = envelope.body.payload as Record<string, unknown>;
      if (typeof payload.meetingId !== "string") {
        const mapped = httpError(
          400,
          "COMMAND_VALIDATION_FAILED",
          "payload.meetingId is required.",
          requestId,
          correlationId,
          { fieldErrors: { "payload.meetingId": ["required"] } },
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 400);
      }

      const fingerprint = fingerprintSubmitDecisionBody({
        commandType,
        commandVersion: 1,
        expectedAggregateVersion: envelope.body.expectedAggregateVersion,
        payload,
        simulationRunId: envelope.pathRunId,
      });
      if (
        deps.fingerprints.rememberOrConflict(
          auth.session.tenantId,
          envelope.idempotencyKey,
          fingerprint,
        ) === "conflict"
      ) {
        const mapped = httpError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency-Key was reused with a different payload.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 409);
      }

      const services = deps.registry.get(auth.session.tenantId);
      const command: SimulationCommand = {
        commandId: asCommandId(String(envelope.body.commandId)),
        commandType,
        simulationRunId: asSimulationRunId(envelope.pathRunId),
        actorId: auth.session.actorId,
        occurredAt: asIsoTimestamp(deps.clock()),
        correlationId: asCorrelationId(correlationId),
        causationId: null,
        expectedVersion: envelope.ifMatchVersion,
        payload: { meetingId: asMeetingId(payload.meetingId) },
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
          meta: { requestId, correlationId, apiVersion: API_VERSION },
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
    });
  };

  mountMeetingCommand(
    "/api/v1/simulation-runs/:simulationRunId/commands/start-meeting",
    "StartMeeting",
  );
  mountMeetingCommand(
    "/api/v1/simulation-runs/:simulationRunId/commands/complete-meeting",
    "CompleteMeeting",
  );

  app.post(
    "/api/v1/simulation-runs/:simulationRunId/commands/complete-chapter",
    async (c) => {
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

      const envelope = await readCommandEnvelope(
        c,
        requestId,
        correlationId,
        "CompleteChapter",
      );
      if (!envelope.ok) {
        return c.json(envelope.body, envelope.status);
      }

      const payload = envelope.body.payload as Record<string, unknown>;
      const chapterId =
        typeof payload.chapterId === "string" ? payload.chapterId : undefined;

      const fingerprint = fingerprintSubmitDecisionBody({
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: envelope.body.expectedAggregateVersion,
        payload,
        simulationRunId: envelope.pathRunId,
      });
      if (
        deps.fingerprints.rememberOrConflict(
          auth.session.tenantId,
          envelope.idempotencyKey,
          fingerprint,
        ) === "conflict"
      ) {
        const mapped = httpError(
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "Idempotency-Key was reused with a different payload.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 409);
      }

      const services = deps.registry.get(auth.session.tenantId);
      const loaded = await services.lifecycleService.load(
        auth.session.actorId,
        asSimulationRunId(envelope.pathRunId),
      );
      if (!loaded.ok) {
        const mapped = mapCommandErrorToHttp(
          loaded.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 400 | 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const published = await deps.content.registry.getPublishedVersion(
        loaded.value.contentPackageVersionId,
      );
      const pkg =
        published?.package ??
        deps.content.registry.store.versions.get(
          loaded.value.contentPackageVersionId,
        )?.package;
      if (!pkg) {
        const mapped = httpError(
          422,
          "PROJECTION_CONTENT_UNAVAILABLE",
          "Pinned content package is unavailable for chapter completion.",
          requestId,
          correlationId,
        );
        return c.json({ error: mapped.body } satisfies ApiErrorResponse, 422);
      }

      const completed = await completeChapterFromContent(
        {
          lifecycle: services.lifecycleService,
          commands: services.applicationService,
          clock: deps.clock,
        },
        {
          actorId: auth.session.actorId,
          simulationRunId: envelope.pathRunId,
          correlationId,
          package: pkg,
          commandId: String(envelope.body.commandId),
          expectedAggregateVersion: envelope.ifMatchVersion,
          ...(chapterId !== undefined ? { chapterId } : {}),
        },
      );

      if (!completed.ok) {
        const mapped = mapCommandErrorToHttp(
          completed.error,
          requestId,
          correlationId,
        );
        return c.json(
          { error: mapped.body } satisfies ApiErrorResponse,
          mapped.status as 400 | 401 | 403 | 404 | 409 | 412 | 422 | 500,
        );
      }

      const response: ApiSuccessResponse<{
        commandId: string;
        status: "accepted";
        aggregateVersion: number;
        simulationRunId: string;
        correlationId: string;
        chapterId: string;
        nextChapterId: string | null;
        endingNotificationId: string | null;
        finalEndingOutcomeId: string | null;
        runStatus: string;
        nextChapterInitialized: boolean;
      }> = {
        data: {
          commandId: String(envelope.body.commandId),
          status: "accepted",
          aggregateVersion: completed.value.aggregateVersion,
          simulationRunId: completed.value.simulationRunId,
          correlationId,
          chapterId: completed.value.chapterId,
          nextChapterId: completed.value.nextChapterId,
          endingNotificationId: completed.value.endingNotificationId,
          finalEndingOutcomeId: completed.value.finalEndingOutcomeId,
          runStatus: completed.value.runStatus,
          nextChapterInitialized: completed.value.nextChapterInitialized,
        },
        meta: { requestId, correlationId, apiVersion: API_VERSION },
      };
      return c.json(response, 200);
    },
  );
};
