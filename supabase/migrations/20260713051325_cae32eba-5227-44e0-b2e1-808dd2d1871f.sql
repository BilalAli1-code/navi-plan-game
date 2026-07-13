
-- practice_sessions
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day_number int NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  total_questions int NOT NULL DEFAULT 0,
  correct_answers int NOT NULL DEFAULT 0,
  score int NOT NULL DEFAULT 0,
  estimated_minutes int NOT NULL DEFAULT 10,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX practice_sessions_run_day_idx ON public.practice_sessions(run_id, day_number);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT ALL ON public.practice_sessions TO service_role;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own practice sessions" ON public.practice_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER practice_sessions_touch BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- practice_attempts
CREATE TABLE public.practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_id text NOT NULL,
  selected_answer text,
  correct_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  reasoning text,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  pmbok_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  eco_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);
CREATE INDEX practice_attempts_session_idx ON public.practice_attempts(session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_attempts TO authenticated;
GRANT ALL ON public.practice_attempts TO service_role;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own practice attempts" ON public.practice_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- final_assessments
CREATE TABLE public.final_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_score int NOT NULL DEFAULT 0,
  readiness_level text NOT NULL DEFAULT 'developing',
  assessment_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  development_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_next_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_assessments TO authenticated;
GRANT ALL ON public.final_assessments TO service_role;
ALTER TABLE public.final_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own final assessments" ON public.final_assessments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER final_assessments_touch BEFORE UPDATE ON public.final_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
