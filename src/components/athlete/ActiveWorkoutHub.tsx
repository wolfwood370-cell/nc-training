import { useState } from "react";
import {
  X,
  MoreVertical,
  CheckCircle2,
  Info,
  Dumbbell,
  ArrowUpDown,
  Play,
} from "lucide-react";

// ---------- Types ----------
type ExerciseStatus = "completed" | "active" | "upcoming";

interface ExerciseSet {
  reps: number;
  weightKg?: number;
  completed: boolean;
}

interface Exercise {
  id: string;
  code: string; // "A1", "B1"...
  name: string;
  sets: ExerciseSet[];
  status: ExerciseStatus;
  perSide?: boolean;
}

interface WorkoutPhase {
  id: string;
  index: number;
  title: string;
  status: ExerciseStatus;
  exercises: Exercise[];
}

interface ActiveWorkoutHubData {
  elapsed: string; // "12:45"
  progressPct: number; // 0..100
  resumeLabel: string;
  phases: WorkoutPhase[];
}

// ---------- Tokens ----------
const PRIMARY_CONTAINER = "#226FA3";
const INK = "#043555";
const MUTED = "#50768E";
const OUTLINE = "#717880";
const SUCCESS = "#10B981";
const SURFACE_LOW = "#EAF5FF";
const PILL_EMPTY = "#F1F5F9";

// ---------- Mock data ----------
const mockData: ActiveWorkoutHubData = {
  elapsed: "12:45",
  progressPct: 30,
  resumeLabel: "Resume A1. Back Squat",
  phases: [
    {
      id: "phase-1",
      index: 1,
      title: "Fase 1: Movement Prep",
      status: "completed",
      exercises: [
        {
          id: "ex-90-90",
          code: "",
          name: "90/90 Stretch",
          status: "completed",
          perSide: true,
          sets: [
            { reps: 10, completed: true },
            { reps: 10, completed: true },
          ],
        },
        {
          id: "ex-cat-cow",
          code: "",
          name: "Cat-Cow",
          status: "completed",
          sets: [{ reps: 15, completed: true }],
        },
      ],
    },
    {
      id: "phase-2",
      index: 2,
      title: "Fase 2: Main Session",
      status: "active",
      exercises: [
        {
          id: "ex-squat",
          code: "A1",
          name: "Barbell Back Squat",
          status: "active",
          sets: [
            { reps: 8, weightKg: 100, completed: true },
            { reps: 8, weightKg: 100, completed: true },
            { reps: 8, weightKg: 100, completed: false },
            { reps: 8, weightKg: 100, completed: false },
          ],
        },
        {
          id: "ex-rdl",
          code: "B1",
          name: "Romanian Deadlift",
          status: "upcoming",
          sets: [
            { reps: 10, completed: false },
            { reps: 10, completed: false },
            { reps: 10, completed: false },
          ],
        },
        {
          id: "ex-pullups",
          code: "B2",
          name: "Weighted Pull-ups",
          status: "upcoming",
          sets: [
            { reps: 6, completed: false },
            { reps: 6, completed: false },
            { reps: 6, completed: false },
          ],
        },
      ],
    },
  ],
};

// ---------- Helpers ----------
function formatSetsLabel(ex: Exercise): string {
  const total = ex.sets.length;
  const completed = ex.sets.filter((s) => s.completed).length;
  if (ex.status === "completed") {
    const reps = ex.sets[0]?.reps ?? 0;
    const setsLabel = total === 1 ? "Set" : "Sets";
    return `${total} ${setsLabel} x ${reps} Reps${ex.perSide ? " per side" : ""}`;
  }
  if (ex.status === "active") {
    return `${completed}/${total} Sets Completed`;
  }
  return `${completed}/${total} Sets`;
}

// ---------- Subcomponents ----------
function PhaseHeader({ phase }: { phase: WorkoutPhase }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {phase.status === "completed" ? (
        <span
          className="flex items-center justify-center rounded-full p-1"
          style={{ background: `${SUCCESS}1A`, color: SUCCESS }}
        >
          <CheckCircle2 className="h-5 w-5" />
        </span>
      ) : (
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ background: PRIMARY_CONTAINER }}
        >
          {phase.index}
        </span>
      )}
      <h2
        className="font-[Manrope] text-2xl font-semibold tracking-tight"
        style={{ color: INK }}
      >
        {phase.title}
      </h2>
    </div>
  );
}

function CompletedExerciseRow({
  ex,
  isLast,
}: {
  ex: Exercise;
  isLast: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center ${
        isLast ? "" : "pb-4 border-b"
      }`}
      style={isLast ? {} : { borderColor: "rgba(192,199,208,0.3)" }}
    >
      <div>
        <h3
          className="text-base font-semibold line-through"
          style={{ color: OUTLINE }}
        >
          {ex.name}
        </h3>
        <p className="text-xs font-semibold mt-1" style={{ color: OUTLINE }}>
          {formatSetsLabel(ex)}
        </p>
      </div>
    </div>
  );
}

function ActiveExerciseCard({ ex }: { ex: Exercise }) {
  const completedCount = ex.sets.filter((s) => s.completed).length;
  const currentSetIdx = completedCount;
  const currentSet = ex.sets[currentSetIdx];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-6"
      style={{
        borderColor: `${PRIMARY_CONTAINER}66`,
        boxShadow: "0 4px 24px rgba(34,111,163,0.08)",
      }}
    >
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: PRIMARY_CONTAINER }}
      />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3
            className="font-[Manrope] text-xl font-bold"
            style={{ color: INK }}
          >
            {ex.code}. {ex.name}
          </h3>
          <p
            className="text-xs font-semibold mt-2"
            style={{ color: PRIMARY_CONTAINER }}
          >
            {formatSetsLabel(ex)}
          </p>
        </div>
        <button
          aria-label="Info esercizio"
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          style={{ color: OUTLINE }}
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      {/* Set progress pills */}
      <div className="flex gap-2 mb-6">
        {ex.sets.map((s, i) => (
          <div
            key={i}
            className="h-1.5 w-8 rounded-full transition-colors"
            style={{ background: s.completed ? PRIMARY_CONTAINER : PILL_EMPTY }}
          />
        ))}
      </div>

      {/* Current set target */}
      {currentSet && (
        <div
          className="rounded-2xl p-4 flex justify-between items-center"
          style={{ background: SURFACE_LOW }}
        >
          <div className="flex flex-col">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: OUTLINE }}
            >
              Set {currentSetIdx + 1} Target
            </span>
            <span
              className="font-[Manrope] text-3xl font-medium mt-1"
              style={{ color: INK }}
            >
              {currentSet.reps}{" "}
              <span
                className="text-xl font-normal"
                style={{ color: OUTLINE }}
              >
                Reps
              </span>{" "}
              {currentSet.weightKg !== undefined && (
                <>
                  @ {currentSet.weightKg}{" "}
                  <span
                    className="text-xl font-normal"
                    style={{ color: OUTLINE }}
                  >
                    kg
                  </span>
                </>
              )}
            </span>
          </div>
          <Dumbbell
            className="h-8 w-8 opacity-20"
            style={{ color: PRIMARY_CONTAINER }}
          />
        </div>
      )}
    </div>
  );
}

function UpcomingExerciseCard({ ex }: { ex: Exercise }) {
  return (
    <div
      className="rounded-2xl border bg-white p-5"
      style={{ borderColor: "rgba(192,199,208,0.5)" }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold" style={{ color: INK }}>
            {ex.code}. {ex.name}
          </h3>
          <p className="text-xs font-semibold mt-2" style={{ color: MUTED }}>
            {formatSetsLabel(ex)}
          </p>
        </div>
        <button
          aria-label="Riordina esercizio"
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          style={{ color: OUTLINE }}
        >
          <ArrowUpDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ---------- Main component ----------
interface ActiveWorkoutHubProps {
  data?: ActiveWorkoutHubData;
  onClose?: () => void;
  onMenu?: () => void;
  onResume?: () => void;
  onFinish?: () => void;
}

export function ActiveWorkoutHub({
  data = mockData,
  onClose,
  onMenu,
  onResume,
  onFinish,
}: ActiveWorkoutHubProps) {
  const [progress] = useState(data.progressPct);

  return (
    <div
      className="min-h-screen flex flex-col antialiased font-[Inter]"
      style={{ background: "#FFFFFF", color: INK }}
    >
      {/* Top HUD */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-4 py-3 max-w-3xl mx-auto">
          <button
            aria-label="Chiudi workout"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            style={{ color: INK }}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center justify-center">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: OUTLINE }}
            >
              Workout Hub
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#BA1A1A" }}
              />
              <span
                className="font-[Manrope] text-2xl font-semibold tabular-nums tracking-tight"
                style={{ color: PRIMARY_CONTAINER }}
              >
                {data.elapsed}
              </span>
            </div>
          </div>
          <button
            aria-label="Menu"
            onClick={onMenu}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            style={{ color: INK }}
          >
            <MoreVertical className="h-6 w-6" />
          </button>
        </div>
        {/* Workout progress bar */}
        <div className="w-full h-1" style={{ background: SURFACE_LOW }}>
          <div
            className="h-full transition-[width] duration-500"
            style={{ width: `${progress}%`, background: PRIMARY_CONTAINER }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow pt-[100px] pb-[120px] px-5 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        {data.phases.map((phase) => (
          <section
            key={phase.id}
            className={
              phase.status === "completed"
                ? "opacity-60 transition-opacity"
                : ""
            }
          >
            <PhaseHeader phase={phase} />

            {phase.status === "completed" ? (
              <div
                className="rounded-2xl border bg-white p-6 flex flex-col gap-4"
                style={{ borderColor: "rgba(192,199,208,0.3)" }}
              >
                {phase.exercises.map((ex, i) => (
                  <CompletedExerciseRow
                    key={ex.id}
                    ex={ex}
                    isLast={i === phase.exercises.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {phase.exercises.map((ex) =>
                  ex.status === "active" ? (
                    <ActiveExerciseCard key={ex.id} ex={ex} />
                  ) : (
                    <UpcomingExerciseCard key={ex.id} ex={ex} />
                  )
                )}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Sticky bottom action bar */}
      <div
        className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t p-4"
        style={{ borderColor: "rgba(192,199,208,0.4)" }}
      >
        <div className="flex gap-3 max-w-3xl mx-auto w-full">
          <button
            onClick={onResume}
            className="w-[70%] font-semibold py-4 rounded-full transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: PILL_EMPTY, color: INK }}
          >
            <Play className="h-5 w-5 fill-current" />
            {data.resumeLabel}
          </button>
          <button
            onClick={onFinish}
            className="w-[30%] text-white font-semibold py-4 rounded-full transition-colors active:scale-[0.98] shadow-lg"
            style={{
              background: INK,
              boxShadow: `0 8px 24px ${INK}33`,
            }}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveWorkoutHub;
