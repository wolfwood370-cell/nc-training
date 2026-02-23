import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dumbbell, Play, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetInputRow } from "./SetInputRow";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/media";
import type { LastSetData } from "@/hooks/useExerciseHistory";
import { motion } from "framer-motion";

export interface SetData {
  id: string;
  setNumber: number;
  targetKg: number;
  targetReps: number;
  targetRpe?: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
}

export interface ExerciseData {
  id: string;
  name: string;
  videoUrl?: string;
  coachNotes?: string;
  restSeconds: number;
  supersetGroup?: string;
  sets: SetData[];
  originalSetsCount?: number;
  originalTargetRpe?: number;
}

interface ExerciseCardProps {
  exercise: ExerciseData;
  exerciseIndex: number;
  isActive: boolean;
  isRecoveryMode: boolean;
  supersetInfo?: { index: number; total: number; isFirst: boolean };
  historyData?: LastSetData | null;
  onSetUpdate: (exerciseId: string, setId: string, field: string, value: string | boolean) => void;
  onSetComplete: (exerciseId: string, setId: string, completed: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Space 1 – Video Thumbnail                                         */
/* ------------------------------------------------------------------ */

function VideoThumbnail({ videoUrl }: { videoUrl?: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const hasYoutube = !!youtubeId;

  // Placeholder when no video exists
  if (!videoUrl) {
    return (
      <AspectRatio ratio={16 / 9} className="bg-muted/40 rounded-xl overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
        </div>
      </AspectRatio>
    );
  }

  // YouTube thumbnail with dialog
  if (hasYoutube) {
    return (
      <>
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <img
              src={getYouTubeThumbnail(youtubeId)}
              alt="Video esercizio"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35">
              <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          </AspectRatio>
        </button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Video esercizio</DialogTitle>
            </DialogHeader>
            <AspectRatio ratio={16 / 9}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full border-0"
                title="Video esercizio"
              />
            </AspectRatio>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Non-YouTube video: show native player in dialog
  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className="w-full rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <div className="flex items-center justify-center h-full">
            <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        </AspectRatio>
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Video esercizio</DialogTitle>
          </DialogHeader>
          <video src={videoUrl} controls autoPlay playsInline className="w-full" />
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Protocol Summary builder                                          */
/* ------------------------------------------------------------------ */

function buildProtocol(exercise: ExerciseData, isRecoveryMode: boolean): string {
  const parts: string[] = [];
  const sets = exercise.sets.length;
  const reps = exercise.sets[0]?.targetReps;
  const rpe = exercise.sets[0]?.targetRpe;

  if (isRecoveryMode && exercise.originalSetsCount && exercise.originalSetsCount !== sets) {
    parts.push(`${sets} Serie (da ${exercise.originalSetsCount})`);
  } else {
    parts.push(`${sets} Serie`);
  }

  if (reps) parts.push(`${reps} Ripetizioni`);

  if (rpe) {
    if (isRecoveryMode && exercise.originalTargetRpe && exercise.originalTargetRpe !== rpe) {
      parts.push(`RPE ${rpe} (da ${exercise.originalTargetRpe})`);
    } else {
      parts.push(`RPE ${rpe}`);
    }
  }

  return parts.join(" x ");
}

/* ------------------------------------------------------------------ */
/*  ExerciseCard                                                       */
/* ------------------------------------------------------------------ */

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  exerciseIndex,
  isActive,
  isRecoveryMode,
  supersetInfo,
  historyData,
  onSetUpdate,
  onSetComplete,
}: ExerciseCardProps) {
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const allCompleted = completedSets === exercise.sets.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: exerciseIndex * 0.05 }}
    >
      <Card
        className={cn(
          "border-0 overflow-hidden transition-all duration-300",
          isActive
            ? "bg-[hsl(var(--m3-surface-container-high,var(--card)))] shadow-lg ring-1 ring-primary/10"
            : "bg-[hsl(var(--m3-surface-container,var(--card)))]",
          supersetInfo && "border-l-4 border-l-primary",
          allCompleted && "ring-1 ring-primary/30"
        )}
      >
        <CardContent className="p-0">
          {/* Superset indicator */}
          {supersetInfo?.isFirst && (
            <div className="px-4 py-1.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Superset ({supersetInfo.total} esercizi)
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4 p-4">
            {/* Space 1: Video Thumbnail */}
            <VideoThumbnail videoUrl={exercise.videoUrl} />

            {/* Space 2: Exercise Name */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {supersetInfo
                  ? `${supersetInfo.index + 1}/${supersetInfo.total}`
                  : `Esercizio ${exerciseIndex + 1}`}
              </span>
              <h3 className="text-xl font-bold tracking-tight">{exercise.name}</h3>

              {/* History context */}
              {historyData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ultima volta:{" "}
                  <span className="font-medium text-foreground">
                    {historyData.weight_kg}kg × {historyData.reps}
                    {historyData.rpe ? ` @RPE${historyData.rpe}` : ""}
                  </span>
                  {" — "}
                  {new Date(historyData.date).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>

            {/* Space 3: Protocol Summary */}
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Obiettivo:</span>{" "}
              {buildProtocol(exercise, isRecoveryMode)}
              {exercise.sets[0]?.targetKg > 0 && ` — ${exercise.sets[0].targetKg}kg`}
            </p>

            {/* Space 4: Coach's Notes */}
            {exercise.coachNotes && (
              <Alert className="bg-primary/5 border-primary/15">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm font-semibold">Note del Coach</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                  {exercise.coachNotes}
                </AlertDescription>
              </Alert>
            )}

            {/* Space 5: Set Input Rows */}
            <div>
              {/* Table Header */}
              <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 mb-2 px-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Set</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Kg</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Reps</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">RPE</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">✓</span>
              </div>

              <div className="space-y-2">
                {exercise.sets.map((set) => (
                  <SetInputRow
                    key={set.id}
                    exerciseId={exercise.id}
                    setNumber={set.setNumber}
                    targetKg={set.targetKg}
                    targetReps={set.targetReps}
                    targetRpe={set.targetRpe}
                    actualKg={set.actualKg}
                    actualReps={set.actualReps}
                    rpe={set.rpe}
                    completed={set.completed}
                    onUpdate={(field, value) => onSetUpdate(exercise.id, set.id, field, value)}
                    onComplete={(completed) => onSetComplete(exercise.id, set.id, completed)}
                  />
                ))}
              </div>
            </div>

            {/* Completion badge */}
            {allCompleted && (
              <div className="text-center">
                <span className="text-xs font-semibold text-primary">
                  ✓ {completedSets}/{exercise.sets.length} serie completate
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
