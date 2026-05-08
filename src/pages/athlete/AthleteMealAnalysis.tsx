import { useMemo } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";

import {
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  Check,
  Loader2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MealAnalysis } from "@/hooks/useAnalyzeMealPhoto";

interface LocationState {
  imageUrl?: string;
  analysis?: MealAnalysis;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";

const AthleteMealAnalysis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { state } = useLocation();
  const { imageUrl, analysis } = (state as LocationState | null) ?? {};

  // Orphan-state guard: refresh / deep-link with no analysis → back to scanner.
  // Never render demo macros under the "Verified by AI" badge.
  if (!analysis) {
    return <Navigate to="/athlete/nutrition" replace />;
  }


  const detectedItems = useMemo(
    () =>
      (analysis?.ingredients ?? []).map((label, idx) => ({
        id: `${idx}`,
        label,
      })),
    [analysis?.ingredients],
  );

  const handleBack = () => navigate(-1);
  const handleEdit = () => {
    // TODO: Connect to backend - open ingredient editor
    toast.info("Modifica non ancora disponibile");
  };

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!analysis) throw new Error("Nessuna analisi disponibile");
      const { error } = await supabase.from("nutrition_logs").insert({
        athlete_id: user.id,
        date: format(new Date(), "yyyy-MM-dd"),
        meal_name: analysis.mealName,
        calories: Math.round(analysis.calories),
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pasto registrato!");
      queryClient.invalidateQueries({ queryKey: ["nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition-consumed-today"] });
      navigate("/athlete/nutrition");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Errore nel salvataggio");
    },
  });


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-surface-variant/50">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Indietro"
          className="text-on-surface"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-on-surface">
          Analisi del Pasto
        </h1>
        <button
          type="button"
          aria-label="Altre opzioni"
          className="text-on-surface"
        >
          <MoreVertical className="size-5" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-40">
        {/* Hero Image */}
        <section className="relative w-full aspect-square bg-surface-container rounded-2xl overflow-hidden shadow-sm flex items-center justify-center">
          <img
            src={imageUrl ?? FALLBACK_IMAGE}
            alt={analysis?.mealName ?? "Pasto analizzato"}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-surface-variant">
            <CheckCircle2 className="text-emerald-500 size-4" />
            <span className="font-semibold text-[10px] text-on-surface uppercase tracking-wider">
              Verificato dall'AI
            </span>
          </div>
        </section>

        {/* Breakdown Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-surface-variant/50 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-on-surface">
              {analysis.mealName}
            </h2>
          </div>

          <div className="flex items-end justify-between border-b border-surface-variant/50 pb-6">
            <div>
              <span className="font-display text-4xl font-extrabold text-on-surface">
                {Math.round(analysis.calories)}
              </span>
              <span className="text-base font-normal text-on-surface-variant ml-1">
                kcal
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Pro
                </span>
                <span className="font-bold text-lg text-on-surface">
                  {Math.round(analysis.protein)}g
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Fat
                </span>
                <span className="font-bold text-lg text-on-surface">
                  {Math.round(analysis.fats)}g
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-on-surface-variant font-semibold">
                  Carb
                </span>
                <span className="font-bold text-lg text-on-surface">
                  {Math.round(analysis.carbs)}g
                </span>
              </div>
            </div>
          </div>


          <div>
            <h3 className="font-semibold text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
              Elementi Rilevati
            </h3>
            {detectedItems.length === 0 ? (
              <p className="text-sm text-outline">Nessun ingrediente rilevato.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {detectedItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <span className="font-medium text-sm text-on-surface">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full px-6 pb-[env(safe-area-inset-bottom,32px)] pt-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40 flex justify-center">
        <div className="max-w-lg w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending || !analysis}
            className="w-full bg-primary-container text-white font-bold text-xs uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95 disabled:opacity-60"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Conferma e Registra
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="w-full text-primary-container font-bold text-xs uppercase tracking-widest py-3 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95"
          >
            Modifica Ingredienti o Quantità
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteMealAnalysis;
