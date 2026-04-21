import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface ConsistencyRingsProps {
  athleteId?: string;
  size?: number;
  compact?: boolean;
  className?: string;
}

interface RingsData {
  daily: number; // 0-1
  weekly: number; // 0-1
  monthly: number; // 0-1
  dailyDone: boolean;
  weeklyWorkouts: number;
  weeklyTarget: number;
  monthlyWorkouts: number;
  monthlyTarget: number;
}

/**
 * Premium concentric SVG rings (Apple/WHOOP style)
 * - Inner: Daily consistency (trained or logged today)
 * - Middle: Weekly volume vs target
 * - Outer: Monthly progression vs target
 */
export function ConsistencyRings({
  athleteId,
  size = 180,
  compact = false,
  className,
}: ConsistencyRingsProps) {
  const { data, isLoading } = useQuery<RingsData>({
    queryKey: ["consistency-rings", athleteId],
    queryFn: async () => {
      if (!athleteId) {
        return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          dailyDone: false,
          weeklyWorkouts: 0,
          weeklyTarget: 4,
          monthlyWorkouts: 0,
          monthlyTarget: 16,
        };
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

      // Workouts in last month
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("athlete_id", athleteId)
        .gte("completed_at", monthAgo)
        .not("completed_at", "is", null);

      // Today readiness/nutrition
      const { data: readiness } = await supabase
        .from("daily_readiness")
        .select("date")
        .eq("athlete_id", athleteId)
        .eq("date", today)
        .maybeSingle();

      const { data: nutrition } = await supabase
        .from("nutrition_logs")
        .select("id")
        .eq("athlete_id", athleteId)
        .eq("date", today)
        .limit(1);

      const workoutDays = new Set<string>();
      workouts?.forEach((w) => {
        if (w.completed_at) workoutDays.add(format(new Date(w.completed_at), "yyyy-MM-dd"));
      });

      const trainedToday = workoutDays.has(today);
      const dailyDone = trainedToday || !!readiness || (nutrition?.length ?? 0) > 0;

      let weeklyWorkouts = 0;
      let monthlyWorkouts = 0;
      workoutDays.forEach((d) => {
        if (d >= weekStart) weeklyWorkouts++;
        if (d >= monthStart) monthlyWorkouts++;
      });

      const weeklyTarget = 4;
      const monthlyTarget = 16;

      return {
        daily: dailyDone ? 1 : 0,
        weekly: Math.min(1, weeklyWorkouts / weeklyTarget),
        monthly: Math.min(1, monthlyWorkouts / monthlyTarget),
        dailyDone,
        weeklyWorkouts,
        weeklyTarget,
        monthlyWorkouts,
        monthlyTarget,
      };
    },
    enabled: !!athleteId,
    staleTime: 60_000,
  });

  // Animate progress on mount / data change
  const [animated, setAnimated] = useState({ daily: 0, weekly: 0, monthly: 0 });
  useEffect(() => {
    if (!data) return;
    const start = performance.now();
    const duration = 1100;
    const target = { daily: data.daily, weekly: data.weekly, monthly: data.monthly };
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated({
        daily: target.daily * eased,
        weekly: target.weekly * eased,
        monthly: target.monthly * eased,
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data?.daily, data?.weekly, data?.monthly]);

  const stroke = compact ? 8 : 12;
  const gap = compact ? 4 : 6;
  const cx = size / 2;
  const cy = size / 2;

  // Three concentric radii
  const rOuter = cx - stroke / 2;
  const rMiddle = rOuter - stroke - gap;
  const rInner = rMiddle - stroke - gap;

  const circumference = (r: number) => 2 * Math.PI * r;

  const ring = (r: number, value: number, color: string, trackColor: string) => {
    const c = circumference(r);
    return (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke 0.3s ease" }}
        />
      </>
    );
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Outer — Monthly */}
          {ring(
            rOuter,
            animated.monthly,
            "hsl(var(--primary))",
            "hsl(var(--primary) / 0.1)"
          )}
          {/* Middle — Weekly */}
          {ring(
            rMiddle,
            animated.weekly,
            "hsl(var(--success))",
            "hsl(var(--success) / 0.1)"
          )}
          {/* Inner — Daily */}
          {ring(
            rInner,
            animated.daily,
            "hsl(var(--warning))",
            "hsl(var(--warning) / 0.1)"
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {isLoading ? (
            <div className="h-6 w-12 rounded bg-muted animate-pulse" />
          ) : (
            <>
              <span className={cn("font-bold tabular-nums", compact ? "text-lg" : "text-3xl")}>
                {Math.round((data?.weekly ?? 0) * 100)}%
              </span>
              {!compact && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Settimana
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-xs">
          <Legend
            color="hsl(var(--warning))"
            label="Oggi"
            value={data?.dailyDone ? "✓" : "—"}
          />
          <Legend
            color="hsl(var(--success))"
            label="Settimana"
            value={`${data?.weeklyWorkouts ?? 0}/${data?.weeklyTarget ?? 4}`}
          />
          <Legend
            color="hsl(var(--primary))"
            label="Mese"
            value={`${data?.monthlyWorkouts ?? 0}/${data?.monthlyTarget ?? 16}`}
          />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-sm font-semibold tabular-nums mt-0.5">{value}</span>
    </div>
  );
}
