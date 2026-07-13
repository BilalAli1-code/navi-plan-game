CREATE TABLE public.simulation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.simulation_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  section_number integer,
  action_type text NOT NULL CHECK (action_type IN ('stakeholder_interaction','risk_response','conflict_management')),
  action_key text NOT NULL,
  subject_id text,
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metric_impacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  mastery_impacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  pmbok_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  eco_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, action_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_actions TO authenticated;
GRANT ALL ON public.simulation_actions TO service_role;

ALTER TABLE public.simulation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own actions - select" ON public.simulation_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own actions - insert" ON public.simulation_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own actions - update" ON public.simulation_actions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own actions - delete" ON public.simulation_actions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX simulation_actions_run_idx ON public.simulation_actions (run_id, created_at);
CREATE INDEX simulation_actions_type_idx ON public.simulation_actions (run_id, action_type);