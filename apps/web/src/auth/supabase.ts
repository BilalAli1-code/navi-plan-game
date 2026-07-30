import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client using the anon key only.
 * Never instantiate with the service-role key in apps/web.
 */
export const createBrowserSupabaseClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const readTenantIdFromAccessToken = (
  accessToken: string,
): string | null => {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(
      atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    ) as {
      tenant_id?: unknown;
      app_metadata?: { tenant_id?: unknown };
      user_metadata?: { tenant_id?: unknown };
    };
    if (typeof payload.tenant_id === "string" && payload.tenant_id.trim()) {
      return payload.tenant_id.trim();
    }
    if (
      typeof payload.app_metadata?.tenant_id === "string" &&
      payload.app_metadata.tenant_id.trim()
    ) {
      return payload.app_metadata.tenant_id.trim();
    }
    if (
      typeof payload.user_metadata?.tenant_id === "string" &&
      payload.user_metadata.tenant_id.trim()
    ) {
      return payload.user_metadata.tenant_id.trim();
    }
    return null;
  } catch {
    return null;
  }
};
