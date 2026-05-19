/**
 * Progression Rule Types for Program Builder
 * Defines automatic progression logic for exercises across weeks
 */

export type ProgressionType =
  | "rir_decrease" // Decrease RIR by X every week
  | "rpe_increase" // Increase RPE by X every week
  | "load_percent" // Increase load by X% every week
  | "load_absolute" // Increase load by Xkg every week
  | "reps_increase" // Increase reps by X every week
  | "sets_increase"; // Increase sets by X every week

export interface ProgressionRule {
  type: ProgressionType;
  value: number; // The increment/decrement value
  startWeek?: number; // Optional: start applying from this week (0-indexed)
  endWeek?: number; // Optional: stop applying at this week (0-indexed)
}

export interface ExerciseProgression {
  enabled: boolean;
  rules: ProgressionRule[];
}

// Helper to get human-readable description
export function getProgressionDescription(rule: ProgressionRule): string {
  switch (rule.type) {
    case "rir_decrease":
      return `↓ RIR ${rule.value}/sett`;
    case "rpe_increase":
      return `↑ RPE ${rule.value}/sett`;
    case "load_percent":
      return `↑ ${rule.value}%/sett`;
    case "load_absolute":
      return `↑ ${rule.value}kg/sett`;
    case "reps_increase":
      return `↑ ${rule.value} reps/sett`;
    case "sets_increase":
      return `↑ ${rule.value} set/sett`;
    default:
      return "";
  }
}

// Get display label for progression type
export function getProgressionTypeLabel(type: ProgressionType): string {
  switch (type) {
    case "rir_decrease":
      return "Diminuisci RIR";
    case "rpe_increase":
      return "Aumenta RPE";
    case "load_percent":
      return "Aumenta Carico (%)";
    case "load_absolute":
      return "Aumenta Carico (kg)";
    case "reps_increase":
      return "Aumenta Ripetizioni";
    case "sets_increase":
      return "Aumenta Serie";
    default:
      return type;
  }
}

// Default values for each progression type
export function getDefaultProgressionValue(type: ProgressionType): number {
  switch (type) {
    case "rir_decrease":
      return 1;
    case "rpe_increase":
      return 0.5;
    case "load_percent":
      return 2.5;
    case "load_absolute":
      return 2.5;
    case "reps_increase":
      return 1;
    case "sets_increase":
      return 1;
    default:
      return 1;
  }
}

// Calculate progressed value for a given week offset
export function calculateProgressedValue(
  baseValue: number,
  rule: ProgressionRule,
  weekOffset: number, // How many weeks from the base week
): number {
  if (weekOffset <= 0) return baseValue;

  const effectiveOffset = weekOffset;

  switch (rule.type) {
    case "rir_decrease":
      return Math.max(0, baseValue - rule.value * effectiveOffset);
    case "rpe_increase":
      return Math.min(10, baseValue + rule.value * effectiveOffset);
    case "load_percent":
      return baseValue * (1 + (rule.value / 100) * effectiveOffset);
    case "load_absolute":
      return baseValue + rule.value * effectiveOffset;
    case "reps_increase":
      return Math.round(baseValue + rule.value * effectiveOffset);
    case "sets_increase":
      return Math.round(baseValue + rule.value * effectiveOffset);
    default:
      return baseValue;
  }
}

// Parse load string to extract numeric value and unit
export function parseLoadValue(load: string): { value: number; isPercent: boolean } | null {
  const percentMatch = load.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percentMatch) {
    return { value: parseFloat(percentMatch[1]), isPercent: true };
  }

  const kgMatch = load.match(/^(\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  if (kgMatch) {
    return { value: parseFloat(kgMatch[1]), isPercent: false };
  }

  return null;
}

// Format load value back to string
export function formatLoadValue(value: number, isPercent: boolean): string {
  if (isPercent) {
    return `${Math.round(value * 10) / 10}%`;
  }
  return `${Math.round(value * 10) / 10}kg`;
}
