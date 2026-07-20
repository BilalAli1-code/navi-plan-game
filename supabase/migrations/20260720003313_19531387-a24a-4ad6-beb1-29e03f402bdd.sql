
-- Stakeholder relationships (per-run, per-stakeholder)
CREATE TABLE IF NOT EXISTS public.stakeholder_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  stakeholder_id TEXT NOT NULL,
  trust INTEGER NOT NULL DEFAULT 60,          -- 0..100
  sentiment TEXT NOT NULL DEFAULT 'neutral',  -- supportive/neutral/skeptical/hostile
  engagement TEXT NOT NULL DEFAULT 'informed',-- lead/manage/keep_satisfied/informed
  last_interaction_at TIMESTAMPTZ,
  last_interaction_summary TEXT,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, stakeholder_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stakeholder_relationships TO authenticated;
GRANT ALL ON public.stakeholder_relationships TO service_role;
ALTER TABLE public.stakeholder_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own run relationships"
  ON public.stakeholder_relationships
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE TRIGGER stakeholder_relationships_updated_at
  BEFORE UPDATE ON public.stakeholder_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Stakeholder commitments (promises made by the learner)
CREATE TABLE IF NOT EXISTS public.stakeholder_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  stakeholder_id TEXT NOT NULL,
  chapter INTEGER,
  description TEXT NOT NULL,
  due_in_world TEXT,           -- e.g. "Project week 3"
  status TEXT NOT NULL DEFAULT 'open',  -- open/kept/broken/waived
  resolution_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stakeholder_commitments_run_stakeholder_idx
  ON public.stakeholder_commitments(run_id, stakeholder_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stakeholder_commitments TO authenticated;
GRANT ALL ON public.stakeholder_commitments TO service_role;
ALTER TABLE public.stakeholder_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own run commitments"
  ON public.stakeholder_commitments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE TRIGGER stakeholder_commitments_updated_at
  BEFORE UPDATE ON public.stakeholder_commitments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Stakeholder memories (short recall snippets)
CREATE TABLE IF NOT EXISTS public.stakeholder_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  stakeholder_id TEXT NOT NULL,
  chapter INTEGER,
  kind TEXT NOT NULL,          -- interaction/decision/commitment/observation
  summary TEXT NOT NULL,       -- <= ~280 chars, used verbatim in prompts
  sentiment TEXT,              -- positive/neutral/negative
  weight INTEGER NOT NULL DEFAULT 1,  -- for recency ranking
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stakeholder_memories_run_stakeholder_idx
  ON public.stakeholder_memories(run_id, stakeholder_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stakeholder_memories TO authenticated;
GRANT ALL ON public.stakeholder_memories TO service_role;
ALTER TABLE public.stakeholder_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own run memories"
  ON public.stakeholder_memories
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));


-- Per-chapter scoring split (communication vs decision vs stakeholder)
CREATE TABLE IF NOT EXISTS public.simulation_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  communication_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  decision_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  stakeholder_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, chapter)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_scores TO authenticated;
GRANT ALL ON public.simulation_scores TO service_role;
ALTER TABLE public.simulation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own run scores"
  ON public.simulation_scores
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulation_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE TRIGGER simulation_scores_updated_at
  BEFORE UPDATE ON public.simulation_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
