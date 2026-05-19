import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  GripVertical,
  Trash2,
  Link2,
  Unlink,
  Calculator,
  Plus,
  MoreVertical,
  Pencil,
  Sunrise,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Types
export interface ProgramExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  load: string;
  rpe: number | null;
  restSeconds: number;
  notes: string;
  supersetGroup?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  exercises: ProgramExercise[];
}

// dayIndex -> sessions
export type DayProgram = Record<number, WorkoutSession[]>;
// weekIndex -> days
export type ProgramData = Record<number, DayProgram>;

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const REST_OPTIONS = [30, 45, 60, 90, 120, 180, 240];

// Sortable exercise item
function SortableExercise({
  exercise,
  dayIndex,
  weekIndex,
  sessionId,
  oneRM,
  isSelected,
  onUpdate,
  onRemove,
  onToggleSuperset,
  onSelect,
  isInSuperset,
  supersetColor,
}: {
  exercise: ProgramExercise;
  dayIndex: number;
  weekIndex: number;
  sessionId: string;
  oneRM: number;
  isSelected?: boolean;
  onUpdate: (updated: ProgramExercise) => void;
  onRemove: () => void;
  onToggleSuperset: () => void;
  onSelect?: () => void;
  isInSuperset: boolean;
  supersetColor?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
    data: { type: "program-exercise", exercise, dayIndex, weekIndex, sessionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate kg from percentage
  const getCalculatedKg = (loadStr: string): string | null => {
    const match = loadStr.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (match && oneRM > 0) {
      const percent = parseFloat(match[1]);
      const kg = Math.round(oneRM * (percent / 100));
      return `≈${kg}kg`;
    }
    return null;
  };

  const calculatedHint = getCalculatedKg(exercise.load);

  const handleSelect = () => onSelect?.();
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      style={style}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, input, select")) return;
        handleSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if ((e.target as HTMLElement).closest("button, input, select")) return;
          e.preventDefault();
          handleSelect();
        }
      }}
      className={cn(
        "bg-background rounded-lg border p-2 space-y-1.5 group transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5",
        isInSuperset && "border-l-4",
        supersetColor,
      )}
    >
      {/* Header Row */}
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded hover:bg-secondary cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <span className="text-2xs font-medium truncate flex-1" title={exercise.name}>
          {exercise.name}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isInSuperset ? "Rimuovi dal superset" : "Collega in superset"}
              className={cn(
                "h-5 w-5",
                isInSuperset
                  ? "text-primary"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100",
              )}
              onClick={onToggleSuperset}
            >
              {isInSuperset ? <Unlink className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isInSuperset ? "Rimuovi dal superset" : "Collega in superset"}
          </TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Rimuovi esercizio"
          className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Sets x Reps @ Load */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          value={exercise.sets || ""}
          onChange={(e) => onUpdate({ ...exercise, sets: parseInt(e.target.value) || 0 })}
          className="h-6 w-8 text-3xs text-center px-1"
          placeholder="S"
        />
        <span className="text-3xs text-muted-foreground">×</span>
        <Input
          type="text"
          value={exercise.reps}
          onChange={(e) => onUpdate({ ...exercise, reps: e.target.value })}
          className="h-6 w-10 text-3xs text-center px-1"
          placeholder="Rep"
        />
        <span className="text-3xs text-muted-foreground">@</span>
        <div className="relative flex-1">
          <Input
            type="text"
            value={exercise.load}
            onChange={(e) => onUpdate({ ...exercise, load: e.target.value })}
            className={cn("h-6 text-3xs px-1", calculatedHint && "pr-6")}
            placeholder="80%"
          />
          {calculatedHint && (
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-5xs text-primary flex items-center gap-0.5">
              <Calculator className="h-2 w-2" />
            </span>
          )}
        </div>
      </div>

      {/* Hint */}
      {calculatedHint && (
        <p className="text-4xs text-muted-foreground flex items-center gap-0.5">
          <Calculator className="h-2.5 w-2.5" />
          <span className="text-primary font-medium">{calculatedHint}</span>
        </p>
      )}

      {/* RPE & Rest */}
      <div className="flex items-center gap-1">
        <Select
          value={exercise.rpe?.toString() || ""}
          onValueChange={(val) => onUpdate({ ...exercise, rpe: val ? parseInt(val) : null })}
        >
          <SelectTrigger className="h-6 w-14 text-3xs">
            <SelectValue placeholder="RPE" />
          </SelectTrigger>
          <SelectContent>
            {[6, 7, 8, 9, 10].map((rpe) => (
              <SelectItem key={rpe} value={rpe.toString()} className="text-xs">
                RPE {rpe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={exercise.restSeconds.toString()}
          onValueChange={(val) => onUpdate({ ...exercise, restSeconds: parseInt(val) })}
        >
          <SelectTrigger className="h-6 flex-1 text-3xs">
            <SelectValue placeholder="Rest" />
          </SelectTrigger>
          <SelectContent>
            {REST_OPTIONS.map((sec) => (
              <SelectItem key={sec} value={sec.toString()} className="text-xs">
                {sec >= 60
                  ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`
                  : `${sec}s`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <Input
        type="text"
        value={exercise.notes}
        onChange={(e) => onUpdate({ ...exercise, notes: e.target.value })}
        className="h-6 text-3xs px-1.5"
        placeholder="Note..."
      />
    </div>
  );
}

// Droppable workout session container
function WorkoutSessionContainer({
  session,
  dayIndex,
  weekIndex,
  sessionIndex,
  totalSessions,
  oneRM,
  selectedExerciseId,
  onUpdateSession,
  onRemoveSession,
  onUpdateExercise,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
}: {
  session: WorkoutSession;
  dayIndex: number;
  weekIndex: number;
  sessionIndex: number;
  totalSessions: number;
  oneRM: number;
  selectedExerciseId?: string | null;
  onUpdateSession: (updates: Partial<WorkoutSession>) => void;
  onRemoveSession: () => void;
  onUpdateExercise: (exerciseId: string, updated: ProgramExercise) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onToggleSuperset: (exerciseId: string) => void;
  onSelectExercise?: (exercise: ProgramExercise) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `session-${weekIndex}-${dayIndex}-${session.id}`,
    data: { type: "session-cell", weekIndex, dayIndex, sessionId: session.id },
  });

  // Get superset colors
  const supersetGroups = [
    ...new Set(session.exercises.filter((e) => e.supersetGroup).map((e) => e.supersetGroup)),
  ];
  const supersetColors: Record<string, string> = {};
  const colors = [
    "border-l-primary",
    "border-l-emerald-500",
    "border-l-amber-500",
    "border-l-cyan-500",
  ];
  supersetGroups.forEach((group, i) => {
    if (group) supersetColors[group] = colors[i % colors.length];
  });

  const totalVolume = session.exercises.reduce((acc, ex) => {
    const reps = parseInt(ex.reps) || 0;
    return acc + ex.sets * reps;
  }, 0);

  const sessionIcon = sessionIndex === 0 ? Sunrise : Moon;
  const SessionIcon = sessionIcon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-card/50 transition-all",
        isOver && "ring-2 ring-primary border-primary bg-primary/5",
        session.exercises.length === 0 && "border-dashed",
      )}
    >
      {/* Session Header */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/50 bg-muted/20">
        <SessionIcon className="h-3 w-3 text-muted-foreground" />
        <Input
          type="text"
          value={session.name}
          onChange={(e) => onUpdateSession({ name: e.target.value })}
          className="h-5 flex-1 text-3xs font-medium bg-transparent border-none px-1 focus-visible:ring-0"
          placeholder="Sessione..."
        />
        {session.exercises.length > 0 && (
          <Badge variant="secondary" className="text-5xs h-4 px-1">
            {session.exercises.length} ex
          </Badge>
        )}
        {totalSessions > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Altre opzioni" className="h-5 w-5">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRemoveSession} className="text-destructive">
                <Trash2 className="h-3 w-3 mr-2" />
                Rimuovi sessione
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Exercise List */}
      <div className="p-1.5 space-y-1.5 min-h-[80px]">
        <SortableContext
          items={session.exercises.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <TooltipProvider>
            {session.exercises.map((exercise) => (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                sessionId={session.id}
                oneRM={oneRM}
                isSelected={selectedExerciseId === exercise.id}
                onUpdate={(updated) => onUpdateExercise(exercise.id, updated)}
                onRemove={() => onRemoveExercise(exercise.id)}
                onToggleSuperset={() => onToggleSuperset(exercise.id)}
                onSelect={() => onSelectExercise?.(exercise)}
                isInSuperset={!!exercise.supersetGroup}
                supersetColor={
                  exercise.supersetGroup ? supersetColors[exercise.supersetGroup] : undefined
                }
              />
            ))}
          </TooltipProvider>
        </SortableContext>

        {session.exercises.length === 0 && (
          <div className="h-full min-h-[60px] flex items-center justify-center">
            <div className="text-center">
              <Plus className="h-4 w-4 text-muted-foreground/30 mx-auto mb-0.5" />
              <p className="text-4xs text-muted-foreground">Trascina qui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Day column with multiple sessions
function DayColumn({
  dayIndex,
  weekIndex,
  sessions,
  oneRM,
  selectedExerciseId,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
  onUpdateExercise,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
}: {
  dayIndex: number;
  weekIndex: number;
  sessions: WorkoutSession[];
  oneRM: number;
  selectedExerciseId?: string | null;
  onAddSession: () => void;
  onUpdateSession: (sessionId: string, updates: Partial<WorkoutSession>) => void;
  onRemoveSession: (sessionId: string) => void;
  onUpdateExercise: (sessionId: string, exerciseId: string, updated: ProgramExercise) => void;
  onRemoveExercise: (sessionId: string, exerciseId: string) => void;
  onToggleSuperset: (sessionId: string, exerciseId: string) => void;
  onSelectExercise?: (sessionId: string, exercise: ProgramExercise) => void;
}) {
  const totalExercises = sessions.reduce((acc, s) => acc + s.exercises.length, 0);
  const totalVolume = sessions.reduce((acc, s) => {
    return (
      acc +
      s.exercises.reduce((a, ex) => {
        const reps = parseInt(ex.reps) || 0;
        return a + ex.sets * reps;
      }, 0)
    );
  }, 0);

  return (
    <div className="flex flex-col min-w-[180px] max-w-[220px] rounded-lg border border-border/50 bg-muted/10">
      {/* Day Header */}
      <div className="px-2 py-1.5 border-b border-border/50 bg-muted/30 flex items-center justify-between">
        <span className="text-xs font-semibold">{DAYS[dayIndex]}</span>
        {totalExercises > 0 && (
          <Badge variant="secondary" className="text-4xs h-4 px-1.5">
            {totalExercises} ex • {totalVolume} vol
          </Badge>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 p-1.5 space-y-2 overflow-y-auto">
        {sessions.map((session, idx) => (
          <WorkoutSessionContainer
            key={session.id}
            session={session}
            dayIndex={dayIndex}
            weekIndex={weekIndex}
            sessionIndex={idx}
            totalSessions={sessions.length}
            oneRM={oneRM}
            selectedExerciseId={selectedExerciseId}
            onUpdateSession={(updates) => onUpdateSession(session.id, updates)}
            onRemoveSession={() => onRemoveSession(session.id)}
            onUpdateExercise={(exerciseId, updated) =>
              onUpdateExercise(session.id, exerciseId, updated)
            }
            onRemoveExercise={(exerciseId) => onRemoveExercise(session.id, exerciseId)}
            onToggleSuperset={(exerciseId) => onToggleSuperset(session.id, exerciseId)}
            onSelectExercise={(exercise) => onSelectExercise?.(session.id, exercise)}
          />
        ))}

        {/* Add Session Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-3xs text-muted-foreground hover:text-foreground border border-dashed border-border/50"
          onClick={onAddSession}
        >
          <Plus className="h-3 w-3 mr-1" />
          Aggiungi Sessione
        </Button>
      </div>
    </div>
  );
}

interface MultiSessionDayGridProps {
  currentWeek: number;
  weekData: DayProgram;
  oneRM: number;
  selectedExerciseId?: string | null;
  onAddSession: (dayIndex: number) => void;
  onUpdateSession: (dayIndex: number, sessionId: string, updates: Partial<WorkoutSession>) => void;
  onRemoveSession: (dayIndex: number, sessionId: string) => void;
  onUpdateExercise: (
    dayIndex: number,
    sessionId: string,
    exerciseId: string,
    updated: ProgramExercise,
  ) => void;
  onRemoveExercise: (dayIndex: number, sessionId: string, exerciseId: string) => void;
  onToggleSuperset: (dayIndex: number, sessionId: string, exerciseId: string) => void;
  onSelectExercise?: (dayIndex: number, sessionId: string, exercise: ProgramExercise) => void;
}

export function MultiSessionDayGrid({
  currentWeek,
  weekData,
  oneRM,
  selectedExerciseId,
  onAddSession,
  onUpdateSession,
  onRemoveSession,
  onUpdateExercise,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
}: MultiSessionDayGridProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex gap-2 p-3 min-h-full">
        {DAYS.map((_, dayIndex) => {
          // Ensure there's at least one session per day
          const sessions = weekData[dayIndex] || [
            {
              id: `default-${currentWeek}-${dayIndex}`,
              name: "Sessione",
              exercises: [],
            },
          ];

          return (
            <DayColumn
              key={dayIndex}
              dayIndex={dayIndex}
              weekIndex={currentWeek}
              sessions={sessions}
              oneRM={oneRM}
              selectedExerciseId={selectedExerciseId}
              onAddSession={() => onAddSession(dayIndex)}
              onUpdateSession={(sessionId, updates) =>
                onUpdateSession(dayIndex, sessionId, updates)
              }
              onRemoveSession={(sessionId) => onRemoveSession(dayIndex, sessionId)}
              onUpdateExercise={(sessionId, exerciseId, updated) =>
                onUpdateExercise(dayIndex, sessionId, exerciseId, updated)
              }
              onRemoveExercise={(sessionId, exerciseId) =>
                onRemoveExercise(dayIndex, sessionId, exerciseId)
              }
              onToggleSuperset={(sessionId, exerciseId) =>
                onToggleSuperset(dayIndex, sessionId, exerciseId)
              }
              onSelectExercise={(sessionId, exercise) =>
                onSelectExercise?.(dayIndex, sessionId, exercise)
              }
            />
          );
        })}
      </div>
    </ScrollArea>
  );
}
