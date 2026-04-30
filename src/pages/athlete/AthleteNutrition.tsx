/**
 * Athlete Nutrition — premium mobile-first dashboard.
 *
 * Surfaces the Metabolic Engine state to the athlete:
 *   • Apple-Fitness-style Macro Rings (today's progress vs target).
 *   • Metabolic Engine summary (baseTDEE + current macrocycle phase).
 *   • Today's Log placeholder (AI camera scanner ships next).
 */

import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MacroRings } from "@/components/nutrition/MacroRings";
import { useMetabolicStore } from "@/stores/useMetabolicStore";
import { Flame, Plus, Sparkles, Utensils } from "lucide-react";

const PHASE_META: Record<
  "cut" | "maintain" | "surplus",
  { label: string; tone: string; description: string }
> = {
  cut: {
    label: "Cut",
    tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    description: "Caloric deficit — preserve lean mass.",
  },
  maintain: {
    label: "Maintain",
    tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
    description: "Energy balance — recomposition focus.",
  },
  surplus: {
    label: "Surplus",
    tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    description: "Caloric surplus — anabolic phase.",
  },
};

export default function AthleteNutrition() {
  const baseTDEE = useMetabolicStore((s) => s.baseTDEE);
  const currentPhase = useMetabolicStore((s) => s.currentPhase);
  const todayMacros = useMetabolicStore((s) => s.todayMacros);
  const lastAdjustment = useMetabolicStore((s) => s.lastAdjustment);

  const phase = PHASE_META[currentPhase];

  // Intake will be wired to the food log once the AI camera scanner ships.
  const intake = { calories: 0, protein: 0, carbs: 0, fats: 0 };

  return (
    <AthleteLayout title="Nutrition">
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto w-full pb-32">
        {/* Macro Rings — hero */}
        <Card className="border-border/40 shadow-sm">
          <CardContent className="pt-6 pb-5">
            <MacroRings intake={intake} />
          </CardContent>
        </Card>

        {/* Metabolic Engine summary */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Metabolic Engine
              </CardTitle>
              <Badge variant="outline" className={phase.tone}>
                {phase.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
                <Flame className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Adaptive TDEE
                </p>
                <p className="text-2xl font-semibold tabular-nums leading-none">
                  {baseTDEE.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-muted-foreground">kcal/day</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {phase.description}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Protein</p>
                <p className="text-sm font-semibold tabular-nums">{todayMacros.protein}g</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Carbs</p>
                <p className="text-sm font-semibold tabular-nums">{todayMacros.carbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fats</p>
                <p className="text-sm font-semibold tabular-nums">{todayMacros.fats}g</p>
              </div>
            </div>

            {lastAdjustment?.applied && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Peri-workout adjustment active
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-snug">
                  {lastAdjustment.reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Log placeholder */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                Today's Log
              </CardTitle>
              <Button size="sm" variant="default" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Quick Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Utensils className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No meals logged yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Tap Quick Add to log your first meal of the day.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AthleteLayout>
  );
}
