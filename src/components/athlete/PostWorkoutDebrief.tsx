import { useState } from "react";
import { X, MoreVertical, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface PostWorkoutDebriefProps {
  workoutName: string;
  duration: string;
  totalVolume: number;
  setsCompleted: number;
  setsPlanned: number;
  musclesTrained: string[];
  initialRpe?: number;
  onClose?: () => void;
  onMore?: () => void;
  onSave: (data: { rpe: number; notes: string }) => void;
}

const RPE_LABELS: Record<number, string> = {
  5: "Light (Could do many more reps)",
  6: "Moderate (Could do 4-6 more reps)",
  7: "Challenging (Could do 3 more reps)",
  8: "Hard (Could do 2 more reps max)",
  9: "Very Hard (Could do 1 more rep)",
  10: "Maximal (Could not do any more)",
};

export const PostWorkoutDebrief = ({
  workoutName,
  duration,
  totalVolume,
  setsCompleted,
  setsPlanned,
  musclesTrained,
  initialRpe = 8,
  onClose,
  onMore,
  onSave,
}: PostWorkoutDebriefProps) => {
  const [rpe, setRpe] = useState<number>(initialRpe);
  const [notes, setNotes] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2 text-foreground" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <h1 className="font-[Manrope] font-bold text-foreground text-lg">Session Summary</h1>
        <button onClick={onMore} className="p-2 -mr-2 text-foreground" aria-label="More">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-32">
        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2} />
          </div>
          <h2 className="font-[Manrope] font-bold text-4xl text-foreground leading-tight">
            Workout Complete
          </h2>
          <p className="text-muted-foreground">
            {workoutName} • {duration}
          </p>
        </div>

        {/* Summary card */}
        <section className="bg-card rounded-2xl p-5 border border-border space-y-5">
          <p className="font-[Manrope] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Session Summary
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="font-[Manrope] font-bold text-2xl text-foreground">
                {totalVolume.toLocaleString()} kg
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sets Completed</p>
              <p className="font-[Manrope] font-bold text-2xl">
                <span className="text-primary">{setsCompleted}</span>
                <span className="text-muted-foreground"> / {setsPlanned}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Muscles Trained</p>
            <div className="flex flex-wrap gap-2">
              {musclesTrained.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 rounded-full bg-primary/10 text-foreground text-sm"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* RPE */}
        <section className="space-y-3">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">Session RPE</h3>
          <p className="text-sm text-muted-foreground">How hard was this entire workout?</p>

          <div className="flex justify-between gap-2">
            {[5, 6, 7, 8, 9, 10].map((n) => {
              const active = rpe === n;
              return (
                <button
                  key={n}
                  onClick={() => setRpe(n)}
                  className={`flex-1 aspect-square rounded-full font-[Manrope] font-semibold text-lg transition-all ${
                    active
                      ? "bg-primary text-primary-foreground scale-110 shadow-md"
                      : "bg-primary/10 text-foreground hover:bg-primary/15"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-primary font-semibold text-center">
            {rpe} - {RPE_LABELS[rpe]}
          </p>
        </section>

        {/* Notes */}
        <section className="space-y-2">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">
            Notes for Coach <span className="text-muted-foreground font-normal">(Optional)</span>
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any pain, fatigue, or feedback...?"
            className="min-h-32 rounded-2xl bg-primary/5 border-0 resize-none placeholder:text-muted-foreground"
          />
        </section>
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <Button
          onClick={() => onSave({ rpe, notes })}
          className="w-full h-12 rounded-full font-[Manrope] font-bold gap-2"
          size="lg"
        >
          Save &amp; Return Home
          <ArrowRight className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  );
};

export default PostWorkoutDebrief;
