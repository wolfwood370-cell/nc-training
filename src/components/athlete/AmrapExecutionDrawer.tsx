import { useEffect, useRef, useState } from "react";
import { X, MoreVertical, Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export interface AmrapExecutionDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  durationSec: number; // total
  movements: string[];
  onClose?: () => void;
  onMore?: () => void;
  onFinish: (score: { rounds: number; extraReps: number; remainingSec: number }) => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export const AmrapExecutionDrawer = ({
  open,
  onOpenChange,
  title = "AMRAP",
  subtitle = "Metcon",
  durationSec,
  movements,
  onClose,
  onMore,
  onFinish,
}: AmrapExecutionDrawerProps) => {
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(true);
  const [rounds, setRounds] = useState(0);
  const [extraReps, setExtraReps] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) setRemaining(durationSec);
  }, [open, durationSec]);

  useEffect(() => {
    if (!open || !running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open, running]);

  const reset = () => {
    setRemaining(durationSec);
    setRounds(0);
    setExtraReps(0);
    setRunning(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] rounded-t-3xl p-0 font-[Inter] bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-muted/30 rounded-t-3xl">
          <button onClick={onClose ?? (() => onOpenChange?.(false))} className="p-2 -ml-2 text-foreground" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <h2 className="font-[Manrope] font-bold text-primary uppercase tracking-wider">
            {title} Session
          </h2>
          <button onClick={onMore} className="p-2 -mr-2 text-foreground" aria-label="More">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-32">
          {/* Drag handle */}
          <div className="flex justify-center -mt-2">
            <div className="w-10 h-1.5 rounded-full bg-muted" />
          </div>

          {/* Title */}
          <div className="text-center">
            <p className="font-[Manrope] font-bold text-2xl text-foreground">
              {title} • {subtitle}
            </p>
          </div>

          {/* Timer */}
          <div className="text-center space-y-2">
            <p className="font-[Manrope] font-black text-7xl text-primary tabular-nums tracking-tight">
              {fmt(remaining)}
            </p>
            <p className="font-[Manrope] font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Time Remaining
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={reset}
              className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              aria-label={running ? "Pause" : "Play"}
            >
              {running ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button
              onClick={() => setRounds((r) => r + 1)}
              className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-[Manrope] font-bold text-lg hover:bg-primary/20 transition-colors"
              aria-label="Add round"
            >
              +1
            </button>
          </div>

          {/* Movements */}
          <section className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-primary pb-2 border-b border-border">
              Movements
            </h3>
            <ul className="space-y-3 pt-1">
              {movements.map((m, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{m}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Score */}
          <section className="space-y-3">
            <h3 className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Log Your Score
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Stepper label="Rounds" value={rounds} onChange={setRounds} />
              <Stepper label="Extra Reps" value={extraReps} onChange={setExtraReps} />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
          <Button
            onClick={() => onFinish({ rounds, extraReps, remainingSec: remaining })}
            className="w-full h-12 rounded-full font-[Manrope] font-bold"
            size="lg"
          >
            Finish &amp; Save Score
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Stepper = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
    <p className="text-xs font-[Manrope] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
    <div className="flex items-center justify-between">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
        aria-label={`decrease ${label}`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-[Manrope] font-bold text-2xl tabular-nums text-foreground">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
        aria-label={`increase ${label}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default AmrapExecutionDrawer;
