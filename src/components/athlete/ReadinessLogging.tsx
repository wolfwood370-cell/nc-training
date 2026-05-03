import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const METRICS = ["Sleep", "Energy", "Stress", "Mood", "Digestion"] as const;
const SORENESS_AREAS = [
  "Chest", "Triceps", "Lats", "Quads", "Hamstrings",
  "Glutes", "Calves", "Lower Back", "Shoulders",
] as const;

type Metric = (typeof METRICS)[number];

export interface ReadinessLoggingProps {
  initialMetrics?: Partial<Record<Metric, number>>;
  initialSoreness?: string[];
  onClose?: () => void;
  onSave?: (data: { metrics: Record<Metric, number>; soreness: string[] }) => void;
}

export default function ReadinessLogging({
  initialMetrics = { Energy: 3 },
  initialSoreness = [],
  onClose,
  onSave,
}: ReadinessLoggingProps) {
  const [metrics, setMetrics] = useState<Record<Metric, number>>(() => {
    const base = {} as Record<Metric, number>;
    METRICS.forEach((m) => (base[m] = initialMetrics[m] ?? 0));
    return base;
  });
  const [soreness, setSoreness] = useState<string[]>(initialSoreness);

  const toggleSoreness = (area: string) =>
    setSoreness((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );

  const setMetric = (metric: Metric, value: number) =>
    setMetrics((prev) => ({ ...prev, [metric]: value }));

  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-primary">
            Good Morning
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-32 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h2 className="font-[Manrope] font-bold text-4xl text-foreground leading-tight">
            Good Morning.
          </h2>
          <p className="text-sm text-primary/80 leading-relaxed">
            Log your biofeedback to unlock today's optimal training focus.
          </p>
        </div>

        {/* Daily Metrics card */}
        <section className="bg-card/60 border border-border/60 rounded-3xl p-5">
          <h3 className="font-[Manrope] font-bold text-2xl text-foreground mb-5">
            Daily Metrics
          </h3>
          <div className="space-y-4">
            {METRICS.map((metric) => (
              <div key={metric} className="grid grid-cols-[88px_1fr] items-center gap-3">
                <span className="text-sm text-foreground/80">{metric}</span>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = metrics[metric] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMetric(metric, value)}
                        aria-label={`${metric} ${value} of 5`}
                        className={cn(
                          "h-9 w-9 rounded-full transition-all",
                          selected
                            ? "bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                            : "bg-primary/15 hover:bg-primary/25"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Muscle Soreness */}
        <section className="space-y-4">
          <h3 className="font-[Manrope] font-bold text-2xl text-foreground">
            Muscle Soreness
          </h3>
          <div className="flex flex-wrap gap-2">
            {SORENESS_AREAS.map((area) => {
              const selected = soreness.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleSoreness(area)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-colors border",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-primary/10 text-primary border-transparent hover:bg-primary/20"
                  )}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4">
        <Button
          onClick={() => onSave?.({ metrics, soreness })}
          size="lg"
          className="w-full h-12 rounded-full font-[Manrope] font-semibold text-base"
        >
          Save &amp; Unlock Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </footer>
    </div>
  );
}
