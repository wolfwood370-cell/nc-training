// ACWR Hook v1 — uses centralized math from trainingMetrics
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  calculateACWR,
  calculateDailyStrain,
  buildDailyLoadArray,
  type DailyLoad,
  type AcwrResult,
} from "@/lib/math/trainingMetrics";
import { ACWR_LOOKBACK_DAYS } from "@/lib/math/constants";

const LOOKBACK_DAYS = ACWR_LOOKBACK_DAYS;

// Re-export the result type for consumers
export type { AcwrResult };

// Legacy-compatible wrapper type
export interface AcwrHookResult {
  data: (AcwrResult & { status: AcwrResult["zone"] }) | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAcwrData(): AcwrHookResult {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["acwr-data", user?.id],
    queryFn: async (): Promise<AcwrResult> => {
      if (!user?.id) {
        return {
          ratio: null,
          acuteLoad: 0,
          chronicLoad: 0,
          zone: "insufficient-data",
          label: "No data",
        };
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

      const { data: logs, error: logsError } = await supabase
        .from("workout_logs")
        .select("id, rpe_global, duration_seconds, total_load_au, completed_at")
        .eq("athlete_id", user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", cutoff.toISOString())
        .order("completed_at", { ascending: true });

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) {
        return {
          ratio: null,
          acuteLoad: 0,
          chronicLoad: 0,
          zone: "insufficient-data",
          label: "Dati insufficienti",
        };
      }

      // Convert workout logs to daily load entries
      const dailyLoads: DailyLoad[] = logs
        .filter((l) => l.completed_at !== null)
        .map((log) => ({
          date: log.completed_at!.split("T")[0],
          load: calculateDailyStrain(log.total_load_au, log.rpe_global, log.duration_seconds),
        }));

      // Build continuous 42-day array (filling rest days with 0)
      const dailyArray = buildDailyLoadArray(dailyLoads, LOOKBACK_DAYS);

      return calculateACWR(dailyArray);
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  // Map `zone` → legacy `status` for backward compatibility
  const mapped = data
    ? {
        ...data,
        status: data.zone === "detraining" ? ("warning" as const) : data.zone,
      }
    : null;

  return {
    data: mapped,
    isLoading,
    error: error as Error | null,
  };
}
