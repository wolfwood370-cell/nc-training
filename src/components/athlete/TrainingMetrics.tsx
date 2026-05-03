import { useState } from "react";
import {
  User,
  Settings,
  TrendingUp,
  ChevronDown,
  Trophy,
  Award,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface E1rmPoint {
  month: string;
  value: number;
}

export interface VolumeDistributionItem {
  muscle: string;
  completed: number;
  planned: number;
  warning?: boolean;
}

export interface PersonalRecord {
  id: string;
  exercise: string;
  achievement: string;
  when: string;
}

export interface TrainingMetricsProps {
  exercises: string[];
  selectedExercise: string;
  onExerciseChange: (ex: string) => void;
  e1rm: number;
  e1rmDelta: number;
  e1rmTrend: E1rmPoint[];
  weeklyVolume: number;
  weeklyVolumeDelta: number;
  avgRpe: number;
  avgRpeNote: string;
  distribution: VolumeDistributionItem[];
  records: PersonalRecord[];
  activeTab?: "diario" | "metriche";
  onTabChange?: (tab: "diario" | "metriche") => void;
  onProfile?: () => void;
  onSettings?: () => void;
}

export const TrainingMetrics = ({
  exercises,
  selectedExercise,
  onExerciseChange,
  e1rm,
  e1rmDelta,
  e1rmTrend,
  weeklyVolume,
  weeklyVolumeDelta,
  avgRpe,
  avgRpeNote,
  distribution,
  records,
  activeTab = "metriche",
  onTabChange,
  onProfile,
  onSettings,
}: TrainingMetricsProps) => {
  const [tab, setTab] = useState<"diario" | "metriche">(activeTab);

  const handleTab = (t: "diario" | "metriche") => {
    setTab(t);
    onTabChange?.(t);
  };

  return (
    <div className="min-h-screen bg-background font-[Inter] pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onProfile}
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            aria-label="Profile"
          >
            <User className="w-5 h-5" />
          </button>
          <h1 className="font-[Manrope] font-bold text-2xl text-primary">Training Hub</h1>
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 bg-primary/5 rounded-full p-1">
          {(["diario", "metriche"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`h-9 rounded-full text-sm font-[Manrope] font-semibold capitalize transition-all ${
                tab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "diario" ? "Diario" : "Metriche"}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* e1RM */}
        <section className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-[Manrope] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Forza Stimata (e1RM)
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-[Manrope] font-bold text-5xl text-foreground">
                  {e1rm.toLocaleString("it-IT")}
                </span>
                <span className="text-muted-foreground text-lg">kg</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                {e1rmDelta >= 0 ? "+" : ""}
                {e1rmDelta} kg questo mese
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-3 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {selectedExercise}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {exercises.map((ex) => (
                  <DropdownMenuItem key={ex} onClick={() => onExerciseChange(ex)}>
                    {ex}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="h-32 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={e1rmTrend} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="e1rmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} kg`, "e1RM"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#e1rmFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Volume + RPE */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="font-[Manrope] font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Volume Settimanale
            </p>
            <p className="mt-2 font-[Manrope] font-bold text-3xl text-foreground">
              {(weeklyVolume / 1000).toFixed(1).replace(".", ",")}k
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                weeklyVolumeDelta >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {weeklyVolumeDelta >= 0 ? "+" : ""}
              {weeklyVolumeDelta}% vs w1
            </p>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="font-[Manrope] font-semibold text-xs uppercase tracking-wider text-muted-foreground leading-tight">
              Sforzo Medio (RPE)
            </p>
            <p className="mt-2 font-[Manrope] font-bold text-3xl text-foreground">
              {avgRpe.toFixed(1).replace(".", ",")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{avgRpeNote}</p>
          </div>
        </div>

        {/* Distribution */}
        <section className="bg-card rounded-2xl p-5 border border-border space-y-4">
          <h2 className="font-[Manrope] font-bold text-xl text-foreground">
            Distribuzione Volume
          </h2>
          <div className="space-y-3">
            {distribution.map((d) => {
              const pct = Math.min(100, (d.completed / d.planned) * 100);
              return (
                <div key={d.muscle} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">{d.muscle}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.completed}/{d.planned} Set
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        d.warning ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Records */}
        <section className="bg-card rounded-2xl p-5 border border-border border-l-4 border-l-emerald-500 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-600" />
            <h2 className="font-[Manrope] font-bold text-lg text-foreground">Record Recenti</h2>
          </div>

          <ul className="space-y-3">
            {records.map((r) => (
              <li key={r.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{r.exercise}</p>
                  <p className="text-sm font-semibold text-emerald-600">{r.achievement}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-1">
                  {r.when}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default TrainingMetrics;
