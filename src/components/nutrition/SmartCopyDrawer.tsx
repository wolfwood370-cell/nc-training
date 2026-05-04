import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  Zap,
  ChevronRight,
  Utensils,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface SmartCopyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: () => void;
}

type Mode = "menu" | "quick-slider";

interface RecentLog {
  id: string;
  meal_name: string | null;
  meal_tag: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  water: number | null;
  logged_at: string;
}

// ---------------------------------------------------------------------------
// Time-of-day suggestion logic
// ---------------------------------------------------------------------------

function getTimeWindow(now: Date): { label: string; startHour: number; endHour: number } {
  const h = now.getHours();
  if (h < 11) return { label: "mattina", startHour: 5, endHour: 11 };
  if (h < 15) return { label: "pranzo", startHour: 11, endHour: 15 };
  if (h < 18) return { label: "pomeriggio", startHour: 15, endHour: 18 };
  if (h < 22) return { label: "sera", startHour: 18, endHour: 22 };
  return { label: "notte", startHour: 22, endHour: 28 };
}

interface Suggestion {
  signature: string;
  meal_name: string | null;
  meal_tag: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  occurrences: number;
  lastSeen: string;
}

/**
 * Group recent logs that match the current time window into suggestions.
 * Two logs are considered "the same" if they share name + rounded macros.
 */
function buildSuggestions(logs: RecentLog[], window: { startHour: number; endHour: number }): Suggestion[] {
  const filtered = logs.filter((l) => {
    const h = new Date(l.logged_at).getHours();
    // Wrap-around for late-night window
    if (window.endHour > 24) {
      return h >= window.startHour || h < window.endHour - 24;
    }
    return h >= window.startHour && h < window.endHour;
  });

  const map = new Map<string, Suggestion>();
  for (const log of filtered) {
    const cals = Math.round(Number(log.calories) || 0);
    const sig = `${(log.meal_name ?? "").trim().toLowerCase()}|${cals}`;
    const existing = map.get(sig);
    if (existing) {
      existing.occurrences += 1;
      if (log.logged_at > existing.lastSeen) existing.lastSeen = log.logged_at;
    } else {
      map.set(sig, {
        signature: sig,
        meal_name: log.meal_name,
        meal_tag: log.meal_tag,
        calories: cals,
        protein: Math.round(Number(log.protein) || 0),
        carbs: Math.round(Number(log.carbs) || 0),
        fats: Math.round(Number(log.fats) || 0),
        water: Math.round(Number(log.water) || 0),
        occurrences: 1,
        lastSeen: log.logged_at,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.occurrences - a.occurrences || b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 4);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SmartCopyDrawer({ open, onOpenChange, onLogged }: SmartCopyDrawerProps) {
  const { user } = useAuth();
  const haptic = useHapticFeedback();
  const [mode, setMode] = useState<Mode>("menu");
  const [sliderValue, setSliderValue] = useState([500]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally re-evaluate `new Date()` whenever the drawer opens
  const now = useMemo(() => new Date(), [open]);
  const window = useMemo(() => getTimeWindow(now), [now]);
  const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(now, 7), "yyyy-MM-dd");

  // Last 7 days of logs (for time-aware suggestions)
  const recentQuery = useQuery({
    queryKey: ["smart-copy-recent", user?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!user?.id) return [] as RecentLog[];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("id, meal_name, meal_tag, calories, protein, carbs, fats, water, logged_at")
        .eq("athlete_id", user.id)
        .gte("date", sevenDaysAgo)
        .order("logged_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as RecentLog[];
    },
    enabled: !!user?.id && open,
    staleTime: 60 * 1000,
  });

  // Yesterday's full day (for "Copia ieri" bulk action)
  const yesterdayQuery = useQuery({
    queryKey: ["smart-copy-yesterday", user?.id, yesterday],
    queryFn: async () => {
      if (!user?.id) return [] as RecentLog[];
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("id, meal_name, meal_tag, calories, protein, carbs, fats, water, logged_at")
        .eq("athlete_id", user.id)
        .eq("date", yesterday)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RecentLog[];
    },
    enabled: !!user?.id && open,
  });

  const yesterdayLogs = yesterdayQuery.data ?? [];
  const yesterdayTotal = yesterdayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);

  const suggestions = useMemo(
    () => buildSuggestions(recentQuery.data ?? [], window),
    [recentQuery.data, window],
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const logSuggestion = async (s: Suggestion) => {
    if (!user?.id || isSubmitting) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("nutrition_logs").insert({
      athlete_id: user.id,
      date: format(new Date(), "yyyy-MM-dd"),
      calories: s.calories,
      protein: s.protein || null,
      carbs: s.carbs || null,
      fats: s.fats || null,
      water: s.water || null,
      meal_name: s.meal_name,
      meal_tag: s.meal_tag,
    });

    if (error) {
      toast.error("Errore nel logging");
      haptic.error();
    } else {
      toast.success(`${s.meal_name || "Pasto"} loggato!`);
      haptic.success();
      onLogged();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleCopyYesterday = async () => {
    if (!user?.id || yesterdayLogs.length === 0) return;
    setIsSubmitting(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const inserts = yesterdayLogs.map((log) => ({
      athlete_id: user.id,
      date: today,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fats: log.fats,
      water: log.water,
      meal_name: log.meal_name,
      meal_tag: log.meal_tag,
    }));

    const { error } = await supabase.from("nutrition_logs").insert(inserts);

    if (error) {
      toast.error("Errore nella copia");
      haptic.error();
    } else {
      toast.success(`${inserts.length} pasti copiati da ieri!`);
      haptic.success();
      onLogged();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleQuickAdd = async () => {
    if (!user?.id) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("nutrition_logs").insert({
      athlete_id: user.id,
      date: format(new Date(), "yyyy-MM-dd"),
      calories: sliderValue[0],
      meal_name: "Quick Add",
    });

    if (error) {
      toast.error("Errore");
      haptic.error();
    } else {
      toast.success(`+${sliderValue[0]} kcal aggiunte!`);
      haptic.success();
      onLogged();
      onOpenChange(false);
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setMode("menu");
    setSliderValue([500]);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        onOpenChange(v);
      }}
    >
      <DrawerContent className="max-h-[80vh]">
        <div className="mx-auto w-full max-w-md flex flex-col overflow-hidden">
          <DrawerHeader className="text-center pb-2 shrink-0">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {mode === "menu" ? "Smart Copy" : "Quick Calories"}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {mode === "menu"
                ? `Suggerimenti basati su ${window.label} degli ultimi 7 giorni`
                : "Stima rapida delle calorie"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-3 overflow-y-auto">
            {mode === "menu" ? (
              <>
                {/* ===== Time-aware suggestions ===== */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground px-1">
                    <Clock className="h-3 w-3" />
                    <span>I tuoi pasti tipici di {window.label}</span>
                  </div>

                  {recentQuery.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full rounded-2xl" />
                      <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <button
                        key={s.signature}
                        type="button"
                        onClick={() => logSuggestion(s)}
                        disabled={isSubmitting}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                          "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                          "border border-primary/20",
                          "active:scale-[0.98] disabled:opacity-50",
                          "touch-manipulation",
                        )}
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {s.meal_name || "Pasto"}
                          </p>
                          <p className="text-[11px] text-muted-foreground tabular-nums">
                            {s.calories} kcal
                            {s.protein > 0 && ` • P${s.protein}`}
                            {s.carbs > 0 && ` C${s.carbs}`}
                            {s.fats > 0 && ` F${s.fats}`}
                          </p>
                        </div>
                        {s.occurrences > 1 && (
                          <Badge variant="secondary" className="text-[9px] shrink-0">
                            ×{s.occurrences}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-3 px-3 rounded-2xl bg-muted/30">
                      <p className="text-xs text-muted-foreground">
                        Nessun pasto tipico per questa fascia oraria.
                        <br />
                        Logga qualche pasto e i suggerimenti appariranno qui.
                      </p>
                    </div>
                  )}
                </div>

                {/* ===== Bulk actions ===== */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">
                    Azioni rapide
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyYesterday}
                    disabled={yesterdayLogs.length === 0 || isSubmitting}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                      "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                      "border border-border/30",
                      "active:scale-[0.98] disabled:opacity-50",
                      "touch-manipulation",
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Copy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Copia tutto da ieri</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {yesterdayLogs.length > 0
                          ? `${yesterdayLogs.length} pasti • ${yesterdayTotal.toLocaleString()} kcal`
                          : "Nessun pasto registrato ieri"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("quick-slider")}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
                      "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
                      "border border-border/30",
                      "active:scale-[0.98]",
                      "touch-manipulation",
                    )}
                  >
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Aggiungi calorie</p>
                      <p className="text-[11px] text-muted-foreground">
                        Stima rapida senza dettagli
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </div>
              </>
            ) : (
              /* Quick Slider Mode */
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <span className="text-5xl font-bold tabular-nums text-foreground">
                    {sliderValue[0]}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">kcal</p>
                </div>

                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  min={50}
                  max={1500}
                  step={50}
                  className="py-4"
                />

                <div className="flex gap-2 justify-center flex-wrap">
                  {[200, 300, 500, 800, 1000].map((v) => (
                    <Button
                      key={v}
                      variant={sliderValue[0] === v ? "default" : "outline"}
                      size="sm"
                      className="rounded-full text-xs tabular-nums"
                      onClick={() => setSliderValue([v])}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="pt-2 border-t border-border/50 shrink-0">
            {mode === "quick-slider" && (
              <Button
                onClick={handleQuickAdd}
                className="w-full h-12 font-semibold"
                disabled={isSubmitting}
              >
                <Utensils className="h-4 w-4 mr-2" />
                Aggiungi {sliderValue[0]} kcal
              </Button>
            )}
            {mode === "quick-slider" ? (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setMode("menu")}
              >
                Indietro
              </Button>
            ) : (
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full text-sm">
                  Chiudi
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
