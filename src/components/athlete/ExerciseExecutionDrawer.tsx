import { useState } from "react";
import { Play, Headphones, Check, Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export interface ExerciseSet {
  id: string;
  previous?: string; // e.g. "100kg x 8"
  kg: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

export interface ExerciseExecutionDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  exerciseLabel?: string;
  exerciseName: string;
  phase?: string;
  targetRpe?: number;
  videoThumbnailUrl?: string;
  coachNotes?: string;
  initialSets: ExerciseSet[];
  onPlayVideo?: () => void;
  onSetsChange?: (sets: ExerciseSet[]) => void;
}

export const ExerciseExecutionDrawer = ({
  open,
  onOpenChange,
  exerciseLabel = "A1.",
  exerciseName,
  phase,
  targetRpe,
  videoThumbnailUrl,
  coachNotes,
  initialSets,
  onPlayVideo,
  onSetsChange,
}: ExerciseExecutionDrawerProps) => {
  const [sets, setSets] = useState<ExerciseSet[]>(initialSets);

  const update = (next: ExerciseSet[]) => {
    setSets(next);
    onSetsChange?.(next);
  };

  const patch = (id: string, p: Partial<ExerciseSet>) =>
    update(sets.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const addSet = () => {
    const last = sets[sets.length - 1];
    update([
      ...sets,
      {
        id: crypto.randomUUID(),
        previous: last?.previous,
        kg: "",
        reps: "",
        rpe: "",
        completed: false,
      },
    ]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 bg-background font-[Inter] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-muted" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">
          {/* Video */}
          <button
            onClick={onPlayVideo}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted group mt-1"
          >
            {videoThumbnailUrl ? (
              <img
                src={videoThumbnailUrl}
                alt={exerciseName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-background/95 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Play className="w-7 h-7 text-primary fill-primary ml-1" />
              </div>
            </div>
          </button>

          {/* Title */}
          <div>
            <h2 className="font-[Manrope] font-bold text-2xl text-foreground">
              {exerciseLabel} {exerciseName}
            </h2>
            {(phase || targetRpe !== undefined) && (
              <p className="mt-1 font-[Manrope] font-bold text-xs uppercase tracking-wider text-muted-foreground">
                {phase && <>Phase: {phase}</>}
                {phase && targetRpe !== undefined && " • "}
                {targetRpe !== undefined && <>Target RPE: {targetRpe}</>}
              </p>
            )}
          </div>

          {/* Coach notes */}
          {coachNotes && (
            <div className="bg-primary/5 rounded-2xl p-4 border-l-4 border-primary space-y-2">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                <p className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-primary">
                  Coach's Notes
                </p>
              </div>
              <p className="text-foreground leading-relaxed">{coachNotes}</p>
            </div>
          )}

          {/* Sets table */}
          <div className="space-y-2">
            <div className="grid grid-cols-[28px_1fr_64px_56px_56px_36px] gap-2 px-1 pb-1 items-center">
              {["Set", "Previous", "kg", "reps", "RPE"].map((h) => (
                <div
                  key={h}
                  className="font-[Manrope] font-semibold text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </div>
              ))}
              <Check className="w-4 h-4 text-muted-foreground justify-self-center" />
            </div>

            {sets.map((s, i) => (
              <div
                key={s.id}
                className={`grid grid-cols-[28px_1fr_64px_56px_56px_36px] gap-2 items-center px-2 py-2.5 rounded-full border transition-colors ${
                  s.completed
                    ? "bg-primary/10 border-transparent"
                    : "bg-card border-border"
                }`}
              >
                <span className="font-[Manrope] font-bold text-foreground text-sm">{i + 1}</span>
                <span className="text-sm text-muted-foreground truncate">
                  {s.previous ?? "-"}
                </span>
                <Input
                  value={s.kg}
                  onChange={(e) => patch(s.id, { kg: e.target.value })}
                  inputMode="decimal"
                  className={`h-9 text-center px-1 text-sm rounded-lg ${
                    s.completed ? "border-transparent bg-card" : ""
                  }`}
                />
                <Input
                  value={s.reps}
                  onChange={(e) => patch(s.id, { reps: e.target.value })}
                  inputMode="numeric"
                  className={`h-9 text-center px-1 text-sm rounded-lg ${
                    s.completed ? "border-transparent bg-card" : ""
                  }`}
                />
                <Input
                  value={s.rpe}
                  onChange={(e) => patch(s.id, { rpe: e.target.value })}
                  inputMode="decimal"
                  placeholder="-"
                  className={`h-9 text-center px-1 text-sm rounded-lg placeholder:text-muted-foreground ${
                    s.completed ? "border-transparent bg-card" : ""
                  }`}
                />
                <button
                  onClick={() => patch(s.id, { completed: !s.completed })}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    s.completed
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-border bg-transparent"
                  }`}
                  aria-label="Mark complete"
                >
                  {s.completed && <Check className="w-4 h-4" strokeWidth={3} />}
                </button>
              </div>
            ))}

            <button
              onClick={addSet}
              className="w-full mt-1 h-12 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 font-[Manrope] font-bold text-sm uppercase tracking-wider text-primary"
            >
              <Plus className="w-5 h-5" />
              Add Set
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExerciseExecutionDrawer;
