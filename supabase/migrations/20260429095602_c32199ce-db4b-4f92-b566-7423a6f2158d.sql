-- Add profiling columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS medical_clearance_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fms_exclusion_zones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS calibration_requirements text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS red_flags jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Allow athletes to insert coach_alerts targeting their own coach (onboarding red flags)
CREATE POLICY "Athletes can create alerts for their coach"
  ON public.coach_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    athlete_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.coach_id = coach_alerts.coach_id
    )
  );