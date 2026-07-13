-- Replace legacy simulation_runs with authenticated cloud persistence for ProjectSim.
DROP TABLE IF EXISTS public.simulation_runs CASCADE;

CREATE TABLE public.simulation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('not_started','active','paused','completed','abandoned')),
  selected_delivery_approach TEXT,
  current_phase TEXT NOT NULL DEFAULT 'Tailoring',
  current_week INTEGER NOT NULL DEFAULT 0,
  current_day INTEGER NOT NULL DEFAULT 0,
  project_health INTEGER NOT NULL DEFAULT 75,
  budget_score INTEGER NOT NULL DEFAULT 80,
  schedule_score INTEGER NOT NULL DEFAULT 80,
  risk_score INTEGER NOT NULL DEFAULT 65,
  quality_score INTEGER NOT NULL DEFAULT 75,
  team_morale INTEGER NOT NULL DEFAULT 75,
  stakeholder_trust INTEGER NOT NULL DEFAULT 70,
  customer_satisfaction INTEGER NOT NULL DEFAULT 70,
  xp INTEGER NOT NULL DEFAULT 0,
  tailoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  state_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_runs TO authenticated;
GRANT ALL ON public.simulation_runs TO service_role;
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs select" ON public.simulation_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON public.simulation_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs update" ON public.simulation_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs delete" ON public.simulation_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX simulation_runs_user_case_idx ON public.simulation_runs (user_id, case_id, status);
CREATE TRIGGER simulation_runs_set_updated_at BEFORE UPDATE ON public.simulation_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.simulation_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_id TEXT NOT NULL,
  event_id TEXT,
  phase TEXT,
  week_number INTEGER,
  day_number INTEGER,
  selected_option_id TEXT,
  selected_option_text TEXT,
  reasoning TEXT,
  metric_impacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  mentor_feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, decision_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_decisions TO authenticated;
GRANT ALL ON public.simulation_decisions TO service_role;
ALTER TABLE public.simulation_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decisions select" ON public.simulation_decisions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own decisions insert" ON public.simulation_decisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own decisions update" ON public.simulation_decisions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own decisions delete" ON public.simulation_decisions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX simulation_decisions_run_idx ON public.simulation_decisions (run_id, created_at);

CREATE TABLE public.simulation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  event_type TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked','available','viewed','responded','expired')),
  scheduled_week INTEGER,
  scheduled_day INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, event_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_events TO authenticated;
GRANT ALL ON public.simulation_events TO service_role;
ALTER TABLE public.simulation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events select" ON public.simulation_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.simulation_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events update" ON public.simulation_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events delete" ON public.simulation_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX simulation_events_run_idx ON public.simulation_events (run_id, status);

CREATE TABLE public.learner_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pmbok_domain TEXT,
  eco_domain TEXT,
  topic TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  successful_decisions INTEGER NOT NULL DEFAULT 0,
  mastery_score NUMERIC NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_mastery TO authenticated;
GRANT ALL ON public.learner_mastery TO service_role;
ALTER TABLE public.learner_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mastery select" ON public.learner_mastery FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own mastery insert" ON public.learner_mastery FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mastery update" ON public.learner_mastery FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mastery delete" ON public.learner_mastery FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER learner_mastery_set_updated_at BEFORE UPDATE ON public.learner_mastery FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();