import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Dumbbell, Utensils } from "lucide-react";
import { useNutritionTargets } from "@/hooks/useNutritionTargets";
import { useActiveProgram } from "@/hooks/useActiveProgram";

const PlanUpdate = () => {
  const navigate = useNavigate();
  const { targets } = useNutritionTargets();
  const { activeProgram } = useActiveProgram();

  const phaseTitle = activeProgram?.name ?? "Nuova Fase di Allenamento";
  const phaseDescription =
    activeProgram?.description ??
    "Il volume è stato aggiornato. Concentrati sul tempo sotto tensione e sulle eccentriche controllate.";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-slate-500/10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sky-700 hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-variant/50"
          aria-label="Indietro"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center pr-10 text-lg font-bold text-sky-900 font-display tracking-tight">
          Aggiornamento Piano
        </h1>
      </header>

      {/* Main Content */}
      <main className="pt-[88px] px-6 max-w-screen-md mx-auto space-y-8">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mt-8">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-6">
            <TrendingUp className="h-7 w-7 text-brand-container" />
          </div>
          <h2 className="font-display text-4xl font-bold text-on-surface mb-4 tracking-tight">
            La tua Nuova Fase è Pronta
          </h2>
          <p className="font-sans text-base text-on-surface-variant max-w-[280px]">
            Il tuo coach ha adattato i tuoi protocolli per le prossime settimane.
          </p>
        </section>

        {/* Update Cards Container */}
        <div className="space-y-6">
          {/* Training Update Card */}
          <article className="bg-white rounded-3xl p-6 shadow-sm border border-surface-variant/30 relative overflow-hidden">
            <span aria-hidden="true" className="absolute top-0 left-0 w-1.5 h-full bg-brand-container" />
            <header className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-surface-container text-brand-container">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Protocollo di Allenamento
              </h3>
            </header>
            <div className="ml-11">
              <p className="font-display text-xl text-brand-container mb-2">
                {phaseTitle}
              </p>
              <p className="font-sans text-base text-on-surface-variant">
                {phaseDescription}
              </p>
            </div>
          </article>

          {/* Nutrition Update Card */}
          <article className="bg-white rounded-3xl p-6 shadow-sm border border-surface-variant/30 relative overflow-hidden">
            <span aria-hidden="true" className="absolute top-0 left-0 w-1.5 h-full bg-brand-container" />
            <header className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-surface-container text-brand-container">
                <Utensils className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Obiettivi Nutrizionali
              </h3>
            </header>
            <div className="ml-11 space-y-4">
              <div className="flex items-center justify-between bg-surface-container/50 p-4 rounded-2xl">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs text-on-surface-variant mb-1">Pro</span>
                  <span className="font-sans font-semibold text-xl text-on-surface">
                    {Math.round(targets.protein)}g
                  </span>
                </div>
                <div className="w-px h-8 bg-surface-variant/50" />
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs text-on-surface-variant mb-1">Grassi</span>
                  <span className="font-sans font-semibold text-xl text-on-surface">
                    {Math.round(targets.fats)}g
                  </span>
                </div>
                <div className="w-px h-8 bg-surface-variant/50" />
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs text-on-surface-variant mb-1">Carb</span>
                  <span className="font-sans font-semibold text-xl text-on-surface">
                    {Math.round(targets.carbs)}g
                  </span>
                </div>
              </div>
              <p className="font-sans text-base text-on-surface-variant">
                Obiettivo calorico giornaliero: {Math.round(targets.calories)} kcal
                {targets.isTrainingDay ? " (giorno di allenamento)" : " (giorno di riposo)"}.
              </p>
            </div>
          </article>
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-40 pb-10">
        <button
          type="button"
          onClick={() => navigate("/athlete/dashboard")}
          className="w-full max-w-screen-md mx-auto bg-brand-container text-white py-4 rounded-full font-sans text-base font-bold tracking-wide shadow-lg hover:bg-brand transition-colors active:scale-[0.98] block"
        >
          Capito, andiamo!
        </button>
      </div>
    </div>
  );
};

export default PlanUpdate;
