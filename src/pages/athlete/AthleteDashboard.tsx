import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Activity, Clock, Flame, Heart, Moon, Play, Zap } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useReadiness } from "@/hooks/useReadiness";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ─────────────────────────  Helpers  ───────────────────────── */

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Atleta";
  return fullName.trim().split(/\s+/)[0] ?? "Atleta";
}

function getReadinessTone(score: number): {
  stroke: string;
  label: string;
  glow: string;
} {
  if (score >= 80)
    return { stroke: "#10b981", label: "Ottima", glow: "rgba(16,185,129,0.2)" };
  if (score >= 50)
    return { stroke: "#f59e0b", label: "Moderata", glow: "rgba(245,158,11,0.2)" };
  return { stroke: "#f43f5e", label: "Bassa", glow: "rgba(244,63,94,0.2)" };
}

/* ─────────────────────────  Sub-components  ───────────────────────── */

interface ReadinessGaugeProps {
  score: number;
  size?: number;
  stroke?: string;
}

function ReadinessGauge({ score, size = 112, stroke = "#005685" }: ReadinessGaugeProps) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke="#c5e7ff"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-4xl font-semibold tabular-nums leading-none"
          style={{ color: "#005685" }}
        >
          {Math.round(score)}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-on-surface-variant">
          Score
        </span>
      </div>
    </div>
  );
}

interface MicroMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function MicroMetric({ icon, label, value }: MicroMetricProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-medium text-on-surface tabular-nums">
        {value}
      </span>
    </div>
  );
}

interface MacroRowProps {
  label: string;
  value: number | null | undefined;
  unit?: string;
}

function MacroRow({ label, value, unit = "g" }: MacroRowProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-container">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold leading-tight text-on-surface tabular-nums">
          {value ?? "—"}
        </span>
        <span className="text-xs font-semibold text-brand-container">
          {unit}
        </span>
      </div>
    </div>
  );
}

interface MacroRingProps {
  size: string;
  stroke: number;
  color: string;
  progress: number;
}

function MacroRing({ size, stroke, color, progress }: MacroRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);
  return (
    <svg className={cn("absolute -rotate-90", size)} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#c5e7ff" strokeWidth={stroke} />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* ─────────────────────────  Main page  ───────────────────────── */

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { readiness, isLoading: readinessLoading, calculateReadiness } =
    useReadiness();
  const { workout, isLoading: workoutLoading } = useTodaysWorkout();
  const { targets } = useNutritionTargets();

  const firstName = getFirstName(profile?.full_name);

  const todayLabel = useMemo(() => {
    const formatted = format(new Date(), "EEEE, d MMMM", { locale: it });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  const readinessResult = useMemo(() => {
    if (!readiness?.isCompleted) return null;
    return calculateReadiness(readiness);
  }, [readiness, calculateReadiness]);

  const score = readinessResult?.score ?? 0;
  const tone = getReadinessTone(score);

  const sleepHours = readiness?.sleepHours ?? null;
  const hrv = readiness?.hrvRmssd ?? null;
  const sorenessCount = readiness?.sorenessMap
    ? Object.values(readiness.sorenessMap).filter((v) => v >= 1).length
    : 0;

  // Macro mock targets (placeholders driven by hook when available)
  const macros = {
    protein: targets?.protein ?? 120,
    fat: targets?.fat ?? 45,
    carbs: targets?.carbs ?? 180,
    kcalRemaining: 350,
  };

  return (
    <div className="font-sans bg-background min-h-screen text-on-surface">
      {/* Greeting */}
      <div className="px-5 pt-6 pb-3">
        {authLoading ? (
          <>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-on-surface">
              Ciao, {firstName} 👋
            </h1>
            <p className="text-sm text-on-surface-variant capitalize">
              {todayLabel}
            </p>
          </>
        )}
      </div>

      {/* Stack of widgets */}
      <main className="px-5 pb-28 space-y-3">
        {/* A. Readiness widget */}
        <section
          className="relative overflow-hidden rounded-3xl border border-surface-variant bg-white/70 backdrop-blur-md shadow-sm p-5"
        >
          <div
            className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: tone.glow }}
            aria-hidden="true"
          />
          {readinessLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-brand">
                    Readiness
                  </h2>
                  {readinessResult && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: tone.glow,
                        color: tone.stroke,
                      }}
                    >
                      {tone.label}
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">
                  <MicroMetric
                    icon={<Moon />}
                    label="Qualità Sonno"
                    value={sleepHours ? `${sleepHours}h` : "—"}
                  />
                  <MicroMetric
                    icon={<Heart />}
                    label="HRV"
                    value={hrv ? `${hrv} ms` : "Baseline"}
                  />
                  <MicroMetric
                    icon={<Activity />}
                    label="Dolori"
                    value={sorenessCount > 0 ? `${sorenessCount} aree` : "Nessuno"}
                  />
                </div>
              </div>

              {readinessResult ? (
                <ReadinessGauge score={score} stroke={tone.stroke} />
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/athlete/dashboard?checkin=1")}
                  className="flex flex-col items-center justify-center h-28 w-28 rounded-full border-2 border-dashed border-surface-variant text-brand text-xs font-semibold hover:bg-surface-container transition-colors"
                >
                  Check-in
                </button>
              )}
            </div>
          )}
        </section>

        {/* B. Today's training widget */}
        <section className="relative overflow-hidden rounded-3xl border border-surface-variant bg-white/70 backdrop-blur-md shadow-sm p-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(34,111,163,0.15), transparent 60%)",
            }}
            aria-hidden="true"
          />
          {workoutLoading ? (
            <Skeleton className="h-36 w-full rounded-2xl" />
          ) : workout ? (
            <div className="relative flex flex-col gap-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-container/80">
                  Focus di Oggi
                </span>
                <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {workout.estimatedDuration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {workout.estimatedDuration} min
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Alta intensità
                  </span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-brand">
                  {workout.title}
                </h2>
              </div>

              {workout.status !== "completed" ? (
                <Link
                  to="/athlete/training/active"
                  className="w-full bg-brand text-on-primary font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md hover:shadow-lg"
                >
                  Inizia Sessione
                  <Play className="h-5 w-5 fill-current" />
                </Link>
              ) : (
                <div className="w-full bg-surface-container text-brand font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2">
                  ✓ Sessione completata
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex flex-col items-center text-center py-4 gap-2">
              <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center">
                <Moon className="h-6 w-6 text-brand" />
              </div>
              <h3 className="font-display text-lg font-semibold text-on-surface">
                Giorno di riposo
              </h3>
              <p className="text-sm text-on-surface-variant max-w-xs">
                Goditi il recupero. Il riposo è parte fondamentale del progresso.
              </p>
            </div>
          )}
        </section>

        {/* C. Nutrition widget */}
        <section className="rounded-3xl border border-surface-variant bg-white shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col w-1/2 gap-4">
              <h2 className="font-display text-xl font-semibold text-on-surface">
                Nutrizione
              </h2>
              <div className="space-y-3">
                <MacroRow label="Proteine" value={macros.protein} />
                <MacroRow label="Grassi" value={macros.fat} />
                <MacroRow label="Carboidrati" value={macros.carbs} />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brand-container">
                {macros.kcalRemaining} kcal rimanenti
              </div>
            </div>

            <div className="w-1/2 flex items-center justify-center">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <MacroRing size="w-full h-full" stroke={6} color="#f43f5e" progress={70} />
                <MacroRing size="w-[78%] h-[78%]" stroke={7} color="#f59e0b" progress={55} />
                <MacroRing size="w-[56%] h-[56%]" stroke={9} color="#226fa3" progress={82} />
                <div className="absolute flex flex-col items-center text-center">
                  <Flame className="h-4 w-4 text-brand" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
