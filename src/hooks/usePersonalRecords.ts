import { useCallback } from'react';
import { supabase } from'@/integrations/supabase/client';
import { useToast } from'@/hooks/use-toast';
import { triggerHaptic } from'@/hooks/useHapticFeedback';

interface SetLogData {
  exerciseName: string;
  weight: number;
  reps: number;
}

interface PRResult {
  isPR: boolean;
  previousBest?: number;
  improvement?: number;
}

export function usePersonalRecords() {
  const { toast } = useToast();

  const checkForPR = useCallback(async (
    athleteId: string,
    exerciseName: string,
    weight: number,
    reps: number
  ): Promise<PRResult> => {
    if (!athleteId || !exerciseName || weight <= 0) {
      return { isPR: false };
    }

    try {
      // Fetch historical workout exercises for this exercise
      const { data: logs, error } = await supabase
        .from('workout_exercises')
        .select(`          sets_data,
          workout_logs!inner(athlete_id)
        `)
        .eq('exercise_name', exerciseName)
        .eq('workout_logs.athlete_id', athleteId);

      if (error) throw error;

      // Find the maximum weight ever lifted for this exercise
      let maxWeight = 0;
      
      if (logs && logs.length > 0) {
        logs.forEach(log => {
          const setsData = log.sets_data as any[];
          if (Array.isArray(setsData)) {
            setsData.forEach(set => {
              const setWeight = set.weight_kg || set.weight || 0;
              if (setWeight > maxWeight) {
                maxWeight = setWeight;
              }
            });
          }
        });
      }

      // Check if current weight is a PR
      if (weight > maxWeight && maxWeight > 0) {
        const improvement = weight - maxWeight;
        return {
          isPR: true,
          previousBest: maxWeight,
          improvement,
        };
      }

      // First time doing this exercise with this weight
      if (maxWeight === 0 && weight > 0) {
        return {
          isPR: true,
          previousBest: 0,
          improvement: weight,
        };
      }

      return { isPR: false };
    } catch (error) {
      console.error('Error checking for PR:', error);
      return { isPR: false };
    }
  }, []);

  const showPRToast = useCallback((exerciseName: string, weight: number, improvement?: number) => {
    // Trigger heavy haptic feedback for PR
    triggerHaptic('success');
    
    toast({
      title:"Nuovo Record Personale!",
      description: improvement && improvement > 0
        ?`${exerciseName}: ${weight}kg (+${improvement}kg rispetto al precedente)`        :`${exerciseName}: ${weight}kg - Prima volta!`,
      className:"bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-none",
    });
  }, [toast]);

  return {
    checkForPR,
    showPRToast,
  };
}
