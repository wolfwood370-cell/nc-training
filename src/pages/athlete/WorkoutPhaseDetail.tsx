import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Dumbbell,
  Activity,
  Clock,
  Zap,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

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

export default function WorkoutPhaseDetail() {
  const navigate = useNavigate();

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
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-6">
        {/* Section Header */}
        <header>
          <h2 className="font-display text-3xl font-bold text-on-surface">
            Fase 2: Sessione Principale
          </h2>
          <p className="text-secondary text-sm font-medium mt-1">
            Ipertrofia Strutturale ad Alta Intensità
          </p>
        </header>

        {/* Block A — Superset */}
        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-primary-container shadow-sm border border-surface-variant/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Blocco A • Superset
            </span>
            <span className="text-xs font-bold text-secondary">4 Serie</span>
          </div>

          <div className="mt-6">
            <ExerciseRow
              Icon={Dumbbell}
              title="A1. Squat con Bilanciere"
              subtitle="8 Reps • Tempo: 3-0-1-0"
            />
          </div>

          <div className="border-t border-dashed border-surface-variant my-4" />

          <ExerciseRow
            Icon={Activity}
            title="A2. Stacchi Romeni"
            subtitle="10 Reps • Tempo: 2-0-1-0"
          />

          <div className="mt-6 bg-surface-container rounded-full py-2 px-4 flex items-center gap-2 w-fit">
            <Clock className="size-4 text-secondary" strokeWidth={2} aria-hidden />
            <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">
              Recupero: 90 sec dopo A2
            </span>
          </div>
        </section>

        {/* Block B — Circuit */}
        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-primary-container shadow-sm border border-surface-variant/50">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Blocco B • Circuito Condizionale
            </span>
            <span className="bg-primary-container/20 text-primary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              AMRAP 12 Minuti
            </span>
          </div>

          <div className="space-y-4">
            <CircuitRow label="B1" title="Kettlebell Swings" reps="15 Reps" />
            <CircuitRow label="B2" title="Piegamenti" reps="Max Reps" />
            <CircuitRow label="B3" title="Box Jumps" reps="10 Reps" />
          </div>

          <div className="mt-6 bg-surface-container rounded-full py-2 px-4 flex items-center gap-2 w-fit">
            <Zap className="size-4 text-secondary" strokeWidth={2} aria-hidden />
            <span className="text-secondary text-[10px] font-bold uppercase tracking-wider">
              Recupero: Transizioni Veloci, No Pause
            </span>
          </div>
        </section>

        {/* Coaching Card */}
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
                Focus sulla fase eccentrica in A1. Mantenere la tensione strutturale
                è fondamentale per l&apos;adattamento metabolico di questa sessione.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
