import { useState } from "react";
import { X, PlayCircle, CheckCircle2, Circle, Lightbulb, ChevronsRight } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export interface SupersetSet {
  id: string;
  previous?: string;
  kg: string;
  reps: string;
  completed: boolean;
}

export interface SupersetExercise {
  id: string;
  label: string; // "A1."
  name: string;
  sets: SupersetSet[];
  onPlayVideo?: () => void;
}

export interface SupersetExecutionDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  blockTitle?: string; // "A-Block: Superset"
  blockSubtitle?: string;
  exercises: SupersetExercise[];
  executionTip?: string;
  onExercisesChange?: (exercises: SupersetExercise[]) => void;
  onFinish?: () => void;
}

export const SupersetExecutionDrawer = ({
  open,
  onOpenChange,
  blockTitle = "A-Block: Superset",
  blockSubtitle = "Complete A1 and A2 back-to-back, then rest.",
  exercises: initial,
  executionTip,
  onExercisesChange,
  onFinish,
}: SupersetExecutionDrawerProps) => {
  const [exercises, setExercises] = useState(initial);

  const update = (next: SupersetExercise[]) => {
    setExercises(next);
    onExercisesChange?.(next);
  };

  const patchSet = (exId: string, setId: string, p: Partial<SupersetSet>) =>
    update(
      exercises.map((ex) =>
        ex.id !== exId
          ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...p } : s)) },
      ),
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 bg-background font-[Inter] flex flex-col"
      >
        {/* Header */}
        <header className="bg-card/70 backdrop-blur-xl border-b border-border sticky top-0 z-10 flex flex-col items-center pt-2">
          <div className="w-12 h-1.5 bg-muted rounded-full mt-1.5 mb-3" />
          <div className="flex justify-between items-center px-6 pb-4 w-full">
            <div className="flex flex-col">
              <h1 className="font-[Manrope] font-bold text-2xl text-foreground tracking-tight">
                {blockTitle}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{blockSubtitle}</p>
            </div>
            <button
              onClick={() => onOpenChange?.(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-primary" />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
          {exercises.map((ex) => (
            <section key={ex.id} className="relative pl-5 ml-1 border-l-[3px] border-primary">
              <div className="flex justify-between items-start mb-5 gap-4">
                <h2 className="font-[Manrope] font-bold text-xl text-foreground leading-tight">
                  {ex.label} {ex.name}
                </h2>
                <button
                  onClick={ex.onPlayVideo}
                  className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider hover:underline shrink-0"
                >
                  <PlayCircle className="w-4 h-4" />
                  Play Video
                </button>
              </div>

              {/* Logging table */}
              <div className="space-y-3">
                <div className="grid grid-cols-[32px_1fr_72px_56px_44px] gap-2 text-center">
                  {["Set", "Previous", "Kg", "Reps", "Done"].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {ex.sets.map((s, i) => {
                  const active = !s.completed && i === ex.sets.findIndex((x) => !x.completed);
                  return (
                    <div
                      key={s.id}
                      className={`grid grid-cols-[32px_1fr_72px_56px_44px] gap-2 items-center ${
                        !active && !s.completed ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        <span
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                            active || s.completed
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div className="text-center text-xs text-muted-foreground truncate">
                        {s.previous ?? "—"}
                      </div>
                      {active ? (
                        <Input
                          value={s.kg}
                          onChange={(e) => patchSet(ex.id, s.id, { kg: e.target.value })}
                          inputMode="decimal"
                          className="h-11 text-center px-1 font-[Manrope] font-semibold text-base rounded-lg bg-muted/50 border-2 border-primary"
                        />
                      ) : (
                        <div className="h-11 bg-muted/40 rounded-lg flex items-center justify-center font-[Manrope] font-semibold text-base text-muted-foreground">
                          {s.kg || "—"}
                        </div>
                      )}
                      {active ? (
                        <Input
                          value={s.reps}
                          onChange={(e) => patchSet(ex.id, s.id, { reps: e.target.value })}
                          inputMode="numeric"
                          className="h-11 text-center px-1 font-[Manrope] font-semibold text-base rounded-lg bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      ) : (
                        <div className="h-11 bg-muted/40 rounded-lg flex items-center justify-center font-[Manrope] font-semibold text-base text-muted-foreground">
                          {s.reps || "—"}
                        </div>
                      )}
                      <div className="flex justify-center">
                        <button
                          onClick={() => patchSet(ex.id, s.id, { completed: !s.completed })}
                          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                            s.completed
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
                          }`}
                          aria-label="Toggle complete"
                        >
                          {s.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {executionTip && (
            <div className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-5 border-l-[3px] border-l-primary">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Execution Tip
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{executionTip}</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-20" />
        </main>

        {/* Sticky Footer */}
        <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
          <button
            onClick={onFinish}
            className="w-full h-14 bg-primary text-primary-foreground font-[Manrope] font-bold text-base rounded-full shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Finish Superset
            <ChevronsRight className="w-5 h-5" />
          </button>
        </footer>
      </SheetContent>
    </Sheet>
  );
};

export default SupersetExecutionDrawer;
