import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  ChevronDown,
  Trophy,
  Award,
} from "lucide-react";

// ---------- Tokens ----------
const PRIMARY = "#005685";
const PRIMARY_CONTAINER = "#226fa3";
const ON_BG = "#001e2d";
const ON_SURFACE_VARIANT = "#40474f";
const SURFACE = "#f5faff";
const SURFACE_LOW = "#eaf5ff";
const SURFACE_VARIANT = "#c5e7ff";
const TRACK = "#dceefb";
const SUCCESS = "#16a34a";
const WARN = "#f59e0b";

// ---------- Types ----------
interface TrendPoint {
  month: string;
  value: number;
}

interface VolumeRow {
  muscle: string;
  done: number;
  target: number;
  tone?: "primary" | "warn";
}

interface PersonalRecord {
  id: string;
  exercise: string;
  detail: string;
  when: string;
}

export interface TrainingMetricsData {
  e1rm: {
    exercise: string;
    value: number;
    unit: string;
    deltaLabel: string;
    trend: TrendPoint[];
  };
  weeklyVolume: { value: string; deltaLabel: string };
  averageRpe: { value: number; subtitle: string };
  distribution: VolumeRow[];
  records: PersonalRecord[];
}

const mockData: TrainingMetricsData = {
  e1rm: {
    exercise: "Back Squat",
    value: 142.5,
    unit: "kg",
    deltaLabel: "+2.5 kg questo mese",
    trend: [
      { month: "Feb", value: 134 },
      { month: "Feb", value: 135.5 },
      { month: "Mar", value: 137 },
      { month: "Mar", value: 139 },
      { month: "Apr", value: 141 },
      { month: "Apr", value: 142.5 },
    ],
  },
  weeklyVolume: { value: "42.8k", deltaLabel: "+5% vs w1" },
  averageRpe: { value: 8.2, subtitle: "Ottimale per ipertrofia" },
  distribution: [
    { muscle: "Quadricipiti", done: 12, target: 14, tone: "primary" },
    { muscle: "Pettorali", done: 10, target: 12, tone: "primary" },
    { muscle: "Femorali", done: 6, target: 12, tone: "warn" },
  ],
  records: [
    {
      id: "r1",
      exercise: "Romanian Deadlift",
      detail: "Nuovo 8RM: 110 kg",
      when: "Oggi",
    },
    {
      id: "r2",
      exercise: "Overhead Press",
      detail: "Nuovo Max Vol: 60 kg x 10",
      when: "2 gg fa",
    },
  ],
};

// ---------- Subcomponents ----------
function MetricCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border p-5 ${className}`}
      style={{ borderColor: SURFACE_VARIANT }}
    >
      {children}
    </div>
  );
}

function E1rmCard({ data }: { data: TrainingMetricsData["e1rm"] }) {
  return (
    <MetricCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p
            className="text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: ON_SURFACE_VARIANT }}
          >
            Forza Stimata (e1RM)
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className="text-5xl tabular-nums"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                color: PRIMARY,
              }}
            >
              {data.value}
            </span>
            <span
              className="text-base font-semibold"
              style={{ color: ON_SURFACE_VARIANT }}
            >
              {data.unit}
            </span>
          </div>
          <div
            className="flex items-center gap-1 mt-1 text-xs font-semibold"
            style={{ color: SUCCESS }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{data.deltaLabel}</span>
          </div>
        </div>
        <button
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold"
          style={{ background: SURFACE_LOW, color: PRIMARY }}
        >
          {data.exercise}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="h-32 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="e1rmFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.25} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: ON_SURFACE_VARIANT }}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={["dataMin - 4", "dataMax + 2"]} />
            <Tooltip
              cursor={{ stroke: PRIMARY, strokeOpacity: 0.2 }}
              contentStyle={{
                background: "white",
                border: `1px solid ${SURFACE_VARIANT}`,
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} kg`, "e1RM"]}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={PRIMARY}
              strokeWidth={2.5}
              fill="url(#e1rmFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MetricCard>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  subtitleTone = "muted",
}: {
  label: string;
  value: string | number;
  subtitle: string;
  subtitleTone?: "muted" | "success";
}) {
  return (
    <MetricCard className="flex flex-col gap-1">
      <p
        className="text-[11px] font-semibold tracking-[0.12em] uppercase leading-tight"
        style={{ color: ON_SURFACE_VARIANT }}
      >
        {label}
      </p>
      <span
        className="text-4xl tabular-nums leading-tight"
        style={{
          fontFamily: "Manrope, sans-serif",
          fontWeight: 700,
          color: PRIMARY,
        }}
      >
        {value}
      </span>
      <span
        className="text-xs font-semibold"
        style={{ color: subtitleTone === "success" ? SUCCESS : ON_SURFACE_VARIANT }}
      >
        {subtitle}
      </span>
    </MetricCard>
  );
}

function VolumeBar({ row }: { row: VolumeRow }) {
  const pct = Math.min(100, Math.round((row.done / row.target) * 100));
  const barColor = row.tone === "warn" ? WARN : PRIMARY;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold" style={{ color: ON_BG }}>
          {row.muscle}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: ON_SURFACE_VARIANT }}
        >
          {row.done}/{row.target} Set
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: TRACK }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function PRItem({ pr }: { pr: PersonalRecord }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#dcfce7" }}
      >
        <Award className="w-5 h-5" style={{ color: SUCCESS }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: ON_BG }}>
          {pr.exercise}
        </p>
        <p className="text-xs font-semibold truncate" style={{ color: SUCCESS }}>
          {pr.detail}
        </p>
      </div>
      <span
        className="text-xs font-medium flex-shrink-0"
        style={{ color: ON_SURFACE_VARIANT }}
      >
        {pr.when}
      </span>
    </div>
  );
}

// ---------- Main ----------
interface Props {
  data?: TrainingMetricsData;
  defaultTab?: "diario" | "metriche";
  onTabChange?: (tab: "diario" | "metriche") => void;
}

export default function TrainingMetrics({
  data = mockData,
  defaultTab = "metriche",
  onTabChange,
}: Props) {
  const [tab, setTab] = useState<"diario" | "metriche">(defaultTab);

  const handleTab = (next: "diario" | "metriche") => {
    setTab(next);
    onTabChange?.(next);
  };

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: SURFACE, fontFamily: "Inter, sans-serif" }}
    >
      {/* Tabs */}
      <div className="px-5 pt-4 pb-3">
        <div
          className="rounded-full p-1 flex"
          style={{ background: SURFACE_LOW }}
        >
          {(["diario", "metriche"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => handleTab(t)}
                className="flex-1 py-2 rounded-full text-sm font-semibold capitalize transition"
                style={{
                  background: active ? "white" : "transparent",
                  color: active ? PRIMARY : ON_SURFACE_VARIANT,
                  boxShadow: active ? "0 1px 3px rgba(0,30,45,0.08)" : "none",
                }}
              >
                {t === "diario" ? "Diario" : "Metriche"}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-5 space-y-4">
        {/* e1RM */}
        <E1rmCard data={data.e1rm} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Volume Settimanale"
            value={data.weeklyVolume.value}
            subtitle={data.weeklyVolume.deltaLabel}
            subtitleTone="success"
          />
          <StatCard
            label="Sforzo Medio (RPE)"
            value={data.averageRpe.value}
            subtitle={data.averageRpe.subtitle}
          />
        </div>

        {/* Distribuzione Volume */}
        <MetricCard>
          <h3
            className="text-lg mb-4"
            style={{
              fontFamily: "Manrope, sans-serif",
              fontWeight: 700,
              color: ON_BG,
            }}
          >
            Distribuzione Volume
          </h3>
          <div className="space-y-4">
            {data.distribution.map((row) => (
              <VolumeBar key={row.muscle} row={row} />
            ))}
          </div>
        </MetricCard>

        {/* Record Recenti */}
        <div
          className="rounded-2xl bg-white border-l-4 border p-5"
          style={{
            borderLeftColor: SUCCESS,
            borderTopColor: SURFACE_VARIANT,
            borderRightColor: SURFACE_VARIANT,
            borderBottomColor: SURFACE_VARIANT,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" style={{ color: SUCCESS }} />
            <h3
              className="text-lg"
              style={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                color: ON_BG,
              }}
            >
              Record Recenti
            </h3>
          </div>
          <div className="space-y-4">
            {data.records.map((pr) => (
              <PRItem key={pr.id} pr={pr} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
