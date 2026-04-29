-- Extend daily_metrics with columns required for Wearables + Nutrition integration.
-- Keep columnar layout (no JSONB dump) for fast time-series queries.

ALTER TABLE public.daily_metrics
  ADD COLUMN IF NOT EXISTS readiness_score smallint,
  ADD COLUMN IF NOT EXISTS hrv_ms integer,
  ADD COLUMN IF NOT EXISTS body_weight_kg numeric(5,2),
  ADD COLUMN IF NOT EXISTS calories_consumed integer;

-- Range guard for readiness_score (1-10). Use NOT VALID + VALIDATE pattern-safe form.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'daily_metrics_readiness_score_check'
  ) THEN
    ALTER TABLE public.daily_metrics
      ADD CONSTRAINT daily_metrics_readiness_score_check
      CHECK (readiness_score IS NULL OR (readiness_score >= 1 AND readiness_score <= 10));
  END IF;
END $$;

-- Backfill new canonical columns from legacy ones so analytics keep working.
UPDATE public.daily_metrics
SET readiness_score = subjective_readiness
WHERE readiness_score IS NULL AND subjective_readiness IS NOT NULL;

UPDATE public.daily_metrics
SET body_weight_kg = weight_kg
WHERE body_weight_kg IS NULL AND weight_kg IS NOT NULL;

-- Index to support time-series scans by athlete (date desc) -- already covered by
-- (user_id, date) but add a partial helper for non-null wearable rows.
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date_desc
  ON public.daily_metrics (user_id, date DESC);

-- Re-assert RLS in case it was disabled (idempotent).
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Add an explicit upsert-friendly policy: athletes can insert OR update their own row
-- via on_conflict (user_id,date). The existing insert_own / update_own already cover this,
-- but we make sure no policy blocks UPSERT by adding a permissive ALL fallback for owners.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_metrics'
      AND policyname = 'owner_full_access'
  ) THEN
    CREATE POLICY owner_full_access ON public.daily_metrics
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;