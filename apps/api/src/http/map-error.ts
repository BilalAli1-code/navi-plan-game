import type { CommandError } from "@projectsim/domain";
import type { ApiErrorBody, ApiFieldErrors } from "./envelopes";

export interface MappedHttpError {
  readonly status: number;
  readonly body: ApiErrorBody;
}

const fieldErrorsToMap = (
  fieldErrors: ReadonlyArray<{
    readonly path: string;
    readonly message: string;
  }>,
): ApiFieldErrors => {
  const map: Record<string, string[]> = {};
  for (const entry of fieldErrors) {
    const list = map[entry.path] ?? [];
    list.push(entry.message);
    map[entry.path] = list;
  }
  return map;
};

/** Map typed Application/Domain errors to safe HTTP responses. */
export const mapCommandErrorToHttp = (
  error: CommandError,
  requestId: string,
  correlationId: string,
): MappedHttpError => {
  const base = {
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    requestId,
    correlationId,
  };

  if (error.kind === "validation") {
    return {
      status: 400,
      body: {
        ...base,
        fieldErrors: fieldErrorsToMap(error.fieldErrors),
      },
    };
  }

  if (error.kind === "authorization") {
    return {
      status: error.code === "TENANT_ACCESS_DENIED" ? 403 : 403,
      body: base,
    };
  }

  if (error.kind === "concurrency") {
    return {
      status: 412,
      body: {
        ...base,
        details: {
          expectedVersion: error.expectedVersion,
          actualVersion: error.actualVersion,
        },
      },
    };
  }

  if (error.kind === "idempotency") {
    return { status: 409, body: base };
  }

  // rule_violation
  switch (error.code) {
    case "SIMULATION_RUN_NOT_FOUND":
    case "DECISION_DEFINITION_NOT_FOUND":
    case "DECISION_NOT_FOUND":
    case "PROJECTION_NOT_FOUND":
    case "PROJECTION_PROCESSING_TARGET_NOT_FOUND":
      return { status: 404, body: base };
    case "DECISION_ALREADY_SUBMITTED":
    case "DECISION_SOURCE_ACTION_DUPLICATE":
      return { status: 409, body: base };
    default:
      return { status: 422, body: base };
  }
};

export const httpError = (
  status: number,
  code: string,
  message: string,
  requestId: string,
  correlationId: string,
  options?: {
    readonly retryable?: boolean;
    readonly fieldErrors?: ApiFieldErrors;
    readonly details?: Readonly<Record<string, unknown>>;
  },
): MappedHttpError => ({
  status,
  body: {
    code,
    message,
    retryable: options?.retryable ?? false,
    requestId,
    correlationId,
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(options?.details ? { details: options.details } : {}),
  },
});
