// supabase/functions/analyze-meal-photo/index.ts

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an elite sports nutritionist and registered dietitian with 20+ years of experience analyzing meals for professional athletes. Your specialty is rapid, precise macronutrient estimation from visual inspection.

When analyzing a meal photo, you must:
1. Identify all visible food items and ingredients with precision
2. Estimate portion sizes using visual cues (plate size ~26cm standard, utensil scale, hand-relative dimensions)
3. Calculate total macronutrients accounting for cooking methods (oils, butters, sauces add hidden calories)
4. Provide a confidence score (1-100) based on:
   - Image clarity and angle (penalize obscured/partial views)
   - Ambiguity of preparation method
   - Hidden ingredients (sauces, oils, fillings)
   - Portion size certainty
5. Be conservative with estimates — athletes rely on accuracy. When uncertain, lean toward realistic averages rather than optimistic numbers.

CRITICAL OUTPUT RULES:
- Respond ONLY with a single valid JSON object. No markdown, no code fences, no commentary.
- All numeric fields must be numbers (not strings), rounded to whole integers.
- "mealName" should be concise and descriptive (e.g., "Grilled Chicken Caesar Salad", not "A salad").
- "ingredients" must be an array of identifiable component strings.
- "confidenceScore" must reflect genuine certainty — do not default to high values.

Required JSON schema:
{
  "mealName": string,
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "confidenceScore": number,
  "ingredients": string[]
}`;

interface AnalyzeRequest {
  imageBase64: string;
  mimeType?: string;
}

interface MealAnalysis {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidenceScore: number;
  ingredients: string[];
}

function validateAnalysis(data: unknown): MealAnalysis {
  if (!data || typeof data !== "object") {
    throw new Error("AI response is not a valid object");
  }

  const d = data as Record<string, unknown>;

  const mealName = typeof d.mealName === "string" ? d.mealName.trim() : "";
  const calories = Number(d.calories);
  const protein = Number(d.protein);
  const carbs = Number(d.carbs);
  const fats = Number(d.fats);
  const confidenceScore = Number(d.confidenceScore);
  const ingredients = Array.isArray(d.ingredients)
    ? d.ingredients.filter((i): i is string => typeof i === "string")
    : [];

  if (!mealName) throw new Error("Missing or invalid mealName");
  if (!Number.isFinite(calories) || calories < 0) {
    throw new Error("Invalid calories value");
  }
  if (!Number.isFinite(protein) || protein < 0) {
    throw new Error("Invalid protein value");
  }
  if (!Number.isFinite(carbs) || carbs < 0) {
    throw new Error("Invalid carbs value");
  }
  if (!Number.isFinite(fats) || fats < 0) {
    throw new Error("Invalid fats value");
  }
  if (
    !Number.isFinite(confidenceScore) ||
    confidenceScore < 1 ||
    confidenceScore > 100
  ) {
    throw new Error("Invalid confidenceScore (must be 1-100)");
  }

  return {
    mealName,
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
    confidenceScore: Math.round(confidenceScore),
    ingredients,
  };
}

function extractJson(raw: string): string {
  // Strip markdown fences if the model ignored instructions
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Fallback: extract first {...} block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const baseURL = Deno.env.get("LOVABLE_AI_GATEWAY_URL") ??
      "https://ai.gateway.lovable.dev/v1";

    if (!apiKey) {
      console.error("[analyze-meal-photo] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let body: AnalyzeRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Normalize: accept both raw base64 and full data URLs
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:${mimeType};base64,${imageBase64}`;

    const client = new OpenAI({ apiKey, baseURL });

    const completion = await client.chat.completions.create({
      model: "google/gemini-3-flash-preview",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this meal. Return ONLY the JSON object matching the required schema.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("AI returned empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(rawContent));
    } catch (parseErr) {
      console.error("[analyze-meal-photo] JSON parse failed:", rawContent);
      throw new Error("AI response was not valid JSON");
    }

    const analysis = validateAnalysis(parsed);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze-meal-photo] Error:", message);

    // Surface rate limit / quota errors with distinguishable status
    const status = /rate.?limit|quota|429/i.test(message)
      ? 429
      : /timeout|timed out/i.test(message)
      ? 504
      : 500;

    return new Response(
      JSON.stringify({ error: message }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
