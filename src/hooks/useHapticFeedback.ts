/**
 * Custom hook for haptic feedback on mobile devices
 * Uses the Web Vibration API where supported
 */

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 50,
  heavy: 100,
  success: [50, 50, 100],
  warning: [100, 50, 100],
  error: [200, 100, 200],
};

export function useHapticFeedback() {
  const isSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  const trigger = (type: HapticType = "light") => {
    if (!isSupported) return false;

    try {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  };

  // Convenience methods
  const light = () => trigger("light");
  const medium = () => trigger("medium");
  const heavy = () => trigger("heavy");
  const success = () => trigger("success");
  const warning = () => trigger("warning");
  const error = () => trigger("error");

  return {
    isSupported,
    trigger,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
  };
}

// Standalone function for use outside of React components
export function triggerHaptic(type: HapticType = "light"): boolean {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return false;
  }

  try {
    const pattern = hapticPatterns[type];
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}
