import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  asActorId,
  asTenantId,
  type ActorId,
  type TenantId,
} from "@projectsim/domain";

/**
 * Authenticated session extracted from the request.
 *
 * Tenant comes from verified token claims — never from a client-supplied
 * tenant header. Dev tokens are for explicit local/test auth only.
 */
export interface AuthSession {
  readonly actorId: ActorId;
  readonly tenantId: TenantId;
  readonly accessToken: string;
  readonly sessionId: string | null;
}

export type AuthResult =
  | { readonly ok: true; readonly session: AuthSession }
  | {
      readonly ok: false;
      readonly code: "UNAUTHENTICATED";
      readonly message: string;
    };

export interface AuthResolverOptions {
  /** Verify Supabase user access tokens (HS256 JWT secret and/or JWKS). */
  readonly supabaseJwtSecret?: string | null;
  readonly supabaseUrl?: string | null;
  /** When true, accept unsigned `dev.*` tokens for local/tests only. */
  readonly allowDevAuth?: boolean;
}

export type AuthResolver = (
  authorizationHeader: string | undefined,
) => Promise<AuthResult>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readTenantId = (payload: JWTPayload): string | null => {
  if (typeof payload.tenant_id === "string" && payload.tenant_id.trim()) {
    return payload.tenant_id.trim();
  }
  if (isRecord(payload.app_metadata)) {
    const fromApp = payload.app_metadata.tenant_id;
    if (typeof fromApp === "string" && fromApp.trim()) {
      return fromApp.trim();
    }
  }
  if (isRecord(payload.user_metadata)) {
    const fromUser = payload.user_metadata.tenant_id;
    if (typeof fromUser === "string" && fromUser.trim()) {
      return fromUser.trim();
    }
  }
  return null;
};

const rejectServiceRole = (
  token: string,
  payload?: JWTPayload,
): AuthResult | null => {
  if (token.includes("service_role") || token.includes("service-role")) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Service-role credentials are not permitted for this API.",
    };
  }
  if (payload?.role === "service_role") {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Service-role credentials are not permitted for this API.",
    };
  }
  return null;
};

const resolveDevToken = (token: string): AuthResult => {
  try {
    const raw = Buffer.from(token.slice(4), "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as {
      actorId?: unknown;
      tenantId?: unknown;
    };
    if (
      typeof parsed.actorId !== "string" ||
      parsed.actorId.trim().length === 0 ||
      typeof parsed.tenantId !== "string" ||
      parsed.tenantId.trim().length === 0
    ) {
      return {
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Dev token claims are incomplete.",
      };
    }
    return {
      ok: true,
      session: {
        actorId: asActorId(parsed.actorId),
        tenantId: asTenantId(parsed.tenantId),
        accessToken: token,
        sessionId: null,
      },
    };
  } catch {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Dev token could not be parsed.",
    };
  }
};

/**
 * Create an auth resolver that verifies Supabase access tokens and optionally
 * accepts explicit local `dev.*` tokens.
 */
export const createAuthResolver = (
  options: AuthResolverOptions = {},
): AuthResolver => {
  const allowDevAuth = options.allowDevAuth === true;
  const jwtSecret = options.supabaseJwtSecret?.trim() || null;
  const supabaseUrl = options.supabaseUrl?.trim() || null;

  const jwks =
    supabaseUrl !== null
      ? createRemoteJWKSet(
          new URL(
            `${supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`,
          ),
        )
      : null;

  return async (authorizationHeader) => {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return {
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Missing or invalid Authorization bearer token.",
      };
    }
    const token = authorizationHeader.slice("Bearer ".length).trim();
    if (token.length === 0) {
      return {
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Missing or invalid Authorization bearer token.",
      };
    }

    const serviceRole = rejectServiceRole(token);
    if (serviceRole) {
      return serviceRole;
    }

    if (token.startsWith("dev.")) {
      if (!allowDevAuth) {
        return {
          ok: false,
          code: "UNAUTHENTICATED",
          message: "Dev access tokens are disabled for this API process.",
        };
      }
      return resolveDevToken(token);
    }

    if (!jwtSecret && !jwks) {
      return {
        ok: false,
        code: "UNAUTHENTICATED",
        message:
          "Supabase token verification is not configured for this API process.",
      };
    }

    try {
      let payload: JWTPayload | null = null;
      if (jwtSecret) {
        const verified = await jwtVerify(
          token,
          new TextEncoder().encode(jwtSecret),
          { algorithms: ["HS256"] },
        );
        payload = verified.payload;
      } else if (jwks) {
        const verified = await jwtVerify(token, jwks);
        payload = verified.payload;
      }

      if (!payload) {
        return {
          ok: false,
          code: "UNAUTHENTICATED",
          message: "Access token could not be verified.",
        };
      }

      const roleReject = rejectServiceRole(token, payload);
      if (roleReject) {
        return roleReject;
      }

      if (typeof payload.sub !== "string" || payload.sub.trim().length === 0) {
        return {
          ok: false,
          code: "UNAUTHENTICATED",
          message: "Access token subject is missing.",
        };
      }

      const tenantId = readTenantId(payload);
      if (!tenantId) {
        return {
          ok: false,
          code: "UNAUTHENTICATED",
          message:
            "Access token is missing tenant membership claim (tenant_id / app_metadata.tenant_id).",
        };
      }

      const sessionId =
        typeof payload.session_id === "string"
          ? payload.session_id
          : typeof payload.sid === "string"
            ? payload.sid
            : null;

      return {
        ok: true,
        session: {
          actorId: asActorId(payload.sub),
          tenantId: asTenantId(tenantId),
          accessToken: token,
          sessionId,
        },
      };
    } catch {
      return {
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Access token signature or claims are invalid.",
      };
    }
  };
};

/** @deprecated Prefer createAuthResolver — sync helper kept for simple unit fixtures. */
export const resolveAuthSession = (
  authorizationHeader: string | undefined,
  options: AuthResolverOptions = { allowDevAuth: true },
): AuthResult => {
  // Synchronous path supports only explicit local/dev tokens.
  if (!options.allowDevAuth) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Synchronous auth helper only supports enabled dev tokens.",
    };
  }
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Missing or invalid Authorization bearer token.",
    };
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token.startsWith("dev.")) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Synchronous auth helper only supports enabled dev tokens.",
    };
  }
  return resolveDevToken(token);
};

export const createDevAccessToken = (input: {
  readonly actorId: string;
  readonly tenantId: string;
}): string =>
  `dev.${Buffer.from(
    JSON.stringify({ actorId: input.actorId, tenantId: input.tenantId }),
    "utf8",
  ).toString("base64url")}`;

/** Sign a Supabase-shaped HS256 access token for tests. */
export const createTestSupabaseAccessToken = async (input: {
  readonly jwtSecret: string;
  readonly actorId: string;
  readonly tenantId: string;
  readonly role?: string;
  readonly expiresInSeconds?: number;
}): Promise<string> => {
  const { SignJWT } = await import("jose");
  return new SignJWT({
    role: input.role ?? "authenticated",
    app_metadata: { tenant_id: input.tenantId },
    session_id: "sess_test_1",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.actorId)
    .setIssuedAt()
    .setExpirationTime(`${input.expiresInSeconds ?? 3600}s`)
    .sign(new TextEncoder().encode(input.jwtSecret));
};
