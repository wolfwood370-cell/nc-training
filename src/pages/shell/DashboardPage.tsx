import { Bell, Camera, Moon, Heart, Zap, Play } from "lucide-react";

const NAVY = "#043555";
const PRIMARY = "#226FA3";
const MUTED = "#50768E";
const TRACK = "#E2E8F0";
const DARK = "#1E293B";
const EMERALD = "#10B981";

/* ---------------- Readiness Score Circle ---------------- */
function ReadinessScore({ score = 88 }: { score?: number }) {
  const size = 120;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={TRACK} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={EMERALD} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-black leading-none"
          style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
        >
          {score}
        </span>
        <span
          className="text-xs font-medium mt-1 tracking-wide"
          style={{ color: MUTED }}
        >
          Score
        </span>
      </div>
    </div>
  );
}

/* ---------------- Concentric Macro Rings ---------------- */
function MacroRings({ kcal = 2150 }: { kcal?: number }) {
  const size = 150;
  const stroke = 10;
  const gap = 4;
  const rings = [
    { color: "#10B981", value: 200 / 260 }, // outer Carb
    { color: "#FBBF24", value: 55 / 75 },   // mid Fat
    { color: "#3B82F6", value: 160 / 180 }, // inner Protein
  ];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const r = (size - stroke) / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * r;
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={r} stroke={`${ring.color}25`} strokeWidth={stroke} fill="none" />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold leading-none"
          style={{ color: PRIMARY, fontFamily: "Manrope, sans-serif" }}
        >
          {kcal.toLocaleString()}
        </span>
        <span
          className="text-[10px] font-semibold tracking-[0.15em] mt-1"
          style={{ color: MUTED }}
        >
          KCAL IN
        </span>
      </div>
    </div>
  );
}

/* ---------------- Sub-metric row ---------------- */
function SubMetric({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color: MUTED }}>{icon}</span>
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: MUTED, fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </span>
      </div>
      <span
        className="text-sm font-bold"
        style={{ color: valueColor, fontFamily: "Manrope, sans-serif" }}
      >
        {value}
      </span>
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
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white/20"
          style={{ backgroundColor: PRIMARY, fontFamily: "Manrope, sans-serif" }}
        >
          N
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-white/60">
            DOMENICA 3 MAGGIO
          </span>
          <h1
            className="text-sm font-bold text-white mt-0.5"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Ready for today, Nicolò?
          </h1>
        </div>
        <button className="relative h-9 w-9 flex items-center justify-center" aria-label="Notifications">
          <Bell className="h-5 w-5 text-white" strokeWidth={1.75} />
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: EMERALD, boxShadow: `0 0 0 2px ${DARK}` }}
          />
        </button>
      </header>

      {/* Content */}
      <div className="px-4 pt-5 pb-28 space-y-4 relative">
        {/* READINESS WIDGET */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <h2
            className="text-xl font-semibold mb-3"
            style={{ color: PRIMARY, fontFamily: "Manrope, sans-serif" }}
          >
            Readiness
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <SubMetric icon={<Moon className="h-4 w-4" strokeWidth={2} />} label="Sleep" value="7h 45m" valueColor={NAVY} />
              <SubMetric icon={<Zap className="h-4 w-4" strokeWidth={2} />} label="Energy" value="High" valueColor={EMERALD} />
              <SubMetric icon={<Heart className="h-4 w-4" strokeWidth={2} />} label="Soreness" value="Low" valueColor={EMERALD} />
            </div>
            <ReadinessScore score={88} />
          </div>
        </section>

        {/* REST DAY MESSAGE CARD */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-1"
            style={{ color: PRIMARY }}
          >
            Today's Focus
          </p>
          <h3
            className="text-2xl font-bold leading-tight"
            style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
          >
            Rest Day
          </h3>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Concentrati sul recupero.
          </p>
          <button
            className="w-full h-14 mt-4 rounded-full flex items-center justify-center gap-2 text-white text-base font-semibold transition-transform active:scale-[0.98]"
            style={{ backgroundColor: PRIMARY, fontFamily: "Manrope, sans-serif" }}
          >
            Start Mobility
            <Play className="h-5 w-5 fill-white" strokeWidth={0} />
          </button>
        </section>

        {/* FLOATING CAMERA FAB - between Rest Day and Nutrition */}
        <div className="relative h-0">
          <button
            aria-label="Snap meal"
            className="absolute -top-7 right-5 z-20 h-14 w-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: NAVY }}
          >
            <Camera className="h-6 w-6 text-white" strokeWidth={2} />
          </button>
        </div>

        {/* NUTRITION WIDGET */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
          >
            Nutrition
          </h2>
          <div className="flex items-center justify-between gap-3">
            {/* Left: Macros readout */}
            <div className="flex-1 space-y-3">
              {[
                { label: "Pro", value: "160/180g", color: "#3B82F6" },
                { label: "Fat", value: "55/75g", color: "#FBBF24" },
                { label: "Carb", value: "200/260g", color: "#10B981" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: MUTED }}>
                      {m.label}
                    </p>
                    <p
                      className="text-base font-bold leading-tight"
                      style={{ color: NAVY, fontFamily: "Manrope, sans-serif" }}
                    >
                      {m.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: Concentric rings */}
            <MacroRings kcal={2150} />
          </div>
        </section>
      </div>
    </div>
  );
}
