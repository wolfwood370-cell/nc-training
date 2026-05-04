import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  TrendingUp,
  Trophy,
  Medal,
} from "lucide-react";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";

const VOLUME_ROWS = [
  { label: "Quadricipiti", sets: "12/14 Set", pct: 85, color: "bg-primary" },
  { label: "Pettorali", sets: "10/12 Set", pct: 80, color: "bg-primary" },
  { label: "Femorali", sets: "6/12 Set", pct: 50, color: "bg-amber-500" },
];

const RECORDS = [
  {
    title: "Romanian Deadlift",
    detail: "Nuovo 8RM: 110 kg",
    date: "Oggi",
  },
  {
    title: "Back Squat",
    detail: "Nuovo 5RM: 130 kg",
    date: "2 gg fa",
  },
];

export default function AthleteTrainingMetrics() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar + Segmented Control */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-surface-variant px-6 pt-4 pb-2">
        <div className="flex justify-between items-center">
          <button
            className="w-10 h-10 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center font-semibold"
            aria-label="Profilo"
          >
            A
          </button>
          <h1 className="font-display font-bold text-lg text-primary">
            Training Hub
          </h1>
          <button
            onClick={() => navigate("/athlete/settings")}
            className="text-on-surface-variant p-2 -mr-2 rounded-full hover:bg-surface-variant/50 transition-colors"
            aria-label="Impostazioni"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full bg-surface-container-low p-1 rounded-full flex mt-4">
          <button
            onClick={() => navigate("/athlete/training")}
            className="flex-1 py-2 text-center text-sm font-semibold text-on-surface-variant"
          >
            Diario
          </button>
          <button className="flex-1 py-2 text-center text-sm font-semibold text-primary bg-white shadow-sm rounded-full">
            Metriche
          </button>
        </div>
      </header>

      <main className="px-6 mt-6 pb-32 space-y-6 max-w-md mx-auto">
        {/* Forza Stimata (e1RM) */}
        <section className="bg-white/70 backdrop-blur-md rounded-[32px] p-6 border border-surface-variant shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
              Forza Stimata (e1RM)
            </span>
            <button className="bg-surface-container-low px-3 py-1.5 rounded-full text-primary font-semibold text-sm flex items-center gap-1">
              Back Squat
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="font-display text-5xl font-bold text-primary mt-4">
            142.5 <span className="text-3xl">kg</span>
          </p>
          <p className="text-emerald-500 text-sm font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +2.5 kg questo mese
          </p>

          {/* Chart */}
          <div className="mt-6">
            <svg
              viewBox="0 0 320 100"
              className="w-full h-24"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="e1rmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    className="[stop-color:hsl(var(--primary-container))]"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    className="[stop-color:hsl(var(--primary-container))]"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d="M 5 80 C 60 75, 90 70, 130 60 S 220 35, 260 25 S 305 12, 315 10 L 315 100 L 5 100 Z"
                fill="url(#e1rmFill)"
              />
              <path
                d="M 5 80 C 60 75, 90 70, 130 60 S 220 35, 260 25 S 305 12, 315 10"
                fill="none"
                className="stroke-primary-container"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs text-outline">Feb</span>
              <span className="text-xs text-outline">Mar</span>
              <span className="text-xs text-outline">Apr</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white/70 rounded-[24px] p-5 flex flex-col justify-between h-36 border border-surface-variant">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">
              Volume Settimanale
            </span>
            <span className="text-3xl font-display font-bold text-primary">
              42.8k
            </span>
            <span className="text-emerald-500 font-semibold text-sm">
              +5% vs w1
            </span>
          </div>
          <div className="bg-white/70 rounded-[24px] p-5 flex flex-col justify-between h-36 border border-surface-variant">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">
              Sforzo Medio (RPE)
            </span>
            <span className="text-3xl font-display font-bold text-primary">
              8.2
            </span>
            <span className="text-outline text-sm">Ottimale per ipertrofia</span>
          </div>
        </section>

        {/* Distribuzione Volume */}
        <section className="bg-white/70 rounded-[32px] p-6 border border-surface-variant">
          <h2 className="font-display text-xl font-semibold mb-6 text-on-surface">
            Distribuzione Volume
          </h2>
          <div className="space-y-5">
            {VOLUME_ROWS.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm font-semibold text-on-surface">
                  <span>{row.label}</span>
                  <span className="text-on-surface-variant">{row.sets}</span>
                </div>
                <div className="bg-surface-container h-2 rounded-full mt-2">
                  <div
                    className={`${row.color} h-full rounded-full transition-all`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Record Recenti */}
        <section className="bg-white/70 rounded-[32px] p-6 border border-surface-variant border-l-4 border-l-emerald-500">
          <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2 text-on-surface">
            <Trophy className="w-5 h-5 text-emerald-500" />
            Record Recenti
          </h2>
          <ul>
            {RECORDS.map((r) => (
              <li
                key={r.title}
                className="flex items-start gap-4 mb-4 last:mb-0"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <Medal className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface">{r.title}</p>
                  <p className="text-emerald-500 text-sm font-medium">
                    {r.detail}
                  </p>
                </div>
                <span className="text-xs text-outline whitespace-nowrap">
                  {r.date}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <AthleteBottomNav />
    </div>
  );
}
