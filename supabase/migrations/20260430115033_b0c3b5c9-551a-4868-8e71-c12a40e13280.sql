CREATE TABLE public.fms_assessments (
  id                UUID PRIMARY KEY,
  athlete_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_date   DATE NOT NULL,
  composite_total   SMALLINT CHECK (composite_total >= 0 AND composite_total <= 21),
  is_complete       BOOLEAN NOT NULL DEFAULT FALSE,
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fms_assessments_athlete_date
  ON public.fms_assessments(athlete_id, assessment_date DESC);
CREATE INDEX idx_fms_assessments_coach
  ON public.fms_assessments(coach_id);

ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their own FMS assessments"
  ON public.fms_assessments FOR SELECT
  USING (athlete_id = auth.uid());

CREATE POLICY "Coaches can view their athletes' FMS assessments"
  ON public.fms_assessments FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert FMS assessments for their athletes"
  ON public.fms_assessments FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their FMS assessments"
  ON public.fms_assessments FOR UPDATE
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their FMS assessments"
  ON public.fms_assessments FOR DELETE
  USING (coach_id = auth.uid());

CREATE TRIGGER update_fms_assessments_updated_at
  BEFORE UPDATE ON public.fms_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();