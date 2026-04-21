import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Dumbbell, Play, Loader2, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Exercise {
  id: string;
  name: string;
  muscles: string[];
  movement_pattern: string | null;
  exercise_type: string;
  video_url: string | null;
}

interface SessionBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string | null;
  athleteId: string;
  brandColor?: string | null;
}

export function SessionBuilderDialog({
  open,
  onOpenChange,
  coachId,
  athleteId,
  brandColor,
}: SessionBuilderDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [filterMuscle, setFilterMuscle] = useState<string | null>(null);

  // Fetch coach's exercise library
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["coach-exercises-library", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscles, movement_pattern, exercise_type, video_url")
        .eq("coach_id", coachId)
        .eq("archived", false)
        .order("name");

      if (error) throw error;
      return (data || []) as Exercise[];
    },
    enabled: !!coachId && open,
  });

  // Get unique muscles for filter
  const allMuscles = useMemo(() => {
    const muscleSet = new Set<string>();
    exercises.forEach((ex) => {
      ex.muscles.forEach((m) => muscleSet.add(m));
    });
    return Array.from(muscleSet).sort();
  }, [exercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        searchQuery === "" ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = !filterMuscle || ex.muscles.includes(filterMuscle);
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, filterMuscle]);

  // Toggle exercise selection
  const toggleExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => {
      const isSelected = prev.some((e) => e.id === exercise.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== exercise.id);
      }
      return [...prev, exercise];
    });
  };

  const isSelected = (id: string) => selectedExercises.some((e) => e.id === id);

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const sessionName = `Sessione ${format(now, "dd/MM HH:mm", { locale: it })}`;

      // Build structure from selected exercises
      const structure = selectedExercises.map((ex, index) => ({
        id: `ex-${index}`,
        exercise_id: ex.id,
        exercise_name: ex.name,
        name: ex.name,
        sets: 3,
        reps: "10",
        load: "",
        rpe: "",
        notes: "",
        restSeconds: 90,
      }));

      // Create workout record first
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          athlete_id: athleteId,
          coach_id: coachId,
          title: sessionName,
          description: "Sessione libera",
          scheduled_date: format(now, "yyyy-MM-dd"),
          status: "pending",
          structure: structure,
        })
        .select("id")
        .single();

      if (workoutError) throw workoutError;

      // Create workout_log record
      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          workout_id: workout.id,
          athlete_id: athleteId,
          started_at: now.toISOString(),
          scheduled_date: format(now, "yyyy-MM-dd"),
          status: "scheduled",
          exercises_data: structure,
          sync_status: "synced",
        })
        .select("id")
        .single();

      if (logError) throw logError;

      return { workoutId: workout.id, logId: logData.id };
    },
    onSuccess: ({ workoutId }) => {
      toast({
        title: "Sessione creata",
        description: "Buon allenamento!",
      });
      onOpenChange(false);
      setSelectedExercises([]);
      setSearchQuery("");
      navigate(`/athlete/workout/${workoutId}`);
    },
    onError: (error) => {
      console.error("Session creation error:", error);
      toast({
        title: "Errore",
        description: "Impossibile creare la sessione",
        variant: "destructive",
      });
    },
  });

  const handleStartSession = () => {
    if (selectedExercises.length === 0) {
      toast({
        title: "Seleziona esercizi",
        description: "Scegli almeno un esercizio per iniziare",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedExercises([]);
    setSearchQuery("");
    setFilterMuscle(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell
              className="h-5 w-5"
              style={{ color: brandColor || undefined }}
            />
            Sessione Libera
          </DialogTitle>
          <DialogDescription>
            Seleziona gli esercizi dalla libreria del coach
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-4 pb-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca esercizio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Muscle filter chips */}
          {allMuscles.length > 0 && (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 pb-1">
                <Badge
                  variant={filterMuscle === null ? "default" : "outline"}
                  className="cursor-pointer shrink-0"
                  onClick={() => setFilterMuscle(null)}
                  style={
                    filterMuscle === null && brandColor
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  Tutti
                </Badge>
                {allMuscles.slice(0, 8).map((muscle) => (
                  <Badge
                    key={muscle}
                    variant={filterMuscle === muscle ? "default" : "outline"}
                    className="cursor-pointer shrink-0 capitalize"
                    onClick={() =>
                      setFilterMuscle(filterMuscle === muscle ? null : muscle)
                    }
                    style={
                      filterMuscle === muscle && brandColor
                        ? { backgroundColor: brandColor }
                        : undefined
                    }
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Selected count */}
        {selectedExercises.length > 0 && (
          <div className="px-4 pb-2">
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                backgroundColor: brandColor
                  ? `${brandColor}15`
                  : "hsl(var(--primary) / 0.1)",
              }}
            >
              <span className="text-sm font-medium">
                {selectedExercises.length} eserciz
                {selectedExercises.length === 1 ? "io" : "i"} selezionat
                {selectedExercises.length === 1 ? "o" : "i"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedExercises([])}
                className="text-xs h-7"
              >
                Rimuovi tutti
              </Button>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 pb-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun esercizio trovato</p>
              </div>
            ) : (
              filteredExercises.map((exercise) => {
                const selected = isSelected(exercise.id);
                return (
                  <div
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                      selected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent",
                    )}
                    style={
                      selected && brandColor
                        ? {
                            backgroundColor: `${brandColor}15`,
                            borderColor: `${brandColor}50`,
                          }
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleExercise(exercise)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {exercise.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {exercise.muscles.slice(0, 2).map((muscle) => (
                          <Badge
                            key={muscle}
                            variant="secondary"
                            className="text-[10px] py-0 capitalize"
                          >
                            {muscle}
                          </Badge>
                        ))}
                        {exercise.muscles.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{exercise.muscles.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 border-t bg-muted/30">
          <Button
            onClick={handleStartSession}
            disabled={
              selectedExercises.length === 0 || createSessionMutation.isPending
            }
            className="w-full gap-2"
            style={{ backgroundColor: brandColor || undefined }}
          >
            {createSessionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creazione...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Inizia Sessione ({selectedExercises.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
