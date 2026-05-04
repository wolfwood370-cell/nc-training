import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  TrendingUp,
  Trophy,
  Medal,
} from "lucide-react";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";
import { useAuth } from "@/hooks/useAuth";
import {
  useAthleteStrengthProgression,
  useAthleteVolumeIntensity,
} from "@/hooks/useAthleteAnalytics";
import { subDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

// TODO: Wire VOLUME_ROWS to a per-muscle-group analytics view when available.
const VOLUME_ROWS = [
  { label: "Quadricipiti", sets: "12/14 Set", pct: 85, color: "bg-primary" },
  { label: "Pettorali", sets: "10/12 Set", pct: 80, color: "bg-primary" },
  { label: "Femorali", sets: "6/12 Set", pct: 50, color: "bg-amber-500" },
];

function buildSparklinePath(
  values: number[],
  width = 320,
  height = 100,
): { line: string; fill: string } {
  if (values.length === 0) {
    return {
      line: `M 5 ${height - 10} L ${width - 5} ${height - 10}`,
      fill: `M 5 ${height - 10} L ${width - 5} ${height - 10} L ${width - 5} ${height} L 5 ${height} Z`,
    };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = values.length > 1 ? (width - 10) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = 5 + i * stepX;
    const y = 10 + (1 - (v - min) / range) * (height - 20);
    return [x, y] as const;
  });
  const line = points
    .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  const fill = `${line} L ${last[0]} ${height} L ${first[0]} ${height} Z`;
  return { line, fill };
}

export default function AthleteTrainingMetrics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const athleteId = user?.id;

  // Default tracked exercise — TODO: wire to a "primary lift" preference picker.
  const trackedExercise = "Back Squat";
  const { data: strengthData = [] } = useAthleteStrengthProgression(
    athleteId,
    trackedExercise,
  );
  const { data: volumeData = [] } = useAthleteVolumeIntensity(athleteId);

  // e1RM derived stats
  const latestE1RM = strengthData.length
    ? strengthData[strengthData.length - 1].estimated1RM
    : null;
  const monthAgoCutoff = subDays(new Date(), 30);
  const baselineE1RM = useMemo(() => {
    const older = strengthData.filter(
      (p) => parseISO(p.date) < monthAgoCutoff,
    );
    return older.length ? older[older.length - 1].estimated1RM : null;
  }, [strengthData, monthAgoCutoff]);
  const monthDelta =
    latestE1RM !== null && baselineE1RM !== null
      ? latestE1RM - baselineE1RM
      : null;
  const sparkline = useMemo(
    () => buildSparklinePath(strengthData.map((p) => p.estimated1RM)),
    [strengthData],
  );
  const xLabels = useMemo(() => {
    if (strengthData.length === 0) return [] as string[];
    const idxs =
      strengthData.length >= 3
        ? [
            0,
            Math.floor(strengthData.length / 2),
            strengthData.length - 1,
          ]
        : strengthData.map((_, i) => i);
    return idxs.map((i) =>
      format(parseISO(strengthData[i].date), "MMM", { locale: it }),
    );
  }, [strengthData]);

  // Volume + RPE stats (last 7 days vs previous 7)
  const now = new Date();
  const last7 = volumeData.filter((p) => parseISO(p.date) >= subDays(now, 7));
  const prev7 = volumeData.filter(
    (p) =>
      parseISO(p.date) >= subDays(now, 14) &&
      parseISO(p.date) < subDays(now, 7),
  );
  const weeklyVolume = last7.reduce((s, p) => s + p.totalTonnage, 0);
  const prevVolume = prev7.reduce((s, p) => s + p.totalTonnage, 0);
  const volumeDeltaPct =
    prevVolume > 0
      ? Math.round(((weeklyVolume - prevVolume) / prevVolume) * 100)
      : null;
  const avgRpe = last7.length
    ? last7.reduce((s, p) => s + p.avgRpe, 0) / last7.length
    : null;
  const formatK = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);

  // Personal records — derived from strength progression for the tracked exercise.
  // TODO: aggregate PRs across all tracked lifts when a multi-exercise hook is available.
  const personalRecords = useMemo(() => {
    if (strengthData.length === 0) return [];
    let best = 0;
    const records: { title: string; detail: string; date: string }[] = [];
    for (const point of strengthData) {
      if (point.estimated1RM > best) {
        best = point.estimated1RM;
        records.push({
          title: point.exerciseName,
          detail: `Nuovo e1RM: ${point.estimated1RM.toFixed(1)} kg`,
          date: format(parseISO(point.date), "d MMM", { locale: it }),
        });
      }
    }
    return records.slice(-2).reverse();
  }, [strengthData]);

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
