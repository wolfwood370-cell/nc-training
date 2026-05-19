import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  Calendar,
  Loader2,
  AlertCircle,
  Dumbbell,
  Target,
  Zap,
  Activity,
  Flame,
  TrendingUp,
  Heart,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  differenceInDays,
  differenceInWeeks,
  startOfWeek,
  isWithinInterval,
  parseISO,
  addMonths,
  addWeeks,
} from "date-fns";
import { it } from "date-fns/locale";
import {
  usePeriodization,
  TrainingPhase,
  PhaseFocusType,
  CreatePhaseInput,
} from "@/hooks/usePeriodization";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  isSelected: boolean;
  onEdit: (phase: TrainingPhase) => void;
  onDelete: (phaseId: string) => void;
  onClick: (phase: TrainingPhase) => void;
}

function PhaseBlock({
  phase,
  dayWidth,
  timelineStart,
  isSelected,
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
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-1 h-8 rounded-md border-2 cursor-pointer transition-all group",
              "hover:scale-[1.02] hover:shadow-lg hover:z-10 active:scale-[0.98]",
              config.bgColor,
              config.borderColor,
              isSelected && "ring-2 ring-primary ring-offset-1",
            )}
            style={{ left, width: Math.max(width, 50) }}
            onClick={() => onClick(phase)}
          >
            <div className="h-full flex items-center gap-1.5 px-2 overflow-hidden">
              <Icon className={cn("h-3 w-3 flex-shrink-0", config.color)} />
              <div className="flex-1 min-w-0">
                <p className={cn("text-3xs font-semibold truncate", config.color)}>{phase.name}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(phase);
                  }}
                  className="p-0.5 rounded hover:bg-white/30"
                >
                  <Edit2 className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(phase.id);
                  }}
                  className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{phase.name}</p>
          <p className="text-xs text-muted-foreground">
            {config.label} · {format(startDate, "d MMM", { locale: it })} -{" "}
            {format(endDate, "d MMM", { locale: it })}
          </p>
          <p className="text-xs text-muted-foreground">
            {differenceInWeeks(endDate, startDate) + 1} settimane
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface PeriodizationHeaderProps {
  athleteId: string | null;
  currentWeek: number;
  totalWeeks: number;
  onWeeksGenerated: (weeks: number) => void;
  onWeekClick: (weekIndex: number) => void;
  className?: string;
}

export function PeriodizationHeader({
  athleteId,
  currentWeek,
  totalWeeks,
  onWeeksGenerated,
  onWeekClick,
  className,
}: PeriodizationHeaderProps) {
  const DAY_WIDTH = 3;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<TrainingPhase | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<TrainingPhase | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    focus_type: "hypertrophy" as PhaseFocusType,
    start_date: "",
    end_date: "",
    base_volume: 100,
    notes: "",
  });
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  const {
    phases,
    isLoading,
    createPhase,
    updatePhase,
    deletePhase,
    isCreating,
    isUpdating,
    checkOverlap,
  } = usePeriodization(athleteId);

  // Calculate timeline range (6 months forward)
  const timelineStart = startOfMonth(new Date());
  const timelineEnd = endOfMonth(addMonths(new Date(), 5));

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

  // Week markers for click navigation
  const weekMarkers = useMemo(() => {
    return eachWeekOfInterval({ start: timelineStart, end: timelineEnd }, { weekStartsOn: 1 })
      .map((week, index) => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 });
        const offset = differenceInDays(weekStart, timelineStart);
        return { index, offset, date: weekStart };
      })
      .filter((w) => w.offset >= 0);
  }, [timelineStart, timelineEnd]);

  // Calculate total weeks from phases and update parent
  useEffect(() => {
    if (phases.length > 0) {
      const totalPhaseWeeks = phases.reduce((sum, phase) => {
        const start = parseISO(phase.start_date);
        const end = parseISO(phase.end_date);
        return sum + differenceInWeeks(end, start) + 1;
      }, 0);

      if (totalPhaseWeeks > 0 && totalPhaseWeeks !== totalWeeks) {
        onWeeksGenerated(Math.max(totalPhaseWeeks, 4));
      }
    }
  }, [phases, totalWeeks, onWeeksGenerated]);

  // Handlers
  const handleAddPhase = (clickedDate?: Date) => {
    const startDate = clickedDate || new Date();
    const endDate = addWeeks(startDate, 4);

    setFormData({
      name: "",
      focus_type: "hypertrophy",
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      base_volume: 100,
      notes: "",
    });
    setEditingPhase(null);
    setOverlapWarning(null);
    setDialogOpen(true);
  };

  const handleEditPhase = (phase: TrainingPhase) => {
    setFormData({
      name: phase.name,
      focus_type: phase.focus_type,
      start_date: phase.start_date,
      end_date: phase.end_date,
      base_volume: phase.base_volume,
      notes: phase.notes || "",
    });
    setEditingPhase(phase);
    setOverlapWarning(null);
    setDialogOpen(true);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (confirm("Sei sicuro di voler eliminare questa fase?")) {
      await deletePhase(phaseId);
      if (selectedPhase?.id === phaseId) {
        setSelectedPhase(null);
      }
    }
  };

  const handlePhaseClick = (phase: TrainingPhase) => {
    setSelectedPhase(phase);

    // Calculate which week this phase starts at relative to the first phase
    const sortedPhases = [...phases].sort(
      (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime(),
    );

    let weekIndex = 0;
    for (const p of sortedPhases) {
      if (p.id === phase.id) break;
      const start = parseISO(p.start_date);
      const end = parseISO(p.end_date);
      weekIndex += differenceInWeeks(end, start) + 1;
    }

    onWeekClick(weekIndex);
  };

  const validateAndCheckOverlap = () => {
    if (!formData.start_date || !formData.end_date) return true;

    const result = checkOverlap(
      {
        id: editingPhase?.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
      },
      phases,
    );

    if (result.hasOverlap) {
      const conflictNames = result.conflictingPhases.map((p) => p.name).join(", ");
      setOverlapWarning(`Date in conflitto con: ${conflictNames}`);
      return false;
    }

    setOverlapWarning(null);
    return true;
  };

  const handleSavePhase = async () => {
    if (!formData.name.trim()) {
      return;
    }

    if (!athleteId) {
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      return;
    }

    if (!validateAndCheckOverlap()) {
      return;
    }

    try {
      if (editingPhase) {
        await updatePhase({
          id: editingPhase.id,
          name: formData.name,
          focus_type: formData.focus_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          base_volume: formData.base_volume,
          notes: formData.notes || undefined,
        });
      } else {
        await createPhase({
          athlete_id: athleteId,
          name: formData.name,
          focus_type: formData.focus_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          base_volume: formData.base_volume,
          notes: formData.notes || undefined,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle click on timeline to add phase
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!athleteId) return;

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
      handleAddPhase(clickedDate);
    }
  };

  // Handle week marker click
  const handleWeekMarkerClick = (weekIndex: number) => {
    if (weekIndex < totalWeeks) {
      onWeekClick(weekIndex);
    }
  };

  if (!athleteId) {
    return null;
  }

  return (
    <div className={cn("border-b border-border/50", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-7 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Macro-Periodizzazione</span>
              {phases.length > 0 && (
                <Badge variant="secondary" className="h-5 text-3xs">
                  {phases.length} {phases.length === 1 ? "fase" : "fasi"}
                </Badge>
              )}
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleAddPhase()}
            disabled={!athleteId}
          >
            <Plus className="h-3 w-3" />
            Nuova Fase
          </Button>
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card className="border-0 rounded-none overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="w-full" ref={scrollRef}>
                  <div style={{ width: totalWidth + 60 }} className="min-w-full">
                    {/* Month Headers */}
                    <div className="flex border-b border-border/30 bg-secondary/20 sticky top-0 z-20">
                      <div className="w-[60px] flex-shrink-0 p-1.5 border-r border-border/30">
                        <span className="text-3xs text-muted-foreground">Mese</span>
                      </div>
                      {monthsArray.map((month, i) => {
                        const monthStart = startOfMonth(month);
                        const monthEnd = endOfMonth(month);
                        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                        const monthWidth = daysInMonth * DAY_WIDTH;

                        return (
                          <div
                            key={i}
                            className="border-r border-border/30 p-1.5 flex-shrink-0"
                            style={{ width: monthWidth }}
                          >
                            <span className="text-3xs font-medium">
                              {format(month, "MMM yy", { locale: it })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Phases Row */}
                    <div
                      className="relative border-b border-border/30 cursor-crosshair"
                      style={{ height: 40 }}
                      onClick={handleTimelineClick}
                    >
                      {/* Row label */}
                      <div className="absolute left-0 top-0 w-[60px] h-full flex items-center justify-center border-r border-border/30 bg-muted/10 z-10">
                        <span className="text-4xs text-muted-foreground font-medium">Fasi</span>
                      </div>

                      {/* Today marker */}
                      {showTodayMarker && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                          style={{ left: 60 + todayOffset * DAY_WIDTH }}
                        />
                      )}

                      {/* Phase blocks */}
                      <div className="absolute top-0 left-[60px] right-0 bottom-0">
                        {phases.map((phase) => (
                          <PhaseBlock
                            key={phase.id}
                            phase={phase}
                            dayWidth={DAY_WIDTH}
                            timelineStart={timelineStart}
                            isSelected={selectedPhase?.id === phase.id}
                            onEdit={handleEditPhase}
                            onDelete={handleDeletePhase}
                            onClick={handlePhaseClick}
                          />
                        ))}
                      </div>

                      {/* Empty state hint */}
                      {phases.length === 0 && (
                        <div className="absolute inset-0 left-[60px] flex items-center justify-center pointer-events-none">
                          <p className="text-3xs text-muted-foreground">
                            Clicca per aggiungere una fase
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Week Markers Row */}
                    <div className="flex border-b border-border/30 bg-muted/10">
                      <div className="w-[60px] flex-shrink-0 p-1 border-r border-border/30">
                        <span className="text-4xs text-muted-foreground">Sett.</span>
                      </div>
                      <div className="flex-1 relative h-6" style={{ width: totalWidth }}>
                        {weekMarkers.slice(0, totalWeeks).map((week) => (
                          <button
                            key={week.index}
                            onClick={() => handleWeekMarkerClick(week.index)}
                            className={cn(
                              "absolute top-0 h-full border-l border-border/20 px-0.5 hover:bg-primary/10 transition-colors",
                              week.index === currentWeek && "bg-primary/20",
                            )}
                            style={{ left: week.offset * DAY_WIDTH, width: 7 * DAY_WIDTH }}
                          >
                            <span
                              className={cn(
                                "text-5xs",
                                week.index === currentWeek
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground/60",
                              )}
                            >
                              {week.index + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Phase Legend - Compact */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/20 overflow-x-auto">
            {Object.entries(PHASE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className={cn(
                    "gap-1 px-1.5 py-0.5 text-4xs flex-shrink-0",
                    config.bgColor,
                    config.color,
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add/Edit Phase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {editingPhase ? "Modifica Fase" : "Nuova Fase"}
            </DialogTitle>
            <DialogDescription>Definisci le caratteristiche del mesociclo</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {overlapWarning && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{overlapWarning}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Nome Fase</Label>
              <Input
                placeholder="es. Blocco Ipertrofia Q1"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Focus</Label>
              <Select
                value={formData.focus_type}
                onValueChange={(value: PhaseFocusType) =>
                  setFormData((prev) => ({ ...prev, focus_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PHASE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, start_date: e.target.value }));
                    setOverlapWarning(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fine</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, end_date: e.target.value }));
                    setOverlapWarning(null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume Base (0-150)</Label>
              <Input
                type="number"
                min={50}
                max={150}
                value={formData.base_volume}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, base_volume: parseInt(e.target.value) || 100 }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Indicatore relativo del carico pianificato
              </p>
            </div>

            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Obiettivi, note..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSavePhase}
              className="gradient-primary"
              disabled={isCreating || isUpdating || !formData.name.trim()}
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPhase ? "Salva" : "Crea Fase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
