import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgramBuilderStore } from '@/stores/programBuilder/useProgramBuilderStore';
import type {
  NewProgrammedExercise,
  ProgrammedSet,
  UUID,
} from '@/types/training';

// ---------------------------------------------------------------------------
// Mock library
// ---------------------------------------------------------------------------
//
// Hardcoded for now — when the real exercise-library API lands, swap this
// constant for a `useQuery(['exercise-library', search], …)` call. The drawer
// component itself stays unchanged.

interface LibraryExerciseDef {
  /** Stable client-side id used as `exercise_id` foreign key when added. */
  exercise_id: UUID;
  name: string;
  /** Coarse muscle-group tag for the badge in the row. */
  muscle: string;
  /** Default rep target for the first auto-generated set. */
  default_reps: string;
  /** Default RPE for the first auto-generated set. */
  default_rpe: number;
}

const MOCK_LIBRARY: LibraryExerciseDef[] = [
  { exercise_id: 'lib-back-squat',         name: 'Back Squat',         muscle: 'Quads',     default_reps: '5',     default_rpe: 8 },
  { exercise_id: 'lib-front-squat',        name: 'Front Squat',        muscle: 'Quads',     default_reps: '5',     default_rpe: 8 },
  { exercise_id: 'lib-bench-press',        name: 'Bench Press',        muscle: 'Chest',     default_reps: '5',     default_rpe: 8 },
  { exercise_id: 'lib-incline-db-press',   name: 'Incline DB Press',   muscle: 'Chest',     default_reps: '8-10',  default_rpe: 8 },
  { exercise_id: 'lib-overhead-press',     name: 'Overhead Press',     muscle: 'Shoulders', default_reps: '5',     default_rpe: 8 },
  { exercise_id: 'lib-deadlift',           name: 'Deadlift',           muscle: 'Posterior', default_reps: '3',     default_rpe: 8 },
  { exercise_id: 'lib-romanian-deadlift',  name: 'Romanian Deadlift',  muscle: 'Hamstrings',default_reps: '8',     default_rpe: 8 },
  { exercise_id: 'lib-pull-up',            name: 'Pull-Up',            muscle: 'Back',      default_reps: 'AMRAP', default_rpe: 9 },
  { exercise_id: 'lib-barbell-row',        name: 'Barbell Row',        muscle: 'Back',      default_reps: '8',     default_rpe: 8 },
  { exercise_id: 'lib-lat-pulldown',       name: 'Lat Pulldown',       muscle: 'Back',      default_reps: '10-12', default_rpe: 8 },
  { exercise_id: 'lib-walking-lunge',      name: 'Walking Lunge',      muscle: 'Quads',     default_reps: '10',    default_rpe: 7 },
  { exercise_id: 'lib-bulgarian-split',    name: 'Bulgarian Split Squat', muscle: 'Quads',  default_reps: '8',     default_rpe: 8 },
  { exercise_id: 'lib-hip-thrust',         name: 'Hip Thrust',         muscle: 'Glutes',    default_reps: '8',     default_rpe: 8 },
  { exercise_id: 'lib-leg-curl',           name: 'Leg Curl',           muscle: 'Hamstrings',default_reps: '10-12', default_rpe: 9 },
  { exercise_id: 'lib-leg-extension',      name: 'Leg Extension',      muscle: 'Quads',     default_reps: '12-15', default_rpe: 9 },
  { exercise_id: 'lib-cable-fly',          name: 'Cable Fly',          muscle: 'Chest',     default_reps: '12-15', default_rpe: 9 },
  { exercise_id: 'lib-tricep-pushdown',    name: 'Tricep Pushdown',    muscle: 'Triceps',   default_reps: '10-12', default_rpe: 8 },
  { exercise_id: 'lib-bicep-curl',         name: 'Bicep Curl',         muscle: 'Biceps',    default_reps: '10-12', default_rpe: 8 },
  { exercise_id: 'lib-face-pull',          name: 'Face Pull',          muscle: 'Rear Delt', default_reps: '15',    default_rpe: 8 },
  { exercise_id: 'lib-plank',              name: 'Plank',              muscle: 'Core',      default_reps: '60s',   default_rpe: 7 },
];

/**
 * Builds a NewProgrammedExercise with one warmup set + 3 working sets so the
 * card is immediately useful. The coach overrides everything inline.
 */
function buildNewExercise(def: LibraryExerciseDef): NewProgrammedExercise {
  const buildSet = (n: number): ProgrammedSet => ({
    // id is stamped by the store's addExerciseToSession defensive guard, but
    // we provide one anyway so the shape is internally consistent.
    id: crypto.randomUUID(),
    set_number: n,
    reps_target: def.default_reps,
    rpe_target: def.default_rpe,
    rest_seconds: 90,
  });

  return {
    exercise_id: def.exercise_id,
    exercise_name: def.name,
    sets: [buildSet(1), buildSet(2), buildSet(3)],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ExerciseLibraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The week the target session lives in. */
  weekId: UUID | null;
  /** The session into which the picked exercise is appended. */
  sessionId: UUID | null;
}

export function ExerciseLibraryDrawer({
  open,
  onOpenChange,
  weekId,
  sessionId,
}: ExerciseLibraryDrawerProps) {
  const [search, setSearch] = useState('');
  const addExerciseToSession = useProgramBuilderStore(
    (s) => s.addExerciseToSession,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_LIBRARY;
    return MOCK_LIBRARY.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.muscle.toLowerCase().includes(q),
    );
  }, [search]);

  const handlePick = (def: LibraryExerciseDef) => {
    if (!weekId || !sessionId) return; // defensive — drawer shouldn't be open without these
    addExerciseToSession(weekId, sessionId, buildNewExercise(def));
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setSearch(''); // reset filter when the drawer is dismissed
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b text-left space-y-1">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Exercise Library
          </SheetTitle>
          <SheetDescription className="text-xs">
            Click an exercise to add it to this session.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or muscle…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <ul className="py-1">
            {filtered.length === 0 && (
              <li className="px-5 py-8 text-center text-xs text-muted-foreground">
                No exercises match "{search}".
              </li>
            )}
            {filtered.map((ex) => (
              <li key={ex.exercise_id}>
                <button
                  type="button"
                  onClick={() => handlePick(ex)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-5 py-2',
                    'text-left hover:bg-muted/60 active:bg-muted',
                    'transition-colors focus:outline-none focus:bg-muted/60',
                  )}
                >
                  <span className="text-sm font-medium truncate">
                    {ex.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5 font-normal flex-shrink-0"
                  >
                    {ex.muscle}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
