ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processing_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_state IN ('pending','completed','failed')),
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;