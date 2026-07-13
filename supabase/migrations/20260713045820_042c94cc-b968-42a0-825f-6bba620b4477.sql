
-- 1) Extend simulation_runs
ALTER TABLE public.simulation_runs
  ADD COLUMN IF NOT EXISTS total_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS estimated_total_minutes INTEGER NOT NULL DEFAULT 420,
  ADD COLUMN IF NOT EXISTS completed_minutes INTEGER NOT NULL DEFAULT 0;

-- Ensure current_day starts at 1 for new runs
ALTER TABLE public.simulation_runs ALTER COLUMN current_day SET DEFAULT 1;

-- 2) daily_progress
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 14),
  day_title TEXT,
  project_phase TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  completed_minutes INTEGER NOT NULL DEFAULT 0,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','available','in_progress','completed')),
  briefing_completed BOOLEAN NOT NULL DEFAULT false,
  learning_completed BOOLEAN NOT NULL DEFAULT false,
  workplace_activities_completed BOOLEAN NOT NULL DEFAULT false,
  decisions_completed BOOLEAN NOT NULL DEFAULT false,
  practice_completed BOOLEAN NOT NULL DEFAULT false,
  reflection_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_progress TO authenticated;
GRANT ALL ON public.daily_progress TO service_role;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily_progress select" ON public.daily_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own daily_progress insert" ON public.daily_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily_progress update" ON public.daily_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily_progress delete" ON public.daily_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS daily_progress_run_idx ON public.daily_progress (run_id, day_number);
CREATE TRIGGER daily_progress_set_updated_at BEFORE UPDATE ON public.daily_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) daily_reflections
CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 14),
  what_went_well TEXT,
  what_was_challenging TEXT,
  what_would_change TEXT,
  key_learning TEXT,
  mentor_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reflections TO authenticated;
GRANT ALL ON public.daily_reflections TO service_role;
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily_reflections select" ON public.daily_reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own daily_reflections insert" ON public.daily_reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily_reflections update" ON public.daily_reflections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own daily_reflections delete" ON public.daily_reflections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER daily_reflections_set_updated_at BEFORE UPDATE ON public.daily_reflections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Extend learner_mastery
ALTER TABLE public.learner_mastery
  ADD COLUMN IF NOT EXISTS pmbok_principle TEXT;
