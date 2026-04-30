// src/hooks/useAnalyzeMealPhoto.ts

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MealAnalysis {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidenceScore: number;
  ingredients: string[];
}

export interface AnalyzeMealPhotoInput {
  /** Raw base64 string (no data: prefix) OR a full data URL. */
  imageBase64: string;
  /** Optional MIME type if `imageBase64` is raw base64. Defaults to image/jpeg. */
  mimeType?: string;
}

export class AnalyzeMealPhotoError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_INPUT"
      | "RATE_LIMITED"
      | "TIMEOUT"
      | "PARSE_ERROR"
      | "NETWORK"
      | "UNAUTHORIZED"
      | "SERVER_ERROR"
      | "UNKNOWN",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AnalyzeMealPhotoError";
  }
}

function mapEdgeError(err: unknown, status?: number): AnalyzeMealPhotoError {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Unexpected error analyzing meal photo";

  if (status === 401 || status === 403) {
    return new AnalyzeMealPhotoError(
      "You must be signed in to analyze meal photos.",
      "UNAUTHORIZED",
      status,
    );
  }
  if (status === 429 || /rate.?limit|quota/i.test(raw)) {
    return new AnalyzeMealPhotoError(
      "AI is busy right now. Please try again in a moment.",
      "RATE_LIMITED",
      status ?? 429,
    );
  }
  if (status === 504 || /timeout|timed out/i.test(raw)) {
    return new AnalyzeMealPhotoError(
      "Analysis took too long. Try a clearer photo.",
      "TIMEOUT",
      status ?? 504,
    );
  }
  if (/json|parse/i.test(raw)) {
    return new AnalyzeMealPhotoError(
      "Could not read the AI's response. Please try again.",
      "PARSE_ERROR",
      status,
    );
  }
  if (/network|fetch|failed to fetch/i.test(raw)) {
    return new AnalyzeMealPhotoError(
      "Network error. Check your connection and retry.",
      "NETWORK",
      status,
    );
  }
  if (status && status >= 500) {
    return new AnalyzeMealPhotoError(
      "The analysis service is temporarily unavailable.",
      "SERVER_ERROR",
      status,
    );
  }

  return new AnalyzeMealPhotoError(raw, "UNKNOWN", status);
}

function validateAnalysis(data: unknown): MealAnalysis {
  if (!data || typeof data !== "object") {
    throw new AnalyzeMealPhotoError(
      "Invalid analysis payload.",
      "PARSE_ERROR",
    );
  }
  const d = data as Record<string, unknown>;
  if (
    typeof d.mealName !== "string" ||
    typeof d.calories !== "number" ||
    typeof d.protein !== "number" ||
    typeof d.carbs !== "number" ||
    typeof d.fats !== "number" ||
    typeof d.confidenceScore !== "number" ||
    !Array.isArray(d.ingredients)
  ) {
    throw new AnalyzeMealPhotoError(
      "Analysis payload is missing required fields.",
      "PARSE_ERROR",
    );
  }
  return {
    mealName: d.mealName,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fats: d.fats,
    confidenceScore: d.confidenceScore,
    ingredients: d.ingredients.filter(
      (i): i is string => typeof i === "string",
    ),
  };
}

async function analyzeMealPhoto(
  input: AnalyzeMealPhotoInput,
): Promise<MealAnalysis> {
  if (!input?.imageBase64 || typeof input.imageBase64 !== "string") {
    throw new AnalyzeMealPhotoError(
      "An image is required to analyze.",
      "INVALID_INPUT",
    );
  }

  const { data, error } = await supabase.functions.invoke<MealAnalysis | { error: string }>(
    "analyze-meal-photo",
    {
      body: {
        imageBase64: input.imageBase64,
        mimeType: input.mimeType ?? "image/jpeg",
      },
    },
  );

  if (error) {
    // FunctionsHttpError exposes context.status; fall back to parsing message
    // deno-lint-ignore no-explicit-any
    const status = (error as any)?.context?.status as number | undefined;
    let serverMessage = error.message;
    try {
      // deno-lint-ignore no-explicit-any
      const ctx = (error as any)?.context;
      if (ctx && typeof ctx.json === "function") {
        const payload = await ctx.json();
        if (payload?.error) serverMessage = payload.error;
      }
    } catch {
      /* ignore — keep original message */
    }
    throw mapEdgeError(serverMessage, status);
  }

  if (data && typeof data === "object" && "error" in data) {
    throw mapEdgeError((data as { error: string }).error);
  }

  return validateAnalysis(data);
}

export function useAnalyzeMealPhoto(): UseMutationResult<
  MealAnalysis,
  AnalyzeMealPhotoError,
  AnalyzeMealPhotoInput
> & { isAnalyzing: boolean } {
  const mutation = useMutation<
    MealAnalysis,
    AnalyzeMealPhotoError,
    AnalyzeMealPhotoInput
  >({
    mutationKey: ["analyze-meal-photo"],
    mutationFn: analyzeMealPhoto,
    retry: (failureCount, error) => {
      if (
        error.code === "RATE_LIMITED" ||
        error.code === "INVALID_INPUT" ||
        error.code === "UNAUTHORIZED"
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });

  return {
    ...mutation,
    isAnalyzing: mutation.isPending,
  };
}
