-- Add optional meal tag column to nutrition_logs for hybrid timeline (real time + optional tag)
ALTER TABLE public.nutrition_logs
ADD COLUMN IF NOT EXISTS meal_tag text;

-- Constrain to known tag values (or null)
ALTER TABLE public.nutrition_logs
DROP CONSTRAINT IF EXISTS nutrition_logs_meal_tag_check;

ALTER TABLE public.nutrition_logs
ADD CONSTRAINT nutrition_logs_meal_tag_check
CHECK (meal_tag IS NULL OR meal_tag IN ('pre_workout','post_workout','snack','breakfast','lunch','dinner','other'));

-- Index for time-of-day pattern queries used by Smart Copy
CREATE INDEX IF NOT EXISTS nutrition_logs_athlete_logged_at_idx
ON public.nutrition_logs (athlete_id, logged_at DESC);