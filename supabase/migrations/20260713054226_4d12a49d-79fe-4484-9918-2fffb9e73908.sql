ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.practice_sessions.metadata IS
  'Adaptive selection metadata: intent, mix ratios, per-question selection reason, mastery topic and source, exposure controls. Stored for analytics; not surfaced verbatim to learners.';