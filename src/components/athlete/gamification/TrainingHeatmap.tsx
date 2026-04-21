import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, addDays, getDay } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrainingHeatmapProps {
  athleteId?: string;
  days?: number;
  className?: string;
}

interface DayCell {
  date: string;
  dateObj: Date;
  intensity: 0 | 1 | 2 | 3 | 4; // 0 = empty, 1-4 strain levels
  load: number;
  sessions: number;
}

/**
 * Github/Strava-style contribution heatmap.
 * Last N days of training strain (sRPE proxy = duration * RPE)
 */
export function TrainingHeatmap({
  athleteId,
  days = 90,
  className,
}: TrainingHeatmapProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["training-heatmap", athleteId, days],
    queryFn: async () => {
      if (!athleteId) return [];
      const since = format(subDays(new Date(), days), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("workout_logs")
        .select("completed_at, total_volume, srpe, duration_minutes, rpe")
        .eq("athlete_id", athleteId)
        .gte("completed_at", since)
        .not("completed_at", "is", null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!athleteId,
    staleTime: 5 * 60_000,
  });

  const cells = useMemo<DayCell[]>(() => {
    // Build last N days, ending today
    const today = startOfDay(new Date());
    // Align: start so weeks form columns Mon-Sun, ending on today's column
    const dayMap = new Map<string, { load: number; sessions: number }>();

    (logs ?? []).forEach((l: any) => {
      if (!l.completed_at) return;
      const key = format(new Date(l.completed_at), "yyyy-MM-dd");
      const sRpe =
        Number(l.srpe) ||
        (Number(l.duration_minutes) || 0) * (Number(l.rpe) || 0) ||
        Number(l.total_volume) / 100 ||
        100;
      const cur = dayMap.get(key) ?? { load: 0, sessions: 0 };
      cur.load += sRpe;
      cur.sessions += 1;
      dayMap.set(key, cur);
    });

    // Determine intensity buckets from observed loads
    const loads = Array.from(dayMap.values()).map((v) => v.load).filter((l) => l > 0);
    const sorted = [...loads].sort((a, b) => a - b);
    const q = (p: number) =>
      sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    const t1 = q(0.25);
    const t2 = q(0.5);
    const t3 = q(0.75);

    const result: DayCell[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      const entry = dayMap.get(key);
      let intensity: DayCell["intensity"] = 0;
      if (entry && entry.load > 0) {
        if (entry.load <= t1) intensity = 1;
        else if (entry.load <= t2) intensity = 2;
        else if (entry.load <= t3) intensity = 3;
        else intensity = 4;
      }
      result.push({
        date: key,
        dateObj: d,
        intensity,
        load: entry?.load ?? 0,
        sessions: entry?.sessions ?? 0,
      });
    }
    return result;
  }, [logs, days]);

  // Group into weeks (columns), each column has 7 cells (Mon..Sun)
  const weeks = useMemo(() => {
    if (cells.length === 0) return [] as (DayCell | null)[][];
    const first = cells[0].dateObj;
    // Mon = 0 ... Sun = 6
    const isoDow = (d: Date) => (getDay(d) + 6) % 7;
    const padFront = isoDow(first);

    const flat: (DayCell | null)[] = [];
    for (let i = 0; i < padFront; i++) flat.push(null);
    flat.push(...cells);
    // pad end to multiple of 7
    while (flat.length % 7 !== 0) flat.push(null);

    const cols: (DayCell | null)[][] = [];
    for (let i = 0; i < flat.length; i += 7) {
      cols.push(flat.slice(i, i + 7));
    }
    return cols;
  }, [cells]);

  // Stats
  const stats = useMemo(() => {
    const active = cells.filter((c) => c.intensity > 0).length;
    const totalLoad = cells.reduce((s, c) => s + c.load, 0);
    return { active, totalLoad: Math.round(totalLoad) };
  }, [cells]);

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold">Mappa Allenamenti</h3>
            <p className="text-xs text-muted-foreground">Ultimi {days} giorni</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums">{stats.active}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Giorni attivi
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-24 rounded bg-muted animate-pulse" />
        ) : (
          <TooltipProvider delayDuration={150}>
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex gap-[3px] min-w-fit">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((cell, di) => (
                      <HeatCell key={di} cell={cell} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Meno</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              className={cn("h-2.5 w-2.5 rounded-sm", levelClass(lvl as DayCell["intensity"]))}
            />
          ))}
          <span>Più</span>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatCell({ cell }: { cell: DayCell | null }) {
  if (!cell) {
    return <div className="h-3 w-3 rounded-sm" aria-hidden />;
  }
  const label =
    cell.intensity === 0
      ? `Riposo · ${format(cell.dateObj, "d MMM", { locale: it })}`
      : `${cell.sessions} sess. · carico ${Math.round(cell.load)} · ${format(
          cell.dateObj,
          "d MMM",
          { locale: it }
        )}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "h-3 w-3 rounded-sm transition-transform hover:scale-125 cursor-default",
            levelClass(cell.intensity)
          )}
          aria-label={label}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function levelClass(level: DayCell["intensity"]) {
  switch (level) {
    case 0:
      return "bg-muted/60 border border-border/40";
    case 1:
      return "bg-primary/20";
    case 2:
      return "bg-primary/40";
    case 3:
      return "bg-primary/70";
    case 4:
      return "bg-primary shadow-sm shadow-primary/40";
  }
}
