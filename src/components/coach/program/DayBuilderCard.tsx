import React, { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Link2, Unlink, Copy, Plus, Bookmark, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramExercise } from "@/components/coach/WeekGrid";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Empty slot - droppable placeholder
function EmptySlot({
  slotId,
  dayIndex,
  weekIndex,
  onRemove,
}: {
  slotId: string;
  dayIndex: number;
  weekIndex: number;
  onRemove: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotId,
    data: { type: "empty-slot", weekIndex, dayIndex, slotId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-4 text-center transition-all group min-h-[52px] flex items-center justify-center",
        isOver
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-muted-foreground/40 bg-muted/10 opacity-70 hover:opacity-90 hover:border-muted-foreground/60",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Rimuovi slot"
        className="absolute top-0.5 right-0.5 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      <p className="text-3xs text-muted-foreground/80 font-medium">Trascina esercizio qui</p>
    </div>
  );
}

// Compact sortable exercise card with drag handle
function SortableExercise({
  exercise,
  dayIndex,
  weekIndex,
  isSelected,
  onRemove,
  onToggleSuperset,
  onSelect,
  isInSuperset,
  supersetColor,
}: {
  exercise: ProgramExercise;
  dayIndex: number;
  weekIndex: number;
  isSelected?: boolean;
  onRemove: () => void;
  onToggleSuperset: () => void;
  onSelect?: () => void;
  isInSuperset: boolean;
  supersetColor?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.id,
    data: { type: "program-exercise", exercise, dayIndex, weekIndex },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const setsReps = exercise.sets ? `${exercise.sets}×${exercise.reps || "?"}` : null;
  const rpeText = exercise.rpe ? `RPE ${exercise.rpe}` : null;
  const hasProgression = exercise.progression?.enabled && exercise.progression.rules.length > 0;

  const handleSelect = () => onSelect?.();
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      style={style}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, [data-drag-handle]")) return;
        handleSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if ((e.target as HTMLElement).closest("button, [data-drag-handle]")) return;
          e.preventDefault();
          handleSelect();
        }
      }}
      className={cn(
        "bg-card rounded-lg border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary z-50",
        isSelected && "ring-2 ring-primary border-primary bg-primary/5",
        isInSuperset && "border-l-4",
        supersetColor,
        !isDragging && "hover:shadow-md",
      )}
    >
      <div className="flex items-stretch">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          data-drag-handle
          className={cn(
            "flex items-center justify-center px-1.5 rounded-l-lg border-r border-border/50",
            "bg-muted/30 hover:bg-muted cursor-grab active:cursor-grabbing",
            "touch-none select-none flex-shrink-0",
          )}
        >
          <div className="flex flex-col gap-[2px]">
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
            <div className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
              <span className="w-[3px] h-[3px] rounded-full bg-muted-foreground/50" />
            </div>
          </div>
        </button>

        <div className="flex-1 p-2 min-w-0 group cursor-pointer">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-2xs font-medium truncate leading-tight" title={exercise.name}>
                  {exercise.name}
                </p>
                {hasProgression && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-shrink-0 h-4 w-4 rounded bg-chart-3/20 flex items-center justify-center">
                        <TrendingUp className="h-2.5 w-2.5 text-chart-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Progressione attiva
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {setsReps && (
                  <span className="text-3xs font-medium text-foreground/80">{setsReps}</span>
                )}
                {rpeText && (
                  <span className="text-4xs text-muted-foreground bg-muted/50 px-1 py-0.5 rounded">
                    {rpeText}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isInSuperset ? "Rimuovi dal superset" : "Collega in superset"}
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isInSuperset && "text-primary opacity-100",
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
                className="h-5 w-5 text-destructive hover:text-destructive flex-shrink-0"
                onClick={onRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Props for the memoized day builder card
export interface DayBuilderCardProps {
  dayIndex: number;
  weekIndex: number;
  exercises: ProgramExercise[];
  selectedExerciseId?: string | null;
  onRemoveExercise: (exerciseId: string) => void;
  onToggleSuperset: (exerciseId: string) => void;
  onSelectExercise?: (exercise: ProgramExercise) => void;
  onAddSlot: () => void;
  onCopyDay: () => void;
  onSaveAsTemplate: () => void;
}

// Memoized Day Builder Card — only re-renders when its own props change
export const DayBuilderCard = memo(function DayBuilderCard({
  dayIndex,
  weekIndex,
  exercises,
  selectedExerciseId,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
  onAddSlot,
  onCopyDay,
  onSaveAsTemplate,
}: DayBuilderCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${weekIndex}-${dayIndex}`,
    data: { type: "day-cell", weekIndex, dayIndex },
  });

  const supersetGroups = [
    ...new Set(exercises.filter((e) => e.supersetGroup && !e.isEmpty).map((e) => e.supersetGroup)),
  ];
  const supersetColors: Record<string, string> = {};
  const colors = ["border-l-primary", "border-l-success", "border-l-warning", "border-l-accent"];
  supersetGroups.forEach((group, i) => {
    if (group) supersetColors[group] = colors[i % colors.length];
  });

  const filledExercises = exercises.filter((e) => !e.isEmpty);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[150px] rounded-lg border transition-all",
        isOver && "ring-2 ring-primary border-primary bg-primary/5",
        exercises.length === 0 && "border-dashed",
      )}
    >
      {/* Day Header */}
      <div className="px-2 py-1.5 border-b border-border/50 bg-muted/30 flex items-center justify-between group">
        <span className="text-xs font-semibold">{DAYS[dayIndex]}</span>
        <div className="flex items-center gap-1">
          {filledExercises.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Salva come template"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={onSaveAsTemplate}
                  >
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Salva come template</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copia allenamento"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={onCopyDay}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copia allenamento</TooltipContent>
              </Tooltip>
              <Badge variant="secondary" className="text-4xs h-4 px-1.5">
                {filledExercises.length} ex
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {exercises.map((exercise) =>
            exercise.isEmpty ? (
              <EmptySlot
                key={exercise.id}
                slotId={exercise.id}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ) : (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                dayIndex={dayIndex}
                weekIndex={weekIndex}
                isSelected={selectedExerciseId === exercise.id}
                onRemove={() => onRemoveExercise(exercise.id)}
                onToggleSuperset={() => onToggleSuperset(exercise.id)}
                onSelect={() => onSelectExercise?.(exercise)}
                isInSuperset={!!exercise.supersetGroup}
                supersetColor={
                  exercise.supersetGroup ? supersetColors[exercise.supersetGroup] : undefined
                }
              />
            ),
          )}
        </SortableContext>

        {exercises.length === 0 && (
          <div className="h-full min-h-[80px] flex items-center justify-center">
            <div className="text-center">
              <Plus className="h-5 w-5 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-3xs text-muted-foreground">Trascina qui</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Slot Button */}
      <div className="p-1.5 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-3xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
          onClick={onAddSlot}
        >
          <Plus className="h-3 w-3 mr-1" />
          Aggiungi slot
        </Button>
      </div>
    </div>
  );
});
