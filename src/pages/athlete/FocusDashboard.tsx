import { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { motion, AnimatePresence } from"framer-motion";
import { format } from"date-fns";
import { it } from"date-fns/locale";
import {
  Activity,
  Apple,
  Brain,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Dumbbell,
  Flame,
  Heart,
  HeartPulse,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Smile,
  Sparkles,
  Utensils,
  Zap,
  AlertCircle,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { useAthleteApp } from"@/hooks/useAthleteApp";
import { useReadiness, initialReadiness, ReadinessData } from"@/hooks/useReadiness";
import { useMaterialYou, m3 } from"@/providers/MaterialYouProvider";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Slider } from"@/components/ui/slider";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from"@/components/ui/drawer";
import { ResponsivePhoneWrapper } from"@/components/athlete/PhoneMockup";
import { AthleteBottomNav } from"@/components/athlete/AthleteBottomNav";

// ============================================
// FOCUS DASHBOARD - MATERIAL YOU DESIGN
// ============================================

// Body parts for DOMS map
const bodyParts = [
  "Petto","Tricipiti","Bicipiti","Spalle","Trapezi","Dorsali",
  "Bassa Schiena","Glutei","Femorali","Quadricipiti","Polpacci"] as const;

type BodyPart = typeof bodyParts[number];
type SorenessLevel = 0 | 1 | 2 | 3;

const sorenessConfig: Record<SorenessLevel, { bg: string; text: string; label: string }> = {
  0: { bg:"bg-emerald-100 dark:bg-emerald-900/40", text:"text-emerald-700 dark:text-emerald-300", label:"Nessuno"},
  1: { bg:"bg-yellow-100 dark:bg-yellow-900/40", text:"text-yellow-700 dark:text-yellow-300", label:"Leggero"},
  2: { bg:"bg-orange-100 dark:bg-orange-900/40", text:"text-orange-700 dark:text-orange-300", label:"Moderato"},
  3: { bg:"bg-rose-100 dark:bg-rose-900/40", text:"text-rose-700 dark:text-rose-300", label:"Acuto"},
};

// Readiness Dial Component
const ReadinessDial = ({
  score,
  isCompleted,
  level,
}: {
  score: number;
  isCompleted: boolean;
  level:"high"|"moderate"|"low";
}) => {
  const radius = 70;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradientColors = () => {
    if (!isCompleted) return ["hsl(var(--muted))","hsl(var(--muted))"];
    if (level ==="high") return ["#10b981","#34d399"];
    if (level ==="moderate") return ["#f59e0b","#fbbf24"];
    return ["#ef4444","#f87171"];
  };

  const [startColor, endColor] = getGradientColors();
  const gradientId =`readiness-gradient-${level}`;

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%"y1="0%"x2="100%"y2="0%">
            <stop offset="0%"stopColor={startColor} />
            <stop offset="100%"stopColor={endColor} />
          </linearGradient>
        </defs>
        <circle
          stroke="hsl(var(--m3-surface-container-high, var(--secondary)))"          fill="transparent"          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={`url(#${gradientId})`}
          fill="transparent"          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: isCompleted ? strokeDashoffset : circumference }}
          transition={{ duration: 1.2, ease:"easeOut"}}
          strokeLinecap="round"          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isCompleted ? (
          <>
            <motion.span
              className="text-4xl font-bold tabular-nums"              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{ color: startColor }}
            >
              {score}
            </motion.span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              Prontezza
            </span>
          </>
        ) : (
          <>
            <Zap className="h-8 w-8 text-muted-foreground/50"/>
            <span className="text-xs text-muted-foreground mt-1">Check-in</span>
          </>
        )}
      </div>
    </div>
  );
};

// Metric Pill Component
const MetricPill = ({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color?:"primary"|"secondary"|"tertiary";
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[hsl(var(--m3-surface-container,var(--secondary)))] border border-[hsl(var(--m3-outline-variant,var(--border))/0.5)]">
      <Icon className="h-4 w-4 text-[hsl(var(--m3-primary,var(--primary)))]"/>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
      </span>
    </div>
  );
};

// Quick Action Card
const QuickActionCard = ({
  icon: Icon,
  title,
  subtitle,
  onClick,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-2xl text-left transition-all",
        "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]",
        accent
          ?"bg-[hsl(var(--m3-primary-container,var(--primary)/0.15))]"          :"bg-[hsl(var(--m3-surface-container,var(--secondary)))]"      )}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center mb-3",
          accent
            ?"bg-[hsl(var(--m3-primary,var(--primary)))]"            :"bg-[hsl(var(--m3-secondary-container,var(--muted)))]"        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            accent
              ?"text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]"              :"text-[hsl(var(--m3-on-secondary-container,var(--foreground)))]"          )}
        />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </motion.button>
  );
};

// Sync Status Indicator
const SyncIndicator = ({ status }: { status:"synced"|"syncing"|"offline"}) => {
  return (
    <div className="flex items-center gap-1.5">
      {status ==="syncing"? (
        <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin"/>
      ) : status ==="offline"? (
        <CloudOff className="h-3.5 w-3.5 text-muted-foreground"/>
      ) : (
        <Cloud className="h-3.5 w-3.5 text-success"/>
      )}
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {status ==="syncing"?"Sincronizzazione": status ==="offline"?"Offline":"Sincronizzato"}
      </span>
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
  icon: Icon
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
      if (value <= 3) return"bg-success";
      if (value <= 6) return"bg-warning";
      return"bg-destructive";
    }
    if (value >= 7) return"bg-success";
    if (value >= 4) return"bg-warning";
    return"bg-destructive";
  };

  return (
    <div className="p-3 rounded-xl bg-secondary/50 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-primary"/>
          {label}
        </Label>
        <span className={cn(
          "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md",
          getSliderColor(),
          "text-white"        )}>
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
        className="w-full"      />
      <div className="flex justify-between text-[10px] text-foreground/60">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
};

// Body Part Chip
const BodyPartChip = ({
  part,
  level,
  onClick
}: {
  part: BodyPart;
  level: SorenessLevel;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
      sorenessConfig[level].bg,
      sorenessConfig[level].text
    )}
  >
    {part}
  </button>
);

// Small readiness ring for drawer preview
const ReadinessRing = ({ score }: { score: number }) => {
  const radius = 40;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const getScoreColor = () => {
    if (score >= 75) return"hsl(160 84% 39%)";
    if (score >= 50) return"hsl(38 92% 50%)";
    return"hsl(0 84% 60%)";
  };
  return (
    <div className="relative h-20 w-20">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle stroke="hsl(var(--secondary))"fill="transparent"strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
        <circle stroke={getScoreColor()} fill="transparent"strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset, transition:"stroke-dashoffset 0.5s ease-out"}} strokeLinecap="round"r={normalizedRadius} cx={radius} cy={radius} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap className={cn("h-6 w-6", score >= 75 ?"text-success": score >= 50 ?"text-warning":"text-destructive")} />
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function FocusDashboard() {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    athleteName,
    dailyState,
    todayWorkout,
    nutrition,
    habits,
    streak,
    coach,
    isLoading,
    isSyncing,
    syncStatus,
  } = useAthleteApp();

  // Readiness hook for drawer
  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isSaving,
    calculateReadiness,
    saveReadiness,
    baseline,
  } = useReadiness();

  // Sync tempReadiness when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTempReadiness(readiness.isCompleted ? { ...readiness } : { ...initialReadiness });
    }
  }, [drawerOpen, readiness, setTempReadiness]);

  const handleSubmitReadiness = async () => {
    await saveReadiness(tempReadiness);
    setDrawerOpen(false);
  };

  const handleSorenessToggle = (part: BodyPart) => {
    setTempReadiness(prev => {
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

  const handleSleepHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw ==="") {
      setTempReadiness(prev => ({ ...prev, sleepHours: 0 }));
      return;
    }
    const value = parseFloat(raw);
    if (!isNaN(value) && value >= 0 && value <= 24) {
      setTempReadiness(prev => ({ ...prev, sleepHours: value }));
    }
  };

  const tempReadinessResult = calculateReadiness(tempReadiness);

  const getScoreColor = (score: number) => {
    if (score >= 75) return"text-success";
    if (score >= 50) return"text-warning";
    return"text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return"Ottimo";
    if (score >= 50) return"Moderato";
    return"Basso";
  };

  const greeting = getTimeBasedGreeting();
  const firstName = athleteName?.split("")[0] ||"Atleta";

  return (
    <ResponsivePhoneWrapper>
      <div className="h-[100dvh] lg:h-full flex flex-col bg-[hsl(var(--m3-background,var(--background)))] text-foreground relative overflow-hidden">
        {/* Status bar safe area */}
        <div className="safe-top flex-shrink-0"/>

        {/* ===== TOP BAR ===== */}
        <header className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {coach.logoUrl ? (
                <motion.div
                  className="relative"                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="absolute inset-0 rounded-xl blur-lg opacity-30"                    style={{ backgroundColor: coach.brandColor ||"hsl(var(--primary))"}}
                  />
                  <img
                    src={coach.logoUrl}
                    alt="Coach"                    className="relative h-10 w-10 rounded-xl object-contain bg-background/80 backdrop-blur-sm border border-[hsl(var(--m3-outline-variant,var(--border))/0.5)]"                  />
                </motion.div>
              ) : coach.brandColor ? (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"                  style={{ backgroundColor: coach.brandColor }}
                >
                  {coach.coachName?.charAt(0) ||"C"}
                </div>
              ) : null}

              <div>
                <p className="text-xs text-muted-foreground">{greeting}</p>
                <h1 className="text-lg font-semibold">{firstName} </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {streak.current > 0 && (
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/25"                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Flame
                    className={cn(
                      "h-4 w-4",
                      streak.current >= 7 ?"text-orange-500":"text-amber-500"                    )}
                  />
                  <span className="text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">
                    {streak.current}
                  </span>
                </motion.div>
              )}
              <SyncIndicator status={isSyncing ?"syncing":"synced"} />
            </div>
          </div>
        </header>

        {/* ===== MAIN SCROLLABLE CONTENT ===== */}
        <main className="flex-1 overflow-y-auto px-5 pb-32">
          <div className="space-y-6 py-4">
            {/* ===== UNIVERSAL READINESS CARD ===== */}
            <motion.div
              className="relative overflow-hidden rounded-3xl p-6"              style={{
                background:`linear-gradient(135deg, 
                  hsl(var(--m3-surface-container-high, var(--card))) 0%, 
                  hsl(var(--m3-surface-container, var(--secondary))) 100%)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"/>

              <div className="relative flex items-center gap-6">
                <ReadinessDial
                  score={dailyState.readinessScore}
                  isCompleted={dailyState.isCheckedIn}
                  level={dailyState.readinessLevel}
                />

                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-lg font-semibold">{dailyState.readinessLabel}</h2>
                    <p className="text-sm text-muted-foreground">{dailyState.readinessReason}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dailyState.sleepHours > 0 && (
                      <MetricPill icon={Moon} label="Sonno"value={dailyState.sleepHours} unit="h"/>
                    )}
                    {dailyState.hrvRmssd && (
                      <MetricPill icon={Heart} label="HRV"value={Math.round(dailyState.hrvRmssd)} unit="ms"/>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-in prompt - opens drawer directly */}
              {!dailyState.isCheckedIn && (
                <motion.div
                  className="mt-4 pt-4 border-t border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]"                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    className="w-full rounded-xl h-12 font-medium"                    onClick={() => setDrawerOpen(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4"/>
                    Completa il Check-in
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* ===== TODAY'S WORKOUT CARD ===== */}
            {todayWorkout && (
              <motion.div
                className="rounded-2xl p-4 border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]"                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[hsl(var(--m3-primary,var(--primary)))] flex items-center justify-center">
                      <Dumbbell className="h-6 w-6 text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]"/>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Workout di oggi
                      </p>
                      <p className="font-semibold">{todayWorkout.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary"className="text-[10px]">
                          {todayWorkout.exerciseCount} esercizi
                        </Badge>
                        {todayWorkout.estimatedDuration && (
                          <span className="text-xs text-muted-foreground">
                            ~{todayWorkout.estimatedDuration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"                    className="h-12 w-12 rounded-xl"                    onClick={() => navigate(`/athlete/workout/${todayWorkout.id}`)}
                    disabled={!dailyState.isCheckedIn}
                  >
                    <Play className="h-5 w-5"/>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ===== QUICK ACTIONS ===== */}
            <div className="flex gap-3">
              <QuickActionCard
                icon={Utensils}
                title="Log Pasto"                subtitle={`${nutrition.percentages.calories}% kcal`}
                onClick={() => navigate("/athlete/nutrition")}
              />
              <QuickActionCard
                icon={Activity}
                title="Le mie Abitudini"                subtitle={`${habits.completed}/${habits.total} oggi`}
                onClick={() => navigate("/athlete/habits")}
                accent
              />
            </div>

            {/* ===== TRAINING DAY INDICATOR ===== */}
            <div className="flex justify-center">
              <Badge
                variant="secondary"                className={cn(
                  "text-xs backdrop-blur-sm",
                  nutrition.isTrainingDay
                    ?"bg-primary/10 text-primary border-primary/20"                    :"bg-emerald-500/10 text-emerald-600 border-emerald-500/20"                )}
              >
                {nutrition.isTrainingDay ?"Giorno di Allenamento":"Giorno di Recupero"}
              </Badge>
            </div>
          </div>
        </main>

        {/* ===== FLOATING ACTION BUTTON ===== */}
        <AnimatePresence>
          <div className="absolute bottom-24 right-5 z-50">
            <AnimatePresence>
              {fabOpen && (
                <>
                  <motion.button
                    className="absolute bottom-16 right-0 h-12 w-12 rounded-full bg-[hsl(var(--m3-tertiary-container,var(--secondary)))] shadow-lg flex items-center justify-center"                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => {
                      setFabOpen(false);
                      navigate("/athlete/nutrition");
                    }}
                  >
                    <Apple className="h-5 w-5 text-[hsl(var(--m3-on-tertiary-container,var(--foreground)))]"/>
                  </motion.button>
                  <motion.button
                    className="absolute bottom-32 right-0 h-12 w-12 rounded-full bg-[hsl(var(--m3-secondary-container,var(--secondary)))] shadow-lg flex items-center justify-center"                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={() => {
                      setFabOpen(false);
                      navigate("/athlete/workout");
                    }}
                  >
                    <Dumbbell className="h-5 w-5 text-[hsl(var(--m3-on-secondary-container,var(--foreground)))]"/>
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Main FAB */}
            <motion.button
              className="h-14 w-14 rounded-full bg-[hsl(var(--m3-primary,var(--primary)))] shadow-lg flex items-center justify-center"              whileTap={{ scale: 0.95 }}
              animate={{ rotate: fabOpen ? 45 : 0 }}
              onClick={() => setFabOpen(!fabOpen)}
            >
              <Plus className="h-6 w-6 text-[hsl(var(--m3-on-primary,var(--primary-foreground)))]"/>
            </motion.button>
          </div>
        </AnimatePresence>

        {/* ===== BOTTOM NAVIGATION ===== */}
        <AthleteBottomNav />

        {/* ===== READINESS CHECK-IN DRAWER ===== */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="max-h-[90vh] bg-background">
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
                    <HeartPulse className="h-4 w-4 text-primary"/>
                    METRICHE WEARABLE
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">HRV (RMSSD)</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"                          value={tempReadiness.hrvRmssd ??""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempReadiness(prev => ({ ...prev, hrvRmssd: value ===""? null : parseInt(value) }));
                          }}
                          min={10}
                          max={200}
                          placeholder="—"                          className="w-full h-12 text-center text-xl font-bold bg-card text-foreground border-0"                        />
                        <span className="text-sm font-medium text-foreground/60">ms</span>
                      </div>
                      {baseline.hrvBaseline && (
                        <p className="text-[10px] text-muted-foreground">
                          Baseline: {Math.round(baseline.hrvBaseline)}ms
                        </p>
                      )}
                    </div>
                    
                    <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">FC a Riposo</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"                          value={tempReadiness.restingHr ??""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempReadiness(prev => ({ ...prev, restingHr: value ===""? null : parseInt(value) }));
                          }}
                          min={30}
                          max={120}
                          placeholder="—"                          className="w-full h-12 text-center text-xl font-bold bg-card text-foreground border-0"                        />
                        <span className="text-sm font-medium text-foreground/60">bpm</span>
                      </div>
                      {baseline.restingHrBaseline && (
                        <p className="text-[10px] text-muted-foreground">
                          Baseline: {Math.round(baseline.restingHrBaseline)}bpm
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                     Inserisci i dati dal tuo wearable o lascia vuoto se non disponibile
                  </p>
                </div>
                
                {/* SECTION: SLEEP */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    <Moon className="h-4 w-4 text-primary"/>
                    SONNO
                  </Label>
                  <div className="flex flex-row items-center justify-between gap-4 p-3 rounded-xl bg-secondary/50">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Ore</span>
                      <Input
                        type="number"                        value={tempReadiness.sleepHours}
                        onChange={handleSleepHoursChange}
                        step={0.5}
                        min={0}
                        max={24}
                        className="w-16 h-12 text-center text-xl font-bold bg-card text-foreground border-0"                      />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Qualità</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{tempReadiness.sleepQuality}/10</span>
                      </div>
                      <Slider
                        value={[tempReadiness.sleepQuality]}
                        onValueChange={([value]) => setTempReadiness(prev => ({ ...prev, sleepQuality: value }))}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"                      />
                      <div className="flex justify-between text-[10px] text-foreground/60">
                        <span>Scarso</span>
                        <span>Ottimo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: BODY WEIGHT */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    <Scale className="h-4 w-4 text-primary"/>
                    PESO CORPOREO
                  </Label>
                  <div className="flex flex-row items-center gap-4 p-3 rounded-xl bg-secondary/50">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] text-foreground/60 uppercase tracking-wide">Peso odierno</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"                          value={tempReadiness.bodyWeight ??""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempReadiness(prev => ({ ...prev, bodyWeight: value ===""? null : parseFloat(value) }));
                          }}
                          step={0.1}
                          min={30}
                          max={300}
                          placeholder="—"                          className="w-24 h-12 text-center text-xl font-bold bg-card text-foreground border-0"                        />
                        <span className="text-sm font-medium text-foreground/60">kg</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center max-w-[140px]">
                      <p>Pesati la mattina, a digiuno, per un dato più accurato</p>
                    </div>
                  </div>
                </div>
                
                {/* SECTION: SUBJECTIVE READINESS */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    <Activity className="h-4 w-4 text-primary"/>
                    COME TI SENTI?
                  </Label>
                  
                  <ParamSliderCard label="Energia"value={tempReadiness.energy} onChange={(v) => setTempReadiness(prev => ({ ...prev, energy: v }))} lowLabel="Bassa"highLabel="Alta"icon={Zap} />
                  <ParamSliderCard label="Stress"value={tempReadiness.stress} onChange={(v) => setTempReadiness(prev => ({ ...prev, stress: v }))} lowLabel="Basso"highLabel="Alto"inverted icon={Brain} />
                  <ParamSliderCard label="Umore"value={tempReadiness.mood} onChange={(v) => setTempReadiness(prev => ({ ...prev, mood: v }))} lowLabel="Basso"highLabel="Alto"icon={Smile} />
                  <ParamSliderCard label="Digestione"value={tempReadiness.digestion} onChange={(v) => setTempReadiness(prev => ({ ...prev, digestion: v }))} lowLabel="Scarsa"highLabel="Ottima"icon={HeartPulse} />
                </div>

                {/* SECTION: DOMS & BODY MAP */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    <HeartPulse className="h-4 w-4 text-primary"/>
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
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {([0, 1, 2, 3] as SorenessLevel[]).map((level) => (
                      <div key={level} className="flex items-center gap-1.5">
                        <div className={cn("h-3 w-3 rounded-full", sorenessConfig[level].bg)} />
                        <span className="text-[10px] text-foreground/60">{sorenessConfig[level].label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Baseline status note */}
                {tempReadinessResult.isNewUser && (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500"/>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Baseline in costruzione ({baseline.dataPoints}/3 giorni)
                    </p>
                  </div>
                )}
              </div>

              <DrawerFooter className="pt-2">
                <Button 
                  onClick={handleSubmitReadiness}
                  className="w-full h-12 font-semibold"                  disabled={isSaving}
                >
                  <Check className="h-4 w-4 mr-2"/>
                  {isSaving ?"Salvataggio...":"Conferma Check-in"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost"className="w-full text-primary hover:text-primary/80 hover:bg-primary/10">
                    Annulla
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </ResponsivePhoneWrapper>
  );
}

// Helper function for time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return"Buongiorno";
  if (hour < 18) return"Buon pomeriggio";
  return"Buonasera";
}
