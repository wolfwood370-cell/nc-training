import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info, Lightbulb } from "lucide-react";

export default function ACWRAnalysis() {
  const navigate = useNavigate();

  // Gauge geometry: semicircle from (20,110) sweeping to (200,110), radius 90, center (110,110)
  // Needle pointing to ~1.15 (sweet spot, slightly past center) — angle ~10° right of top
  const needleAngle = -80; // degrees from horizontal axis (semicircle: -180 left, 0 right, -90 top)
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = 75;
  const cx = 110;
  const cy = 110;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-container hover:bg-surface-variant/50 p-2 -ml-2 rounded-full transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-primary-container tracking-tight">
          Carico di Lavoro (ACWR)
        </h1>
        <button
          className="text-primary-container hover:bg-surface-variant/50 p-2 -mr-2 rounded-full transition-colors"
          aria-label="Informazioni"
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-md mx-auto space-y-6">
        {/* Hero Gauge */}
        <section className="flex flex-col items-center justify-center py-6">
          <svg
            viewBox="0 0 220 130"
            className="w-full max-w-[280px]"
            aria-hidden="true"
          >
            {/* Outer track */}
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              className="stroke-surface-variant"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Amber low zone (left) */}
            <path
              d="M 20 110 A 90 90 0 0 1 60 41"
              fill="none"
              className="stroke-amber-500"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Green sweet spot (center) */}
            <path
              d="M 70 35 A 90 90 0 0 1 150 35"
              fill="none"
              className="stroke-emerald-500"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Red danger zone (right) */}
            <path
              d="M 160 41 A 90 90 0 0 1 200 110"
              fill="none"
              className="stroke-red-500"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              className="stroke-on-surface"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="6" className="fill-on-surface" />
            <circle cx={cx} cy={cy} r="2.5" className="fill-white" />
          </svg>

          <p className="font-display text-5xl font-bold text-primary-container leading-none mt-4">
            1.15
          </p>
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mt-4">
            Sweet Spot
          </span>
          <p className="text-sm text-on-surface-variant text-center max-w-xs mt-4">
            Adattamento ottimale. Rischio infortuni minimizzato.
          </p>
        </section>

        {/* Data Breakdown */}
        <section className="bg-white/[0.7] backdrop-blur-md border border-surface-variant rounded-[32px] p-6 flex items-center shadow-sm">
          <div className="flex-1 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-on-surface-variant">
              Carico Acuto (7gg)
            </span>
            <span className="font-display text-xl font-bold text-on-surface mt-1">
              12,450 kg
            </span>
          </div>
          <div className="w-px h-12 bg-surface-variant mx-4" />
          <div className="flex-1 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-on-surface-variant">
              Carico Cronico (28gg)
            </span>
            <span className="font-display text-xl font-bold text-on-surface mt-1">
              10,820 kg
            </span>
          </div>
        </section>

        {/* Trend Chart */}
        <section className="bg-white/[0.7] backdrop-blur-md border border-surface-variant rounded-[32px] p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-primary-container mb-6">
            Trend di Affaticamento
          </h2>

          <div className="relative">
            <svg
              viewBox="0 0 300 140"
              className="w-full h-auto"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Optimal zone band */}
              <rect
                x="0"
                y="50"
                width="300"
                height="40"
                className="fill-emerald-500/10"
              />
              {/* Spline trend line */}
              <path
                d="M 10 95 C 50 85, 80 100, 120 80 S 200 55, 240 60 S 280 55, 290 50"
                fill="none"
                className="stroke-primary-container"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End dot */}
              <circle
                cx="290"
                cy="50"
                r="5"
                className="fill-primary-container"
              />
              <circle cx="290" cy="50" r="2" className="fill-white" />
            </svg>
            <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Optimal Zone
            </span>
          </div>

          <div className="flex justify-between mt-3">
            <span className="text-xs font-semibold text-on-surface-variant">
              4 Sett fa
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              3 Sett fa
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              2 Sett fa
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              Oggi
            </span>
          </div>
        </section>

        {/* Coach Insight */}
        <section className="bg-surface-container-low rounded-[32px] p-6 flex gap-4 items-start shadow-sm relative overflow-hidden border-l-4 border-primary-container">
          <Lightbulb className="text-primary-container mt-1 shrink-0 w-5 h-5" />
          <p className="text-on-surface text-base leading-relaxed">
            <span className="font-bold">Insight:</span> Il carico è aumentato
            gradualmente. Puoi procedere con il sovraccarico progressivo
            programmato per la seduta odierna.
          </p>
        </section>

        {/* Detail Image */}
        <div className="w-full h-40 rounded-[32px] overflow-hidden relative group mt-4">
          <img
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80"
            alt="Recupero in palestra"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent flex items-end p-6">
            <span className="text-white font-display text-lg font-semibold">
              Gestione del Recupero
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
