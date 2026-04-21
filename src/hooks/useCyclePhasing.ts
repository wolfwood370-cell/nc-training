import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { supabase } from"@/integrations/supabase/client";
import { differenceInDays, addDays, format } from"date-fns";

// ── Types ──────────────────────────────────────────────

export type CyclePhase ="menstrual"|"follicular"|"ovulatory"|"luteal";

export interface TrainingModifiers {
  volume_suggestion: string;
  strength_potential: number; // 0-100
  injury_risk: string;
  nutrition_focus: string;
}

export interface CycleStatus {
  currentPhase: CyclePhase;
  daysIntoCycle: number;
  predictedNextPeriod: Date;
  trainingModifiers: TrainingModifiers;
  phaseLabel: string;
  powerTip: string;
}

export interface CycleSettings {
  athlete_id: string;
  cycle_length_days: number;
  auto_regulation_enabled: boolean;
  last_period_start_date: string | null;
  contraceptive_type: string | null;
}

// ── Phase Algorithm ────────────────────────────────────

function calculatePhase(dayInCycle: number, cycleLength: number): CyclePhase {
  if (dayInCycle <= 5) return"menstrual";
  if (dayInCycle <= 12) return"follicular";
  if (dayInCycle <= 15) return"ovulatory";
  return"luteal";
}

function getTrainingModifiers(phase: CyclePhase, dayInCycle: number): TrainingModifiers {
  switch (phase) {
    case"menstrual":
      return {
        volume_suggestion:"Deload",
        strength_potential: 35,
        injury_risk:"Low",
        nutrition_focus:"Iron & Hydration",
      };
    case"follicular":
      return {
        volume_suggestion:"Push Hard",
        strength_potential: 80,
        injury_risk:"Low",
        nutrition_focus:"Carbs for intensity",
      };
    case"ovulatory":
      return {
        volume_suggestion:"Peak Performance",
        strength_potential: 95,
        injury_risk:"High — Protect Knees",
        nutrition_focus:"Protein & Antioxidants",
      };
    case"luteal":
      return {
        volume_suggestion:"Maintenance",
        strength_potential: 55,
        injury_risk:"Moderate",
        nutrition_focus:"Hydration & Magnesium",
      };
  }
}

function getPowerTip(phase: CyclePhase): string {
  switch (phase) {
    case"menstrual":
      return"Rest is productive. Focus on mobility and low-intensity work.";
    case"follicular":
      return"Estrogen is rising. Go for a PR today!";
    case"ovulatory":
      return"Peak strength window — but warm up thoroughly to protect joints.";
    case"luteal":
      return"Body temp is higher. Focus on steady-state aerobic work.";
  }
}

function getPhaseLabel(phase: CyclePhase): string {
  switch (phase) {
    case"menstrual": return"Menstrual Phase";
    case"follicular": return"Follicular Phase";
    case"ovulatory": return"Ovulatory Phase";
    case"luteal": return"Luteal Phase";
  }
}

// ── Hook ───────────────────────────────────────────────

export function useCyclePhasing(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["cycle-settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("athlete_cycle_settings")
        .select("*")
        .eq("athlete_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as CycleSettings | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isConfigured = !!settings?.last_period_start_date;

  const cycleStatus: CycleStatus | null = (() => {
    if (!settings?.last_period_start_date) return null;

    const lastPeriod = new Date(settings.last_period_start_date);
    const today = new Date();
    const cycleLength = settings.cycle_length_days || 28;

    const totalDays = differenceInDays(today, lastPeriod);
    const daysIntoCycle = ((totalDays % cycleLength) + cycleLength) % cycleLength || cycleLength;
    
    const currentPhase = calculatePhase(daysIntoCycle, cycleLength);
    const daysRemaining = cycleLength - daysIntoCycle;
    const predictedNextPeriod = addDays(today, daysRemaining);

    return {
      currentPhase,
      daysIntoCycle,
      predictedNextPeriod,
      trainingModifiers: getTrainingModifiers(currentPhase, daysIntoCycle),
      phaseLabel: getPhaseLabel(currentPhase),
      powerTip: getPowerTip(currentPhase),
    };
  })();

  // Save / update settings
  const saveMutation = useMutation({
    mutationFn: async (input: {
      lastPeriodStart: string;
      cycleLength: number;
      contraceptiveType?: string;
    }) => {
      if (!userId) throw new Error("No user");

      const payload = {
        athlete_id: userId,
        last_period_start_date: input.lastPeriodStart,
        cycle_length_days: input.cycleLength,
        contraceptive_type: input.contraceptiveType ||"none",
        auto_regulation_enabled: true,
      };

      const { error } = await supabase
        .from("athlete_cycle_settings")
        .upsert(payload, { onConflict:"athlete_id"});

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycle-settings", userId] });
    },
  });

  // Log daily symptoms
  const logSymptomsMutation = useMutation({
    mutationFn: async (symptoms: string[]) => {
      if (!userId) throw new Error("No user");
      const today = format(new Date(),"yyyy-MM-dd");
      const phase = cycleStatus?.currentPhase ||"follicular";

      const { error } = await supabase
        .from("daily_cycle_logs")
        .upsert(
          {
            athlete_id: userId,
            date: today,
            current_phase: phase,
            symptom_tags: symptoms,
          },
          { onConflict:"athlete_id,date"}
        );

      if (error) throw error;
    },
  });

  return {
    settings,
    isLoading,
    isConfigured,
    cycleStatus,
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    logSymptoms: logSymptomsMutation.mutateAsync,
    isLoggingSymptoms: logSymptomsMutation.isPending,
  };
}
