-- =============================================================================
-- Body measurements — add circumference columns
-- =============================================================================
-- AthleteDetail's "Registra Misurazione" dialog collects 5 fields: weight,
-- waist, chest, thigh, arm. The schema previously only stored `weight_kg`,
-- `body_fat_percentage` and `muscle_mass_kg`, so the 4 circumferences were
-- discarded silently. This migration adds them as nullable NUMERIC columns
-- so existing rows keep working and the dialog can save the full payload.
-- =============================================================================

ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS waist_cm NUMERIC(5,1) CHECK (waist_cm IS NULL OR waist_cm > 0),
  ADD COLUMN IF NOT EXISTS chest_cm NUMERIC(5,1) CHECK (chest_cm IS NULL OR chest_cm > 0),
  ADD COLUMN IF NOT EXISTS thigh_cm NUMERIC(5,1) CHECK (thigh_cm IS NULL OR thigh_cm > 0),
  ADD COLUMN IF NOT EXISTS arm_cm   NUMERIC(5,1) CHECK (arm_cm   IS NULL OR arm_cm   > 0);

COMMENT ON COLUMN public.body_measurements.waist_cm IS 'Waist circumference in centimetres.';
COMMENT ON COLUMN public.body_measurements.chest_cm IS 'Chest circumference in centimetres.';
COMMENT ON COLUMN public.body_measurements.thigh_cm IS 'Thigh (dominant leg) circumference in centimetres.';
COMMENT ON COLUMN public.body_measurements.arm_cm   IS 'Upper arm (dominant) circumference in centimetres.';
