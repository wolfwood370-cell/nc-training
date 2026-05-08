import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRightLeft,
  ArrowRight,
  TrendingDown,
  PlusCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReadiness } from "@/hooks/useReadiness";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { showAiGatewayError } from "@/lib/ai-error";

const SORENESS_LABELS: Record<string, string> = {
  quads: "Quadricipiti",
  hamstrings: "Femorali",
  glutes: "Glutei",
  calves: "Polpacci",
  back: "Schiena",
  lower_back: "Lombari",
  chest: "Petto",
  shoulders: "Spalle",
  biceps: "Bicipiti",
  triceps: "Tricipiti",
  core: "Core",
};

interface Adaptation {
  type: "swap" | "reduce" | "add";
  from: string | null;
  to: string;
  detail: string;
}
interface SafePlanExercise {
  name: string;
  sets: number;
  reps: string;
  load: string;
  notes: string;
}
interface AdaptationResponse {
  rationale: string;
  adaptations: Adaptation[];
  safePlan: SafePlanExercise[];
}

const AthleteCopilotIntervention = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { readiness, isLoading: loadingReadiness } = useReadiness();
  const { workout: todayWorkout, isLoading: loadingWorkout } = useTodaysWorkout();

  const adaptationQuery = useQuery({
    queryKey: ["copilot-adaptation", todayWorkout?.id, readiness?.score],
    enabled: !!todayWorkout && !!readiness,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<AdaptationResponse> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      try {
        const { data, error } = await supabase.functions.invoke("ask-copilot", {
          body: {
            mode: "session_adaptation",
            readiness: {
              score: readiness?.score,
              sleepHours: readiness?.sleepHours,
              sorenessMap: readiness?.sorenessMap,
              stress: readiness?.stress,
              energy: readiness?.energy,
            },
            todayWorkout: {
              title: todayWorkout?.title,
              structure: todayWorkout?.structure,
            },
          },
        });
        if (error) throw error;
        const payload = (data as { data?: AdaptationResponse } | null)?.data;
        if (!payload || !Array.isArray(payload.adaptations)) {
          throw new Error("Risposta AI non valida");
        }
        return payload;
      } finally {
        clearTimeout(timer);
      }
    },
  });

  // Surface AI errors as toast (once per error)
  if (adaptationQuery.error && !adaptationQuery.isFetching) {
    void showAiGatewayError(adaptationQuery.error);
  }

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!todayWorkout?.id) throw new Error("Nessun allenamento di oggi");
      const safePlan = adaptationQuery.data?.safePlan;
      if (!safePlan || safePlan.length === 0) throw new Error("Piano sicuro non disponibile");
      const { error } = await supabase
        .from("workouts")
        .update({ structure: safePlan as unknown as never })
        .eq("id", todayWorkout.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Piano sicuro applicato");
      navigate(-1);
    },
    onError: (e) => {
      console.error(e);
      toast.error("Errore nell'applicare il piano sicuro");
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      // Look up coach for the alert
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("coach_id, full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile?.coach_id) return; // no coach → silently skip alert
      const { error } = await supabase.from("coach_alerts").insert({
        coach_id: profile.coach_id,
        athlete_id: user.id,
        type: "fatigue_override",
        severity: "medium",
        message: `${profile.full_name ?? "L'atleta"} ha ignorato l'avviso di affaticamento e mantenuto il piano originale ("${todayWorkout?.title ?? "allenamento"}").`,
        link: `/coach/athletes/${user.id}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.message("Mantenuto piano originale. Il coach è stato avvisato.");
      navigate(-1);
    },
    onError: (e) => {
      console.error(e);
      toast.message("Mantenuto piano originale");
      navigate(-1);
    },
  });

  const handleClose = () => navigate(-1);
  const handleAcceptSafePlan = () => acceptMutation.mutate();
  const handleKeepOriginal = () => overrideMutation.mutate();

  // Derive worst soreness zone
  const worstSoreness = useMemo(() => {
    const map = readiness?.sorenessMap ?? {};
    let bestKey: string | null = null;
    let best = 0;
    for (const [k, v] of Object.entries(map)) {
      const lvl = Number(v);
      if (lvl > best) {
        best = lvl;
        bestKey = k;
      }
    }
    return bestKey ? { zone: SORENESS_LABELS[bestKey] ?? bestKey, level: best } : null;
  }, [readiness?.sorenessMap]);

  const isLoading = loadingReadiness || loadingWorkout || adaptationQuery.isLoading;
  const adaptations = adaptationQuery.data?.adaptations ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center gap-4 px-6 h-16 bg-white/70 backdrop-blur-md shadow-sm border-b border-surface-variant/50 transition-all duration-300">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi"
          className="text-on-surface-variant hover:text-primary p-2 -ml-2 rounded-full"
        >
          <X className="size-5" />
        </button>
        <h1 className="font-display text-xl font-bold tracking-tight text-primary">
          Intervento Copilot
        </h1>
      </header>

      <main className="flex-grow pt-24 pb-48 px-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Insight Card - Why */}
            <section className="bg-white/80 backdrop-blur-xl border border-surface-variant/50 shadow-sm rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle className="size-5" />
                </div>
                <h2 className="font-display text-2xl text-on-surface font-bold">
                  Rischio Rilevato
                </h2>
              </div>
              <p className="text-on-surface-variant leading-relaxed text-base">
                {worstSoreness ? (
                  <>
                    Hai segnalato{" "}
                    <span className="font-bold text-on-surface">
                      DOMS severi ai {worstSoreness.zone} ({worstSoreness.level}/3)
                    </span>
                  </>
                ) : (
                  <>Hai segnalato un livello di affaticamento elevato</>
                )}
                {readiness?.sleepHours !== undefined && readiness.sleepHours < 6 && (
                  <> e solo {readiness.sleepHours}h di sonno</>
                )}
                .
              </p>
              <div className="mt-2 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-0.5 size-5 shrink-0" />
                <p className="font-semibold text-sm text-red-900 leading-snug">
                  Procedere con la sessione "{todayWorkout?.title ?? "di oggi"}"
                  aumenta il rischio di infortuni.
                </p>
              </div>
            </section>

            {/* Adaptation Card - What */}
            <section className="bg-surface-container rounded-2xl p-6 flex flex-col gap-5 border border-surface-variant/50 shadow-sm relative overflow-hidden">
              <div className="bg-primary/10 w-32 h-32 blur-3xl absolute -top-10 -right-10 rounded-full pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shadow-inner">
                  <Sparkles className="size-5" />
                </div>
                <h2 className="font-display text-2xl text-primary font-bold">
                  Adattamenti Proposti
                </h2>
              </div>

              {/* TODO: Connect to backend - generate adaptations dynamically via AI based on workout + readiness */}
              <ul className="flex flex-col gap-4 relative z-10">
                <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
                  <ArrowRightLeft className="text-secondary mt-0.5 size-5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="line-through text-on-surface-variant/70 mr-2">
                      {heaviestExercise}
                    </span>
                    <div className="font-bold text-primary flex items-center gap-1 mt-1">
                      <ArrowRight size={16} /> Variante a basso impatto
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
                  <TrendingDown className="text-secondary mt-0.5 size-5 shrink-0" />
                  <p className="text-on-surface font-medium">
                    Volume totale ridotto del 20%
                  </p>
                </li>
                <li className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-surface-variant/30">
                  <PlusCircle className="text-secondary mt-0.5 size-5 shrink-0" />
                  <p className="text-on-surface font-medium">
                    Aggiunti 10 min di mobilità mirata
                  </p>
                </li>
              </ul>
            </section>
          </>
        )}
      </main>

      {/* Sticky Bottom Action */}
      <footer className="fixed bottom-0 left-0 w-full px-6 py-6 bg-white/90 backdrop-blur-xl border-t border-surface-variant/50 flex flex-col gap-4 z-50 pb-[env(safe-area-inset-bottom,24px)]">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAcceptSafePlan}
            className="w-full py-4 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-[0.1em] shadow-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <CheckCircle className="size-4" />
            Accetta Piano Sicuro
          </button>
          <button
            type="button"
            onClick={handleKeepOriginal}
            className="w-full py-3 text-secondary font-bold text-xs hover:bg-surface-container rounded-full transition-colors active:scale-[0.98] uppercase tracking-[0.1em] text-center"
          >
            Mantieni Piano Originale (Sconsigliato)
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AthleteCopilotIntervention;
