import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface HabitWithDetails {
  id: string;
  athlete_habit_id: string;
  name: string;
  category: string;
  description: string | null;
  frequency: string;
  isCompleted: boolean;
}

/** Shape returned by the embedded `habit:habits_library(...)` join. */
interface EmbeddedHabit {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

interface AthleteHabitWithJoin {
  id: string;
  frequency: string;
  active: boolean;
  habit: EmbeddedHabit | EmbeddedHabit[] | null;
}

function pickHabit(h: EmbeddedHabit | EmbeddedHabit[] | null): EmbeddedHabit | null {
  if (!h) return null;
  return Array.isArray(h) ? h[0] ?? null : h;
}

/**
 * Hook to fetch athlete's assigned habits and their completion status for today
 */
export function useAthleteHabits(athleteId?: string) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch assigned habits with today's completion status
  const habitsQuery = useQuery({
    queryKey: ["athlete-habits-with-logs", athleteId, today],
    queryFn: async () => {
      if (!athleteId) return [];

      // Get all active habits assigned to this athlete
      const { data: assignments, error: assignmentsError } = await supabase
        .from("athlete_habits")
        .select(`
          id,
          frequency,
          active,
          habit:habits_library(id, name, category, description)
        `)
        .eq("athlete_id", athleteId)
        .eq("active", true);

      if (assignmentsError) {
        console.error("Error fetching athlete habits:", assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) return [];

      // Get today's logs for these habits
      const habitIds = assignments.map((a) => a.id);
      const { data: logs, error: logsError } = await supabase
        .from("habit_logs")
        .select("athlete_habit_id, completed")
        .eq("athlete_id", athleteId)
        .eq("date", today)
        .in("athlete_habit_id", habitIds);

      if (logsError) {
        console.error("Error fetching habit logs:", logsError);
        // Continue without logs rather than failing
      }

      const logsMap = new Map(
        (logs || []).map((log) => [log.athlete_habit_id, log.completed])
      );

      // Combine habits with completion status
      const typedAssignments = assignments as unknown as AthleteHabitWithJoin[];
      const habitsWithStatus: HabitWithDetails[] = typedAssignments
        .map((assignment) => {
          const habit = pickHabit(assignment.habit);
          if (!habit) return null;
          return {
            id: habit.id,
            athlete_habit_id: assignment.id,
            name: habit.name,
            category: habit.category,
            description: habit.description,
            frequency: assignment.frequency,
            isCompleted: logsMap.get(assignment.id) ?? false,
          };
        })
        .filter((h): h is HabitWithDetails => h !== null);

      return habitsWithStatus;
    },
    enabled: !!athleteId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Toggle habit completion for today
  const toggleMutation = useMutation({
    mutationFn: async ({
      athleteHabitId,
      completed,
    }: {
      athleteHabitId: string;
      completed: boolean;
    }) => {
      if (!athleteId) throw new Error("No athlete ID");

      if (completed) {
        // Insert or update the log for today
        const { error } = await supabase.from("habit_logs").upsert(
          {
            athlete_habit_id: athleteHabitId,
            athlete_id: athleteId,
            date: today,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "athlete_habit_id,date",
          }
        );

        if (error) throw error;
      } else {
        // Delete the log for today
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("athlete_habit_id", athleteHabitId)
          .eq("date", today);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["athlete-habits-with-logs", athleteId, today],
      });
    },
  });

  const habits = habitsQuery.data || [];
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.isCompleted).length;
  const completionPercentage =
    totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  return {
    habits,
    totalHabits,
    completedHabits,
    completionPercentage,
    isLoading: habitsQuery.isLoading,
    error: habitsQuery.error,
    toggleHabit: (athleteHabitId: string, completed: boolean) =>
      toggleMutation.mutate({ athleteHabitId, completed }),
    isToggling: toggleMutation.isPending,
  };
}
