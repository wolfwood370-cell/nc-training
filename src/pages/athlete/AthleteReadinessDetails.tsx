// =============================================================================
// src/pages/athlete/AthleteReadinessDetails.tsx
// =============================================================================
// Phase 3 of the new Athlete App — Readiness Analysis detail view.
//
// Two tabs in one page:
//   - "Panoramica"   → mirror of readiness_analysis_detail.html
//                      (gauge + 6-factor linear bar list + 7-day trend curve)
//   - "Mappa Dolori" → muscle-by-muscle breakdown, inspired by
//                      readiness_analysis_soreness_deep_dive.html
//                      (per-muscle intensity bars + soreness-specific trend)
//
// The shared hero (large circular gauge + CTA that links to /athlete/checkin)
// sits above the tab content so the user always sees the overall score.
//
// All charts are inline SVG — no Recharts, no library. State is local
// useState only; backend wiring lands in a follow-up commit.
//
// Mount: SIBLING route of <AthleteLayout> at /athlete/readiness — the page
// is a stack-pushed detail flow (back button → /athlete) and intentionally
// does NOT show the bottom navigation bar.
// =============================================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Domain types
// =============================================================================
type TabId = "panoramica" | "dolori";
type SorenessLevel = "mild" | "moderate" | "severe";

interface Factor {
  id: "sleep" | "energy" | "soreness" | "stress" | "mood" | "digestion";
  label: string;
  /** 0..10 score, will be rendered as `value/10` and as a % bar fill */
  value: number;
}

interface SoreMuscle {
  id: string;
  label: string;
  intensity: SorenessLevel;
}

// =============================================================================
// Static mock data — replace with hooks (useDailyReadiness, useSorenessMap)
// in the next commit.
// =============================================================================
const READINESS = {
  score: 82,
  label: "Ottimale",
} as const;

const FACTORS: readonly Factor[] = [
  { id: "sleep", label: "Sonno", value: 8.5 },
  { id: "energy", label: "Energia", value: 7.0 },
  { id: "soreness", label: "Indolenzimento", value: 9.0 },
  { id: "stress", label: "Stress", value: 6.0 },
  { id: "mood", label: "Umore", value: 8.0 },
  { id: "digestion", label: "Digestione", value: 9.5 },
] as const;

const SORE_MUSCLES: readonly SoreMuscle[] = [
  { id: "quads", label: "Quadricipiti", intensity: "moderate" },
  { id: "lower_back", label: "Lombari", intensity: "severe" },
  { id: "hamstrings", label: "Femorali", intensity: "mild" },
] as const;

// Translates the intensity enum into both the bar fill ratio (0..1) and
// a human-readable Italian label.
const INTENSITY_META: Record<SorenessLevel, { label: string; percent: number }> = {
  mild: { label: "Lieve", percent: 33 },
  moderate: { label: "Moderato", percent: 66 },
  severe: { label: "Forte", percent: 100 },
};

// 7-day trend mock points (0..100 score scale). Sunday last; today flagged.
const TREND_POINTS = [
  { day: "L", score: 72 },
  { day: "M", score: 68 },
  { day: "M", score: 78 },
  { day: "G", score: 70 },
  { day: "V", score: 75 },
  { day: "S", score: 80 },
  { day: "D", score: 82 }, // today
] as const;

// =============================================================================
// ReadinessGauge — inline SVG, large variant (192×192).
// =============================================================================
function ReadinessGauge({ value, label }: { value: number; label: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - safe / 100);

  return (
    <div
      role="img"
      aria-label={`Punteggio readiness ${safe} su 100. ${label}.`}
      className="relative w-48 h-48 flex flex-col items-center justify-center"
    >
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#c5e7ff"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#226fa3"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="z-10 flex flex-col items-center">
        <span className="font-display text-5xl font-bold tabular-nums text-brand-container leading-none">
          {safe}
        </span>
        <span className="mt-2 font-sans text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">
          {label}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// FactorBar — single row in the "Today's Factors" list.
// `highlight` raises the visual weight when this factor is the focal point
// (used by the "Mappa Dolori" view to surface "Indolenzimento").
// =============================================================================
function FactorBar({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const percent = Math.max(0, Math.min(100, value * 10));
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        highlight && "p-3 -mx-3 rounded-2xl bg-brand-container/10 border border-brand-container/20",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-sans text-[11px] font-semibold tracking-wider uppercase",
            highlight ? "text-brand-container" : "text-on-surface-variant",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "font-sans text-xs font-bold tabular-nums",
            highlight ? "text-brand-container" : "text-on-surface",
          )}
        >
          {value.toFixed(1)}/10
        </span>
      </div>
      <div
        className={cn(
          "w-full h-1.5 rounded-full overflow-hidden",
          highlight ? "bg-brand-container/20" : "bg-surface-container",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            highlight ? "bg-brand-container" : "bg-on-surface-variant/70",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MuscleRow — a single sore-muscle entry with intensity chip + bar.
// =============================================================================
function MuscleRow({ muscle }: { muscle: SoreMuscle }) {
  const meta = INTENSITY_META[muscle.intensity];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-on-surface">
          {muscle.label}
        </span>
        <span
          className={cn(
            "px-3 py-1 rounded-full",
            "font-sans text-[10px] font-semibold uppercase tracking-wider",
            muscle.intensity === "severe"
              ? "bg-brand-container text-white"
              : muscle.intensity === "moderate"
                ? "bg-brand-container/15 text-brand-container"
                : "bg-surface-container text-on-surface-variant",
          )}
        >
          {meta.label}
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-container rounded-full transition-all duration-300"
          style={{ width: `${meta.percent}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// TrendChart — inline SVG spline with gradient fill. Pure markup, no lib.
//
// Layout changes vs the previous version:
//   - Container height raised from h-32 (128px) to h-48 (192px) so the
//     curve has room to breathe — previously the chart looked squashed
//     horizontally even though the SVG is "non-scaling".
//   - Data points are now overlaid as positioned divs (one per point)
//     instead of pure <circle> nodes, so each one can be a
//     `group cursor-pointer` parent with a tooltip that shows on hover.
//     The SVG `<circle>`s remain underneath for the rendered dot
//     itself; the divs are invisible hit areas.
//
// Y axis maps 0..100 score → 100..0 SVG y (top-left origin).
// X axis maps N points evenly across 0..100.
// =============================================================================
function TrendChart({ points }: { points: readonly { day: string; score: number }[] }) {
  if (points.length === 0) return null;

  const xs = points.map((_, i) => (i / (points.length - 1)) * 100);
  const ys = points.map((p) => 100 - Math.max(0, Math.min(100, p.score)));

  // Build a smooth path with cubic bezier segments between every pair of
  // adjacent points. The control points sit 1/3 of the segment width
  // before/after the anchor — produces a gentle natural curve.
  const linePath = xs
    .map((x, i) => {
      if (i === 0) return `M ${x},${ys[i]}`;
      const px = xs[i - 1];
      const py = ys[i - 1];
      const cp1x = px + (x - px) / 3;
      const cp2x = x - (x - px) / 3;
      return `C ${cp1x},${py} ${cp2x},${ys[i]} ${x},${ys[i]}`;
    })
    .join(" ");

  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <div className="w-full">
      {/* h-48 (192px) gives the curve real vertical room. The previous
          h-32 made the spline look horizontally compressed on mobile. */}
      <div className="relative h-48 w-full">
        {/* Grid lines for visual rhythm */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col justify-between pointer-events-none"
        >
          <div className="h-px bg-on-surface-variant/15" />
          <div className="h-px bg-on-surface-variant/15" />
          <div className="h-px bg-on-surface-variant/15" />
        </div>

        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#226fa3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#226fa3" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#trendGradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#226fa3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {xs.map((x, i) => {
            const isToday = i === xs.length - 1;
            return (
              <circle
                key={i}
                cx={x}
                cy={ys[i]}
                r={isToday ? 3 : 2}
                fill={isToday ? "#226fa3" : "#ffffff"}
                stroke="#226fa3"
                strokeWidth={isToday ? 0 : 2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {/* Interactive hit areas + hover tooltips. One absolute-
            positioned div per data point, sized large enough for touch
            but visually invisible. The tooltip uses Tailwind's `group`
            modifier to surface on hover. */}
        {points.map((p, i) => {
          const xPercent = xs[i];
          const yPercent = ys[i];
          return (
            <div
              key={i}
              role="img"
              aria-label={`${p.day}: ${p.score} su 100`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${xPercent}%`,
                top: `${yPercent}%`,
              }}
            >
              {/* Invisible square hit area (24×24) — gives mobile users
                  a tappable target without changing the visual dot. */}
              <div className="h-6 w-6" aria-hidden="true" />
              {/* Tooltip — pops up on hover/focus, anchored above. */}
              <div
                role="tooltip"
                className={cn(
                  "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2",
                  "px-2 py-1 rounded-lg whitespace-nowrap",
                  "bg-on-surface text-white",
                  "font-sans text-[10px] font-semibold tabular-nums",
                  "shadow-[0_4px_12px_rgba(0,30,45,0.25)]",
                  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  "transition-opacity duration-150",
                )}
              >
                {p.day} · {p.score}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-3 px-1">
        {points.map((p, i) => {
          const isToday = i === points.length - 1;
          return (
            <span
              key={i}
              className={cn(
                "font-sans text-[10px] uppercase tracking-wider",
                isToday
                  ? "text-brand-container font-bold"
                  : "text-on-surface-variant",
              )}
            >
              {p.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TopBar — back arrow + centered title.
//
// The back button + the header itself are bumped to z-50 (was z-40) so
// the glassmorphism band can't be over-painted by a sibling overlay.
// `relative` on the button creates a stacking context so the z-50 has
// a frame of reference; `cursor-pointer` is explicit because we
// removed the native button affordance with the rounded-full styling.
// =============================================================================
function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "h-16 flex items-center px-4",
        "backdrop-blur-xl bg-white/85",
        "border-b border-[#c0c7d0]/40",
      )}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Torna alla dashboard"
        className={cn(
          "relative z-50 cursor-pointer",
          "h-10 w-10 rounded-full",
          "flex items-center justify-center",
          "text-brand-container",
          "transition-colors hover:bg-surface-container/60",
          "active:scale-95",
        )}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </button>
      <h1 className="flex-1 text-center -ml-10 font-display text-lg font-bold tracking-tight text-on-surface pointer-events-none">
        Readiness
      </h1>
    </header>
  );
}

// =============================================================================
// TabSwitcher — segmented pill control.
// =============================================================================
function TabSwitcher({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (next: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "panoramica", label: "Panoramica" },
    { id: "dolori", label: "Mappa Dolori" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Vista readiness"
      className="flex items-center gap-1 p-1 rounded-full bg-surface-container/70 border border-[#c0c7d0]/30"
    >
      {tabs.map(({ id, label }) => {
        const isActive = tab === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 py-2 px-4 rounded-full",
              "font-sans text-sm font-semibold tracking-wide",
              "transition-all duration-200",
              isActive
                ? "bg-brand-container text-white shadow-[0_4px_12px_rgba(34,111,163,0.25)]"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Card chrome — shared glass surface wrapper.
// =============================================================================
function GlassCard({
  children,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "shadow-[0_12px_40px_rgba(80,118,142,0.05)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

// =============================================================================
// AthleteReadinessDetails — page composition.
// =============================================================================
export default function AthleteReadinessDetails() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("panoramica");

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased pb-12">
      <TopBar onBack={() => navigate("/athlete")} />

      <main className="pt-20 px-5 max-w-lg mx-auto flex flex-col gap-6">
        {/* Tabs */}
        <TabSwitcher tab={tab} onChange={setTab} />

        {/* Hero gauge + Log CTA — shared between tabs */}
        <GlassCard
          ariaLabel="Punteggio readiness complessivo"
          className="flex flex-col items-center gap-6"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-brand-container/8 to-transparent pointer-events-none"
          />
          <div className="z-10">
            <ReadinessGauge value={READINESS.score} label={READINESS.label} />
          </div>
          <Link
            to="/athlete/daily-checkin"
            className={cn(
              "z-10 w-full",
              "flex items-center justify-center gap-2",
              "py-4 px-6 rounded-full",
              "bg-brand-container text-white",
              "font-display text-sm font-bold uppercase tracking-widest",
              "shadow-[0_8px_20px_rgba(34,111,163,0.25)]",
              "transition-transform duration-200 active:scale-[0.98]",
              "hover:brightness-110",
            )}
          >
            Registra Readiness di oggi
          </Link>
        </GlassCard>

        {/* Tab-specific content */}
        {tab === "panoramica" ? (
          <>
            {/* All factors, equal weight */}
            <GlassCard ariaLabel="Fattori di oggi">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface mb-6">
                Fattori di oggi
              </h2>
              <div className="flex flex-col gap-5">
                {FACTORS.map((f) => (
                  <FactorBar key={f.id} label={f.label} value={f.value} />
                ))}
              </div>
            </GlassCard>

            {/* Generic 7-day trend */}
            <GlassCard ariaLabel="Trend 7 giorni">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface">
                  Trend 7 giorni
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container/70">
                  <span className="h-2 w-2 rounded-full bg-brand-container" />
                  <span className="font-sans text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant">
                    Score
                  </span>
                </div>
              </div>
              <TrendChart points={TREND_POINTS} />
            </GlassCard>
          </>
        ) : (
          <>
            {/* Sore muscles breakdown */}
            <GlassCard ariaLabel="Gruppi muscolari indolenziti">
              <div className="flex items-center gap-3 mb-2">
                <Activity
                  className="h-5 w-5 text-brand-container"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface">
                  Mappa Dolori
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                Gruppi muscolari attualmente indolenziti, con intensità.
              </p>

              {SORE_MUSCLES.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic">
                  Nessun gruppo muscolare segnalato oggi.
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  {SORE_MUSCLES.map((m) => (
                    <MuscleRow key={m.id} muscle={m} />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Soreness-specific trend, with vertical accent bar on the left */}
            <GlassCard
              ariaLabel="Trend 7 giorni indolenzimento"
              className="pl-8"
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-1 bg-brand-container"
              />
              <h2 className="font-display text-2xl font-semibold tracking-tight text-on-surface">
                Trend 7 giorni · Indolenzimento
              </h2>
              <p className="mt-1 mb-6 text-sm text-on-surface-variant">
                Il recupero è in linea con la settimana scorsa.
              </p>
              <TrendChart points={TREND_POINTS} />
            </GlassCard>
          </>
        )}
      </main>
    </div>
  );
}
