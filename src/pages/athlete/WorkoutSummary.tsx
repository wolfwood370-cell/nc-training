import { useState, useEffect, useMemo } from"react";
import { useParams, useNavigate } from"react-router-dom";
import { useQuery } from"@tanstack/react-query";
import { motion, AnimatePresence } from"framer-motion";
import {
  Trophy,
  Clock,
  Dumbbell,
  TrendingUp,
  Flame,
  Utensils,
  ChevronRight,
  Zap,
  Star,
  ArrowRight,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { supabase } from"@/integrations/supabase/client";
import { Button } from"@/components/ui/button";
import { Slider } from"@/components/ui/slider";
import { Badge } from"@/components/ui/badge";
import { Card, CardContent } from"@/components/ui/card";
import { ResponsivePhoneWrapper } from"@/components/athlete/PhoneMockup";
import { Confetti } from"@/components/celebration/Confetti";
import { SmartCopyDrawer } from"@/components/nutrition/SmartCopyDrawer";
import { useAuth } from"@/hooks/useAuth";
import { toast } from"sonner";

// ============================================================
// ANIMATED COUNTER
// ============================================================

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className="tabular-nums">{display.toLocaleString()}</span>;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function WorkoutSummary() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showConfetti, setShowConfetti] = useState(true);
  const [sessionRpe, setSessionRpe] = useState(5);
  const [rpeSaved, setRpeSaved] = useState(false);
  const [nutritionDrawerOpen, setNutritionDrawerOpen] = useState(false);

  // Fetch the workout log
  const { data: workoutLog } = useQuery({
    queryKey: ["workout-log-summary", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      // Try fetching by workout_id first (most common flow)
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("workout_id", sessionId)
        .eq("status","completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Compute metrics from exercises_data
  const metrics = useMemo(() => {
    if (!workoutLog) {
      return { duration: 0, totalVolume: 0, totalSets: 0, totalReps: 0 };
    }

    const exercisesData = (workoutLog.exercises_data as any[]) || [];
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    exercisesData.forEach((ex: any) => {
      const sets = ex.sets_data || [];
      sets.forEach((set: any) => {
        if (set.completed !== false) {
          const weight = set.weight_kg || 0;
          const reps = set.reps || 0;
          totalVolume += weight * reps;
          totalSets++;
          totalReps += reps;
        }
      });
    });

    const duration = workoutLog.duration_minutes || 0;
    return { duration, totalVolume, totalSets, totalReps };
  }, [workoutLog]);

  // Determine"High Note"achievement
  const highNote = useMemo(() => {
    if (!workoutLog) return null;

    // If sRPE exists and load is high
    const load = workoutLog.total_load_au || (metrics.duration * (workoutLog.srpe || 5));

    if (metrics.totalVolume > 5000) {
      return {
        icon: Dumbbell,
        title:"Volume Massimo!",
        subtitle:`${metrics.totalVolume.toLocaleString()} kg sollevati in una sessione`,
        color:"from-violet-500 to-purple-600",
      };
    }

    if (load > 500) {
      return {
        icon: Flame,
        title:"Carico Elevato!",
        subtitle:`${load} UA — sessione ad alta intensità`,
        color:"from-orange-500 to-red-600",
      };
    }

    return {
      icon: Star,
      title:"Sessione Completata!",
      subtitle:"Ogni allenamento ti avvicina ai tuoi obiettivi",
      color:"from-emerald-500 to-teal-600",
    };
  }, [workoutLog, metrics]);

  // Save sRPE
  const handleSaveRpe = async () => {
    if (!user?.id || !workoutLog) return;

    const { error } = await supabase
      .from("workout_logs")
      .update({ srpe: sessionRpe })
      .eq("id", workoutLog.id);

    if (!error) {
      // Also save to daily_readiness as subjective feedback
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_readiness")
        .upsert(
          { athlete_id: user.id, date: today, score: Math.round((10 - sessionRpe) * 10) },
          { onConflict:"athlete_id,date"}
        );

      setRpeSaved(true);
      toast.success("sRPE salvato!");
    } else {
      toast.error("Errore nel salvataggio");
    }
  };

  const sessionLoad = metrics.duration * sessionRpe;

  const getRpeLabel = (rpe: number) => {
    if (rpe <= 2) return"Facile";
    if (rpe <= 4) return"Moderato";
    if (rpe <= 6) return"Impegnativo";
    if (rpe <= 8) return"Molto Duro";
    return"Massimale";
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 3) return"text-emerald-500";
    if (rpe <= 5) return"text-yellow-500";
    if (rpe <= 7) return"text-orange-500";
    return"text-red-500";
  };

  return (
    <ResponsivePhoneWrapper>
      <div className="h-[100dvh] lg:h-full flex flex-col bg-[hsl(var(--m3-background,var(--background)))] text-foreground relative overflow-hidden">
        {/* Confetti */}
        <Confetti trigger={showConfetti} duration={3000} onComplete={() => setShowConfetti(false)} />

        {/* Animated background gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-[0.07]"            style={{
              background:
                "radial-gradient(ellipse at center, hsl(var(--primary)) 0%, transparent 60%)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease:"linear"}}
          />
        </div>

        {/* Status bar safe area */}
        <div className="safe-top flex-shrink-0"/>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="px-5 py-8 space-y-6 max-w-md mx-auto">
            {/* ===== HERO ===== */}
            <motion.div
              className="text-center space-y-3"              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type:"spring", delay: 0.2 }}
              >
                <Trophy className="h-10 w-10 text-primary"/>
              </motion.div>
              <h1 className="text-3xl font-bold">Sessione Completata</h1>
              <p className="text-muted-foreground">
                Ottimo lavoro! Ecco il tuo riepilogo.
              </p>
            </motion.div>

            {/* ===== HIGH NOTE CARD ===== */}
            {highNote && (
              <motion.div
                className={cn(
                  "relative overflow-hidden rounded-2xl p-5 text-white",
                  "bg-gradient-to-br",
                  highNote.color
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"/>
                <div className="relative flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <highNote.icon className="h-7 w-7"/>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{highNote.title}</p>
                    <p className="text-sm opacity-90">{highNote.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== METRICS GRID ===== */}
            <motion.div
              className="grid grid-cols-2 gap-3"              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Duration */}
              <Card className="border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground"/>
                  <p className="text-2xl font-bold">
                    <AnimatedNumber value={metrics.duration} />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Minuti
                  </p>
                </CardContent>
              </Card>

              {/* Tonnage */}
              <Card className="border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]">
                <CardContent className="p-4 text-center">
                  <Dumbbell className="h-5 w-5 mx-auto mb-2 text-primary"/>
                  <p className="text-2xl font-bold">
                    <AnimatedNumber value={metrics.totalVolume} duration={1500} />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    kg Volume
                  </p>
                </CardContent>
              </Card>

              {/* Sets */}
              <Card className="border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-emerald-500"/>
                  <p className="text-2xl font-bold">
                    <AnimatedNumber value={metrics.totalSets} />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Set Totali
                  </p>
                </CardContent>
              </Card>

              {/* Session Load */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <Zap className="h-5 w-5 mx-auto mb-2 text-primary"/>
                  <p className="text-2xl font-bold text-primary">
                    <AnimatedNumber value={sessionLoad} />
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Carico UA
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== SESSION RPE SLIDER ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-[hsl(var(--m3-outline-variant,var(--border))/0.3)] bg-[hsl(var(--m3-surface-container,var(--card)))]">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Quanto è stato duro?</p>
                    <Badge
                      variant="secondary"                      className={cn("font-bold", getRpeColor(sessionRpe))}
                    >
                      {getRpeLabel(sessionRpe)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "text-4xl font-bold transition-colors",
                        getRpeColor(sessionRpe)
                      )}
                    >
                      {sessionRpe}
                    </span>
                    <div className="flex-1">
                      <Slider
                        value={[sessionRpe]}
                        onValueChange={([v]) => {
                          setSessionRpe(v);
                          setRpeSaved(false);
                        }}
                        min={1}
                        max={10}
                        step={1}
                        disabled={rpeSaved}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveRpe}
                    disabled={rpeSaved}
                    className="w-full"                    variant={rpeSaved ?"secondary":"default"}
                  >
                    {rpeSaved ?"Salvato":"Salva sRPE"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ===== NUTRITION BRIDGE ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <button
                onClick={() => setNutritionDrawerOpen(true)}
                className={cn(
                  "w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98]",
                  "bg-gradient-to-r from-[hsl(var(--m3-tertiary-container,var(--accent)))] to-[hsl(var(--m3-tertiary-container,var(--accent))/0.7)]",
                  "border border-[hsl(var(--m3-outline-variant,var(--border))/0.3)]"                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Utensils className="h-6 w-6 text-[hsl(var(--m3-on-tertiary-container,var(--accent-foreground)))]"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[hsl(var(--m3-on-tertiary-container,var(--accent-foreground)))]">
                      Alimentazione Post-Allenamento
                    </p>
                    <p className="text-xs text-[hsl(var(--m3-on-tertiary-container,var(--accent-foreground))/0.7)]">
                      Registra il pasto post-allenamento per ottimizzare il recupero
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[hsl(var(--m3-on-tertiary-container,var(--accent-foreground))/0.5)] flex-shrink-0"/>
                </div>
              </button>
            </motion.div>

            {/* ===== BACK TO DASHBOARD ===== */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="pt-2 pb-8"            >
              <Button
                variant="outline"                className="w-full h-12 rounded-xl"                onClick={() => navigate("/athlete")}
              >
                Torna alla Dashboard
                <ArrowRight className="h-4 w-4 ml-2"/>
              </Button>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Nutrition Drawer */}
      <SmartCopyDrawer
        open={nutritionDrawerOpen}
        onOpenChange={setNutritionDrawerOpen}
        onLogged={() => toast.success("Pasto post-workout registrato!")}
      />
    </ResponsivePhoneWrapper>
  );
}
