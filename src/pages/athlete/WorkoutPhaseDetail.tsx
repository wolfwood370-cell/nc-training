import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Dumbbell,
  Activity,
  Clock,
  Zap,
  ClipboardList,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  parseWorkoutStructure,
  type WorkoutStructureExercise,
} from "@/types/database";

interface ExerciseRowProps {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
}

interface CircuitRowProps {
  label: string;
  title: string;
  reps: string;
}

function ExerciseRow({ Icon, title, subtitle }: ExerciseRowProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-on-surface">{title}</span>
        <span className="text-secondary text-sm font-medium">{subtitle}</span>
      </div>
    </div>
  );
}

function CircuitRow({ label, title, reps }: CircuitRowProps) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className="text-secondary font-bold text-xs">{label}</span>
        <span className="font-semibold text-on-surface">{title}</span>
      </div>
      <span className="text-secondary text-xs font-semibold bg-surface-container-low px-3 py-1 rounded-md">
        {reps}
      </span>
    </div>
  );
}

// =========================================
// Phase classification (mirrors AthleteTraining)
// =========================================
type PhaseKind = "warmup" | "main" | "cooldown";

function classifyPhase(ex: WorkoutStructureExercise): PhaseKind {
  const tag = `${ex.name ?? ""} ${(ex as { notes?: string }).notes ?? ""}`.toLowerCase();
  if (/(warm|prep|mobility|attivazione|riscald)/.test(tag)) return "warmup";
  if (/(cool|stretch|defaticamento|down)/.test(tag)) return "cooldown";
  return "main";
}

const PHASE_META: Record<PhaseKind, { title: string; subtitle: string }> = {
  warmup: { title: "Fase 1: Movement Prep", subtitle: "Attivazione e mobilità" },
  main: { title: "Fase 2: Sessione Principale", subtitle: "Lavoro ad alta intensità" },
  cooldown: { title: "Fase 3: Cool Down", subtitle: "Recupero e defaticamento" },
};

interface Block {
  kind: "single" | "superset" | "circuit";
  letter: string;
  exercises: WorkoutStructureExercise[];
}

/** Group consecutive exercises sharing supersetGroup; treat 3+ as a circuit. */
function buildBlocks(exs: WorkoutStructureExercise[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  let letterIdx = 0;
  while (i < exs.length) {
    const ex = exs[i];
    const group = ex.supersetGroup;
    const letter = String.fromCharCode(65 + letterIdx);
    if (group) {
      const grouped: WorkoutStructureExercise[] = [];
      let j = i;
      while (j < exs.length && exs[j].supersetGroup === group) {
        grouped.push(exs[j]);
        j++;
      }
      blocks.push({
        kind: grouped.length >= 3 ? "circuit" : "superset",
        letter,
        exercises: grouped,
      });
      i = j;
    } else {
      blocks.push({ kind: "single", letter, exercises: [ex] });
      i++;
    }
    letterIdx++;
  }
  return blocks;
}

function exerciseSubtitle(ex: WorkoutStructureExercise): string {
  const parts: string[] = [];
  if (ex.reps) parts.push(`${ex.reps} Reps`);
  if (ex.tempo) parts.push(`Tempo: ${ex.tempo}`);
  if (!parts.length && ex.sets) parts.push(`${ex.sets} Serie`);
  return parts.join(" • ");
}

export default function WorkoutPhaseDetail() {
  const navigate = useNavigate();
  const { workoutId, phaseIndex } = useParams<{
    workoutId: string;
    phaseIndex: string;
  }>();
  const phaseIdx = Math.max(0, parseInt(phaseIndex ?? "0", 10) || 0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workout-phase-detail", workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const { data, error } = await supabase
        .from("workouts")
        .select("id, title, description, structure")
        .eq("id", workoutId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });

  const { phaseTitle, phaseSubtitle, blocks, coachNote } = useMemo(() => {
    const structure = parseWorkoutStructure(data?.structure);
    // Group by phase preserving order
    const buckets: Record<PhaseKind, WorkoutStructureExercise[]> = {
      warmup: [],
      main: [],
      cooldown: [],
    };
    structure.forEach((ex) => buckets[classifyPhase(ex)].push(ex));
    const orderedPhases: PhaseKind[] = (["warmup", "main", "cooldown"] as const).filter(
      (k) => buckets[k].length > 0,
    );
    const safeIdx = Math.min(phaseIdx, Math.max(0, orderedPhases.length - 1));
    const kind: PhaseKind = orderedPhases[safeIdx] ?? "main";
    const meta = PHASE_META[kind];
    const exs = buckets[kind];
    return {
      phaseTitle: meta.title,
      phaseSubtitle: data?.title ?? meta.subtitle,
      blocks: buildBlocks(exs),
      coachNote: data?.description ?? null,
    };
  }, [data, phaseIdx]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 h-16 bg-white/80 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="font-display font-semibold text-sm tracking-tight text-primary">
          Dettaglio Fase
        </h1>
        <div
          className="w-8 h-8 rounded-full bg-surface-container overflow-hidden"
          aria-label="Profilo atleta"
        />
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-6">
        {/* Section Header */}
        <header>
          <h2 className="font-display text-3xl font-bold text-on-surface">
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-on-surface-variant">
                <Loader2 className="w-5 h-5 animate-spin" /> Caricamento...
              </span>
            ) : (
              phaseTitle
            )}
          </h2>
          <p className="text-secondary text-sm font-medium mt-1">{phaseSubtitle}</p>
        </header>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl p-4">
            Impossibile caricare la fase. Riprova più tardi.
          </p>
        )}

        {!isLoading && !error && blocks.length === 0 && (
          <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-2xl p-6 text-center">
            Nessun esercizio in questa fase.
          </p>
        )}

        {blocks.map((block) => {
          if (block.kind === "circuit") {
            return (
              <section
                key={block.letter}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-primary-container shadow-sm border border-surface-variant/50"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                    Blocco {block.letter} • Circuito Condizionale
                  </span>
                  <span className="bg-primary-container/20 text-primary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {block.exercises.length} stazioni
                  </span>
                </div>

                <div className="space-y-4">
                  {block.exercises.map((ex, idx) => (
                    <CircuitRow
                      key={ex.id ?? `${block.letter}-${idx}`}
                      label={`${block.letter}${idx + 1}`}
                      title={ex.name}
                      reps={ex.reps ? `${ex.reps} Reps` : "Max Reps"}
                    />
                  ))}
                </div>

                <div className="mt-6 bg-surface-container rounded-full py-2 px-4 flex items-center gap-2 w-fit">
                  <Zap className="size-4 text-secondary" strokeWidth={2} aria-hidden />
                  <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">
                    Recupero: Transizioni Veloci, No Pause
                  </span>
                </div>
              </section>
            );
          }

          // single or superset
          const isSuperset = block.kind === "superset";
          const restEx = block.exercises[block.exercises.length - 1];
          const restSec = restEx?.restSeconds ?? 90;
          return (
            <section
              key={block.letter}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-primary-container shadow-sm border border-surface-variant/50"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                  Blocco {block.letter}
                  {isSuperset ? " • Superset" : ""}
                </span>
                <span className="text-xs font-bold text-secondary">
                  {block.exercises[0]?.sets ?? 3} Serie
                </span>
              </div>

              {block.exercises.map((ex, idx) => (
                <div key={ex.id ?? `${block.letter}-${idx}`}>
                  {idx === 0 ? (
                    <div className="mt-6">
                      <ExerciseRow
                        Icon={idx % 2 === 0 ? Dumbbell : Activity}
                        title={`${block.letter}${idx + 1}. ${ex.name}`}
                        subtitle={exerciseSubtitle(ex) || "—"}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="border-t border-dashed border-surface-variant my-4" />
                      <ExerciseRow
                        Icon={idx % 2 === 0 ? Dumbbell : Activity}
                        title={`${block.letter}${idx + 1}. ${ex.name}`}
                        subtitle={exerciseSubtitle(ex) || "—"}
                      />
                    </>
                  )}
                </div>
              ))}

              <div className="mt-6 bg-surface-container rounded-full py-2 px-4 flex items-center gap-2 w-fit">
                <Clock className="size-4 text-secondary" strokeWidth={2} aria-hidden />
                <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">
                  Recupero: {restSec} sec
                </span>
              </div>
            </section>
          );
        })}

        {/* Coaching Card */}
        {coachNote && (
          <section className="bg-primary-container/5 rounded-2xl p-6 border-l-4 border-l-primary-container backdrop-blur-md mt-2">
            <div className="flex items-start gap-4">
              <ClipboardList
                className="h-5 w-5 text-primary shrink-0 mt-0.5"
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="flex flex-col min-w-0">
                <h3 className="font-display text-sm font-bold text-primary">
                  Note di Performance
                </h3>
                <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
                  {coachNote}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
