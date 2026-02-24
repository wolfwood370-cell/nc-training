import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MultiSelect, GroupedOptions } from "@/components/ui/multi-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dumbbell, 
  Search, 
  ChevronRight,
  Plus,
  Loader2,
  X,
  MoreVertical,
  Pencil,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  MUSCLE_TAGS,
  MOVEMENT_PATTERNS,
  EXERCISE_TYPES,
  getMusclesGrouped,
} from "@/lib/muscleTags";
import { TrackingMetricBuilder } from "@/components/coach/TrackingMetricBuilder";

// Types
export interface LibraryExercise {
  id: string;
  name: string;
  video_url: string | null;
  muscles: string[];
  secondary_muscles: string[];
  tracking_fields: string[];
  movement_pattern: string | null;
  exercise_type: string;
  notes: string | null;
  coach_id: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

// Macro muscle categories for compact filter
const MACRO_MUSCLES = Object.entries(MUSCLE_TAGS).map(([key, val]) => ({
  value: key,
  label: val.label,
  muscles: val.muscles as readonly string[],
}));

// Convert muscle tags to grouped options for MultiSelect
const muscleOptions: GroupedOptions[] = getMusclesGrouped().map((group) => ({
  group: group.category,
  options: group.muscles.map((muscle) => ({
    value: muscle,
    label: muscle,
  })),
}));

// Draggable exercise item with actions
interface DraggableExerciseProps {
  exercise: LibraryExercise;
  onEdit: (exercise: LibraryExercise) => void;
  onArchive: (exercise: LibraryExercise) => void;
}

function DraggableExercise({ exercise, onEdit, onArchive }: DraggableExerciseProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${exercise.id}`,
    data: { type: "library-exercise", exercise },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg",
        "bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5",
        "transition-all duration-150 group",
        isDragging && "opacity-50 ring-2 ring-primary shadow-lg"
      )}
    >
      {/* Drag handle area */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
      >
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{exercise.name}</p>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {exercise.muscles.slice(0, 2).map((muscle) => (
              <Badge 
                key={muscle} 
                variant="secondary" 
                className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-0"
              >
                {muscle.split(" ")[0]}
              </Badge>
            ))}
            {exercise.muscles.length > 2 && (
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                +{exercise.muscles.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions dropdown - separate from drag handle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onEdit(exercise)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Modifica
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onArchive(exercise)}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="h-3.5 w-3.5 mr-2" />
            Archivia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

interface ExerciseLibrarySidebarProps {
  className?: string;
}

export function ExerciseLibrarySidebar({ className }: ExerciseLibrarySidebarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPattern, setSelectedPattern] = useState<string>("all");
  const [selectedMacroMuscle, setSelectedMacroMuscle] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<LibraryExercise | null>(null);
  const [formName, setFormName] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formMuscles, setFormMuscles] = useState<string[]>([]);
  const [formSecondaryMuscles, setFormSecondaryMuscles] = useState<string[]>([]);
  const [formTrackingFields, setFormTrackingFields] = useState<string[]>(["sets", "reps", "weight"]);
  const [formPattern, setFormPattern] = useState("");
  const [formExerciseType, setFormExerciseType] = useState("Multi-articolare");

  // Check if in edit mode
  const isEditMode = editingExercise !== null;

  // Fetch exercises from Supabase
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercises", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("coach_id", user.id)
        .eq("archived", false)
        .order("name");
      if (error) throw error;
      return data as LibraryExercise[];
    },
    enabled: !!user?.id,
  });

  // Create exercise mutation
  const createMutation = useMutation({
    mutationFn: async (exercise: Omit<LibraryExercise, "id" | "coach_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          ...exercise,
          coach_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio creato con successo!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Errore nella creazione: " + error.message);
    },
  });

  // Update exercise mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...exercise }: Partial<LibraryExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("exercises")
        .update(exercise)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio aggiornato!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento: " + error.message);
    },
  });

  // Archive exercise mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exercises")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Esercizio archiviato");
    },
    onError: (error) => {
      toast.error("Errore nell'archiviazione: " + error.message);
    },
  });

  // Reset form
  const resetForm = () => {
    setEditingExercise(null);
    setFormName("");
    setFormVideoUrl("");
    setFormMuscles([]);
    setFormSecondaryMuscles([]);
    setFormTrackingFields(["sets", "reps", "weight"]);
    setFormPattern("");
    setFormExerciseType("Multi-articolare");
  };

  // Open dialog in edit mode
  const handleEdit = (exercise: LibraryExercise) => {
    setEditingExercise(exercise);
    setFormName(exercise.name);
    setFormVideoUrl(exercise.video_url || "");
    setFormMuscles(exercise.muscles);
    setFormSecondaryMuscles(exercise.secondary_muscles);
    setFormTrackingFields(exercise.tracking_fields);
    setFormPattern(exercise.movement_pattern || "");
    setFormExerciseType(exercise.exercise_type);
    setDialogOpen(true);
  };

  // Handle archive
  const handleArchive = (exercise: LibraryExercise) => {
    archiveMutation.mutate(exercise.id);
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }

    if (!formExerciseType) {
      toast.error("Il tipo di esercizio è obbligatorio");
      return;
    }

    const exerciseData = {
      name: formName.trim(),
      video_url: formVideoUrl.trim() || null,
      muscles: formMuscles,
      secondary_muscles: formSecondaryMuscles,
      tracking_fields: formTrackingFields,
      movement_pattern: formPattern || null,
      exercise_type: formExerciseType,
      notes: null,
      archived: false,
    };

    if (isEditMode && editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, ...exerciseData });
    } else {
      createMutation.mutate(exerciseData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Get muscles for selected macro category
  const selectedMacroMuscles = useMemo(() => {
    if (selectedMacroMuscle === "all") return [];
    const macro = MACRO_MUSCLES.find(m => m.value === selectedMacroMuscle);
    return macro ? [...macro.muscles] : [];
  }, [selectedMacroMuscle]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = selectedType === "all" || ex.exercise_type === selectedType;

      // Pattern filter
      const matchesPattern = selectedPattern === "all" || ex.movement_pattern === selectedPattern;

      // Macro muscle filter - check if any of the exercise's muscles are in the selected macro category
      const matchesMuscle = selectedMacroMuscle === "all" || 
        ex.muscles.some(m => selectedMacroMuscles.includes(m));

      return matchesSearch && matchesType && matchesPattern && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedType, selectedPattern, selectedMacroMuscle, selectedMacroMuscles]);

  // Check if any filter is active
  const hasActiveFilters = selectedType !== "all" || selectedPattern !== "all" || selectedMacroMuscle !== "all";

  // Clear all filters
  const clearFilters = () => {
    setSelectedType("all");
    setSelectedPattern("all");
    setSelectedMacroMuscle("all");
    setSearchQuery("");
  };

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="p-3 border-b border-border/50 space-y-3">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Libreria Esercizi
          </h3>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Modifica Esercizio" : "Nuovo Esercizio"}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? "Modifica i dettagli dell'esercizio" 
                    : "Aggiungi un nuovo esercizio alla libreria"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="es. Panca Piana con Bilanciere"
                  />
                </div>

                {/* Video URL */}
                <div className="space-y-2">
                  <Label htmlFor="video">Video URL</Label>
                  <Input
                    id="video"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                {/* Exercise Type */}
                <div className="space-y-2">
                  <Label>Tipo di Esercizio *</Label>
                  <Select value={formExerciseType} onValueChange={setFormExerciseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXERCISE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracking Metrics Builder */}
                <div className="border border-border rounded-lg p-4 bg-secondary/20">
                  <TrackingMetricBuilder
                    value={formTrackingFields}
                    onChange={setFormTrackingFields}
                  />
                </div>

                {/* Movement Pattern */}
                <div className="space-y-2">
                  <Label>Schema Motorio</Label>
                  <Select value={formPattern} onValueChange={setFormPattern}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona pattern..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {MOVEMENT_PATTERNS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Muscles Multi-Select */}
                <div className="space-y-2">
                  <Label>Muscoli Primari</Label>
                  <MultiSelect
                    options={muscleOptions}
                    selected={formMuscles}
                    onChange={setFormMuscles}
                    placeholder="Seleziona muscoli target..."
                    searchPlaceholder="Cerca muscolo..."
                    emptyMessage="Nessun muscolo trovato"
                  />
                </div>

                {/* Secondary Muscles Multi-Select */}
                <div className="space-y-2">
                  <Label>Muscoli Secondari</Label>
                  <MultiSelect
                    options={muscleOptions}
                    selected={formSecondaryMuscles}
                    onChange={setFormSecondaryMuscles}
                    placeholder="Seleziona muscoli sinergici..."
                    searchPlaceholder="Cerca muscolo..."
                    emptyMessage="Nessun muscolo trovato"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEditMode ? "Salva Modifiche" : "Crea Esercizio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cerca esercizio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Compact Filters Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Filtri
            </span>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 px-1.5 text-[10px]"
                onClick={clearFilters}
              >
                <X className="h-3 w-3 mr-0.5" />
                Reset
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-1.5">
            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {EXERCISE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pattern Filter */}
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Schema" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Tutti gli schemi</SelectItem>
                {MOVEMENT_PATTERNS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Muscle Filter */}
            <Select value={selectedMacroMuscle} onValueChange={setSelectedMacroMuscle}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Muscolo" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Tutti i muscoli</SelectItem>
                {MACRO_MUSCLES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {exercises.length === 0 
                  ? "Nessun esercizio" 
                  : "Nessun risultato"}
              </p>
              {exercises.length === 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => setDialogOpen(true)}
                >
                  Crea il primo esercizio
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[10px] text-muted-foreground">
                  {filteredExercises.length} eserciz{filteredExercises.length === 1 ? "io" : "i"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Trascina nella griglia →
                </span>
              </div>
              {filteredExercises.map(exercise => (
                <DraggableExercise 
                  key={exercise.id} 
                  exercise={exercise} 
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
