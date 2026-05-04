import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Clock,
  Zap,
  BarChart,
  PlayCircle,
  ChevronsUpDown,
  Activity,
  Dumbbell,
  Snowflake,
  Loader2,
} from "lucide-react";
import { format, addDays, startOfWeek, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useAcwrData } from "@/hooks/useAcwrData";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";
import type { WorkoutStructureExercise } from "@/types/database";

type Tab = "diario" | "metriche";

const DAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];

interface Phase {
  icon: typeof Snowflake;
  title: string;
  subtitle: string;
  active: boolean;
}

function classifyPhase(ex: WorkoutStructureExercise): "warmup" | "main" | "cooldown" {
  const tag = `${ex.name ?? ""} ${(ex as any).category ?? ""} ${(ex as any).notes ?? ""}`.toLowerCase();
  if (/(warm|prep|mobility|attivazione|riscald)/.test(tag)) return "warmup";
  if (/(cool|stretch|defaticamento|down)/.test(tag)) return "cooldown";
  return "main";
}

function buildPhases(structure: WorkoutStructureExercise[]): Phase[] {
  const groups = { warmup: [] as WorkoutStructureExercise[], main: [] as WorkoutStructureExercise[], cooldown: [] as WorkoutStructureExercise[] };
  structure.forEach((ex) => groups[classifyPhase(ex)].push(ex));

  const estimateMinutes = (list: WorkoutStructureExercise[]) =>
    Math.max(5, Math.round(list.reduce((acc, ex) => acc + (ex.sets ?? 3) * 2, 0)));

  const phases: Phase[] = [];
  if (groups.warmup.length) {
    phases.push({
      icon: Snowflake,
      title: "Movement Prep",
      subtitle: `${groups.warmup.length} Esercizi • ${estimateMinutes(groups.warmup)} min`,
      active: false,
    });
  }
  phases.push({
    icon: Dumbbell,
    title: "Main Session",
    subtitle: `${groups.main.length || structure.length} Esercizi • ${estimateMinutes(
      groups.main.length ? groups.main : structure,
    )} min`,
    active: true,
  });
  if (groups.cooldown.length) {
    phases.push({
      icon: Activity,
      title: "Cool Down",
      subtitle: `${groups.cooldown.length} Esercizi • ${estimateMinutes(groups.cooldown)} min`,
      active: false,
    });
  }
  return phases;
}

export default function AthleteTraining() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("diario");
  const { workout, isLoading } = useTodaysWorkout();
  const { data: acwr } = useAcwrData();
  const startSession = useActiveSessionStore((s) => s.startSession);

  // Live week strip — Mon → Sun, anchored to today
  const days = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      return { letter: DAY_LETTERS[i], num: d.getDate(), active: isToday(d) };
    });
  }, []);

  const phases = useMemo(
    () => (workout?.structure?.length ? buildPhases(workout.structure) : null),
    [workout?.structure],
  );

  const handleStart = () => {
    if (!workout) return;
    startSession(crypto.randomUUID(), workout.id);
    navigate("/athlete/active-workout");
  };

  // Readiness derived from ACWR zone (cheap proxy until a Readiness card hook is wired)
  const readinessLabel = !acwr || acwr.zone === "insufficient-data"
    ? "—"
    : acwr.zone === "optimal"
    ? "Ottima"
    : acwr.zone === "detraining"
    ? "Bassa"
    : acwr.zone === "high-risk"
    ? "Critica"
    : "Buona";
  const weeklyTonnage = acwr ? Math.round(acwr.acuteLoad) : null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-surface-variant flex justify-between items-center px-6 py-4">
        <button
          className="w-10 h-10 rounded-full overflow-hidden bg-surface-container"
          aria-label="Profilo"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt="Avatar atleta"
            className="w-full h-full object-cover"
          />
        </button>
        <h1 className="font-display font-bold text-lg text-primary">Training</h1>
        <button
          onClick={() => navigate("/athlete/settings")}
          className="text-on-surface-variant p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Impostazioni"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 mt-6 space-y-6 max-w-md mx-auto pb-40">
        {/* Segmented Control */}
        <div className="p-1 bg-surface-container rounded-full flex w-full">
          <button
            onClick={() => setTab("diario")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              tab === "diario" ? "bg-white text-primary shadow-sm" : "text-secondary"
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => {
              setTab("metriche");
              navigate("/athlete/training-metrics");
            }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              tab === "metriche" ? "bg-white text-primary shadow-sm" : "text-secondary"
            }`}
          >
            Metriche
          </button>
        </div>

        {/* Micro-Calendar */}
        <div className="flex justify-between items-center py-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center relative">
              <span className="text-xs text-secondary mb-1">{d.letter}</span>
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                  d.active ? "bg-primary-container text-white" : "text-secondary"
                }`}
              >
                {d.num}
              </div>
              {d.active && (
                <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-1" />
              )}
            </div>
          ))}
        </div>

        {/* Hero Card */}
        <section className="bg-white/[0.7] backdrop-blur-md rounded-3xl p-6 relative overflow-hidden border border-surface-variant shadow-sm">
          <span className="absolute top-0 left-0 w-1.5 h-full bg-primary-container rounded-l-3xl" />
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80"
            alt=""
            aria-hidden="true"
            className="absolute top-0 right-0 w-1/2 h-full opacity-10 object-cover pointer-events-none"
          />
          <div className="relative z-10">
            <span className="text-[10px] text-primary-container bg-primary-container/10 px-2 py-1 rounded-full uppercase tracking-widest font-semibold inline-block mb-2">
              {format(new Date(), "EEEE", { locale: it })}
            </span>
            {isLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Caricamento workout…</span>
              </div>
            ) : workout ? (
              <>
                <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">
                  {workout.title}
                </h2>
                <div className="flex flex-wrap gap-4 mt-4">
                  <span className="text-sm text-secondary flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {workout.estimatedDuration ?? 60} Min Est.
                  </span>
                  <span className="text-sm text-secondary flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {workout.exerciseCount} Esercizi
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">
                  Nessun allenamento programmato
                </h2>
                <p className="text-sm text-secondary mt-2">
                  Avvia un allenamento libero o contatta il tuo coach.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Glance Cards Grid */}
        <section className="grid grid-cols-2 gap-4">
          {/* Carico Sett. */}
          <div className="bg-white/[0.7] rounded-2xl p-4 flex flex-col justify-between h-36 border border-surface-variant">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                Carico Sett.
              </span>
              <BarChart className="w-4 h-4 text-secondary" />
            </div>
            <div className="font-display text-xl font-bold text-primary">
              {weeklyTonnage !== null ? `${weeklyTonnage.toLocaleString("it-IT")} AU` : "—"}
            </div>
            <div className="flex items-end gap-1 h-6">
              {[30, 50, 40, 70, 90].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 bg-primary-container/70 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Prontezza */}
          <div className="bg-white/[0.7] rounded-2xl p-4 flex flex-col justify-between h-36 border border-surface-variant">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                Prontezza
              </span>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <circle cx="12" cy="12" r="9" fill="none" className="stroke-surface-variant" strokeWidth="3" />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="3"
                  strokeDasharray="56.5"
                  strokeDashoffset="8.5"
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
            </div>
            <div className="font-display text-xl font-bold text-primary">{readinessLabel}</div>
            <div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                {acwr?.ratio !== null && acwr?.ratio !== undefined ? `ACWR ${acwr.ratio.toFixed(2)}` : "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Fasi dell'Allenamento */}
        <section>
          <div className="font-display font-bold text-lg text-primary flex justify-between items-center mb-3">
            <span>Fasi dell'Allenamento</span>
            <ChevronsUpDown className="w-5 h-5 text-secondary" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-on-surface-variant">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : phases ? (
            <div className="space-y-2">
              {phases.map(({ icon: Icon, title, subtitle, active }) => (
                <div
                  key={title}
                  className={`bg-white rounded-2xl p-4 flex items-center justify-between border-l-2 ${
                    active ? "border-l-primary-container" : "border-l-surface-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        active
                          ? "bg-primary-container/10 text-primary-container"
                          : "bg-surface-container text-primary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{title}</p>
                      <p className="text-xs text-secondary">{subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-surface-variant">
              <p className="text-sm text-on-surface-variant">Nessuna fase disponibile.</p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom CTA */}
      <button
        onClick={handleStart}
        disabled={!workout || isLoading}
        className="fixed bottom-24 w-[calc(100%-48px)] max-w-md mx-auto left-0 right-0 py-5 bg-[#001e2d] text-white rounded-[20px] font-display font-bold text-lg shadow-2xl flex items-center justify-center gap-3 z-40 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {isLoading ? "Caricamento…" : workout ? "Inizia Allenamento" : "Nessun allenamento"}
        <PlayCircle className="w-6 h-6" />
      </button>

      <AthleteBottomNav />
    </div>
  );
}
