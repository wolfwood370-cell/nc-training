import { ArrowLeft, TrendingUp, Dumbbell, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PlanUpdateSummaryProps {
  coachName?: string;
  trainingPhase?: string;
  trainingDescription?: string;
  protein?: number;
  fat?: number;
  carbs?: number;
  nutritionNote?: string;
  onBack?: () => void;
  onConfirm?: () => void;
}

export default function PlanUpdateSummary({
  coachName = "Coach Lumina",
  trainingPhase = "Phase 3: Hypertrophy Block",
  trainingDescription = "Volume has been increased. Focus on time under tension and controlled eccentrics.",
  protein = 160,
  fat = 55,
  carbs = 220,
  nutritionNote = "Calories increased by +200kcal to support the new hypertrophy block.",
  onBack,
  onConfirm,
}: PlanUpdateSummaryProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-primary">
            Plan Update
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-32 space-y-6">
        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-[Manrope] font-bold text-3xl text-foreground leading-tight max-w-xs">
            Your New Phase is Ready
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {coachName} has adjusted your protocols for the upcoming weeks.
          </p>
        </div>

        {/* Training Protocol */}
        <section className="bg-card rounded-2xl shadow-sm border-l-4 border-primary p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Dumbbell className="h-4.5 w-4.5 text-primary" />
            </div>
            <h3 className="font-[Manrope] font-bold text-lg text-foreground">
              Training Protocol
            </h3>
          </div>
          <p className="font-[Manrope] font-bold text-xl text-primary">
            {trainingPhase}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {trainingDescription}
          </p>
        </section>

        {/* Nutrition Targets */}
        <section className="bg-card rounded-2xl shadow-sm border-l-4 border-primary p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Utensils className="h-4.5 w-4.5 text-primary" />
            </div>
            <h3 className="font-[Manrope] font-bold text-lg text-foreground">
              Nutrition Targets
            </h3>
          </div>

          <div className="bg-muted/50 rounded-xl px-4 py-4 flex items-stretch justify-around">
            {[
              { label: "Pro", value: `${protein}g` },
              { label: "Fat", value: `${fat}g` },
              { label: "Carb", value: `${carbs}g` },
            ].map((macro, i) => (
              <div key={macro.label} className="flex items-stretch flex-1">
                {i > 0 && <div className="w-px bg-border mx-2" />}
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className="text-xs font-semibold text-muted-foreground mb-1">
                    {macro.label}
                  </span>
                  <span className="font-[Manrope] font-bold text-2xl text-foreground tabular-nums">
                    {macro.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed">
            {nutritionNote}
          </p>
        </section>
      </main>

      {/* Sticky CTA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4">
        <Button
          onClick={onConfirm}
          size="lg"
          className="w-full h-12 rounded-full font-[Manrope] font-semibold text-base"
        >
          Got it, let's go
        </Button>
      </footer>
    </div>
  );
}
