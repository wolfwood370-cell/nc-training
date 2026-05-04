import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Battery, Flame, Moon, Zap } from "lucide-react";

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

function getReadinessTone(score: number) {
  if (score >= 80) return { stroke: "#10b981", label: "Ottima" };
  if (score >= 50) return { stroke: "#f59e0b", label: "Moderata" };
  return { stroke: "#f43f5e", label: "Bassa" };
}

/* ─────────────────────────  Sub-components  ───────────────────────── */

interface ReadinessRingProps {
  state: "pending" | "completed";
  score?: number;
  stroke?: string;
  onClick?: () => void;
}

function ReadinessRing({
  state,
  score = 0,
  stroke = "#005685",
  onClick,
}: ReadinessRingProps) {
  const size = 112;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  if (state === "pending") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Avvia check-in giornaliero"
        className="flex h-28 w-28 items-center justify-center rounded-full border-[2.5px] border-dashed border-brand text-brand font-display text-base font-bold tracking-tight hover:bg-surface-container active:scale-95 transition-all"
      >
        Check-in
      </button>
    );
  }

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
        <span className="font-display text-4xl font-bold tabular-nums leading-none text-brand">
          {Math.round(score)}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
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
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold text-on-surface tabular-nums">
        {value}
      </span>
    </div>
  );
}

interface MacroBlockProps {
  label: string;
  value: number;
}

function MacroBlock({ label, value }: MacroBlockProps) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-container">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold leading-tight text-on-surface tabular-nums">
          {value}
        </span>
        <span className="text-sm font-semibold text-brand-container">g</span>
      </div>
    </div>
  );
}

interface MiniMetricRingProps {
  letter: string;
  label: string;
  progress: number;
  color: string;
}

function MiniMetricRing({ letter, label, progress, color }: MiniMetricRingProps) {
  const size = 36;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold text-on-surface">
          {letter}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-container">
        {label}
      </span>
    </div>
  );
}

interface MacroRingProps {
  sizeClass: string;
  stroke: number;
  color: string;
  progress: number;
}

function MacroRing({ sizeClass, stroke, color, progress }: MacroRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);
  return (
    <svg className={cn("absolute -rotate-90", sizeClass)} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="transparent"
        stroke="#f1f5f9"
        strokeWidth={stroke}
      />
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
  const sleepQuality = readiness?.sleepQuality ?? null;
  const energy = readiness?.energy ?? null;
  const stress = readiness?.stress ?? null;

  const sleepLabel = sleepHours
    ? `${sleepHours}h${sleepQuality ? ` · ${sleepQuality}/10` : ""}`
    : "—";
  // Fatigue is the inverse of energy (1-10 scale)
  const fatigueLabel = energy ? `${11 - energy}/10` : "—";
  const stressLabel = stress ? `${stress}/10` : "—";

  const macros = {
    protein: targets?.protein ?? 180,
    fat: targets?.fats ?? 75,
    carbs: targets?.carbs ?? 260,
    kcalRemaining: 350,
  };

  return (
    <div className="font-sans bg-background min-h-screen text-on-surface">
      {/* Header */}
      <header className="px-5 pt-6 pb-3">
        {authLoading ? (
          <>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-on-surface">
              Ciao, {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant capitalize">
              {todayLabel}
            </p>
          </>
        )}
      </header>

      <main className="px-5 pb-28 space-y-4">
        {/* A. Readiness widget */}
        <section className="relative overflow-hidden rounded-3xl bg-white border border-surface-variant shadow-[0_4px_20px_-12px_rgba(0,30,45,0.08)] p-6">
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(255,180,171,0.45) 0%, rgba(165,222,254,0.25) 60%, transparent 80%)",
            }}
            aria-hidden="true"
          />

          {readinessLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : (
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex flex-col gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-brand">
                    Prontezza
                  </h2>
                  {readinessResult && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${tone.stroke}1a`,
                        color: tone.stroke,
                      }}
                    >
                      {tone.label}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <MicroMetric
                    icon={<Moon />}
                    label="Qualità Sonno"
                    value={sleepLabel}
                  />
                  <MicroMetric
                    icon={<Battery />}
                    label="Affaticamento"
                    value={fatigueLabel}
                  />
                  <MicroMetric
                    icon={<Zap />}
                    label="Stress"
                    value={stressLabel}
                  />
                </div>
              </div>

              <ReadinessRing
                state={readinessResult ? "completed" : "pending"}
                score={score}
                stroke={tone.stroke}
                onClick={() => navigate("/athlete/dashboard?checkin=1")}
              />
            </div>
          )}
        </section>

        {/* B. Today's training widget */}
        <section className="rounded-3xl bg-surface-container p-6">
          {workoutLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : workout ? (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-container">
                Focus di Oggi
              </span>
              <h2 className="font-display text-2xl font-bold text-brand leading-tight">
                {workout.title}
              </h2>
              <button
                type="button"
                onClick={() => navigate("/athlete/training/active")}
                className="w-full bg-brand text-on-primary font-display font-semibold py-4 px-6 rounded-full hover:opacity-95 active:scale-[0.98] transition-all shadow-md"
              >
                Inizia Sessione
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="h-16 w-16 rounded-full bg-surface-variant flex items-center justify-center shadow-inner">
                <Moon className="h-8 w-8 text-brand" strokeWidth={1.75} />
              </div>
              <h3 className="mt-3 font-display text-xl font-bold text-on-surface">
                Giorno di riposo
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant max-w-[250px] mx-auto">
                Goditi il recupero. Il riposo è parte fondamentale del
                progresso.
              </p>
            </div>
          )}
        </section>

        {/* C. Nutrition widget */}
        <section className="rounded-3xl bg-white border border-surface-variant shadow-[0_4px_20px_-12px_rgba(0,30,45,0.08)] p-6">
          <h2 className="font-display text-xl font-semibold text-on-surface mb-5">
            Nutrizione
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-4 w-1/2">
              <MacroBlock label="Proteine" value={macros.protein} />
              <MacroBlock label="Grassi" value={macros.fat} />
              <MacroBlock label="Carboidrati" value={macros.carbs} />
            </div>

            <div className="w-1/2 flex items-center justify-center">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <MacroRing
                  sizeClass="w-full h-full"
                  stroke={6}
                  color="#ffb4ab"
                  progress={70}
                />
                <MacroRing
                  sizeClass="w-[78%] h-[78%]"
                  stroke={7}
                  color="#ffd899"
                  progress={55}
                />
                <MacroRing
                  sizeClass="w-[56%] h-[56%]"
                  stroke={9}
                  color="#a3defe"
                  progress={82}
                />
                <Flame className="absolute h-5 w-5 text-brand" />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-surface-variant text-center">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-brand">
              − {macros.kcalRemaining} kcal rimanenti
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-variant grid grid-cols-3 gap-2">
            <MiniMetricRing letter="F" label="Fibre" progress={60} color="#7cc78a" />
            <MiniMetricRing letter="A" label="Acqua" progress={45} color="#5bb6e8" />
            <MiniMetricRing letter="S" label="Sodio" progress={80} color="#e8a25b" />
          </div>
        </section>
      </main>
    </div>
  );
}
