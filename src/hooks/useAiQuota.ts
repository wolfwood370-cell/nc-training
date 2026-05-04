import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AiQuota {
  message_count: number;
  daily_limit: number;
  last_reset_at: string;
}

export function useAiQuota(enabled = true) {
  return useQuery({
    queryKey: ["ai-quota"],
    queryFn: async (): Promise<AiQuota> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ai_usage_tracking")
        .select("message_count, daily_limit, last_reset_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const row = data;

      // If no row yet, user hasn't sent any messages
      if (!row) {
        return { message_count: 0, daily_limit: 20, last_reset_at: new Date().toISOString() };
      }

      // Lazy reset check on client side too
      const lastReset = new Date(row.last_reset_at);
      const now = new Date();
      const isSameDay =
        lastReset.getUTCFullYear() === now.getUTCFullYear() &&
        lastReset.getUTCMonth() === now.getUTCMonth() &&
        lastReset.getUTCDate() === now.getUTCDate();

      if (!isSameDay) {
        return { message_count: 0, daily_limit: row.daily_limit, last_reset_at: now.toISOString() };
      }

      return row as AiQuota;
    },
    enabled,
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  });
}
