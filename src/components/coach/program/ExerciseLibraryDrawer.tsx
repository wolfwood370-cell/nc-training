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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Dumbbell, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useProgramBuilderStore } from '@/stores/programBuilder/useProgramBuilderStore';
import {
  useExerciseLibraryQuery,
  type LibraryExercise,
} from '@/hooks/useExerciseLibraryQuery';
import type {
  NewProgrammedExercise,
  ProgrammedSet,
  UUID,
} from '@/types/training';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a starter `NewProgrammedExercise` (1 working scaffold × 3 sets) from
 * a real library row. RPE inherits from the coach default when present.
 */
function buildNewExercise(def: LibraryExercise): NewProgrammedExercise {
  const defaultRpe = def.default_rpe ?? 8;
  const buildSet = (n: number): ProgrammedSet => ({
    id: crypto.randomUUID(),
    set_number: n,
    reps_target: '8',
    rpe_target: defaultRpe,
    rest_seconds: 90,
  });

  return {
    exercise_id: def.id,
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
  weekId: UUID | null;
  sessionId: UUID | null;
}

export function ExerciseLibraryDrawer({
  open,
  onOpenChange,
  weekId,
  sessionId,
}: ExerciseLibraryDrawerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const addExerciseToSession = useProgramBuilderStore(
    (s) => s.addExerciseToSession,
  );

  const { data: exercises = [], isLoading, error } = useExerciseLibraryQuery({
    searchQuery: debouncedSearch,
    enabled: open,
  });

  const handlePick = (def: LibraryExercise) => {
    if (!weekId || !sessionId) return;
    addExerciseToSession(weekId, sessionId, buildNewExercise(def));
    setSearch('');
    onOpenChange(false);
  };

  // Stable list reference for render
  const list = useMemo(() => exercises, [exercises]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setSearch('');
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
            {isLoading && list.length === 0 && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="px-5 py-2 flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-14" />
                  </li>
                ))}
              </>
            )}

            {!isLoading && error && (
              <li className="px-5 py-8 text-center text-xs text-destructive flex flex-col items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Failed to load exercises.
              </li>
            )}

            {!isLoading && !error && list.length === 0 && (
              <li className="px-5 py-8 text-center text-xs text-muted-foreground">
                {debouncedSearch.trim()
                  ? `No exercises match "${debouncedSearch}".`
                  : 'No exercises in your library yet.'}
              </li>
            )}

            {list.map((ex) => (
              <li key={ex.id}>
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
                    {ex.muscle_group}
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
