import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import type { WorkoutStructureExercise } from "@/types/database";

const FIVE_MINUTES = 5 * 60 * 1000;

export interface TodayWorkout {
  id: string;
  title: string;
  description?: string | null;
  estimatedDuration: number | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  exerciseCount: number;
  programWorkoutId?: string | null;
  structure: WorkoutStructureExercise[];
}

export function useTodaysWorkout() {
  const { user } = useAuth();
  const athleteId = user?.id ?? null;
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["athlete-today-workout", athleteId, today],
    queryFn: async (): Promise<TodayWorkout | null> => {
      if (!athleteId) return null;

      // Check workout_logs for scheduled workouts (from program)
      const { data: logs } = await supabase
        .from("workout_logs")
        .select(`
          id,
          status,
          program_workout_id,
          workouts (
            id,
            title,
            description,
            estimated_duration,
            structure
          )
        `)
        .eq("athlete_id", athleteId)
        .eq("scheduled_date", today)
        .in("status", ["scheduled", "completed"])
        .limit(1)
        .maybeSingle();

      if (logs?.workouts) {
        const structure = (workout.structure as WorkoutStructureExercise[]) ?? [];
        return {
          id: workout.id,
          title: workout.title,
          description: workout.description,
          estimatedDuration: workout.estimated_duration,
          status: logs.status === "scheduled" ? "pending" : "completed",
          exerciseCount: Array.isArray(structure) ? structure.length : 0,
          programWorkoutId: logs.program_workout_id,
          structure: Array.isArray(structure) ? structure : [],
        };
      }

      // Fallback to workouts table
      const { data: workout } = await supabase
        .from("workouts")
        .select("id, title, description, estimated_duration, structure, status")
        .eq("athlete_id", athleteId)
        .eq("scheduled_date", today)
        .in("status", ["pending", "completed", "in_progress"])
        .limit(1)
        .maybeSingle();

      if (!workout) return null;

      const structure = workout.structure as any[];
      return {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        estimatedDuration: workout.estimated_duration,
        status: workout.status as TodayWorkout["status"],
        exerciseCount: Array.isArray(structure) ? structure.length : 0,
        programWorkoutId: null,
      };
    },
    enabled: !!athleteId,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES * 4,
  });

  return {
    workout: data ?? null,
    isLoading,
    refetch,
  };
}
