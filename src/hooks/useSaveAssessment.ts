/**
 * src/hooks/useSaveAssessment.ts
 * ---------------------------------------------------------------------------
 * React Query mutation hook for persisting a completed `FmsAssessment` to
 * the `fms_assessments` table in Supabase.
 *
 * Design rationale
 * ----------------
 * - One row per assessment. The full clinical document (per-test scores,
 *   clearing tests, red flags, notes) is stored as a JSONB `payload`. A
 *   handful of fields are denormalized into scalar columns
 *   (`athlete_id`, `coach_id`, `assessment_date`, `composite_total`,
 *   `is_complete`) so the coach dashboard can list/sort assessments
 *   without exploding the JSONB on every read.
 * - This mirrors the pattern used by `useSaveProgramBlock` / `program_blocks`.
 * - The hook is upsert-on-id: passing the same `id` twice updates the
 *   existing row. This supports the "save partial progress" workflow on
 *   the gym floor without creating duplicate rows.
 *
 * ===========================================================================
 * REQUIRED SQL MIGRATION
 * ===========================================================================
 * Run this BEFORE the UI builder enables the assessment flow. Filename
 * convention follows existing migrations:
 *   supabase/migrations/<timestamp>_create_fms_assessments.sql
 *
 * After the migration runs, regenerate `src/integrations/supabase/types.ts`
 * via `supabase gen types typescript`. Until that regeneration ships, this
 * hook uses a narrow local cast (see `ASSESSMENTS_TABLE`) so it compiles
 * against the current `Database` type.
 *
 * ```sql
 * -- =====================================================================
 * -- fms_assessments: clinical FMS screening records
 * -- =====================================================================
 * CREATE TABLE public.fms_assessments (
 *   id                UUID PRIMARY KEY,                -- client-generated
 *   athlete_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 *   coach_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 *
 *   assessment_date   DATE NOT NULL,                   -- date of administration
 *
 *   -- Denormalized for list/sort views (cheap to keep in sync):
 *   composite_total   SMALLINT CHECK (composite_total >= 0 AND composite_total <= 21),
 *   is_complete       BOOLEAN NOT NULL DEFAULT FALSE,
 *
 *   -- Full clinical document (FmsAssessment shape):
 *   --   { tests: {...}, clearingTests: {...}, redFlags: [...], generalNotes }
 *   payload           JSONB NOT NULL,
 *
 *   created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 *
 * -- Lookup patterns: "all assessments for athlete X, newest first" and
 * -- "all assessments authored by coach Y".
 * CREATE INDEX idx_fms_assessments_athlete_date
 *   ON public.fms_assessments(athlete_id, assessment_date DESC);
 * CREATE INDEX idx_fms_assessments_coach
 *   ON public.fms_assessments(coach_id);
 *
 * -- RLS: athlete can read their own; coach can read+write rows where they
 * -- are the coach of record. (Mirrors the policies on `injuries` and the
 * -- legacy `fms_tests` table.)
 * ALTER TABLE public.fms_assessments ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Athletes can view their own FMS assessments"
 *   ON public.fms_assessments FOR SELECT
 *   USING (athlete_id = auth.uid());
 *
 * CREATE POLICY "Coaches can view their athletes' FMS assessments"
 *   ON public.fms_assessments FOR SELECT
 *   USING (coach_id = auth.uid());
 *
 * CREATE POLICY "Coaches can insert FMS assessments for their athletes"
 *   ON public.fms_assessments FOR INSERT
 *   WITH CHECK (coach_id = auth.uid());
 *
 * CREATE POLICY "Coaches can update their FMS assessments"
 *   ON public.fms_assessments FOR UPDATE
 *   USING (coach_id = auth.uid())
 *   WITH CHECK (coach_id = auth.uid());
 *
 * CREATE POLICY "Coaches can delete their FMS assessments"
 *   ON public.fms_assessments FOR DELETE
 *   USING (coach_id = auth.uid());
 *
 * -- Auto-bump updated_at on UPDATE (function already exists in this DB).
 * CREATE TRIGGER update_fms_assessments_updated_at
 *   BEFORE UPDATE ON public.fms_assessments
 *   FOR EACH ROW
 *   EXECUTE FUNCTION public.update_updated_at_column();
 * ```
 * ===========================================================================
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FmsAssessment } from '@/types/movement';

// ---------------------------------------------------------------------------
// Public error model
// ---------------------------------------------------------------------------

/**
 * Categorized errors so the UI can route them appropriately (toast vs.
 * re-auth redirect vs. validation banner). Always thrown — never returned
 * — so React Query's `mutation.error` is well-typed.
 */
export type SaveAssessmentErrorCode =
  | 'UNAUTHENTICATED'
  | 'INVALID_PAYLOAD'
  | 'PERMISSION_DENIED'
  | 'NETWORK'
  | 'UNKNOWN';

export class SaveAssessmentError extends Error {
  readonly code: SaveAssessmentErrorCode;
  readonly cause?: unknown;
  constructor(code: SaveAssessmentErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SaveAssessmentError';
    this.code = code;
    this.cause = cause;
  }
}

export interface SaveAssessmentResult {
  id: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// DB row shape (local — until types.ts regen)
// ---------------------------------------------------------------------------

/**
 * Local mirror of the `fms_assessments` row. We declare it inline so the
 * hook compiles even before the Supabase types codegen is rerun. The
 * cast below uses `from(ASSESSMENTS_TABLE)` with `as never` to bypass
 * the strict `Database` table-name check — same trick used by
 * `useSaveProgramBlock` for its pre-codegen window.
 */
const ASSESSMENTS_TABLE = 'fms_assessments' as const;

interface FmsAssessmentRow {
  id: string;
  athlete_id: string;
  coach_id: string;
  assessment_date: string; // ISO date
  composite_total: number | null;
  is_complete: boolean;
  payload: FmsAssessmentPayload;
  created_at: string;
  updated_at: string;
}

/**
 * The JSONB sub-document. We keep this narrowly scoped — only the
 * clinical content, not the scalar columns (which are denormalized).
 */
type FmsAssessmentPayload = Pick<
  FmsAssessment,
  'tests' | 'clearingTests' | 'redFlags' | 'generalNotes'
>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Sanity-check the payload before round-tripping to the server. We're not
 * trying to re-implement the type system — just catch the obvious "you
 * forgot to start an assessment" / "the athlete id is empty" cases that
 * would otherwise produce inscrutable Postgres errors.
 */
function validateAssessment(a: FmsAssessment): void {
  if (!a.id) {
    throw new SaveAssessmentError('INVALID_PAYLOAD', 'Assessment is missing an id.');
  }
  if (!a.athleteId) {
    throw new SaveAssessmentError(
      'INVALID_PAYLOAD',
      'Assessment is missing athleteId.'
    );
  }
  if (!a.coachId) {
    throw new SaveAssessmentError(
      'INVALID_PAYLOAD',
      'Assessment is missing coachId.'
    );
  }
  if (!a.assessmentDate) {
    throw new SaveAssessmentError(
      'INVALID_PAYLOAD',
      'Assessment is missing assessmentDate.'
    );
  }
  if (!a.tests || Object.keys(a.tests).length === 0) {
    throw new SaveAssessmentError(
      'INVALID_PAYLOAD',
      'Assessment has no test results.'
    );
  }
}

/**
 * Map a low-level Supabase error to our typed error model. Postgres RLS
 * violations come back with code `42501`; auth-missing surfaces as a
 * 401-ish `PGRST301` or similar.
 */
function mapSupabaseError(err: { message: string; code?: string }): SaveAssessmentError {
  const msg = err.message ?? '';
  const code = err.code ?? '';

  if (code === '42501' || /permission|policy/i.test(msg)) {
    return new SaveAssessmentError(
      'PERMISSION_DENIED',
      "You don't have permission to save this assessment.",
      err
    );
  }
  if (/jwt|auth|session/i.test(msg)) {
    return new SaveAssessmentError(
      'UNAUTHENTICATED',
      'Your session has expired. Please sign in again.',
      err
    );
  }
  if (/network|fetch|timeout/i.test(msg)) {
    return new SaveAssessmentError('NETWORK', 'Network error while saving.', err);
  }
  return new SaveAssessmentError(
    'UNKNOWN',
    msg || 'Unknown error while saving the assessment.',
    err
  );
}

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

/**
 * Persist an `FmsAssessment` to Supabase via upsert (insert-or-update on
 * primary key `id`).
 *
 * Usage
 * -----
 * ```tsx
 * const { mutateAsync, isPending } = useSaveAssessment();
 *
 * async function handleSubmit() {
 *   const draft = useMovementStore.getState().serialize();
 *   if (!draft) return;
 *   try {
 *     await mutateAsync(draft);
 *     toast.success('Valutazione salvata');
 *     useMovementStore.getState().resetAssessment();
 *   } catch (e) {
 *     if (e instanceof SaveAssessmentError && e.code === 'UNAUTHENTICATED') {
 *       // redirect to login
 *     } else {
 *       toast.error('Errore nel salvataggio della valutazione');
 *     }
 *   }
 * }
 * ```
 *
 * Cache invalidation
 * ------------------
 * On success we invalidate any query that lists or summarizes
 * assessments for the affected athlete. Existing keys we know about:
 *   - ['fms-alerts', athleteId]            (useFmsAlerts)
 *   - ['athlete-health-profile', athleteId] (useAthleteHealthProfile)
 *   - ['fms-assessments', athleteId]       (future list hook)
 */
export function useSaveAssessment(): UseMutationResult<
  SaveAssessmentResult,
  SaveAssessmentError,
  FmsAssessment
> {
  const queryClient = useQueryClient();

  return useMutation<SaveAssessmentResult, SaveAssessmentError, FmsAssessment>({
    mutationKey: ['save-fms-assessment'],

    mutationFn: async (assessment) => {
      validateAssessment(assessment);

      // Carve up the assessment into row-scalar fields + JSONB payload.
      const payload: FmsAssessmentPayload = {
        tests: assessment.tests,
        clearingTests: assessment.clearingTests,
        redFlags: assessment.redFlags,
        generalNotes: assessment.generalNotes,
      };

      const row: Omit<FmsAssessmentRow, 'created_at' | 'updated_at'> = {
        id: assessment.id,
        athlete_id: assessment.athleteId,
        coach_id: assessment.coachId,
        assessment_date: assessment.assessmentDate,
        composite_total: assessment.compositeTotal,
        is_complete: assessment.isComplete,
        payload,
      };

      // `as never` bypasses the table-name check until codegen catches up.
      // Same workaround pattern as `useSaveProgramBlock`.
      const { data, error } = await supabase
        .from(ASSESSMENTS_TABLE as never)
        .upsert(row as never, { onConflict: 'id' })
        .select('id, updated_at')
        .single();

      if (error) throw mapSupabaseError(error);

      const result = data as unknown as { id: string; updated_at: string } | null;
      if (!result) {
        throw new SaveAssessmentError(
          'UNKNOWN',
          'Save returned no row — unexpected.'
        );
      }
      return result;
    },

    onSuccess: (_result, assessment) => {
      // Surface the new/updated assessment to all dependent queries.
      queryClient.invalidateQueries({
        queryKey: ['fms-alerts', assessment.athleteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['athlete-health-profile', assessment.athleteId],
      });
      queryClient.invalidateQueries({
        queryKey: ['fms-assessments', assessment.athleteId],
      });
    },
  });
}
