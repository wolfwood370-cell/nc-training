import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useReadiness, initialReadiness } from "@/hooks/useReadiness";

type MetricKey = "sonno" | "energia" | "stress" | "umore" | "digestione";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "sonno", label: "Sonno" },
  { key: "energia", label: "Energia" },
  { key: "stress", label: "Stress" },
  { key: "umore", label: "Umore" },
  { key: "digestione", label: "Digestione" },
];

const MUSCLES: string[] = [
  "Pettorali",
  "Tricipiti",
  "Dorsali",
  "Quadricipiti",
  "Femorali",
  "Glutei",
  "Polpacci",
  "Lombari",
  "Spalle",
];

type MetricsState = Record<MetricKey, number | null>;

const INITIAL_METRICS: MetricsState = {
  sonno: null,
  energia: null,
  stress: null,
  umore: null,
  digestione: null,
};

// Map 1-5 button to 1-10 scale used by daily_readiness
function toTenScale(v: number): number {
  return Math.max(1, Math.min(10, v * 2));
}

export default function DailyCheckin() {
  const navigate = useNavigate();
  const { saveReadiness, isSaving } = useReadiness();
  const [metrics, setMetrics] = useState<MetricsState>(INITIAL_METRICS);
  const [soreMuscles, setSoreMuscles] = useState<string[]>([]);

  const setMetric = (key: MetricKey, value: number) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMuscle = (muscle: string) => {
    setSoreMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    );
  };

  const allMetricsAnswered = METRICS.every(({ key }) => metrics[key] !== null);

  const handleSave = async () => {
    if (!allMetricsAnswered) {
      toast.error("Compila tutte le metriche prima di salvare.");
      return;
    }

    // Build sorenessMap (level 2 = "Moderate" by default for selected muscles)
    const sorenessMap: Record<string, 0 | 1 | 2 | 3> = {};
    soreMuscles.forEach((m) => {
      sorenessMap[m] = 2;
    });

    try {
      await saveReadiness({
        ...initialReadiness,
        sleepHours: toTenScale(metrics.sonno!) > 8 ? 8 : toTenScale(metrics.sonno!),
        sleepQuality: toTenScale(metrics.sonno!),
        energy: toTenScale(metrics.energia!),
        stress: toTenScale(metrics.stress!),
        mood: toTenScale(metrics.umore!),
        digestion: toTenScale(metrics.digestione!),
        sorenessMap,
        bodyWeight: null,
        hrvRmssd: null,
        restingHr: null,
      });
      toast.success("Check-in completato!");
      navigate("/athlete/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Errore nel salvataggio del check-in.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Chiudi"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-variant/40 transition-colors text-on-surface"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-primary-container">
          Buongiorno
        </h1>
        <div className="w-10" aria-hidden />
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto flex flex-col gap-10">
        {/* Hero */}
        <section>
          <h2 className="font-display text-5xl font-bold text-on-surface mb-2">
            Buongiorno.
          </h2>
          <p className="text-on-surface-variant text-base">
            Registra i tuoi parametri per sbloccare il focus di allenamento
            ottimale di oggi.
          </p>
        </section>

        {/* Metriche Giornaliere */}
        <section className="bg-surface-container-low border border-surface-variant rounded-3xl p-6 flex flex-col gap-6">
          <h3 className="font-display text-2xl font-semibold text-on-surface">
            Metriche Giornaliere
          </h3>

          <ul className="flex flex-col gap-5">
            {METRICS.map(({ key, label }) => (
              <li
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-base text-on-surface-variant">
                  {label}
                </span>
                <div
                  className="flex items-center gap-2"
                  role="radiogroup"
                  aria-label={label}
                >
                  {[1, 2, 3, 4, 5].map((value) => {
                    const isSelected = metrics[key] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${label} ${value}`}
                        onClick={() => setMetric(key, value)}
                        className={
                          isSelected
                            ? "w-10 h-10 rounded-full bg-primary-container ring-2 ring-primary-container ring-offset-2 ring-offset-surface-container-low transition-all scale-105 shadow-sm"
                            : "w-10 h-10 rounded-full bg-surface-variant hover:bg-primary-fixed-dim transition-colors"
                        }
                      />
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Dolori Muscolari */}
        <section>
          <h3 className="font-display text-2xl font-semibold text-on-surface mb-4">
            Dolori Muscolari
          </h3>
          <div className="flex flex-wrap gap-3">
            {MUSCLES.map((muscle) => {
              const isSelected = soreMuscles.includes(muscle);
              return (
                <button
                  key={muscle}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleMuscle(muscle)}
                  className={
                    isSelected
                      ? "px-5 py-2.5 rounded-full bg-primary-container text-white font-semibold text-sm transition-colors shadow-md"
                      : "px-5 py-2.5 rounded-full bg-surface-variant text-secondary font-semibold text-sm hover:bg-primary-fixed-dim transition-colors"
                  }
                >
                  {muscle}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-xl border-t border-surface-variant">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full max-w-2xl mx-auto bg-primary-container text-white font-semibold py-4 rounded-full shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              Salva e Sblocca Dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
