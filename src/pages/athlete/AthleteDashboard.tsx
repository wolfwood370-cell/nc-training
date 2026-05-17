// =============================================================================
// src/pages/athlete/AthleteDashboard.tsx
// =============================================================================
// Phase 1 of the new Athlete App — "Dense Dashboard".
//
// Adapts the layout from athlete_home_dashboard_dense.html to React, using:
//   - the project's existing Tailwind tokens (brand / surface / on-surface),
//   - lucide-react icons in place of Material Symbols,
//   - inline sub-components (ReadinessRing, MetricRow, ReadinessCard,
//     NextWorkoutCard, Header) so the file is fully self-contained and
//     doesn't create new module surface area before the data layer lands.
//
// Strict deviations from the reference HTML:
//   - "LUMINA" brand mark → "NC Performance"
//   - Avatar moved from top-left to top-right (per brief)
//   - "Today's Focus" card relabelled "Prossimo Allenamento"; CTA text
//     translated to "Inizia Sessione"; mock title "Forza Lower Body"
//   - Notifications button dropped (brief asks only for app name + avatar)
//   - Nutrition / Metabolic widget OMITTED entirely
//
// Glass surface opacity is bumped from the HTML's `bg-white/[0.04]` to
// `bg-white/70` to follow the DESIGN.md "Level 1 (Widgets)" spec ("white
// surfaces at 70% opacity"). The 4% in the raw HTML is essentially
// invisible against the bright #f5faff base; 70% gives the intended
// frosted-glass effect on light mode.
//
// All data here is mock — Supabase wiring (daily_readiness + next workout
// query) lands in the follow-up commit.
// =============================================================================

import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Activity, Dumbbell, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAthleteWorkoutStore } from "@/stores/useAthleteWorkoutStore";

// -----------------------------------------------------------------------------
// MOCK DATA — single source of truth for this page until we wire the hooks.
// -----------------------------------------------------------------------------
const MOCK = {
  athleteName: "Marco",
  readiness: {
    score: 85, // 0–100
    sleepQuality: "high" as const,
    hrvTrend: "stable" as const,
    soreness: "low" as const,
    /**
     * Mock flag — if true the athlete already logged the daily check-in
     * so tapping the card opens the analysis view; if false it opens the
     * logging flow. Will be sourced from `useDailyReadiness(today)` once
     * the data layer is wired. Flip to `false` during QA to test the
     * "log first" branch.
     */
    isLoggedToday: true,
  },
  nextWorkout: {
    title: "Forza Lower Body",
    durationMin: 45,
    intensity: "High" as const,
  },
} as const;

// =============================================================================
// ReadinessRing — inline SVG circular gauge.
//   - r=45, stroke=8 inside a 100×100 viewBox.
//   - Track is a translucent surface-variant ring; progress is brand cerulean.
//   - Rotated -90° so 0% starts at the 12 o'clock position.
// =============================================================================
function ReadinessRing({ value }: { value: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ≈ 282.74
  const safeValue = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - safeValue / 100);

  return (
    <div
      role="img"
      aria-label={`Punteggio readiness ${safeValue} su 100`}
      className="relative w-28 h-28 flex items-center justify-center z-10"
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#c5e7ff"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#226fa3"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tabular-nums text-brand-container">
          {safeValue}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// MetricRow — a single label + indicator line inside the readiness card.
// Kept inline because it has no real reusable contract right now.
// =============================================================================
function MetricRow({
  label,
  indicator,
}: {
  label: string;
  indicator: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
        {label}
      </span>
      {indicator}
    </div>
  );
}

// =============================================================================
// ReadinessCard — top glass widget. Now a clickable surface that routes
// conditionally:
//   - isLoggedToday=true  → /athlete/readiness (multi-tab analysis)
//   - isLoggedToday=false → /athlete/daily-checkin (logging flow)
// The whole card is a <button> so screen readers and keyboard users get
// the right affordance; the inner gauge/metrics keep their decorative
// roles (aria-hidden on indicators, role="img" on the gauge).
// =============================================================================
function ReadinessCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={
        MOCK.readiness.isLoggedToday
          ? "Apri l'analisi della readiness"
          : "Registra la tua readiness di oggi"
      }
      className={cn(
        "relative overflow-hidden w-full text-left",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "flex justify-between items-center",
        "transition-transform active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-container/40",
      )}
    >
      {/* Ambient brand glow — decorative, behind everything else. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-brand-container/15 rounded-full blur-[40px]"
      />

      {/* Left half: micro-metrics column */}
      <div className="flex flex-col gap-3 z-10 w-1/2">
        <h2 className="font-display text-xl font-semibold text-brand-container leading-tight">
          Readiness
        </h2>

        <MetricRow
          label="Sleep Quality"
          indicator={
            <div
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-brand-container shadow-[0_0_8px_rgba(34,111,163,0.55)]"
            />
          }
        />

        <MetricRow
          label="HRV Baseline"
          indicator={
            <svg
              width="40"
              height="12"
              viewBox="0 0 40 12"
              fill="none"
              aria-hidden="true"
              className="text-brand-container"
            >
              <path
                d="M1 9.5C6 9.5 7.5 2 12.5 2C17.5 2 19 10 24 10C29 10 32 4 39 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
        />

        <MetricRow
          label="Muscle Soreness"
          indicator={
            <div
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-transparent border border-brand-container/50"
            />
          }
        />
      </div>

      {/* Right half: circular gauge */}
      <ReadinessRing value={MOCK.readiness.score} />
    </button>
  );
}

// =============================================================================
// NextWorkoutCard — middle glass widget with primary CTA. The "Inizia
// Sessione" button delegates to the page-level `onStart` handler so the
// store / navigation wiring lives in one place at the composition root.
// =============================================================================
function NextWorkoutCard({ onStart }: { onStart: () => void }) {
  return (
    <section
      aria-label="Prossimo allenamento"
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "flex flex-col gap-6",
      )}
    >
      {/* Soft brand gradient — decorative */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-container/8 to-transparent opacity-70"
      />

      <div className="z-10">
        <span className="block font-sans text-[11px] font-semibold tracking-widest uppercase text-brand-container/80">
          Prossimo Allenamento
        </span>

        <p className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
          <Activity className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {MOCK.nextWorkout.durationMin} min
          <span aria-hidden="true" className="opacity-60">
            ·
          </span>
          <Dumbbell className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {MOCK.nextWorkout.intensity} intensity
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-brand-container">
          {MOCK.nextWorkout.title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={cn(
          "z-10 w-full",
          "flex items-center justify-center gap-2",
          "py-4 px-6 rounded-full",
          "bg-brand-container text-white",
          "font-sans text-base font-semibold",
          "shadow-[0_4px_14px_rgba(34,111,163,0.3)]",
          "active:scale-[0.98] transition-transform duration-200",
        )}
      >
        Inizia Sessione
        <Play
          className="h-5 w-5 fill-white"
          strokeWidth={0}
          aria-hidden="true"
        />
      </button>
    </section>
  );
}

// =============================================================================
// Header — sticks to the top of the layout's scroll container.
//
// Negative margins (-mx-5 / -mt-6) cancel the parent <main>'s padding so the
// header spans edge-to-edge and pins at top:0 cleanly. z-30 keeps it under
// the global bottom nav (z-50) but above all card content.
// =============================================================================
function Header() {
  return (
    <header
      className={cn(
        "sticky top-0 z-30",
        "-mx-5 -mt-6 px-5 py-4",
        "backdrop-blur-3xl bg-white/85",
        "border-b border-[#c0c7d0]/40",
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-black tracking-tighter text-on-surface">
          NC Performance
        </h1>

        <Link
          to="/athlete/profile"
          aria-label="Apri profilo"
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "bg-surface-container border border-[#c0c7d0]/50",
            "text-brand-container",
            "transition-transform active:scale-95",
          )}
        >
          <User className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

// =============================================================================
// AthleteDashboard — composition only. All visual work lives in the
// inline sub-components above.
// =============================================================================
export default function AthleteDashboard() {
  const navigate = useNavigate();
  // Atomic selector — we only fire the action, never read state here.
  const startSession = useAthleteWorkoutStore((s) => s.startSession);

  // Conditional readiness routing — log first, analyse second. The check
  // here is intentionally a top-level prop chain so when the data layer
  // lands `MOCK.readiness.isLoggedToday` is the only thing that needs
  // swapping for a real query result.
  const handleReadinessCardClick = () => {
    if (MOCK.readiness.isLoggedToday) {
      navigate("/athlete/readiness");
    } else {
      navigate("/athlete/daily-checkin");
    }
  };

  /** Starts a session in the shared store and hands off to the
   *  full-screen active workout overlay. Identical contract to the
   *  AthleteTraining sticky CTA so both entry points stay symmetrical. */
  const handleStartWorkout = () => {
    startSession();
    navigate("/athlete/active-workout");
  };

  return (
    <div className="flex flex-col gap-4">
      <Header />

      {/* Greeting */}
      <section className="pt-2">
        <p className="font-display text-3xl font-bold tracking-tight text-on-surface">
          Ciao, {MOCK.athleteName}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          Ecco il tuo riepilogo di oggi.
        </p>
      </section>

      <ReadinessCard onOpen={handleReadinessCardClick} />
      <NextWorkoutCard onStart={handleStartWorkout} />
    </div>
  );
}
