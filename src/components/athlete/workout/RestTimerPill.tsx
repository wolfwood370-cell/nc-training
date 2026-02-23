import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Timer, X, Plus, Minus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { onRestTimerEnd } from "@/utils/ux";
import { startMediaSession, updateMediaSessionTime, stopMediaSession } from "@/lib/mediaSession";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RestTimerPillProps {
  /** Timestamp (Date.now()) when the timer ends */
  endTime: number | null;
  /** Total duration in seconds (for progress calc) */
  totalSeconds: number;
  onSkip: () => void;
  onAdd: (seconds: number) => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Notification helpers
// ---------------------------------------------------------------------------

/**
 * Request Notification permission. Must be called from a user-gesture handler
 * (e.g. button click) to satisfy browser policies.
 */
export function enableNotifications() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

/** Fire a system notification if permitted */
function fireTimerNotification() {
  // Only fire system notification when app is in background / screen off
  if (!document.hidden) return;

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("⏱ Recupero terminato!", {
        body: "Il tempo di riposo è scaduto. Prossima serie!",
        icon: "/pwa-192.png",
        tag: "rest-timer-end",
      });
    } catch {
      // Some environments (e.g. iOS Safari) may throw; silently ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// SVG progress ring constants
const RING_SIZE = 160;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RestTimerPill({
  endTime,
  totalSeconds,
  onSkip,
  onAdd,
  onReset,
}: RestTimerPillProps) {
  const [remaining, setRemaining] = useState(0);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  // Notification permission is now requested via enableNotifications()
  // called from a user gesture (e.g. unlockAudio in WorkoutPlayer).

  // Derive remaining from timestamp every 100ms
  useEffect(() => {
    if (endTime == null) {
      setRemaining(0);
      completedRef.current = false;
      stopMediaSession();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    completedRef.current = false;
    startMediaSession();

    const tick = () => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
      updateMediaSessionTime(left);

      if (left <= 0 && !completedRef.current) {
        completedRef.current = true;
        stopMediaSession();
        onRestTimerEnd();
        fireTimerNotification();
        onSkipRef.current();
      }
    };

    tick(); // immediate first tick
    intervalRef.current = setInterval(tick, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [endTime]);

  const active = endTime != null && remaining > 0;
  if (!active && endTime == null) return null;

  const isUrgent = remaining <= 10 && remaining > 0;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-4 right-4 z-50"
        >
          <div className="bg-[hsl(var(--m3-surface-container-high,var(--card)))] rounded-2xl p-4 shadow-2xl border border-border/30 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer className={cn("h-5 w-5", isUrgent ? "text-destructive" : "text-primary")} />
                <span className="text-sm font-medium">Recupero</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Timer Display with SVG Progress Ring */}
            <div className="flex justify-center mb-3">
              <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
                <svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  className="rotate-[-90deg]"
                >
                  {/* Background ring */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={RING_STROKE}
                  />
                  {/* Progress ring */}
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    stroke={isUrgent ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-200 ease-linear"
                  />
                </svg>
                {/* Centered text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      "text-4xl font-bold tabular-nums transition-colors",
                      isUrgent ? "text-destructive animate-pulse" : "text-foreground"
                    )}
                  >
                    {formatTime(remaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="h-9" onClick={() => onAdd(-15)}>
                <Minus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={onReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={() => onAdd(15)}>
                <Plus className="h-3 w-3 mr-1" />
                15s
              </Button>
              <Button size="sm" className="h-9 ml-2" onClick={onSkip}>
                Salta
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
