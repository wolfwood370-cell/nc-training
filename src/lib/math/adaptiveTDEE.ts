/**
 * Adaptive TDEE — Phase 3 (Clinical Intersection)
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Pure mathematical engine for estimating an athlete's *true* Total Daily
 * Energy Expenditure (TDEE) from observed body-weight trend and observed
 * caloric intake.
 *
 * ## Why this module exists
 *
 * Static TDEE formulas (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle)
 * estimate Resting Metabolic Rate from anthropometrics and apply a fixed
 * activity multiplier. They are useful as a *starting point* but are
 * systematically wrong for trained populations:
 *
 *   • EAT (Exercise Activity Thermogenesis) varies day-to-day with session
 *     volume and density.
 *   • NEAT (Non-Exercise Activity Thermogenesis) adapts downward in a
 *     deficit and upward in a surplus — the "metabolic adaptation" effect
 *     described by Rosenbaum & Leibel (2010) and Trexler et al. (2014).
 *   • TEF (Thermic Effect of Food) shifts with macronutrient composition.
 *
 * The only ground-truth signal we have is the **first law of thermodynamics
 * applied to humans**: over a sufficiently long window, the difference
 * between what is eaten and what is expended *must* equal the change in
 * stored tissue energy. By measuring both sides empirically (intake from
 * food logs, expenditure inferred from the weight trend) we let physics
 * solve for the unknown — TDEE — without ever asking the athlete to
 * estimate their activity level.
 *
 * ## Why EWMA (and not a simple average)
 *
 * Daily scale weight is dominated by **noise**, not signal:
 *
 *   • Glycogen storage carries ~3 g of bound water per gram of glycogen
 *     (Olsson & Saltin, 1970). A high-carb day can add 1–2 kg overnight
 *     with zero change in fat or lean mass.
 *   • Sodium intake, menstrual cycle phase, gut content, and creatine
 *     loading all produce daily fluctuations on the order of 0.5–2 kg.
 *   • The actual fat/lean tissue signal we care about typically moves at
 *     0.05–0.15 kg/day in either direction.
 *
 * A simple moving average treats all observations within the window as
 * equally informative. An **Exponentially Weighted Moving Average** weights
 * recent observations more heavily, which is what we want: yesterday's
 * weight tells us more about today's true mass than the weight from
 * three weeks ago.
 *
 * ## Choice of α = 0.20
 *
 * The smoothing factor α controls the bias-variance tradeoff:
 *
 *   • α → 1.0 : output equals raw input (high variance, no smoothing).
 *   • α → 0.0 : output never updates (zero variance, infinite lag).
 *
 * α = 0.20 corresponds to an effective window of N ≈ 2/α − 1 = 9 days.
 * This is the sweet spot for adaptive TDEE in a coaching context:
 *
 *   • Responsive enough to detect a genuine phase change (e.g. the athlete
 *     entering a deficit) within ~1 week.
 *   • Smooth enough that a single high-sodium meal or a missed bowel
 *     movement does not trigger a macro adjustment.
 *   • Empirically validated in the Hall et al. (2011) body-composition
 *     dynamics literature and operationalized in the MacroFactor adaptive
 *     TDEE methodology.
 *
 * Note: The legacy `nutritionMath.ts` module uses α = 0.10 for long-window
 * trend display on charts (smoother visual line). This Phase 3 module uses
 * α = 0.20 for the *engine* — we want the algorithmic adjustments to
 * react one-week-faster than the visualization, so the coach sees
 * intervention before the chart looks dramatic.
 *
 * ## Energy density of tissue (7700 kcal/kg)
 *
 * Used to convert weight delta ↔ energy balance. This is the canonical
 * value for *mixed* tissue change (fat + glycogen + lean) over a typical
 * deficit/surplus and is the figure used in clinical nutrition. The pure
 * fat-only value is closer to 9000 kcal/kg (since adipose is ~87% lipid
 * by mass and lipid stores ~9.4 kcal/g), but real-world weight change is
 * never purely fat — it includes water-bound glycogen and a small fraction
 * of lean tissue. 7700 is the right number for energy-balance accounting
 * in this context.
 *
 * @module adaptiveTDEE
 */

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * The smoothed weight delta in kilograms.
 *
 * Sign convention:
 *   • Positive = weight gained over the window (caloric surplus).
 *   • Negative = weight lost over the window (caloric deficit).
 *   • Zero    = weight stable (caloric maintenance).
 *
 * "Smoothed" means this number was computed from EWMA-trended weights,
 * NOT from raw scale readings. Passing a raw delta will produce noisy,
 * unstable TDEE estimates and should be avoided.
 */
export type SmoothedWeightDeltaKg = number;

/**
 * Quality tier for the TDEE estimate. Drives downstream UX (e.g. how
 * confidently to suggest macro changes, whether to surface a warning).
 *
 *   • high          ≥ 14 days of weight + intake data, low intake variance.
 *   • medium        7–13 days of data, or moderate intake variance.
 *   • low           < 7 days of data — directional only.
 *   • insufficient  < 3 days — no estimate possible.
 */
export type TDEEConfidence = "high" | "medium" | "low" | "insufficient";

/**
 * Result of the adaptive TDEE calculation.
 */
export interface AdaptiveTDEEResult {
  /** Estimated true TDEE in kcal/day. Null if insufficient data. */
  tdee: number | null;
  /** Daily energy balance: positive = surplus, negative = deficit. */
  dailyEnergyBalance: number;
  /** The intake side of the equation, echoed for transparency. */
  averageDailyCalories: number;
  /** The weight side of the equation, echoed for transparency. */
  smoothedWeightDeltaKg: SmoothedWeightDeltaKg;
  /** Number of days the delta is computed over (informational). */
  windowDays: number;
  /** Confidence tier (set by callers based on data availability). */
  confidence: TDEEConfidence;
}

// ─── Constants ────────────────────────────────────────────────────────────

/**
 * The α (alpha) factor for the Adaptive TDEE engine.
 *
 * 0.20 = 20% weight to today's measurement, 80% to the historical trend.
 * See module-level docstring for the full physiological rationale.
 */
export const ADAPTIVE_TDEE_ALPHA = 0.20 as const;

/**
 * Energy density of mixed body tissue in kcal per kilogram.
 *
 * This is the canonical conversion factor used in clinical nutrition for
 * weight-change ↔ energy-balance accounting. It assumes mixed tissue
 * (fat + water-bound glycogen + a small lean fraction), not pure adipose.
 *
 * Reference: Wishnofsky (1958); Hall (2008) re-derivation.
 */
export const KCAL_PER_KG_TISSUE = 7700 as const;

/**
 * Default observation window in days for the weight delta.
 *
 * Chosen as 14 days because:
 *   • It spans a full menstrual phase shift for female athletes.
 *   • It absorbs at least one weekly refeed/glycogen super-compensation.
 *   • At α = 0.20 (effective N ≈ 9 days) the EWMA has fully "warmed up"
 *     well within this window.
 */
export const DEFAULT_TDEE_WINDOW_DAYS = 14 as const;

// ─── Core Functions ───────────────────────────────────────────────────────

/**
 * Apply Exponentially Weighted Moving Average smoothing to a chronological
 * series of body-weight measurements.
 *
 * **Formula:**
 * ```
 *   EWMA₀ = x₀
 *   EWMAₜ = α · xₜ + (1 − α) · EWMAₜ₋₁
 * ```
 *
 * **Gap handling:** `null` entries are treated as missed weigh-ins. The
 * trend value is *carried forward* rather than re-seeded — this matches
 * how a coach would intuitively interpret a missed day ("we don't have
 * new info, so the trend is unchanged"). Re-seeding on every gap would
 * make the trend whiplash on intermittent loggers.
 *
 * **First-value seeding:** The first observed weight seeds the EWMA. We
 * do NOT bias-correct (e.g. divide by `1 − (1−α)ⁿ` à la pandas) because
 * for body-weight smoothing the seed bias is < 0.5% by day 7 at α = 0.20,
 * and the correction makes early-window estimates more volatile in
 * practice.
 *
 * @param rawWeights  Chronologically ordered scale readings in kg, oldest
 *                    first. `null` = missed weigh-in (not "weight is zero").
 * @param alpha       Smoothing factor in (0, 1]. Defaults to 0.20.
 * @returns           Trended weight series. Length equals the number of
 *                    *non-null* entries in the input. Empty array if no
 *                    valid measurements were provided.
 *
 * @example
 * ```ts
 * const trend = calculateEWMA([80.0, 80.4, 79.8, null, 80.1, 79.9]);
 * // Returns 5 trend values (one per non-null input).
 * ```
 */
export function calculateEWMA(
  rawWeights: ReadonlyArray<number | null>,
  alpha: number = ADAPTIVE_TDEE_ALPHA,
): number[] {
  if (alpha <= 0 || alpha > 1) {
    throw new Error(
      `calculateEWMA: alpha must be in (0, 1], got ${alpha}. ` +
        `Use 0.20 for the standard adaptive TDEE engine.`,
    );
  }

  const trend: number[] = [];
  let ewma: number | null = null;

  for (const w of rawWeights) {
    if (w === null || !Number.isFinite(w)) {
      // Missed weigh-in: no signal update. Do not push a value — the
      // returned series only contains points where we *have* a trend
      // estimate grounded in real data.
      continue;
    }

    if (ewma === null) {
      // Seed the EWMA with the first observation.
      ewma = w;
    } else {
      ewma = alpha * w + (1 - alpha) * ewma;
    }

    trend.push(ewma);
  }

  return trend;
}

/**
 * Compute the smoothed weight delta over a window of raw weight readings.
 *
 * Convenience wrapper around `calculateEWMA` that returns the *change* in
 * the trend line — i.e. the input expected by `calculateAdaptiveTDEE`.
 *
 * @param rawWeights  Chronologically ordered weights in kg (oldest first).
 *                    `null` entries are skipped (missed weigh-ins).
 * @param alpha       EWMA smoothing factor. Defaults to 0.20.
 * @returns           `endTrend − startTrend` in kg, or 0 if fewer than
 *                    two valid measurements exist.
 */
export function calculateSmoothedWeightDelta(
  rawWeights: ReadonlyArray<number | null>,
  alpha: number = ADAPTIVE_TDEE_ALPHA,
): SmoothedWeightDeltaKg {
  const trend = calculateEWMA(rawWeights, alpha);
  if (trend.length < 2) return 0;
  return trend[trend.length - 1] - trend[0];
}

/**
 * Calculate the athlete's true TDEE from their observed weight trend and
 * observed caloric intake.
 *
 * **Physiological model:**
 *
 * Over a window of `windowDays`, the first law of thermodynamics gives:
 *
 * ```
 *   Σ(intake) − Σ(expenditure) = Δ(stored tissue energy)
 * ```
 *
 * Rearranging for daily expenditure (TDEE):
 *
 * ```
 *   TDEE = AverageIntake − (ΔWeight · KCAL_PER_KG / windowDays)
 *        = AverageIntake − DailyEnergyBalance
 * ```
 *
 * **Sign intuition:**
 *
 *   • Athlete *gained* weight on a given intake → they were in a surplus
 *     → their TDEE is *less than* their intake → we subtract a positive
 *     daily balance.
 *   • Athlete *lost* weight on a given intake → they were in a deficit
 *     → their TDEE is *greater than* their intake → we subtract a
 *     negative balance (i.e. add).
 *
 * **What this number represents:**
 *
 * The returned TDEE is the athlete's *behaviorally adapted* expenditure
 * for the observed window — it already includes their actual NEAT, EAT,
 * and any metabolic adaptation. This is what you want to anchor macro
 * targets to. Do NOT compare this to a Mifflin-St Jeor prediction and
 * "correct" toward the formula — the empirical number is the truth.
 *
 * @param smoothedWeightDelta  EWMA-smoothed change in body weight over
 *                             the window, in kg. Positive = gain.
 * @param averageDailyCalories Mean daily caloric intake over the same
 *                             window. Must be ≥ 0.
 * @param windowDays           Number of days the delta and average span.
 *                             Defaults to 14. Must be ≥ 1.
 * @returns                    Full result object including the TDEE
 *                             estimate and intermediate values for
 *                             coach-facing transparency.
 *
 * @example
 * ```ts
 * // Athlete ate 2400 kcal/day for 14 days and lost 0.6 kg of trended weight.
 * const result = calculateAdaptiveTDEE(-0.6, 2400, 14);
 * // result.dailyEnergyBalance ≈ -330 kcal (deficit)
 * // result.tdee              ≈ 2730 kcal/day
 * ```
 */
export function calculateAdaptiveTDEE(
  smoothedWeightDelta: SmoothedWeightDeltaKg,
  averageDailyCalories: number,
  windowDays: number = DEFAULT_TDEE_WINDOW_DAYS,
): AdaptiveTDEEResult {
  // ── Input validation ──────────────────────────────────────────────────
  if (!Number.isFinite(smoothedWeightDelta)) {
    throw new Error(
      `calculateAdaptiveTDEE: smoothedWeightDelta must be a finite number, got ${smoothedWeightDelta}.`,
    );
  }
  if (!Number.isFinite(averageDailyCalories) || averageDailyCalories < 0) {
    throw new Error(
      `calculateAdaptiveTDEE: averageDailyCalories must be ≥ 0, got ${averageDailyCalories}.`,
    );
  }
  if (!Number.isFinite(windowDays) || windowDays < 1) {
    throw new Error(
      `calculateAdaptiveTDEE: windowDays must be ≥ 1, got ${windowDays}.`,
    );
  }

  // ── Energy balance: ΔWeight · 7700 / days ─────────────────────────────
  // Positive delta → positive balance → athlete was in a surplus.
  const dailyEnergyBalance =
    (smoothedWeightDelta * KCAL_PER_KG_TISSUE) / windowDays;

  // ── TDEE: intake minus the balance ────────────────────────────────────
  // If they gained on 2500 kcal with a +200 kcal balance, they expended 2300.
  // If they lost on 2500 kcal with a −300 kcal balance, they expended 2800.
  const tdee = averageDailyCalories - dailyEnergyBalance;

  return {
    tdee: Math.round(tdee),
    dailyEnergyBalance: Math.round(dailyEnergyBalance),
    averageDailyCalories: Math.round(averageDailyCalories),
    smoothedWeightDeltaKg: Number(smoothedWeightDelta.toFixed(3)),
    windowDays,
    // Confidence is set to "high" here as a default; consumers should
    // override this based on actual data-availability checks (number of
    // weigh-ins, intake-log completeness, intake variance, etc.).
    confidence: "high",
  };
}

/**
 * Classify confidence in a TDEE estimate based on data availability.
 *
 * Pure helper — extracted so that the rules are testable and consistent
 * across the engine and the UI hook.
 *
 * @param daysWithWeight   Count of non-null weigh-ins in the window.
 * @param daysWithIntake   Count of days with logged caloric intake.
 * @param windowDays       Total length of the observation window.
 */
export function classifyTDEEConfidence(
  daysWithWeight: number,
  daysWithIntake: number,
  windowDays: number = DEFAULT_TDEE_WINDOW_DAYS,
): TDEEConfidence {
  const minDays = Math.min(daysWithWeight, daysWithIntake);
  const coverage = minDays / windowDays;

  if (minDays < 3) return "insufficient";
  if (minDays < 7 || coverage < 0.4) return "low";
  if (minDays < 14 || coverage < 0.7) return "medium";
  return "high";
}
