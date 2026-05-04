import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useReadiness, initialReadiness } from "@/hooks/useReadiness";
import { cn } from "@/lib/utils";

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
  "Bicipiti",
  "Spalle",
  "Trapezi",
  "Dorsali",
  "Lombari",
  "Glutei",
  "Femorali",
  "Quadricipiti",
  "Polpacci",
];

const INTENSITY_OPTIONS: { key: 1 | 2 | 3; label: string }[] = [
  { key: 1, label: "Lieve" },
  { key: 2, label: "Moderata" },
  { key: 3, label: "Forte" },
];

type MetricsState = Record<MetricKey, number | null>;
type SorenessState = Record<string, 1 | 2 | 3>;

const INITIAL_METRICS: MetricsState = {
  sonno: null,
  energia: null,
  stress: null,
  umore: null,
  digestione: null,
};

// Map 1-5 → 1-10 scale used by daily_readiness
function toTenScale(v: number): number {
  return Math.max(1, Math.min(10, v * 2));
}

export default function DailyCheckin() {
  const navigate = useNavigate();
  const { saveReadiness, isSaving } = useReadiness();
  const [metrics, setMetrics] = useState<MetricsState>(INITIAL_METRICS);
  const [soreness, setSoreness] = useState<SorenessState>({});

  const setMetric = (key: MetricKey, value: number) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMuscle = (muscle: string) => {
    setSoreness((prev) => {
      if (prev[muscle]) {
        const next = { ...prev };
        delete next[muscle];
        return next;
      }
      return { ...prev, [muscle]: 2 };
    });
  };

  const setIntensity = (muscle: string, intensity: 1 | 2 | 3) => {
    setSoreness((prev) => ({ ...prev, [muscle]: intensity }));
  };

  const allMetricsAnswered = METRICS.every(({ key }) => metrics[key] !== null);
  const selectedMuscles = Object.keys(soreness);

  const handleSave = async () => {
    if (!allMetricsAnswered) {
      toast.error("Compila tutte le metriche prima di salvare.");
      return;
    }

    const sorenessMap: Record<string, 0 | 1 | 2 | 3> = {};
    Object.entries(soreness).forEach(([muscle, level]) => {
      sorenessMap[muscle] = level;
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
    <div className="min-h-screen bg-background text-on-surface font-sans">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Chiudi"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-primary hover:bg-surface-variant/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-primary">
          Prontezza Mattutina
        </h1>
        <div className="w-10" aria-hidden />
      </header>

      <main className="pt-24 pb-40 px-6 max-w-md mx-auto space-y-6">
        {/* Biofeedback Card */}
        <section className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(80,118,142,0.08)] border border-surface-variant/50 flex flex-col gap-6">
          {METRICS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="w-20 font-semibold text-sm text-on-surface-variant">
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
                      className={cn(
                        "w-10 h-10 rounded-full font-semibold text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-white shadow-md"
                          : "bg-white text-primary border border-surface-variant hover:bg-surface",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Muscle Soreness Card */}
        <section className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(80,118,142,0.08)] border border-surface-variant/50">
          <h3 className="font-display text-2xl font-bold text-on-surface mb-6">
            Dolori Muscolari
          </h3>

          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((muscle) => {
              const isSelected = Boolean(soreness[muscle]);
              return (
                <button
                  key={muscle}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleMuscle(muscle)}
                  className={cn(
                    "px-4 py-2 rounded-full font-semibold text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-primary border border-surface-variant hover:bg-surface",
                  )}
                >
                  {muscle}
                </button>
              );
            })}
          </div>

          {/* Per-muscle Intensity Sub-menus */}
          {selectedMuscles.length > 0 && (
            <div className="mt-4 space-y-3">
              {selectedMuscles.map((muscle) => {
                const current = soreness[muscle];
                return (
                  <div
                    key={muscle}
                    className="bg-surface-container/60 rounded-2xl p-4"
                  >
                    <p className="text-sm font-semibold text-on-surface-variant mb-3">
                      Intensità: {muscle}
                    </p>
                    <div
                      className="flex rounded-full overflow-hidden border border-surface-variant"
                      role="radiogroup"
                      aria-label={`Intensità ${muscle}`}
                    >
                      {INTENSITY_OPTIONS.map((opt, idx) => {
                        const selected = current === opt.key;
                        const isLast = idx === INTENSITY_OPTIONS.length - 1;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setIntensity(muscle, opt.key)}
                            className={cn(
                              "flex-1 py-2 font-semibold text-sm text-center transition-colors",
                              !isLast && "border-r border-surface-variant",
                              selected
                                ? "bg-primary text-white shadow-inner"
                                : "bg-white text-on-surface-variant",
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col items-center pb-8 pt-4 bg-white/90 backdrop-blur-2xl border-t border-surface-variant shadow-[0_-10px_40px_rgba(80,118,142,0.1)] rounded-t-[32px]">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#0084c7] text-white rounded-full mx-6 py-4 w-[calc(100%-48px)] max-w-md shadow-lg font-display text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              SALVA DATI
            </>
          )}
        </button>
      </div>
    </div>
  );
}
