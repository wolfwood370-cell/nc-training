/**
 * src/hooks/useAthleteRiskAnalysis.ts
 * ---------------------------------------------------------------------------
 * React Query hook that fetches an athlete's most recent *completed* FMS
 * assessment and exposes a `checkExercise(exercise)` callback for the
 * Coach's program builder. The callback runs each candidate exercise
 * through the pure `fmsRiskEngine` and returns a structured traffic-light
 * verdict.
 *
 * Why a single hook (not separate query + util)?
 * ----------------------------------------------
 * The program-builder UI checks dozens of exercises per render (every
 * cell of every day of every week). Fetching the assessment in each
 * cell would either thrash the cache or pollute every component with
 * the same `useQuery` boilerplate. By exposing `checkExercise` as a
 * `useCallback` closed over the cached assessment, the consumer gets a
 * stable, sync-feeling function that internally relies on the React
 * Query cache for freshness.
 *
 * Cache integration
 * -----------------
 * - Query key: `['fms-assessments', athleteId, 'latest-completed']`.
 *   The `'fms-assessments', athleteId` prefix is identical to the
 *   invalidation key used by `useSaveAssessment`, so saving a new
 *   assessment automatically refetches us. The `'latest-completed'`
 *   suffix narrows further so a future "list all assessments" query
 *   on the same prefix can coexist without clobbering this one.
 * - `staleTime` is 5 minutes. FMS assessments are administered weekly
 *   at most; refetching on every focus would be wasteful.
 *
 * Schema notes
 * ------------
 * The `fms_assessments` table layout (see migration
 * 20260430115033_*_create_fms_assessments.sql) is denormalized: scalar
 * columns for list/sort views (`athlete_id`, `coach_id`,
 * `assessment_date`, `composite_total`, `is_complete`) plus a JSONB
 * `payload` containing the clinical document. We rebuild the canonical
 * `FmsAssessment` shape on read by merging the two — same approach
 * `useSaveAssessment` uses on the write path, in reverse.
 *
 * As of writing, `src/integrations/supabase/types.ts` has not yet been
 * regenerated to include the `fms_assessments` table, so we use the same
 * narrow `as never` cast pattern documented in `useSaveAssessment.ts`.
 * Once codegen catches up, the casts can be removed without changing the
 * public surface of this hook.
 */

import { useCallback } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  FmsAssessment,
  ClearingTestId,
  ClearingTestResult,
  FmsTestId,
  FmsTestResult,
  RedFlag,
} from "@/types/movement";
import {
  analyzeExerciseRisk,
  type ExerciseInfo,
  type ExerciseRiskAssessment,
} from "@/lib/math/fmsRiskEngine";

// ---------------------------------------------------------------------------
// DB row shape (local — until types.ts regen)
// ---------------------------------------------------------------------------

const ASSESSMENTS_TABLE = "fms_assessments" as const;

/**
 * The JSONB payload sub-shape — clinical fields only. The scalar
 * columns ride alongside this on the row. Mirrors the type in
 * `useSaveAssessment.ts` (kept private to avoid a circular import).
 */
type FmsAssessmentPayload = Pick<
  FmsAssessment,
  "tests" | "clearingTests" | "redFlags" | "generalNotes"
>;

/**
 * Local mirror of the `fms_assessments` row shape returned by
 * `SELECT *`. Keep this aligned with the SQL migration; if the DB
 * grows columns we don't read here, leaving them off this interface
 * is fine — we just won't see them.
 */
interface FmsAssessmentRow {
  id: string;
  athlete_id: string;
  coach_id: string;
  assessment_date: string; // ISO date (YYYY-MM-DD)
  composite_total: number | null;
  is_complete: boolean;
  payload: FmsAssessmentPayload;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Row → domain mapper
// ---------------------------------------------------------------------------

/**
 * Reconstruct the canonical `FmsAssessment` document from a raw DB row.
 * Inverse of the carving done by `useSaveAssessment.mutationFn`.
 *
 * Defensive against malformed JSONB: if `payload` is missing the
 * expected sub-objects we substitute empty maps so the engine still
 * runs (and treats every test as "not scored").
 */
function rowToAssessment(row: FmsAssessmentRow): FmsAssessment {
  const payload = row.payload ?? ({} as Partial<FmsAssessmentPayload>);

  return {
    id: row.id,
    athleteId: row.athlete_id,
    coachId: row.coach_id,
    assessmentDate: row.assessment_date,
    tests: (payload.tests ?? {}) as Readonly<Record<FmsTestId, FmsTestResult>>,
    clearingTests: (payload.clearingTests ?? {}) as Readonly<
      Record<ClearingTestId, ClearingTestResult>
    >,
    redFlags: (payload.redFlags ?? []) as ReadonlyArray<RedFlag>,
    compositeTotal: row.composite_total,
    isComplete: row.is_complete,
    generalNotes: payload.generalNotes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Public hook surface
// ---------------------------------------------------------------------------

export interface UseAthleteRiskAnalysisOptions {
  /**
   * Disable the query (e.g. while the parent dialog is closed). Mirrors
   * the `enabled` pattern used by sibling hooks in this codebase.
   * Default: true (when `athleteId` is provided).
   */
  enabled?: boolean;
}

/**
 * Return type. Composes a React Query result for the assessment with a
 * stable `checkExercise` callback. The callback is safe to call before
 * the query resolves: it will return a "no assessment available" verdict
 * until data lands, which the engine treats as `low` risk with a
 * `unknown_assessment` reason.
 */
export interface UseAthleteRiskAnalysisResult extends Pick<
  UseQueryResult<FmsAssessment | null, Error>,
  "data" | "isLoading" | "isError" | "error" | "refetch"
> {
  /** The latest completed assessment, or `null` if none on file. */
  assessment: FmsAssessment | null;
  /**
   * Run an exercise through the risk engine against the cached
   * assessment. Pure projection — does not trigger I/O.
   */
  checkExercise: (exercise: ExerciseInfo) => ExerciseRiskAssessment;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetch the latest *completed* FMS assessment for `athleteId` and expose
 * a `checkExercise` callback that runs the cached assessment through
 * the pure risk engine.
 *
 * @example
 * ```tsx
 * const { assessment, isLoading, checkExercise } =
 *   useAthleteRiskAnalysis(athleteId);
 *
 * const verdict = checkExercise({
 *   name: 'Overhead Press',
 *   movementPattern: 'Vertical Push',
 *   targets: ['Shoulders'],
 * });
 *
 * if (verdict.riskLevel === 'high') showRedBadge(verdict.reasons[0]);
 * ```
 *
 * @param athleteId The UUID of the athlete whose assessment to check.
 *                  Pass `null`/`undefined` to disable the query.
 * @param options   Optional `enabled` override for the underlying query.
 */
export function useAthleteRiskAnalysis(
  athleteId: string | null | undefined,
  options: UseAthleteRiskAnalysisOptions = {},
): UseAthleteRiskAnalysisResult {
  const { enabled = true } = options;

  const query = useQuery<FmsAssessment | null, Error>({
    // Prefix matches the invalidation key in `useSaveAssessment` so a
    // newly saved assessment auto-refreshes this query. The
    // `'latest-completed'` suffix lets a future "list all assessments"
    // query share the prefix without conflicting.
    queryKey: ["fms-assessments", athleteId, "latest-completed"],

    queryFn: async (): Promise<FmsAssessment | null> => {
      if (!athleteId) return null;

      // Fetch the single most recent COMPLETED assessment. Two ordering
      // keys (assessment_date DESC, then updated_at DESC) so that
      // multiple assessments captured the same day fall back to the
      // most recently saved row — important on the gym floor where the
      // coach might re-open and resave a draft.
      //
      // The `as never` casts mirror the `useSaveAssessment` workaround
      // for the pre-codegen window; remove once
      // `src/integrations/supabase/types.ts` is regenerated.
      const { data, error } = await supabase
        .from(ASSESSMENTS_TABLE as never)
        .select("*")
        .eq("athlete_id" as never, athleteId as never)
        .eq("is_complete" as never, true as never)
        .order("assessment_date" as never, { ascending: false })
        .order("updated_at" as never, { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Re-throw so React Query surfaces a typed Error to consumers.
        throw new Error(`Failed to load latest FMS assessment: ${error.message}`);
      }

      const row = data as unknown as FmsAssessmentRow | null;
      return row ? rowToAssessment(row) : null;
    },

    // Only run when we actually have an athlete ID and the caller hasn't
    // disabled the hook.
    enabled: Boolean(athleteId) && enabled,

    // FMS assessments are administered weekly at most, so 5 minutes of
    // staleness is plenty. `gcTime` keeps the cache warm for half an
    // hour to support fast tab-switching in the program builder.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,

    // Network blips shouldn't block program editing; one retry is
    // sufficient and keeps the UI snappy.
    retry: 1,
  });

  const assessment = query.data ?? null;

  /**
   * Stable per-render callback. Memoized on `assessment` so dependency
   * arrays in consumer `useMemo`/`useEffect` calls don't churn when
   * unrelated parts of the query result change (loading flags, etc.).
   *
   * Pure: does not trigger network I/O; pulls strictly from the cached
   * assessment. Safe to call hundreds of times per render.
   */
  const checkExercise = useCallback(
    (exercise: ExerciseInfo): ExerciseRiskAssessment => analyzeExerciseRisk(exercise, assessment),
    [assessment],
  );

  return {
    // Re-expose the React Query primitives consumers commonly need.
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Domain-shaped accessors.
    assessment,
    checkExercise,
  };
}
