import { SignJWT } from "jose";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { E2E_JWT_SECRET } from "./env";

export interface E2eIdentity {
  readonly actorId: string;
  readonly tenantId: string;
  readonly learnerId: string;
  readonly simulationRunId: string;
}

export const createE2eAccessToken = async (input: {
  readonly actorId: string;
  readonly tenantId: string;
  readonly expiresInSeconds?: number;
}): Promise<string> =>
  new SignJWT({
    role: "authenticated",
    app_metadata: { tenant_id: input.tenantId },
    session_id: `sess_e2e_${input.actorId}`,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.actorId)
    .setIssuedAt()
    .setExpirationTime(`${input.expiresInSeconds ?? 3600}s`)
    .sign(new TextEncoder().encode(E2E_JWT_SECRET));

declare global {
  interface Window {
    __PROJECTSIM_E2E_AUTH__?: {
      setSession: (input: {
        readonly actorId: string;
        readonly tenantId: string;
        readonly accessToken: string;
        readonly authSource?: "supabase" | "dev";
      }) => void;
      clearSession: () => void;
    };
  }
}

export const authenticateBrowserPage = async (
  page: Page,
  input: {
    readonly actorId: string;
    readonly tenantId: string;
    readonly accessToken: string;
  },
): Promise<void> => {
  await page.waitForFunction(
    () => Boolean(window.__PROJECTSIM_E2E_AUTH__),
    null,
    {
      timeout: 15_000,
    },
  );
  await page.evaluate((session) => {
    const hook = window.__PROJECTSIM_E2E_AUTH__;
    if (!hook) {
      throw new Error("E2E auth hook is not available on window.");
    }
    hook.setSession({
      actorId: session.actorId,
      tenantId: session.tenantId,
      accessToken: session.accessToken,
      authSource: "supabase",
    });
  }, input);
};

export const clearBrowserAuth = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    window.__PROJECTSIM_E2E_AUTH__?.clearSession();
  });
};

export const createAuthenticatedContext = async (
  browser: Browser,
  input: {
    readonly actorId: string;
    readonly tenantId: string;
    readonly accessToken: string;
    readonly baseURL: string;
  },
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext({ baseURL: input.baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await authenticateBrowserPage(page, input);
  return { context, page };
};

export const uniqueIdentity = (prefix: string): E2eIdentity => {
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    actorId: `${prefix}_actor_${suffix}`,
    tenantId: `${prefix}_tenant_${suffix}`,
    learnerId: `${prefix}_learner_${suffix}`,
    simulationRunId: `${prefix}_run_${suffix}`,
  };
};
