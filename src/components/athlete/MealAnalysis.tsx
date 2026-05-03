import { ArrowLeft, MoreVertical, CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DetectedItem {
  name: string;
}

export interface MealAnalysisProps {
  imageUrl: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  items?: DetectedItem[];
  verified?: boolean;
  onBack?: () => void;
  onMore?: () => void;
  onConfirm?: () => void;
  onEdit?: () => void;
}

const DEFAULT_ITEMS: DetectedItem[] = [
  { name: "Grilled Chicken Breast (200g)" },
  { name: "Mixed Greens Salad" },
  { name: "Olive Oil Dressing (1 tbsp)" },
];

export default function MealAnalysis({
  imageUrl,
  calories = 550,
  protein = 45,
  fat = 20,
  carbs = 40,
  items = DEFAULT_ITEMS,
  verified = true,
  onBack,
  onMore,
  onConfirm,
  onEdit,
}: MealAnalysisProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-foreground">
            Meal Analysis
          </h1>
          <button
            onClick={onMore}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-32 space-y-4">
        {/* Image with verified badge */}
        <div className="relative rounded-3xl overflow-hidden aspect-square bg-muted">
          <img
            src={imageUrl}
            alt="Analyzed meal"
            className="w-full h-full object-cover"
          />
          {verified && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-bold tracking-wider text-foreground">
                AI VERIFIED
              </span>
            </div>
          )}
        </div>

        {/* Nutrition card */}
        <section className="bg-card rounded-3xl p-6 shadow-sm">
          <h2 className="font-[Manrope] font-bold text-2xl text-foreground mb-5">
            Estimated Nutrition
          </h2>

          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-[Manrope] font-bold text-5xl text-foreground tabular-nums">
                {calories}
              </span>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>

            <div className="flex items-stretch gap-4">
              {[
                { label: "PRO", value: `${protein}g` },
                { label: "FAT", value: `${fat}g` },
                { label: "CARB", value: `${carbs}g` },
              ].map((macro, i) => (
                <div key={macro.label} className="flex items-stretch gap-4">
                  {i > 0 && <div className="w-px bg-border" />}
                  <div className="flex flex-col items-center justify-center min-w-[44px]">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
                      {macro.label}
                    </span>
                    <span className="font-[Manrope] font-bold text-xl text-foreground tabular-nums">
                      {macro.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground mb-3">
            DETECTED ITEMS
          </h3>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.name} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="text-sm text-foreground">{item.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Sticky actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4 space-y-2">
        <Button
          onClick={onConfirm}
          className="w-full h-12 rounded-full font-[Manrope] font-bold tracking-wider text-sm"
          size="lg"
        >
          <Check className="h-4 w-4 mr-2" />
          CONFIRM &amp; LOG MEAL
        </Button>
        <button
          onClick={onEdit}
          className="w-full text-center text-xs font-bold tracking-wider text-primary py-2 hover:opacity-80 transition-opacity"
        >
          EDIT INGREDIENTS OR AMOUNTS
        </button>
      </footer>
    </div>
  );
}
