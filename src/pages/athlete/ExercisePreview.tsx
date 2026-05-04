import { useMemo } from "react";
import { ArrowLeft, MoreVertical, Play, MessageSquare, Lock, PlayCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";

const ExercisePreview = () => {
  const navigate = useNavigate();
  const { workout, isLoading } = useTodaysWorkout();
  const startSession = useActiveSessionStore((s) => s.startSession);

  // Use the first exercise of the day as the previewed one (entry point from Today's plan).
  const exercise = workout?.structure?.[0] ?? null;

  const exerciseNames = useMemo(
    () => (exercise?.name ? [exercise.name] : []),
    [exercise?.name],
  );
  const { data: historyMap } = useExerciseHistory(exerciseNames);
  const lastPerf = exercise?.name ? historyMap?.[exercise.name] : null;
  const prevLabel = lastPerf
    ? `${lastPerf.weight_kg}kg x ${lastPerf.reps}`
    : "—";

  const plannedSets = exercise?.sets ?? 3;
  const repsTarget = exercise?.reps ? `${exercise.reps} reps` : `${plannedSets} set`;
  const previewRows = Array.from({ length: plannedSets }, (_, i) => ({
    id: i + 1,
    target: repsTarget,
    prev: prevLabel,
  }));

  const title = exercise
    ? `A1. ${exercise.name}`
    : isLoading
    ? "Caricamento..."
    : "Nessun esercizio disponibile";
  const coachNote =
    (exercise as any)?.notes ??
    "Mantieni esecuzione controllata e tecnica pulita.";

  const handleStart = () => {
    if (!workout) return;
    startSession(crypto.randomUUID(), workout.id);
    navigate("/athlete/exercise-execution");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 -ml-2 rounded-full active:bg-surface-container transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="size-5 text-on-surface" />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface">
          Anteprima Esercizio
        </h1>
        <button
          className="flex items-center justify-center w-9 h-9 -mr-2 rounded-full active:bg-surface-container transition-colors"
          aria-label="Altre opzioni"
        >
          <MoreVertical className="size-5 text-on-surface" />
        </button>
      </header>

      <main className="pt-24 pb-48 px-6 max-w-md mx-auto flex flex-col gap-6">
        {/* Video Placeholder */}
        <div className="w-full aspect-video rounded-[32px] bg-surface-container relative flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop"
            alt="Anteprima esercizio"
            className="absolute inset-0 object-cover w-full h-full"
            loading="lazy"
          />
          <button
            className="relative z-10 w-16 h-16 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Riproduci video"
          >
            <Play className="text-primary fill-current ml-0.5" size={26} />
          </button>
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold text-on-surface flex items-center gap-2">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant" />}
          {title}
        </h2>

        {/* Coach Notes */}
        <div className="bg-surface-container-low/50 rounded-3xl p-5 border-l-4 border-primary shadow-sm">
          <MessageSquare className="text-primary mb-2 size-5" />
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
            Note del Coach
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed">{coachNote}</p>
        </div>

        {/* Preview Mode Banner */}
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-3">
          <Lock className="text-primary size-5 shrink-0" />
          <p className="text-xs font-semibold text-primary leading-relaxed">
            Modalità Anteprima. Avvia l'allenamento per registrare i tuoi set.
          </p>
        </div>

        {/* Logging Table (Preview State) */}
        <div>
          <div className="grid grid-cols-[30px_1fr_1fr_60px_60px] gap-2 px-2 pb-2 border-b border-surface-variant">
            <span className="text-[10px] text-outline font-bold uppercase text-center">Set</span>
            <span className="text-[10px] text-outline font-bold uppercase text-center">Target</span>
            <span className="text-[10px] text-outline font-bold uppercase text-center">Prec.</span>
            <span className="text-[10px] text-outline font-bold uppercase text-center">Kg</span>
            <span className="text-[10px] text-outline font-bold uppercase text-center">Reps</span>
          </div>

          {!exercise && !isLoading ? (
            <p className="text-sm text-on-surface-variant text-center py-8">
              Nessun dato disponibile.
            </p>
          ) : (
            previewRows.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[30px_1fr_1fr_60px_60px] gap-2 items-center px-2 py-4"
              >
                <span className="text-xs font-bold text-outline text-center">{s.id}</span>
                <span className="text-sm text-outline text-center">{s.target}</span>
                <span className="text-sm text-outline text-center">{s.prev}</span>
                <div className="h-10 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 flex items-center justify-center text-outline">
                  -
                </div>
                <div className="h-10 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50 flex items-center justify-center text-outline">
                  -
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-50 flex flex-col gap-4 pb-10">
        <button
          onClick={handleStart}
          disabled={!workout}
          className="w-full max-w-md mx-auto bg-primary-container text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-60"
        >
          <PlayCircle className="size-5" />
          Inizia Allenamento Ora
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full text-secondary font-bold text-sm py-2 flex items-center justify-center uppercase tracking-wider"
        >
          Chiudi Anteprima
        </button>
      </div>
    </div>
  );
};

export default ExercisePreview;
