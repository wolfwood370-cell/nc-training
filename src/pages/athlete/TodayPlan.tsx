import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  Clock,
  Zap,
  MoreHorizontal,
  Play,
} from "lucide-react";

const WEEK = [
  { letter: "L", num: 13 },
  { letter: "M", num: 14, active: true },
  { letter: "M", num: 15 },
  { letter: "G", num: 16 },
  { letter: "V", num: 17, future: true },
  { letter: "S", num: 18, future: true },
  { letter: "D", num: 19, future: true },
];

const WARMUP = [
  { name: "90/90 Stretch", meta: "2 min" },
  { name: "Cat-Cow", meta: "1 min" },
  { name: "World's Greatest Stretch", meta: "2 min" },
];

const MAIN = [
  { code: "A1.", name: "Squat con Bilanciere", meta: "4 Serie x 6-8 Reps" },
  { code: "B1.", name: "Stacchi Romeni", meta: "3 Serie x 8-10 Reps" },
  { code: "B2.", name: "Trazioni Zavorrate", meta: "3 Serie x 6 Reps" },
  { code: "C1.", name: "Affondi Bulgari", meta: "3 Serie x 10 Reps per lato" },
];

export default function TodayPlan() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-on-surface p-2 -ml-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface">
          Piano di Oggi
        </h1>
        <button
          className="text-on-surface p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-24 pb-40 px-6 max-w-md mx-auto flex flex-col gap-6">
        {/* Micro-Week Strip */}
        <section className="flex justify-between items-center">
          {WEEK.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-2 ${
                d.future ? "opacity-50" : ""
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  d.active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {d.letter}
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  d.active
                    ? "bg-primary-container text-white shadow-[0_4px_20px_rgba(34,111,163,0.3)]"
                    : "bg-surface-container text-on-surface"
                }`}
              >
                {d.num}
              </div>
            </div>
          ))}
        </section>

        {/* Hero Summary Card */}
        <section className="bg-white rounded-[32px] p-6 flex flex-col gap-4 border border-surface-variant shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-on-surface">
            Forza & Ipertrofia Lower Body
          </h2>
          <div className="flex flex-wrap items-center gap-2 font-semibold text-xs text-on-surface-variant uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              75 Min Stima
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Zap size={16} />
              Sessione Pesante
            </span>
            <span>&bull;</span>
            <span>3 Fasi</span>
          </div>
        </section>

        {/* Workout Blueprint */}
        <section className="flex flex-col gap-8">
          {/* Fase 1 */}
          <div>
            <div className="flex items-center gap-2 mb-4 font-semibold text-on-surface">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs">
                1
              </span>
              Fase 1: Riscaldamento
            </div>
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container ml-3">
              {WARMUP.map((ex) => (
                <div
                  key={ex.name}
                  className="bg-white rounded-xl p-4 flex justify-between items-center border border-surface-variant"
                >
                  <span className="text-on-surface text-sm">{ex.name}</span>
                  <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">
                    {ex.meta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fase 2 */}
          <div>
            <div className="flex items-center gap-2 mb-4 font-semibold text-on-surface">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-xs">
                2
              </span>
              Fase 2: Sessione Principale
            </div>
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container ml-3">
              {MAIN.map((ex) => (
                <div
                  key={ex.code}
                  className="bg-white rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden border border-surface-variant"
                >
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container" />
                  <div className="flex justify-between items-start pl-2">
                    <span className="font-semibold text-on-surface text-sm">
                      <span className="text-primary-container mr-1">
                        {ex.code}
                      </span>
                      {ex.name}
                    </span>
                    <button
                      className="text-on-surface-variant -mt-1 -mr-1 p-1"
                      aria-label="Altre opzioni"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant pl-2">
                    {ex.meta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center gap-3 z-40 pb-10">
        <button
          onClick={() => navigate("/athlete/active-workout")}
          className="w-full max-w-md bg-primary-container text-white rounded-full py-4 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          <Play className="w-5 h-5 fill-current" />
          Inizia Allenamento
        </button>
        <p className="text-xs font-semibold text-on-surface-variant opacity-70 text-center">
          Tocca un esercizio sopra per l'anteprima dei dettagli.
        </p>
      </div>
    </div>
  );
}
