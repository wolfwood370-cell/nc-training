/**
 * ProgramBuilder (V2)
 * ---------------------------------------------------------------------------
 * Coach-facing builder wired to the new periodized engine
 * (`useAdvancedProgramStore` → ProgramBlock → Microcycle → Session →
 * ProgrammedExercise → ProgrammedSet).
 *
 * Layout (desktop-first; horizontal scroll is acceptable on small screens):
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Header: block name · goal · meta                            │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  ◀  Macro-Timeline (horizontal scroll, one card per week)  ▶ │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │  Week Grid: Session 1 │ Session 2 │ Session 3 │ Session 4   │
 *   │             (vertical columns of exercise cards)              │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * State ownership: this page owns ONLY `selectedWeekId` (a UI concern).
 * All program data lives in the Zustand store and is mutated via store
 * actions. We deliberately do NOT mirror store data into local state.
 *
 * Out of scope for this iteration (per task brief):
 *   - Real exercise library selector (uses a mock for now)
 *   - Set-level editing UI
 *   - Save / persistence wiring
 *   - Athlete assignment
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Calendar, Target, Layers, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/shallow";

import { useAdvancedProgramStore } from "@/stores/useAdvancedProgramStore";
import { ExerciseLibraryDrawer } from "@/components/coach/program/ExerciseLibraryDrawer";
import { ProgrammedExerciseCard } from "@/components/coach/program/ProgrammedExerciseCard";
import type {
  Microcycle,
  Session,
  ProgrammedExercise,
  ProgrammedSet,
  NewProgrammedExercise,
  UUID,
} from "@/types/training";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

/**
 * Default scaffold used when the page mounts with no active block.
 * Matches typical block-periodization defaults: 4-week mesocycle, 4 sessions
 * per week. Coaches can resize / rename later.
 */
const DEFAULT_BLOCK = {
  name: "New Training Block",
  weeksCount: 4,
  sessionsPerWeek: 4,
} as const;

/**
 * Coach-facing labels for the first few microcycles in a classical linear
 * mesocycle. Beyond the prebaked range we fall back to "Week N". These are
 * purely cosmetic — the underlying data has no notion of accumulation /
 * intensification (yet); that lives in the coach's mental model.
 */
const WEEK_PHASE_LABELS = [
  "Accumulation",
  "Intensification",
  "Realization",
  "Deload",
] as const;

const weekPhaseLabel = (week: Microcycle): string => {
  if (week.is_deload) return "Deload";
  // `order` is 1-indexed in the V2 model.
  const idx = week.order - 1;
  return WEEK_PHASE_LABELS[idx] ?? `Week ${week.order}`;
};

/**
 * Builds a placeholder exercise with one working set so the grid has
 * something visible to render. This will be replaced by the real exercise
 * library selector in the next slice.
 *
 * Each call generates fresh names so coaches can distinguish multiple mock
 * adds during smoke-testing.
 */
const mockExerciseCounter = { value: 0 };

const buildMockExercise = (): NewProgrammedExercise => {
  mockExerciseCounter.value += 1;
  const n = mockExerciseCounter.value;

  // A single working set @ RPE 8 / 8-10 reps — sane hypertrophy default.
  // The store will re-stamp set ids defensively, but we provide one here
  // so the payload satisfies `ProgrammedSet` as written.
  const set: ProgrammedSet = {
    id: crypto.randomUUID(),
    set_number: 1,
    reps_target: "8-10",
    rpe_target: 8,
    rir_target: 2,
    rest_seconds: 90,
  };

  return {
    // The store fills in `id` and `order` on the exercise itself.
    exercise_id: "mock-library-id",
    exercise_name: `Placeholder Exercise ${n}`,
    sets: [set],
  };
};

// ---------------------------------------------------------------------------
// Subcomponent: WeekTimelineCard
// ---------------------------------------------------------------------------

/**
 * A single selectable week tile inside the Macro-Timeline. Kept narrow
 * (~160px) so a 12-week mesocycle fits inside a 1280px viewport without
 * scroll, but wide enough to show both the phase label and exercise count.
 */
interface WeekTimelineCardProps {
  week: Microcycle;
  isActive: boolean;
  onSelect: () => void;
}

function WeekTimelineCard({ week, isActive, onSelect }: WeekTimelineCardProps) {
  // Total prescribed exercises across all sessions in this week. Useful as
  // a glance metric: empty weeks visually fade vs. populated ones.
  const exerciseCount = useMemo(
    () => week.sessions.reduce((sum, s) => sum + s.exercises.length, 0),
    [week.sessions]
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-[88px] w-[160px] shrink-0 flex-col justify-between rounded-lg border p-3 text-left transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isActive
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
          : "border-border/60 bg-card",
        // Visually muted state for empty weeks — coach attention should
        // gravitate toward weeks that already have prescribed work.
        exerciseCount === 0 && !isActive && "opacity-70"
      )}
      aria-pressed={isActive}
      aria-label={`Week ${week.order}: ${weekPhaseLabel(week)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Week {week.order}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold leading-tight">
            {weekPhaseLabel(week)}
          </p>
        </div>
        {week.is_deload && (
          <Badge
            variant="outline"
            className="h-4 shrink-0 border-sky-500/40 px-1 text-[9px] text-sky-600 dark:text-sky-400"
          >
            Deload
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Dumbbell className="h-3 w-3" />
        <span className="tabular-nums">
          {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">{week.sessions.length}d</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: ExerciseCard (minimalist, inside a Session column)
// ---------------------------------------------------------------------------

/**
 * One programmed exercise rendered as a compact card. Surfaces the four
 * coaching-critical fields: name, sets × reps, intensity (RPE/RIR/%1RM),
 * and rest. Anything more granular (per-set editing, tempo, notes) is left
 * for the dedicated editor in a later slice.
 *
 * Intensity precedence is RPE > RIR > %1RM, matching how most coaches
 * write programs ("RPE 8" beats "75% 1RM" when both are present because
 * autoregulation is the more actionable target on the day).
 */
interface ExerciseCardProps {
  exercise: ProgrammedExercise;
}

function ExerciseCard({ exercise }: ExerciseCardProps) {
  const totalSets = exercise.sets.length;

  // Use the first working set as the representative target. Coaches
  // typically prescribe homogeneous sets (5×5 @ RPE 8); divergent sets are
  // surfaced in the detailed editor, not here.
  const firstSet = exercise.sets[0];

  // Pick the strongest available intensity signal and color-code it. The
  // distinct hues let a coach pattern-match a week's intensity profile at
  // a glance — RPE-heavy weeks read amber, %1RM-heavy weeks read indigo.
  const intensityBadge = useMemo(() => {
    if (!firstSet) return null;
    if (firstSet.rpe_target != null) {
      return {
        label: `RPE ${firstSet.rpe_target}`,
        // Amber: signals subjective autoregulation.
        className:
          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      };
    }
    if (firstSet.rir_target != null) {
      return {
        label: `RIR ${firstSet.rir_target}`,
        // Emerald: RIR is essentially RPE inverted; using a sibling hue
        // keeps the autoregulation family visually grouped.
        className:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      };
    }
    if (firstSet.percent_1rm_target != null) {
      return {
        label: `${firstSet.percent_1rm_target}% 1RM`,
        // Indigo: signals objective load prescription.
        className:
          "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
      };
    }
    return null;
  }, [firstSet]);

  return (
    <Card className="border-border/60 transition-colors hover:border-border">
      <CardContent className="space-y-1.5 p-2.5">
        {/* Title row */}
        <p className="truncate text-xs font-semibold leading-tight" title={exercise.exercise_name}>
          {exercise.exercise_name}
        </p>

        {/* Volume row: sets × reps */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums font-medium text-foreground">
            {totalSets}
          </span>
          <span>×</span>
          <span className="tabular-nums">
            {firstSet?.reps_target ?? "—"}
          </span>
          {firstSet?.rest_seconds != null && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="tabular-nums">{firstSet.rest_seconds}s</span>
            </>
          )}
        </div>

        {/* Intensity badge — only rendered when the coach actually
            prescribed a target. Avoids visual noise on placeholder rows. */}
        {intensityBadge && (
          <Badge
            variant="outline"
            className={cn("h-4 px-1.5 text-[10px] font-medium", intensityBadge.className)}
          >
            {intensityBadge.label}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: SessionColumn
// ---------------------------------------------------------------------------

/**
 * One vertical column representing a single training day. The "+ Add
 * Exercise" button opens the ExerciseLibraryDrawer; each programmed
 * exercise is rendered with the inline ProgrammedExerciseCard which writes
 * directly to the store.
 */
interface SessionColumnProps {
  weekId: UUID;
  session: Session;
}

function SessionColumn({ weekId, session }: SessionColumnProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const removeExercise = useAdvancedProgramStore((s) => s.removeExercise);

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
      {/* Column header */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {session.name}
          </p>
          {session.focus && (
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {session.focus}
            </p>
          )}
        </div>
        <Badge
          variant="secondary"
          className="h-4 shrink-0 px-1.5 text-[10px] tabular-nums"
        >
          {session.exercises.length}
        </Badge>
      </div>

      <Separator className="bg-border/40" />

      {/* Exercise list */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {session.exercises.length === 0 ? (
          <p className="px-1 py-3 text-center text-[11px] italic text-muted-foreground/70">
            No exercises yet
          </p>
        ) : (
          session.exercises.map((ex) => (
            <ProgrammedExerciseCard
              key={ex.id}
              weekId={weekId}
              sessionId={session.id}
              exercise={ex}
              onRemove={() => removeExercise(weekId, session.id, ex.id)}
            />
          ))
        )}
      </div>

      {/* Add button — opens the exercise library drawer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLibraryOpen(true)}
        className="h-8 w-full justify-center gap-1.5 border border-dashed border-border/60 text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Exercise
      </Button>

      <ExerciseLibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        weekId={weekId}
        sessionId={session.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProgramBuilder() {
  // -------------------------------------------------------------------------
  // Store wiring
  // -------------------------------------------------------------------------

  // Read the active block. We pull it as a single value (rather than
  // destructuring nested fields) because zustand+immer returns stable
  // references for unchanged subtrees — re-renders are already minimal.
  const block = useAdvancedProgramStore((s) => s.block);

  // Actions are grouped via useShallow so the function-identity object
  // doesn't churn on every state change.
  const { initializeBlock, addExerciseToSession } = useAdvancedProgramStore(
    useShallow((s) => ({
      initializeBlock: s.initializeBlock,
      addExerciseToSession: s.addExerciseToSession,
    }))
  );

  // -------------------------------------------------------------------------
  // Local UI state — selected week (a pure view concern)
  // -------------------------------------------------------------------------

  const [selectedWeekId, setSelectedWeekId] = useState<UUID | null>(null);

  // -------------------------------------------------------------------------
  // Lifecycle: scaffold an empty block on first mount if none exists.
  // -------------------------------------------------------------------------

  // We don't yet have a "load by id" flow (that lands when persistence
  // wiring is built). For now, mounting the page with no block scaffolds a
  // 4×4 default so the grid has something to render. This keeps the UI
  // exercise-able in isolation.
  useEffect(() => {
    if (!block) {
      initializeBlock({
        name: DEFAULT_BLOCK.name,
        weeksCount: DEFAULT_BLOCK.weeksCount,
        sessionsPerWeek: DEFAULT_BLOCK.sessionsPerWeek,
      });
    }
  }, [block, initializeBlock]);

  // Keep `selectedWeekId` in sync with the block: default to the first
  // week, and recover gracefully if the selected week was removed.
  useEffect(() => {
    if (!block || block.weeks.length === 0) {
      if (selectedWeekId !== null) setSelectedWeekId(null);
      return;
    }
    const stillExists = block.weeks.some((w) => w.id === selectedWeekId);
    if (!stillExists) {
      setSelectedWeekId(block.weeks[0].id);
    }
  }, [block, selectedWeekId]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const selectedWeek: Microcycle | undefined = useMemo(
    () => block?.weeks.find((w) => w.id === selectedWeekId),
    [block, selectedWeekId]
  );

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAddExercise = useCallback(
    (weekId: UUID, sessionId: UUID) => {
      addExerciseToSession(weekId, sessionId, buildMockExercise());
    },
    [addExerciseToSession]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Loading shim: the init effect runs synchronously on the next tick, so
  // this branch is only hit for one frame. Still — render *something*
  // rather than crashing on the null block.
  if (!block) {
    return (
      <CoachLayout title="Program Builder" subtitle="Initializing…">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout
      title="Program Builder"
      subtitle="Design periodized training blocks"
    >
      <div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
        {/* ───────────────────────────────────────────────────────────────
            Block header — name, goal, structural meta. Compact: two rows
            max, tabular numerals so 4 wks / 16 sessions read clean.
           ─────────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-tight">
              {block.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {block.goal}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                <span className="tabular-nums">{block.weeks.length}</span> weeks
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Starts {block.start_date}
              </span>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────
            Macro-Timeline — horizontal strip of week cards. Uses Shadcn
            ScrollArea so the scrollbar matches the rest of the app and
            keyboard scrolling works out of the box.
           ─────────────────────────────────────────────────────────────── */}
        <section
          aria-label="Macro-cycle timeline"
          className="rounded-lg border border-border/60 bg-card"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Macro-Timeline
            </h2>
            <span className="text-[10px] text-muted-foreground">
              {block.weeks.length} microcycles
            </span>
          </div>
          <Separator className="bg-border/40" />
          <ScrollArea className="w-full">
            <div className="flex gap-2 p-3">
              {block.weeks.map((week) => (
                <WeekTimelineCard
                  key={week.id}
                  week={week}
                  isActive={week.id === selectedWeekId}
                  onSelect={() => setSelectedWeekId(week.id)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* ───────────────────────────────────────────────────────────────
            Week Grid — vertical session columns side-by-side. Wraps in a
            second horizontal ScrollArea so 6+ session weeks remain usable
            on a 13" laptop without breaking the column rhythm.
           ─────────────────────────────────────────────────────────────── */}
        <section
          aria-label={`Week ${selectedWeek?.order ?? ""} sessions`}
          className="flex min-h-0 flex-1 flex-col rounded-lg border border-border/60 bg-card"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold">
                Week {selectedWeek?.order ?? "—"}
              </h2>
              {selectedWeek && (
                <span className="text-xs text-muted-foreground">
                  · {weekPhaseLabel(selectedWeek)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {selectedWeek?.sessions.length ?? 0} sessions
            </span>
          </div>
          <Separator className="bg-border/40" />

          <ScrollArea className="flex-1">
            <div className="flex h-full min-h-[400px] gap-3 p-3">
              {selectedWeek?.sessions.length ? (
                selectedWeek.sessions.map((session) => (
                  <SessionColumn
                    key={session.id}
                    weekId={selectedWeek.id}
                    session={session}
                    onAddExercise={handleAddExercise}
                  />
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  No sessions in this week.
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      </div>
    </CoachLayout>
  );
}
