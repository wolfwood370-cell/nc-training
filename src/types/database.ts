/**
 * Strict TypeScript interfaces for JSONB columns in Supabase
 * These provide type safety for the loosely-typed Json columns
 */

// =========================================
// Workout Exercises - sets_data
// =========================================

export interface SetDataRecord {
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  completed: boolean;
  rest_seconds?: number;
  tempo?: string;
  notes?: string;
}

export type SetsDataArray = SetDataRecord[];

// =========================================
// Workout Logs - exercises_data
// =========================================

export interface ExerciseDataRecord {
  id?: string;
  exercise_name: string;
  exercise_order: number;
  sets_data: SetDataRecord[];
  notes?: string;
  superset_group?: string;
  rest_seconds?: number;
}

export type ExercisesDataArray = ExerciseDataRecord[];

// =========================================
// Workouts - structure
// =========================================

export interface WorkoutStructureExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  load?: string;
  notes?: string;
  restSeconds?: number;
  supersetGroup?: string;
  videoUrl?: string;
  tempo?: string;
}

export type WorkoutStructureArray = WorkoutStructureExercise[];

// =========================================
// Daily Readiness - soreness_map
// =========================================

export type SorenessLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface SorenessMap {
  neck?: SorenessLevel;
  shoulders?: SorenessLevel;
  upper_back?: SorenessLevel;
  lower_back?: SorenessLevel;
  chest?: SorenessLevel;
  arms?: SorenessLevel;
  core?: SorenessLevel;
  glutes?: SorenessLevel;
  quads?: SorenessLevel;
  hamstrings?: SorenessLevel;
  calves?: SorenessLevel;
  [key: string]: SorenessLevel | undefined;
}

// =========================================
// Profiles - settings
// =========================================

export interface ProfileSettings {
  theme?: "light" | "dark" | "system";
  notifications_enabled?: boolean;
  weekly_goal_sessions?: number;
  preferred_units?: "metric" | "imperial";
  locale?: string;
  [key: string]: string | number | boolean | undefined;
}

// =========================================
// Profiles - one_rm_data
// =========================================

export interface OneRmRecord {
  exercise_name: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  date: string;
}

export interface OneRmData {
  [exerciseName: string]: OneRmRecord;
}

// =========================================
// Type guards for runtime validation
// =========================================

export function isSetDataRecord(obj: unknown): obj is SetDataRecord {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.set_number === "number" &&
    typeof record.reps === "number" &&
    typeof record.weight_kg === "number" &&
    typeof record.completed === "boolean"
  );
}

export function isSetsDataArray(arr: unknown): arr is SetsDataArray {
  return Array.isArray(arr) && arr.every(isSetDataRecord);
}

export function isExerciseDataRecord(obj: unknown): obj is ExerciseDataRecord {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.exercise_name === "string" &&
    typeof record.exercise_order === "number" &&
    isSetsDataArray(record.sets_data)
  );
}

export function isExercisesDataArray(arr: unknown): arr is ExercisesDataArray {
  return Array.isArray(arr) && arr.every(isExerciseDataRecord);
}

export function isWorkoutStructureExercise(obj: unknown): obj is WorkoutStructureExercise {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.sets === "number" &&
    typeof record.reps === "string"
  );
}

export function isWorkoutStructureArray(arr: unknown): arr is WorkoutStructureArray {
  return Array.isArray(arr) && arr.every(isWorkoutStructureExercise);
}

// =========================================
// Safe parsing helpers
// =========================================

export function parseSetsData(data: unknown): SetsDataArray {
  if (isSetsDataArray(data)) return data;
  if (Array.isArray(data)) {
    // Attempt to coerce partial data
    return data.map((item, index) => ({
      set_number: ((item as Record<string, unknown>)?.set_number as number) ?? index + 1,
      reps: ((item as Record<string, unknown>)?.reps as number) ?? 0,
      weight_kg: ((item as Record<string, unknown>)?.weight_kg as number) ?? 0,
      rpe: (item as Record<string, unknown>)?.rpe as number | undefined,
      completed: ((item as Record<string, unknown>)?.completed as boolean) ?? false,
    }));
  }
  return [];
}

export function parseExercisesData(data: unknown): ExercisesDataArray {
  if (isExercisesDataArray(data)) return data;
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      exercise_name: ((item as Record<string, unknown>)?.exercise_name as string) ?? "Unknown",
      exercise_order: ((item as Record<string, unknown>)?.exercise_order as number) ?? index,
      sets_data: parseSetsData((item as Record<string, unknown>)?.sets_data),
      notes: (item as Record<string, unknown>)?.notes as string | undefined,
    }));
  }
  return [];
}

export function parseWorkoutStructure(data: unknown): WorkoutStructureArray {
  if (isWorkoutStructureArray(data)) return data;
  if (Array.isArray(data)) {
    return data.map((item) => ({
      id: (item as Record<string, unknown>)?.id as string | undefined,
      name: ((item as Record<string, unknown>)?.name as string) ?? "Unknown",
      sets: ((item as Record<string, unknown>)?.sets as number) ?? 3,
      reps: ((item as Record<string, unknown>)?.reps as string) ?? "8",
      load: (item as Record<string, unknown>)?.load as string | undefined,
      notes: (item as Record<string, unknown>)?.notes as string | undefined,
      restSeconds: (item as Record<string, unknown>)?.restSeconds as number | undefined,
      supersetGroup: (item as Record<string, unknown>)?.supersetGroup as string | undefined,
    }));
  }
  return [];
}

export function parseSorenessMap(data: unknown): SorenessMap {
  if (typeof data !== "object" || data === null) return {};
  return data as SorenessMap;
}

export function parseProfileSettings(data: unknown): ProfileSettings {
  if (typeof data !== "object" || data === null) return {};
  return data as ProfileSettings;
}

export function parseOneRmData(data: unknown): OneRmData {
  if (typeof data !== "object" || data === null) return {};
  return data as OneRmData;
}
