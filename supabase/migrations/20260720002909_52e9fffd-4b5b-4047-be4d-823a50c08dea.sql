ALTER TABLE public.simulation_runs
  ADD COLUMN IF NOT EXISTS in_world_date TEXT,
  ADD COLUMN IF NOT EXISTS chapter_state JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.simulation_runs.in_world_date IS
  'Blueprint §8.3 in-world project time label for current chapter (e.g. "Project week 6").';
COMMENT ON COLUMN public.simulation_runs.chapter_state IS
  'Blueprint §7.2 chapter contract state (per-chapter flags: outputs, decisions, gates, cliffhanger seen).';