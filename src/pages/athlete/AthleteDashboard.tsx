import { useNavigate } from "react-router-dom";
import { Bell, Play } from "lucide-react";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";

// ---------- Mock data ----------
const PRIMARY = "#226FA3";
const INK = "#043555";
const TRACK = "#C5E7FF";

const mockData = {
  user: {
    name: "Athlete",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAihu26ItmoIRv5TDvoaYq2YBQLpyd-aact0rqnD-UfZaRVu35z4GfNmNxYswVt30zQ6x5bREybufVclWH-NinBk2jTzvXb2mR92eiDmM7GXeB_8H44xZGWuylcnS1XoAu8X6hKHkMQo0zzoX7hq3RX8afnyKHvRhHogM3UOcm5SGOCWF0h_c_25YhuZXxXnuEqtGFb6__XCIhACU9AP4vxbrW1ik5qfFfLOkK37vL0Qk_ZD0oaRsOPBHKgL4it2SGYC0A7Z5VErE9M",
  },
  readiness: {
    score: 82,
    metrics: [
      { label: "Sleep Quality", indicator: "dot-filled" as const },
      { label: "HRV Baseline", indicator: "trend" as const },
      { label: "Muscle Soreness", indicator: "dot-empty" as const },
    ],
  },
  todayFocus: {
    title: "W1: Lower Body Power",
    duration: "45 Min",
    intensity: "High Intensity",
  },
  nutrition: {
    macros: [
      { label: "Protein", value: 120 },
      { label: "Fat", value: 45 },
      { label: "Carb", value: 180 },
    ],
    deficitKcal: -350,
    rings: [
      { color: "#ffb4ab", stroke: 4, size: "w-full h-full", offset: 60 },
      { color: "#ffd899", stroke: 5, size: "w-[80%] h-[80%]", offset: 100 },
      { color: "#a3defe", stroke: 7, size: "w-[60%] h-[60%]", offset: 40 },
    ],
    micros: [
      { label: "Fiber", letter: "F", offset: 80 },
      { label: "Water", letter: "W", offset: 150 },
      { label: "Sodium", letter: "S", offset: 40 },
    ],
  },
};

// ---------- Subcomponents ----------
function ReadinessGauge({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative w-28 h-28 flex items-center justify-center z-10">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="transparent" stroke={TRACK} strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={PRIMARY}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-[Manrope] text-3xl font-medium tabular-nums"
          style={{ color: PRIMARY }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

function MetricIndicator({ kind }: { kind: "dot-filled" | "dot-empty" | "trend" }) {
  if (kind === "trend") {
    return (
      <svg fill="none" height="12" viewBox="0 0 40 12" width="40">
        <path
          d="M1 9.5C6 9.5 7.5 2 12.5 2C17.5 2 19 10 24 10C29 10 32 4 39 4"
          stroke={PRIMARY}
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (kind === "dot-filled") {
    return (
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: PRIMARY, boxShadow: "0 0 8px rgba(34,111,163,0.6)" }}
      />
    );
  }
  return (
    <div
      className="w-2 h-2 rounded-full bg-white border"
      style={{ borderColor: `${PRIMARY}80` }}
    />
  );
}

function MacroRing({
  size,
  stroke,
  color,
  offset,
}: {
  size: string;
  stroke: number;
  color: string;
  offset: number;
}) {
  return (
    <svg className={`absolute ${size} -rotate-90`} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="transparent" stroke={TRACK} strokeWidth={stroke} />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="transparent"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="282.7"
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function MicroRing({ label, letter, offset }: { label: string; letter: string; offset: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke={TRACK} strokeWidth="12" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={PRIMARY}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={offset}
          />
        </svg>
        <span className="text-[12px] font-bold" style={{ color: INK }}>
          {letter}
        </span>
      </div>
      <span className="text-[10px] uppercase font-bold" style={{ color: PRIMARY }}>
        {label}
      </span>
    </div>
  );
}

// ---------- Main page ----------
export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { user, readiness, todayFocus, nutrition } = mockData;

  return (
    <AthleteLayout>
      <div className="min-h-full bg-slate-50 font-[Inter]">
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
          <div className="flex justify-between items-center w-full max-w-lg mx-auto px-6 py-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
              <img
                alt={`${user.name} avatar`}
                className="w-full h-full object-cover"
                src={user.avatar}
              />
            </div>
            <h1
              className="font-[Manrope] font-black tracking-tighter text-xl"
              style={{ color: INK }}
            >
              LUMINA
            </h1>
            <button
              aria-label="Notifications"
              className="relative text-slate-600 hover:text-slate-900 transition-colors active:scale-95 duration-200"
            >
              <Bell className="h-6 w-6" />
              <span
                className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white"
                style={{ background: PRIMARY }}
              />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="w-full max-w-lg mx-auto px-5 pt-3 pb-24 space-y-3">
          {/* Readiness */}
          <section className="bg-[#EAF5FF] border border-slate-200/70 rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] pointer-events-none"
              style={{ background: `${PRIMARY}1A` }}
            />
            <div className="flex flex-col gap-4 z-10 w-1/2">
              <h2
                className="font-[Manrope] text-2xl font-semibold mb-2"
                style={{ color: PRIMARY }}
              >
                Readiness
              </h2>
              {readiness.metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                    {m.label}
                  </span>
                  <MetricIndicator kind={m.indicator} />
                </div>
              ))}
            </div>
            <ReadinessGauge score={readiness.score} />
          </section>

          {/* Today's Focus */}
          <section className="bg-[#EAF5FF] border border-slate-200/70 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}0D, transparent)` }}
            />
            <div className="z-10 mb-6">
              <span
                className="text-[12px] font-semibold uppercase tracking-widest block mb-1"
                style={{ color: `${PRIMARY}99` }}
              >
                Today's Focus
              </span>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[#50768E]">
                  ⏱ {todayFocus.duration}  •  ⚡ {todayFocus.intensity}
                </span>
              </div>
              <h2
                className="font-[Manrope] text-2xl font-semibold leading-tight"
                style={{ color: PRIMARY }}
              >
                {todayFocus.title}
              </h2>
            </div>
            <button
              onClick={() => navigate("/athlete/training")}
              className="z-10 w-full text-white font-semibold py-4 px-6 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-200"
              style={{ background: PRIMARY }}
            >
              Start Session
              <Play className="h-5 w-5 fill-white" />
            </button>
          </section>

          {/* Nutrition */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col w-1/2">
                <h2
                  className="font-[Manrope] text-[20px] font-semibold mb-4"
                  style={{ color: INK }}
                >
                  Nutrition
                </h2>
                <div className="space-y-4">
                  {nutrition.macros.map((m) => (
                    <div key={m.label} className="flex flex-col">
                      <span
                        className="text-[12px] font-semibold uppercase"
                        style={{ color: PRIMARY }}
                      >
                        {m.label}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="font-[Manrope] text-4xl font-bold leading-tight"
                          style={{ color: INK }}
                        >
                          {m.value}
                        </span>
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: PRIMARY }}
                        >
                          g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-1/2 flex items-center justify-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {nutrition.rings.map((r, i) => (
                    <MacroRing
                      key={i}
                      size={r.size}
                      stroke={r.stroke}
                      color={r.color}
                      offset={r.offset}
                    />
                  ))}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span
                      className="text-[11px] font-bold whitespace-nowrap"
                      style={{ color: INK }}
                    >
                      {nutrition.deficitKcal} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-around items-center pt-4 border-t border-slate-200">
              {nutrition.micros.map((m) => (
                <MicroRing key={m.label} label={m.label} letter={m.letter} offset={m.offset} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </AthleteLayout>
  );
}
