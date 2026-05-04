import { useMemo, useState } from "react";
import { MoreVertical, ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface WeightDataPoint {
  date: string; // ISO
  weightKg: number;
}

interface WeightTrendAnalysisProps {
  data: WeightDataPoint[];
  unit?: "kg" | "lb";
  onMenuClick?: () => void;
  avatarUrl?: string;
  title?: string;
}

type RangeKey = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

const RANGE_DAYS: Record<RangeKey, number | null> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  ALL: null,
};

// Simple EMA smoothing for trend calculation
function calculateTrend(points: WeightDataPoint[], alpha = 0.1): number[] {
  if (points.length === 0) return [];
  const trend: number[] = [points[0].weightKg];
  for (let i = 1; i < points.length; i++) {
    trend.push(alpha * points[i].weightKg + (1 - alpha) * trend[i - 1]);
  }
  return trend;
}

function avgOverDays(points: WeightDataPoint[], days: number): number | null {
  if (points.length === 0) return null;
  const cutoff = Date.now() - days * 86400000;
  const slice = points.filter((p) => new Date(p.date).getTime() >= cutoff);
  if (slice.length === 0) return null;
  return slice.reduce((sum, p) => sum + p.weightKg, 0) / slice.length;
}

export function WeightTrendAnalysis({
  data,
  unit = "kg",
  onMenuClick,
  avatarUrl,
  title = "Weight Analysis",
}: WeightTrendAnalysisProps) {
  const [range, setRange] = useState<RangeKey>("3M");

  const filtered = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const days = RANGE_DAYS[range];
    if (!days) return sorted;
    const cutoff = Date.now() - days * 86400000;
    return sorted.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [data, range]);

  const trend = useMemo(() => calculateTrend(filtered), [filtered]);

  const chartData = useMemo(
    () =>
      filtered.map((p, i) => ({
        date: p.date,
        scale: p.weightKg,
        trend: trend[i],
      })),
    [filtered, trend]
  );

  const currentAvg = trend[trend.length - 1] ?? null;
  const previousAvg = trend[0] ?? null;
  const delta =
    currentAvg !== null && previousAvg !== null ? currentAvg - previousAvg : 0;

  const change3 = useMemo(() => {
    const cur = avgOverDays(data, 3);
    const prev = avgOverDays(data, 7);
    return cur !== null && prev !== null ? cur - prev : null;
  }, [data]);

  const change7 = useMemo(() => {
    const cur = avgOverDays(data, 7);
    const prev = avgOverDays(data, 14);
    return cur !== null && prev !== null ? cur - prev : null;
  }, [data]);

  const change30 = useMemo(() => {
    const cur = avgOverDays(data, 30);
    const prev = avgOverDays(data, 60);
    return cur !== null && prev !== null ? cur - prev : null;
  }, [data]);

  const dateRangeLabel = useMemo(() => {
    if (filtered.length === 0) return "—";
    const start = new Date(filtered[0].date);
    const end = new Date(filtered[filtered.length - 1].date);
    return `${format(start, "d MMM", { locale: it })} - ${format(end, "d MMM yyyy", { locale: it })}`;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="h-9 w-9 rounded-full bg-muted overflow-hidden">
            {avatarUrl && (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <h1 className="font-display text-base font-semibold text-primary">
            {title}
          </h1>
          <button
            onClick={onMenuClick}
            className="text-muted-foreground"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6">
        {/* Hero */}
        <section className="text-center space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Media Attuale
          </div>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-display text-5xl font-bold text-primary tabular-nums">
              {currentAvg !== null ? currentAvg.toFixed(1) : "—"}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{unit}</span>
          </div>
          {currentAvg !== null && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
                delta < 0
                  ? "bg-primary/10 text-primary"
                  : delta > 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {delta < 0 ? (
                <ArrowDown className="h-3 w-3" />
              ) : delta > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : null}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} {unit}
            </div>
          )}
          <div className="text-sm text-muted-foreground pt-1">{dateRangeLabel}</div>
        </section>

        {/* Range selector */}
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(RANGE_DAYS) as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground hover:bg-muted"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) =>
                    format(new Date(v as string), "d MMM yyyy", { locale: it })
                  }
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)} ${unit}`,
                    name === "scale" ? "Peso Bilancia" : "Trend",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="scale"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  dot={false}
                  opacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 pt-3 border-t mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
              Peso Bilancia
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Trend Calcolato
            </div>
          </div>
        </div>

        {/* Changes */}
        <section className="bg-card rounded-2xl border p-5 shadow-sm">
          <h2 className="font-display text-xl font-bold text-primary mb-4">
            Cambiamenti Peso
          </h2>
          <div className="divide-y">
            <ChangeRow label="3 Giorni" delta={change3} unit={unit} />
            <ChangeRow label="7 Giorni" delta={change7} unit={unit} />
            <ChangeRow label="30 Giorni" delta={change30} unit={unit} />
          </div>
        </section>
      </main>
    </div>
  );
}

function ChangeRow({
  label,
  delta,
  unit,
}: {
  label: string;
  delta: number | null;
  unit: string;
}) {
  const isDown = delta !== null && delta < 0;
  const isUp = delta !== null && delta > 0;
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums",
          isDown && "text-primary",
          isUp && "text-destructive",
          delta === null && "text-muted-foreground"
        )}
      >
        {isDown ? (
          <TrendingDown className="h-4 w-4" />
        ) : isUp ? (
          <TrendingUp className="h-4 w-4" />
        ) : null}
        {delta === null
          ? "—"
          : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${unit}`}
      </span>
    </div>
  );
}
