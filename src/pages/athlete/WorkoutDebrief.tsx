import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, MoreVertical, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useActiveSessionStore } from "@/stores/useActiveSessionStore";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RPE_OPTIONS = [5, 6, 7, 8, 9, 10] as const;
type Rpe = (typeof RPE_OPTIONS)[number];

const RPE_LABELS: Record<Rpe, string> = {
  5: "5 - Moderato (Potevi fare molte rep in più)",
  6: "6 - Impegnativo (Potevi fare 4-5 rep in più)",
  7: "7 - Sostenuto (Potevi fare 3 rep in più)",
  8: "8 - Difficile (Potevi fare al massimo 2 rep in più)",
  9: "9 - Molto Difficile (Solo 1 rep di riserva)",
  10: "10 - Massimale (Cedimento totale)",
};

function formatDuration(startedAt: string | null): string {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms <= 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WorkoutDebrief() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workout } = useTodaysWorkout();
  const sessionLogs = useActiveSessionStore((s) => s.sessionLogs);
  const startedAt = useActiveSessionStore((s) => s.startedAt);
  const activeSessionId = useActiveSessionStore((s) => s.activeSessionId);
  const workoutId = useActiveSessionStore((s) => s.workoutId);
  const endSession = useActiveSessionStore((s) => s.endSession);

  const [rpe, setRpe] = useState<Rpe>(8);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // === Derived stats from session logs ===
  const { totalVolume, completedSets, plannedSets, muscles } = useMemo(() => {
    let volume = 0;
    let completed = 0;
    let planned = 0;
    const muscleSet = new Set<string>();

    const structure = workout?.structure ?? [];
    structure.forEach((ex) => {
      planned += ex.sets ?? 0;
      const exMuscles = (ex as { muscleTags?: string[]; muscles?: string[] })
        .muscleTags ?? (ex as { muscles?: string[] }).muscles ?? [];
      exMuscles.forEach((m) => m && muscleSet.add(m));
    });

    Object.values(sessionLogs).forEach((logs) => {
      logs.forEach((log) => {
        if (log.completed) {
          completed += 1;
          const kg = parseFloat(log.actualKg) || 0;
          const reps = parseFloat(log.actualReps) || 0;
          volume += kg * reps;
        }
      });
    });

    if (planned === 0) planned = completed;

    return {
      totalVolume: volume,
      completedSets: completed,
      plannedSets: planned,
      muscles: Array.from(muscleSet),
    };
  }, [sessionLogs, workout]);

  const sessionTitle = workout?.title ?? "Allenamento";
  const sessionDuration = formatDuration(startedAt);
  const formattedVolume = `${totalVolume.toLocaleString("it-IT")} kg`;

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Sessione utente non trovata");
      return;
    }
    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      const exercisesData = JSON.parse(JSON.stringify(sessionLogs));

      // === Foster's sRPE: session RPE × duration in minutes ===
      const durationSeconds = startedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
        : 0;
      const durationMinutes = Math.max(1, Math.floor(durationSeconds / 60));
      const calculatedSrpe = rpe * durationMinutes;

      // Try to update an existing workout_log for this workout
      const targetWorkoutId = workout?.id ?? workoutId ?? null;

      let updated = false;
      if (targetWorkoutId) {
        const { error, count } = await supabase
          .from("workout_logs")
          .update({
            status: "completed",
            rpe_global: rpe,
            srpe: calculatedSrpe,
            duration_seconds: durationSeconds,
            notes: notes || null,
            completed_at: completedAt,
            exercises_data: exercisesData,
          }, { count: "exact" })
          .eq("athlete_id", user.id)
          .eq("workout_id", targetWorkoutId);
        if (error) throw error;
        updated = (count ?? 0) > 0;
      }

      if (!updated && targetWorkoutId) {
        const { error: insertErr } = await supabase.from("workout_logs").insert([{
          athlete_id: user.id,
          workout_id: targetWorkoutId,
          status: "completed",
          rpe_global: rpe,
          srpe: calculatedSrpe,
          duration_seconds: durationSeconds,
          notes: notes || null,
          completed_at: completedAt,
          started_at: startedAt,
          exercises_data: exercisesData,
          local_id: activeSessionId,
        }]);
        if (insertErr) throw insertErr;
      }

      // Mark workout itself completed if applicable
      if (targetWorkoutId) {
        await supabase
          .from("workouts")
          .update({ status: "completed" })
          .eq("id", targetWorkoutId)
          .eq("athlete_id", user.id);
      }

      endSession();
      toast.success("Allenamento salvato!");
      navigate("/athlete");
    } catch (e) {
      console.error("[WorkoutDebrief] save failed", e);
      toast.error("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 border-b border-surface-variant/30 bg-white/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-4 h-16 max-w-md mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="text-on-surface-variant p-2 hover:opacity-80 rounded-full"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg text-on-surface">
            Riepilogo Sessione
          </h1>
          <button
            className="text-on-surface-variant p-2 hover:opacity-80 rounded-full"
            aria-label="Altre opzioni"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow pt-[88px] px-6 pb-32 max-w-md mx-auto w-full flex flex-col gap-8">
        {/* Hero Celebration */}
        <section className="flex flex-col items-center text-center mt-4">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="size-12 text-emerald-500" />
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-2">
            Allenamento Completato
          </h2>
          <p className="text-base text-secondary">
            {sessionTitle} • {sessionDuration}
          </p>
        </section>

        {/* Session Stats */}
        <section className="bg-white rounded-2xl border border-surface-variant/50 shadow-sm p-6">
          <h3 className="font-semibold text-[10px] text-on-surface uppercase mb-6 tracking-widest opacity-80">
            Riepilogo Sessione
          </h3>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
            <div>
              <p className="text-sm text-secondary mb-1">Volume Totale</p>
              <p className="font-display text-3xl font-bold text-on-surface">
                {formattedVolume}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary mb-1">Set Completati</p>
              <p className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-primary-container">
                  {completedSets}
                </span>
                <span className="text-xl text-secondary">/ {plannedSets}</span>
              </p>
            </div>
          </div>
          {muscles.length > 0 && (
            <div>
              <p className="text-sm text-secondary mb-3">Muscoli Allenati</p>
              <div className="flex flex-wrap gap-2">
                {muscles.map((m) => (
                  <span
                    key={m}
                    className="bg-surface-container px-3 py-1.5 rounded-full font-semibold text-xs text-on-surface-variant"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Session RPE */}
        <section>
          <h3 className="font-display text-2xl font-bold text-on-surface mb-1">
            RPE della Sessione
          </h3>
          <p className="text-secondary">
            Quanto è stato duro l'intero allenamento?
          </p>
          <div className="flex justify-between items-center gap-2 mb-4 mt-4">
            {RPE_OPTIONS.map((value) => {
              const active = value === rpe;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRpe(value)}
                  className={
                    active
                      ? "w-14 h-14 rounded-xl bg-primary-container text-white font-display text-3xl font-bold flex items-center justify-center shadow-lg scale-110 transition-all"
                      : "w-12 h-12 rounded-xl bg-surface-container text-secondary font-display text-2xl font-bold flex items-center justify-center transition-transform active:scale-95"
                  }
                  aria-pressed={active}
                  aria-label={`RPE ${value}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <p className="text-primary-container text-center font-bold text-sm">
            {RPE_LABELS[rpe]}
          </p>
        </section>

        {/* Coach's Notes */}
        <section>
          <h3 className="font-display text-xl font-bold text-on-surface mb-3">
            Note per il Coach (Opzionale)
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Eventuali dolori, fatica o feedback...?"
            className="w-full bg-surface-container border-none rounded-xl p-4 text-base text-on-surface placeholder:text-secondary/50 focus:ring-2 focus:ring-primary-container resize-none h-32 outline-none"
          />
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-12 pb-[env(safe-area-inset-bottom,24px)] px-6 z-40">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-md mx-auto bg-primary text-white font-display font-bold text-lg py-4 rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              Salva e Torna alla Home
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
