import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Play,
  Pen,
  Clock,
  Send,
} from "lucide-react";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";

const VIDEO_THUMBNAIL =
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&h=800&fit=crop";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=faces";

// TODO: Wire to a real exercise-video / coach-feedback record once a
// dedicated table or hook (e.g. useExerciseVideoFeedback) is available.
// For now the page consumes the athlete's coach branding from the database
// and keeps a static placeholder for the set / feedback content.
const STATIC_SET_TITLE = "Squat con Bilanciere - Set 2";
const STATIC_RECORDED_AT = "Registrato ieri alle 18:30";
const STATIC_FEEDBACK =
  "Ottima profondità in questo set! Tuttavia, nota come i tuoi fianchi si alzino leggermente più veloci del petto nella terza ripetizione. Concentrati sullo spingere la parte alta della schiena contro il bilanciere mentre esci dalla buca.";

export default function FormAnalysis() {
  const navigate = useNavigate();
  const { coach } = useAthleteProfile();

  const coachName = coach.coachName ?? "Coach";
  const coachAvatar = coach.logoUrl ?? FALLBACK_AVATAR;

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="font-display text-lg font-bold text-on-surface tracking-tight">
          Analisi Esecuzione
        </h1>

        <button
          type="button"
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Altre opzioni"
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      {/* Main */}
      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
        {/* Video Player */}
        <div className="relative w-full aspect-video rounded-[32px] overflow-hidden shadow-lg border border-outline-variant/30 group cursor-pointer">
          <img
            src={VIDEO_THUMBNAIL}
            alt="Anteprima esecuzione"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-colors group-hover:bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
              <Play className="w-7 h-7 fill-white" />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 bg-primary-container text-white font-semibold text-xs px-4 py-2 rounded-full shadow-md flex items-center gap-2">
            <Pen className="w-3.5 h-3.5" />
            Telestration Aggiunta
          </div>
        </div>

        {/* Meta-Data */}
        <section>
          <h2 className="font-display text-3xl font-bold text-on-surface mb-2">
            {STATIC_SET_TITLE}
          </h2>
          <div className="flex items-center text-on-surface-variant font-medium text-sm gap-2">
            <Clock className="w-4 h-4" />
            {STATIC_RECORDED_AT}
          </div>
        </section>

        {/* Coach Feedback */}
        <article className="bg-white rounded-3xl p-6 border-l-4 border-primary-container shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={coachAvatar}
              alt={coachName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Note di {coachName}
              </h3>
              <p className="text-sm text-on-surface-variant">Coach di Forza</p>
            </div>
          </div>
          <p className="text-on-surface-variant leading-relaxed text-base">
            {STATIC_FEEDBACK}
          </p>
        </article>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t border-surface-variant z-40 pb-8">
        <button
          type="button"
          className="w-full max-w-2xl mx-auto bg-primary-container text-white font-semibold py-4 rounded-full shadow-lg flex items-center justify-center gap-2"
        >
          Conferma e Rispondi
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
