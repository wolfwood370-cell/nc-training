import { useState, useEffect, useCallback } from "react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Plus,
  Zap,
  Copy,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Flame,
  Target,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Dumbbell,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdaptiveTDEE,
  GoalType,
  StallDetection,
  GoalCompliance,
  CoachingAction,
} from "@/hooks/useAdaptiveTDEE";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { toast } from "sonner";
import { FoodDatabase } from "@/components/nutrition/FoodDatabase";
import { CalorieBankCard } from "@/components/nutrition/CalorieBankCard";
import { SmartCopyDrawer } from "@/components/nutrition/SmartCopyDrawer";
import { FoodCameraScanner } from "@/components/athlete/nutrition/FoodCameraScanner";
import {
  Line,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
} from "recharts";

// Macro Ring Component with center text and soft alert for excess
function MacroRing({
  label,
  consumed,
  target,
  color,
  bgColor,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
  bgColor: string;
}) {
  const percentage = Math.min((consumed / target) * 100, 100);
  const delta = target - consumed;
  const isOver = delta < 0;
  const radius = 36;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Amber color for excess
  const amberColor = "hsl(38 92% 50%)";
  const amberBgColor = "hsl(38 92% 50% / 0.2)";

  const activeColor = isOver ? amberColor : color;
  const activeBgColor = isOver ? amberBgColor : bgColor;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            stroke={activeBgColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress ring */}
          <circle
            stroke={activeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset: isOver ? 0 : strokeDashoffset,
              transition: "stroke-dashoffset 0.5s ease-out",
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              isOver ? "text-amber-600 dark:text-amber-400" : "text-foreground",
            )}
          >
            {Math.abs(delta)}g
          </span>
          <span
            className={cn(
              "text-[9px]",
              isOver
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground/60",
            )}
          >
            {isOver ? "in eccesso" : "rimasti"}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium mt-2 text-foreground/80">{label}</p>
    </div>
  );
}

// Quick Add Form state interface
interface QuickAddFormState {
  name: string;
  protein: string;
  fat: string;
  carbs: string;
  fiber: string;
  salt: string;
  water: string;
  caloriesOverride: string;
}

// Metabolic Status Card Component - Enhanced "Coaching Card"
function MetabolicStatusCard({
  tdee,
  confidence,
  weightChange,
  averageIntake,
  recommendation,
  stallDetection,
  goalCompliance,
  coachingAction,
  trendDirection,
  isLoading,
  daysWithData,
  totalDays,
  onAdjustmentClick,
}: {
  tdee: number | null;
  confidence: "high" | "medium" | "low" | "insufficient";
  weightChange: number | null;
  averageIntake: number | null;
  recommendation: {
    goal: GoalType;
    targetCalories: number | null;
    weeklyChange: number;
    message: string;
  } | null;
  stallDetection: StallDetection;
  goalCompliance: GoalCompliance | null;
  coachingAction: CoachingAction | null;
  trendDirection: "up" | "down" | "stable";
  isLoading: boolean;
  daysWithData: number;
  totalDays: number;
  onAdjustmentClick?: (adjustment: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const confidenceConfig = {
    high: { label: "Alta", color: "bg-success/10 text-success", icon: "" },
    medium: { label: "Media", color: "bg-warning/10 text-warning", icon: "" },
    low: { label: "Bassa", color: "bg-muted text-muted-foreground", icon: "" },
    insufficient: {
      label: "Dati insufficienti",
      color: "bg-muted text-muted-foreground",
      icon: "",
    },
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/8 to-primary/5 overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                AI Nutrition Coach
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    confidenceConfig[confidence].color,
                  )}
                >
                  {confidenceConfig[confidence].icon}{" "}
                  {confidenceConfig[confidence].label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {daysWithData}/{totalDays} giorni
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main TDEE Display with Trend Arrow */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Live TDEE
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {tdee !== null ? tdee.toLocaleString() : "—"}
              </span>
              {trendDirection !== "stable" &&
                (trendDirection === "down" ? (
                  <TrendingDown className="h-5 w-5 text-success" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-warning" />
                ))}
            </div>
            <span className="text-xs text-muted-foreground">kcal/giorno</span>
          </div>

          <div className="text-center p-3 rounded-lg bg-background/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Media Intake
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {averageIntake !== null ? averageIntake.toLocaleString() : "—"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">kcal/giorno</span>
          </div>
        </div>

        {/* Coaching Action Card (new - shows contextual advice) */}
        {coachingAction && (
          <div
            className={cn(
              "p-3 rounded-lg mb-4 border",
              coachingAction.type === "warning" &&
                "bg-amber-500/10 border-amber-500/20",
              coachingAction.type === "suggestion" &&
                "bg-primary/10 border-primary/20",
              coachingAction.type === "info" && "bg-muted border-muted",
            )}
          >
            <div className="flex items-start gap-2 mb-2">
              {coachingAction.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : coachingAction.type === "suggestion" ? (
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    coachingAction.type === "warning" &&
                      "text-amber-700 dark:text-amber-400",
                    coachingAction.type === "suggestion" && "text-primary",
                    coachingAction.type === "info" && "text-foreground",
                  )}
                >
                  {coachingAction.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {coachingAction.message}
                </p>
              </div>
            </div>
            {coachingAction.actionLabel &&
              coachingAction.actionValue !== undefined && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full",
                    coachingAction.type === "warning" &&
                      "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
                    coachingAction.type === "suggestion" &&
                      "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20",
                  )}
                  onClick={() =>
                    onAdjustmentClick?.(coachingAction.actionValue!)
                  }
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {coachingAction.actionLabel}
                </Button>
              )}
          </div>
        )}

        {/* Goal Compliance Badge */}
        {goalCompliance && (
          <div
            className={cn(
              "flex items-center justify-center gap-2 p-2 rounded-lg mb-4",
              goalCompliance.isCompliant
                ? "bg-success/10 border border-success/20"
                : "bg-warning/10 border border-warning/20",
            )}
          >
            {goalCompliance.isCompliant ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                goalCompliance.isCompliant ? "text-success" : "text-warning",
              )}
            >
              {goalCompliance.message}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px]",
                goalCompliance.isCompliant
                  ? "bg-success/20 text-success"
                  : "bg-warning/20 text-warning",
              )}
            >
              {goalCompliance.variance > 0 ? "+" : ""}
              {goalCompliance.variance}%
            </Badge>
          </div>
        )}

        {/* Weight Change Indicator */}
        {weightChange !== null && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {weightChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-success" />
            ) : weightChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-warning" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-sm font-medium tabular-nums",
                weightChange < 0
                  ? "text-success"
                  : weightChange > 0
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            >
              {weightChange > 0 ? "+" : ""}
              {weightChange.toFixed(2)} kg in {totalDays} giorni
            </span>
          </div>
        )}

        {/* Stall Warning with Adjustment Button */}
        {stallDetection.isStalling && stallDetection.suggestedAdjustment && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Plateau rilevato
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                  {stallDetection.adjustmentMessage}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              onClick={() =>
                onAdjustmentClick?.(stallDetection.suggestedAdjustment!)
              }
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Applica aggiustamento (
              {stallDetection.suggestedAdjustment > 0 ? "+" : ""}
              {stallDetection.suggestedAdjustment} kcal)
            </Button>
          </div>
        )}

        {/* Recommendation */}
        {recommendation &&
          recommendation.targetCalories &&
          !stallDetection.isStalling && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Obiettivo Settimanale
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {recommendation.message}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Il TDEE è calcolato usando il trend del peso (EMA α=0.1) e
                l'intake calorico degli ultimi {totalDays} giorni. Formula: TDEE
                = Media Intake + ((Trend Iniziale − Trend Finale) × 7700 ÷
                Giorni)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted/50">
                <p className="text-lg font-bold tabular-nums">
                  {tdee && averageIntake
                    ? (tdee - averageIntake > 0 ? "+" : "") +
                      (tdee - averageIntake)
                    : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  Δ Giornaliero
                </p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-lg font-bold tabular-nums">
                  {weightChange !== null
                    ? ((weightChange * 7) / 14).toFixed(2)
                    : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">kg/settimana</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="text-lg font-bold tabular-nums">{daysWithData}</p>
                <p className="text-[9px] text-muted-foreground">Dati</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Weight Trend Chart with recharts - Enhanced version
function WeightTrendChart({
  data,
}: {
  data: {
    dayIndex: number;
    date: string;
    rawWeight: number | null;
    trendWeight: number;
  }[];
}) {
  const validData = data.filter(
    (d) => d.rawWeight !== null || d.trendWeight > 0,
  );

  if (data.length === 0 || validData.length === 0) {
    return (
      <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-dashed border-border">
        <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Scale className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Dati insufficienti
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Registra peso e calorie per 3+ giorni per sbloccare le AI Analytics
        </p>
      </div>
    );
  }

  const allWeights = validData
    .flatMap((d) => [d.rawWeight, d.trendWeight])
    .filter((w): w is number => w !== null && w > 0);
  const minWeight = Math.min(...allWeights) - 0.5;
  const maxWeight = Math.max(...allWeights) + 0.5;

  // Format chart data
  const chartData = validData.map((d) => ({
    day: d.dayIndex,
    date: d.date,
    scale: d.rawWeight,
    trend: d.trendWeight,
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.4)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minWeight, maxWeight]}
          tick={{ fontSize: 10, fill: "hsl(var(--foreground) / 0.4)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          formatter={(value: number | null, name: string) => {
            if (value === null) return ["-", name];
            return [
              `${value.toFixed(1)} kg`,
              name === "scale" ? "Scale" : "Trend (EMA)",
            ];
          }}
        />
        {/* Scale weight as scattered dots (noise) */}
        <Scatter
          dataKey="scale"
          fill="hsl(var(--foreground) / 0.25)"
          shape="circle"
        />
        {/* Trend line (signal) */}
        <Line
          type="monotone"
          dataKey="trend"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default function AthleteNutrition() {
  const { user } = useAuth();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [foodDbOpen, setFoodDbOpen] = useState(false);
  const [showSecondFab, setShowSecondFab] = useState(false);
  const [smartCopyOpen, setSmartCopyOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const haptic = useHapticFeedback();

  // Dynamic nutrition targets from coach strategy
  const {
    targets: nutritionTargets,
    isTrainingDay,
    hasPlan,
    isLoading: targetsLoading,
  } = useNutritionTargets();

  // Adaptive TDEE hook
  const tdeeData = useAdaptiveTDEE(undefined, "cut");

  // Quick Add form state
  const [formData, setFormData] = useState<QuickAddFormState>({
    name: "",
    protein: "",
    fat: "",
    carbs: "",
    fiber: "",
    salt: "",
    water: "",
    caloriesOverride: "",
  });

  // Nutrition state
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0,
  });

  // Calculate calories from macros
  const calculatedKcal = Math.round(
    (parseFloat(formData.protein) || 0) * 4 +
      (parseFloat(formData.carbs) || 0) * 4 +
      (parseFloat(formData.fat) || 0) * 9,
  );

  // Use override if provided, otherwise use calculated
  const displayKcal = formData.caloriesOverride
    ? parseInt(formData.caloriesOverride) || 0
    : calculatedKcal;

  // Fetch today's nutrition logs
  const fetchTodayNutrition = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("calories, protein, carbs, fats, water")
      .eq("athlete_id", user.id)
      .eq("date", today);

    if (error) {
      console.error("Error fetching nutrition:", error);
      return;
    }

    if (data && data.length > 0) {
      const totals = data.reduce<{
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        water: number;
      }>(
        (acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein: acc.protein + (Number(log.protein) || 0),
          carbs: acc.carbs + (Number(log.carbs) || 0),
          fats: acc.fats + (Number(log.fats) || 0),
          water: acc.water + (Number(log.water) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },
      );

      setConsumed(totals);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTodayNutrition();
  }, [fetchTodayNutrition]);

  // Handle form field change
  const handleFieldChange = (field: keyof QuickAddFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      protein: "",
      fat: "",
      carbs: "",
      fiber: "",
      salt: "",
      water: "",
      caloriesOverride: "",
    });
  };

  // Submit nutrition log
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Devi essere loggato");
      return;
    }

    const finalCalories = displayKcal;
    const p = parseFloat(formData.protein) || 0;
    const c = parseFloat(formData.carbs) || 0;
    const f = parseFloat(formData.fat) || 0;
    const fib = parseFloat(formData.fiber) || 0;
    const salt = parseFloat(formData.salt) || 0;
    const water = parseFloat(formData.water) || 0;

    // At least one value must be filled
    if (
      finalCalories === 0 &&
      p === 0 &&
      c === 0 &&
      f === 0 &&
      fib === 0 &&
      salt === 0 &&
      water === 0
    ) {
      toast.error("Inserisci almeno un valore");
      return;
    }

    setIsSubmitting(true);

    const logData = {
      athlete_id: user.id,
      calories: finalCalories,
      protein: p || null,
      carbs: c || null,
      fats: f || null,
      water: water || null,
      meal_name: null,
    };

    const { error } = await supabase.from("nutrition_logs").insert(logData);

    if (error) {
      console.error("Error inserting log:", error);
      toast.error("Errore nel salvataggio");
      haptic.error();
    } else {
      toast.success("Aggiunto!");
      haptic.success();
      setQuickAddOpen(false);
      resetForm();
      fetchTodayNutrition();
      tdeeData.refetch();
    }

    setIsSubmitting(false);
  };

  // Calculated values
  const remaining = nutritionTargets.calories - consumed.calories;
  const consumedPercent = (consumed.calories / nutritionTargets.calories) * 100;
  const isOver = remaining < 0;

  return (
    <AthleteLayout title="Nutrition">
      <div className="space-y-4 p-4 pb-24 animate-fade-in">
        {/* ===== TRAINING DAY INDICATOR ===== */}
        {hasPlan && nutritionTargets.strategyMode === "cycling_on_off" && (
          <div
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-4 rounded-lg",
              isTrainingDay
                ? "bg-primary/10 border border-primary/20"
                : "bg-secondary border border-border",
            )}
          >
            <Dumbbell
              className={cn(
                "h-4 w-4",
                isTrainingDay ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                isTrainingDay ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isTrainingDay ? "Giorno di Allenamento" : "Giorno di Riposo"} •
              Macro {isTrainingDay ? "ON" : "OFF"}
            </span>
          </div>
        )}

        {/* ===== WEEKLY CALORIE BANK ===== */}
        <CalorieBankCard />

        {/* ===== METABOLIC STATUS (New AI Coach Card) ===== */}
        <MetabolicStatusCard
          tdee={tdeeData.estimatedTDEE}
          confidence={tdeeData.confidence}
          weightChange={tdeeData.weightChange}
          averageIntake={tdeeData.averageIntake}
          recommendation={tdeeData.recommendation}
          stallDetection={tdeeData.stallDetection}
          goalCompliance={tdeeData.goalCompliance}
          coachingAction={tdeeData.coachingAction}
          trendDirection={tdeeData.trendDirection}
          isLoading={tdeeData.isLoading}
          daysWithData={Math.max(
            tdeeData.daysWithCalories,
            tdeeData.daysWithWeight,
          )}
          totalDays={tdeeData.totalDays}
          onAdjustmentClick={(adjustment) => {
            toast.success(
              `Suggerimento: ${adjustment > 0 ? "+" : ""}${adjustment} kcal/giorno applicato!`,
            );
          }}
        />

        {/* ===== ENERGY BALANCE (Hero Widget) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-5">
            {/* Main number */}
            <div className="text-center mb-5">
              <p
                className={cn(
                  "text-5xl font-bold tabular-nums tracking-tight",
                  isOver
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {Math.abs(remaining).toLocaleString()}
              </p>
              <p
                className={cn(
                  "text-sm font-medium mt-1",
                  isOver
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-primary",
                )}
              >
                kcal {isOver ? "in eccesso" : "rimanenti"}
              </p>
            </div>

            {/* Progress Bar - Soft Alert with Amber for excess */}
            <div className="space-y-2">
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    isOver
                      ? "bg-gradient-to-r from-amber-500 to-amber-400"
                      : "bg-gradient-to-r from-primary to-primary/70",
                  )}
                  style={{ width: `${Math.min(consumedPercent, 100)}%` }}
                />
                {/* Overflow indicator - amber for excess */}
                {consumedPercent > 100 && (
                  <div
                    className="absolute inset-y-0 right-0 bg-amber-400/50 rounded-r-full"
                    style={{
                      width: `${Math.min(consumedPercent - 100, 100)}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {consumed.calories.toLocaleString()} consumed
                </span>
                <span className="tabular-nums">
                  {nutritionTargets.calories.toLocaleString()} target
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== MACRO TARGETS (The Rings) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-5">
            <div className="flex justify-around items-center">
              <MacroRing
                label="Protein"
                consumed={consumed.protein}
                target={nutritionTargets.protein}
                color="hsl(0 84% 60%)"
                bgColor="hsl(0 84% 60% / 0.2)"
              />
              <MacroRing
                label="Carbs"
                consumed={consumed.carbs}
                target={nutritionTargets.carbs}
                color="hsl(142 71% 45%)"
                bgColor="hsl(142 71% 45% / 0.2)"
              />
              <MacroRing
                label="Fats"
                consumed={consumed.fats}
                target={nutritionTargets.fats}
                color="hsl(45 93% 47%)"
                bgColor="hsl(45 93% 47% / 0.2)"
              />
            </div>

            {/* Water Progress Bar */}
            <div className="mt-5 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground/70">
                  Water
                </span>
                <span
                  className={cn(
                    "text-xs",
                    (consumed.water || 0) >= nutritionTargets.water
                      ? "text-cyan-600 dark:text-cyan-400 font-medium"
                      : "text-foreground/50",
                  )}
                >
                  {(consumed.water || 0) >= nutritionTargets.water
                    ? "Goal reached!"
                    : `${consumed.water || 0} / ${nutritionTargets.water} ml`}
                </span>
              </div>
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 bg-gradient-to-r from-sky-500 to-cyan-400"
                  style={{
                    width: `${Math.min(((consumed.water || 0) / nutritionTargets.water) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== WEIGHT TREND (Intelligence) ===== */}
        <Card className="border-0 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Weight Trend
                </span>
              </div>
              {tdeeData.endTrend && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {tdeeData.endTrend.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">kg</span>
                  {tdeeData.weightChange !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-0.5 text-xs font-medium ml-1",
                        tdeeData.weightChange < 0
                          ? "text-success"
                          : tdeeData.weightChange > 0
                            ? "text-warning"
                            : "text-muted-foreground",
                      )}
                    >
                      {tdeeData.weightChange < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : tdeeData.weightChange > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      <span className="tabular-nums">
                        {Math.abs(tdeeData.weightChange).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <WeightTrendChart data={tdeeData.weightData} />

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-primary" />
                <span className="text-[10px] text-muted-foreground">
                  Trend (EMA)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-foreground/25" />
                <span className="text-[10px] text-muted-foreground">Scale</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== FLOATING ACTION BUTTONS ===== */}
      {/* Secondary FAB - Food Database */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 transition-all duration-300 ease-out",
          showSecondFab
            ? "translate-y-[-72px] opacity-100"
            : "translate-y-0 opacity-0 pointer-events-none",
        )}
      >
        <Button
          onClick={() => {
            setFoodDbOpen(true);
            setShowSecondFab(false);
          }}
          className="h-14 w-14 rounded-full shadow-xl bg-emerald-600 hover:bg-emerald-700"
          size="icon"
        >
          <Search className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Quaternary FAB - AI Camera Scanner */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 transition-all duration-300 ease-out",
          showSecondFab
            ? "translate-y-[-144px] opacity-100"
            : "translate-y-0 opacity-0 pointer-events-none",
        )}
      >
        <Button
          onClick={() => {
            setScannerOpen(true);
            setShowSecondFab(false);
          }}
          className="h-14 w-14 rounded-full shadow-xl bg-rose-600 hover:bg-rose-700"
          size="icon"
        >
          <Camera className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Tertiary FAB - Smart Copy */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 transition-all duration-300 ease-out",
          showSecondFab
            ? "translate-x-[-72px] opacity-100"
            : "translate-x-0 opacity-0 pointer-events-none",
        )}
      >
        <Button
          onClick={() => {
            setSmartCopyOpen(true);
            setShowSecondFab(false);
          }}
          className="h-14 w-14 rounded-full shadow-xl bg-violet-600 hover:bg-violet-700"
          size="icon"
        >
          <Copy className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Primary FAB */}
      <Button
        onClick={() => {
          if (showSecondFab) {
            setQuickAddOpen(true);
            setShowSecondFab(false);
          } else {
            setShowSecondFab(true);
          }
        }}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl z-40 transition-all duration-200 bg-primary hover:bg-primary/90"
        size="icon"
      >
        {showSecondFab ? (
          <Zap className="h-6 w-6 text-primary-foreground transition-transform duration-200" />
        ) : (
          <Plus className="h-6 w-6 text-primary-foreground transition-transform duration-200" />
        )}
      </Button>

      {/* Backdrop when FAB menu is open */}
      {showSecondFab && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowSecondFab(false)}
        />
      )}

      {/* ===== FOOD DATABASE DRAWER ===== */}
      <FoodDatabase
        open={foodDbOpen}
        onOpenChange={setFoodDbOpen}
        onFoodLogged={fetchTodayNutrition}
      />

      {/* ===== SMART COPY DRAWER ===== */}
      <SmartCopyDrawer
        open={smartCopyOpen}
        onOpenChange={setSmartCopyOpen}
        onLogged={fetchTodayNutrition}
      />

      {/* ===== AI FOOD CAMERA SCANNER ===== */}
      <FoodCameraScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onMealLogged={fetchTodayNutrition}
      />

      <Drawer open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-md flex flex-col overflow-hidden">
            <DrawerHeader className="text-center pb-2 shrink-0">
              <DrawerTitle className="text-lg">Quick Add</DrawerTitle>
            </DrawerHeader>

            <div className="flex-1 px-4 overflow-y-auto space-y-4 pb-4">
              {/* Energy Field with Unit Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Energy</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={
                      calculatedKcal > 0 ? `${calculatedKcal} (auto)` : "0"
                    }
                    value={formData.caloriesOverride}
                    onChange={(e) =>
                      handleFieldChange("caloriesOverride", e.target.value)
                    }
                    className="flex-1 bg-secondary/60 border-border h-12 text-base"
                  />
                  <div className="flex items-center justify-center px-4 bg-secondary/60 border border-border rounded-md text-sm text-muted-foreground">
                    kcal
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Macro sum: {calculatedKcal} kcal
                </p>
              </div>

              {/* Macro Row: Protein, Fat, Carbs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Protein
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.protein}
                      onChange={(e) =>
                        handleFieldChange("protein", e.target.value)
                      }
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fats</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.fat}
                      onChange={(e) => handleFieldChange("fat", e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Carbs</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.carbs}
                      onChange={(e) =>
                        handleFieldChange("carbs", e.target.value)
                      }
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      g
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional fields row: Fiber, Salt, Water */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fiber</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.fiber}
                      onChange={(e) =>
                        handleFieldChange("fiber", e.target.value)
                      }
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Salt</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.salt}
                      onChange={(e) =>
                        handleFieldChange("salt", e.target.value)
                      }
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      g
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Water</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={formData.water}
                      onChange={(e) =>
                        handleFieldChange("water", e.target.value)
                      }
                      className="bg-secondary/60 border-border h-11 text-base pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                      ml
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DrawerFooter className="pt-2 shrink-0 border-t border-border/50">
              <Button
                onClick={handleSubmit}
                className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                Add
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/80 hover:bg-primary/10 text-sm"
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </AthleteLayout>
  );
}
