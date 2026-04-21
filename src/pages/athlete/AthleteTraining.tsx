import { useState, useMemo, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import { useQuery } from"@tanstack/react-query";
import { supabase } from"@/integrations/supabase/client";
import { AthleteLayout } from"@/components/athlete/AthleteLayout";
import { Card } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Skeleton } from"@/components/ui/skeleton";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Slider } from"@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from"@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from"@/components/ui/drawer";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday, 
  isPast, 
  addWeeks
} from"date-fns";
import { it } from"date-fns/locale";
import { 
  Activity,
  Brain,
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play, 
  Clock, 
  Dumbbell,
  Calendar,
  Heart,
  HeartPulse,
  Lock,
  Flame,
  Moon,
  Plus,
  Scale,
  Smile,
  Zap,
  Coffee,
  BatteryCharging,
  AlertTriangle,
  AlertCircle
} from"lucide-react";
import { cn } from"@/lib/utils";
import { useReadiness, initialReadiness, type ReadinessData } from"@/hooks/useReadiness";
import { SessionBuilderDialog } from"@/components/athlete/SessionBuilderDialog";
import { FreeWorkoutSelector, type SelectedExercise } from"@/components/athlete/workout/FreeWorkoutSelector";
import { useActiveSessionStore } from"@/stores/useActiveSessionStore";
import { toast } from"sonner";

// Body parts for DOMS map (shared with FocusDashboard)
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

interface WorkoutLog {
  id: string;
  scheduled_date: string;
  status: string;
  completed_at: string | null;
  duration_minutes: number | null;
  workouts?: {
    id: string;
    title: string;
    structure: any[];
  } | null;
}

export default function AthleteTraining() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'free-workout'| null>(null);
  const [forceDialogOpen, setForceDialogOpen] = useState(false);
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  
  const {
    readiness,
    tempReadiness,
    setTempReadiness,
    isSaving,
    calculateReadiness,
    saveReadiness,
    baseline,
  } = useReadiness();
  const canTrain = readiness.isCompleted;

  // Sync tempReadiness when drawer opens
  useEffect(() => {
    if (isCheckinOpen) {
      setTempReadiness(readiness.isCompleted ? { ...readiness } : { ...initialReadiness });
    }
  }, [isCheckinOpen, readiness, setTempReadiness]);

  // Seamless"Daisy-Chain"flow: auto-open exercise selector after check-in completes
  useEffect(() => {
    if (readiness.isCompleted && pendingAction ==='free-workout') {
      setPendingAction(null);
      setIsCheckinOpen(false);
      setTimeout(() => setIsExerciseSelectorOpen(true), 200);
    }
  }, [readiness.isCompleted, pendingAction]);

  const handleSubmitReadiness = async () => {
    await saveReadiness(tempReadiness);
    // The useEffect watching readiness.isCompleted + pendingAction
    // will auto-close check-in and open exercise selector if pending
    if (pendingAction !=='free-workout') {
      setIsCheckinOpen(false);
    }
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

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get coach info (brand color + coach_id)
  const { data: athleteProfile } = useQuery({
    queryKey: ["athlete-profile-with-coach", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", user.id)
        .single();
      return profile;
    },
    enabled: !!user,
  });

  const { data: brandColor } = useQuery({
    queryKey: ["athlete-brand-color", athleteProfile?.coach_id],
    queryFn: async () => {
      if (!athleteProfile?.coach_id) return null;
      const { data: coach } = await supabase
        .from("profiles")
        .select("brand_color")
        .eq("id", athleteProfile.coach_id)
        .single();
      return coach?.brand_color || null;
    },
    enabled: !!athleteProfile?.coach_id,
  });

  // Calculate week dates based on offset
  const weekDates = useMemo(() => {
    const baseDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekOffset]);

  // Fetch workout logs for the visible week
  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ["athlete-week-workouts", user?.id, weekDates[0]?.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      
      const weekStart = format(weekDates[0],"yyyy-MM-dd");
      const weekEnd = format(weekDates[6],"yyyy-MM-dd");

      const { data, error } = await supabase
        .from("workout_logs")
        .select(`          id,
          scheduled_date,
          status,
          completed_at,
          duration_minutes,
          workouts (
            id,
            title,
            structure
          )
        `)
        .eq("athlete_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return (data || []) as WorkoutLog[];
    },
    enabled: !!user,
  });

  // Group workouts by date
  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    workoutLogs.forEach((log) => {
      const dateKey = log.scheduled_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(log);
    });
    return map;
  }, [workoutLogs]);

  // Get workouts for selected date
  const selectedDateKey = format(selectedDate,"yyyy-MM-dd");
  const selectedWorkouts = workoutsByDate.get(selectedDateKey) || [];

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handleToday = () => {
    setWeekOffset(0);
    setSelectedDate(new Date());
  };

  // Handle Hero button click - check readiness first, then open exercise selector
  const handleFreeSessionClick = () => {
    if (!canTrain) {
      setPendingAction('free-workout');
      setIsCheckinOpen(true);
      return;
    }
    setIsExerciseSelectorOpen(true);
  };

  // Callback from FreeWorkoutSelector: format exercises and start session
  const handleExercisesConfirmed = (exercises: SelectedExercise[]) => {
    setIsExerciseSelectorOpen(false);

    const structure = exercises.map((ex, index) => ({
      id:`ex-${index}`,
      exercise_id: ex.id,
      exercise_name: ex.name,
      name: ex.name,
      sets: 3,
      reps:"10",
      load:"",
      rpe:"",
      notes:"",
      restSeconds: 90,
    }));

    // Create workout + log in DB, then navigate
    const createAndNavigate = async () => {
      try {
        const now = new Date();
        const { format: fmtDate } = await import("date-fns");

        const { data: workout, error: workoutError } = await supabase
          .from("workouts")
          .insert({
            athlete_id: user!.id,
            coach_id: athleteProfile?.coach_id || null,
            title:`Sessione Libera`,
            description:"Allenamento libero",
            scheduled_date: fmtDate(now,"yyyy-MM-dd"),
            status:"pending"as const,
            structure,
          })
          .select("id")
          .single();

        if (workoutError) throw workoutError;

        const { error: logError } = await supabase
          .from("workout_logs")
          .insert({
            workout_id: workout.id,
            athlete_id: user!.id,
            started_at: now.toISOString(),
            scheduled_date: fmtDate(now,"yyyy-MM-dd"),
            status:"scheduled"as const,
            exercises_data: structure,
            sync_status:"synced",
          });

        if (logError) throw logError;

        useActiveSessionStore.getState().startSession(workout.id, workout.id);
        navigate(`/athlete/workout/${workout.id}`);
      } catch (err) {
        console.error("Free session creation error:", err);
        toast.error("Impossibile creare la sessione. Riprova.");
      }
    };

    createAndNavigate();
  };

  const getWorkoutStatus = (log: WorkoutLog) => {
    if (log.status ==="completed"|| log.completed_at) return"completed";
    if (log.status ==="missed") return"missed";
    
    const logDate = new Date(log.scheduled_date);
    if (isToday(logDate)) return"today";
    if (isPast(logDate)) return"missed";
    return"scheduled";
  };

  return (
    <AthleteLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Allenamenti</h1>
            <Button
              variant="ghost"              size="sm"              onClick={handleToday}
              className="text-xs"              style={{ color: brandColor || undefined }}
            >
              Oggi
            </Button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost"size="icon"onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5"/>
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {format(weekDates[0],"d MMM", { locale: it })} - {format(weekDates[6],"d MMM yyyy", { locale: it })}
            </span>
            <Button variant="ghost"size="icon"onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5"/>
            </Button>
          </div>
        </div>

        {/* Week Strip */}
        <div className="px-4 pb-4">
          <div className="flex gap-1">
            {weekDates.map((date) => {
              const dateKey = format(date,"yyyy-MM-dd");
              const hasWorkout = workoutsByDate.has(dateKey);
              const workouts = workoutsByDate.get(dateKey) || [];
              const isSelected = isSameDay(date, selectedDate);
              const isCurrentDay = isToday(date);
              
              // Determine dot color based on workout status
              let dotColor ="bg-primary";
              if (hasWorkout) {
                const statuses = workouts.map(getWorkoutStatus);
                if (statuses.every((s) => s ==="completed")) {
                  dotColor ="bg-green-500";
                } else if (statuses.some((s) => s ==="missed")) {
                  dotColor ="bg-red-500";
                } else if (statuses.some((s) => s ==="today")) {
                  dotColor ="bg-amber-500";
                }
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-200",
                    isSelected 
                      ?"bg-primary text-primary-foreground shadow-md"                      : isCurrentDay 
                        ?"bg-primary/10"                        :"hover:bg-muted/50"                  )}
                  style={isSelected && brandColor ? { backgroundColor: brandColor } : undefined}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-medium mb-1",
                    isSelected ?"text-primary-foreground/80":"text-muted-foreground"                  )}>
                    {format(date,"EEE", { locale: it })}
                  </span>
                  <span className={cn(
                    "text-lg font-semibold",
                    isSelected ?"text-primary-foreground":""                  )}>
                    {format(date,"d")}
                  </span>
                  {/* Workout indicator dot */}
                  <div className="h-1.5 mt-1">
                    {hasWorkout && (
                      <div 
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ?"bg-primary-foreground": dotColor
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Action Buttons */}
        <div className="px-4 mb-6 space-y-2">
          {/* Primary: Sessione Libera (requires check-in) */}
          <Button
            variant="default"            className={cn(
              "w-full h-14 text-lg font-semibold shadow-md active:scale-[0.98] transition-transform",
              !canTrain &&"opacity-90"            )}
            style={brandColor ? { 
              backgroundColor: brandColor,
              boxShadow:`0 8px 24px -4px ${brandColor}40`            } : undefined}
            onClick={handleFreeSessionClick}
          >
            {canTrain ? (
              <>
                <Dumbbell className="h-5 w-5 mr-2"/>
                Inizia Sessione Libera
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mr-2"/>
                Check-in richiesto
              </>
            )}
          </Button>

          {/* Secondary: Force Start (always visible, with safety dialog) */}
          <AlertDialog open={forceDialogOpen} onOpenChange={setForceDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"                className="w-full h-11 gap-2 text-sm font-medium"              >
                <AlertTriangle className="h-4 w-4"/>
                Inizia allenamento libero
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Allenamento fuori programma?</AlertDialogTitle>
                <AlertDialogDescription>
                  Allenarsi al di fuori del programma assegnato potrebbe rallentare il recupero ed esporre ad infortuni. Sei sicuro di voler procedere?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"                  onClick={() => {
                    setForceDialogOpen(false);
                    if (!canTrain) {
                      setPendingAction('free-workout');
                      setIsCheckinOpen(true);
                      toast.warning("Devi completare il check-in prima di poterti allenare.");
                      return;
                    }
                    setIsExerciseSelectorOpen(true);
                  }}
                >
                  Inizia comunque
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Selected Day Content */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 pb-24">
            {/* Date Header */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground"/>
              <span className="text-sm font-medium">
                {format(selectedDate,"EEEE d MMMM", { locale: it })}
              </span>
              {isToday(selectedDate) && (
                <Badge variant="secondary"className="text-xs">Oggi</Badge>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-2xl"/>
                <Skeleton className="h-24 w-full rounded-2xl"/>
              </div>
            ) : selectedWorkouts.length === 0 ? (
              <RestDayIllustration />
            ) : (
              <>
                {selectedWorkouts.map((log) => {
                  const status = getWorkoutStatus(log);
                  
                  return (
                    <WorkoutCard
                      key={log.id}
                      log={log}
                      status={status}
                      brandColor={brandColor}
                      canTrain={canTrain}
                      onStart={() => navigate(`/athlete/workout/${log.workouts?.id || log.id}`)}
                      onViewDetails={() => navigate(`/athlete/workout/${log.workouts?.id || log.id}`)}
                    />
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Inline Readiness Check-in Drawer */}
        <Drawer open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
          <DrawerContent className="max-h-[90vh] bg-background">
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
                
                {/* SLEEP */}
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

                {/* BODY WEIGHT */}
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
                
                {/* SUBJECTIVE READINESS */}
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

                {/* DOMS MAP */}
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
                      <button
                        key={part}
                        onClick={() => handleSorenessToggle(part)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95",
                          sorenessConfig[(tempReadiness.sorenessMap?.[part] ?? 0) as SorenessLevel].bg,
                          sorenessConfig[(tempReadiness.sorenessMap?.[part] ?? 0) as SorenessLevel].text
                        )}
                      >
                        {part}
                      </button>
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

        {/* Session Builder Dialog */}
        <SessionBuilderDialog
          open={showSessionBuilder}
          onOpenChange={setShowSessionBuilder}
          coachId={athleteProfile?.coach_id || null}
          athleteId={user?.id ||""}
          brandColor={brandColor}
        />

        {/* Free Workout Exercise Selector */}
        <FreeWorkoutSelector
          open={isExerciseSelectorOpen}
          onOpenChange={setIsExerciseSelectorOpen}
          coachId={athleteProfile?.coach_id || user?.id || null}
          brandColor={brandColor}
          onConfirm={handleExercisesConfirmed}
        />
      </div>
    </AthleteLayout>
  );
}

// Workout Card Component
interface WorkoutCardProps {
  log: WorkoutLog;
  status:"completed"|"today"|"scheduled"|"missed";
  brandColor: string | null;
  canTrain: boolean;
  onStart: () => void;
  onViewDetails: () => void;
}

function WorkoutCard({ log, status, brandColor, canTrain, onStart, onViewDetails }: WorkoutCardProps) {
  const workoutName = log.workouts?.title ||"Allenamento";
  const structure = log.workouts?.structure || [];
  const exerciseCount = structure.length;

  // Completed workout card
  if (status ==="completed") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-success"/>
            </div>
            <div>
              <h3 className="font-semibold">{workoutName}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {log.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3"/>
                    {log.duration_minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline"className="text-success border-success/30">
            Completato
          </Badge>
        </div>
        <Button 
          variant="ghost"          size="sm"          className="w-full mt-3 text-success"          onClick={onViewDetails}
        >
          Vedi dettagli
        </Button>
      </Card>
    );
  }

  // Missed workout card
  if (status ==="missed") {
    return (
      <Card className="p-4 border-destructive/30 bg-destructive/5 opacity-70">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-destructive"/>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground">{workoutName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exerciseCount} esercizi
              </p>
            </div>
          </div>
          <Badge variant="outline"className="text-destructive border-destructive/30">
            Saltato
          </Badge>
        </div>
      </Card>
    );
  }

  // Today's workout card
  if (status ==="today") {
    return (
      <Card 
        className="p-4 border-2 relative overflow-hidden"        style={{ borderColor: brandColor ||"hsl(var(--primary))"}}
      >
        {/* Gradient accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"          style={{ background: brandColor ?`linear-gradient(90deg, ${brandColor}, ${brandColor}80)`:"linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))"}}
        />
        
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"              style={{ backgroundColor: brandColor ?`${brandColor}20`:"hsl(var(--primary) / 0.1)"}}
            >
              <Dumbbell 
                className="h-5 w-5"                style={{ color: brandColor ||"hsl(var(--primary))"}}
              />
            </div>
            <div>
              <h3 className="font-semibold">{workoutName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exerciseCount} esercizi programmati
              </p>
            </div>
          </div>
        </div>

        {/* Exercise preview */}
        {exerciseCount > 0 && (
          <div className="mb-4 pl-13">
            <div className="space-y-1">
              {structure.slice(0, 3).map((ex: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/50"/>
                  <span className="truncate">
                    {ex.exercise_name || ex.name} - {ex.sets}×{ex.reps}
                  </span>
                </div>
              ))}
              {exerciseCount > 3 && (
                <p className="text-xs text-muted-foreground opacity-70">
                  +{exerciseCount - 3} altri esercizi
                </p>
              )}
            </div>
          </div>
        )}

        <Button 
          className="w-full gap-2"          style={{ backgroundColor: brandColor || undefined }}
          onClick={onStart}
          disabled={!canTrain}
        >
          {!canTrain ? (
            <>
              <Lock className="h-4 w-4"/>
              Check-in richiesto
            </>
          ) : (
            <>
              <Play className="h-4 w-4"/>
              Inizia allenamento
            </>
          )}
        </Button>
      </Card>
    );
  }

  // Future/scheduled workout card (read-only)
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="h-5 w-5 text-muted-foreground"/>
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">{workoutName}</h3>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {exerciseCount} esercizi programmati
            </p>
          </div>
        </div>
        <Badge variant="outline"className="text-muted-foreground">
          In programma
        </Badge>
      </div>

      {/* Exercise preview */}
      {exerciseCount > 0 && (
        <div className="space-y-1 pl-13">
          {structure.slice(0, 4).map((ex: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30"/>
              <span className="truncate">
                {ex.exercise_name || ex.name} - {ex.sets}×{ex.reps}
              </span>
            </div>
          ))}
          {exerciseCount > 4 && (
            <p className="text-xs text-muted-foreground/50">
              +{exerciseCount - 4} altri
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// Active Recovery Card - Rest Day Experience (No button inside - Hero button is above)
function RestDayIllustration() {
  return (
    <Card className="p-6 bg-gradient-to-br from-success/5 via-background to-primary/5 border border-success/20">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Recovery Emoji */}
        <div className="text-5xl"></div>

        {/* Headline */}
        <h3 className="text-lg font-semibold">
          Giornata di Recupero
        </h3>

        {/* Supportive Text */}
        <p className="text-sm text-muted-foreground max-w-xs">
          Oggi il focus è sul recupero attivo. Stretching, idratazione e sonno.
        </p>

        {/* Wellness tip badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <Badge variant="secondary"className="text-xs">
             Idratazione
          </Badge>
          <Badge variant="secondary"className="text-xs">
             Sonno
          </Badge>
          <Badge variant="secondary"className="text-xs">
             Camminata
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// Psychophysical Slider Card (shared pattern with FocusDashboard)
function ParamSliderCard({ 
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
}) {
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
          "text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md text-white",
          getSliderColor(),
        )}>
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
}
