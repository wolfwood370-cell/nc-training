import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dumbbell,
  Target,
  Zap,
  Activity,
  Flame,
  TrendingUp,
  Heart,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  differenceInDays,
  startOfWeek,
  isWithinInterval,
  parseISO,
  addMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { TrainingPhase, PhaseFocusType } from "@/hooks/usePeriodization";
import { supabase } from "@/integrations/supabase/client";

// Types for wellness data
interface WellnessDay {
  date: string;
  status: "green" | "yellow" | "red";
  label?: string;
  painLevel?: number;
  injuries?: string[];
}

// ============================================
// PHASE CONFIGURATION
// ============================================

interface PhaseConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  solidBg: string;
  icon: typeof Dumbbell;
}

export const PHASE_CONFIG: Record<PhaseFocusType, PhaseConfig> = {
  strength: {
    label: "Forza",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/50",
    solidBg: "bg-orange-500",
    icon: Target,
  },
  hypertrophy: {
    label: "Ipertrofia",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-500/50",
    solidBg: "bg-indigo-500",
    icon: Dumbbell,
  },
  endurance: {
    label: "Resistenza",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/50",
    solidBg: "bg-cyan-500",
    icon: Activity,
  },
  power: {
    label: "Potenza",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
    solidBg: "bg-amber-500",
    icon: Zap,
  },
  recovery: {
    label: "Recupero",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/50",
    solidBg: "bg-emerald-500",
    icon: Heart,
  },
  peaking: {
    label: "Picco",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
    solidBg: "bg-red-500",
    icon: Flame,
  },
  transition: {
    label: "Transizione",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-500/20",
    borderColor: "border-slate-500/50",
    solidBg: "bg-slate-500",
    icon: TrendingUp,
  },
};

// ============================================
// PHASE BLOCK COMPONENT
// ============================================

interface PhaseBlockProps {
  phase: TrainingPhase;
  dayWidth: number;
  timelineStart: Date;
  onEdit: (phase: TrainingPhase) => void;
  onDelete: (phaseId: string) => void;
  onClick: (phase: TrainingPhase) => void;
}

function PhaseBlock({
  phase,
  dayWidth,
  timelineStart,
  onEdit,
  onDelete,
  onClick,
}: PhaseBlockProps) {
  const config = PHASE_CONFIG[phase.focus_type];
  const Icon = config.icon;

  const startDate = parseISO(phase.start_date);
  const endDate = parseISO(phase.end_date);

  const daysFromStart = differenceInDays(startDate, timelineStart);
  const duration = differenceInDays(endDate, startDate) + 1;

  const left = Math.max(0, daysFromStart * dayWidth);
  const width = duration * dayWidth - 4;

  if (daysFromStart < 0 && daysFromStart + duration <= 0) {
    return null; // Phase is entirely before timeline start
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-2 h-12 rounded-lg border-2 cursor-pointer transition-all group",
              "hover:scale-[1.02] hover:shadow-lg hover:z-10 active:scale-[0.98]",
              config.bgColor,
              config.borderColor,
            )}
            style={{ left, width: Math.max(width, 60) }}
            onClick={() => onClick(phase)}
          >
            <div className="h-full flex items-center gap-2 px-3 overflow-hidden">
              <Icon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-semibold truncate", config.color)}>{phase.name}</p>
                <p className="text-4xs text-muted-foreground truncate">
                  {format(startDate, "d MMM", { locale: it })} -{" "}
                  {format(endDate, "d MMM", { locale: it })}
                </p>
              </div>

              {/* Action buttons (visible on hover) */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(phase);
                  }}
                  className="p-1 rounded hover:bg-white/30"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(phase.id);
                  }}
                  className="p-1 rounded hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{phase.name}</p>
          <p className="text-xs text-muted-foreground">
            {config.label} · {format(startDate, "d MMM yyyy", { locale: it })} -{" "}
            {format(endDate, "d MMM yyyy", { locale: it })}
          </p>
          {phase.notes && <p className="text-xs mt-1 max-w-[200px]">{phase.notes}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// MAIN TIMELINE COMPONENT
// ============================================

interface MacroTimelineProps {
  phases: TrainingPhase[];
  athleteId?: string;
  onAddPhase: (date: Date) => void;
  onEditPhase: (phase: TrainingPhase) => void;
  onDeletePhase: (phaseId: string) => void;
  onPhaseClick: (phase: TrainingPhase) => void;
  startDate?: Date;
  months?: number;
}

export function MacroTimeline({
  phases,
  athleteId,
  onAddPhase,
  onEditPhase,
  onDeletePhase,
  onPhaseClick,
  startDate = new Date(),
  months = 12,
}: MacroTimelineProps) {
  const DAY_WIDTH = 4; // pixels per day

  // Calculate timeline range
  const timelineStart = startOfMonth(startDate);
  const timelineEnd = endOfMonth(addMonths(startDate, months - 1));

  // Fetch injuries for the athlete
  const { data: injuries = [] } = useQuery({
    queryKey: ["injuries", athleteId, timelineStart.toISOString(), timelineEnd.toISOString()],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data, error } = await supabase
        .from("injuries")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("injury_date", format(timelineStart, "yyyy-MM-dd"))
        .lte("injury_date", format(timelineEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
    enabled: !!athleteId,
  });

  // Fetch daily_readiness with pain data
  const { data: readinessData = [] } = useQuery({
    queryKey: ["readiness-pain", athleteId, timelineStart.toISOString(), timelineEnd.toISOString()],
    queryFn: async () => {
      if (!athleteId) return [];
      const { data, error } = await supabase
        .from("daily_readiness")
        .select("date, has_pain, soreness_map")
        .eq("athlete_id", athleteId)
        .gte("date", format(timelineStart, "yyyy-MM-dd"))
        .lte("date", format(timelineEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
    enabled: !!athleteId,
  });

  // Build wellness heatmap data
  const wellnessData = useMemo(() => {
    const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });
    const wellnessMap: Record<string, WellnessDay> = {};

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      wellnessMap[dateStr] = { date: dateStr, status: "green" };
    });

    // Process readiness data for pain
    readinessData.forEach((r) => {
      const dateStr = r.date;
      if (!wellnessMap[dateStr]) return;

      if (r.has_pain && r.soreness_map) {
        const sorenessMap = r.soreness_map as Record<string, number>;
        const maxPain = Math.max(
          ...Object.values(sorenessMap).filter((v) => typeof v === "number"),
          0,
        );

        if (maxPain > 4) {
          wellnessMap[dateStr] = {
            date: dateStr,
            status: "red",
            painLevel: maxPain,
            label: `High Pain (${maxPain}/10)`,
          };
        } else if (maxPain >= 1) {
          wellnessMap[dateStr] = {
            date: dateStr,
            status: "yellow",
            painLevel: maxPain,
            label: `Minor Pain (${maxPain}/10)`,
          };
        }
      }
    });

    // Process injuries (override to red)
    injuries.forEach((injury) => {
      const dateStr = injury.injury_date;
      if (!wellnessMap[dateStr]) return;

      const existing = wellnessMap[dateStr];
      wellnessMap[dateStr] = {
        ...existing,
        status: "red",
        injuries: [
          ...(existing.injuries || []),
          `${injury.body_zone}: ${injury.description || "Active Injury"}`,
        ],
        label: `Active Injury: ${injury.body_zone}`,
      };
    });

    return wellnessMap;
  }, [timelineStart, timelineEnd, readinessData, injuries]);

  // Generate months array
  const monthsArray = useMemo(
    () => eachMonthOfInterval({ start: timelineStart, end: timelineEnd }),
    [timelineStart, timelineEnd],
  );

  // Calculate total days and width
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  const totalWidth = totalDays * DAY_WIDTH;

  // Today marker position
  const today = new Date();
  const todayOffset = differenceInDays(today, timelineStart);
  const showTodayMarker = todayOffset >= 0 && todayOffset <= totalDays;

  // Handle click on empty timeline area
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const daysFromStart = Math.floor(x / DAY_WIDTH);
    const clickedDate = new Date(timelineStart);
    clickedDate.setDate(clickedDate.getDate() + daysFromStart);

    // Check if clicking on an existing phase
    const clickedOnPhase = phases.some((phase) => {
      const start = parseISO(phase.start_date);
      const end = parseISO(phase.end_date);
      return isWithinInterval(clickedDate, { start, end });
    });

    if (!clickedOnPhase) {
      onAddPhase(clickedDate);
    }
  };

  return (
    <div className="space-y-4">
      {/* Phase Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PHASE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Badge
              key={key}
              variant="secondary"
              className={cn("gap-1.5 px-2.5 py-1", config.bgColor, config.color)}
            >
              <Icon className="h-3 w-3" />
              <span className="text-xs">{config.label}</span>
            </Badge>
          );
        })}
      </div>

      {/* Timeline */}
      <Card className="border-0 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div style={{ width: totalWidth + 80 }} className="min-w-full">
              {/* Month Headers */}
              <div className="flex border-b border-border/50 bg-secondary/30 sticky top-0 z-20">
                <div className="w-[80px] flex-shrink-0 p-2 border-r border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">Mese</span>
                </div>
                {monthsArray.map((month, i) => {
                  const monthStart = startOfMonth(month);
                  const monthEnd = endOfMonth(month);
                  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                  const monthWidth = daysInMonth * DAY_WIDTH;

                  return (
                    <div
                      key={i}
                      className="border-r border-border/50 p-2 flex-shrink-0"
                      style={{ width: monthWidth }}
                    >
                      <span className="text-xs font-semibold">
                        {format(month, "MMMM", { locale: it })}
                      </span>
                      <span className="text-3xs text-muted-foreground ml-1">
                        {format(month, "yyyy")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Week indicators */}
              <div className="flex border-b border-border/30 bg-muted/20">
                <div className="w-[80px] flex-shrink-0 p-1 border-r border-border/50">
                  <span className="text-3xs text-muted-foreground">Sett.</span>
                </div>
                <div className="flex-1 relative" style={{ width: totalWidth }}>
                  {eachWeekOfInterval(
                    { start: timelineStart, end: timelineEnd },
                    { weekStartsOn: 1 },
                  ).map((week, i) => {
                    const weekStart = startOfWeek(week, { weekStartsOn: 1 });
                    const offset = differenceInDays(weekStart, timelineStart);
                    if (offset < 0) return null;

                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-border/20 px-0.5"
                        style={{ left: offset * DAY_WIDTH }}
                      >
                        <span className="text-4xs text-muted-foreground/60">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phases Row */}
              <div
                className="relative border-b border-border/50 cursor-crosshair"
                style={{ height: 64 }}
                onClick={handleTimelineClick}
              >
                {/* Row label */}
                <div className="absolute left-0 top-0 w-[80px] h-full flex items-center justify-center border-r border-border/50 bg-muted/20 z-10">
                  <span className="text-3xs text-muted-foreground font-medium">Fasi</span>
                </div>

                {/* Today marker */}
                {showTodayMarker && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{ left: 80 + todayOffset * DAY_WIDTH }}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-4xs text-primary font-medium whitespace-nowrap">
                      Oggi
                    </div>
                  </div>
                )}

                {/* Phase blocks */}
                <div className="absolute top-0 left-[80px] right-0 bottom-0">
                  {phases.map((phase) => (
                    <PhaseBlock
                      key={phase.id}
                      phase={phase}
                      dayWidth={DAY_WIDTH}
                      timelineStart={timelineStart}
                      onEdit={onEditPhase}
                      onDelete={onDeletePhase}
                      onClick={onPhaseClick}
                    />
                  ))}
                </div>

                {/* Click hint for empty state */}
                {phases.length === 0 && (
                  <div className="absolute inset-0 left-[80px] flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      Clicca sulla timeline per aggiungere una fase
                    </p>
                  </div>
                )}
              </div>

              {/* Wellness Status Row */}
              {athleteId && (
                <div className="relative border-b border-border/50" style={{ height: 32 }}>
                  {/* Row label */}
                  <div className="absolute left-0 top-0 w-[80px] h-full flex items-center justify-center border-r border-border/50 bg-muted/20 z-10">
                    <span className="text-3xs text-muted-foreground font-medium">Wellness</span>
                  </div>

                  {/* Wellness heatmap */}
                  <div className="absolute top-0 left-[80px] right-0 bottom-0 flex items-center">
                    <TooltipProvider>
                      {eachDayOfInterval({ start: timelineStart, end: timelineEnd }).map(
                        (day, i) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const wellness = wellnessData[dateStr];
                          const statusColors = {
                            green: "bg-emerald-500/40 hover:bg-emerald-500/60",
                            yellow: "bg-amber-500/60 hover:bg-amber-500/80",
                            red: "bg-red-500/70 hover:bg-red-500/90",
                          };

                          const hasIssue = wellness?.status !== "green";

                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "h-4 transition-colors cursor-default",
                                    statusColors[wellness?.status || "green"],
                                  )}
                                  style={{ width: DAY_WIDTH }}
                                />
                              </TooltipTrigger>
                              {hasIssue && (
                                <TooltipContent className="max-w-[200px]">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle
                                      className={cn(
                                        "h-4 w-4 mt-0.5 flex-shrink-0",
                                        wellness?.status === "red"
                                          ? "text-red-500"
                                          : "text-amber-500",
                                      )}
                                    />
                                    <div>
                                      <p className="font-medium text-xs">
                                        {format(day, "d MMM yyyy", { locale: it })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {wellness?.label || "Issue detected"}
                                      </p>
                                      {wellness?.injuries?.map((inj, idx) => (
                                        <p key={idx} className="text-xs text-red-400 mt-0.5">
                                          {inj}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        },
                      )}
                    </TooltipProvider>
                  </div>

                  {/* Today marker for wellness row */}
                  {showTodayMarker && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                      style={{ left: 80 + todayOffset * DAY_WIDTH }}
                    />
                  )}
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend for wellness status */}
      {athleteId && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Wellness Status:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
            <span>No issues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/60" />
            <span>Minor Pain (1-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500/70" />
            <span>High Pain / Injury</span>
          </div>
        </div>
      )}
    </div>
  );
}
