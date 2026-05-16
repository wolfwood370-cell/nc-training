// =============================================================================
// src/pages/athlete/ActiveWorkout.tsx
// =============================================================================
// Phase 7 — The Active Workout Hub.
//
// A full-screen focus-mode overlay (z-50) that hides the global
// BottomNavBar. Adapted from active_workout_hub.html.
//
// Composition:
//   - <GlobalTimerHUD> — sticky top bar with X (opens the friction
//     modal), centered live MM:SS timer + pulsing red dot, overflow
//     menu placeholder, thin progress bar across the bottom edge.
//   - <CompletedPhase> — first section, opacity-60, green check, all
//     exercises rendered with line-through.
//   - <ActivePhase> — numbered phase badge + the currently-active
//     exercise card (segmented set pills + "current set target")
//     followed by upcoming exercise cards.
//   - <BottomActionBar> — sticky glass strip with a 70/30 split:
//     Pause/Resume toggle (wider) + Termina (narrower, opens dialog).
//   - <ExitWorkoutDialog> — friction modal shown when the user taps X
//     or Termina. Resume closes; Finish/Discard navigate to
//     /athlete/training with a toast.
//
// Timer: pure useEffect + setInterval, paused via local boolean.
// Cleanup on unmount via the effect's return.
//
// Mount: SIBLING of <AthleteLayout> at /athlete/workout. The wrapper
// uses `fixed inset-0 z-50` per brief, so even if it were nested under
// the layout the global nav would be obscured anyway — but mounting it
// outside the layout subtree is the architecturally honest choice for
// "stack-pushed full-screen flow" pages.
//
// No Supabase wiring. Backend integration lands in the next commit.
// =============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  CheckCircle2,
  Dumbbell,
  Info,
  MoreVertical,
  Pause,
  Play,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExitWorkoutDialog } from "@/components/athlete/ExitWorkoutDialog";

// =============================================================================
// Domain types
// =============================================================================
interface CompletedExercise {
  id: string;
  name: string;
  scheme: string;
}

interface UpcomingExercise {
  id: string;
  code: string;
  name: string;
  /** "0/3 Sets" — pre-rendered for display only. */
  setsLabel: string;
}

interface ActiveExercise {
  code: string;
  name: string;
  totalSets: number;
  completedSets: number;
  currentSet: {
    index: number;
    reps: number;
    weightKg: number;
  };
}

// =============================================================================
// Mock data — single source of truth for this page.
// =============================================================================
const COMPLETED_PHASE = {
  name: "Movement Prep",
  exercises: [
    { id: "warm_1", name: "90/90 Stretch", scheme: "2 set × 10 reps per lato" },
    { id: "warm_2", name: "Cat-Cow", scheme: "1 set × 15 reps" },
  ] as CompletedExercise[],
};

const ACTIVE_EXERCISE: ActiveExercise = {
  code: "A1",
  name: "Barbell Back Squat",
  totalSets: 4,
  completedSets: 2,
  currentSet: { index: 3, reps: 8, weightKg: 100 },
};

const UPCOMING: UpcomingExercise[] = [
  { id: "b1", code: "B1", name: "Romanian Deadlift", setsLabel: "0/3 Set" },
  { id: "b2", code: "B2", name: "Weighted Pull-ups", setsLabel: "0/3 Set" },
];

// Progress bar (% of session completed) — driven from mock for now.
const SESSION_PROGRESS_PERCENT = 30;

// =============================================================================
// formatMMSS — shared with the dialog component.
// =============================================================================
function formatMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// =============================================================================
// GlobalTimerHUD — sticky top header with the live MM:SS timer.
// =============================================================================
function GlobalTimerHUD({
  seconds,
  isPaused,
  onExit,
  onMenu,
}: {
  seconds: number;
  isPaused: boolean;
  onExit: () => void;
  onMenu: () => void;
}) {
  return (
    <header
      className={cn(
        "shrink-0 z-30",
        "backdrop-blur-xl bg-white/90",
        "border-b border-[#c0c7d0]/30",
      )}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Apri il menu di uscita allenamento"
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center text-on-surface",
            "transition-colors hover:bg-surface-container/60",
            "active:scale-95",
          )}
        >
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
            Workout in corso
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full",
                isPaused ? "bg-on-surface-variant/40" : "bg-error animate-pulse",
              )}
            />
            <span
              role="timer"
              aria-live="off"
              className="font-display text-2xl font-semibold tabular-nums tracking-tight text-brand-container"
            >
              {formatMMSS(seconds)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onMenu}
          aria-label="Altre opzioni"
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center text-on-surface",
            "transition-colors hover:bg-surface-container/60",
            "active:scale-95",
          )}
        >
          <MoreVertical
            className="h-5 w-5"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Session progress bar */}
      <div
        role="progressbar"
        aria-valuenow={SESSION_PROGRESS_PERCENT}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avanzamento sessione"
        className="h-1 w-full bg-surface-container/60"
      >
        <div
          className="h-full bg-brand-container transition-[width] duration-300"
          style={{ width: `${SESSION_PROGRESS_PERCENT}%` }}
        />
      </div>
    </header>
  );
}

// =============================================================================
// CompletedPhase — first section, dimmed.
// =============================================================================
function CompletedPhase() {
  return (
    <section
      aria-label={`Fase 1: ${COMPLETED_PHASE.name} (completata)`}
      className="opacity-60"
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center"
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <h2 className="font-display text-base font-bold tracking-tight text-on-surface">
          Fase 1: {COMPLETED_PHASE.name}
        </h2>
      </div>

      <div
        className={cn(
          "rounded-3xl",
          "bg-white border border-[#c0c7d0]/30",
          "divide-y divide-[#c0c7d0]/20",
        )}
      >
        {COMPLETED_PHASE.exercises.map((ex) => (
          <div key={ex.id} className="px-5 py-4">
            <h3 className="font-display text-sm font-semibold text-on-surface line-through">
              {ex.name}
            </h3>
            <p className="mt-0.5 font-sans text-xs text-on-surface-variant">
              {ex.scheme}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// ActiveExerciseCard — focal card for the in-progress exercise.
// =============================================================================
function ActiveExerciseCard({ exercise }: { exercise: ActiveExercise }) {
  return (
    <article
      aria-label={`Esercizio attivo: ${exercise.code}. ${exercise.name}`}
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white border border-brand-container/40",
        "border-l-4 border-l-brand-container",
        "shadow-[0_4px_24px_rgba(34,111,163,0.08)]",
      )}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-bold text-on-surface leading-tight">
            <span className="text-brand-container mr-1">{exercise.code}.</span>
            {exercise.name}
          </h3>
          <p className="mt-1 font-sans text-xs font-semibold tracking-wide text-brand-container">
            {exercise.completedSets}/{exercise.totalSets} serie completate
          </p>
        </div>
        <button
          type="button"
          aria-label="Dettagli esercizio"
          className="h-8 w-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container/60 transition-colors"
        >
          <Info className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Pill segments — one per set, filled for completed */}
      <div
        role="group"
        aria-label="Avanzamento serie"
        className="flex gap-2 mb-5"
      >
        {Array.from({ length: exercise.totalSets }).map((_, i) => {
          const isDone = i < exercise.completedSets;
          return (
            <div
              key={i}
              aria-label={`Serie ${i + 1}${isDone ? " completata" : " in attesa"}`}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                isDone ? "bg-brand-container" : "bg-surface-container",
              )}
            />
          );
        })}
      </div>

      {/* Current set target */}
      <div className="rounded-2xl p-4 bg-surface-container/50 flex items-center justify-between gap-3">
        <div>
          <span className="font-sans text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
            Set {exercise.currentSet.index} · Obiettivo
          </span>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-on-surface">
            {exercise.currentSet.reps}
            <span className="ml-1 text-base font-normal text-on-surface-variant">
              reps
            </span>
            <span className="mx-2 text-base font-normal text-on-surface-variant">
              @
            </span>
            {exercise.currentSet.weightKg}
            <span className="ml-1 text-base font-normal text-on-surface-variant">
              kg
            </span>
          </p>
        </div>
        <Dumbbell
          className="h-8 w-8 text-brand-container/30 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

// =============================================================================
// UpcomingExerciseCard — compact card for queued exercises.
// =============================================================================
function UpcomingExerciseCard({ exercise }: { exercise: UpcomingExercise }) {
  return (
    <article
      aria-label={`Prossimo: ${exercise.code}. ${exercise.name}`}
      className={cn(
        "rounded-3xl p-5",
        "bg-white border border-[#c0c7d0]/30",
        "flex items-center justify-between gap-3",
      )}
    >
      <div className="min-w-0">
        <h3 className="font-display text-sm font-semibold text-on-surface truncate">
          <span className="text-brand-container mr-1">{exercise.code}.</span>
          {exercise.name}
        </h3>
        <p className="mt-1 font-sans text-xs text-on-surface-variant">
          {exercise.setsLabel}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Riordina ${exercise.name}`}
        className="h-9 w-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container/60 transition-colors active:scale-95"
      >
        <ArrowUpDown className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </button>
    </article>
  );
}

// =============================================================================
// ActivePhase — section containing the focal exercise + upcoming queue.
// =============================================================================
function ActivePhase() {
  return (
    <section aria-label="Fase 2: Main Session (attiva)">
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full bg-brand-container text-white flex items-center justify-center font-display text-xs font-bold tabular-nums"
        >
          2
        </span>
        <h2 className="font-display text-base font-bold tracking-tight text-on-surface">
          Fase 2: Main Session
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <ActiveExerciseCard exercise={ACTIVE_EXERCISE} />
        {UPCOMING.map((ex) => (
          <UpcomingExerciseCard key={ex.id} exercise={ex} />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// BottomActionBar — sticky glass strip with 70/30 split.
// =============================================================================
function BottomActionBar({
  isPaused,
  onTogglePause,
  onFinishRequest,
}: {
  isPaused: boolean;
  onTogglePause: () => void;
  onFinishRequest: () => void;
}) {
  return (
    <div
      className={cn(
        "shrink-0 z-30",
        "backdrop-blur-2xl bg-white/90",
        "border-t border-[#c0c7d0]/30",
        "px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-3">
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={isPaused ? "Riprendi il timer" : "Metti in pausa il timer"}
          className={cn(
            "flex-[7] py-4 rounded-full",
            "flex items-center justify-center gap-2",
            "bg-surface-container text-on-surface",
            "font-display text-sm font-bold tracking-wide",
            "transition-colors hover:bg-surface-variant/60",
            "active:scale-[0.98] transition-transform duration-200",
          )}
        >
          {isPaused ? (
            <>
              <Play
                className="h-5 w-5 fill-on-surface"
                strokeWidth={0}
                aria-hidden="true"
              />
              Riprendi
            </>
          ) : (
            <>
              <Pause
                className="h-5 w-5 fill-on-surface"
                strokeWidth={0}
                aria-hidden="true"
              />
              Pausa
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onFinishRequest}
          className={cn(
            "flex-[3] py-4 rounded-full",
            "bg-on-surface text-white",
            "font-display text-sm font-bold tracking-wide",
            "shadow-[0_4px_14px_rgba(0,30,45,0.25)]",
            "transition-all duration-200",
            "hover:brightness-110 active:scale-[0.98]",
          )}
        >
          Termina
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ActiveWorkout — page composition.
// =============================================================================
export default function ActiveWorkout() {
  const navigate = useNavigate();

  // Local state — timer (seconds), pause flag, dialog visibility.
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);

  // Timer — ticks 1Hz while !isPaused. Cleanup on unmount or pause.
  useEffect(() => {
    if (isPaused) return undefined;
    const id = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPaused]);

  // -- Handlers -------------------------------------------------------------
  const openExitDialog = () => setIsExitOpen(true);
  const handleResume = () => setIsExitOpen(false);

  const handleFinish = () => {
    setIsExitOpen(false);
    toast.success("Sessione salvata", {
      description: `Allenamento terminato dopo ${formatMMSS(seconds)}.`,
    });
    navigate("/athlete/training");
  };

  const handleDiscard = () => {
    setIsExitOpen(false);
    toast("Allenamento annullato", {
      description: "I dati di questa sessione non sono stati salvati.",
    });
    navigate("/athlete/training");
  };

  const handleMenu = () => {
    toast.message("Opzioni in arrivo", {
      description: "Riordino esercizi, swap, note coach — prossimo step.",
    });
  };

  return (
    <>
      {/* Full-screen overlay — sits above the global BottomNavBar (z-50).
          flex flex-col + sticky-ish header/footer via shrink-0 inside a
          flex parent gives a clean three-band layout where only <main>
          scrolls. */}
      <div
        role="region"
        aria-label="Allenamento in corso"
        className={cn(
          "fixed inset-0 z-50",
          "bg-surface text-on-surface font-sans antialiased",
          "flex flex-col",
        )}
      >
        <GlobalTimerHUD
          seconds={seconds}
          isPaused={isPaused}
          onExit={openExitDialog}
          onMenu={handleMenu}
        />

        <main className="flex-1 overflow-y-auto px-5 py-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
          <CompletedPhase />
          <ActivePhase />
        </main>

        <BottomActionBar
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          onFinishRequest={openExitDialog}
        />
      </div>

      {/* Friction modal — sits at z-[60] above the workout overlay. */}
      <ExitWorkoutDialog
        open={isExitOpen}
        timerSeconds={seconds}
        onResume={handleResume}
        onFinish={handleFinish}
        onDiscard={handleDiscard}
      />
    </>
  );
}
