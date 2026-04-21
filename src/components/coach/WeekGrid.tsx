import { useState } from "react";
import { DayBuilderCard } from "@/components/coach/program/DayBuilderCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import type { ExerciseProgression } from "@/types/progression";

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
  isEmpty?: boolean;
  // Snapshot fields - frozen at time of adding to program
  snapshotTrackingFields?: string[];
  snapshotMuscles?: string[];
  // Progression logic
  progression?: ExerciseProgression;
}

export type WeekProgram = Record<number, ProgramExercise[]>;
export type ProgramData = Record<number, WeekProgram>;

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const DAYS_FULL = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

// Copy Day Dialog
function CopyDayDialog({
  open,
  onOpenChange,
  sourceDayIndex,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDayIndex: number;
  isLoading?: boolean;
  onConfirm: (targetDays: number[], mode: "append" | "overwrite") => void;
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [mode, setMode] = useState<"append" | "overwrite">("append");

  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onConfirm(selectedDays, mode);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDays([]);
      setMode("append");
    }
    onOpenChange(isOpen);
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Copia Allenamento
          </DialogTitle>
          <DialogDescription>
            Copia da: <strong>{DAYS_FULL[sourceDayIndex]}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Seleziona giorni destinazione
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_FULL.map((day, idx) =>
                idx !== sourceDayIndex ? (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border",
                      selectedDays.includes(idx)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary border-transparent",
                    )}
                    onClick={() => toggleDay(idx)}
                  >
                    <Checkbox checked={selectedDays.includes(idx)} />
                    <span className="text-sm">{day}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Modalità</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "append" | "overwrite")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="append" />
                <Label htmlFor="append" className="text-sm cursor-pointer">
                  Aggiungi (mantieni esercizi esistenti)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="text-sm cursor-pointer">
                  Sovrascrivi (sostituisci tutto)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedDays.length === 0 || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copia in {selectedDays.length} giorni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Copy Week Dialog
function CopyWeekDialog({
  open,
  onOpenChange,
  sourceWeek,
  totalWeeks,
  isLoading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWeek: number;
  totalWeeks: number;
  isLoading?: boolean;
  onConfirm: (targetWeeks: number[]) => void;
}) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);

  const handleConfirm = () => {
    if (selectedWeeks.length > 0) {
      onConfirm(selectedWeeks);
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWeeks([]);
    }
    onOpenChange(isOpen);
  };

  const toggleWeek = (weekIndex: number) => {
    setSelectedWeeks((prev) =>
      prev.includes(weekIndex)
        ? prev.filter((w) => w !== weekIndex)
        : [...prev, weekIndex],
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Copia Settimana
          </DialogTitle>
          <DialogDescription>
            Copia da: <strong>Settimana {sourceWeek + 1}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Seleziona settimane destinazione
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: totalWeeks }, (_, idx) =>
                idx !== sourceWeek ? (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border",
                      selectedWeeks.includes(idx)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary border-transparent",
                    )}
                    onClick={() => toggleWeek(idx)}
                  >
                    <Checkbox checked={selectedWeeks.includes(idx)} />
                    <span className="text-sm">Sett. {idx + 1}</span>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Le settimane selezionate verranno <strong>sostituite</strong>{" "}
            completamente.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedWeeks.length === 0 || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            Copia in {selectedWeeks.length} settimane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WeekGridProps {
  currentWeek: number;
  totalWeeks: number;
  weekData: WeekProgram;
  selectedExerciseId?: string | null;
  isCopyingDay?: boolean;
  isCopyingWeek?: boolean;
  onWeekChange: (week: number) => void;
  onRemoveExercise: (dayIndex: number, exerciseId: string) => void;
  onToggleSuperset: (dayIndex: number, exerciseId: string) => void;
  onSelectExercise?: (dayIndex: number, exercise: ProgramExercise) => void;
  onAddSlot: (dayIndex: number) => void;
  onCopyDay: (
    sourceDayIndex: number,
    targetDays: number[],
    mode: "append" | "overwrite",
  ) => void;
  onCopyWeekTo: (targetWeeks: number[]) => void;
  onClearWeek: () => void;
  onSaveAsTemplate: (dayIndex: number) => void;
  onCopyDayDialogClose?: () => void;
  onCopyWeekDialogClose?: () => void;
}

export function WeekGrid({
  currentWeek,
  totalWeeks,
  weekData,
  selectedExerciseId,
  isCopyingDay,
  isCopyingWeek,
  onWeekChange,
  onRemoveExercise,
  onToggleSuperset,
  onSelectExercise,
  onAddSlot,
  onCopyDay,
  onCopyWeekTo,
  onClearWeek,
  onSaveAsTemplate,
  onCopyDayDialogClose,
  onCopyWeekDialogClose,
}: WeekGridProps) {
  const [copyDayDialogOpen, setCopyDayDialogOpen] = useState(false);
  const [copyDaySource, setCopyDaySource] = useState(0);
  const [copyWeekDialogOpen, setCopyWeekDialogOpen] = useState(false);

  const handleOpenCopyDayDialog = (dayIndex: number) => {
    setCopyDaySource(dayIndex);
    setCopyDayDialogOpen(true);
  };

  const handleCopyDayConfirm = (
    targetDays: number[],
    mode: "append" | "overwrite",
  ) => {
    onCopyDay(copyDaySource, targetDays, mode);
  };

  // Close dialogs when copy operation completes
  const handleCopyDayDialogChange = (open: boolean) => {
    setCopyDayDialogOpen(open);
    if (!open) onCopyDayDialogClose?.();
  };

  const handleCopyWeekDialogChange = (open: boolean) => {
    setCopyWeekDialogOpen(open);
    if (!open) onCopyWeekDialogClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onWeekChange(currentWeek - 1)}
            disabled={currentWeek <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[100px] text-center">
            Settimana {currentWeek + 1} / {totalWeeks}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onWeekChange(currentWeek + 1)}
            disabled={currentWeek >= totalWeeks - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCopyWeekDialogOpen(true)}
              >
                <Layers className="h-3 w-3 mr-1" />
                Copia Sett.
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copia settimana in altre settimane</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onClearWeek}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Pulisci
              </Button>
            </TooltipTrigger>
            <TooltipContent>Svuota questa settimana</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Days Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 gap-2 p-2 min-h-full">
          {DAYS.map((_, dayIndex) => (
            <DayBuilderCard
              key={dayIndex}
              dayIndex={dayIndex}
              weekIndex={currentWeek}
              exercises={weekData[dayIndex] || []}
              selectedExerciseId={selectedExerciseId}
              onRemoveExercise={(exerciseId) =>
                onRemoveExercise(dayIndex, exerciseId)
              }
              onToggleSuperset={(exerciseId) =>
                onToggleSuperset(dayIndex, exerciseId)
              }
              onSelectExercise={(exercise) =>
                onSelectExercise?.(dayIndex, exercise)
              }
              onAddSlot={() => onAddSlot(dayIndex)}
              onCopyDay={() => handleOpenCopyDayDialog(dayIndex)}
              onSaveAsTemplate={() => onSaveAsTemplate(dayIndex)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Copy Day Dialog */}
      <CopyDayDialog
        open={copyDayDialogOpen}
        onOpenChange={handleCopyDayDialogChange}
        sourceDayIndex={copyDaySource}
        isLoading={isCopyingDay}
        onConfirm={handleCopyDayConfirm}
      />

      {/* Copy Week Dialog */}
      <CopyWeekDialog
        open={copyWeekDialogOpen}
        onOpenChange={handleCopyWeekDialogChange}
        sourceWeek={currentWeek}
        totalWeeks={totalWeeks}
        isLoading={isCopyingWeek}
        onConfirm={onCopyWeekTo}
      />
    </div>
  );
}
