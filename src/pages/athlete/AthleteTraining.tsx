import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Clock,
  Zap,
  BarChart,
  PlayCircle,
  ChevronsUpDown,
  Activity,
  Dumbbell,
  Snowflake,
} from "lucide-react";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";

type Tab = "diario" | "metriche";

const DAYS = [
  { letter: "L", num: 14 },
  { letter: "M", num: 15 },
  { letter: "M", num: 16 },
  { letter: "G", num: 17, active: true },
  { letter: "V", num: 18 },
  { letter: "S", num: 19 },
  { letter: "D", num: 20 },
];

const PHASES = [
  {
    icon: Snowflake,
    title: "Movement Prep",
    subtitle: "3 Esercizi • 10 min",
    active: false,
  },
  {
    icon: Dumbbell,
    title: "Main Session",
    subtitle: "5 Esercizi • 40 min",
    active: true,
  },
  {
    icon: Activity,
    title: "Cool Down",
    subtitle: "2 Esercizi • 10 min",
    active: false,
  },
];

export default function AthleteTraining() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("diario");

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-surface-variant flex justify-between items-center px-6 py-4">
        <button
          className="w-10 h-10 rounded-full overflow-hidden bg-surface-container"
          aria-label="Profilo"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt="Avatar atleta"
            className="w-full h-full object-cover"
          />
        </button>
        <h1 className="font-display font-bold text-lg text-primary">Training</h1>
        <button
          onClick={() => navigate("/athlete/settings")}
          className="text-on-surface-variant p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Impostazioni"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="px-6 mt-6 space-y-6 max-w-md mx-auto pb-40">
        {/* Segmented Control */}
        <div className="p-1 bg-surface-container rounded-full flex w-full">
          <button
            onClick={() => setTab("diario")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              tab === "diario"
                ? "bg-white text-primary shadow-sm"
                : "text-secondary"
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => setTab("metriche")}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              tab === "metriche"
                ? "bg-white text-primary shadow-sm"
                : "text-secondary"
            }`}
          >
            Metriche
          </button>
        </div>

        {/* Micro-Calendar */}
        <div className="flex justify-between items-center py-2">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col items-center relative">
              <span className="text-xs text-secondary mb-1">{d.letter}</span>
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                  d.active
                    ? "bg-primary-container text-white"
                    : "text-secondary"
                }`}
              >
                {d.num}
              </div>
              {d.active && (
                <span className="w-1 h-1 bg-primary-container rounded-full absolute -bottom-1" />
              )}
            </div>
          ))}
        </div>

        {/* Hero Card */}
        <section className="bg-white/[0.7] backdrop-blur-md rounded-3xl p-6 relative overflow-hidden border border-surface-variant shadow-sm">
          <span className="absolute top-0 left-0 w-1.5 h-full bg-primary-container rounded-l-3xl" />
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80"
            alt=""
            aria-hidden="true"
            className="absolute top-0 right-0 w-1/2 h-full opacity-10 object-cover pointer-events-none"
          />
          <div className="relative z-10">
            <span className="text-[10px] text-primary-container bg-primary-container/10 px-2 py-1 rounded-full uppercase tracking-widest font-semibold inline-block mb-2">
              Main Workout
            </span>
            <h2 className="font-display text-2xl font-bold text-on-surface leading-tight">
              Lower Body Power & Hypertrophy
            </h2>
            <div className="flex flex-wrap gap-4 mt-4">
              <span className="text-sm text-secondary flex items-center gap-1">
                <Clock className="w-4 h-4" />
                60 Min Est.
              </span>
              <span className="text-sm text-secondary flex items-center gap-1">
                <Zap className="w-4 h-4" />
                RPE Target: 8
              </span>
            </div>
          </div>
        </section>

        {/* Glance Cards Grid */}
        <section className="grid grid-cols-2 gap-4">
          {/* Carico Sett. */}
          <div className="bg-white/[0.7] rounded-2xl p-4 flex flex-col justify-between h-36 border border-surface-variant">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                Carico Sett.
              </span>
              <BarChart className="w-4 h-4 text-secondary" />
            </div>
            <div className="font-display text-xl font-bold text-primary">
              12,450 kg
            </div>
            <div className="flex items-end gap-1 h-6">
              {[30, 50, 40, 70, 90].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 bg-primary-container/70 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Prontezza */}
          <div className="bg-white/[0.7] rounded-2xl p-4 flex flex-col justify-between h-36 border border-surface-variant">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">
                Prontezza
              </span>
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  className="stroke-surface-variant"
                  strokeWidth="3"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="3"
                  strokeDasharray="56.5"
                  strokeDashoffset="8.5"
                  strokeLinecap="round"
                  transform="rotate(-90 12 12)"
                />
              </svg>
            </div>
            <div className="font-display text-xl font-bold text-primary">
              Ottima
            </div>
            <div>
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                85% Score
              </span>
            </div>
          </div>
        </section>

        {/* Fasi dell'Allenamento */}
        <section>
          <div className="font-display font-bold text-lg text-primary flex justify-between items-center mb-3">
            <span>Fasi dell'Allenamento</span>
            <ChevronsUpDown className="w-5 h-5 text-secondary" />
          </div>
          <div className="space-y-2">
            {PHASES.map(({ icon: Icon, title, subtitle, active }) => (
              <div
                key={title}
                className={`bg-white rounded-2xl p-4 flex items-center justify-between border-l-2 ${
                  active ? "border-l-primary-container" : "border-l-surface-variant"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      active
                        ? "bg-primary-container/10 text-primary-container"
                        : "bg-surface-container text-primary"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface text-sm">
                      {title}
                    </p>
                    <p className="text-xs text-secondary">{subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom CTA */}
      <button
        onClick={() => navigate("/athlete/active-workout")}
        className="fixed bottom-24 w-[calc(100%-48px)] max-w-md mx-auto left-0 right-0 py-5 bg-[#001e2d] text-white rounded-[20px] font-display font-bold text-lg shadow-2xl flex items-center justify-center gap-3 z-40 active:scale-[0.98] transition-transform"
      >
        Inizia Allenamento
        <PlayCircle className="w-6 h-6" />
      </button>

      <AthleteBottomNav />
    </div>
  );
}
