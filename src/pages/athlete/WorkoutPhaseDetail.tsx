// =============================================================================
// src/pages/athlete/WorkoutPhaseDetail.tsx
// =============================================================================
// Phase 6 — Session preview page (the overarching phase overview).
//
// Adapts main_session_preview.html into React:
//   - Top bar with back button → /athlete/training and a "more" affordance.
//   - Phase header (e.g. "Fase 2: Main Session").
//   - Stacked Block cards (Superset / Circuit), each with:
//       * Left brand border (4px) + glass surface.
//       * Block label + meta (serie / AMRAP minutes).
//       * Exercise rows with circular icon, name, tempo / reps.
//       * Footer chip with recovery / transition rule.
//   - Coaching Performance Note card.
//   - Sticky glassmorphic bottom action bar ("Inizia Blocco").
//
// Mount: SIBLING of <AthleteLayout> at /athlete/training/phase. The page
// owns its own sticky CTA; nesting under the layout would duplicate the
// bottom bar (Save vs BottomNavBar). Back affordance is the only escape.
//
// All sub-components are inline; mock data only; no Supabase wiring.
// =============================================================================

import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  Dumbbell,
  FileText,
  MoreVertical,
  Play,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  ExerciseType,
  PreviewExercise,
} from "@/pages/athlete/ExercisePreview";

// =============================================================================
// Domain types
// =============================================================================
interface PhaseExercise {
  id: string;
  /** Code prefix shown in brand color: "A1", "B2", ... */
  code: string;
  name: string;
  /** Scheme text — reps + optional tempo / "Max Reps" / etc. */
  scheme: string;
  /** Drives the ExercisePreview variant. Defaults to "standard" so an
   *  unset block still routes correctly. */
  type?: ExerciseType;
  sets?: number;
  reps?: string;
  weightKg?: number;
  rpe?: number;
}

interface PhaseBlock {
  id: string;
  /** Uppercase eyebrow: "Blocco A • Superset" */
  label: string;
  /** Right-aligned meta — "4 SERIE" or null when handled by `badge`. */
  meta?: string;
  /** Optional pill badge under the label — "AMRAP 12 Minuti". */
  badge?: string;
  /** When true, exercises render as a compact "circuit" row variant. */
  compact: boolean;
  exercises: PhaseExercise[];
  footer: {
    icon: LucideIcon;
    text: string;
  };
}

// =============================================================================
// Mock data
// =============================================================================
const PHASE = {
  number: 2,
  name: "Main Session",
  subtitle: "Ipertrofia strutturale ad alta intensità",
  blocks: [
    {
      id: "block_a",
      label: "Blocco A • Superset",
      meta: "4 SERIE",
      compact: false,
      exercises: [
        {
          id: "a1",
          code: "A1",
          name: "Barbell Back Squat",
          scheme: "8 Reps · Tempo 3-0-1-0",
          type: "standard",
          sets: 4,
          reps: "8",
          weightKg: 100,
          rpe: 8,
        },
        {
          id: "a2",
          code: "A2",
          name: "Romanian Deadlift",
          scheme: "10 Reps · Tempo 2-0-1-0",
          type: "standard",
          sets: 4,
          reps: "10",
          weightKg: 80,
          rpe: 8,
        },
      ],
      footer: { icon: Clock, text: "Recupero: 90 sec dopo A2" },
    },
    {
      id: "block_b",
      label: "Blocco B • Circuito Condizionale",
      badge: "AMRAP 12 Minuti",
      compact: true,
      exercises: [
        {
          id: "b1",
          code: "B1",
          name: "Kettlebell Swings",
          scheme: "15 Reps",
          type: "emom",
          sets: 1,
          reps: "15",
          weightKg: 24,
        },
        {
          id: "b2",
          code: "B2",
          name: "Push-ups",
          scheme: "Max Reps",
          type: "standard",
          sets: 1,
          reps: "AMRAP",
        },
        {
          id: "b3",
          code: "B3",
          name: "Box Jumps",
          scheme: "10 Reps",
          type: "standard",
          sets: 1,
          reps: "10",
        },
      ],
      footer: { icon: Zap, text: "Transizioni veloci, no pause" },
    },
  ] as PhaseBlock[],
};

const COACH_NOTE = {
  title: "Performance Note",
  body: "Focalizzati sulla fase eccentrica di A1. Mantenere tensione strutturale è critico per l'adattamento metabolico del blocco.",
};

// =============================================================================
// TopBar — fixed glass, back button + title + overflow menu placeholder.
// =============================================================================
function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40",
        "h-16 flex items-center justify-between px-4",
        "backdrop-blur-xl bg-white/85",
        "border-b border-[#c0c7d0]/40",
      )}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Torna agli allenamenti"
        className={cn(
          "h-10 w-10 rounded-full",
          "flex items-center justify-center text-brand-container",
          "transition-colors hover:bg-surface-container/60",
          "active:scale-95",
        )}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </button>
      <h1 className="font-display text-lg font-bold tracking-tight text-on-surface">
        Sessione
      </h1>
      <button
        type="button"
        aria-label="Altre opzioni"
        className={cn(
          "h-10 w-10 rounded-full",
          "flex items-center justify-center text-brand-container",
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
    </header>
  );
}

// =============================================================================
// PhaseHeader — eyebrow + title + subtitle, top of the canvas.
// =============================================================================
function PhaseHeader() {
  return (
    <header className="flex flex-col gap-1">
      <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
        Fase {PHASE.number}
      </span>
      <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface">
        {PHASE.name}
      </h2>
      <p className="text-sm text-on-surface-variant">{PHASE.subtitle}</p>
    </header>
  );
}

// =============================================================================
// BlockHeader — top row of a Block card: label + meta or badge.
// =============================================================================
function BlockHeader({ block }: { block: PhaseBlock }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-[11px] font-semibold tracking-widest uppercase text-on-surface">
          {block.label}
        </h3>
        {block.badge && (
          <span className="self-start font-sans text-[10px] font-bold tracking-wider uppercase text-brand-container bg-brand-container/10 px-3 py-0.5 rounded-full">
            {block.badge}
          </span>
        )}
      </div>
      {block.meta && (
        <span className="font-sans text-[11px] font-semibold tracking-wider text-on-surface-variant">
          {block.meta}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// FullExerciseRow — "spaced" variant used by Superset blocks: large icon,
// stacked name + scheme, optional dashed divider between consecutive rows.
// The whole row is a button so tapping it routes to the preview.
// =============================================================================
function FullExerciseRow({
  exercise,
  showDivider,
  onSelect,
}: {
  exercise: PhaseExercise;
  showDivider: boolean;
  onSelect: (ex: PhaseExercise) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        aria-label={`Apri anteprima ${exercise.code}. ${exercise.name}`}
        className={cn(
          "w-full flex items-start gap-4 text-left",
          "rounded-2xl p-1 -m-1",
          "transition-transform active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-container/40",
        )}
      >
        <span
          aria-hidden="true"
          className="h-12 w-12 shrink-0 rounded-full bg-brand-container/10 text-brand-container flex items-center justify-center"
        >
          <Dumbbell className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-on-surface">
            <span className="text-brand-container font-bold mr-1.5">
              {exercise.code}.
            </span>
            {exercise.name}
          </h4>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            {exercise.scheme}
          </p>
        </div>
      </button>
      {showDivider && (
        <div
          aria-hidden="true"
          className="my-4 border-t border-dashed border-[#c0c7d0]/50"
        />
      )}
    </>
  );
}

// =============================================================================
// CompactExerciseRow — used by Circuit / AMRAP blocks: tighter horizontal
// layout with the code on the left and a pill chip on the right. Also
// a button so the user can preview each step of the circuit.
// =============================================================================
function CompactExerciseRow({
  exercise,
  onSelect,
}: {
  exercise: PhaseExercise;
  onSelect: (ex: PhaseExercise) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      aria-label={`Apri anteprima ${exercise.code}. ${exercise.name}`}
      className={cn(
        "w-full flex items-center justify-between gap-3 text-left",
        "rounded-2xl p-1 -m-1",
        "transition-transform active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-container/40",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-sans text-xs font-bold tracking-tighter text-on-surface-variant w-6 shrink-0">
          {exercise.code}
        </span>
        <h4 className="font-display text-base font-semibold text-on-surface truncate">
          {exercise.name}
        </h4>
      </div>
      <span className="shrink-0 font-sans text-xs font-semibold text-on-surface-variant bg-surface-container/60 px-3 py-1 rounded-lg">
        {exercise.scheme}
      </span>
    </button>
  );
}

// =============================================================================
// BlockCard — full glass card for one Block.
// =============================================================================
function BlockCard({
  block,
  onSelectExercise,
}: {
  block: PhaseBlock;
  onSelectExercise: (ex: PhaseExercise) => void;
}) {
  const FooterIcon = block.footer.icon;
  return (
    <section
      aria-label={block.label}
      className={cn(
        "relative overflow-hidden",
        "rounded-3xl p-6",
        "bg-white/70 backdrop-blur-xl",
        "border border-[#c0c7d0]/30",
        "border-l-4 border-l-brand-container",
        "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
        "flex flex-col gap-6",
      )}
    >
      <BlockHeader block={block} />

      {block.compact ? (
        <div className="flex flex-col gap-4">
          {block.exercises.map((ex) => (
            <CompactExerciseRow
              key={ex.id}
              exercise={ex}
              onSelect={onSelectExercise}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {block.exercises.map((ex, i) => (
            <FullExerciseRow
              key={ex.id}
              exercise={ex}
              showDivider={i < block.exercises.length - 1}
              onSelect={onSelectExercise}
            />
          ))}
        </div>
      )}

      <div className="flex w-fit items-center gap-2 self-start rounded-full bg-surface-container/60 px-4 py-1.5">
        <FooterIcon
          className="h-4 w-4 text-on-surface-variant"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="font-sans text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
          {block.footer.text}
        </span>
      </div>
    </section>
  );
}

// =============================================================================
// CoachingNote — left-bordered glass card with the coach's performance cue.
// =============================================================================
function CoachingNote() {
  return (
    <section
      aria-label="Nota del coach"
      className={cn(
        "rounded-3xl p-6",
        "bg-brand-container/5 backdrop-blur-xl",
        "border-l-4 border-brand-container",
        "border border-brand-container/15",
      )}
    >
      <div className="flex items-start gap-3">
        <FileText
          className="h-5 w-5 text-brand-container mt-0.5"
          strokeWidth={2}
          aria-hidden="true"
        />
        <div>
          <p className="font-display text-sm font-bold text-brand-container">
            {COACH_NOTE.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            {COACH_NOTE.body}
          </p>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// StickyStartCTA — fixed glass bar with the primary action.
// =============================================================================
function StickyStartCTA({ onStart }: { onStart: () => void }) {
  return (
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50",
        "backdrop-blur-2xl bg-white/90",
        "border-t border-[#c0c7d0]/40",
        "rounded-t-[32px]",
        "shadow-[0_-10px_40px_rgba(80,118,142,0.1)]",
        "pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
      )}
    >
      <div className="max-w-lg mx-auto px-6">
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "w-full py-4 rounded-full",
            "flex items-center justify-center gap-2",
            "bg-brand-container text-white",
            "font-display text-sm font-bold uppercase tracking-widest",
            "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
            "transition-all duration-200",
            "hover:brightness-110 active:scale-[0.98]",
          )}
        >
          <Play
            className="h-5 w-5 fill-white"
            strokeWidth={0}
            aria-hidden="true"
          />
          Inizia Blocco
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// WorkoutPhaseDetail — page composition.
// =============================================================================
export default function WorkoutPhaseDetail() {
  const navigate = useNavigate();

  const handleStart = () => {
    toast.success("Blocco avviato", {
      description: "L'esperienza di esecuzione arriverà nel prossimo step.",
    });
  };

  /**
   * Maps a PhaseExercise → PreviewExercise and routes to the preview.
   * The PhaseExercise.scheme string is dropped on purpose: the preview
   * binds its display to the structured sets/reps/weightKg/rpe fields
   * so both screens stay numerically consistent.
   */
  const handleSelectExercise = (ex: PhaseExercise) => {
    const payload: PreviewExercise = {
      id: ex.id,
      code: ex.code,
      name: ex.name,
      type: ex.type ?? "standard",
      sets: ex.sets,
      reps: ex.reps,
      weightKg: ex.weightKg,
      rpe: ex.rpe,
    };
    navigate("/athlete/exercise-preview", { state: { exercise: payload } });
  };

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased pb-32">
      <TopBar onBack={() => navigate("/athlete/training")} />

      <main className="pt-20 px-5 max-w-lg mx-auto flex flex-col gap-6">
        <PhaseHeader />
        {PHASE.blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onSelectExercise={handleSelectExercise}
          />
        ))}
        <CoachingNote />
      </main>

      <StickyStartCTA onStart={handleStart} />
    </div>
  );
}
