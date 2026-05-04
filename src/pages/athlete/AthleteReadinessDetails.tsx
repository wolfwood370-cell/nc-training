import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Activity } from "lucide-react";
import { format, subDays } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { useReadiness } from "@/hooks/useReadiness";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Factor {
  key: string;
  label: string;
  value: number; // 0-10
}

const DAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];

export default function AthleteReadinessDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { readiness, isLoading, calculateReadiness } = useReadiness();

  const result = useMemo(() => {
    if (!readiness?.isCompleted) return null;
    return calculateReadiness(readiness);
  }, [readiness, calculateReadiness]);

  const score = result?.score ?? 0;

  // Build factors from current readiness data (1-10 scale).
  // Sleep is hours (cap at 10). Soreness ("Dolori") = 10 - max(soreness intensity).
  const factors: Factor[] = useMemo(() => {
    const r = readiness;
    const sorenessLevels = Object.values(r?.sorenessMap ?? {}) as number[];
    const maxSoreness = sorenessLevels.length
      ? Math.max(...sorenessLevels) // 0-3
      : 0;
    const doloriValue = Math.max(0, 10 - maxSoreness * 3); // invert: 0->10, 3->1

    return [
      { key: "sonno", label: "Sonno", value: Math.min(10, Math.round(r?.sleepHours ?? 0)) },
      { key: "energia", label: "Energia", value: Math.round(r?.energy ?? 0) },
      { key: "dolori", label: "Dolori", value: doloriValue },
      { key: "stress", label: "Stress", value: Math.round(11 - (r?.stress ?? 0)) },
      { key: "umore", label: "Umore", value: Math.round(r?.mood ?? 0) },
      { key: "digestione", label: "Digestione", value: Math.round(r?.digestione ?? r?.digestion ?? 0) },
    ];
  }, [readiness]);

  // Highlight the worst factor (lowest value) when check-in completed
  const activeKey = useMemo(() => {
    if (!result) return null;
    return factors.reduce((min, f) => (f.value < min.value ? f : min), factors[0])?.key ?? null;
  }, [factors, result]);

  // 7-day score history
  const { data: trendData } = useQuery({
    queryKey: ["readiness-trend-7d", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as { day: string; score: number }[];
      const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("date, score")
        .eq("athlete_id", user.id)
        .gte("date", start)
        .order("date", { ascending: true });
      if (error) throw error;

      // Map to last 7 days, fill missing with 0
      const out: { day: string; score: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const match = data?.find((x) => x.date === d);
        const dayIdx = (new Date(d).getDay() + 6) % 7; // Monday=0..Sunday=6
        out.push({
          day: DAY_LETTERS[dayIdx],
          score: Math.round(((match?.score ?? 0) / 100) * 10), // scale to 0-10 for chart
        });
      }
      return out;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const TREND = trendData && trendData.length === 7
    ? trendData
    : [
        { day: "L", score: 0 },
        { day: "M", score: 0 },
        { day: "M", score: 0 },
        { day: "G", score: 0 },
        { day: "V", score: 0 },
        { day: "S", score: 0 },
        { day: "D", score: 0 },
      ];

  // Score ring math
  const ringSize = 200;
  const ringStroke = 14;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - score / 100);

  // Trend chart math
  const chartWidth = 320;
  const chartHeight = 140;
  const padX = 20;
  const padY = 20;
  const innerW = chartWidth - padX * 2;
  const innerH = chartHeight - padY * 2;
  const maxScore = 10;
  const points = TREND.map((d, i) => {
    const x = padX + (i * innerW) / (TREND.length - 1);
    const y = padY + innerH - (d.score / maxScore) * innerH;
    return { x, y };
  });
  const baselineY = chartHeight - padY;

  // Smooth spline path (Catmull-Rom -> Bezier)
  const splinePath = (() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  })();

  return (
    <div className="min-h-screen bg-background text-on-background font-sans">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/40 transition-colors text-on-surface"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface">
          Analisi Prontezza
        </h1>
        <button
          type="button"
          aria-label="Altre opzioni"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/40 transition-colors text-on-surface"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-24 pb-12 px-6 space-y-6 max-w-2xl mx-auto">
        {/* Hero Section — no card, ring directly on background */}
        <section className="flex flex-col items-center pt-2">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-full" />
            ) : (
              <>
                <svg
                  width={ringSize}
                  height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                  className="-rotate-90"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="transparent"
                    strokeWidth={ringStroke}
                    className="text-primary opacity-10"
                    stroke="currentColor"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="transparent"
                    strokeWidth={ringStroke}
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="text-primary-container transition-[stroke-dashoffset] duration-700"
                    stroke="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-5xl font-bold text-primary-container leading-none">
                    {Math.round(score)}
                  </span>
                  <span className="mt-2 text-[10px] tracking-widest uppercase text-on-surface-variant font-semibold">
                    Overall
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/athlete/checkin")}
            className="w-full bg-primary-container text-white rounded-full py-4 font-semibold text-sm tracking-wide mt-6 hover:opacity-90 transition-opacity shadow-sm"
          >
            Registra Prontezza
          </button>
        </section>

        {/* Factors */}
        <section className="bg-white/[0.7] backdrop-blur-md border border-slate-200/50 rounded-[32px] p-6 shadow-sm">
          <h2 className="font-display text-2xl font-semibold text-on-surface mb-5">
            Fattori di Oggi
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {factors.map((f) => {
                const pct = Math.max(0, Math.min(100, (f.value / 10) * 100));
                const isActive = f.key === activeKey;

                if (isActive) {
                  return (
                    <li
                      key={f.key}
                      className="p-3 -mx-3 bg-primary-container/10 rounded-xl border border-primary-container/20"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs uppercase font-semibold text-primary-container tracking-wide">
                            <Activity className="w-3.5 h-3.5" />
                            {f.label}
                          </span>
                          <span className="text-xs font-bold text-primary-container">
                            {f.value}/10
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="bg-primary-container h-full rounded-full transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={f.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-semibold text-on-surface-variant tracking-wide">
                        {f.label}
                      </span>
                      <span className="text-xs font-bold text-on-surface">
                        {f.value}/10
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="bg-outline h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Trend */}
        <section className="relative overflow-hidden bg-white/[0.7] backdrop-blur-md border border-slate-200/50 rounded-[32px] p-6 shadow-sm">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-primary-container" />

          <h2 className="font-display text-xl font-semibold text-on-surface pl-2">
            Trend 7 Giorni: Punteggio
          </h2>
          <p className="text-sm text-on-surface-variant mb-6 pl-2">
            Andamento della prontezza negli ultimi sette giorni.
          </p>

          <div className="w-full pl-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto"
              preserveAspectRatio="none"
            >
              {points.map((p, i) => (
                <line
                  key={`drop-${i}`}
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={baselineY}
                  className="stroke-primary-container"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.35}
                />
              ))}

              <path
                d={splinePath}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-primary-container"
              />

              {points.map((p, i) => {
                const isLast = i === points.length - 1;
                return (
                  <g key={i}>
                    {isLast && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={7}
                        className="fill-primary-container"
                        opacity={0.2}
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isLast ? 4.5 : 3.5}
                      className="fill-white stroke-primary-container"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between mt-3 px-1">
              {TREND.map((d, i) => {
                const isCurrent = i === TREND.length - 1;
                return (
                  <span
                    key={i}
                    className={
                      isCurrent
                        ? "text-[10px] uppercase font-bold text-primary-container"
                        : "text-[10px] uppercase font-semibold text-outline"
                    }
                  >
                    {d.day}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
