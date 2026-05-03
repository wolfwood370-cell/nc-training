import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

type Intensity = "mild" | "moderate" | "severe";
type RatingKey = "sleep" | "energy" | "stress" | "mood" | "digestion";

const RATING_FACTORS: { key: RatingKey; label: string }[] = [
  { key: "sleep", label: "Sleep" },
  { key: "energy", label: "Energy" },
  { key: "stress", label: "Stress" },
  { key: "mood", label: "Mood" },
  { key: "digestion", label: "Digestion" },
];

const MUSCLE_GROUPS = [
  "Chest", "Triceps", "Biceps", "Shoulders", "Traps", "Lats",
  "Lower Back", "Glutes", "Hamstrings", "Quads", "Calves",
];

const INTENSITIES: Intensity[] = ["mild", "moderate", "severe"];

interface FormData {
  ratings: Record<RatingKey, number>;
  soreness: Record<string, Intensity>;
}

interface DailyReadinessLogProps {
  onClose?: () => void;
  onSave?: (data: FormData) => void;
}

export default function DailyReadinessLog({ onClose, onSave }: DailyReadinessLogProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    sleep: 4, energy: 3, stress: 2, mood: 4, digestion: 5,
  });
  const [soreness, setSoreness] = useState<Record<string, Intensity>>({
    "Lower Back": "moderate",
    Quads: "moderate",
  });
  const [activeMuscle, setActiveMuscle] = useState<string | null>("Quads");

  const setRating = (k: RatingKey, v: number) =>
    setRatings((p) => ({ ...p, [k]: v }));

  const toggleMuscle = (m: string) => {
    setSoreness((prev) => {
      const next = { ...prev };
      if (next[m]) {
        delete next[m];
        if (activeMuscle === m) setActiveMuscle(null);
      } else {
        next[m] = "moderate";
        setActiveMuscle(m);
      }
      return next;
    });
  };

  const setIntensity = (m: string, intensity: Intensity) =>
    setSoreness((p) => ({ ...p, [m]: intensity }));

  const handleSave = () => {
    const data: FormData = { ratings, soreness };
    console.log("Daily readiness:", data);
    onSave?.(data);
  };

  return (
    <div className="min-h-screen bg-background pb-32" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Chiudi"
          >
            <X className="h-6 w-6 text-primary" />
          </button>
          <h1
            className="flex-1 text-center text-lg font-bold text-primary pr-8"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Morning Readiness
          </h1>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Ratings */}
        <section className="rounded-3xl bg-card border border-border p-5 shadow-sm">
          <div className="space-y-5">
            {RATING_FACTORS.map((f) => (
              <div key={f.key} className="grid grid-cols-[80px_1fr] items-center gap-3">
                <span className="text-sm text-foreground/80">{f.label}</span>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = ratings[f.key] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(f.key, n)}
                        className={`h-10 w-10 rounded-full text-sm font-semibold transition-all flex items-center justify-center ${
                          selected
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                            : "bg-primary/10 text-foreground/70 hover:bg-primary/20"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Muscle Soreness */}
        <section className="rounded-3xl bg-card border border-border p-5 shadow-sm">
          <h2
            className="text-2xl font-bold text-foreground mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Muscle Soreness
          </h2>

          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((m) => {
              const active = !!soreness[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMuscle(m)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                      : "bg-card text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {activeMuscle && soreness[activeMuscle] && (
            <div className="mt-5 rounded-2xl bg-primary/10 p-4">
              <p className="text-sm text-foreground/80 mb-3">
                Intensity: <span className="font-semibold">{activeMuscle}</span>
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-full bg-card p-1 border border-border">
                {INTENSITIES.map((i) => {
                  const selected = soreness[activeMuscle] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIntensity(activeMuscle, i)}
                      className={`py-2 rounded-full text-sm font-medium capitalize transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground/70 hover:bg-muted"
                      }`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Sticky Save */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-5 px-4">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-4 font-semibold text-sm tracking-wider uppercase shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.99] transition"
        >
          <CheckCircle2 className="h-5 w-5" />
          Save Entry
        </button>
      </div>
    </div>
  );
}
