import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import {
  useProgramBuilderStore,
  ProgramBuilderStore,
  ProgramExercise,
  WeekProgram,
  ProgramData,
} from '@/stores/useProgramBuilderStore';

/**
 * Performance-optimized selectors for ProgramBuilder components
 * Uses useShallow to prevent re-renders when unrelated state changes
 */

// =========================================
// Core State Selectors
// =========================================

/**
 * Returns only the core program state - prevents re-render on selection changes
 */
export function useProgramState() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      program: state.program,
      totalWeeks: state.totalWeeks,
      currentWeek: state.currentWeek,
      isDirty: state.isDirty,
      programId: state.programId,
      programName: state.programName,
    }))
  );
}

/**
 * Returns current week's data only
 */
export function useCurrentWeekProgram(): WeekProgram | undefined {
  const currentWeek = useProgramBuilderStore((state) => state.currentWeek);
  const weekProgram = useProgramBuilderStore((state) => state.program[state.currentWeek]);
  return weekProgram;
}

/**
 * Returns exercises for a specific day in current week
 */
export function useDayExercises(dayIndex: number): ProgramExercise[] {
  return useProgramBuilderStore(
    useShallow((state) => state.program[state.currentWeek]?.[dayIndex] || [])
  );
}

/**
 * Returns exercises for a specific day and week
 */
export function useWeekDayExercises(weekIndex: number, dayIndex: number): ProgramExercise[] {
  return useProgramBuilderStore(
    useShallow((state) => state.program[weekIndex]?.[dayIndex] || [])
  );
}

// =========================================
// Selection Selectors
// =========================================

/**
 * Returns selection state only
 */
export function useExerciseSelection() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      selectedExercise: state.selectedExercise,
      supersetPendingId: state.supersetPendingId,
    }))
  );
}

/**
 * Returns the currently selected exercise data
 */
export function useSelectedExerciseData(): ProgramExercise | null {
  return useProgramBuilderStore((state) => {
    if (!state.selectedExercise) return null;
    const { weekIndex, dayIndex, exerciseId } = state.selectedExercise;
    return state.program[weekIndex]?.[dayIndex]?.find((ex) => ex.id === exerciseId) || null;
  });
}

// =========================================
// Computed Selectors
// =========================================

/**
 * Returns total exercise count across all weeks
 */
export function useTotalExerciseCount(): number {
  return useProgramBuilderStore((state) => {
    let count = 0;
    for (const week of Object.values(state.program)) {
      for (const day of Object.values(week)) {
        count += day.filter((ex) => !ex.isEmpty).length;
      }
    }
    return count;
  });
}

/**
 * Returns exercise count for a specific week
 */
export function useWeekExerciseCount(weekIndex: number): number {
  return useProgramBuilderStore((state) => {
    const week = state.program[weekIndex];
    if (!week) return 0;
    let count = 0;
    for (const day of Object.values(week)) {
      count += day.filter((ex) => !ex.isEmpty).length;
    }
    return count;
  });
}

/**
 * Returns exercise count for current week
 */
export function useCurrentWeekExerciseCount(): number {
  return useProgramBuilderStore((state) => {
    const week = state.program[state.currentWeek];
    if (!week) return 0;
    let count = 0;
    for (const day of Object.values(week)) {
      count += day.filter((ex) => !ex.isEmpty).length;
    }
    return count;
  });
}

// =========================================
// Actions Selectors (stable references)
// =========================================

/**
 * Returns all week-related actions
 */
export function useWeekActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      setCurrentWeek: state.setCurrentWeek,
      addWeek: state.addWeek,
      duplicateWeek: state.duplicateWeek,
      cloneWeekToRange: state.cloneWeekToRange,
      removeWeek: state.removeWeek,
      setTotalWeeks: state.setTotalWeeks,
      extractBlock: state.extractBlock,
      insertBlock: state.insertBlock,
      applyProgression: state.applyProgression,
      copyWeekToClipboard: state.copyWeekToClipboard,
      pasteWeekFromClipboard: state.pasteWeekFromClipboard,
      clearWeek: state.clearWeek,
      swapDays: state.swapDays,
    }))
  );
}

/**
 * Returns all day-related actions
 */
export function useDayActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      addDay: state.addDay,
      copyDay: state.copyDay,
      copyDayToMultiple: state.copyDayToMultiple,
      clearDay: state.clearDay,
    }))
  );
}

/**
 * Returns all exercise-related actions
 */
export function useExerciseActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      addExercise: state.addExercise,
      addEmptySlot: state.addEmptySlot,
      updateExercise: state.updateExercise,
      removeExercise: state.removeExercise,
      reorderExercises: state.reorderExercises,
      fillSlot: state.fillSlot,
      updateSet: state.updateSet,
      copyDay: state.copyDay,
      copyDayToMultiple: state.copyDayToMultiple,
      clearDay: state.clearDay,
    }))
  );
}

/**
 * Returns superset-related actions
 */
export function useSupersetActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      setSupersetPending: state.setSupersetPending,
      toggleSuperset: state.toggleSuperset,
    }))
  );
}

/**
 * Returns selection actions
 */
export function useSelectionActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      selectExercise: state.selectExercise,
      clearSelection: state.clearSelection,
    }))
  );
}

/**
 * Returns initialization and metadata actions
 */
export function useProgramActions() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      initProgram: state.initProgram,
      loadProgram: state.loadProgram,
      reset: state.reset,
      setProgramName: state.setProgramName,
      markClean: state.markClean,
    }))
  );
}

// =========================================
// Combined Hooks for Common Use Cases
// =========================================

/**
 * Returns everything needed for WeekTabs component
 */
export function useWeekTabsData() {
  return useProgramBuilderStore(
    useShallow((state) => ({
      currentWeek: state.currentWeek,
      totalWeeks: state.totalWeeks,
      setCurrentWeek: state.setCurrentWeek,
      cloneWeekToRange: state.cloneWeekToRange,
      removeWeek: state.removeWeek,
      applyProgression: state.applyProgression,
    }))
  );
}

/**
 * Returns everything needed for WeekGrid component
 */
export function useWeekGridData() {
  const currentWeek = useProgramBuilderStore((state) => state.currentWeek);
  const totalWeeks = useProgramBuilderStore((state) => state.totalWeeks);
  const weekData = useProgramBuilderStore((state) => state.program[state.currentWeek]);
  const selectedExerciseId = useProgramBuilderStore((state) => state.selectedExercise?.exerciseId);
  
  const actions = useProgramBuilderStore(
    useShallow((state) => ({
      setCurrentWeek: state.setCurrentWeek,
      removeExercise: state.removeExercise,
      toggleSuperset: state.toggleSuperset,
      selectExercise: state.selectExercise,
      addEmptySlot: state.addEmptySlot,
      copyDay: state.copyDay,
      copyDayToMultiple: state.copyDayToMultiple,
      clearDay: state.clearDay,
      reorderExercises: state.reorderExercises,
    }))
  );

  return {
    currentWeek,
    totalWeeks,
    weekData,
    selectedExerciseId,
    ...actions,
  };
}

/**
 * Returns everything needed for DndContext handlers
 */
export function useDndHandlers() {
  const currentWeek = useProgramBuilderStore((state) => state.currentWeek);
  
  const actions = useProgramBuilderStore(
    useShallow((state) => ({
      fillSlot: state.fillSlot,
      addExercise: state.addExercise,
      reorderExercises: state.reorderExercises,
    }))
  );

  return { currentWeek, ...actions };
}

/**
 * Returns everything needed for ExerciseContextEditor
 */
export function useContextEditorData() {
  const selectedExercise = useProgramBuilderStore((state) => state.selectedExercise);
  const exerciseData = useSelectedExerciseData();
  
  const actions = useProgramBuilderStore(
    useShallow((state) => ({
      updateExercise: state.updateExercise,
      clearSelection: state.clearSelection,
    }))
  );

  return {
    selectedExercise,
    exerciseData,
    ...actions,
  };
}
