/**
 * MacroRings — Apple Fitness-style concentric progress rings for daily macros.
 *
 * Outer → Inner: Calories, Protein, Carbs, Fats.
 * Targets are sourced from `useMetabolicStore.todayMacros`.
 * Current intake is supplied by the parent (will be wired to the food log
 * once the AI camera scanner ships).
 */

import { useEffect, useState } from "react";
import { useMetabolicStore } from "@/stores/useMetabolicStore";
import { cn } from "@/lib/utils";

interface MacroRingsProps {
  /** Current daily intake in absolute units. Defaults to zeros. */
  intake?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  className?: string;
}

interface RingDef {
  key: "calories" | "protein" | "carbs" | "fats";
  label: string;
  unit: string;
  radius: number;
  stroke: string;
  trackClass: string;
  fillClass: string;
}

// Outer to inner. Stroke kept generous for the premium "thick ring" look.
const RINGS: RingDef[] = [
  { key: "calories", label: "Cal",     unit: "kcal", radius: 88, stroke: "14", trackClass: "stroke-rose-500/15",    fillClass: "stroke-rose-500" },
  { key: "protein",  label: "Protein", unit: "g",    radius: 70, stroke: "12", trackClass: "stroke-violet-500/15",  fillClass: "stroke-violet-500" },
  { key: "carbs",    label: "Carbs",   unit: "g",    radius: 54, stroke: "12", trackClass: "stroke-amber-500/15",   fillClass: "stroke-amber-500" },
  { key: "fats",     label: "Fats",    unit: "g",    radius: 38, stroke: "12", trackClass: "stroke-emerald-500/15", fillClass: "stroke-emerald-500" },
];

const SVG_SIZE = 220;
const CENTER = SVG_SIZE / 2;

function clampPct(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}

export function MacroRings({ intake, className }: MacroRingsProps) {
  const todayMacros = useMetabolicStore((s) => s.todayMacros);
  const current = intake ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };

  // Animate the rings filling on mount.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(1));
    return () => cancelAnimationFrame(id);
  }, [current.calories, current.protein, current.carbs, current.fats, todayMacros]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="-rotate-90"
          aria-label="Daily macronutrient progress rings"
          role="img"
        >
          {RINGS.map((ring) => {
            const circumference = 2 * Math.PI * ring.radius;
            const target = todayMacros[ring.key];
            const value = current[ring.key];
            const pct = clampPct(value, target) * progress;
            const dashOffset = circumference * (1 - pct);
            return (
              <g key={ring.key}>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={ring.radius}
                  fill="none"
                  strokeWidth={ring.stroke}
                  className={ring.trackClass}
                  strokeLinecap="round"
                />
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={ring.radius}
                  fill="none"
                  strokeWidth={ring.stroke}
                  className={cn(ring.fillClass, "transition-[stroke-dashoffset] duration-1000 ease-out")}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {Math.round(current.calories)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {todayMacros.calories} kcal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {RINGS.slice(1).map((ring) => {
          const target = todayMacros[ring.key];
          const value = current[ring.key];
          return (
            <div key={ring.key} className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    ring.fillClass.replace("stroke-", "bg-"),
                  )}
                  aria-hidden
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {ring.label}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {Math.round(value)}
                <span className="text-muted-foreground font-normal">/{target}{ring.unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
