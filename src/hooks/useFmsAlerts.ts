import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// FMS test mappings to body areas and exercise contraindications
const FMS_TEST_CONFIG = {
  deep_squat: {
    name: "Deep Squat",
    bodyArea: "Lower Body",
    contraindications: ["squat", "leg press", "front squat", "goblet squat"],
  },
  hurdle_step: {
    name: "Hurdle Step",
    bodyArea: "Hip/Knee",
    contraindications: ["lunge", "step up", "split squat", "bulgarian"],
  },
  inline_lunge: {
    name: "Inline Lunge",
    bodyArea: "Hip Stability",
    contraindications: ["lunge", "walking lunge", "split squat"],
  },
  shoulder_mobility: {
    name: "Shoulder Mobility",
    bodyArea: "Shoulder",
    contraindications: [
      "overhead press",
      "military press",
      "push press",
      "shoulder press",
      "snatch",
      "jerk",
      "overhead squat",
      "pull up",
      "chin up",
      "lat pulldown",
    ],
  },
  active_straight_leg: {
    name: "Active Straight Leg",
    bodyArea: "Hamstring/Hip",
    contraindications: ["deadlift", "romanian deadlift", "stiff leg", "good morning"],
  },
  trunk_stability: {
    name: "Trunk Stability",
    bodyArea: "Core",
    contraindications: ["plank", "rollout", "anti-rotation", "pallof"],
  },
  rotary_stability: {
    name: "Rotary Stability",
    bodyArea: "Core Rotation",
    contraindications: ["russian twist", "wood chop", "rotational"],
  },
} as const;

export type FmsTestKey = keyof typeof FMS_TEST_CONFIG;

export interface FmsFlag {
  testKey: FmsTestKey;
  testName: string;
  bodyArea: string;
  score: number;
  side?: "left" | "right" | null;
  status: "dysfunctional" | "pain" | "limited";
  contraindications: readonly string[];
  message: string;
}

export interface FmsAlertData {
  athleteId: string;
  athleteName: string;
  testDate: string | null;
  flags: FmsFlag[];
  hasRedFlags: boolean;
  totalScore: number;
  maxScore: number;
}

/**
 * Derives status from FMS score
 * - Score 0: Pain detected during movement
 * - Score 1: Dysfunctional pattern
 * - Score 2: Limited but acceptable
 * - Score 3: Optimal
 */
function getScoreStatus(score: number): FmsFlag["status"] | null {
  if (score === 0) return "pain";
  if (score === 1) return "dysfunctional";
  if (score === 2) return "limited";
  return null; // Score 3 = optimal, no flag
}

function getStatusLabel(status: FmsFlag["status"]): string {
  switch (status) {
    case "pain":
      return "Dolore";
    case "dysfunctional":
      return "Disfunzionale";
    case "limited":
      return "Limitato";
  }
}

/**
 * Hook to fetch and analyze FMS data for an athlete
 * Returns flags for any scores <= 1 (red flags) or score 2 (yellow flags)
 */
export function useFmsAlerts(athleteId: string | null) {
  return useQuery({
    queryKey: ["fms-alerts", athleteId],
    queryFn: async (): Promise<FmsAlertData | null> => {
      if (!athleteId) return null;

      // Fetch latest FMS test
      const { data: fmsData, error: fmsError } = await supabase
        .from("fms_tests")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("test_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fmsError) throw fmsError;

      // Fetch athlete name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", athleteId)
        .maybeSingle();

      if (!fmsData) {
        return {
          athleteId,
          athleteName: profile?.full_name || "Atleta",
          testDate: null,
          flags: [],
          hasRedFlags: false,
          totalScore: 0,
          maxScore: 21,
        };
      }

      const flags: FmsFlag[] = [];
      let totalScore = 0;

      // Process bilateral tests (deep_squat, trunk_stability)
      const bilateralTests: FmsTestKey[] = ["deep_squat", "trunk_stability"];
      for (const testKey of bilateralTests) {
        const score = (fmsData as any)[testKey] as number | null;
        if (score !== null) {
          totalScore += score;
          const status = getScoreStatus(score);
          if (status) {
            const config = FMS_TEST_CONFIG[testKey];
            flags.push({
              testKey,
              testName: config.name,
              bodyArea: config.bodyArea,
              score,
              side: null,
              status,
              contraindications: config.contraindications,
              message: `${config.name}: ${getStatusLabel(status)} (Score ${score}/3)`,
            });
          }
        }
      }

      // Process unilateral tests
      const unilateralTests: FmsTestKey[] = [
        "hurdle_step",
        "inline_lunge",
        "shoulder_mobility",
        "active_straight_leg",
        "rotary_stability",
      ];

      for (const testKey of unilateralTests) {
        const leftScore = (fmsData as any)[`${testKey}_l`] as number | null;
        const rightScore = (fmsData as any)[`${testKey}_r`] as number | null;

        // Use minimum score for FMS scoring
        const minScore =
          leftScore !== null && rightScore !== null
            ? Math.min(leftScore, rightScore)
            : (leftScore ?? rightScore);

        if (minScore !== null) {
          totalScore += minScore;
        }

        // Check each side for flags
        const config = FMS_TEST_CONFIG[testKey];

        if (leftScore !== null) {
          const status = getScoreStatus(leftScore);
          if (status) {
            flags.push({
              testKey,
              testName: config.name,
              bodyArea: config.bodyArea,
              score: leftScore,
              side: "left",
              status,
              contraindications: config.contraindications,
              message: `${config.name} (Sx): ${getStatusLabel(status)} (Score ${leftScore}/3)`,
            });
          }
        }

        if (rightScore !== null) {
          const status = getScoreStatus(rightScore);
          if (status) {
            flags.push({
              testKey,
              testName: config.name,
              bodyArea: config.bodyArea,
              score: rightScore,
              side: "right",
              status,
              contraindications: config.contraindications,
              message: `${config.name} (Dx): ${getStatusLabel(status)} (Score ${rightScore}/3)`,
            });
          }
        }
      }

      // Red flags are scores <= 1 (pain or dysfunctional)
      const hasRedFlags = flags.some((f) => f.status === "pain" || f.status === "dysfunctional");

      return {
        athleteId,
        athleteName: profile?.full_name || "Atleta",
        testDate: fmsData.test_date,
        flags,
        hasRedFlags,
        totalScore,
        maxScore: 21,
      };
    },
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if an exercise name matches any contraindications
 */
export function checkExerciseContraindication(
  exerciseName: string,
  flags: FmsFlag[],
): FmsFlag | null {
  const lowerName = exerciseName.toLowerCase();

  for (const flag of flags) {
    // Only warn for red flags (score <= 1)
    if (flag.status !== "pain" && flag.status !== "dysfunctional") continue;

    for (const contraindication of flag.contraindications) {
      if (lowerName.includes(contraindication.toLowerCase())) {
        return flag;
      }
    }
  }

  return null;
}
