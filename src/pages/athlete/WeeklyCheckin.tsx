import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X, HelpCircle, Minus, Plus, Camera, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const WeeklyCheckin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weight, setWeight] = useState<number>(75.5);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const decrement = () => setWeight((w) => Math.max(0, +(w - 0.1).toFixed(1)));
  const increment = () => setWeight((w) => +(w + 0.1).toFixed(1));

  const handleClose = () => navigate(-1);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Devi effettuare l'accesso");
      return;
    }
    setIsSubmitting(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      // Persist body weight + weekly narrative into daily_readiness for today.
      // TODO: Wire upload of progress photos to a storage bucket once available.
      const { error } = await supabase
        .from("daily_readiness")
        .upsert(
          {
            athlete_id: user.id,
            date: today,
            body_weight: weight,
            notes: feedback || null,
          },
          { onConflict: "athlete_id,date" }
        );
      if (error) throw error;
      toast.success("Check-in settimanale inviato al coach!");
      navigate("/athlete/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore nel salvataggio";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md border-b border-surface-variant max-w-md mx-auto left-0 right-0">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi"
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <X size={24} />
        </button>
        <h1 className="font-display text-lg font-bold text-primary-container">
          Check-in Settimanale
        </h1>
        <button
          type="button"
          aria-label="Aiuto"
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <HelpCircle size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto pt-24 pb-32 px-6 flex flex-col gap-6">
        {/* Header Text */}
        <div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-2">
            Check-in Settimanale
          </h2>
          <p className="text-on-surface-variant text-base">
            Rivediamo i tuoi progressi degli ultimi 7 giorni.
          </p>
        </div>

        {/* Peso Corporeo Card */}
        <section className="bg-white rounded-2xl p-6 border border-surface-variant shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-surface-container-highest/50 rounded-full blur-2xl z-0" />
          <h3 className="font-display text-2xl font-semibold relative z-10 mb-6">
            Peso Corporeo
          </h3>
          <div className="flex items-center justify-between relative z-10">
            <button
              type="button"
              onClick={decrement}
              aria-label="Diminuisci peso"
              className="w-12 h-12 rounded-full bg-surface hover:bg-surface-container flex items-center justify-center border border-outline-variant/10 transition-colors"
            >
              <Minus size={20} className="text-on-surface" />
            </button>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tracking-tighter text-on-surface">
                {weight.toFixed(1)}
              </span>
              <span className="text-on-surface-variant font-medium">kg</span>
            </div>
            <button
              type="button"
              onClick={increment}
              aria-label="Aumenta peso"
              className="w-12 h-12 rounded-full bg-surface hover:bg-surface-container flex items-center justify-center border border-outline-variant/10 transition-colors"
            >
              <Plus size={20} className="text-on-surface" />
            </button>
          </div>
        </section>

        {/* Aggiornamento Fisico Card */}
        <section className="bg-white rounded-2xl p-6 border border-surface-variant shadow-sm">
          <h3 className="font-display text-2xl font-semibold mb-6">
            Aggiornamento Fisico
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(["Fronte", "Retro"] as const).map((label) => (
              <button
                key={label}
                type="button"
                className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-outline-variant/50 bg-surface hover:bg-surface-container transition-colors group"
              >
                <Camera
                  size={28}
                  className="text-on-surface-variant group-hover:text-primary mb-2 transition-colors"
                />
                <span className="text-sm font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Feedback Card */}
        <section className="bg-white rounded-2xl p-6 border border-surface-variant shadow-sm">
          <h3 className="font-display text-xl font-semibold mb-4">
            Come è andata questa settimana?
          </h3>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setFeedback(e.target.value)
            }
            placeholder="Hai avuto difficoltà con fame, stanchezza o volume di allenamento?..."
            className="w-full bg-surface border-0 rounded-xl p-4 font-sans text-base text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary resize-none outline-none"
          />
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-surface-variant flex justify-center z-50">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full max-w-md bg-primary-container text-white font-semibold py-4 rounded-full shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              Invio in corso...
              <Loader2 size={18} className="animate-spin" />
            </>
          ) : (
            <>
              Invia al Coach
              <Send size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WeeklyCheckin;
