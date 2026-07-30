import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createBrowserSupabaseClient,
  readTenantIdFromAccessToken,
} from "./supabase";

export interface AuthSessionState {
  readonly actorId: string;
  readonly tenantId: string;
  readonly accessToken: string | null;
  readonly authSource: "none" | "supabase" | "dev";
  setSession: (input: {
    readonly actorId: string;
    readonly tenantId: string;
    readonly accessToken: string;
    readonly authSource?: "supabase" | "dev";
  }) => void;
  clearSession: () => void;
}

const AuthSessionContext = createContext<AuthSessionState | null>(null);

const E2E_AUTH_STORAGE_KEY = "projectsim.e2e.auth";

const readE2eStoredSession = (): {
  readonly actorId: string;
  readonly tenantId: string;
  readonly accessToken: string;
  readonly authSource: "supabase" | "dev";
} | null => {
  if (
    typeof window === "undefined" ||
    import.meta.env.VITE_ENABLE_E2E_AUTH_HOOK !== "1"
  ) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(E2E_AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as {
      actorId?: unknown;
      tenantId?: unknown;
      accessToken?: unknown;
      authSource?: unknown;
    };
    if (
      typeof parsed.actorId !== "string" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.accessToken !== "string"
    ) {
      return null;
    }
    return {
      actorId: parsed.actorId,
      tenantId: parsed.tenantId,
      accessToken: parsed.accessToken,
      authSource: parsed.authSource === "dev" ? "dev" : "supabase",
    };
  } catch {
    return null;
  }
};

/**
 * Session provider for Decision UI.
 * - Production: bridges Supabase Auth access tokens (anon client only).
 * - Local/dev: optional in-memory `dev.*` tokens when Vite DEV controls are used.
 * Never persists authoritative Decision/projection state in browser storage.
 * E2E-only: when VITE_ENABLE_E2E_AUTH_HOOK=1, test JWTs may be stored in
 * sessionStorage so Playwright navigations/reloads keep the authenticated context.
 */
export function AuthSessionProvider({
  children,
  initial,
}: {
  readonly children: ReactNode;
  readonly initial?: {
    readonly actorId: string;
    readonly tenantId: string;
    readonly accessToken: string;
    readonly authSource?: "supabase" | "dev";
  };
}) {
  const e2eStored = readE2eStoredSession();
  const seed = initial ?? e2eStored ?? undefined;
  const [actorId, setActorId] = useState(seed?.actorId ?? "");
  const [tenantId, setTenantId] = useState(seed?.tenantId ?? "");
  const [accessToken, setAccessToken] = useState<string | null>(
    seed?.accessToken ?? null,
  );
  const [authSource, setAuthSource] = useState<"none" | "supabase" | "dev">(
    seed?.authSource ?? (seed?.accessToken ? "dev" : "none"),
  );

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      return;
    }

    let cancelled = false;
    const applySession = (
      token: string | undefined,
      userId: string | undefined,
    ) => {
      if (cancelled) {
        return;
      }
      if (!token || !userId) {
        setActorId("");
        setTenantId("");
        setAccessToken(null);
        setAuthSource("none");
        return;
      }
      const claimTenant = readTenantIdFromAccessToken(token);
      setActorId(userId);
      setTenantId(claimTenant ?? "");
      setAccessToken(token);
      setAuthSource("supabase");
    };

    void supabase.auth.getSession().then(({ data }) => {
      applySession(data.session?.access_token, data.session?.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session?.access_token, session?.user.id);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthSessionState>(
    () => ({
      actorId,
      tenantId,
      accessToken,
      authSource,
      setSession: (input) => {
        setActorId(input.actorId);
        setTenantId(input.tenantId);
        setAccessToken(input.accessToken);
        setAuthSource(input.authSource ?? "dev");
        if (import.meta.env.VITE_ENABLE_E2E_AUTH_HOOK === "1") {
          window.sessionStorage.setItem(
            E2E_AUTH_STORAGE_KEY,
            JSON.stringify({
              actorId: input.actorId,
              tenantId: input.tenantId,
              accessToken: input.accessToken,
              authSource: input.authSource ?? "dev",
            }),
          );
        }
      },
      clearSession: () => {
        setActorId("");
        setTenantId("");
        setAccessToken(null);
        setAuthSource("none");
        if (import.meta.env.VITE_ENABLE_E2E_AUTH_HOOK === "1") {
          window.sessionStorage.removeItem(E2E_AUTH_STORAGE_KEY);
        }
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          void supabase.auth.signOut();
        }
      },
    }),
    [actorId, tenantId, accessToken, authSource],
  );

  /**
   * Opt-in browser auth hook for Playwright (PS-ROADMAP-008).
   * Enabled only when the web bundle is built with VITE_ENABLE_E2E_AUTH_HOOK=1.
   * Never exposes service-role credentials; tokens are supplied by the test harness.
   */
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_E2E_AUTH_HOOK !== "1") {
      return;
    }
    const api = {
      setSession: value.setSession,
      clearSession: value.clearSession,
    };
    (
      window as Window & {
        __PROJECTSIM_E2E_AUTH__?: typeof api;
      }
    ).__PROJECTSIM_E2E_AUTH__ = api;
    return () => {
      delete (
        window as Window & {
          __PROJECTSIM_E2E_AUTH__?: typeof api;
        }
      ).__PROJECTSIM_E2E_AUTH__;
    };
  }, [value.clearSession, value.setSession]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export const useAuthSession = (): AuthSessionState => {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession requires AuthSessionProvider");
  }
  return ctx;
};

/** Build a local/dev bearer token recognized by @projectsim/api when DEV auth is enabled. */
export const createDevBrowserToken = (input: {
  readonly actorId: string;
  readonly tenantId: string;
}): string => {
  const json = JSON.stringify({
    actorId: input.actorId,
    tenantId: input.tenantId,
  });
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `dev.${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
};
