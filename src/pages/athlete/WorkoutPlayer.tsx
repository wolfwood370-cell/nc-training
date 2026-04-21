import { useState, useEffect, useCallback, useRef, useMemo } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { useMutation, useQuery } from"@tanstack/react-query";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Badge } from"@/components/ui/badge";
import { Slider } from"@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from"@/components/ui/dialog";
import {
  CheckCircle2,
  Timer,
  Trophy,
  Loader2,
  TrendingUp,
  Clock,
  Flame,
  AlertTriangle,
  Activity,
  ChevronRight,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { supabase } from"@/integrations/supabase/client";
import { useToast } from"@/hooks/use-toast";
import { useOfflineSync, type WorkoutLogPayload } from"@/hooks/useOfflineSync";
import { useHapticFeedback, triggerHaptic } from"@/hooks/useHapticFeedback";
import { useWorkoutStreak } from"@/hooks/useWorkoutStreak";
import { usePersonalRecords } from"@/hooks/usePersonalRecords";
import { useExerciseHistory } from"@/hooks/useExerciseHistory";
import { triggerConfetti, triggerPRConfetti } from"@/utils/ux";
import useEmblaCarousel from"embla-carousel-react";
import { useWakeLock } from"@/hooks/useWakeLock";
import { unlockAudio } from"@/lib/audioFeedback";

// Components
import { ActiveSessionShell } from"@/components/athlete/workout/ActiveSessionShell";
import { ExerciseCard, type ExerciseData, type SetData } from"@/components/athlete/workout/ExerciseCard";
import { RestTimerPill } from"@/components/athlete/workout/RestTimerPill";
import { AthleteLayout } from"@/components/athlete/AthleteLayout";
import { useActiveSessionStore } from"@/stores/useActiveSessionStore";

// ============================================================
// CONSTANTS
// ============================================================

const fosterRpeScale = [
  { value: 1, label:"Riposo", description:"Recupero attivo", color:"bg-emerald-500"},
  { value: 2, label:"Molto Facile", description:"Sforzo minimo", color:"bg-emerald-400"},
  { value: 3, label:"Facile", description:"Riscaldamento", color:"bg-green-400"},
  { value: 4, label:"Moderato", description:"Lavoro leggero", color:"bg-lime-400"},
  { value: 5, label:"Abbastanza Duro", description:"Impegnativo", color:"bg-yellow-400"},
  { value: 6, label:"Duro", description:"Faticoso", color:"bg-amber-400"},
  { value: 7, label:"Molto Duro", description:"Molto faticoso", color:"bg-orange-400"},
  { value: 8, label:"Molto Duro+", description:"Al limite", color:"bg-orange-500"},
  { value: 9, label:"Quasi Max", description:"Massimale submx", color:"bg-red-400"},
  { value: 10, label:"Massimale", description:"Sforzo totale", color:"bg-red-500"},
];

const getRpeColor = (rpe: number): string => {
  if (rpe <= 3) return"text-emerald-500";
  if (rpe <= 5) return"text-yellow-500";
  if (rpe <= 7) return"text-orange-500";
  return"text-red-500";
};

// ============================================================
// PARSE WORKOUT
// ============================================================

function parseWorkoutStructure(structure: any[]): ExerciseData[] {
  return structure.map((ex, index) => {
    const setsCount = ex.sets || 3;
    const targetRpe = parseInt(ex.rpe) || 8;
    return {
      id: ex.id ||`ex-${index}`,
      name: ex.name,
      videoUrl: ex.videoUrl,
      coachNotes: ex.notes || ex.coachNotes,
      restSeconds: ex.restSeconds || 90,
      supersetGroup: ex.supersetGroup,
      originalSetsCount: setsCount,
      originalTargetRpe: targetRpe,
      sets: Array.from({ length: setsCount }, (_, i) => ({
        id:`${ex.id || index}-set-${i}`,
        setNumber: i + 1,
        targetKg: parseFloat(ex.load?.replace(/[^0-9.]/g,"") ||"0") || 0,
        targetReps: parseInt(ex.reps) || 8,
        targetRpe: targetRpe,
        actualKg:"",
        actualReps:"",
        rpe:"",
        completed: false,
      })),
    };
  });
}

// Mock data
const mockWorkout = {
  id:"mock-1",
  title:"Upper Body Hypertrophy",
  estimatedDuration: 45,
  structure: [
    { id:"ex1", name:"Bench Press", sets: 4, reps:"8", load:"80kg", rpe:"8", notes:"Controllare la discesa (3 secondi). Focus sulla connessione mente-muscolo.", restSeconds: 120 },
    { id:"ex2", name:"Incline Dumbbell Press", sets: 3, reps:"10", load:"30kg", rpe:"7", notes:"Angolo 30-45 gradi. Stretch in basso.", restSeconds: 90, supersetGroup:"ss1"},
    { id:"ex3", name:"Cable Flyes", sets: 3, reps:"12", load:"15kg", rpe:"7", notes:"Squeeze al centro per 1 secondo.", restSeconds: 60, supersetGroup:"ss1"},
    { id:"ex4", name:"Lat Pulldown", sets: 4, reps:"10", load:"60kg", rpe:"8", notes:"Tira verso il petto. Controlla la fase eccentrica.", restSeconds: 90 },
    { id:"ex5", name:"Seated Cable Row", sets: 3, reps:"10", load:"55kg", rpe:"7", notes:"Petto in fuori, porta i gomiti indietro.", restSeconds: 90 },
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function WorkoutPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logWorkout, isLoggingWorkout, isOnline } = useOfflineSync();
  const haptic = useHapticFeedback();
  const { checkForPR, showPRToast } = usePersonalRecords();
  const sessionStore = useActiveSessionStore();

  // Keep screen awake during workout
  useWakeLock(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Workout state
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align:"center",
    containScroll: false,
    watchDrag: true,
  });

  // Sync carousel selection with activeExerciseIndex
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setActiveExerciseIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Scroll carousel when activeExerciseIndex changes programmatically
  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== activeExerciseIndex) {
      emblaApi.scrollTo(activeExerciseIndex);
    }
  }, [emblaApi, activeExerciseIndex]);

  // Timer
  const [workoutStartTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(true);

  // Rest timer — driven by the session store (timestamp-based, persisted)
  const restEndTime = sessionStore.restEndTime;
  const currentRestDuration = sessionStore.restDuration;

  // Recap
  const [showRecapDialog, setShowRecapDialog] = useState(false);
  const [sessionRpe, setSessionRpe] = useState(5);
  const [workoutNotes, setWorkoutNotes] = useState("");

  // Auto-regulation
  const [showAutoRegDialog, setShowAutoRegDialog] = useState(false);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Readiness gatekeeper
  const [readinessCheckComplete, setReadinessCheckComplete] = useState<boolean | null>(null);

  // Fetch user & readiness
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        const today = new Date().toISOString().split("T")[0];
        const { data: readinessData } = await supabase
          .from("daily_readiness")
          .select("score")
          .eq("athlete_id", data.user.id)
          .eq("date", today)
          .maybeSingle();

        if (!readinessData || readinessData.score == null) {
          setReadinessCheckComplete(false);
        } else {
          setReadinessCheckComplete(true);
          setReadinessScore(readinessData.score);
          if (readinessData.score < 45) {
            setShowAutoRegDialog(true);
          }
        }
      }
    });
  }, []);

  const { currentStreak } = useWorkoutStreak(currentUserId || undefined);

  // Auto-regulation
  const applyAutoRegulation = useCallback(() => {
    unlockAudio();
    setExercises((prev) =>
      prev.map((exercise) => {
        const originalSets = exercise.sets.length;
        const newSetsCount = originalSets <= 2 ? originalSets : originalSets - 1;
        const originalRpe = exercise.originalTargetRpe || 8;
        const newTargetRpe = Math.max(5, originalRpe - 2);
        return {
          ...exercise,
          sets: exercise.sets.slice(0, newSetsCount).map((set) => ({
            ...set,
            targetRpe: newTargetRpe,
          })),
        };
      })
    );
    setIsRecoveryMode(true);
    setShowAutoRegDialog(false);
    toast({ title:"Recovery Mode attivato", description:"Volume e intensità ridotti."});
  }, [toast]);

  const ignoreAutoReg = useCallback(() => {
    unlockAudio();
    setShowAutoRegDialog(false);
    toast({ title:"Procedi con cautela", description:"Ascolta il tuo corpo.", variant:"destructive"});
  }, [toast]);

  // Fetch workout
  const { data: workoutData, isLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      if (!id || id ==="mock"|| id.startsWith("mock-") || id.startsWith("free-session-")) {
        return { id: id ||"free", title:"Allenamento Libero", structure: [], estimatedDuration: 60 };
      }
      const { data, error } = await supabase.from("workouts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize session store & load workout structure
  useEffect(() => {
    if (workoutData?.structure) {
      setExercises(parseWorkoutStructure(workoutData.structure as any[]));
      // Start active session in store for crash recovery
      if (id && !sessionStore.isActive) {
        sessionStore.startSession(id, workoutData.id || id);
      }
    }
  }, [workoutData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Exercise names for history
  const exerciseNames = useMemo(() => exercises.map((ex) => ex.name), [exercises]);
  const { data: exerciseHistory } = useExerciseHistory(exerciseNames, currentUserId || undefined);

  // Elapsed timer
  useEffect(() => {
    if (!isWorkoutActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  // Rest timer is now timestamp-based — no countdown interval needed.
  // RestTimerPill reads endTime directly and auto-skips on completion.

  // Computed
  const getTotalSets = () => exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const getCompletedSets = () => exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);

  // Handlers
  const handleSetUpdate = useCallback(
    (exerciseId: string, setId: string, field: string, value: string | boolean) => {
      setExercises((prev) =>
        prev.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((set) => {
              if (set.id !== setId) return set;
              return { ...set, [field]: value };
            }),
          };
        })
      );
      // Persist every field change to localStorage via store
      const setIndex = parseInt(setId.split("-set-")[1] ??"0");
      sessionStore.updateSetField(exerciseId, setIndex, field as any, value as any);
    },
    [sessionStore]
  );

  const handleSetComplete = useCallback(
    async (exerciseId: string, setId: string, completed: boolean) => {
      // Unlock Web Audio on first user gesture (iOS autoplay policy)
      unlockAudio();
      handleSetUpdate(exerciseId, setId,"completed", completed);

      if (completed) {
        triggerHaptic("medium");
        const exercise = exercises.find((ex) => ex.id === exerciseId);
        const restTime = exercise?.restSeconds || 90;
        const set = exercise?.sets.find((s) => s.id === setId);

        // Check PR
        if (set && currentUserId && exercise) {
          const weight = parseFloat(set.actualKg) || set.targetKg;
          const reps = parseInt(set.actualReps) || set.targetReps;
          if (weight > 0) {
            const prResult = await checkForPR(currentUserId, exercise.name, weight, reps);
            if (prResult.isPR) {
              triggerPRConfetti();
              showPRToast(exercise.name, weight, prResult.improvement);
            }
          }
        }

        // Superset rest logic
        if (exercise?.supersetGroup) {
          const supersetExercises = exercises.filter((ex) => ex.supersetGroup === exercise.supersetGroup);
          const currentIndex = supersetExercises.findIndex((ex) => ex.id === exerciseId);
          const isLast = currentIndex === supersetExercises.length - 1;
          const dur = isLast ? restTime : 30;
          sessionStore.startRestTimer(dur);
        } else {
          sessionStore.startRestTimer(restTime);
        }

        // Auto-advance: check if ALL sets of this exercise are now done
        const updatedExercise = exercises.find((ex) => ex.id === exerciseId);
        if (updatedExercise) {
          const allDone = updatedExercise.sets.every((s) => (s.id === setId ? true : s.completed));
          if (allDone) {
            const currentExIdx = exercises.findIndex((ex) => ex.id === exerciseId);
            const nextIndex = currentExIdx + 1;
            if (nextIndex < exercises.length) {
              triggerHaptic("success");
              toast({
                title:"Esercizio completato!",
                description:`Prossimo: ${exercises[nextIndex].name}`,
                action: (
                  <Button
                    variant="outline"                    size="sm"                    className="h-7 text-xs gap-1"                    onClick={() => setActiveExerciseIndex(nextIndex)}
                  >
                    Vai <ChevronRight className="h-3 w-3"/>
                  </Button>
                ),
              });
              setTimeout(() => setActiveExerciseIndex(nextIndex), 1200);
            }
          }
        }
      }
    },
    [exercises, handleSetUpdate, currentUserId, checkForPR, showPRToast, toast]
  );

  const handleFinishWorkout = () => {
    setIsWorkoutActive(false);
    sessionStore.cancelRestTimer();
    triggerConfetti();
    haptic.success();
    setTimeout(() => setShowRecapDialog(true), 500);
  };



  const handleSaveWorkoutLog = async () => {
    const durationMinutes = Math.round(elapsedSeconds / 60);
    const sessionLoad = durationMinutes * sessionRpe;
    const finalNotes = isRecoveryMode
      ?`${workoutNotes}${workoutNotes ?"\n":""}[Auto-Regulated: Readiness ${readinessScore}%]`      : workoutNotes;

    const workoutLogInput: Omit<WorkoutLogPayload,"type"> = {
      local_id:`workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workout_id: id ||"mock",
      athlete_id:"",
      started_at: workoutStartTime.toISOString(),
      completed_at: new Date().toISOString(),
      srpe: sessionRpe,
      duration_minutes: durationMinutes,
      notes: finalNotes,
      exercises: exercises.map((ex, index) => ({
        exercise_name: ex.name,
        exercise_order: index,
        sets_data: ex.sets.map((set) => ({
          set_number: set.setNumber,
          reps: parseInt(set.actualReps) || set.targetReps,
          weight_kg: parseFloat(set.actualKg) || set.targetKg,
          rpe: parseInt(set.rpe) || undefined,
          completed: set.completed,
        })),
        notes: ex.coachNotes,
      })),
    };

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) workoutLogInput.athlete_id = userData.user.id;

    logWorkout(workoutLogInput, {
      onSuccess: () => {
        sessionStore.endSession();
        toast({ title:"Allenamento salvato!", description:`Carico sessione: ${sessionLoad} UA`});
        // Trigger achievement check in background
        supabase.functions.invoke("check-achievements").catch(console.warn);
        navigate(`/athlete/workout/summary/${id ||"mock"}`);
      },
    });
  };

  // Rest timer controls — delegated to the store
  const skipRest = () => sessionStore.cancelRestTimer();
  const addRestTime = (seconds: number) => sessionStore.addRestTime(seconds);
  const resetRestTimer = () => sessionStore.resetRestTimer();

  // ============================================================
  // LOADING & GATEKEEPER
  // ============================================================

  if (isLoading || readinessCheckComplete === null) {
    return (
      <AthleteLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
      </AthleteLayout>
    );
  }

  if (readinessCheckComplete === false) {
    return (
      <AthleteLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
          <div className="h-20 w-20 rounded-full bg-amber-500/15 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-500"/>
          </div>
          <h2 className="text-xl font-bold mb-2">Check-in Richiesto</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Prima di iniziare l'allenamento, completa il check-in giornaliero.
          </p>
          <Button onClick={() => navigate("/athlete")} className="bg-primary text-primary-foreground">
            <Activity className="h-4 w-4 mr-2"/>
            Vai al Check-in
          </Button>
        </div>
      </AthleteLayout>
    );
  }

  // Recap values
  const durationMinutes = Math.round(elapsedSeconds / 60);
  const sessionLoad = durationMinutes * sessionRpe;
  const rpeInfo = fosterRpeScale.find((r) => r.value === sessionRpe);

  // Superset helpers
  const getSupersetInfo = (exercise: ExerciseData) => {
    if (!exercise.supersetGroup) return undefined;
    const group = exercises.filter((ex) => ex.supersetGroup === exercise.supersetGroup);
    const idx = group.findIndex((ex) => ex.id === exercise.id);
    return { index: idx, total: group.length, isFirst: idx === 0 };
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* Auto-Regulation Dialog */}
      <Dialog open={showAutoRegDialog} onOpenChange={setShowAutoRegDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5"/>
              Low Readiness ({readinessScore}%)
            </DialogTitle>
            <DialogDescription className="pt-2">
              I tuoi indicatori di recupero sono bassi. Si consiglia di ridurre volume e intensità.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-amber-500"/>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Readiness Score</span>
                    <span className="text-lg font-bold text-amber-600">{readinessScore}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-amber-500"style={{ width:`${readinessScore}%`}} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Modifiche proposte:</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Set:</span>
                  <span className="text-amber-600 font-medium">-1 (min 2)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">RPE:</span>
                  <span className="text-amber-600 font-medium">-2 (min 5)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={applyAutoRegulation} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              <Activity className="h-4 w-4 mr-2"/>
              Applica Auto-Reg
            </Button>
            <Button variant="outline"onClick={ignoreAutoReg} className="w-full">
              Mi sento bene (Ignora)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Session Shell */}
      <ActiveSessionShell
        title={workoutData?.title || mockWorkout.title}
        elapsedSeconds={elapsedSeconds}
        completedSets={getCompletedSets()}
        totalSets={getTotalSets()}
        isOnline={isOnline}
        isRecoveryMode={isRecoveryMode}
        onFinish={handleFinishWorkout}
        currentExercise={activeExerciseIndex + 1}
        totalExercises={exercises.length}
        restTimerNode={
          <RestTimerPill
            endTime={restEndTime}
            totalSeconds={currentRestDuration}
            onSkip={skipRest}
            onAdd={addRestTime}
            onReset={resetRestTimer}
          />
        }
      >
        {/* Exercise Navigation Dots */}
        <div className="flex items-center justify-center gap-1.5 py-3 px-4">
          {exercises.map((ex, i) => {
            const allDone = ex.sets.every((s) => s.completed);
            return (
              <button
                key={ex.id}
                onClick={() => setActiveExerciseIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === activeExerciseIndex
                    ?"w-6 bg-primary"                    : allDone
                    ?"w-2 bg-primary/40"                    :"w-2 bg-muted-foreground/30"                )}
              />
            );
          })}
        </div>

        {/* Exercise label */}
        <div className="px-4 pb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Esercizio {activeExerciseIndex + 1} di {exercises.length}
          </span>
        </div>

        {/* Embla Carousel — one exercise at a time */}
        <div className="overflow-hidden pb-32"ref={emblaRef}>
          <div className="flex">
            {exercises.map((exercise, i) => (
              <div key={exercise.id} className="flex-[0_0_100%] min-w-0 px-4">
                <ExerciseCard
                  exercise={exercise}
                  exerciseIndex={i}
                  isActive={i === activeExerciseIndex}
                  isRecoveryMode={isRecoveryMode}
                  supersetInfo={getSupersetInfo(exercise)}
                  historyData={exerciseHistory?.[exercise.name]}
                  onSetUpdate={handleSetUpdate}
                  onSetComplete={handleSetComplete}
                />
              </div>
            ))}
          </div>
        </div>
      </ActiveSessionShell>

      {/* Session Recap Dialog */}
      <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary"/>
              Sessione Completata!
            </DialogTitle>
            <DialogDescription>Come è andato l'allenamento?</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Streak Banner */}
            {currentStreak > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                <div className="relative">
                  <Flame className="h-8 w-8 text-orange-500 animate-pulse"/>
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {currentStreak}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-orange-600 dark:text-orange-400">
                     {currentStreak} giorni consecutivi!
                  </p>
                  <p className="text-xs text-muted-foreground">Stai costruendo un'abitudine solida!</p>
                </div>
              </div>
            )}

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-secondary">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground"/>
                <p className="text-lg font-bold tabular-nums">{durationMinutes}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Minuti</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary">
                <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-primary"/>
                <p className="text-lg font-bold tabular-nums">{getCompletedSets()}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Set</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary"/>
                <p className="text-lg font-bold tabular-nums">{sessionLoad}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Carico UA</p>
              </div>
            </div>

            {/* Foster RPE */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quanto è stato duro? (sRPE)</label>
              <div className="flex items-center gap-4">
                <span className={cn("text-4xl font-bold", getRpeColor(sessionRpe))}>{sessionRpe}</span>
                <div className="flex-1">
                  <Slider value={[sessionRpe]} onValueChange={([v]) => setSessionRpe(v)} min={1} max={10} step={1} />
                </div>
              </div>
              {rpeInfo && (
                <div className={cn("p-3 rounded-xl", rpeInfo.color,"text-white")}>
                  <p className="font-semibold">{rpeInfo.label}</p>
                  <p className="text-sm opacity-90">{rpeInfo.description}</p>
                </div>
              )}
            </div>

            {/* Foster Load */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Carico Sessione</p>
                  <p className="text-3xl font-bold text-primary">
                    {sessionLoad} <span className="text-sm font-normal">UA</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Formula Foster</p>
                  <p className="text-sm font-mono">
                    {durationMinutes} min × RPE {sessionRpe}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Input
                placeholder="Come ti sei sentito?"                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline"className="flex-1"onClick={() => setShowRecapDialog(false)}>
              Modifica
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"              onClick={handleSaveWorkoutLog}
              disabled={isLoggingWorkout}
            >
              {isLoggingWorkout ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Trophy className="h-4 w-4 mr-2"/>}
              Salva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
