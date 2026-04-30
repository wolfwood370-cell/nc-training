/**
 * Metabolic Engine Store — Phase 3 (Clinical Intersection)
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Cross-domain Zustand store that bridges the **Training Domain** (Volume
 * Load, ACWR, session strain) with the **Nutrition Domain** (caloric
 * boundary, macronutrient distribution, peri-workout fueling).
 *
 * ## Why a dedicated store
 *
 * The athlete's training load on any given day is a *causal driver* of
 * their nutritional needs — not a piece of UI state. Coupling this logic
 * to a React component would mean:
 *
 *   • Macro adjustments only run while a specific screen is mounted.
 *   • Two screens looking at the same athlete could disagree on the
 *     "correct" carb target.
 *   • Background sync (e.g. workout completion → macro update) becomes
 *     impossible without re-architecting.
 *
 * Putting the metabolic state in Zustand makes it the single source of
 * truth across the Coach Dashboard, Athlete PWA, and any background
 * adjusters that watch for high-load days.
 *
 * ## Clinical model: peri-workout carbohydrate adjustment
 *
 * On exceptionally high Volume Load days — what the periodization
 * literature calls **Functional Overreaching** (FOR) — the athlete's
 * physiology demands more carbohydrate, not because they "burned more
 * calories" (the EAT delta is real but modest, ~150–400 kcal) but because:
 *
 *   1. **Glycogen depletion is non-linear with volume.** Per Burke et al.
 *      (2017) IOC consensus, sessions exceeding ~90 minutes at moderate-
 *      to-high intensity can deplete muscle glycogen by 40–70%. Resynthesis
 *      requires 7–10 g·kg⁻¹·day⁻¹ of carbohydrate vs. the 4–7 g·kg⁻¹
 *      baseline for moderate training.
 *
 *   2. **Insulin sensitivity is elevated peri-workout.** The GLUT4
 *      translocation window is open for ~2–4 hours post-session, making
 *      this the metabolically optimal time to deliver high-glycemic
 *      carbohydrate. Carbs eaten *outside* this window on a non-training
 *      day produce a different physiological response than the same carbs
 *      eaten on a heavy training day.
 *
 *   3. **Cortisol/CNS recovery scales with substrate availability.**
 *      Chronic glycogen under-fueling on FOR days converts adaptive
 *      overreaching → non-functional overreaching → overtraining
 *      syndrome. The dose-response is well-characterized (Meeusen et al.,
 *      2013 ECSS/ACSM consensus).
 *
 * ## The "caloric boundary" rule
 *
 * The store's adjustment logic respects a **caloric boundary** — the
 * coach-set total calorie target for the current phase. Exceeding the
 * boundary on a Cut would defeat the deficit; falling short on a Surplus
 * would defeat the gain. Therefore:
 *
 *   • In **Cut** or **Maintain**: when carbs go up, fats come down so
 *     total calories stay within the boundary. Protein is ALWAYS held
 *     constant (it's the floor for muscle preservation, not a buffer).
 *
 *   • In **Surplus**: the boundary expands — carbs go up *additively*
 *     and total calories increase, because the goal is anabolic and
 *     more substrate serves it.
 *
 * Fat reduction has a hard floor of 0.6 g/kg bodyweight (estimated from
 * baseline) to protect endocrine function. If reducing fat would breach
 * that floor, the adjustment is *partial* — we add as much carb as the
 * fat budget allows, then stop. We never sacrifice essential fatty acid
 * intake to fuel a single training day.
 *
 * @module useMetabolicStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * The athlete's current macrocycle phase. Drives the directional logic
 * of every macro adjustment in this store.
 *
 * Aligned with the existing `StrategyType` used elsewhere in the app:
 *   • "cut"      — caloric deficit, weight-loss phase.
 *   • "maintain" — energy balance, body-recomposition or peaking phase.
 *   • "surplus"  — caloric surplus, muscle-gain phase.
 *
 * Note: legacy code uses "bulk" for surplus. The `SURPLUS_ALIASES` set
 * below accepts both forms so callers don't have to translate.
 */
export type MetabolicPhase = "cut" | "maintain" | "surplus";

/**
 * Daily macronutrient targets in absolute units.
 *
 * Energy invariant:  calories ≈ protein·4 + carbs·4 + fats·9
 * (small drift is tolerated, see `recomputeCalories` action).
 */
export interface MacroTargets {
  /** Total daily energy target, kcal. */
  calories: number;
  /** Protein, grams. ALWAYS the floor — never reduced by load adjustments. */
  protein: number;
  /** Carbohydrate, grams. The peri-workout lever. */
  carbs: number;
  /** Dietary fat, grams. The buffer that absorbs caloric-boundary trade-offs. */
  fats: number;
}

/**
 * Result of an `adjustMacrosForTrainingLoad` call. Returned for telemetry
 * and to allow UI to render before/after diffs and surface clinical
 * reasoning to the coach.
 */
export interface MacroAdjustmentResult {
  /** Whether a high-load adjustment was triggered. */
  applied: boolean;
  /** Why the adjustment was (or was not) applied. */
  reason: string;
  /** Macros before adjustment. */
  previous: MacroTargets;
  /** Macros after adjustment (equal to `previous` if `applied` is false). */
  next: MacroTargets;
  /** Volume Load that triggered the evaluation. */
  volumeLoad: number;
  /** Carbohydrate delta in grams (positive = added). */
  deltaCarbs: number;
  /** Fat delta in grams (negative = reduced). 0 in surplus phase. */
  deltaFats: number;
  /** Calorie delta. 0 in cut/maintain (boundary preserved); positive in surplus. */
  deltaCalories: number;
}

// ─── Clinical Constants ───────────────────────────────────────────────────

/**
 * Volume Load threshold above which we classify a session as Functional
 * Overreaching for the purpose of nutrient timing.
 *
 * Volume Load (Σ sets·reps·load, in kg) is athlete-specific in absolute
 * terms but the relative spike is what matters. We use 1.4× the chronic
 * average as the trigger, mirroring the upper bound of the ACWR "sweet
 * spot" (Gabbett, 2016) — above this the session is producing meaningful
 * supercompensation stimulus and warrants nutritional support.
 *
 * Callers that don't have a chronic baseline can pass an absolute
 * threshold via `setHighLoadThreshold`. The default 25,000 kg·reps is a
 * reasonable absolute upper-quartile cutoff for trained intermediate
 * lifters; coaches with elite athletes will want to raise it.
 */
export const DEFAULT_HIGH_LOAD_THRESHOLD = 25_000 as const;

/**
 * Carbohydrate up-adjustment magnitude (proportion of baseline carbs).
 *
 * The 15–20% range comes from sports-nutrition periodization guidance
 * (Jeukendrup, 2017). We default to 17.5% — the midpoint — and let
 * coaches tune via `setCarbAdjustmentPct`. Going above 20% on a single
 * day rarely improves performance and can blunt training adaptations
 * (the "train low, compete high" paradigm).
 */
export const DEFAULT_CARB_ADJUSTMENT_PCT = 0.175 as const;

/** Energy density of macronutrients, kcal/g. */
const KCAL_PER_G_PROTEIN = 4 as const;
const KCAL_PER_G_CARB = 4 as const;
const KCAL_PER_G_FAT = 9 as const;

/**
 * Hard floor for daily fat intake, grams.
 *
 * Below this, endocrine function (testosterone, oestrogen, leptin
 * signalling) is compromised. Conservative fixed floor used when a
 * per-kg estimate is unavailable.
 */
const ABSOLUTE_FAT_FLOOR_G = 40 as const;

/** Phase-string aliases accepted at the API boundary. */
const SURPLUS_ALIASES = new Set(["surplus", "bulk", "gain", "gainer"]);
const CUT_ALIASES = new Set(["cut", "deficit", "loss"]);
const MAINTAIN_ALIASES = new Set(["maintain", "maintenance", "recomp"]);

// ─── Helpers (pure) ───────────────────────────────────────────────────────

/**
 * Normalize a phase string from any of the app's vocabularies into the
 * canonical `MetabolicPhase` union. Defaults to "maintain" for unknown
 * inputs — the safest fallback (no directional adjustment bias).
 */
function normalizePhase(input: string): MetabolicPhase {
  const k = input.trim().toLowerCase();
  if (SURPLUS_ALIASES.has(k)) return "surplus";
  if (CUT_ALIASES.has(k)) return "cut";
  if (MAINTAIN_ALIASES.has(k)) return "maintain";
  return "maintain";
}

/**
 * Recompute total calories from macro grams. Used to keep the energy
 * invariant tight after any macro mutation.
 */
function caloriesFromMacros(m: Omit<MacroTargets, "calories">): number {
  return Math.round(
    m.protein * KCAL_PER_G_PROTEIN +
      m.carbs * KCAL_PER_G_CARB +
      m.fats * KCAL_PER_G_FAT,
  );
}

// ─── Store shape ──────────────────────────────────────────────────────────

interface MetabolicState {
  /** Empirically-derived TDEE from the adaptive engine. */
  baseTDEE: number;
  /** Current macrocycle phase. */
  currentPhase: MetabolicPhase;
  /** Daily macro targets for the current phase (pre-adjustment baseline). */
  baselineMacros: MacroTargets;
  /** Daily macro targets after any active training-load adjustment. */
  todayMacros: MacroTargets;
  /** Volume Load above which we trigger the FOR adjustment. */
  highLoadThreshold: number;
  /** Carb-up percentage (0.15–0.20 per clinical rule). */
  carbAdjustmentPct: number;
  /** Telemetry from the most recent adjustment, for UI/audit display. */
  lastAdjustment: MacroAdjustmentResult | null;
}

interface MetabolicActions {
  /** Set the empirically-derived TDEE (called from the adaptive TDEE hook). */
  setBaseTDEE: (tdee: number) => void;

  /** Switch the athlete's macrocycle phase. Resets `todayMacros` to baseline. */
  setPhase: (phase: MetabolicPhase | string) => void;

  /**
   * Replace the baseline macro targets (e.g. when the coach saves a new
   * nutrition plan). Also resets `todayMacros` to match.
   */
  setBaselineMacros: (macros: MacroTargets) => void;

  /** Tune the threshold above which carbs get up-adjusted. */
  setHighLoadThreshold: (threshold: number) => void;

  /** Tune the carb adjustment percentage (clamped to [0.15, 0.20]). */
  setCarbAdjustmentPct: (pct: number) => void;

  /**
   * **Core clinical action.** Evaluate a day's Volume Load against the
   * threshold. If the day qualifies as Functional Overreaching, mutate
   * `todayMacros` to:
   *
   *   • Increase carbs by `carbAdjustmentPct` of `baseCarbs`.
   *   • Hold protein constant.
   *   • If phase is `cut`/`maintain`: lower fats to keep total calories
   *     within the caloric boundary (capped by the fat floor).
   *   • If phase is `surplus`: hold fats constant and let total calories
   *     rise — the surplus *should* expand on hard training days.
   *
   * Idempotent across calls within the same session: calling it twice
   * with the same `volumeLoad` does NOT compound the adjustment.
   *
   * @param volumeLoad  The day's Volume Load (Σ sets·reps·load), kg·reps.
   * @param baseCarbs   The baseline carbohydrate target in grams. Passed
   *                    explicitly (not pulled from state) so coaches can
   *                    override with a phase-specific value at call time.
   */
  adjustMacrosForTrainingLoad: (
    volumeLoad: number,
    baseCarbs: number,
  ) => MacroAdjustmentResult;

  /** Revert `todayMacros` to baseline (e.g. on day rollover or rest day). */
  resetTodayMacros: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────

const initialBaselineMacros: MacroTargets = {
  calories: 2400,
  protein: 180,
  carbs: 260,
  fats: 75,
};

const initialState: MetabolicState = {
  baseTDEE: 2400,
  currentPhase: "maintain",
  baselineMacros: initialBaselineMacros,
  todayMacros: initialBaselineMacros,
  highLoadThreshold: DEFAULT_HIGH_LOAD_THRESHOLD,
  carbAdjustmentPct: DEFAULT_CARB_ADJUSTMENT_PCT,
  lastAdjustment: null,
};

// ─── Store ────────────────────────────────────────────────────────────────

export const useMetabolicStore = create<MetabolicState & MetabolicActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Setters ──────────────────────────────────────────────────────
      setBaseTDEE: (tdee) => {
        if (!Number.isFinite(tdee) || tdee <= 0) return;
        set({ baseTDEE: Math.round(tdee) });
      },

      setPhase: (phase) => {
        const normalized =
          typeof phase === "string" ? normalizePhase(phase) : phase;
        const { baselineMacros } = get();
        // Phase change resets today's macros — yesterday's adjustment
        // doesn't carry across a new phase.
        set({
          currentPhase: normalized,
          todayMacros: { ...baselineMacros },
          lastAdjustment: null,
        });
      },

      setBaselineMacros: (macros) => {
        // Keep the energy invariant tight on save.
        const reconciled: MacroTargets = {
          ...macros,
          calories: caloriesFromMacros(macros),
        };
        set({
          baselineMacros: reconciled,
          todayMacros: reconciled,
          lastAdjustment: null,
        });
      },

      setHighLoadThreshold: (threshold) => {
        if (!Number.isFinite(threshold) || threshold <= 0) return;
        set({ highLoadThreshold: threshold });
      },

      setCarbAdjustmentPct: (pct) => {
        // Clinical rule: peri-workout carb-up is 15–20%. Clamp to range.
        const clamped = Math.min(0.20, Math.max(0.15, pct));
        set({ carbAdjustmentPct: clamped });
      },

      // ── Core clinical action ─────────────────────────────────────────
      adjustMacrosForTrainingLoad: (volumeLoad, baseCarbs) => {
        const state = get();
        const { baselineMacros, currentPhase, highLoadThreshold, carbAdjustmentPct } =
          state;

        // ── Validate inputs ──────────────────────────────────────────
        if (!Number.isFinite(volumeLoad) || volumeLoad < 0) {
          const noop: MacroAdjustmentResult = {
            applied: false,
            reason: `Invalid volumeLoad: ${volumeLoad}.`,
            previous: baselineMacros,
            next: baselineMacros,
            volumeLoad,
            deltaCarbs: 0,
            deltaFats: 0,
            deltaCalories: 0,
          };
          return noop;
        }

        // ── Below threshold → no adjustment ──────────────────────────
        // Idempotency: also reset todayMacros to baseline so calling
        // this on a low-load day cleans up a prior FOR adjustment.
        if (volumeLoad < highLoadThreshold) {
          const noop: MacroAdjustmentResult = {
            applied: false,
            reason: `Volume Load ${Math.round(volumeLoad)} below FOR threshold ${highLoadThreshold}.`,
            previous: state.todayMacros,
            next: baselineMacros,
            volumeLoad,
            deltaCarbs: 0,
            deltaFats: 0,
            deltaCalories: 0,
          };
          set({ todayMacros: { ...baselineMacros }, lastAdjustment: noop });
          return noop;
        }

        // ── Above threshold → apply FOR adjustment ───────────────────
        // Always compute against `baseCarbs` (caller-provided) and the
        // *baseline* macros, not the current todayMacros — this keeps
        // the operation idempotent across repeated calls.
        const carbBoostG = Math.round(baseCarbs * carbAdjustmentPct);
        const newCarbs = baselineMacros.carbs + carbBoostG;
        const addedCarbKcal = carbBoostG * KCAL_PER_G_CARB;

        let newFats: number;
        let newCalories: number;
        let deltaFats: number;
        let deltaCalories: number;
        let reason: string;

        if (currentPhase === "surplus") {
          // Surplus: expand the boundary. Carbs add to total intake;
          // fats unchanged. This is correct because on a FOR day in a
          // surplus, eating more is the *goal* — the athlete is trying
          // to support hypertrophic adaptation.
          newFats = baselineMacros.fats;
          newCalories = baselineMacros.calories + addedCarbKcal;
          deltaFats = 0;
          deltaCalories = addedCarbKcal;
          reason =
            `High Volume Load (${Math.round(volumeLoad)} ≥ ${highLoadThreshold}) on a Surplus phase: ` +
            `+${carbBoostG}g carbs (${Math.round(carbAdjustmentPct * 100)}%), fats held, total calories +${addedCarbKcal}.`;
        } else {
          // Cut / Maintain: preserve the caloric boundary. The added
          // carb energy must come out of fat. Convert kcal → g of fat.
          const fatReductionG = Math.round(addedCarbKcal / KCAL_PER_G_FAT);
          const naiveFats = baselineMacros.fats - fatReductionG;

          // Respect the absolute fat floor.
          if (naiveFats < ABSOLUTE_FAT_FLOOR_G) {
            // Partial adjustment: reduce fats only down to the floor;
            // accept a small calorie overshoot rather than gut the
            // essential-fat budget.
            newFats = ABSOLUTE_FAT_FLOOR_G;
            const allowedFatReductionG = baselineMacros.fats - ABSOLUTE_FAT_FLOOR_G;
            const allowedFatKcal = allowedFatReductionG * KCAL_PER_G_FAT;
            newCalories = baselineMacros.calories + (addedCarbKcal - allowedFatKcal);
            deltaFats = -allowedFatReductionG;
            deltaCalories = addedCarbKcal - allowedFatKcal;
            reason =
              `High Volume Load (${Math.round(volumeLoad)} ≥ ${highLoadThreshold}) on a ${currentPhase} phase: ` +
              `+${carbBoostG}g carbs, fats reduced to ${ABSOLUTE_FAT_FLOOR_G}g floor (essential-fat protection), ` +
              `caloric boundary exceeded by ${deltaCalories} kcal.`;
          } else {
            newFats = naiveFats;
            newCalories = baselineMacros.calories;
            deltaFats = -fatReductionG;
            deltaCalories = 0;
            reason =
              `High Volume Load (${Math.round(volumeLoad)} ≥ ${highLoadThreshold}) on a ${currentPhase} phase: ` +
              `+${carbBoostG}g carbs (${Math.round(carbAdjustmentPct * 100)}%), −${fatReductionG}g fats, caloric boundary preserved.`;
          }
        }

        const next: MacroTargets = {
          protein: baselineMacros.protein, // Always static.
          carbs: newCarbs,
          fats: newFats,
          calories: newCalories,
        };

        // Reconcile calories with the energy invariant — the rounding in
        // the carb/fat conversions can leave a 1–4 kcal drift.
        next.calories = caloriesFromMacros(next);

        const result: MacroAdjustmentResult = {
          applied: true,
          reason,
          previous: state.todayMacros,
          next,
          volumeLoad,
          deltaCarbs: carbBoostG,
          deltaFats,
          deltaCalories,
        };

        set({ todayMacros: next, lastAdjustment: result });
        return result;
      },

      resetTodayMacros: () => {
        const { baselineMacros } = get();
        set({ todayMacros: { ...baselineMacros }, lastAdjustment: null });
      },
    }),
    {
      name: "metabolic-engine-storage",
      storage: createJSONStorage(() => localStorage),
      // Persist only the durable state, not transient telemetry.
      partialize: (state) => ({
        baseTDEE: state.baseTDEE,
        currentPhase: state.currentPhase,
        baselineMacros: state.baselineMacros,
        todayMacros: state.todayMacros,
        highLoadThreshold: state.highLoadThreshold,
        carbAdjustmentPct: state.carbAdjustmentPct,
      }),
    },
  ),
);
