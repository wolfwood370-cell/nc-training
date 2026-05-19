import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Dumbbell, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";

interface ScheduleWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekName: string;
  startDate: Date;
  workouts: Array<{
    id: string;
    name: string;
    day_number?: number;
  }>;
  onConfirm: () => void;
  isScheduling: boolean;
}

export function ScheduleWeekDialog({
  open,
  onOpenChange,
  weekName,
  startDate,
  workouts,
  onConfirm,
  isScheduling,
}: ScheduleWeekDialogProps) {
  // Group workouts by day number
  const workoutsByDay = workouts.reduce(
    (acc, workout) => {
      const dayNum = workout.day_number ?? 1;
      if (!acc[dayNum]) acc[dayNum] = [];
      acc[dayNum].push(workout);
      return acc;
    },
    {} as Record<number, typeof workouts>,
  );

  const uniqueDays = Object.keys(workoutsByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Pianifica Settimana
          </DialogTitle>
          <DialogDescription>
            Vuoi programmare <strong>{weekName}</strong> a partire da{" "}
            <strong>{format(startDate, "EEEE d MMMM", { locale: it })}</strong>?
          </DialogDescription>
        </DialogHeader>

        {/* Preview of schedule */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {uniqueDays.map((dayNum) => {
            const dayWorkouts = workoutsByDay[dayNum];
            const scheduledDate = addDays(startDate, dayNum - 1);

            return (
              <div key={dayNum} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <div className="text-center min-w-[60px]">
                  <p className="text-3xs uppercase text-muted-foreground">
                    {format(scheduledDate, "EEE", { locale: it })}
                  </p>
                  <p className="text-lg font-semibold tabular-nums">{format(scheduledDate, "d")}</p>
                </div>
                <div className="flex-1 space-y-1">
                  {dayWorkouts.map((workout) => (
                    <div key={workout.id} className="flex items-center gap-2 text-sm">
                      <Dumbbell className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{workout.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-3xs">
            {workouts.length} workout
          </Badge>
          <span>verranno programmati su {uniqueDays.length} giorni</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isScheduling}>
            Annulla
          </Button>
          <Button onClick={onConfirm} disabled={isScheduling}>
            {isScheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Programmazione...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Conferma
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
