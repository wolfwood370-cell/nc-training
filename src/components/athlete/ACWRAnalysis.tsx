import { ArrowLeft, Info, Lightbulb } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";

export interface ACWRTrendPoint {
  label: string;
  value: number;
}

export interface ACWRAnalysisProps {
  acwr?: number;
  zoneLabel?: string;
  zoneDescription?: string;
  acuteLoad?: string;
  chronicLoad?: string;
  trend?: ACWRTrendPoint[];
  insight?: string;
  onBack?: () => void;
  onInfo?: () => void;
  onOpenRecovery?: () => void;
  recoveryImage?: string;
}

const DEFAULT_TREND: ACWRTrendPoint[] = [
  { label: "4 Sett fa", value: 0.85 },
  { label: "3 Sett fa", value: 0.95 },
  { label: "2 Sett fa", value: 1.05 },
  { label: "Oggi", value: 1.15 },
];

// Gauge: 180° arc, value mapped 0.5..1.7
function Gauge({ value }: { value: number }) {
  const min = 0.5;
  const max = 1.7;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = (clamped - min) / (max - min);
  const angle = -90 + pct * 180; // -90 left, +90 right

  const cx = 100;
  const cy = 100;
  const r = 80;

  const arc = (start: number, end: number, color: string) => {
    const s = ((start - 90) * Math.PI) / 180;
    const e = ((end - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        stroke={color}
        strokeWidth={18}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg viewBox="0 0 200 120" className="w-56 h-32">
      {arc(0, 60, "hsl(45 95% 70%)")}
      {arc(60, 120, "hsl(150 60% 55%)")}
      {arc(120, 180, "hsl(0 75% 75%)")}
      {/* Needle */}
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - r + 6}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="hsl(var(--foreground))" />
      </g>
    </svg>
  );
}

export default function ACWRAnalysis({
  acwr = 1.15,
  zoneLabel = "Sweet Spot",
  zoneDescription = "Adattamento ottimale. Rischio infortuni minimizzato.",
  acuteLoad = "12,450 kg",
  chronicLoad = "10,820 kg",
  trend = DEFAULT_TREND,
  insight = "Il carico è aumentato gradualmente. Puoi procedere con il sovraccarico progressivo programmato per la seduta odierna.",
  recoveryImage,
  onBack,
  onInfo,
  onOpenRecovery,
}: ACWRAnalysisProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Indietro"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </button>
            <h1 className="font-[Manrope] font-bold text-base text-primary">
              Carico di Lavoro (ACWR)
            </h1>
          </div>
          <button
            onClick={onInfo}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Info"
          >
            <Info className="h-5 w-5 text-primary" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-10 space-y-5">
        {/* Gauge hero */}
        <section className="flex flex-col items-center text-center space-y-3">
          <Gauge value={acwr} />
          <div className="font-[Manrope] font-extrabold text-5xl text-primary tabular-nums -mt-2">
            {acwr.toFixed(2)}
          </div>
          <span className="inline-flex items-center px-4 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-bold">
            {zoneLabel}
          </span>
          <p className="text-sm text-foreground/70 max-w-xs">
            {zoneDescription}
          </p>
        </section>

        {/* Loads card */}
        <section className="bg-card rounded-2xl shadow-sm p-5">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="pr-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Carico Acuto (7gg)
              </p>
              <p className="font-[Manrope] font-bold text-2xl text-foreground tabular-nums">
                {acuteLoad}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Carico Cronico (28gg)
              </p>
              <p className="font-[Manrope] font-bold text-2xl text-foreground tabular-nums">
                {chronicLoad}
              </p>
            </div>
          </div>
        </section>

        {/* Trend card */}
        <section className="bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">
            Trend di Affaticamento
          </h3>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 18, right: 12, bottom: 4, left: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0.5, 1.5]} />
                <ReferenceArea
                  y1={0.8}
                  y2={1.3}
                  fill="hsl(150 60% 55%)"
                  fillOpacity={0.12}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (index !== trend.length - 1)
                      return <circle key={index} cx={cx} cy={cy} r={0} />;
                    return (
                      <g key={index}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill="hsl(var(--primary))"
                          fillOpacity={0.18}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="hsl(var(--primary))"
                        />
                      </g>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <span className="absolute top-2 right-3 text-[10px] font-bold tracking-wider text-emerald-700">
              OPTIMAL ZONE
            </span>
          </div>
        </section>

        {/* Insight */}
        <section className="bg-primary/5 border-l-4 border-primary rounded-r-xl px-4 py-4 flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-bold">Insight:</span> {insight}
          </p>
        </section>

        {/* Recovery banner */}
        <button
          onClick={onOpenRecovery}
          className="relative w-full h-32 rounded-2xl overflow-hidden shadow-sm group"
        >
          {recoveryImage ? (
            <img
              src={recoveryImage}
              alt="Gestione del Recupero"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 text-left">
            <p className="font-[Manrope] font-bold text-lg text-white">
              Gestione del Recupero
            </p>
          </div>
        </button>
      </main>
    </div>
  );
}
