import { ArrowLeft, Clock, Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";

const ExerciseDetail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 -ml-2 rounded-full active:bg-surface-container transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="size-5 text-on-surface" />
        </button>
        <h1 className="font-display font-semibold text-sm tracking-tight text-primary">
          Dettaglio Esercizio
        </h1>
        <span className="w-8 h-8" aria-hidden />
      </header>

      <main className="pt-24 px-6 max-w-md mx-auto pb-40 w-full">
        {/* Exercise Card */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-surface-variant relative overflow-hidden">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface w-1/2 leading-relaxed">
              Fase 1: Core e Stability
            </span>
            <span className="bg-primary-container text-white rounded-full px-3 py-1.5 flex items-center gap-1">
              <Clock size={14} />
              <span className="text-xs font-semibold">Isometria</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display font-bold text-2xl text-on-surface mb-6">
            A1. RKC Front Plank
          </h2>

          {/* Video Placeholder */}
          <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden mb-6 relative bg-slate-100">
            <img
              src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop"
              alt="Anteprima esercizio"
              className="object-cover w-full h-full opacity-90"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Riproduci video"
              >
                <Play className="text-primary-container fill-current" size={24} />
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="bg-surface border border-surface-variant rounded-2xl p-5 mb-6 flex flex-col gap-4 divide-y divide-surface-variant">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-outline font-semibold tracking-wider">
                Target
              </span>
              <span className="text-base text-on-surface mt-1">3 Serie</span>
            </div>
            <div className="flex flex-col pt-4">
              <span className="text-[10px] uppercase text-outline font-semibold tracking-wider">
                Durata
              </span>
              <span className="font-semibold text-on-surface mt-1">60 Secondi</span>
            </div>
            <div className="flex flex-col pt-4">
              <span className="text-[10px] uppercase text-outline font-semibold tracking-wider">
                Sovraccarico
              </span>
              <span className="text-base text-on-surface mt-1">Corpo libero</span>
            </div>
          </div>

          {/* Coach's Tip */}
          <div className="flex gap-3 items-start border-l-2 border-primary-container pl-4 py-1">
            <Info className="text-secondary shrink-0 mt-0.5 size-5" />
            <p className="text-sm italic text-secondary leading-relaxed">
              Mantieni la retroversione del bacino e contrai i glutei al massimo. Non collassare con la zona lombare.
            </p>
          </div>
        </section>
      </main>

      <AthleteBottomNav />
    </div>
  );
};

export default ExerciseDetail;
