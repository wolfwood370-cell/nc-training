import {
  Settings,
  Clock,
  Zap,
  BarChart3,
  RotateCw,
  ChevronsUpDown,
  ChevronRight,
  StretchHorizontal,
  Dumbbell,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

// ---------- Types ----------
interface CalendarDay {
  weekday: string;
  day: number;
  isActive?: boolean;
}

interface MainWorkout {
  tag: string;
  title: string;
  durationMin: number;
  rpeTarget: number;
  contextImage: string;
}

interface WeeklyLoad {
  totalKg: number;
  bars: number[]; // 0-100
}

interface Readiness {
  label: string;
  scorePct: number;
}

interface TrainingPhase {
  id: string;
  title: string;
  exerciseCount: number;
  durationMin: number;
  icon: LucideIcon;
  accent: "muted" | "primary";
}

interface TrainingHubData {
  athleteName: string;
  avatar: string;
  calendar: CalendarDay[];
  mainWorkout: MainWorkout;
  weeklyLoad: WeeklyLoad;
  readiness: Readiness;
  phases: TrainingPhase[];
}

// ---------- Mock data ----------
const PRIMARY = "#226FA3";
const INK = "#043555";
const MUTED = "#50768E";

const mockData: TrainingHubData = {
  athleteName: "Athlete",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA6GyxNQ7gBkL9bFAUZx2-02Qd0KnJZzEdLiGLgEPwUZuge7IYlxiIQ6hbqXUq2L0KZUPMveQX6xauxm-xesxmTtOoYTuZpzobnfjs-9M6WOA78XInI7bXm7_rFwGeb3CIqLN7SGKwkl4jQv0bzVLANBIjvz5FCAjHs5mE-L2wmKFlTZdKownDP-nrnVx3HB-jF_Jnx50G5CWZ-pwNUjr-nNshiT7xU_692Mf7siDVRE6uGC7tGx4zbEnWiv4doc-PqHW_2pC378Iu7",
  calendar: [
    { weekday: "M", day: 11 },
    { weekday: "T", day: 12 },
    { weekday: "W", day: 13 },
    { weekday: "T", day: 14 },
    { weekday: "F", day: 15 },
    { weekday: "S", day: 16, isActive: true },
    { weekday: "S", day: 17 },
  ],
  mainWorkout: {
    tag: "Main Workout",
    title: "Lower Body Power & Hypertrophy",
    durationMin: 60,
    rpeTarget: 8,
    contextImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAo-HNU-NgTrM0A8murMroy7JTPDWsyn5qpOQI85mLU4BhOAzkxHeE_DlqgEeR7BTVpTWBELAycFsPdqD4HDxxArigfbl35f0h1przXmI_qYzWf804yJJnRiVK8veGRM0MuF6RzfBs5rLkqMFyUPOleHXV4nlhQQNYVpUNoW-f0pyX4f6e_QjTa3wan_YQ2NzQXqFw-tLC7hH4uX53AP6FK1DWtyY42iBTnhMwdDk0skqtIYN7JmPP_kRSq9e2BMgeq5Tc4b_mHcBEq",
  },
  weeklyLoad: {
    totalKg: 12450,
    bars: [40, 60, 50, 85, 75],
  },
  readiness: {
    label: "Ottima",
    scorePct: 85,
  },
  phases: [
    {
      id: "prep",
      title: "Movement Prep",
      exerciseCount: 3,
      durationMin: 10,
      icon: StretchHorizontal,
      accent: "muted",
    },
    {
      id: "main",
      title: "Main Session",
      exerciseCount: 5,
      durationMin: 45,
      icon: Dumbbell,
      accent: "primary",
    },
  ],
};

// ---------- Subcomponents ----------
function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white/70 backdrop-blur-xl ${className}`}
      style={{ borderColor: "rgba(80,118,142,0.15)" }}
    >
      {children}
    </div>
  );
}

function SegmentedControl({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="p-1 rounded-full flex w-full" style={{ background: "#D2ECFF" }}>
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex-1 py-2 px-4 rounded-full font-[Manrope] text-sm transition-all active:scale-[0.98] ${
              isActive ? "bg-white shadow-sm font-bold" : "font-semibold"
            }`}
            style={{ color: isActive ? INK : "#3B6284" }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function MicroCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <div className="flex justify-between items-center py-2 overflow-x-auto"
         style={{ scrollbarWidth: "none" }}>
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-10">
          <span
            className="text-xs font-semibold"
            style={{ color: d.isActive ? PRIMARY : MUTED }}
          >
            {d.weekday}
          </span>
          <div className="relative">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full font-[Manrope] font-bold transition-colors"
              style={{
                background: d.isActive ? PRIMARY : "transparent",
                color: d.isActive ? "#fff" : MUTED,
              }}
            >
              {d.day}
            </div>
            {d.isActive && (
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: PRIMARY }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroWorkoutCard({ workout }: { workout: MainWorkout }) {
  return (
    <GlassCard className="p-6 overflow-hidden relative border-l-4" >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: PRIMARY }}
      />
      <div className="relative z-10">
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
          style={{ color: PRIMARY, background: `${PRIMARY}1A` }}
        >
          {workout.tag}
        </span>
        <h2
          className="font-[Manrope] text-2xl font-semibold mt-2 leading-tight"
          style={{ color: INK }}
        >
          {workout.title}
        </h2>
        <div
          className="flex items-center gap-4 mt-4 text-xs font-semibold"
          style={{ color: MUTED }}
        >
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {workout.durationMin} Min Est.
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            RPE Target: {workout.rpeTarget}
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-full opacity-10 pointer-events-none">
        <img
          alt="Workout context"
          className="w-full h-full object-cover"
          src={workout.contextImage}
        />
      </div>
    </GlassCard>
  );
}

function WeeklyLoadCard({ load }: { load: WeeklyLoad }) {
  return (
    <GlassCard className="p-5 flex flex-col justify-between h-36">
      <div>
        <div className="flex justify-between items-start">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: MUTED }}
          >
            Carico Sett.
          </span>
          <BarChart3 className="h-4 w-4" style={{ color: MUTED }} />
        </div>
        <p
          className="font-[Manrope] text-2xl font-bold mt-1"
          style={{ color: INK }}
        >
          {load.totalKg.toLocaleString("it-IT")} kg
        </p>
      </div>
      <div
        className="w-full h-8 rounded flex items-end gap-1 px-1 overflow-hidden"
        style={{ background: "#EAF5FF" }}
      >
        {load.bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h}%`,
              background: PRIMARY,
              opacity: 0.2 + (i / load.bars.length) * 0.8,
            }}
          />
        ))}
      </div>
    </GlassCard>
  );
}

function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const dash = (readiness.scorePct / 100) * circumference;
  return (
    <GlassCard className="p-5 flex flex-col justify-between h-36">
      <div>
        <div className="flex justify-between items-start">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: MUTED }}
          >
            Prontezza
          </span>
          <div className="relative w-6 h-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r={r}
                fill="none"
                stroke="#50768E1A"
                strokeWidth="4"
              />
              <circle
                cx="18"
                cy="18"
                r={r}
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <RotateCw
              className="absolute inset-0 m-auto h-3 w-3 opacity-0"
              aria-hidden
            />
          </div>
        </div>
        <p
          className="font-[Manrope] text-2xl font-bold mt-1"
          style={{ color: INK }}
        >
          {readiness.label}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: "#10B981", background: "#10B9811A" }}
        >
          {readiness.scorePct}% Score
        </span>
      </div>
    </GlassCard>
  );
}

function PhaseRow({
  phase,
  onClick,
}: {
  phase: TrainingPhase;
  onClick?: () => void;
}) {
  const Icon = phase.icon;
  const isPrimary = phase.accent === "primary";
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border bg-white/70 backdrop-blur-xl p-4 flex items-center justify-between border-l-2 hover:bg-white/90 active:scale-[0.99] transition-all"
      style={{
        borderColor: "rgba(80,118,142,0.15)",
        borderLeftColor: isPrimary ? PRIMARY : "#E2E8F0",
        borderLeftWidth: 2,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isPrimary ? `${PRIMARY}1A` : "#DEF0FF",
            color: isPrimary ? PRIMARY : INK,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="font-[Manrope] font-bold" style={{ color: INK }}>
            {phase.title}
          </p>
          <p className="text-[11px] font-semibold" style={{ color: MUTED }}>
            {phase.exerciseCount} Esercizi • {phase.durationMin} min
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-300" />
    </button>
  );
}

// ---------- Main component ----------
interface DailyTrainingHubProps {
  data?: TrainingHubData;
  onStart?: () => void;
  onPhaseClick?: (phaseId: string) => void;
}

export function DailyTrainingHub({
  data = mockData,
  onStart,
  onPhaseClick,
}: DailyTrainingHubProps) {
  return (
    <div className="min-h-full font-[Inter] pb-40" style={{ background: "#F5FAFF" }}>
      {/* Top app bar */}
      <header
        className="sticky top-0 z-30 bg-white/70 backdrop-blur-2xl border-b border-slate-200/40 flex justify-between items-center px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
            <img
              alt={`${data.athleteName} avatar`}
              className="w-full h-full object-cover"
              src={data.avatar}
            />
          </div>
          <h1
            className="font-[Manrope] font-bold text-lg tracking-tight"
            style={{ color: INK }}
          >
            Training
          </h1>
        </div>
        <button
          aria-label="Impostazioni"
          className="text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
        >
          <Settings className="h-6 w-6" />
        </button>
      </header>

      <main className="px-5 mt-6 space-y-6 max-w-lg mx-auto">
        <SegmentedControl
          tabs={["Diario", "Metriche"]}
          active="Diario"
          onChange={() => {}}
        />

        <MicroCalendar days={data.calendar} />

        <HeroWorkoutCard workout={data.mainWorkout} />

        <div className="grid grid-cols-2 gap-3">
          <WeeklyLoadCard load={data.weeklyLoad} />
          <ReadinessCard readiness={data.readiness} />
        </div>

        <div className="space-y-4">
          <h3
            className="font-[Manrope] font-bold px-2 flex justify-between items-center"
            style={{ color: INK }}
          >
            Fasi dell'Allenamento
            <ChevronsUpDown className="h-4 w-4" />
          </h3>
          <div className="space-y-2">
            {data.phases.map((p) => (
              <PhaseRow
                key={p.id}
                phase={p}
                onClick={() => onPhaseClick?.(p.id)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-24 left-0 w-full px-5 z-40 max-w-lg mx-auto right-0">
        <button
          onClick={onStart}
          className="w-full py-5 text-white rounded-2xl font-[Manrope] font-bold text-lg shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          style={{ background: INK }}
        >
          Inizia Allenamento
          <PlayCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default DailyTrainingHub;
