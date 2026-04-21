import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { triggerConfetti } from "@/utils/ux";
import { toast } from "sonner";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useCyclePhasing } from "@/hooks/useCyclePhasing";
import {
  CyclePhaseCard,
  CycleSetupCTA,
} from "@/components/athlete/cycle/CyclePhaseCard";
import { CycleConfigDialog } from "@/components/athlete/cycle/CycleConfigDialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Moon,
  Play,
  Scale,
  Smile,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useReadiness,
  initialReadiness,
  ReadinessResult,
} from "@/hooks/useReadiness";
import {
  calculateReadinessScore,
  generateReadinessInsight,
} from "@/lib/math/readinessMath";
import { AcwrCard } from "@/components/athlete/AcwrCard";
import { Badge } from "@/components/ui/badge";
import { useGamification } from "@/hooks/useGamification";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { useAthleteHabits } from "@/hooks/useAthleteHabits";
import { DailyRings } from "@/components/athlete/DailyRings";
import { supabase } from "@/integrations/supabase/client";

// Body parts for DOMS map
const bodyParts = [
  "Petto",
  "Tricipiti",
  "Bicipiti",
  "Spalle",
  "Trapezi",
  "Dorsali",
  "Bassa Schiena",
  "Glutei",
  "Femorali",
  "Quadricipiti",
  "Polpacci",
] as const;

type BodyPart = (typeof bodyParts)[number];
type SorenessLevel = 0 | 1 | 2 | 3;

interface SorenessMap {
  [key: string]: SorenessLevel;
}

// Soreness level colors and labels
const sorenessConfig: Record<
  SorenessLevel,
  { bg: string; text: string; label: string }
> = {
  0: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Nessuno",
  },
  1: {
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "Leggero",
  },
  2: {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
    label: "Moderato",
  },
  3: {
    bg: "bg-rose-100 dark:bg-rose-900/40",
    text: "text-rose-700 dark:text-rose-300",
    label: "Acuto",
  },
};

// Original small ring for drawer preview
const ReadinessRing = ({ score }: { score: number }) => {
  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 75) return "hsl(160 84% 39%)";
    if (score >= 50) return "hsl(38 92% 50%)";
    return "hsl(0 84% 60%)";
  };

  return (
    <div className="relative h-20 w-20">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="hsl(var(--secondary))"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getScoreColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-out",
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap
          className={cn(
            "h-6 w-6",
            score >= 75
              ? "text-success"
              : score >= 50
                ? "text-warning"
                : "text-destructive",
          )}
        />
      </div>
    </div>
  );
};

// Psychophysical Slider Card
const ParamSliderCard = ({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  inverted = false,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  inverted?: boolean;
  icon: React.ElementType;
}) => {
  const getSliderColor = () => {
    if (inverted) {
      if (value <= 3) return "bg-success";
      if (value <= 6) return "bg-warning";
      return "bg-destructive";
    }
    if (value >= 7) return "bg-success";
    if (value >= 4) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="p-3 rounded-xl bg-secondary/50 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </Label>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md",
            getSliderColor(),
            "text-white",
          )}
        >
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-foreground/60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

// Body Part Chip Component
const BodyPartChip = ({
  part,
  level,
  onClick,
}: {
  part: BodyPart;
  level: SorenessLevel;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        "active:scale-95",
        sorenessConfig[level].bg,
        sorenessConfig[level].text,
      )}
    >
      {part}
    </button>
  );
};

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subjectiveOverride, setSubjectiveOverride] = useState<number | null>(
    null,
  );
  const [showOverrideSlider, setShowOverrideSlider] = useState(false);
  const [tempOverride, setTempOverride] = useState(70);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Payment success celebration
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      triggerConfetti();
      toast.success("Pagamento confermato!", {
        description: "Il tuo abbonamento è ora attivo.",
        duration: 5000,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Auto-open check-in drawer when redirected with ?openCheckin=true
  useEffect(() => {
    if (searchParams.get("openCheckin") === "true") {
      setDrawerOpen(true);
      setSearchParams(
        (prev) => {
          prev.delete("openCheckin");
          return prev;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  // Fetch current user ID for gamification
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  // Cycle-Sync Engine
  const [cycleConfigOpen, setCycleConfigOpen] = useState(false);
  const {
    isConfigured: cycleConfigured,
    cycleStatus,
    settings: cycleSettings,
    saveSettings: saveCycleSettings,
    isSaving: isSavingCycle,
    logSymptoms,
    isLoggingSymptoms,
  } = useCyclePhasing(currentUserId || undefined);

  // Gamification data
  const {
    currentStreak,
    isStreakDay,
    loading: streakLoading,
  } = useGamification(currentUserId || undefined);

  // Nutrition targets (context-aware cycling)
  const { targets: nutritionTargets, isLoading: nutritionLoading } =
    useNutritionTargets(currentUserId || undefined);

  // Habits data
  const {
    habits,
    completedHabits,
    totalHabits,
    completionPercentage: habitsPercentage,
    toggleHabit,
    isToggling: isTogglingHabit,
  } = useAthleteHabits(currentUserId || undefined);

  // Fetch coach profile for branding
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-branding", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;

      // Get athlete's coach_id from their profile
      const { data: athleteProfile, error: profileError } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", currentUserId)
        .single();

      if (profileError || !athleteProfile?.coach_id) return null;

      // Get coach's branding
      const { data: coach, error: coachError } = await supabase
        .from("profiles")
        .select("logo_url, brand_color, full_name")
        .eq("id", athleteProfile.coach_id)
        .single();

      if (coachError) return null;
      return coach;
    },
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Today's date for strict filtering
  const todayDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Fetch TODAY's workout only - strict date filter
  const { data: todayWorkout, isLoading: workoutLoading } = useQuery({
    queryKey: ["todays-workout", currentUserId, todayDate],
    queryFn: async () => {
      if (!currentUserId) return null;

      const { data, error } = await supabase
        .from("workouts")
        .select("id, title, estimated_duration, structure, status")
        .eq("athlete_id", currentUserId)
        .eq("scheduled_date", todayDate)
        .in("status", ["pending", "completed"])
        .maybeSingle();

      if (error) {
        console.error("Error fetching today workout:", error);
        return null;
      }

      return data;
    },
    enabled: !!currentUserId,
    staleTime: 60 * 1000,
  });

  // Calculate training progress (0 = not started, 100 = completed)
  const trainingProgress = useMemo(() => {
    if (!todayWorkout) return 0; // No workout scheduled
    if (todayWorkout.status === "completed") return 100;
    return 0; // Pending
  }, [todayWorkout]);

  // Mock calorie intake (would come from food logging in production)
  const caloriesConsumed = 1200; // TODO: Connect to actual food logging

  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isLoading,
    isSaving,
    calculateScore,
    calculateReadiness,
    saveReadiness,
    baseline,
  } = useReadiness();

  // Calculate readiness result
  const readinessResult: ReadinessResult = readiness.isCompleted
    ? calculateReadiness(readiness)
    : {
        score: 0,
        level: "moderate" as const,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        label: "Check-in Non Completato",
        reason: "",
        penalties: [],
        isNewUser: baseline.isNewUser,
        dataPoints: baseline.dataPoints,
        breakdown: null,
        hrvStatus: "optimal" as const,
        rhrStatus: "optimal" as const,
      };

  const displayScore =
    subjectiveOverride !== null ? subjectiveOverride : readinessResult.score;
  const isOverridden = subjectiveOverride !== null;
  const displayLevel =
    displayScore >= 80 ? "high" : displayScore >= 60 ? "moderate" : "low";

  // GATEKEEPER: Training is only unlocked after readiness check-in is completed
  const canTrain = readiness.isCompleted;

  // Low readiness warning threshold (< 40/100)
  const isLowReadiness = readiness.isCompleted && displayScore < 40;

  // Sync tempReadiness when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTempReadiness(
        readiness.isCompleted ? { ...readiness } : { ...initialReadiness },
      );
    }
  }, [drawerOpen, readiness, setTempReadiness]);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleSubmitReadiness = async () => {
    // Derive max soreness from the body-part map (0 if empty)
    const sorenessValues = Object.values(
      tempReadiness.sorenessMap || {},
    ) as number[];
    const maxSoreness =
      sorenessValues.length > 0 ? Math.max(...sorenessValues) : 0;
    // Scale 0-3 DOMS level → 1-10 for the algorithm
    const sorenessScale = Math.round(1 + (maxSoreness / 3) * 9);

    const dynamicScore = calculateReadinessScore({
      sleepHours: tempReadiness.sleepHours,
      stress: tempReadiness.stress,
      soreness: sorenessScale,
      mood: tempReadiness.mood,
      hrv: tempReadiness.hrvRmssd,
      rhr: tempReadiness.restingHr,
      hrvBaseline: baseline.hrvBaseline,
      rhrBaseline: baseline.restingHrBaseline,
      hrvSd: baseline.hrvSd,
      rhrSd: baseline.restingHrSd,
    });

    // Attach the dynamic score before saving
    await saveReadiness({ ...tempReadiness, score: dynamicScore });
    setDrawerOpen(false);
  };

  const handleSorenessToggle = (part: BodyPart) => {
    setTempReadiness((prev) => {
      const sorenessMap = prev.sorenessMap || {};
      const currentLevel = (sorenessMap[part] ?? 0) as SorenessLevel;
      const nextLevel = ((currentLevel + 1) % 4) as SorenessLevel;

      const newMap = { ...sorenessMap };
      if (nextLevel === 0) {
        delete newMap[part];
      } else {
        newMap[part] = nextLevel;
      }

      return { ...prev, sorenessMap: newMap };
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Ottimo";
    if (score >= 50) return "Moderato";
    return "Basso";
  };

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setTempReadiness((prev) => ({ ...prev, sleepHours: 0 }));
      return;
    }
    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0 && value <= 24) {
      setTempReadiness((prev) => ({ ...prev, sleepHours: value }));
    }
  };

  // Calculate temp readiness for preview
  const tempReadinessResult = calculateReadiness(tempReadiness);

  // Active program check for empty state
  const { activeProgram, isLoading: programLoading } = useActiveProgram();
  const hasNoProgram =
    !programLoading && !activeProgram && !workoutLoading && !todayWorkout;
  const hasNoNutrition =
    !nutritionLoading && (!nutritionTargets || nutritionTargets.calories === 0);
  const isDay1 = hasNoProgram && hasNoNutrition;

  return (
    <AthleteLayout>
      <div className="space-y-4 p-4 pb-24">
        {/* ===== TOP HEADER: Greeting + Data Freshness ===== */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {format(new Date(), "EEEE d MMMM", { locale: it })}
            </p>
            <h1 className="text-xl font-bold leading-tight">Buongiorno</h1>
          </div>
          <SyncIndicator readinessScore={readiness.isCompleted ? displayScore : null} />
        </div>
        {/* ===== DAY 1 EMPTY STATE: Welcome Card ===== */}
        {isDay1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-center space-y-6"
          >
            {/* Ambient glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center backdrop-blur-sm"
              >
                <Sparkles className="h-10 w-10 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-bold tracking-tight">
                Calibriamo il tuo profilo
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                Inizia registrando il tuo primo allenamento o il primo pasto. I
                dati che raccoglierai ci aiuteranno a personalizzare ogni
                aspetto del tuo percorso.
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate("/athlete/training")}
                className="w-full sm:w-auto gap-2 gradient-primary text-primary-foreground"
              >
                <Dumbbell className="h-5 w-5" />
                Primo Allenamento
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/athlete/nutrition")}
                className="w-full sm:w-auto gap-2"
              >
                <Flame className="h-5 w-5" />
                Primo Pasto
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== NO PROGRAM (but has some data) ===== */}
        {hasNoProgram && !isDay1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center space-y-4"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Benvenuto nel Hub!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Il tuo Coach sta analizzando i tuoi dati per creare il programma
              perfetto. Riceverai una notifica appena sarà pronto.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/athlete/profile")}
              >
                Aggiorna Profilo
              </Button>
              <Button
                onClick={() => navigate("/athlete/messages")}
                className="btn-primary-glow text-primary-foreground"
              >
                Scrivi al Coach
              </Button>
            </div>
          </motion.div>
        )}
        {/* ===== GLASSMORPHIC STATUS HUB HEADER ===== */}
        <motion.div
          className="relative overflow-hidden rounded-2xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Background gradient with glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative p-4">
            {/* Coach Logo & Greeting Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Coach Logo with glow */}
                <div className="relative">
                  {coachProfile?.logo_url ? (
                    <>
                      <div
                        className="absolute inset-0 rounded-xl blur-md opacity-40"
                        style={{
                          backgroundColor:
                            coachProfile?.brand_color || "hsl(var(--primary))",
                        }}
                      />
                      <img
                        src={coachProfile.logo_url}
                        alt="Coach"
                        className="relative h-10 w-10 rounded-xl object-contain bg-background/80 backdrop-blur-sm border border-border/50"
                      />
                    </>
                  ) : (
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                      style={{
                        backgroundColor:
                          coachProfile?.brand_color || "hsl(var(--primary))",
                      }}
                    >
                      {coachProfile?.full_name?.charAt(0) || "C"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Buongiorno</p>
                  <h1 className="text-lg font-semibold">Sofia </h1>
                </div>
              </div>

              {/* Streak Badge */}
              {currentStreak > 0 && (
                <motion.div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "bg-gradient-to-r from-orange-500/20 to-amber-500/20",
                    "border border-orange-500/30 backdrop-blur-sm",
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Flame
                    className={cn(
                      "h-4 w-4",
                      currentStreak >= 7 ? "text-orange-500" : "text-amber-500",
                    )}
                  />
                  <span className="text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">
                    {currentStreak}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Daily Rings */}
            <DailyRings
              fuelValue={caloriesConsumed}
              fuelTarget={nutritionTargets.calories}
              trainingProgress={trainingProgress}
              habitsCompleted={completedHabits}
              habitsTotal={totalHabits}
              brandColor={coachProfile?.brand_color}
            />

            {/* Training Day Indicator */}
            <motion.div
              className="flex justify-center mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] backdrop-blur-sm",
                  nutritionTargets.isTrainingDay
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                )}
              >
                {nutritionTargets.isTrainingDay ? "Training Day" : "Rest Day"}
                {nutritionTargets.strategyMode === "cycling_on_off" &&
                  "· Cycling"}
              </Badge>
            </motion.div>
          </div>
        </motion.div>

        {/* ===== CYCLE-SYNC ENGINE ===== */}
        {cycleConfigured && cycleStatus ? (
          <CyclePhaseCard
            cycleStatus={cycleStatus}
            cycleLength={cycleSettings?.cycle_length_days || 28}
            onLogSymptoms={logSymptoms}
            isLogging={isLoggingSymptoms}
          />
        ) : (
          <CycleSetupCTA onSetup={() => setCycleConfigOpen(true)} />
        )}

        {/* Cycle Config Dialog */}
        <CycleConfigDialog
          open={cycleConfigOpen}
          onOpenChange={setCycleConfigOpen}
          onSave={saveCycleSettings}
          isSaving={isSavingCycle}
          defaultValues={{
            lastPeriodStart: cycleSettings?.last_period_start_date || undefined,
            cycleLength: cycleSettings?.cycle_length_days || 28,
            contraceptiveType: cycleSettings?.contraceptive_type || "none",
          }}
        />

        {/* ===== ACTION STACK ===== */}
        <div className="space-y-3">
          {/* === ACTION 1: READINESS GATEKEEPER === */}
          <AnimatePresence mode="wait">
            {!readiness.isCompleted ? (
              <motion.div
                key="readiness-required"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all",
                    "border-2 border-amber-500/50",
                    "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background",
                  )}
                  onClick={handleOpenDrawer}
                >
                  {/* Animated pulse overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <CardContent className="relative p-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center flex-shrink-0"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Sun className="h-7 w-7 text-amber-500" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base text-amber-600 dark:text-amber-400">
                            Check-in Mattutino
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sblocca l'allenamento registrando i dati di oggi
                        </p>
                        {baseline.isNewUser && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] text-amber-600">
                              {baseline.dataPoints}/3 giorni per baseline
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-10 px-4 shadow-lg"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* ===== READINESS SCORE CARD (after check-in) ===== */
              <motion.div
                key="readiness-complete"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden cursor-pointer transition-all border",
                    displayLevel === "high"
                      ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background"
                      : displayLevel === "moderate"
                        ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background"
                        : "border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-background",
                  )}
                  onClick={handleOpenDrawer}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Score Ring */}
                      <ReadinessRing score={displayScore} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={cn(
                              "text-2xl font-bold tabular-nums",
                              displayLevel === "high"
                                ? "text-emerald-500"
                                : displayLevel === "moderate"
                                  ? "text-amber-500"
                                  : "text-rose-500",
                            )}
                          >
                            {displayScore}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / 100
                          </span>
                          {isOverridden && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] py-0"
                            >
                              Override
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-0.5">
                          Punteggio Recupero
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            displayLevel === "high"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : displayLevel === "moderate"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400",
                          )}
                        >
                          {generateReadinessInsight(displayScore, {
                            sleepHours: readiness.sleepHours,
                            stress: readiness.stress,
                            soreness: Math.max(
                              0,
                              ...Object.values(readiness.sorenessMap || {}).map(
                                Number,
                              ),
                            ),
                            mood: readiness.mood,
                          })}
                        </p>
                        {readinessResult.reason && (
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">
                            {readinessResult.reason}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === ACTION 2: WORKOUT OF THE DAY (The Mission) === */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {todayWorkout ? (
              <Card
                className={cn(
                  "relative overflow-hidden transition-all cursor-pointer border-0",
                  !canTrain && "opacity-60",
                )}
                style={{
                  background: canTrain
                    ? `linear-gradient(135deg, ${coachProfile?.brand_color || "hsl(var(--primary))"}15, ${coachProfile?.brand_color || "hsl(var(--primary))"}05)`
                    : undefined,
                }}
                onClick={() => {
                  if (!canTrain) {
                    handleOpenDrawer();
                    return;
                  }
                  navigate(`/athlete/workout/${todayWorkout.id}`);
                }}
              >
                {/* Lock overlay when not ready */}
                {!canTrain && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Check-in richiesto
                      </span>
                    </div>
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0",
                        canTrain ? "bg-white/20 dark:bg-white/10" : "bg-muted",
                      )}
                      style={
                        canTrain
                          ? {
                              backgroundColor: `${coachProfile?.brand_color || "hsl(var(--primary))"}20`,
                            }
                          : undefined
                      }
                    >
                      <Dumbbell
                        className="h-7 w-7"
                        style={{
                          color: canTrain
                            ? coachProfile?.brand_color || "hsl(var(--primary))"
                            : undefined,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">
                          {todayWorkout.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {todayWorkout.estimated_duration || 45} min
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Dumbbell className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {Array.isArray(todayWorkout.structure)
                              ? todayWorkout.structure.length
                              : 0}{" "}
                            esercizi
                          </span>
                        </div>
                      </div>

                      {/* Low Readiness Warning */}
                      {canTrain && isLowReadiness && (
                        <motion.div
                          className="mt-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-warning/15 text-warning border-warning/30 text-[10px]"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Considera di scalare l'intensità
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    <Button
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-xl shadow-lg transition-all",
                        canTrain && "hover:scale-105",
                      )}
                      style={
                        canTrain
                          ? {
                              background: `linear-gradient(135deg, ${coachProfile?.brand_color || "hsl(var(--primary))"}, ${coachProfile?.brand_color || "hsl(var(--primary))"}dd)`,
                            }
                          : undefined
                      }
                      disabled={!canTrain}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canTrain) {
                          handleOpenDrawer();
                          return;
                        }
                        navigate(`/athlete/workout/${todayWorkout.id}`);
                      }}
                    >
                      {canTrain ? (
                        <Play className="h-5 w-5 text-white fill-white" />
                      ) : (
                        <span className="text-lg"></span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Rest Day State */
              <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                <CardContent className="p-5 text-center">
                  <motion.div
                    className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/15 mb-3"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Moon className="h-7 w-7 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Rest Day
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No workout scheduled. Focus on recovery.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* === ACTION 3: ACTIVE HABITS (Minimalist Toggle List) === */}
          {totalHabits > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Card className="border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-violet-500/15 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                      </div>
                      <span className="text-sm font-semibold">
                        Daily Habits
                      </span>
                    </div>
                    <button
                      onClick={() => navigate("/athlete/habits")}
                      className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      Tutte
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {habits.map((habit, index) => (
                      <motion.button
                        key={habit.athlete_habit_id}
                        onClick={() =>
                          toggleHabit(
                            habit.athlete_habit_id,
                            !habit.isCompleted,
                          )
                        }
                        disabled={isTogglingHabit}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                          "active:scale-[0.98]",
                          habit.isCompleted
                            ? "bg-success/10 border border-success/20"
                            : "bg-secondary/50 hover:bg-secondary/70 border border-transparent",
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <motion.div
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                            habit.isCompleted
                              ? "bg-success"
                              : "border-2 border-muted-foreground/30",
                          )}
                          animate={
                            habit.isCompleted ? { scale: [1, 1.2, 1] } : {}
                          }
                          transition={{ duration: 0.3 }}
                        >
                          {habit.isCompleted && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <Check className="h-3.5 w-3.5 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                        <span
                          className={cn(
                            "text-sm text-left flex-1 font-medium",
                            habit.isCompleted &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {habit.name}
                        </span>
                        {habit.category && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {habit.category}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ===== QUICK STATS ===== */}
        <div className="grid grid-cols-2 gap-3">
          <AcwrCard />

          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Calorie</span>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {caloriesConsumed.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                / {nutritionTargets.calories.toLocaleString()} kcal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <p className="text-xl font-bold tabular-nums">{currentStreak}</p>
              <p className="text-[10px] text-muted-foreground">
                giorni consecutivi
              </p>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Smile className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Umore</span>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {readiness.isCompleted ? readiness.mood : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">/ 10</p>
            </CardContent>
          </Card>
        </div>

        {/* Debug Footer */}
        <div className="mt-4 pt-3 border-t border-border/30 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: it })}
          </p>
        </div>
      </div>

      {/* ===== READINESS DRAWER ===== */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="theme-athlete max-h-[90vh] bg-background">
          <div className="mx-auto w-full max-w-md overflow-y-auto">
            <DrawerHeader className="text-center pb-2">
              <DrawerTitle className="text-lg">Morning Check-in</DrawerTitle>
              <DrawerDescription className="text-xs">
                Registra i tuoi dati biometrici del mattino
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-6 overflow-y-auto">
              {/* SECTION: WEARABLE METRICS */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  METRICHE WEARABLE
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* HRV Input */}
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">
                      HRV (RMSSD)
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempReadiness.hrvRmssd ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTempReadiness((prev) => ({
                            ...prev,
                            hrvRmssd: value === "" ? null : parseInt(value),
                          }));
                        }}
                        min={10}
                        max={200}
                        placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                      />
                      <span className="text-sm font-medium text-foreground/60">
                        ms
                      </span>
                    </div>
                    {baseline.hrvBaseline && (
                      <p className="text-[10px] text-muted-foreground">
                        Baseline: {Math.round(baseline.hrvBaseline)}ms
                      </p>
                    )}
                  </div>

                  {/* Resting HR Input */}
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">
                      FC a Riposo
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempReadiness.restingHr ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTempReadiness((prev) => ({
                            ...prev,
                            restingHr: value === "" ? null : parseInt(value),
                          }));
                        }}
                        min={30}
                        max={120}
                        placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                      />
                      <span className="text-sm font-medium text-foreground/60">
                        bpm
                      </span>
                    </div>
                    {baseline.restingHrBaseline && (
                      <p className="text-[10px] text-muted-foreground">
                        Baseline: {Math.round(baseline.restingHrBaseline)}bpm
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Inserisci i dati dal tuo wearable o lascia vuoto se non
                  disponibile
                </p>
              </div>

              {/* SECTION: SLEEP */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Moon className="h-4 w-4 text-primary" />
                  SONNO
                </Label>
                <div className="flex flex-row items-center justify-between gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">
                      Ore
                    </span>
                    <Input
                      type="number"
                      value={tempReadiness.sleepHours}
                      onChange={handleSleepHoursChange}
                      step={0.5}
                      min={0}
                      max={24}
                      className="w-16 h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">
                        Qualità
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {tempReadiness.sleepQuality}/10
                      </span>
                    </div>
                    <Slider
                      value={[tempReadiness.sleepQuality]}
                      onValueChange={([value]) =>
                        setTempReadiness((prev) => ({
                          ...prev,
                          sleepQuality: value,
                        }))
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-foreground/60">
                      <span>Poor</span>
                      <span>Great</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: BODY WEIGHT */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Scale className="h-4 w-4 text-primary" />
                  PESO CORPOREO
                </Label>
                <div className="flex flex-row items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">
                      Peso odierno
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={tempReadiness.bodyWeight ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTempReadiness((prev) => ({
                            ...prev,
                            bodyWeight: value === "" ? null : parseFloat(value),
                          }));
                        }}
                        step={0.1}
                        min={30}
                        max={300}
                        placeholder="—"
                        className="w-24 h-12 text-center text-xl font-bold bg-card text-foreground border-0"
                      />
                      <span className="text-sm font-medium text-foreground/60">
                        kg
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center max-w-[140px]">
                    <p>
                      Pesati la mattina, a digiuno, per un dato più accurato
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION: SUBJECTIVE READINESS */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Activity className="h-4 w-4 text-primary" />
                  COME TI SENTI?
                </Label>

                <ParamSliderCard
                  label="Energia"
                  value={tempReadiness.energy}
                  onChange={(v) =>
                    setTempReadiness((prev) => ({ ...prev, energy: v }))
                  }
                  lowLabel="Low"
                  highLabel="High"
                  icon={Zap}
                />

                <ParamSliderCard
                  label="Stress"
                  value={tempReadiness.stress}
                  onChange={(v) =>
                    setTempReadiness((prev) => ({ ...prev, stress: v }))
                  }
                  lowLabel="Low"
                  highLabel="High"
                  inverted={true}
                  icon={Brain}
                />

                <ParamSliderCard
                  label="Umore"
                  value={tempReadiness.mood}
                  onChange={(v) =>
                    setTempReadiness((prev) => ({ ...prev, mood: v }))
                  }
                  lowLabel="Low"
                  highLabel="High"
                  icon={Smile}
                />

                <ParamSliderCard
                  label="Digestione"
                  value={tempReadiness.digestion}
                  onChange={(v) =>
                    setTempReadiness((prev) => ({ ...prev, digestion: v }))
                  }
                  lowLabel="Poor"
                  highLabel="Great"
                  icon={HeartPulse}
                />
              </div>

              {/* SECTION: DOMS & BODY MAP */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  SORENESS MAP
                </Label>
                <p className="text-[10px] text-foreground/60">
                  Tocca per ciclare: Nessuno → Leggero → Moderato → Acuto
                </p>
                <div className="flex flex-wrap gap-2">
                  {bodyParts.map((part) => (
                    <BodyPartChip
                      key={part}
                      part={part}
                      level={
                        (tempReadiness.sorenessMap?.[part] ??
                          0) as SorenessLevel
                      }
                      onClick={() => handleSorenessToggle(part)}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {([0, 1, 2, 3] as SorenessLevel[]).map((level) => (
                    <div key={level} className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          sorenessConfig[level].bg,
                        )}
                      />
                      <span className="text-[10px] text-foreground/60">
                        {sorenessConfig[level].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Baseline status note */}
              {tempReadinessResult.isNewUser && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Baseline in costruzione ({baseline.dataPoints}/3 giorni)
                  </p>
                </div>
              )}
            </div>

            <DrawerFooter className="pt-2">
              <Button
                onClick={handleSubmitReadiness}
                className="w-full h-12 font-semibold gradient-primary"
                disabled={isSaving}
              >
                <Check className="h-4 w-4 mr-2" />
                {isSaving ? "Salvataggio..." : "Conferma Check-in"}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  Annulla
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </AthleteLayout>
  );
}
