import { ArrowLeft, QrCode, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DailyMacroPlan {
  dayLabel: string; // L, M, M, G, V, S, D
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  isToday?: boolean;
  isHigh?: boolean; // refeed/high day visual emphasis
}

interface NutritionStrategyOverviewProps {
  programName?: string;
  programRange?: string;
  days: DailyMacroPlan[];
  goalTitle: string;
  goalStartLabel: string;
  targetWeightKg: number;
  weeklyRateKg: number;
  weeklyRatePct: number;
  onBack?: () => void;
  onScan?: () => void;
  onNewProgram?: () => void;
  onEdit?: () => void;
}

export function NutritionStrategyOverview({
  programName = "Programma Coached",
  programRange = "—",
  days,
  goalTitle,
  goalStartLabel,
  targetWeightKg,
  weeklyRateKg,
  weeklyRatePct,
  onBack,
  onScan,
  onNewProgram,
  onEdit,
}: NutritionStrategyOverviewProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onBack} className="text-primary" aria-label="Indietro">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-base font-semibold text-primary">
            Nutrition Strategy
          </h1>
          <button onClick={onScan} className="text-primary" aria-label="Scan QR">
            <QrCode className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5 pb-24">
        {/* Program Card */}
        <section className="bg-background rounded-3xl border p-5 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{programName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{programRange}</p>
          </div>

          {/* Macro grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 relative">
                {d.isToday && (
                  <div className="absolute -top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                )}
                <div
                  className={cn(
                    "w-full rounded-2xl px-1 py-2 text-center text-[10px] font-semibold tabular-nums",
                    d.isHigh
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/15 text-foreground"
                  )}
                >
                  {d.calories}
                </div>
                <MacroPill value={`${d.proteinG} P`} highlight={d.isHigh} />
                <MacroPill value={`${d.fatG} F`} highlight={d.isHigh} />
                <MacroPill value={`${d.carbsG} C`} highlight={d.isHigh} />
                <span
                  className={cn(
                    "text-xs font-semibold mt-1",
                    d.isToday ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {d.dayLabel}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="ghost"
              onClick={onNewProgram}
              className="text-primary font-semibold gap-2 px-2"
            >
              <Plus className="h-4 w-4" />
              Nuovo Programma
            </Button>
            <Button
              variant="ghost"
              onClick={onEdit}
              className="font-semibold gap-2 px-2"
            >
              <Pencil className="h-4 w-4" />
              Modifica
            </Button>
          </div>
        </section>

        {/* Goal Card */}
        <section className="bg-background rounded-3xl border p-5 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{goalTitle}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Iniziato il {goalStartLabel}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <Stat
              label="Target"
              value={targetWeightKg.toFixed(1)}
              unit="kg"
            />
            <Stat
              label="Rateo/Sett"
              value={`${weeklyRateKg > 0 ? "+" : ""}${weeklyRateKg.toFixed(2)}`}
              unit="kg"
            />
            <Stat
              label="Rateo %"
              value={`${weeklyRatePct > 0 ? "+" : ""}${weeklyRatePct.toFixed(1)}`}
              unit="%"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function MacroPill({ value, highlight }: { value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-lg px-1 py-1 text-center text-[9px] font-semibold tabular-nums",
        highlight ? "bg-primary/30 text-primary-foreground" : "bg-primary/10 text-foreground/80"
      )}
    >
      {value}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground font-medium">{unit}</span>
      </div>
    </div>
  );
}
