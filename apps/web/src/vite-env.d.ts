/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Opt-in Playwright auth hook (PS-ROADMAP-008). Never enable in production deploys. */
  readonly VITE_ENABLE_E2E_AUTH_HOOK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
