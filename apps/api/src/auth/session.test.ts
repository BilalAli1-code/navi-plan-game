import { describe, expect, it } from "vitest";
import {
  createAuthResolver,
  createDevAccessToken,
  createTestSupabaseAccessToken,
} from "./session";

describe("createAuthResolver", () => {
  const jwtSecret = "test-supabase-jwt-secret";

  it("verifies signed Supabase access tokens and maps sub/tenant claims", async () => {
    const resolveAuth = createAuthResolver({
      supabaseJwtSecret: jwtSecret,
      allowDevAuth: false,
    });
    const token = await createTestSupabaseAccessToken({
      jwtSecret,
      actorId: "user_123",
      tenantId: "tenant_abc",
    });
    const result = await resolveAuth(`Bearer ${token}`);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.session.actorId).toBe("user_123");
    expect(result.session.tenantId).toBe("tenant_abc");
    expect(result.session.sessionId).toBe("sess_test_1");
  });

  it("rejects service-role tokens", async () => {
    const resolveAuth = createAuthResolver({
      supabaseJwtSecret: jwtSecret,
      allowDevAuth: false,
    });
    const token = await createTestSupabaseAccessToken({
      jwtSecret,
      actorId: "svc",
      tenantId: "tenant_abc",
      role: "service_role",
    });
    const result = await resolveAuth(`Bearer ${token}`);
    expect(result.ok).toBe(false);
  });

  it("rejects unsigned or tampered JWTs", async () => {
    const resolveAuth = createAuthResolver({
      supabaseJwtSecret: jwtSecret,
      allowDevAuth: false,
    });
    const token = await createTestSupabaseAccessToken({
      jwtSecret: "other-secret",
      actorId: "user_123",
      tenantId: "tenant_abc",
    });
    const result = await resolveAuth(`Bearer ${token}`);
    expect(result.ok).toBe(false);
  });

  it("rejects missing tenant claims", async () => {
    const { SignJWT } = await import("jose");
    const token = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(jwtSecret));
    const resolveAuth = createAuthResolver({
      supabaseJwtSecret: jwtSecret,
      allowDevAuth: false,
    });
    const result = await resolveAuth(`Bearer ${token}`);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.message).toMatch(/tenant/i);
  });

  it("accepts dev tokens only when explicitly enabled", async () => {
    const disabled = createAuthResolver({
      supabaseJwtSecret: jwtSecret,
      allowDevAuth: false,
    });
    const enabled = createAuthResolver({ allowDevAuth: true });
    const token = createDevAccessToken({
      actorId: "actor_1",
      tenantId: "tenant_local",
    });
    expect((await disabled(`Bearer ${token}`)).ok).toBe(false);
    expect((await enabled(`Bearer ${token}`)).ok).toBe(true);
  });
});
