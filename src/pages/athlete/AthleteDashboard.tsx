import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { triggerConfetti } from "@/utils/ux";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  HeartPulse,
  Moon,
  Play,
  Scale,
  ShieldAlert,
  Smile,
  Sun,
  Zap,
} from "lucide-react";

import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MealScannerDialog } from "@/components/nutrition/MealScannerDialog";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useReadiness,
  initialReadiness,
  ReadinessResult,
} from "@/hooks/useReadiness";
import { calculateReadinessScore } from "@/lib/math/readinessMath";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { useFmsAlerts } from "@/hooks/useFmsAlerts";
import { useMetabolicStore } from "@/stores/useMetabolicStore";

// ============================================================================
// Body parts for DOMS map (used inside check-in drawer)
// ============================================================================
const bodyParts = [
  "Petto", "Tricipiti", "Bicipiti", "Spalle", "Trapezi", "Dorsali",
  "Bassa Schiena", "Glutei", "Femorali", "Quadricipiti", "Polpacci",
] as const;

type BodyPart = (typeof bodyParts)[number];
type SorenessLevel = 0 | 1 | 2 | 3;

const sorenessConfig: Record<
  SorenessLevel,
  { bg: string; text: string; label: string }
> = {
  0: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", label: "Nessuno" },
  1: { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "Leggero" },
  2: { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Moderato" },
  3: { bg: "bg-rose-100 dark:bg-rose-900/40", text: "text-rose-700 dark:text-rose-300", label: "Acuto" },
};

// ============================================================================
// Hero Readiness Ring — large, premium, "Oura-style"
// ============================================================================
function ReadinessHeroRing({
  score,
  brandColor,
  isCompleted,
}: {
  score: number;
  brandColor?: string | null;
  isCompleted: boolean;
}) {
  const radius = 64;
  const stroke = 10;
  const r = radius - stroke / 2;
  const circumference = r * 2 * Math.PI;
  const pct = isCompleted ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const dashOffset = circumference * (1 - pct);

  const ringColor = !isCompleted
    ? "hsl(var(--muted-foreground))"
    : score >= 75
      ? "hsl(160 84% 39%)"
      : score >= 50
        ? "hsl(38 92% 50%)"
        : "hsl(0 84% 60%)";

  return (
    <div className="relative h-32 w-32 flex-shrink-0">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <circle
          stroke="hsl(var(--muted) / 0.4)"
          fill="transparent"
          strokeWidth={stroke}
          r={r}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          r={r}
          cx={radius}
          cy={radius}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isCompleted ? (
          <>
            <span
              className="text-4xl font-bold tabular-nums leading-none"
              style={{ color: ringColor }}
            >
              {score}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
              Readiness
            </span>
          </>
        ) : (
          <>
            <Sun className="h-7 w-7 text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 text-center px-2">
              Tap to check-in
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Macro Pill — horizontal mini bar
// ============================================================================
function MacroPill({
  label,
  current,
  target,
  colorClass,
}: {
  label: string;
  current: number;
  target: number;
  colorClass: string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-foreground/80">
          {Math.round(current)}
          <span className="text-muted-foreground font-normal">/{target}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Drawer slider card (shared by check-in)
// ============================================================================
const ParamSliderCard = ({
  label, value, onChange, lowLabel, highLabel, inverted = false, icon: Icon,
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
        <span className={cn("text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md text-white", getSliderColor())}>
          {value}
        </span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={10} step={1} className="w-full" />
      <div className="flex justify-between text-[10px] text-foreground/60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

const BodyPartChip = ({ part, level, onClick }: { part: BodyPart; level: SorenessLevel; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
      sorenessConfig[level].bg, sorenessConfig[level].text,
    )}
  >
    {part}
  </button>
);

// ============================================================================
// NC Design System helpers — Dashboard widgets (§3.1)
// ============================================================================

function ReadinessGauge({
  score, isCompleted, primary, track, ink, muted,
}: {
  score: number;
  isCompleted: boolean;
  primary: string;
  track: string;
  ink: string;
  muted: string;
}) {
  const radius = 52;
  const stroke = 8;
  const r = radius - stroke / 2;
  const c = r * 2 * Math.PI;
  const pct = isCompleted ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const dash = c * (1 - pct);
  return (
    <div className="relative flex-shrink-0" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle stroke={track} fill="transparent" strokeWidth={stroke} r={r} cx={radius} cy={radius} />
        <circle
          stroke={primary} fill="transparent" strokeWidth={stroke}
          strokeDasharray={`${c} ${c}`} strokeDashoffset={dash} strokeLinecap="round"
          r={r} cx={radius} cy={radius}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isCompleted ? (
          <>
            <span className="font-display text-3xl font-bold tabular-nums leading-none" style={{ color: ink }}>
              {score}
            </span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
              Score
            </span>
          </>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-center px-2" style={{ color: primary }}>
            Tap<br />Check-in
          </span>
        )}
      </div>
    </div>
  );
}

function MacroRow({
  label, value, target, ink, muted,
}: {
  label: string; value: number; target: number; ink: string; muted: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-medium" style={{ color: muted }}>{label}</span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: ink }}>
        {value}<span className="font-normal" style={{ color: muted }}>/{target}g</span>
      </span>
    </div>
  );
}

function MiniRing({
  letter, pct, primary, track, ink,
}: { letter: string; pct: number; primary: string; track: string; ink: string }) {
  const size = 28;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = r * 2 * Math.PI;
  const dash = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative flex-1 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle stroke={track} fill="transparent" strokeWidth={stroke} r={r} cx={size / 2} cy={size / 2} />
        <circle
          stroke={primary} fill="transparent" strokeWidth={stroke}
          strokeDasharray={`${c} ${c}`} strokeDashoffset={dash} strokeLinecap="round"
          r={r} cx={size / 2} cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <span className="text-[9px] font-bold" style={{ color: ink }}>{letter}</span>
    </div>
  );
}

function ConcentricMacroRings({
  proPct, fatPct, carbPct, remainingKcal, primary, track, ink, muted,
}: {
  proPct: number; fatPct: number; carbPct: number;
  remainingKcal: number; primary: string; track: string; ink: string; muted: string;
}) {
  const size = 120;
  const stroke = 8;
  const gap = 3;
  const rings = [
    { pct: proPct, r: (size - stroke) / 2 },                              // Pro outer
    { pct: fatPct, r: (size - stroke) / 2 - (stroke + gap) },             // Fat mid
    { pct: carbPct, r: (size - stroke) / 2 - (stroke + gap) * 2 },        // Carb inner
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const c = ring.r * 2 * Math.PI;
          const dash = c * (1 - Math.max(0, Math.min(100, ring.pct)) / 100);
          return (
            <g key={i}>
              <circle stroke={track} fill="transparent" strokeWidth={stroke} r={ring.r} cx={size / 2} cy={size / 2} />
              <circle
                stroke={primary} fill="transparent" strokeWidth={stroke}
                strokeDasharray={`${c} ${c}`} strokeDashoffset={dash} strokeLinecap="round"
                r={ring.r} cx={size / 2} cy={size / 2}
                opacity={1 - i * 0.22}
                style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold tabular-nums leading-none" style={{ color: ink }}>
          {remainingKcal >= 0 ? `-${remainingKcal}` : `+${Math.abs(remainingKcal)}`}
        </span>
        <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: muted }}>
          kcal left
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN — Athlete Dashboard (Widget Control Center)
// ============================================================================
export default function AthleteDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const currentUserId = user?.id ?? null;
  const todayDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

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

  // Auto-open check-in drawer on redirect
  useEffect(() => {
    if (searchParams.get("openCheckin") === "true") {
      setDrawerOpen(true);
      setSearchParams(
        (prev) => { prev.delete("openCheckin"); return prev; },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  // ---- Data hooks ----
  const {
    readiness, tempReadiness, setTempReadiness, isSaving,
    calculateReadiness, saveReadiness, baseline,
  } = useReadiness();

  const { targets: nutritionTargets } = useNutritionTargets(currentUserId || undefined);
  const { todayIntake } = useMetabolicStore();
  const { data: fmsData } = useFmsAlerts(currentUserId);

  // Coach branding
  const { data: coachProfile } = useQuery({
    queryKey: ["coach-branding", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data: athleteProfile } = await supabase
        .from("profiles").select("coach_id").eq("id", currentUserId).single();
      if (!athleteProfile?.coach_id) return null;
      const { data: coach } = await supabase
        .from("profiles").select("logo_url, brand_color, full_name")
        .eq("id", athleteProfile.coach_id).single();
      return coach;
    },
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000,
  });

  // Today's workout
  const { data: todayWorkout } = useQuery({
    queryKey: ["todays-workout", currentUserId, todayDate],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from("workouts")
        .select("id, title, estimated_duration, structure, status")
        .eq("athlete_id", currentUserId)
        .eq("scheduled_date", todayDate)
        .in("status", ["pending", "completed"])
        .maybeSingle();
      return data;
    },
    enabled: !!currentUserId,
    staleTime: 60 * 1000,
  });

  // Readiness derived
  const readinessResult: ReadinessResult = readiness.isCompleted
    ? calculateReadiness(readiness)
    : {
        score: 0, level: "moderate" as const, color: "text-muted-foreground",
        bgColor: "bg-muted", label: "Check-in non completato", reason: "",
        penalties: [], isNewUser: baseline.isNewUser, dataPoints: baseline.dataPoints,
        breakdown: null, hrvStatus: "optimal" as const, rhrStatus: "optimal" as const,
      };

  const displayScore = readinessResult.score;
  const canTrain = readiness.isCompleted;
  const isLowReadiness = readiness.isCompleted && displayScore < 40;
  const hasFmsRedFlags = !!fmsData?.hasRedFlags;

  const statusBadge = !readiness.isCompleted
    ? { label: "Check-in", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
    : displayScore >= 75
      ? { label: "Optimal", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" }
      : displayScore >= 50
        ? { label: "Caution", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" }
        : { label: "Rest", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" };

  // Sync drawer state
  useEffect(() => {
    if (drawerOpen) {
      setTempReadiness(
        readiness.isCompleted ? { ...readiness } : { ...initialReadiness },
      );
    }
  }, [drawerOpen, readiness, setTempReadiness]);

  const handleSubmitReadiness = async () => {
    const sorenessValues = Object.values(tempReadiness.sorenessMap || {}) as number[];
    const maxSoreness = sorenessValues.length > 0 ? Math.max(...sorenessValues) : 0;
    const sorenessScale = Math.round(1 + (maxSoreness / 3) * 9);
    const dynamicScore = calculateReadinessScore({
      sleepHours: tempReadiness.sleepHours, stress: tempReadiness.stress,
      soreness: sorenessScale, mood: tempReadiness.mood,
      hrv: tempReadiness.hrvRmssd, rhr: tempReadiness.restingHr,
      hrvBaseline: baseline.hrvBaseline, rhrBaseline: baseline.restingHrBaseline,
      hrvSd: baseline.hrvSd, rhrSd: baseline.restingHrSd,
    });
    await saveReadiness({ ...tempReadiness, score: dynamicScore });
    setDrawerOpen(false);
  };

  const handleSorenessToggle = (part: BodyPart) => {
    setTempReadiness((prev) => {
      const sorenessMap = prev.sorenessMap || {};
      const currentLevel = (sorenessMap[part] ?? 0) as SorenessLevel;
      const nextLevel = ((currentLevel + 1) % 4) as SorenessLevel;
      const newMap = { ...sorenessMap };
      if (nextLevel === 0) delete newMap[part];
      else newMap[part] = nextLevel;
      return { ...prev, sorenessMap: newMap };
    });
  };

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") { setTempReadiness((p) => ({ ...p, sleepHours: 0 })); return; }
    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0 && value <= 24) {
      setTempReadiness((p) => ({ ...p, sleepHours: value }));
    }
  };

  const tempReadinessResult = calculateReadiness(tempReadiness);
  const firstName = (profile?.full_name || "").split(" ")[0] || "Atleta";
  const brandColor = coachProfile?.brand_color || null;

  // ─── NC Design System tokens ───
  const NC = {
    surface: "#FFFFFF",
    ink: "#043555",
    muted: "#50768E",
    primary: "#226FA3",
    deep: "#093858",
    track: "#F1F5F9",
  };

  // Top-3 subjective sub-metrics (Sleep / Energy / Soreness)
  const sorenessValues = Object.values(readiness.sorenessMap || {}) as number[];
  const maxSoreness = sorenessValues.length > 0 ? Math.max(...sorenessValues) : 0;
  const sleepPct = Math.min(100, (readiness.sleepHours / 8) * 100);
  const energyPct = (readiness.energy / 10) * 100;
  // Soreness: invert (high soreness → low score)
  const sorenessPct = Math.max(0, 100 - (maxSoreness / 3) * 100);

  const subMetrics = [
    { key: "sleep", label: "Sleep", icon: Moon, value: `${readiness.sleepHours.toFixed(1)}h`, pct: sleepPct },
    { key: "energy", label: "Energy", icon: Zap, value: `${readiness.energy}/10`, pct: energyPct },
    { key: "soreness", label: "Soreness", icon: HeartPulse, value: maxSoreness === 0 ? "None" : ["—", "Mild", "Mod", "High"][maxSoreness], pct: sorenessPct },
  ];

  // Nutrition derived
  const remainingKcal = Math.round(nutritionTargets.calories - todayIntake.calories);
  const proPct = nutritionTargets.protein > 0 ? Math.min(100, (todayIntake.protein / nutritionTargets.protein) * 100) : 0;
  const fatPct = nutritionTargets.fats > 0 ? Math.min(100, (todayIntake.fats / nutritionTargets.fats) * 100) : 0;
  const carbPct = nutritionTargets.carbs > 0 ? Math.min(100, (todayIntake.carbs / nutritionTargets.carbs) * 100) : 0;

  // Micro: Fiber / Water / Sodium (use nutrient store fields if present, else 0)
  const intakeAny = todayIntake as unknown as Record<string, number | undefined>;
  const targetsAny = nutritionTargets as unknown as Record<string, number | undefined>;
  const fiberPct = (targetsAny.fiber ?? 0) > 0 ? Math.min(100, ((intakeAny.fiber ?? 0) / (targetsAny.fiber ?? 1)) * 100) : 0;
  const waterPct = (targetsAny.water ?? 0) > 0 ? Math.min(100, ((intakeAny.water ?? 0) / (targetsAny.water ?? 1)) * 100) : 0;
  const sodiumPct = (targetsAny.sodium ?? 0) > 0 ? Math.min(100, ((intakeAny.sodium ?? 0) / (targetsAny.sodium ?? 1)) * 100) : 0;

  return (
    <AthleteLayout>
      <div
        className="flex flex-col gap-4 p-4 pb-24"
        style={{ backgroundColor: NC.surface, color: NC.ink }}
      >
        {/* ===== TOP BAR ===== */}
        <header className="flex items-center justify-between pt-1">
          <div className="min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium"
              style={{ color: NC.muted }}
            >
              {format(new Date(), "EEEE d MMMM", { locale: it })}
            </p>
            <h1
              className="font-display text-lg font-bold leading-tight truncate"
              style={{ color: NC.ink }}
            >
              Ready for today, {firstName}?
            </h1>
          </div>
          <button
            onClick={() => navigate("/athlete/profile")}
            className="flex-shrink-0 active:scale-95 transition-transform min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Apri profilo"
          >
            <Avatar className="h-11 w-11" style={{ borderColor: NC.track, borderWidth: 1 }}>
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={firstName} />}
              <AvatarFallback
                className="text-sm font-semibold"
                style={{ backgroundColor: NC.track, color: NC.primary }}
              >
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </header>

        {/* ===== WIDGET 1 — READINESS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full text-left rounded-2xl p-5 transition-shadow active:scale-[0.99]"
            style={{
              backgroundColor: NC.surface,
              boxShadow: "0 1px 3px rgba(4,53,85,0.06), 0 4px 12px rgba(4,53,85,0.05)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              {/* LEFT: Top 3 subjective sub-metrics */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: NC.muted }}
                  >
                    Readiness
                  </p>
                  {hasFmsRedFlags && (
                    <span
                      className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                    >
                      FMS
                    </span>
                  )}
                </div>
                {subMetrics.map((m) => (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <m.icon className="h-3.5 w-3.5" style={{ color: NC.muted }} />
                        <span className="text-xs font-medium" style={{ color: NC.ink }}>
                          {m.label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: NC.ink }}
                      >
                        {readiness.isCompleted ? m.value : "—"}
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ backgroundColor: NC.track }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${readiness.isCompleted ? m.pct : 0}%`,
                          backgroundColor: NC.primary,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: Circular gauge */}
              <ReadinessGauge
                score={displayScore}
                isCompleted={readiness.isCompleted}
                primary={NC.primary}
                track={NC.track}
                ink={NC.ink}
                muted={NC.muted}
              />
            </div>
          </button>
        </motion.div>

        {/* ===== WIDGET 2 — TODAY'S TRAINING ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: NC.surface,
              boxShadow: "0 1px 3px rgba(4,53,85,0.06), 0 4px 12px rgba(4,53,85,0.05)",
            }}
          >
            {todayWorkout ? (
              <>
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold mb-1"
                  style={{ color: NC.muted }}
                >
                  Today's Training
                </p>
                <h2
                  className="font-display text-xl font-bold leading-tight truncate mb-1"
                  style={{ color: NC.ink }}
                >
                  {todayWorkout.title}
                </h2>
                <div
                  className="flex items-center gap-3 text-xs mb-4"
                  style={{ color: NC.muted }}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {todayWorkout.estimated_duration || 45} min
                  </span>
                  {canTrain && isLowReadiness && (
                    <span className="flex items-center gap-1 font-semibold" style={{ color: "#B45309" }}>
                      <AlertTriangle className="h-3 w-3" />
                      Scala intensità
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!canTrain) { setDrawerOpen(true); return; }
                    navigate(`/athlete/workout/${todayWorkout.id}`);
                  }}
                  className="w-full h-14 min-h-[56px] rounded-xl font-display text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  style={{
                    backgroundColor: canTrain ? NC.primary : NC.muted,
                    color: NC.surface,
                    boxShadow: canTrain ? "0 4px 14px rgba(34,111,163,0.35)" : "none",
                  }}
                >
                  <Play className="h-5 w-5 fill-current" />
                  {canTrain ? "Start Session" : "Complete Check-in First"}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 py-2">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: NC.track }}
                >
                  <Moon className="h-6 w-6" style={{ color: NC.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-bold" style={{ color: NC.ink }}>
                    Rest Day
                  </h2>
                  <p className="text-xs" style={{ color: NC.muted }}>
                    Concentrati sul recupero.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ===== WIDGET 3 — METABOLIC & NUTRITION (50/50) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div
            className="relative rounded-2xl p-5"
            style={{
              backgroundColor: NC.surface,
              boxShadow: "0 1px 3px rgba(4,53,85,0.06), 0 4px 12px rgba(4,53,85,0.05)",
            }}
          >
            <div className="grid grid-cols-2 gap-4 items-center">
              {/* LEFT — Macro readout (top) + Micro mini-rings (bottom) */}
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p
                    className="text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: NC.muted }}
                  >
                    Macros
                  </p>
                  <div className="space-y-1">
                    <MacroRow label="Pro" value={Math.round(todayIntake.protein)} target={nutritionTargets.protein} ink={NC.ink} muted={NC.muted} />
                    <MacroRow label="Fat" value={Math.round(todayIntake.fats)} target={nutritionTargets.fats} ink={NC.ink} muted={NC.muted} />
                    <MacroRow label="Carb" value={Math.round(todayIntake.carbs)} target={nutritionTargets.carbs} ink={NC.ink} muted={NC.muted} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MiniRing letter="F" pct={fiberPct} primary={NC.primary} track={NC.track} ink={NC.ink} />
                  <MiniRing letter="W" pct={waterPct} primary={NC.primary} track={NC.track} ink={NC.ink} />
                  <MiniRing letter="S" pct={sodiumPct} primary={NC.primary} track={NC.track} ink={NC.ink} />
                </div>
              </div>

              {/* RIGHT — Concentric rings */}
              <div className="flex items-center justify-center">
                <ConcentricMacroRings
                  proPct={proPct}
                  fatPct={fatPct}
                  carbPct={carbPct}
                  remainingKcal={remainingKcal}
                  primary={NC.primary}
                  track={NC.track}
                  ink={NC.ink}
                  muted={NC.muted}
                />
              </div>
            </div>

            {/* Floating "Snap Meal" camera FAB */}
            <button
              onClick={() => setScannerOpen(true)}
              className="absolute -top-3 -right-3 h-14 w-14 min-h-[48px] min-w-[48px] rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                backgroundColor: NC.deep,
                color: NC.surface,
                boxShadow: "0 6px 20px rgba(9,56,88,0.4)",
                border: `4px solid ${NC.surface}`,
              }}
              aria-label="Snap meal"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ===== MEAL SCANNER ===== */}
      <MealScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />

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
              {/* WEARABLE METRICS */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  METRICHE WEARABLE
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">HRV (RMSSD)</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" value={tempReadiness.hrvRmssd ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTempReadiness((p) => ({ ...p, hrvRmssd: v === "" ? null : parseInt(v) }));
                        }}
                        min={10} max={200} placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card border-0"
                      />
                      <span className="text-sm text-foreground/60">ms</span>
                    </div>
                    {baseline.hrvBaseline && (
                      <p className="text-[10px] text-muted-foreground">Baseline: {Math.round(baseline.hrvBaseline)}ms</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">FC a Riposo</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" value={tempReadiness.restingHr ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTempReadiness((p) => ({ ...p, restingHr: v === "" ? null : parseInt(v) }));
                        }}
                        min={30} max={120} placeholder="—"
                        className="w-full h-12 text-center text-xl font-bold bg-card border-0"
                      />
                      <span className="text-sm text-foreground/60">bpm</span>
                    </div>
                    {baseline.restingHrBaseline && (
                      <p className="text-[10px] text-muted-foreground">Baseline: {Math.round(baseline.restingHrBaseline)}bpm</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SLEEP */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Moon className="h-4 w-4 text-primary" />
                  SONNO
                </Label>
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Ore</span>
                    <Input
                      type="number" value={tempReadiness.sleepHours} onChange={handleSleepHoursChange}
                      step={0.5} min={0} max={24}
                      className="w-16 h-12 text-center text-xl font-bold bg-card border-0"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Qualità</span>
                      <span className="text-sm font-semibold tabular-nums">{tempReadiness.sleepQuality}/10</span>
                    </div>
                    <Slider
                      value={[tempReadiness.sleepQuality]}
                      onValueChange={([v]) => setTempReadiness((p) => ({ ...p, sleepQuality: v }))}
                      min={1} max={10} step={1}
                    />
                  </div>
                </div>
              </div>

              {/* WEIGHT */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Scale className="h-4 w-4 text-primary" />
                  PESO CORPOREO
                </Label>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number" value={tempReadiness.bodyWeight ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTempReadiness((p) => ({ ...p, bodyWeight: v === "" ? null : parseFloat(v) }));
                      }}
                      step={0.1} min={30} max={300} placeholder="—"
                      className="w-24 h-12 text-center text-xl font-bold bg-card border-0"
                    />
                    <span className="text-sm text-foreground/60">kg</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground max-w-[140px]">A digiuno per dato accurato</p>
                </div>
              </div>

              {/* SUBJECTIVE */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <Activity className="h-4 w-4 text-primary" />
                  COME TI SENTI?
                </Label>
                <ParamSliderCard label="Energia" value={tempReadiness.energy}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, energy: v }))}
                  lowLabel="Low" highLabel="High" icon={Zap} />
                <ParamSliderCard label="Stress" value={tempReadiness.stress}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, stress: v }))}
                  lowLabel="Low" highLabel="High" inverted icon={Brain} />
                <ParamSliderCard label="Umore" value={tempReadiness.mood}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, mood: v }))}
                  lowLabel="Low" highLabel="High" icon={Smile} />
                <ParamSliderCard label="Digestione" value={tempReadiness.digestion}
                  onChange={(v) => setTempReadiness((p) => ({ ...p, digestion: v }))}
                  lowLabel="Poor" highLabel="Great" icon={HeartPulse} />
              </div>

              {/* SORENESS */}
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
                      level={(tempReadiness.sorenessMap?.[part] ?? 0) as SorenessLevel}
                      onClick={() => handleSorenessToggle(part)}
                    />
                  ))}
                </div>
              </div>

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
                <Button variant="ghost" className="w-full text-primary hover:bg-primary/10">
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
