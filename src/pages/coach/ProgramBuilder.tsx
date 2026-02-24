import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { ExerciseLibrarySidebar, type LibraryExercise } from "@/components/coach/ExerciseLibrarySidebar";
import { WeekGrid, type ProgramExercise, type WeekProgram, type ProgramData } from "@/components/coach/WeekGrid";
import { WeekTabs, type PhaseInfo } from "@/components/coach/WeekTabs";
import { ExerciseContextEditor } from "@/components/coach/ExerciseContextEditor";
import { PeriodizationHeader } from "@/components/coach/PeriodizationHeader";
import { CloneWeekDialog } from "@/components/coach/CloneWeekDialog";
import { SaveDayTemplateDialog } from "@/components/coach/templates/SaveDayTemplateDialog";
import { TemplatesSidebar } from "@/components/coach/templates/TemplatesSidebar";
import { AiProgramWizard } from "@/components/coach/program/AiProgramWizard";
import { useWorkoutTemplates } from "@/hooks/useWorkoutTemplates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Save,
  RotateCcw,
  Dumbbell,
  Loader2,
  Calendar,
  AlertTriangle,
  Activity,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Eye,
  FileText,
  Copy,
  Bookmark,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useFmsAlerts, checkExerciseContraindication } from "@/hooks/useFmsAlerts";
import { useAthleteHealthProfile, type FmsScore } from "@/hooks/useAthleteHealthProfile";
import { usePeriodization } from "@/hooks/usePeriodization";
import { format, parseISO, differenceInWeeks } from "date-fns";
import { it } from "date-fns/locale";

// Import Zustand store and selectors
import { useProgramBuilderStore } from "@/stores/useProgramBuilderStore";
import {
  useProgramState,
  useWeekActions,
  useExerciseActions,
  useSupersetActions,
  useSelectionActions,
  useProgramActions,
  useTotalExerciseCount,
  useSelectedExerciseData,
  useDndHandlers,
} from "@/hooks/useProgramBuilderSelectors";

const DEFAULT_WEEKS = 4;
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Initialize empty program (simple: weekIndex -> dayIndex -> exercises[])
function createEmptyProgram(weeks: number = DEFAULT_WEEKS): ProgramData {
  const program: ProgramData = {};
  for (let w = 0; w < weeks; w++) {
    program[w] = {};
    for (let d = 0; d < 7; d++) {
      program[w][d] = [];
    }
  }
  return program;
}

// Create empty slot placeholder
function createEmptySlot(weekIndex: number, dayIndex: number): ProgramExercise {
  return {
    id: `slot-${weekIndex}-${dayIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    exerciseId: "",
    name: "",
    sets: 0,
    reps: "",
    load: "",
    rpe: null,
    restSeconds: 90,
    notes: "",
    isEmpty: true,
  };
}

// Dragging overlay component
function DragOverlayContent({ exercise }: { exercise: LibraryExercise | null }) {
  if (!exercise) return null;
  
  return (
    <div className="bg-card border-2 border-primary rounded-lg p-3 shadow-xl min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{exercise.name}</p>
          <p className="text-[10px] text-muted-foreground">{exercise.muscles?.[0] || ""}</p>
        </div>
      </div>
    </div>
  );
}

// Physical Readiness Banner Component
interface PhysicalReadinessBannerProps {
  healthProfile: import("@/hooks/useAthleteHealthProfile").AthleteHealthProfile;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
}

function PhysicalReadinessBanner({ 
  healthProfile, 
  isExpanded, 
  onToggleExpand,
  onViewDetails 
}: PhysicalReadinessBannerProps) {
  const { summary, athleteName, fmsTestDate, fmsTotalScore, fmsMaxScore, activeInjuries } = healthProfile;
  
  const statusConfig = {
    green: {
      bgClass: "bg-emerald-500/5 border-emerald-500/30",
      iconBgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-600",
      textClass: "text-emerald-700 dark:text-emerald-400",
      Icon: CheckCircle2,
    },
    yellow: {
      bgClass: "bg-amber-500/5 border-amber-500/30",
      iconBgClass: "bg-amber-500/10",
      iconClass: "text-amber-600",
      textClass: "text-amber-700 dark:text-amber-400",
      Icon: AlertTriangle,
    },
    red: {
      bgClass: "bg-destructive/5 border-destructive/50",
      iconBgClass: "bg-destructive/10",
      iconClass: "text-destructive",
      textClass: "text-destructive",
      Icon: ShieldAlert,
    },
  };
  
  const config = statusConfig[summary.status];
  const Icon = config.Icon;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className={cn("transition-all duration-200", config.bgClass)}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", config.iconBgClass)}>
                <Icon className={cn("h-4 w-4", config.iconClass)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={cn("text-sm font-semibold", config.textClass)}>
                    {summary.title}
                  </h4>
                  {fmsTestDate && (
                    <Badge variant="outline" className={cn("text-[10px]", config.textClass)}>
                      FMS: {fmsTotalScore}/{fmsMaxScore}
                    </Badge>
                  )}
                  {activeInjuries.length > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {activeInjuries.length} infortuni
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{summary.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <div className="border-t border-border/50 pt-2 space-y-1.5">
              {summary.details.slice(0, 5).map((detail, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-11">
                  {detail}
                </p>
              ))}
              {summary.details.length > 5 && (
                <p className="text-xs text-muted-foreground pl-11">
                  +{summary.details.length - 5} altri dettagli...
                </p>
              )}
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                >
                  <FileText className="h-3 w-3 mr-1.5" />
                  Dettagli Completi
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// FMS Score Card for Details Dialog
function FmsScoreCard({ score }: { score: FmsScore }) {
  const statusColors = {
    optimal: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    limited: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    dysfunctional: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    pain: "bg-destructive/10 text-destructive border-destructive/30",
  };
  
  const statusLabels = {
    optimal: "Ottimale",
    limited: "Limitato",
    dysfunctional: "Disfunzionale",
    pain: "Dolore",
  };
  
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      statusColors[score.status]
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{score.testName}</span>
        <Badge variant="outline" className={cn("text-[10px]", statusColors[score.status])}>
          {statusLabels[score.status]}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{score.bodyArea}</p>
      {score.leftScore !== null && score.rightScore !== null ? (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Sx:</span>
            <span className="font-semibold tabular-nums">{score.leftScore}/3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Dx:</span>
            <span className="font-semibold tabular-nums">{score.rightScore}/3</span>
          </div>
        </div>
      ) : (
        <div className="text-sm">
          <span className="font-semibold tabular-nums">{score.score ?? score.minScore}/3</span>
        </div>
      )}
    </div>
  );
}

export default function ProgramBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // =========================================
  // ZUSTAND STORE - Core program state (NO local state for program data!)
  // =========================================
  const { program, totalWeeks, currentWeek, isDirty, programName: storeProgramName } = useProgramState();
  const totalExercises = useTotalExerciseCount();
  const selectedExerciseData = useSelectedExerciseData();
  const storeSelectedExercise = useProgramBuilderStore((state) => state.selectedExercise);

  // Store Actions
  const weekActions = useWeekActions();
  const exerciseActions = useExerciseActions();
  const supersetActions = useSupersetActions();
  const selectionActions = useSelectionActions();
  const programActions = useProgramActions();
  const dndHandlers = useDndHandlers();

  // =========================================
  // UI-ONLY local state (not program data)
  // =========================================
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<LibraryExercise | null>(null);

  // Clone Week Dialog state
  const [cloneWeekDialogOpen, setCloneWeekDialogOpen] = useState(false);
  const [cloneWeekSourceIndex, setCloneWeekSourceIndex] = useState(0);
  const [isCloning, setIsCloning] = useState(false);

  // Workout Templates state
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [saveTemplateDayIndex, setSaveTemplateDayIndex] = useState(0);
  const [templatesSidebarOpen, setTemplatesSidebarOpen] = useState(false);
  const [aiWizardOpen, setAiWizardOpen] = useState(false);

  // Workout Templates hook
  const {
    templates,
    allTags,
    isLoading: templatesLoading,
    createTemplate,
    deleteTemplate,
    isCreating: templatesCreating,
    isDeleting: templatesDeleting,
    hydrateTemplate,
  } = useWorkoutTemplates();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ["coach-athletes-for-program", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, one_rm_data")
        .eq("coach_id", user.id)
        .eq("role", "athlete");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId) || athletes[0];
  
  // FMS Alerts for exercise contraindication checks
  const { data: fmsAlerts } = useFmsAlerts(selectedAthlete?.id || null);
  
  // Comprehensive health profile for selected athlete
  const { data: healthProfile, isLoading: loadingHealth } = useAthleteHealthProfile(selectedAthlete?.id || null);
  
  // Periodization phases for the athlete
  const { phases } = usePeriodization(selectedAthlete?.id || null);
  
  // Convert phases to PhaseInfo format for WeekTabs
  const phaseInfos: PhaseInfo[] = useMemo(() => {
    return phases.map(p => ({
      id: p.id,
      name: p.name,
      focus_type: p.focus_type,
      start_date: p.start_date,
      end_date: p.end_date,
    }));
  }, [phases]);
  
  // UI state for health banner
  const [healthBannerExpanded, setHealthBannerExpanded] = useState(false);
  const [healthDetailsDialogOpen, setHealthDetailsDialogOpen] = useState(false);
  
  // Auto-expand banner for yellow/red status
  useEffect(() => {
    if (healthProfile?.summary.status === "red") {
      setHealthBannerExpanded(true);
    } else if (healthProfile?.summary.status === "yellow") {
      setHealthBannerExpanded(true);
    } else {
      setHealthBannerExpanded(false);
    }
  }, [healthProfile?.summary.status, selectedAthlete?.id]);

  // Get 1RM reference
  const getOneRM = useCallback((): number => {
    if (!selectedAthlete?.one_rm_data) return 100;
    const oneRmData = selectedAthlete.one_rm_data as Record<string, number>;
    return oneRmData.squat || oneRmData.bench || 100;
  }, [selectedAthlete]);

  // Current week data from store
  const weekData = program[currentWeek] || {};

  // =========================================
  // Clone Week Handler
  // =========================================
  const handleOpenCloneWeekDialog = useCallback((weekIndex: number) => {
    setCloneWeekSourceIndex(weekIndex);
    setCloneWeekDialogOpen(true);
  }, []);

  const handleConfirmCloneWeek = useCallback((targetWeekIndices: number[]) => {
    setIsCloning(true);
    try {
      weekActions.cloneWeekToRange(cloneWeekSourceIndex, targetWeekIndices);
      toast.success(
        `Settimana ${cloneWeekSourceIndex + 1} clonata in ${targetWeekIndices.length} settiman${targetWeekIndices.length === 1 ? 'a' : 'e'}!`,
        { description: "Tutti gli esercizi sono stati copiati con nuovi ID univoci" }
      );
      setCloneWeekDialogOpen(false);
    } catch (error) {
      console.error("Clone week error:", error);
      toast.error("Errore durante la clonazione della settimana");
    } finally {
      setIsCloning(false);
    }
  }, [cloneWeekSourceIndex, weekActions]);

  // =========================================
  // Apply Progression Handler
  // =========================================
  const handleApplyProgression = useCallback((weekIndex: number) => {
    weekActions.applyProgression(weekIndex);
    toast.success(
      `Progressione applicata dalla Settimana ${weekIndex + 1}`,
      { description: "I carichi e i parametri sono stati aggiornati nelle settimane successive" }
    );
  }, [weekActions]);

  // =========================================
  // Remove Week Handler
  // =========================================
  const handleRemoveWeek = useCallback((weekIndex: number) => {
    if (totalWeeks <= 1) {
      toast.error("Devi mantenere almeno una settimana");
      return;
    }
    weekActions.removeWeek(weekIndex);
    toast.success(`Settimana ${weekIndex + 1} eliminata`);
  }, [totalWeeks, weekActions]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (active.data.current?.type === "library-exercise") {
      setActiveExercise(active.data.current.exercise);
    }
  }, []);

  // Handle drag end - uses store actions
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveExercise(null);

      if (!over) return;

      // Library exercise dropped on empty slot
      if (
        active.data.current?.type === "library-exercise" &&
        over.data.current?.type === "empty-slot"
      ) {
        const libraryExercise = active.data.current.exercise as LibraryExercise;
        const { weekIndex, dayIndex, slotId } = over.data.current;

        // Check for contraindications before adding
        if (fmsAlerts?.flags && fmsAlerts.flags.length > 0) {
          const contraindication = checkExerciseContraindication(
            libraryExercise.name,
            fmsAlerts.flags
          );
          if (contraindication) {
            toast.warning(`⚠️ Controindicato: ${libraryExercise.name}`, {
              description: `${fmsAlerts.athleteName} ha ${contraindication.message}`,
              duration: 5000,
            });
          }
        }

        // Use store action to fill the slot
        exerciseActions.fillSlot(slotId, libraryExercise, weekIndex, dayIndex);
        return;
      }

      // Library exercise dropped on day cell (append to end)
      if (
        active.data.current?.type === "library-exercise" &&
        over.data.current?.type === "day-cell"
      ) {
        const libraryExercise = active.data.current.exercise as LibraryExercise;
        const { weekIndex, dayIndex } = over.data.current;

        if (fmsAlerts?.flags && fmsAlerts.flags.length > 0) {
          const contraindication = checkExerciseContraindication(
            libraryExercise.name,
            fmsAlerts.flags
          );
          if (contraindication) {
            toast.warning(`⚠️ Controindicato: ${libraryExercise.name}`, {
              description: `${fmsAlerts.athleteName} ha ${contraindication.message}`,
              duration: 5000,
            });
          }
        }

        const newExercise: ProgramExercise = {
          id: crypto.randomUUID(),
          exerciseId: libraryExercise.id,
          name: libraryExercise.name,
          sets: 3,
          reps: "8",
          load: "",
          rpe: null,
          restSeconds: 90,
          notes: "",
          isEmpty: false,
          // Snapshot configuration at time of adding
          snapshotTrackingFields: [...libraryExercise.tracking_fields],
          snapshotMuscles: [...libraryExercise.muscles],
        };

        exerciseActions.addExercise(dayIndex, newExercise, weekIndex);
        return;
      }

      // Reorder within same day - use store action
      if (
        active.data.current?.type === "program-exercise" &&
        over.data.current?.type === "program-exercise"
      ) {
        const activeData = active.data.current;
        const overData = over.data.current;

        if (
          activeData.dayIndex === overData.dayIndex &&
          activeData.weekIndex === overData.weekIndex
        ) {
          const { weekIndex, dayIndex } = activeData;
          const exercises = program[weekIndex]?.[dayIndex] || [];
          const oldIndex = exercises.findIndex((e) => e.id === active.id);
          const newIndex = exercises.findIndex((e) => e.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(exercises.map((e) => e.id), oldIndex, newIndex);
            exerciseActions.reorderExercises(dayIndex, newOrder, weekIndex);
          }
        }
      }
    },
    [fmsAlerts, exerciseActions, program]
  );

  // Add empty slot to a day - uses store action
  const handleAddSlot = useCallback(
    (dayIndex: number) => {
      exerciseActions.addEmptySlot(dayIndex, currentWeek);
    },
    [currentWeek, exerciseActions]
  );

  // Remove exercise - uses store action
  const handleRemoveExercise = useCallback(
    (dayIndex: number, exerciseId: string) => {
      exerciseActions.removeExercise(dayIndex, exerciseId, currentWeek);
    },
    [currentWeek, exerciseActions]
  );

  // Select exercise for editing in context panel - uses store action
  const handleSelectExercise = useCallback(
    (dayIndex: number, exercise: ProgramExercise) => {
      if (exercise.isEmpty) return; // Don't select empty slots
      selectionActions.selectExercise(currentWeek, dayIndex, exercise.id);
    },
    [currentWeek, selectionActions]
  );

  // Toggle superset - uses store action
  const handleToggleSuperset = useCallback(
    (dayIndex: number, exerciseId: string) => {
      supersetActions.toggleSuperset(dayIndex, exerciseId, currentWeek);
    },
    [currentWeek, supersetActions]
  );

  // Copy day to other days - uses store action
  const [isCopyingDay, setIsCopyingDay] = useState(false);
  const [isCopyingWeek, setIsCopyingWeek] = useState(false);

  const handleCopyDay = useCallback(
    async (sourceDayIndex: number, targetDays: number[], mode: "append" | "overwrite") => {
      const sourceExercises = program[currentWeek]?.[sourceDayIndex] || [];
      const filledExercises = sourceExercises.filter((e) => !e.isEmpty);
      
      if (filledExercises.length === 0) {
        toast.error("Nessun esercizio da copiare");
        return;
      }

      setIsCopyingDay(true);
      
      try {
        // Use store action for copy
        for (const targetDay of targetDays) {
          exerciseActions.copyDay?.(
            currentWeek, sourceDayIndex, 
            currentWeek, targetDay, 
            mode
          );
        }

        toast.success(
          `Workout copiato in ${targetDays.length} ${targetDays.length === 1 ? 'giorno' : 'giorni'}!`,
          { description: mode === "append" ? "Esercizi aggiunti" : "Giornate sostituite" }
        );
      } catch (error) {
        console.error("Copy day error:", error);
        toast.error("Errore durante la copia", {
          description: error instanceof Error ? error.message : "Riprova più tardi"
        });
      } finally {
        setIsCopyingDay(false);
      }
    },
    [currentWeek, program, exerciseActions]
  );

  // Copy week to other weeks - now uses CloneWeekDialog
  const handleCopyWeekTo = useCallback(
    async (targetWeeks: number[]) => {
      const sourceWeek = program[currentWeek];
      if (!sourceWeek) return;

      const hasExercises = Object.values(sourceWeek).some(
        (exercises) => exercises.filter((e) => !e.isEmpty).length > 0
      );
      
      if (!hasExercises) {
        toast.error("Settimana vuota, niente da copiare");
        return;
      }

      setIsCopyingWeek(true);

      try {
        // Use store action for clone
        weekActions.cloneWeekToRange(currentWeek, targetWeeks);

        toast.success(
          `Settimana copiata in ${targetWeeks.length} ${targetWeeks.length === 1 ? 'settimana' : 'settimane'}!`
        );
      } catch (error) {
        console.error("Copy week error:", error);
        toast.error("Errore durante la copia della settimana", {
          description: error instanceof Error ? error.message : "Riprova più tardi"
        });
      } finally {
        setIsCopyingWeek(false);
      }
    },
    [currentWeek, program, weekActions]
  );

  // Clear week - uses store action
  const handleClearWeek = useCallback(() => {
    for (let d = 0; d < 7; d++) {
      useProgramBuilderStore.getState().clearDay(currentWeek, d);
    }
    toast.success(`Settimana ${currentWeek + 1} svuotata`);
  }, [currentWeek]);

  // =========================================
  // Template Handlers
  // =========================================
  const DAYS_FULL = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  const handleOpenSaveTemplateDialog = useCallback((dayIndex: number) => {
    setSaveTemplateDayIndex(dayIndex);
    setSaveTemplateDialogOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    async (data: { name: string; description: string; tags: string[] }) => {
      const exercises = program[currentWeek]?.[saveTemplateDayIndex] || [];
      await createTemplate({
        name: data.name,
        description: data.description,
        structure: exercises,
        tags: data.tags,
      });
    },
    [currentWeek, saveTemplateDayIndex, program, createTemplate]
  );

  const handleInsertTemplate = useCallback(
    (exercises: ProgramExercise[]) => {
      // Append template exercises to the selected day
      for (const exercise of exercises) {
        exerciseActions.addExercise(saveTemplateDayIndex, exercise, currentWeek);
      }
      toast.success(`Template inserito in ${DAYS_FULL[saveTemplateDayIndex]}!`);
    },
    [currentWeek, saveTemplateDayIndex, exerciseActions]
  );

  // Reset entire program - uses store action
  const handleResetProgram = useCallback(() => {
    programActions.reset();
    toast.success("Programma resettato");
  }, [programActions]);

  // Handle AI Program apply - loads generated data into the store
  const handleAiProgramApply = useCallback((aiProgramData: ProgramData, rationale: string) => {
    // Load the AI-generated week into the store
    const state = useProgramBuilderStore.getState();
    const currentProgram = { ...state.program };
    
    // Merge AI data into week 0 (current)
    const aiWeek = aiProgramData[0];
    if (aiWeek) {
      currentProgram[0] = aiWeek;
    }
    
    programActions.loadProgram(currentProgram, state.programId || '', state.programName || 'AI Generated');
    
  }, [programActions]);

  // Handle weeks generated from periodization - uses store action
  const handleWeeksGenerated = useCallback((weeks: number) => {
    weekActions.setTotalWeeks(weeks);
  }, [weekActions]);

  // Handle week navigation from timeline - uses store action
  const handleWeekFromTimeline = useCallback((weekIndex: number) => {
    if (weekIndex >= 0 && weekIndex < totalWeeks) {
      weekActions.setCurrentWeek(weekIndex);
    }
  }, [totalWeeks, weekActions]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      athleteIds,
      title,
      structure,
    }: {
      athleteIds: string[];
      title: string;
      structure: ProgramData;
    }) => {
      if (!user) throw new Error("Non autenticato");
      if (athleteIds.length === 0) throw new Error("Seleziona almeno un atleta");

      const workoutsToInsert: Array<{
        coach_id: string;
        athlete_id: string;
        title: string;
        description: string | null;
        structure: any;
        status: "pending" | "in_progress" | "completed" | "skipped";
        scheduled_date: string | null;
        estimated_duration: number | null;
      }> = [];

      const today = new Date();

      for (const athleteId of athleteIds) {
        for (const [weekStr, days] of Object.entries(structure)) {
          const weekIndex = parseInt(weekStr);
          for (const [dayStr, exercises] of Object.entries(days)) {
            const dayIndex = parseInt(dayStr);
            const filledExercises = exercises.filter((e) => !e.isEmpty);

            if (filledExercises.length > 0) {
              const scheduledDate = new Date(today);
              scheduledDate.setDate(today.getDate() + weekIndex * 7 + dayIndex);

              workoutsToInsert.push({
                coach_id: user.id,
                athlete_id: athleteId,
                title: `${title} - S${weekIndex + 1} ${DAYS[dayIndex]}`,
                description: null,
                structure: filledExercises,
                status: "pending",
                scheduled_date: scheduledDate.toISOString().split("T")[0],
                estimated_duration: filledExercises.length * 10,
              });
            }
          }
        }
      }

      if (workoutsToInsert.length === 0) {
        throw new Error("Il programma è vuoto. Aggiungi almeno un esercizio.");
      }

      const { error } = await supabase.from("workouts").insert(workoutsToInsert as any);
      if (error) throw error;
      return { sessions: workoutsToInsert.length, athletes: athleteIds.length };
    },
    onSuccess: (result) => {
      toast.success(`Programma salvato! ${result.sessions} sessioni per ${result.athletes} atleti.`);
      queryClient.invalidateQueries({ queryKey: ["coach-workouts"] });
      setSaveDialogOpen(false);
      setProgramName("");
      setSelectedAthleteIds([]);
      handleResetProgram();
    },
    onError: (error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (selectedAthleteIds.length === 0) {
      toast.error("Seleziona almeno un atleta");
      return;
    }
    if (!programName.trim()) {
      toast.error("Inserisci un nome per il programma");
      return;
    }
    saveMutation.mutate({
      athleteIds: selectedAthleteIds,
      title: programName.trim(),
      structure: program,
    });
  };

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthleteIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  // Convert selected exercise for context editor compatibility
  const contextEditorExercise = selectedExerciseData ? {
    ...selectedExerciseData,
  } : null;

  return (
    <CoachLayout title="Costruttore Programmi" subtitle="Crea schede di allenamento drag & drop">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-[calc(100vh-140px)] overflow-hidden">
          {/* Left Sidebar - Exercise Library */}
          <ExerciseLibrarySidebar className="w-[320px] min-w-[320px] shrink-0" />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-x-auto">
            {/* TOP ROW: Periodization Timeline Header */}
            <PeriodizationHeader
              athleteId={selectedAthlete?.id || null}
              currentWeek={currentWeek}
              totalWeeks={totalWeeks}
              onWeeksGenerated={handleWeeksGenerated}
              onWeekClick={handleWeekFromTimeline}
            />
            
            {/* Physical Readiness Banner */}
            {selectedAthlete && healthProfile && (
              <div className="mx-4 mt-2">
                <PhysicalReadinessBanner
                  healthProfile={healthProfile}
                  isExpanded={healthBannerExpanded}
                  onToggleExpand={() => setHealthBannerExpanded(!healthBannerExpanded)}
                  onViewDetails={() => setHealthDetailsDialogOpen(true)}
                />
              </div>
            )}
            
            {/* Header Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card">
              <div className="flex items-center gap-4">
                {/* Athlete Selector */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={selectedAthleteId || selectedAthlete?.id || ""}
                    onValueChange={setSelectedAthleteId}
                  >
                    <SelectTrigger className="w-44 h-8 text-sm">
                      <SelectValue placeholder="Seleziona atleta" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nessun atleta
                        </SelectItem>
                      ) : (
                        athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.full_name || "Atleta"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 1RM Display */}
                {selectedAthlete && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
                    <Label className="text-xs text-muted-foreground">1RM Ref</Label>
                    <span className="text-sm font-semibold tabular-nums">{getOneRM()} kg</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {totalExercises} esercizi
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setAiWizardOpen(true)}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  ✨ AI Designer
                </Button>
                <Button
                  size="sm"
                  className="h-8 gradient-primary"
                  onClick={() => {
                    if (selectedAthlete?.id && !selectedAthleteIds.includes(selectedAthlete.id)) {
                      setSelectedAthleteIds([selectedAthlete.id]);
                    }
                    setSaveDialogOpen(true);
                  }}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Salva
                </Button>
              </div>
            </div>

            {/* MIDDLE ROW: Week Tabs with Phase Colors */}
            <WeekTabs
              currentWeek={currentWeek}
              totalWeeks={totalWeeks}
              phases={phaseInfos}
              onWeekChange={weekActions.setCurrentWeek}
              onCloneWeek={handleOpenCloneWeekDialog}
              onApplyProgression={handleApplyProgression}
              onRemoveWeek={handleRemoveWeek}
              onCopyWeek={(weekIndex) => {
                weekActions.copyWeekToClipboard(weekIndex);
                toast.success("Settimana copiata con successo!", {
                  description: `Settimana ${weekIndex + 1} copiata negli appunti`,
                });
              }}
              onPasteWeek={(weekIndex) => {
                weekActions.pasteWeekFromClipboard(weekIndex);
                toast.success("Settimana incollata!", {
                  description: `Contenuto incollato nella Settimana ${weekIndex + 1}`,
                });
              }}
              onClearWeek={(weekIndex) => {
                weekActions.clearWeek(weekIndex);
                toast.success(`Settimana ${weekIndex + 1} svuotata`);
              }}
              hasClipboard={!!useProgramBuilderStore.getState().weekClipboard}
            />

            {/* MAIN SECTION: Slot-Based Day Grid */}
            <div className="relative flex-1">
              <WeekGrid
                currentWeek={currentWeek}
                totalWeeks={totalWeeks}
                weekData={weekData}
                selectedExerciseId={storeSelectedExercise?.exerciseId}
                isCopyingDay={isCopyingDay}
                isCopyingWeek={isCopyingWeek}
                onWeekChange={weekActions.setCurrentWeek}
                onRemoveExercise={handleRemoveExercise}
                onToggleSuperset={handleToggleSuperset}
                onSelectExercise={handleSelectExercise}
                onAddSlot={handleAddSlot}
                onCopyDay={handleCopyDay}
                onCopyWeekTo={handleCopyWeekTo}
                onClearWeek={handleClearWeek}
                onSaveAsTemplate={handleOpenSaveTemplateDialog}
              />
              {/* Load Templates Button - Floating */}
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-4 right-4 shadow-md bg-background"
                onClick={() => setTemplatesSidebarOpen(true)}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Carica Template
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Context Editor */}
          {storeSelectedExercise && contextEditorExercise && (
            <ExerciseContextEditor
              exercise={contextEditorExercise as any}
              dayIndex={storeSelectedExercise.dayIndex}
              weekIndex={storeSelectedExercise.weekIndex}
              oneRM={getOneRM()}
              onClose={() => selectionActions.clearSelection()}
              className="w-72 flex-shrink-0"
            />
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          <DragOverlayContent exercise={activeExercise} />
        </DragOverlay>
      </DndContext>

      {/* Clone Week Dialog */}
      <CloneWeekDialog
        open={cloneWeekDialogOpen}
        onOpenChange={setCloneWeekDialogOpen}
        sourceWeekIndex={cloneWeekSourceIndex}
        totalWeeks={totalWeeks}
        onConfirm={handleConfirmCloneWeek}
        isLoading={isCloning}
      />

      {/* Save Day as Template Dialog */}
      <SaveDayTemplateDialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
        exercises={program[currentWeek]?.[saveTemplateDayIndex] || []}
        dayName={DAYS_FULL[saveTemplateDayIndex]}
        onSave={handleSaveTemplate}
        isLoading={templatesCreating}
      />

      {/* Templates Sidebar */}
      <TemplatesSidebar
        open={templatesSidebarOpen}
        onOpenChange={setTemplatesSidebarOpen}
        templates={templates}
        allTags={allTags}
        isLoading={templatesLoading}
        isDeleting={templatesDeleting}
        onInsert={handleInsertTemplate}
        onDelete={deleteTemplate}
        hydrateTemplate={hydrateTemplate}
      />

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Salva Programma
            </DialogTitle>
            <DialogDescription>
              Assegna il programma agli atleti selezionati
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Nome Programma</Label>
              <Input
                id="program-name"
                placeholder="es. Forza - Mesociclo 1"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Atleti</Label>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                {athletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun atleta collegato
                  </p>
                ) : (
                  <div className="space-y-2">
                    {athletes.map((athlete) => (
                      <div
                        key={athlete.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedAthleteIds.includes(athlete.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-secondary"
                        )}
                        onClick={() => toggleAthleteSelection(athlete.id)}
                      >
                        <Checkbox checked={selectedAthleteIds.includes(athlete.id)} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {athlete.full_name || "Atleta"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gradient-primary"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva Programma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Details Dialog */}
      <Dialog open={healthDetailsDialogOpen} onOpenChange={setHealthDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Profilo Salute: {healthProfile?.athleteName}
            </DialogTitle>
            <DialogDescription>
              Dettaglio completo della situazione fisica dell'atleta
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* FMS Scores Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Test FMS</h3>
                  {healthProfile?.fmsTestDate && (
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(healthProfile.fmsTestDate), "d MMMM yyyy", { locale: it })}
                    </Badge>
                  )}
                </div>
                {healthProfile?.fmsScores && healthProfile.fmsScores.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {healthProfile.fmsScores.map((score) => (
                      <FmsScoreCard key={score.testKey} score={score} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Nessun test FMS registrato
                    </p>
                  </Card>
                )}
                {healthProfile && (
                  <div className="mt-3 p-3 rounded-lg bg-secondary/50 text-center">
                    <span className="text-sm text-muted-foreground">Punteggio Totale: </span>
                    <span className="text-lg font-bold">
                      {healthProfile.fmsTotalScore}/{healthProfile.fmsMaxScore}
                    </span>
                  </div>
                )}
              </div>

              {/* Active Injuries Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Infortuni Attivi</h3>
                {healthProfile?.activeInjuries && healthProfile.activeInjuries.length > 0 ? (
                  <div className="space-y-2">
                    {healthProfile.activeInjuries.map((injury) => (
                      <Card key={injury.id} className="p-3 border-destructive/30 bg-destructive/5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-destructive">{injury.bodyZone}</p>
                            {injury.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{injury.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px]",
                                injury.status === "in_rehab" 
                                  ? "border-destructive/50 text-destructive"
                                  : "border-amber-500/50 text-amber-600"
                              )}
                            >
                              {injury.status === "in_rehab" ? "In Riabilitazione" : 
                               injury.status === "monitoring" ? "In Osservazione" : "Recuperato"}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              dal {format(new Date(injury.injuryDate), "d MMM", { locale: it })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      ✅ Nessun infortunio attivo
                    </p>
                  </Card>
                )}
              </div>

              {/* Recent Pain Reports */}
              {healthProfile?.recentPainReports && healthProfile.recentPainReports.some(r => r.hasPain) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Dolore Recente (ultimi 7 giorni)</h3>
                  <div className="space-y-1">
                    {healthProfile.recentPainReports
                      .filter(r => r.hasPain)
                      .map((report, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-destructive/5">
                          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-muted-foreground">
                            {format(new Date(report.date), "EEEE d MMMM", { locale: it })}
                          </span>
                          <span className="text-destructive">- Dolore riportato</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setHealthDetailsDialogOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Program Wizard */}
      <AiProgramWizard
        open={aiWizardOpen}
        onOpenChange={setAiWizardOpen}
        athleteId={selectedAthlete?.id || null}
        athleteName={selectedAthlete?.full_name || "Atleta"}
        onApply={handleAiProgramApply}
      />
    </CoachLayout>
  );
}
