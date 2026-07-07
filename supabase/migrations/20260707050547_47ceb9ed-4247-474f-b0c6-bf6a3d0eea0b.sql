
CREATE TABLE public.exam_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  mode TEXT NOT NULL DEFAULT 'full',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  overall_percent INTEGER NOT NULL DEFAULT 0,
  readiness TEXT NOT NULL DEFAULT 'Not Ready',
  pass_probability INTEGER NOT NULL DEFAULT 0,
  duration_taken_ms BIGINT NOT NULL DEFAULT 0,
  avg_time_per_question_ms BIGINT NOT NULL DEFAULT 0,
  avg_confidence NUMERIC NOT NULL DEFAULT 0,
  domain_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_area_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  strongest_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  weakest_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  too_fast_count INTEGER NOT NULL DEFAULT 0,
  too_slow_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_reports TO authenticated;
GRANT ALL ON public.exam_reports TO service_role;

ALTER TABLE public.exam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own exam reports all"
  ON public.exam_reports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX exam_reports_user_completed_idx
  ON public.exam_reports (user_id, completed_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_exam_reports_updated_at
BEFORE UPDATE ON public.exam_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
