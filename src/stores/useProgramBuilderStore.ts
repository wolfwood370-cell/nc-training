import { create } from 'zustand';
import type { ProgramExercise as BaseProgramExercise, WeekProgram, ProgramData } from '@/components/coach/WeekGrid';
import type { SetDataRecord } from '@/types/database';
import type { ExerciseProgression } from '@/types/progression';
import { calculateProgressedValue, parseLoadValue, formatLoadValue } from '@/types/progression';

// =========================================
// Types
// =========================================

// Extended ProgramExercise with setsData for granular set tracking
export interface ProgramExercise extends BaseProgramExercise {
  setsData?: SetDataRecord[];
}

// Re-export compatible types
export type { WeekProgram, ProgramData };

export interface SetField {
  reps?: number;
  weight_kg?: number;
  rpe?: number;
  rir?: number;
  completed?: boolean;
}

export interface ProgramBuilderState {
  // Core program data
  program: ProgramData;
  totalWeeks: number;
  currentWeek: number;
  
  // Selection state
  selectedExercise: {
    weekIndex: number;
    dayIndex: number;
    exerciseId: string;
  } | null;
  
  // Superset pending state
  supersetPendingId: string | null;
  
  // Week clipboard for copy/paste
  weekClipboard: WeekProgram | null;
  
  // Metadata
  programId: string | null;
  programName: string;
  isDirty: boolean;
}

export interface ProgramBuilderActions {
  // Initialization
  initProgram: (weeks?: number) => void;
  loadProgram: (data: ProgramData, id: string, name: string) => void;
  reset: () => void;
  
  // Week operations
  setCurrentWeek: (weekIndex: number) => void;
  addWeek: () => void;
  duplicateWeek: (weekIndex: number) => void;
  cloneWeekToRange: (sourceWeekIndex: number, targetWeekIndices: number[]) => void;
  removeWeek: (weekIndex: number) => void;
  setTotalWeeks: (count: number) => void;
  copyWeekToClipboard: (weekIndex: number) => void;
  pasteWeekFromClipboard: (weekIndex: number) => void;
  clearWeek: (weekIndex: number) => void;
  swapDays: (weekIndex: number, fromDayIndex: number, toDayIndex: number) => void;
  
  // Block template operations
  extractBlock: (startWeek: number, endWeek: number) => ProgramData;
  insertBlock: (blockData: ProgramData, atWeekIndex: number) => void;
  
  // Day operations
  addDay: (weekId: number) => void;
  copyDay: (fromWeekIndex: number, fromDayIndex: number, toWeekIndex: number, toDayIndex: number, mode: 'append' | 'overwrite') => void;
  copyDayToMultiple: (fromWeekIndex: number, fromDayIndex: number, targets: { weekIndex: number; dayIndex: number }[], mode: 'append' | 'overwrite') => void;
  clearDay: (weekIndex: number, dayIndex: number) => void;
  
  // Exercise operations
  addExercise: (dayIndex: number, exercise: ProgramExercise, weekIndex?: number) => void;
  addEmptySlot: (dayIndex: number, weekIndex?: number) => void;
  updateExercise: (dayIndex: number, exerciseId: string, updates: Partial<ProgramExercise>, weekIndex?: number) => void;
  removeExercise: (dayIndex: number, exerciseId: string, weekIndex?: number) => void;
  reorderExercises: (dayIndex: number, newOrder: string[], weekIndex?: number) => void;
  fillSlot: (slotId: string, libraryExercise: { id: string; name: string; muscles: string[]; tracking_fields: string[] }, weekIndex: number, dayIndex: number) => void;
  
  // Set operations
  updateSet: (exerciseId: string, setIndex: number, field: keyof SetField, value: number | boolean, weekIndex?: number, dayIndex?: number) => void;
  
  // Progression operations
  applyProgression: (fromWeekIndex: number) => void;
  
  // Superset operations
  setSupersetPending: (exerciseId: string | null) => void;
  toggleSuperset: (dayIndex: number, exerciseId: string, weekIndex?: number) => void;
  
  // Selection
  selectExercise: (weekIndex: number, dayIndex: number, exerciseId: string) => void;
  clearSelection: () => void;
  
  // Metadata
  setProgramName: (name: string) => void;
  markClean: () => void;
}

export type ProgramBuilderStore = ProgramBuilderState & ProgramBuilderActions;

// =========================================
// Helpers
// =========================================

function createEmptyProgram(weeks: number): ProgramData {
  const program: ProgramData = {};
  for (let w = 0; w < weeks; w++) {
    program[w] = {};
    for (let d = 0; d < 7; d++) {
      program[w][d] = [];
    }
  }
  return program;
}

function createEmptySlot(weekIndex: number, dayIndex: number): ProgramExercise {
  return {
    id: `slot-${weekIndex}-${dayIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    exerciseId: '',
    name: '',
    sets: 0,
    reps: '',
    load: '',
    rpe: null,
    restSeconds: 90,
    notes: '',
    isEmpty: true,
  };
}

function generateSupersetGroupId(): string {
  return `superset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Deep clones an exercise with NEW unique IDs for all nested data.
 * This ensures no reference bugs when cloning weeks.
 */
function deepCloneExercise(exercise: ProgramExercise): ProgramExercise {
  // Generate completely new unique ID
  const newId = crypto.randomUUID();
  
  // Deep clone setsData if present
  let clonedSetsData: SetDataRecord[] | undefined;
  if (exercise.setsData && Array.isArray(exercise.setsData)) {
    clonedSetsData = exercise.setsData.map((setData) => ({
      ...setData,
    }));
  }

  // Deep clone progression if present
  let clonedProgression: ExerciseProgression | undefined;
  if (exercise.progression) {
    clonedProgression = {
      ...exercise.progression,
      rules: exercise.progression.rules?.map((rule) => ({ ...rule })) || [],
    };
  }

  // Deep clone snapshot arrays
  const clonedSnapshotTrackingFields = exercise.snapshotTrackingFields
    ? [...exercise.snapshotTrackingFields]
    : undefined;
  const clonedSnapshotMuscles = exercise.snapshotMuscles
    ? [...exercise.snapshotMuscles]
    : undefined;

  return {
    ...exercise,
    id: newId,
    supersetGroup: undefined,
    setsData: clonedSetsData,
    progression: clonedProgression,
    snapshotTrackingFields: clonedSnapshotTrackingFields,
    snapshotMuscles: clonedSnapshotMuscles,
  };
}

// Legacy alias for backwards compatibility
function cloneExercise(exercise: ProgramExercise): ProgramExercise {
  return deepCloneExercise(exercise);
}

// Helper to deeply clone program data
function deepCloneProgram(program: ProgramData): ProgramData {
  const cloned: ProgramData = {};
  for (const weekKey of Object.keys(program)) {
    const weekIndex = Number(weekKey);
    cloned[weekIndex] = {};
    for (let d = 0; d < 7; d++) {
      cloned[weekIndex][d] = (program[weekIndex]?.[d] || []).map(ex => ({ ...ex }));
    }
  }
  return cloned;
}

const DEFAULT_WEEKS = 4;

// =========================================
// Store
// =========================================

export const useProgramBuilderStore = create<ProgramBuilderStore>()((set, get) => ({
  // Initial state
  program: createEmptyProgram(DEFAULT_WEEKS),
  totalWeeks: DEFAULT_WEEKS,
  currentWeek: 0,
  selectedExercise: null,
  supersetPendingId: null,
  weekClipboard: null,
  programId: null,
  programName: '',
  isDirty: false,

  // =========================================
  // Initialization
  // =========================================
  
  initProgram: (weeks = DEFAULT_WEEKS) => {
    set({
      program: createEmptyProgram(weeks),
      totalWeeks: weeks,
      currentWeek: 0,
      selectedExercise: null,
      supersetPendingId: null,
      weekClipboard: null,
      programId: null,
      programName: '',
      isDirty: false,
    });
  },

  loadProgram: (data, id, name) => {
    set({
      program: data,
      totalWeeks: Object.keys(data).length,
      currentWeek: 0,
      selectedExercise: null,
      supersetPendingId: null,
      weekClipboard: null,
      programId: id,
      programName: name,
      isDirty: false,
    });
  },

  reset: () => {
    set({
      program: createEmptyProgram(DEFAULT_WEEKS),
      totalWeeks: DEFAULT_WEEKS,
      currentWeek: 0,
      selectedExercise: null,
      supersetPendingId: null,
      weekClipboard: null,
      programId: null,
      programName: '',
      isDirty: false,
    });
  },

  // =========================================
  // Week Operations
  // =========================================

  setCurrentWeek: (weekIndex) => {
    const state = get();
    if (weekIndex >= 0 && weekIndex < state.totalWeeks) {
      set({ currentWeek: weekIndex });
    }
  },

  addWeek: () => {
    const state = get();
    const newWeekIndex = state.totalWeeks;
    const newProgram = deepCloneProgram(state.program);
    newProgram[newWeekIndex] = {};
    for (let d = 0; d < 7; d++) {
      newProgram[newWeekIndex][d] = [];
    }
    set({
      program: newProgram,
      totalWeeks: state.totalWeeks + 1,
      isDirty: true,
    });
  },

  duplicateWeek: (weekIndex) => {
    const state = get();
    const sourceWeek = state.program[weekIndex];
    if (!sourceWeek) return;

    const newWeekIndex = state.totalWeeks;
    const newProgram = deepCloneProgram(state.program);
    newProgram[newWeekIndex] = {};
    
    for (let d = 0; d < 7; d++) {
      const sourceDay = sourceWeek[d] || [];
      newProgram[newWeekIndex][d] = sourceDay.map((ex) => cloneExercise(ex));
    }
    
    set({
      program: newProgram,
      totalWeeks: state.totalWeeks + 1,
      isDirty: true,
    });
  },

  cloneWeekToRange: (sourceWeekIndex, targetWeekIndices) => {
    const state = get();
    const sourceWeek = state.program[sourceWeekIndex];
    if (!sourceWeek) return;

    const newProgram = deepCloneProgram(state.program);
    let newTotalWeeks = state.totalWeeks;

    for (const targetIndex of targetWeekIndices) {
      // Ensure target week exists with empty days
      if (!newProgram[targetIndex]) {
        newProgram[targetIndex] = {};
        for (let d = 0; d < 7; d++) {
          newProgram[targetIndex][d] = [];
        }
      }

      // Deep clone all exercises from source to target (overwrite)
      for (let d = 0; d < 7; d++) {
        const sourceDay = sourceWeek[d] || [];
        newProgram[targetIndex][d] = sourceDay.map((ex) => deepCloneExercise(ex));
      }

      // Expand totalWeeks if needed
      if (targetIndex >= newTotalWeeks) {
        newTotalWeeks = targetIndex + 1;
      }
    }

    set({
      program: newProgram,
      totalWeeks: newTotalWeeks,
      isDirty: true,
    });
  },

  extractBlock: (startWeek, endWeek) => {
    const state = get();
    const blockData: ProgramData = {};
    
    for (let w = startWeek; w <= endWeek; w++) {
      const relativeIndex = w - startWeek;
      blockData[relativeIndex] = {};
      
      for (let d = 0; d < 7; d++) {
        const sourceDay = state.program[w]?.[d] || [];
        blockData[relativeIndex][d] = sourceDay.map((ex) => ({
          ...ex,
          id: crypto.randomUUID(),
          supersetGroup: undefined,
        }));
      }
    }
    
    return blockData;
  },

  insertBlock: (blockData, atWeekIndex) => {
    const state = get();
    const blockSize = Object.keys(blockData).length;
    
    // Shift existing weeks to make room
    const newProgram: ProgramData = {};
    
    // Copy weeks before insertion point
    for (let w = 0; w < atWeekIndex; w++) {
      if (state.program[w]) {
        newProgram[w] = { ...state.program[w] };
        for (let d = 0; d < 7; d++) {
          newProgram[w][d] = [...(state.program[w][d] || [])];
        }
      }
    }
    
    // Insert block data
    for (let i = 0; i < blockSize; i++) {
      newProgram[atWeekIndex + i] = {};
      for (let d = 0; d < 7; d++) {
        const sourceDay = blockData[i]?.[d] || [];
        newProgram[atWeekIndex + i][d] = sourceDay.map((ex) => ({
          ...ex,
          id: crypto.randomUUID(),
        }));
      }
    }
    
    // Shift remaining weeks
    for (let w = atWeekIndex; w < state.totalWeeks; w++) {
      if (state.program[w]) {
        newProgram[w + blockSize] = { ...state.program[w] };
        for (let d = 0; d < 7; d++) {
          newProgram[w + blockSize][d] = [...(state.program[w][d] || [])];
        }
      }
    }
    
    set({
      program: newProgram,
      totalWeeks: state.totalWeeks + blockSize,
      isDirty: true,
    });
  },

  removeWeek: (weekIndex) => {
    const state = get();
    if (state.totalWeeks <= 1) return; // Keep at least 1 week

    // Reindex remaining weeks
    const newProgram: ProgramData = {};
    let newIndex = 0;
    for (let i = 0; i < state.totalWeeks; i++) {
      if (i !== weekIndex && state.program[i]) {
        newProgram[newIndex] = { ...state.program[i] };
        for (let d = 0; d < 7; d++) {
          newProgram[newIndex][d] = [...(state.program[i][d] || [])];
        }
        newIndex++;
      }
    }

    const newTotalWeeks = state.totalWeeks - 1;
    const newCurrentWeek = state.currentWeek >= newTotalWeeks ? newTotalWeeks - 1 : state.currentWeek;

    set({
      program: newProgram,
      totalWeeks: newTotalWeeks,
      currentWeek: newCurrentWeek,
      isDirty: true,
    });
  },

  setTotalWeeks: (count) => {
    const state = get();
    if (count < 1 || count > 52) return; // Reasonable limits

    const newProgram = deepCloneProgram(state.program);

    if (count > state.totalWeeks) {
      // Add weeks
      for (let w = state.totalWeeks; w < count; w++) {
        newProgram[w] = {};
        for (let d = 0; d < 7; d++) {
          newProgram[w][d] = [];
        }
      }
    } else if (count < state.totalWeeks) {
      // Remove weeks from the end
      for (let w = count; w < state.totalWeeks; w++) {
        delete newProgram[w];
      }
    }

    const newCurrentWeek = state.currentWeek >= count ? count - 1 : state.currentWeek;

    set({
      program: newProgram,
      totalWeeks: count,
      currentWeek: newCurrentWeek,
      isDirty: true,
    });
  },

  copyWeekToClipboard: (weekIndex) => {
    const state = get();
    const sourceWeek = state.program[weekIndex];
    if (!sourceWeek) return;

    // Deep clone the week data for clipboard
    const clipboard: WeekProgram = {};
    for (let d = 0; d < 7; d++) {
      clipboard[d] = (sourceWeek[d] || []).map((ex) => deepCloneExercise(ex));
    }
    set({ weekClipboard: clipboard });
  },

  pasteWeekFromClipboard: (weekIndex) => {
    const state = get();
    if (!state.weekClipboard) return;

    const newProgram = deepCloneProgram(state.program);
    if (!newProgram[weekIndex]) {
      newProgram[weekIndex] = {};
      for (let d = 0; d < 7; d++) {
        newProgram[weekIndex][d] = [];
      }
    }

    for (let d = 0; d < 7; d++) {
      newProgram[weekIndex][d] = (state.weekClipboard[d] || []).map((ex) => deepCloneExercise(ex));
    }

    set({ program: newProgram, isDirty: true });
  },

  clearWeek: (weekIndex) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    if (!newProgram[weekIndex]) return;

    for (let d = 0; d < 7; d++) {
      newProgram[weekIndex][d] = [];
    }

    set({ program: newProgram, isDirty: true });
  },

  swapDays: (weekIndex, fromDayIndex, toDayIndex) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    if (!newProgram[weekIndex]) return;

    const temp = newProgram[weekIndex][fromDayIndex] || [];
    newProgram[weekIndex][fromDayIndex] = newProgram[weekIndex][toDayIndex] || [];
    newProgram[weekIndex][toDayIndex] = temp;

    set({ program: newProgram, isDirty: true });
  },

  // =========================================
  // Day Operations
  // =========================================

  addDay: (weekId) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    
    // Ensure the week exists
    if (!newProgram[weekId]) {
      newProgram[weekId] = {};
      for (let d = 0; d < 7; d++) {
        newProgram[weekId][d] = [];
      }
    }
    
    set({ program: newProgram, isDirty: true });
  },

  copyDay: (fromWeekIndex, fromDayIndex, toWeekIndex, toDayIndex, mode) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    
    const sourceExercises = state.program[fromWeekIndex]?.[fromDayIndex] || [];
    
    if (!newProgram[toWeekIndex]) {
      newProgram[toWeekIndex] = {};
      for (let d = 0; d < 7; d++) {
        newProgram[toWeekIndex][d] = [];
      }
    }

    const clonedExercises = sourceExercises
      .filter((ex) => !ex.isEmpty)
      .map((ex) => cloneExercise(ex));

    if (mode === 'overwrite') {
      newProgram[toWeekIndex][toDayIndex] = clonedExercises;
    } else {
      newProgram[toWeekIndex][toDayIndex] = [
        ...(newProgram[toWeekIndex][toDayIndex] || []),
        ...clonedExercises,
      ];
    }

    set({ program: newProgram, isDirty: true });
  },

  copyDayToMultiple: (fromWeekIndex, fromDayIndex, targets, mode) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    const sourceExercises = state.program[fromWeekIndex]?.[fromDayIndex] || [];
    
    for (const target of targets) {
      if (!newProgram[target.weekIndex]) {
        newProgram[target.weekIndex] = {};
        for (let d = 0; d < 7; d++) {
          newProgram[target.weekIndex][d] = [];
        }
      }

      const clonedExercises = sourceExercises
        .filter((ex) => !ex.isEmpty)
        .map((ex) => cloneExercise(ex));

      if (mode === 'overwrite') {
        newProgram[target.weekIndex][target.dayIndex] = clonedExercises;
      } else {
        newProgram[target.weekIndex][target.dayIndex] = [
          ...(newProgram[target.weekIndex][target.dayIndex] || []),
          ...clonedExercises,
        ];
      }
    }

    set({ program: newProgram, isDirty: true });
  },

  clearDay: (weekIndex, dayIndex) => {
    const state = get();
    if (!state.program[weekIndex]?.[dayIndex]) return;
    
    const newProgram = deepCloneProgram(state.program);
    newProgram[weekIndex][dayIndex] = [];
    
    set({ program: newProgram, isDirty: true });
  },

  // =========================================
  // Exercise Operations
  // =========================================

  addExercise: (dayIndex, exercise, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const newProgram = deepCloneProgram(state.program);
    
    if (!newProgram[week]) {
      newProgram[week] = {};
      for (let d = 0; d < 7; d++) {
        newProgram[week][d] = [];
      }
    }
    
    newProgram[week][dayIndex] = [...(newProgram[week][dayIndex] || []), exercise];
    
    set({ program: newProgram, isDirty: true });
  },

  addEmptySlot: (dayIndex, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const newProgram = deepCloneProgram(state.program);
    
    if (!newProgram[week]) {
      newProgram[week] = {};
      for (let d = 0; d < 7; d++) {
        newProgram[week][d] = [];
      }
    }
    
    newProgram[week][dayIndex] = [
      ...(newProgram[week][dayIndex] || []),
      createEmptySlot(week, dayIndex),
    ];
    
    set({ program: newProgram, isDirty: true });
  },

  updateExercise: (dayIndex, exerciseId, updates, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const exercises = state.program[week]?.[dayIndex];
    if (!exercises) return;

    const idx = exercises.findIndex((ex) => ex.id === exerciseId);
    if (idx === -1) return;
    
    const newProgram = deepCloneProgram(state.program);
    newProgram[week][dayIndex][idx] = { ...newProgram[week][dayIndex][idx], ...updates };
    
    set({ program: newProgram, isDirty: true });
  },

  removeExercise: (dayIndex, exerciseId, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const exercises = state.program[week]?.[dayIndex];
    if (!exercises) return;

    const idx = exercises.findIndex((ex) => ex.id === exerciseId);
    if (idx === -1) return;
    
    const newProgram = deepCloneProgram(state.program);
    newProgram[week][dayIndex] = newProgram[week][dayIndex].filter((ex) => ex.id !== exerciseId);
    
    const newSelectedExercise = state.selectedExercise?.exerciseId === exerciseId ? null : state.selectedExercise;
    
    set({ program: newProgram, selectedExercise: newSelectedExercise, isDirty: true });
  },

  reorderExercises: (dayIndex, newOrder, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const exercises = state.program[week]?.[dayIndex];
    if (!exercises) return;

    // Create a map for quick lookup
    const exerciseMap = new Map<string, BaseProgramExercise>(exercises.map((ex) => [ex.id, ex]));
    
    // Reorder based on newOrder array
    const reordered: BaseProgramExercise[] = [];
    for (const id of newOrder) {
      const ex = exerciseMap.get(id);
      if (ex) {
        reordered.push({ ...ex });
        exerciseMap.delete(id);
      }
    }
    
    // Append any exercises not in newOrder (shouldn't happen, but safety)
    exerciseMap.forEach((ex) => reordered.push({ ...ex }));
    
    const newProgram = deepCloneProgram(state.program);
    newProgram[week][dayIndex] = reordered;
    
    set({ program: newProgram, isDirty: true });
  },

  fillSlot: (slotId, libraryExercise, weekIndex, dayIndex) => {
    const state = get();
    const exercises = state.program[weekIndex]?.[dayIndex];
    if (!exercises) return;

    const idx = exercises.findIndex((ex) => ex.id === slotId);
    if (idx === -1 || !exercises[idx].isEmpty) return;
    
    const newProgram = deepCloneProgram(state.program);
    newProgram[weekIndex][dayIndex][idx] = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: libraryExercise.id,
      name: libraryExercise.name,
      sets: 3,
      reps: '8-12',
      load: '',
      rpe: null,
      restSeconds: 90,
      notes: '',
      isEmpty: false,
      snapshotTrackingFields: [...libraryExercise.tracking_fields],
      snapshotMuscles: [...libraryExercise.muscles],
    };
    
    set({ program: newProgram, isDirty: true });
  },

  // =========================================
  // Set Operations
  // =========================================

  updateSet: (exerciseId, setIndex, field, value, weekIndex, dayIndex) => {
    const state = get();
    const newProgram = deepCloneProgram(state.program);
    
    // Find the exercise
    let foundWeek: number | undefined;
    let foundDay: number | undefined;
    let foundIdx: number | undefined;

    if (weekIndex !== undefined && dayIndex !== undefined) {
      const exercises = newProgram[weekIndex]?.[dayIndex];
      if (exercises) {
        const idx = exercises.findIndex((ex) => ex.id === exerciseId);
        if (idx !== -1) {
          foundWeek = weekIndex;
          foundDay = dayIndex;
          foundIdx = idx;
        }
      }
    } else {
      // Search current week
      for (let d = 0; d < 7; d++) {
        const exercises = newProgram[state.currentWeek]?.[d];
        if (exercises) {
          const idx = exercises.findIndex((e) => e.id === exerciseId);
          if (idx !== -1) {
            foundWeek = state.currentWeek;
            foundDay = d;
            foundIdx = idx;
            break;
          }
        }
      }
    }

    if (foundWeek === undefined || foundDay === undefined || foundIdx === undefined) return;

    const exercise = newProgram[foundWeek][foundDay][foundIdx] as ProgramExercise;

    // For set-level updates, we store them in a setsData array
    // Initialize if not present
    if (!exercise.setsData) {
      exercise.setsData = Array.from({ length: exercise.sets }, (_, i) => ({
        set_number: i + 1,
        reps: 0,
        weight_kg: 0,
        completed: false,
      }));
    }

    // Ensure setIndex is valid and update the field
    if (setIndex >= 0 && setIndex < exercise.setsData.length) {
      const setData = { ...exercise.setsData[setIndex] };
      switch (field) {
        case 'reps':
          setData.reps = value as number;
          break;
        case 'weight_kg':
          setData.weight_kg = value as number;
          break;
        case 'rpe':
          setData.rpe = value as number;
          break;
        case 'completed':
          setData.completed = value as boolean;
          break;
      }
      exercise.setsData = [...exercise.setsData];
      exercise.setsData[setIndex] = setData;
    }

    set({ program: newProgram, isDirty: true });
  },

  // =========================================
  // Superset Operations
  // =========================================

  setSupersetPending: (exerciseId) => {
    set({ supersetPendingId: exerciseId });
  },

  toggleSuperset: (dayIndex, exerciseId, weekIndex) => {
    const state = get();
    const week = weekIndex ?? state.currentWeek;
    const exercises = state.program[week]?.[dayIndex];
    if (!exercises) return;

    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise || exercise.isEmpty) return;

    const newProgram = deepCloneProgram(state.program);
    const newExercises = newProgram[week][dayIndex];
    const newExercise = newExercises.find((ex) => ex.id === exerciseId);
    if (!newExercise) return;

    // If already in a superset, remove from it
    if (newExercise.supersetGroup) {
      const groupId = newExercise.supersetGroup;
      newExercise.supersetGroup = undefined;
      
      // Check if any other exercise still uses this group
      const otherInGroup = newExercises.filter(
        (ex) => ex.supersetGroup === groupId && ex.id !== exerciseId
      );
      
      // If only one left, remove their superset too
      if (otherInGroup.length === 1) {
        otherInGroup[0].supersetGroup = undefined;
      }
      
      set({ program: newProgram, supersetPendingId: null, isDirty: true });
      return;
    }

    // If there's a pending superset exercise
    if (state.supersetPendingId && state.supersetPendingId !== exerciseId) {
      const pendingExercise = newExercises.find((ex) => ex.id === state.supersetPendingId);
      if (pendingExercise && !pendingExercise.isEmpty) {
        // Create or join superset
        const groupId = pendingExercise.supersetGroup || generateSupersetGroupId();
        pendingExercise.supersetGroup = groupId;
        newExercise.supersetGroup = groupId;
        set({ program: newProgram, supersetPendingId: null, isDirty: true });
      }
    } else {
      // Set this as pending
      set({ supersetPendingId: exerciseId });
    }
  },

  // =========================================
  // Selection
  // =========================================

  selectExercise: (weekIndex, dayIndex, exerciseId) => {
    const state = get();
    const exercise = state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId);
    if (exercise && !exercise.isEmpty) {
      set({ selectedExercise: { weekIndex, dayIndex, exerciseId } });
    }
  },

  clearSelection: () => {
    set({ selectedExercise: null });
  },

  // =========================================
  // Progression
  // =========================================

  applyProgression: (fromWeekIndex) => {
    const state = get();
    const sourceWeek = state.program[fromWeekIndex];
    if (!sourceWeek) return;

    const newProgram = deepCloneProgram(state.program);

    // For each subsequent week, apply progression rules
    for (let targetWeekIndex = fromWeekIndex + 1; targetWeekIndex < state.totalWeeks; targetWeekIndex++) {
      const weekOffset = targetWeekIndex - fromWeekIndex;

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const sourceExercises = sourceWeek[dayIndex] || [];
        
        if (!newProgram[targetWeekIndex]) {
          newProgram[targetWeekIndex] = {};
          for (let d = 0; d < 7; d++) {
            newProgram[targetWeekIndex][d] = [];
          }
        }

        // Find matching exercises in target week by exerciseId
        for (const sourceEx of sourceExercises) {
          if (!sourceEx.progression?.enabled || !sourceEx.progression.rules.length) continue;

          // Find or create matching exercise in target week
          let targetExIdx = newProgram[targetWeekIndex][dayIndex].findIndex(
            (ex) => ex.exerciseId === sourceEx.exerciseId && !ex.isEmpty
          );

          // If no matching exercise exists, clone from source
          if (targetExIdx === -1) {
            const newEx = {
              ...sourceEx,
              id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              supersetGroup: undefined,
            };
            newProgram[targetWeekIndex][dayIndex].push(newEx);
            targetExIdx = newProgram[targetWeekIndex][dayIndex].length - 1;
          }

          const targetEx = newProgram[targetWeekIndex][dayIndex][targetExIdx];

          // Apply each progression rule
          for (const rule of sourceEx.progression.rules) {
            switch (rule.type) {
              case 'rir_decrease':
                // RIR is inverse of RPE (RPE 10 = RIR 0, RPE 8 = RIR 2)
                if (sourceEx.rpe !== null) {
                  targetEx.rpe = Math.min(10, sourceEx.rpe + (rule.value * weekOffset));
                }
                break;
              case 'rpe_increase':
                if (sourceEx.rpe !== null) {
                  targetEx.rpe = Math.min(10, calculateProgressedValue(sourceEx.rpe, rule, weekOffset));
                }
                break;
              case 'load_percent':
              case 'load_absolute':
                const parsed = parseLoadValue(sourceEx.load);
                if (parsed) {
                  const newValue = calculateProgressedValue(parsed.value, rule, weekOffset);
                  targetEx.load = formatLoadValue(newValue, parsed.isPercent);
                }
                break;
              case 'reps_increase':
                const baseReps = parseInt(sourceEx.reps) || 0;
                if (baseReps > 0) {
                  targetEx.reps = String(Math.round(calculateProgressedValue(baseReps, rule, weekOffset)));
                }
                break;
              case 'sets_increase':
                if (sourceEx.sets > 0) {
                  targetEx.sets = Math.round(calculateProgressedValue(sourceEx.sets, rule, weekOffset));
                }
                break;
            }
          }
        }
      }
    }

    set({ program: newProgram, isDirty: true });
  },

  // =========================================
  // Metadata
  // =========================================

  setProgramName: (name) => {
    set({ programName: name, isDirty: true });
  },

  markClean: () => {
    set({ isDirty: false });
  },
}));

// =========================================
// Selectors
// =========================================

export const selectCurrentWeekProgram = (state: ProgramBuilderStore): WeekProgram | undefined => {
  return state.program[state.currentWeek];
};

export const selectDayExercises = (state: ProgramBuilderStore, dayIndex: number): ProgramExercise[] => {
  return state.program[state.currentWeek]?.[dayIndex] || [];
};

export const selectExercise = (state: ProgramBuilderStore, weekIndex: number, dayIndex: number, exerciseId: string): ProgramExercise | undefined => {
  return state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId);
};

export const selectTotalExerciseCount = (state: ProgramBuilderStore): number => {
  let count = 0;
  for (const week of Object.values(state.program)) {
    for (const day of Object.values(week)) {
      count += day.filter((ex) => !ex.isEmpty).length;
    }
  }
  return count;
};

export const selectWeekExerciseCount = (state: ProgramBuilderStore, weekIndex: number): number => {
  const week = state.program[weekIndex];
  if (!week) return 0;
  let count = 0;
  for (const day of Object.values(week)) {
    count += day.filter((ex) => !ex.isEmpty).length;
  }
  return count;
};

export const selectSelectedExerciseData = (state: ProgramBuilderStore): ProgramExercise | null => {
  if (!state.selectedExercise) return null;
  const { weekIndex, dayIndex, exerciseId } = state.selectedExercise;
  return state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId) || null;
};
