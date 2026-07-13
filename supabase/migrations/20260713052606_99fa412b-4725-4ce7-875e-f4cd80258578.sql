
-- learner_mastery: enrich with quality/consistency signals
ALTER TABLE public.learner_mastery
  ADD COLUMN IF NOT EXISTS competency text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS recent_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS consecutive_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_wrong integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_mastered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mastered_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_development_area boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS learner_mastery_user_score_idx
  ON public.learner_mastery(user_id, mastery_score DESC);

-- simulation_events: enrich with type/priority/mapping/lifecycle
ALTER TABLE public.simulation_events
  ADD COLUMN IF NOT EXISTS day_number integer,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS related_decision_id text,
  ADD COLUMN IF NOT EXISTS trigger_condition text,
  ADD COLUMN IF NOT EXISTS metric_effects jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pmbok_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS eco_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Widen the status check to cover 'completed' too
ALTER TABLE public.simulation_events
  DROP CONSTRAINT IF EXISTS simulation_events_status_check;
ALTER TABLE public.simulation_events
  ADD CONSTRAINT simulation_events_status_check
  CHECK (status = ANY (ARRAY['locked','available','viewed','responded','completed','expired']));

ALTER TABLE public.simulation_events
  DROP CONSTRAINT IF EXISTS simulation_events_priority_check;
ALTER TABLE public.simulation_events
  ADD CONSTRAINT simulation_events_priority_check
  CHECK (priority = ANY (ARRAY['low','normal','high','urgent']));

CREATE INDEX IF NOT EXISTS simulation_events_run_day_idx
  ON public.simulation_events(run_id, day_number);
CREATE INDEX IF NOT EXISTS simulation_events_run_type_idx
  ON public.simulation_events(run_id, event_type);

-- keep updated_at fresh
DROP TRIGGER IF EXISTS simulation_events_set_updated_at ON public.simulation_events;
CREATE TRIGGER simulation_events_set_updated_at
  BEFORE UPDATE ON public.simulation_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
