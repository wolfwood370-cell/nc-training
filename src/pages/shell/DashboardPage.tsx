import { Bell, Timer, Zap, Play } from "lucide-react";

const NAVY = "#043555";
const PRIMARY = "#226FA3";
const MUTED = "#50768E";
const TRACK = "#E2E8F0";
const DARK = "#1E293B";

/* ---------------- Readiness Gauge ---------------- */
function ReadinessGauge({ score = 82 }: { score?: number }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={TRACK} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={PRIMARY} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-semibold"
        style={{ color: NAVY, fontFamily: "Manrope, Inter, sans-serif", fontSize: 40 }}
      >
        {score}
      </div>
    </div>
  );
}

/* ---------------- Concentric Macro Rings ---------------- */
function MacroRings() {
  const size = 140;
  const stroke = 9;
  const gap = 4;
  const rings = [
    { color: "#F4A8A0", value: 0.7 }, // outer (carb)
    { color: "#F5C56B", value: 0.55 }, // mid (fat)
    { color: "#7FB6E6", value: 0.6 }, // inner (protein)
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const r = (size - stroke) / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * r;
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={r} stroke={`${ring.color}40`} strokeWidth={stroke} fill="none" />
              <circle
                cx={size / 2} cy={size / 2} r={r}
                stroke={ring.color} strokeWidth={stroke} fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c - ring.value * c}
              />
            </g>
          );
        })}
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
        style={{ color: NAVY, fontFamily: "Inter, sans-serif" }}
      >
        - 350 kcal
      </div>
    </div>
  );
}

/* ---------------- Mini Ring (F/W/S) ---------------- */
function MiniRing({ letter, label, value, color }: { letter: string; label: string; value: number; color: string }) {
  const size = 40;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}30`} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - value * c}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: NAVY }}
        >
          {letter}
        </div>
      </div>
      <span className="text-[10px] font-medium" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  );
}

/* ---------------- Sub-metric row ---------------- */
function SubMetric({ label, indicator }: { label: string; indicator: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span
        className="text-[11px] font-semibold tracking-wider uppercase"
        style={{ color: NAVY, fontFamily: "Inter, sans-serif" }}
      >
        {label}
      </span>
      {indicator}
    </div>
  );
}

/* ================ DASHBOARD PAGE ================ */
export default function DashboardPage() {
  return (
    <div
      className="min-h-full"
      style={{ backgroundColor: "#F1F6FB", fontFamily: "Inter, sans-serif" }}
    >
      {/* Top Bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: DARK, paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/30 bg-slate-600" />
        <h1
          className="text-base font-bold tracking-[0.2em] text-white"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          LUMINA
        </h1>
        <button className="relative h-9 w-9 flex items-center justify-center" aria-label="Notifications">
          <Bell className="h-5 w-5 text-white" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#226FA3] ring-2" style={{ boxShadow: `0 0 0 2px ${DARK}` }} />
        </button>
      </header>

      {/* Content */}
      <div className="px-4 pt-5 pb-4 space-y-4">
        {/* READINESS WIDGET */}
        <section className="rounded-3xl bg-white/70 backdrop-blur-sm p-5 shadow-sm">
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: PRIMARY, fontFamily: "Manrope, sans-serif" }}
          >
            Readiness
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <SubMetric
                label="Sleep Quality"
                indicator={<span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NAVY }} />}
              />
              <SubMetric
                label="HRV Baseline"
                indicator={
                  <svg width="32" height="10" viewBox="0 0 32 10" fill="none">
                    <path d="M1 5 Q 6 0, 11 5 T 21 5 T 31 5" stroke="#FFFFFF" strokeWidth="1.5" />
                  </svg>
                }
              />
              <SubMetric
                label="Muscle Soreness"
                indicator={<span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: PRIMARY }} />}
              />
            </div>
            <ReadinessGauge score={82} />
          </div>
        </section>

        {/* TODAY'S FOCUS WIDGET */}
        <section className="rounded-3xl bg-white/70 backdrop-blur-sm p-5 shadow-sm">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
            style={{ color: PRIMARY }}
          >
            Today's Focus
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-sm" style={{ color: NAVY }}>
              <Timer className="h-4 w-4" strokeWidth={2} />
              <span className="font-medium">45 Min</span>
            </div>
            <span className="text-slate-400">•</span>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: NAVY }}>
              <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold uppercase tracking-wide text-xs">High Intensity</span>
            </div>
          </div>
          <h3
            className="text-2xl font-semibold mb-5 leading-tight"
            style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
          >
            W1: Lower Body Power
          </h3>
          <button
            className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-white text-base font-semibold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: PRIMARY, fontFamily: "Manrope, sans-serif" }}
          >
            Start Session
            <Play className="h-5 w-5 fill-white" strokeWidth={0} />
          </button>
        </section>

        {/* NUTRITION WIDGET */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
          >
            Nutrition
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Macros readout */}
            <div className="space-y-3">
              {[
                { label: "Protein", value: 120 },
                { label: "Fat", value: 45 },
                { label: "Carb", value: 180 },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: PRIMARY }}>
                    {m.label}
                  </p>
                  <p className="font-bold leading-none" style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}>
                    <span className="text-3xl">{m.value}</span>
                    <span className="text-sm ml-0.5" style={{ color: PRIMARY }}>g</span>
                  </p>
                </div>
              ))}
            </div>
            {/* Right: Concentric rings */}
            <div className="flex items-center justify-center">
              <MacroRings />
            </div>
          </div>

          {/* Mini rings */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-around">
            <MiniRing letter="F" label="Fiber" value={0.6} color="#7FB6E6" />
            <MiniRing letter="W" label="Water" value={0.75} color="#226FA3" />
            <MiniRing letter="S" label="Sodium" value={0.4} color="#F4A8A0" />
          </div>
        </section>
      </div>
    </div>
  );
}
