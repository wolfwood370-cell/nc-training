import { ChevronLeft, MoreVertical, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface FactorRow {
  key: string;
  label: string;
  value: number;
  highlight?: boolean;
}

const mockFactors: FactorRow[] = [
  { key: "sleep", label: "Sleep", value: 8 },
  { key: "energy", label: "Energy", value: 7 },
  { key: "soreness", label: "Soreness", value: 4, highlight: true },
  { key: "stress", label: "Stress", value: 3 },
  { key: "mood", label: "Mood", value: 9 },
  { key: "digestion", label: "Digestion", value: 8 },
];

const trendData = [
  { day: "M", value: 3 },
  { day: "T", value: 2 },
  { day: "W", value: 5 },
  { day: "T", value: 4 },
  { day: "F", value: 5 },
  { day: "S", value: 3 },
  { day: "S", value: 4 },
];

const overallScore = 82;

interface SorenessDeepDiveProps {
  onBack?: () => void;
}

function FactorBar({ factor }: { factor: FactorRow }) {
  const pct = (factor.value / 10) * 100;
  const isHighlight = factor.highlight;

  return (
    <div
      className={
        isHighlight
          ? "rounded-2xl bg-primary/10 px-4 py-3"
          : "px-1 py-1"
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isHighlight && <Activity className="h-4 w-4 text-primary" />}
          <span
            className={`text-xs font-semibold tracking-wider uppercase ${
              isHighlight ? "text-primary" : "text-foreground/80"
            }`}
          >
            {factor.label}
          </span>
        </div>
        <span
          className={`text-sm font-bold ${
            isHighlight ? "text-primary" : "text-foreground"
          }`}
        >
          {factor.value}/10
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-primary/15 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isHighlight ? "bg-primary" : "bg-muted-foreground/60"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SorenessDeepDive({ onBack }: SorenessDeepDiveProps) {
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-background pb-24" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <ChevronLeft className="h-6 w-6 text-primary" />
          </button>
          <h1
            className="text-lg font-bold text-primary"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Readiness Analysis
          </h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="h-5 w-5 text-foreground/70" />
          </button>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-5">
        {/* Score ring */}
        <section className="flex flex-col items-center pt-2">
          <div className="relative h-44 w-44">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--primary) / 0.15)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-5xl font-extrabold text-primary"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {overallScore}
              </span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-foreground/60 mt-1">
                OVERALL
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <button className="w-full rounded-full bg-primary text-primary-foreground py-4 font-semibold text-base shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-[0.99] transition">
          Log Today's Readiness
        </button>

        {/* Today's Factors */}
        <section className="rounded-3xl bg-card border border-border p-5 shadow-sm">
          <h2
            className="text-xl font-bold text-foreground mb-4"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Today's Factors
          </h2>
          <div className="space-y-3">
            {mockFactors.map((f) => (
              <FactorBar key={f.key} factor={f} />
            ))}
          </div>
        </section>

        {/* Trend */}
        <section className="rounded-3xl bg-card border-l-4 border-l-primary border-y border-r border-border p-5 shadow-sm">
          <h2
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            7-Day Trend: Soreness
          </h2>
          <p className="text-sm text-foreground/70 mt-2 mb-4 leading-relaxed">
            Recovery is tracking well. Maintained moderate levels this week.
          </p>
          <div className="h-44 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sorenessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="transparent" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis hide domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#sorenessGrad)"
                  dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
}
