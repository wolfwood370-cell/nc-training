import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sun, Sunset, Moon, Dumbbell, Coffee, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MealLog {
  id: string;
  meal_name: string | null;
  meal_tag: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  logged_at: string;
}

interface MealTimelineProps {
  refreshKey?: number;
}

// ---------------------------------------------------------------------------
// Tag visual config
// ---------------------------------------------------------------------------

const TAG_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pre_workout: {
    label: "Pre-WO",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Dumbbell,
  },
  post_workout: {
    label: "Post-WO",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Sparkles,
  },
  snack: {
    label: "Snack",
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
    icon: Coffee,
  },
  breakfast: {
    label: "Colazione",
    color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
    icon: Sun,
  },
  lunch: {
    label: "Pranzo",
    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: Sun,
  },
  dinner: {
    label: "Cena",
    color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: Moon,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeOfDayIcon(hour: number) {
  if (hour < 6) return Moon;
  if (hour < 12) return Sun;
  if (hour < 18) return Sun;
  if (hour < 21) return Sunset;
  return Moon;
}

function getTimeOfDayColor(hour: number): string {
  if (hour < 6) return "text-indigo-400";
  if (hour < 12) return "text-amber-500";
  if (hour < 18) return "text-orange-500";
  if (hour < 21) return "text-rose-500";
  return "text-indigo-400";
}

// ---------------------------------------------------------------------------
// MealTimeline — vertical 24h chronological feed
// ---------------------------------------------------------------------------

export function MealTimeline({ refreshKey = 0 }: MealTimelineProps) {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const logsQuery = useQuery({
    queryKey: ["nutrition-timeline", user?.id, today, refreshKey],
    queryFn: async () => {
      if (!user?.id) return [] as MealLog[];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("id, meal_name, meal_tag, calories, protein, carbs, fats, logged_at")
        .eq("athlete_id", user.id)
        .eq("date", today)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MealLog[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  if (logsQuery.isLoading) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="border-0 bg-card/50">
        <CardContent className="p-5 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
            <Coffee className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Nessun pasto registrato oggi
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tocca il pulsante <span className="text-primary font-medium">+</span> per iniziare
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Timeline di Oggi
          </h3>
          <Badge variant="secondary" className="text-[10px] tabular-nums">
            {logs.length} {logs.length === 1 ? "pasto" : "pasti"}
          </Badge>
        </div>

        {/* Vertical timeline with continuous line */}
        <div className="relative pl-8">
          {/* Vertical connecting line */}
          <div
            className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-border/50 via-border to-border/50"
            aria-hidden="true"
          />

          <ul className="space-y-3">
            {logs.map((log) => {
              const date = new Date(log.logged_at);
              const hour = date.getHours();
              const TimeIcon = getTimeOfDayIcon(hour);
              const timeColor = getTimeOfDayColor(hour);
              const tagConfig = log.meal_tag ? TAG_CONFIG[log.meal_tag] : null;
              const TagIcon = tagConfig?.icon;

              return (
                <li key={log.id} className="relative">
                  {/* Time marker dot */}
                  <div
                    className={cn(
                      "absolute -left-[1.625rem] top-3 h-6 w-6 rounded-full",
                      "bg-background border-2 border-border flex items-center justify-center",
                      "shadow-sm",
                    )}
                  >
                    <TimeIcon className={cn("h-3 w-3", timeColor)} />
                  </div>

                  {/* Meal content */}
                  <div
                    className={cn(
                      "rounded-xl p-3 transition-colors",
                      "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                      "border border-border/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {format(date, "HH:mm", { locale: it })}
                          </span>
                          {tagConfig && (
                            <Badge
                              variant="secondary"
                              className={cn("text-[9px] px-1.5 py-0 h-4 border", tagConfig.color)}
                            >
                              {TagIcon && <TagIcon className="h-2.5 w-2.5 mr-0.5" />}
                              {tagConfig.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground/90 mt-0.5 truncate">
                          {log.meal_name || "Pasto"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold tabular-nums text-foreground">
                          {log.calories ?? 0}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          kcal
                        </p>
                      </div>
                    </div>

                    {/* Macros mini-row */}
                    {(log.protein || log.carbs || log.fats) && (
                      <div className="flex gap-3 text-[10px] text-muted-foreground tabular-nums">
                        {!!log.protein && (
                          <span>
                            <span className="text-rose-500/80 font-medium">P</span>{" "}
                            {Math.round(Number(log.protein))}g
                          </span>
                        )}
                        {!!log.carbs && (
                          <span>
                            <span className="text-emerald-500/80 font-medium">C</span>{" "}
                            {Math.round(Number(log.carbs))}g
                          </span>
                        )}
                        {!!log.fats && (
                          <span>
                            <span className="text-amber-500/80 font-medium">F</span>{" "}
                            {Math.round(Number(log.fats))}g
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
