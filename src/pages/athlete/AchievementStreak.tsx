import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Quote, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { useWorkoutStreak } from "@/hooks/useWorkoutStreak";

const AchievementStreak = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { longestStreak, loading: gamificationLoading } = useGamification(user?.id);
  const { currentStreak: workoutStreak, loading: workoutLoading } = useWorkoutStreak(user?.id);

  const loading = gamificationLoading || workoutLoading;
  const streak = loading ? 0 : workoutStreak;
  const best = loading ? 0 : Math.max(longestStreak, workoutStreak);
  const subtitle = loading
    ? "Caricamento dei tuoi traguardi..."
    : streak > 0
    ? `Hai registrato i tuoi parametri per ${streak} giorni consecutivi.`
    : "Inizia oggi a costruire la tua streak.";
  const title =
    streak >= 7
      ? "Settimana Perfetta!"
      : streak > 1
      ? "Streak in Corso!"
      : "Costruisci la tua Streak";

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-container hover:bg-surface-variant/50 p-2 rounded-full"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center pr-10 font-display text-lg font-bold text-primary-container tracking-tight">
          Traguardi Performance
        </h1>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-24 pb-32 flex flex-col gap-8 relative z-10">
        {/* Hero Badge Section */}
        <section className="flex flex-col items-center text-center gap-6">
          <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-white border-[6px] border-[#F59E0B] shadow-[0_8px_30px_rgba(245,158,11,0.2)] mx-auto">
            <div className="flex flex-col items-center justify-center">
              <Flame className="text-[#F59E0B] w-12 h-12 mb-[-4px]" />
              <span className="font-display text-5xl font-bold text-on-surface">{streak}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-bold text-on-surface">
              {title}
            </h2>
            <p className="font-body-md text-base text-on-surface-variant">
              {subtitle}
            </p>
          </div>
        </section>

        {/* Stats Card */}
        <section className="bg-white/[0.7] backdrop-blur-md border border-surface-variant rounded-[32px] p-6 flex flex-row items-center justify-between shadow-sm">
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
              Streak Attuale
            </span>
            <span className="font-display text-3xl font-bold text-primary-container mt-1">
              {streak} {streak === 1 ? "Giorno" : "Giorni"}
            </span>
          </div>
          <div className="h-16 w-px bg-outline-variant/30 mx-4" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
              Miglior Record
            </span>
            <span className="font-display text-3xl font-bold text-on-surface mt-1">
              {best} {best === 1 ? "Giorno" : "Giorni"}
            </span>
          </div>
        </section>

        {/* Coach Insight Card */}
        <section className="bg-surface-container-low rounded-[32px] p-6 border-l-4 border-primary-container flex flex-col gap-3 relative overflow-hidden shadow-sm">
          <Quote className="absolute top-2 right-4 text-primary-container opacity-10 w-16 h-16 pointer-events-none" />
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <Brain className="text-primary-container w-4 h-4" />
            <span className="text-xs font-bold text-primary-container uppercase tracking-wide">
              Coach Insight
            </span>
          </div>
          <p className="font-body-md text-base text-on-surface relative z-10 leading-relaxed">
            La costanza è la base della performance d'élite. I tuoi dati giornalieri ci permettono di calibrare perfettamente i carichi di allenamento. Continua così.
          </p>
        </section>
      </main>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent z-40 pb-10">
        <button
          onClick={() => navigate("/athlete/dashboard")}
          className="w-full max-w-md mx-auto bg-primary-container text-white py-4 rounded-full font-display text-[16px] font-bold tracking-wide shadow-lg hover:bg-primary transition-colors active:scale-95 flex items-center justify-center"
        >
          Continua a spingere
        </button>
      </div>
    </div>
  );
};

export default AchievementStreak;
