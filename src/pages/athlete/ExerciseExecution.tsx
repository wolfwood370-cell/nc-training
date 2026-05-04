import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X, MoreVertical, Play, Headset, Check, Plus, Loader2 } from "lucide-react";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";
import { useSetMutation } from "@/hooks/useSetMutation";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";
import type { WorkoutStructureExercise } from "@/types/database";

interface SetRow {
  id: number;
  prev: string;
  kg: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

function exerciseKey(ex: WorkoutStructureExercise | null, idx: number): string {
  return ex?.id ?? `${ex?.name ?? "exercise"}-${idx}`;
}

export default function ExerciseExecution() {
  const navigate = useNavigate();
  const { workout, isLoading } = useTodaysWorkout();
  const currentIndex = useActiveSessionStore((s) => s.currentExerciseIndex);
  const sessionLogs = useActiveSessionStore((s) => s.sessionLogs);
  const setMutation = useSetMutation();

  // Resolve current exercise from the day's structure
  const exercise: WorkoutStructureExercise | null = useMemo(() => {
    const list = workout?.structure ?? [];
    if (!list.length) return null;
    return list[Math.min(currentIndex, list.length - 1)] ?? null;
  }, [workout?.structure, currentIndex]);

  const exId = useMemo(() => exerciseKey(exercise, currentIndex), [exercise, currentIndex]);
  const plannedSets = exercise?.sets ?? 4;

  // Last performance lookup
  const exerciseNames = useMemo(
    () => (exercise?.name ? [exercise.name] : []),
    [exercise?.name]
  );
  const { data: historyMap } = useExerciseHistory(exerciseNames);
  const lastPrev = exercise?.name ? historyMap?.[exercise.name] : null;
  const prevLabel = lastPrev
    ? `${lastPrev.weight_kg}kg x ${lastPrev.reps}`
    : "—";

  // Local row state — hydrated from store + planned sets
  const [sets, setSets] = useState<SetRow[]>([]);

  useEffect(() => {
    if (!exercise) return;
    const stored = sessionLogs[exId] ?? [];
    const rows: SetRow[] = Array.from({ length: plannedSets }, (_, i) => {
      const log = stored.find((l) => l.setIndex === i);
      return {
        id: i + 1,
        prev: prevLabel,
        kg: log?.actualKg ?? "",
        reps: log?.actualReps ?? "",
        rpe: log?.rpe ?? "",
        completed: log?.completed ?? false,
      };
    });
    setSets(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exId, plannedSets, prevLabel]);

  const updateField = (
    id: number,
    field: keyof Pick<SetRow, "kg" | "reps" | "rpe">
  ) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
    const setIndex = id - 1;
    const dbField = field === "kg" ? "actualKg" : field === "reps" ? "actualReps" : "rpe";
    setMutation.mutate({ exerciseId: exId, setIndex, field: dbField, value });
  };

  const toggleCompleted = (id: number) => {
    const setIndex = id - 1;
    const next = !sets.find((s) => s.id === id)?.completed;
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: next } : s))
    );
    setMutation.mutate({
      exerciseId: exId,
      setIndex,
      field: "completed",
      value: next,
    });
  };

  const addSet = () => {
    setSets((prev) => [
      ...prev,
      {
        id: (prev[prev.length - 1]?.id ?? 0) + 1,
        prev: prevLabel,
        kg: "",
        reps: "",
        rpe: "",
        completed: false,
      },
    ]);
  };

  // The active row is the first non-completed row
  const activeId = sets.find((s) => !s.completed)?.id ?? -1;

  const title = exercise?.name
    ? `${String.fromCharCode(65 + currentIndex)}1. ${exercise.name}`
    : isLoading
    ? "Caricamento..."
    : "Esercizio";
  const phaseLabel = exercise
    ? `Fase: Sessione • ${
        exercise.reps ? `Reps: ${exercise.reps}` : `Serie: ${plannedSets}`
      }`
    : "—";
  const coachNotes =
    exercise?.notes ??
    "Nessuna nota dal coach per questo esercizio. Mantieni esecuzione controllata e tecnica pulita.";

  return (
    <div className="h-screen w-full flex flex-col justify-end overflow-hidden bg-surface relative">
      {/* Fake background header */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 h-16 z-30">
        <button
          onClick={() => navigate(-1)}
          className="text-primary p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-primary font-bold tracking-widest text-xs uppercase">
          Workout Hub
        </span>
        <button
          className="text-primary p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Altre opzioni"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Dim overlay */}
      <div className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-40" />

      {/* Drawer */}
      <div className="relative z-50 w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[90vh] overflow-hidden border-t border-white/50">
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-6">
          {/* Video & Header */}
          <div>
            <div className="relative w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center group">
              {/* TODO: Connect to backend — exercise videoUrl thumbnail */}
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
                alt="Anteprima esercizio"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <button
                className="absolute w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Riproduci video"
              >
                <Play className="w-6 h-6 text-primary-container fill-current ml-0.5" />
              </button>
            </div>
            <h2 className="font-display text-2xl font-bold text-on-surface mt-4">
              {isLoading ? (
                <span className="inline-flex items-center gap-2 text-on-surface-variant">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Caricamento...
                </span>
              ) : (
                title
              )}
            </h2>
            <p className="text-[10px] text-secondary uppercase tracking-widest font-semibold mt-1">
              {phaseLabel}
            </p>
          </div>

          {/* Coach's Notes */}
          <div className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary-container shadow-sm">
            <div className="text-xs text-on-surface uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
              <Headset className="w-4 h-4" />
              Note del Coach
            </div>
            <p className="text-sm text-on-surface leading-relaxed">
              {coachNotes}
            </p>
          </div>

          {/* Logging Table */}
          <div>
            {/* Header */}
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-2 px-2 items-end mb-2">
              <span className="text-[10px] text-secondary uppercase font-semibold">
                Set
              </span>
              <span className="text-[10px] text-secondary uppercase font-semibold">
                Prec.
              </span>
              <span className="text-[10px] text-secondary uppercase font-semibold text-center">
                Kg
              </span>
              <span className="text-[10px] text-secondary uppercase font-semibold text-center">
                Reps
              </span>
              <span className="text-[10px] text-secondary uppercase font-semibold text-center">
                RPE
              </span>
              <Check className="w-4 h-4 text-secondary" />
            </div>

            <div className="space-y-2">
              {sets.map((s, idx) => {
                const isActive = s.id === activeId && !s.completed;
                const rowBase =
                  "grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-2 items-center p-2";
                const rowStyle = s.completed
                  ? `${rowBase} bg-primary-container/10 rounded-xl`
                  : isActive
                  ? `${rowBase} bg-white rounded-xl border border-surface-variant`
                  : `${rowBase} bg-white rounded-xl border border-surface-variant`;

                const inputBase =
                  "h-9 text-center text-sm rounded-lg outline-none transition-colors w-full";
                const completedInput = `${inputBase} bg-white/50 text-on-surface-variant`;
                const activeFocusInput = `${inputBase} bg-white border border-primary-container shadow-sm focus:ring-2 focus:ring-primary-container`;
                const activeIdleInput = `${inputBase} bg-surface-container-low border border-transparent focus:bg-white focus:border-primary-container`;

                return (
                  <div key={s.id} className={rowStyle}>
                    <span className="text-sm font-semibold text-on-surface text-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {s.prev}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.kg}
                      onChange={updateField(s.id, "kg")}
                      disabled={s.completed}
                      placeholder="—"
                      className={
                        s.completed
                          ? completedInput
                          : isActive
                          ? activeFocusInput
                          : activeIdleInput
                      }
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={s.reps}
                      onChange={updateField(s.id, "reps")}
                      disabled={s.completed}
                      placeholder="—"
                      className={
                        s.completed ? completedInput : activeIdleInput
                      }
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={s.rpe}
                      onChange={updateField(s.id, "rpe")}
                      disabled={s.completed}
                      placeholder="—"
                      className={
                        s.completed ? completedInput : activeIdleInput
                      }
                    />
                    <button
                      onClick={() => toggleCompleted(s.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        s.completed
                          ? "bg-primary-container text-white shadow-sm"
                          : "border-2 border-outline-variant/60 text-transparent hover:border-primary-container"
                      }`}
                      aria-label={
                        s.completed ? "Annulla completamento" : "Completa set"
                      }
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addSet}
              className="w-full mt-4 py-3 bg-surface-container-low text-primary-container font-semibold text-xs rounded-xl flex items-center justify-center gap-1 uppercase tracking-wider hover:bg-surface-container transition-colors"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
