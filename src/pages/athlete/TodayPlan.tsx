import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  Clock,
  Zap,
  MoreHorizontal,
  Play,
  Loader2,
} from "lucide-react";
import { format, addDays, startOfWeek, isToday, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import type { WorkoutStructureExercise } from "@/types/database";

// Italian one-letter weekday symbols (Mon → Sun)
const DAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];

function buildWeek() {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return {
      letter: DAY_LETTERS[i],
      num: d.getDate(),
      active: isToday(d),
      future: isAfter(d, today) && !isToday(d),
    };
  });
}

// Heuristic to classify warmup vs. main work
function isWarmup(ex: WorkoutStructureExercise): boolean {
  const blob = `${ex.name ?? ""} ${ex.notes ?? ""}`.toLowerCase();
  return /(warm[\s-]?up|riscald|stretch|foam|mobility|mobil|attivaz)/.test(blob);
}

function exerciseMeta(ex: WorkoutStructureExercise): string {
  const sets = ex.sets ? `${ex.sets} Serie` : "";
  const reps = ex.reps ? `x ${ex.reps} Reps` : "";
  return [sets, reps].filter(Boolean).join(" ").trim() || "—";
}

export default function TodayPlan() {
  const navigate = useNavigate();
  const { workout, isLoading } = useTodaysWorkout();

  const week = useMemo(buildWeek, []);

  const { warmup, main } = useMemo(() => {
    const list = workout?.structure ?? [];
    return {
      warmup: list.filter(isWarmup),
      main: list.filter((ex) => !isWarmup(ex)),
    };
  }, [workout?.structure]);

  const phaseCount = (warmup.length > 0 ? 1 : 0) + (main.length > 0 ? 1 : 0);
  const dateLabel = format(new Date(), "EEEE d MMMM", { locale: it });

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface">
          Piano di Oggi
        </h1>
        <button
          className="text-on-surface p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-24 pb-40 px-6 max-w-md mx-auto flex flex-col gap-6">
        {/* Micro-Week Strip */}
        <section className="flex justify-between items-center">
          {week.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 ${
                d.future ? "opacity-50" : ""
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  d.active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {d.letter}
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  d.active
                    ? "bg-primary-container text-white shadow-[0_4px_20px_rgba(34,111,163,0.3)]"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {d.num}
              </div>
            </div>
          ))}
        </section>

        {/* Hero Summary Card */}
        <section className="bg-white rounded-[32px] p-6 flex flex-col gap-4 border border-surface-variant shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Caricamento piano...</span>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold text-on-surface">
                {workout?.title ?? `Riposo - ${dateLabel}`}
              </h2>
              <div className="flex flex-wrap items-center gap-2 font-semibold text-xs text-on-surface-variant uppercase tracking-widest">
                {workout?.estimatedDuration ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {workout.estimatedDuration} Min Stima
                    </span>
                    <span>&bull;</span>
                  </>
                ) : null}
                <span className="flex items-center gap-1">
                  <Zap size={16} />
                  {workout ? "Sessione Programmata" : "Nessuna sessione"}
                </span>
                {phaseCount > 0 && (
                  <>
                    <span>&bull;</span>
                    <span>{phaseCount} Fasi</span>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        {/* Workout Blueprint */}
        <section className="flex flex-col gap-8">
          {/* Fase 1 - Riscaldamento */}
          {warmup.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 font-semibold text-on-surface">
                <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs">
                  1
                </span>
                Fase 1: Riscaldamento
              </div>
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container ml-3">
                {warmup.map((ex, i) => (
                  <div
                    key={ex.id ?? `wu-${i}`}
                    className="bg-white rounded-xl p-4 flex justify-between items-center border border-surface-variant"
                  >
                    <span className="text-on-surface text-sm">{ex.name}</span>
                    <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">
                      {exerciseMeta(ex)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fase 2 - Sessione Principale */}
          {main.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4 font-semibold text-on-surface">
                <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs">
                  {warmup.length > 0 ? 2 : 1}
                </span>
                Fase {warmup.length > 0 ? 2 : 1}: Sessione Principale
              </div>
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container ml-3">
                {main.map((ex, i) => {
                  const code = `${String.fromCharCode(65 + i)}1.`;
                  return (
                    <div
                      key={ex.id ?? `m-${i}`}
                      className="bg-white rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden border border-surface-variant"
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container" />
                      <div className="flex justify-between items-start pl-2">
                        <span className="font-semibold text-on-surface text-sm">
                          <span className="text-primary-container mr-1">
                            {code}
                          </span>
                          {ex.name}
                        </span>
                        <button
                          className="text-on-surface-variant -mt-1 -mr-1 p-1"
                          aria-label="Altre opzioni"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-on-surface-variant pl-2">
                        {exerciseMeta(ex)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && !workout && (
            <div className="text-center py-8 text-sm text-on-surface-variant">
              Nessun allenamento programmato per oggi.
            </div>
          )}
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center gap-3 z-40 pb-10">
        <button
          onClick={() => navigate("/athlete/active-workout")}
          disabled={!workout}
          className="w-full max-w-md bg-primary-container text-white rounded-full py-4 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          <Play className="w-5 h-5 fill-current" />
          Inizia Allenamento
        </button>
        <p className="text-xs font-semibold text-on-surface-variant opacity-70 text-center">
          Tocca un esercizio sopra per l'anteprima dei dettagli.
        </p>
      </div>
    </div>
  );
}
