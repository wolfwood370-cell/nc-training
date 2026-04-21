import { memo, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetMutation } from "@/hooks/useSetMutation";
import { Calculator, Check, Minus, Plus } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

// ---------------------------------------------------------------------------
// Hybrid Tap-to-Edit Stepper — center input is editable, ± buttons adjust
// ---------------------------------------------------------------------------

function HybridStepper({
  value,
  displayValue,
  onChange,
  onAdjust,
  step,
  inputMode,
  unit,
  ariaLabel,
  completed,
  onCenterTap,
  centerIcon,
}: {
  value: string;
  displayValue: number;
  onChange: (raw: string) => void;
  onAdjust: (delta: number) => void;
  step: number;
  inputMode: "decimal" | "numeric";
  unit: string;
  ariaLabel: string;
  completed?: boolean;
  onCenterTap?: () => void;
  centerIcon?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Show empty while focused if user is typing; otherwise show formatted number
  const shown = focused
    ? value
    : displayValue > 0
      ? formatNumber(displayValue)
      : "";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-1.5 items-center">
      <button
        type="button"
        aria-label={`Riduci ${ariaLabel}`}
        onClick={() => {
          triggerHaptic("light");
          onAdjust(-step);
        }}
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          "bg-background/80 text-foreground hover:bg-background",
          "transition-transform active:scale-90 select-none touch-manipulation",
        )}
      >
        <Minus className="h-4 w-4" />
      </button>

      <div
        className={cn(
          "relative h-12 rounded-xl flex items-center justify-center px-2",
          "bg-background border border-border/50",
          completed && "border-primary/40",
          focused && "ring-2 ring-primary/40",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          pattern={inputMode === "decimal" ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
          enterKeyHint="done"
          aria-label={ariaLabel}
          value={shown}
          placeholder="—"
          onFocus={(e) => {
            setFocused(true);
            // Select-all so user can immediately overwrite
            requestAnimationFrame(() => e.target.select());
            onCenterTap?.();
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".");
            // Allow empty / valid numeric input only
            if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
              onChange(raw);
            }
          }}
          onBlur={() => {
            setFocused(false);
            // Normalize on blur
            if (value === "" || value === ".") {
              onChange("");
              return;
            }
            const n = parseFloat(value);
            if (Number.isFinite(n)) {
              onChange(formatNumber(Math.max(0, n)));
            }
          }}
          className={cn(
            "w-full min-w-[60px] bg-transparent border-0 outline-none p-0",
            "text-center text-xl font-bold tabular-nums",
            "focus:ring-0 focus-visible:ring-0",
            completed ? "text-primary" : "text-foreground",
            "placeholder:text-muted-foreground placeholder:font-bold",
          )}
        />
        <span className="absolute right-2 text-[10px] uppercase tracking-wider text-muted-foreground pointer-events-none">
          {centerIcon}
          {!centerIcon && unit}
        </span>
      </div>

      <button
        type="button"
        aria-label={`Aumenta ${ariaLabel}`}
        onClick={() => {
          triggerHaptic("light");
          onAdjust(step);
        }}
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          "bg-background/80 text-foreground hover:bg-background",
          "transition-transform active:scale-90 select-none touch-manipulation",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function formatNumber(n: number): string {
  // Drop trailing zeros, keep up to 2 decimals
  return (+n.toFixed(2)).toString();
}
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// ---------------------------------------------------------------------------
// Plate calculator logic (shared with PlateCalculator component)
// ---------------------------------------------------------------------------

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25: "bg-red-500 text-white",
  20: "bg-blue-500 text-white",
  15: "bg-yellow-400 text-black",
  10: "bg-green-500 text-white",
  5: "bg-white text-black border border-border",
  2.5: "bg-red-300 text-white",
  1.25: "bg-zinc-400 text-white",
};

function calculatePlates(
  totalWeight: number,
  barWeight: number,
): { plate: number; count: number }[] {
  let remaining = (totalWeight - barWeight) / 2;
  if (remaining <= 0) return [];

  const result: { plate: number; count: number }[] = [];
  for (const plate of AVAILABLE_PLATES) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ plate, count });
      remaining -= count * plate;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetInputRowProps {
  exerciseId: string;
  setNumber: number;
  targetKg: number;
  targetReps: number;
  targetRpe?: number;
  actualKg: string;
  actualReps: string;
  rpe: string;
  completed: boolean;
  onUpdate: (field: string, value: string | boolean) => void;
  onComplete: (completed: boolean) => void;
}

function getRpeColor(rpe: number): string {
  if (rpe <= 3) return "text-emerald-500";
  if (rpe <= 5) return "text-yellow-500";
  if (rpe <= 7) return "text-orange-500";
  return "text-red-500";
}

// ---------------------------------------------------------------------------
// Inline Plate Drawer
// ---------------------------------------------------------------------------

function InlinePlateDrawer({
  open,
  onOpenChange,
  weightKg,
  barWeightKg = 20,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weightKg: number;
  barWeightKg?: number;
}) {
  const plates = calculatePlates(weightKg, barWeightKg);
  const perSide = Math.max(0, (weightKg - barWeightKg) / 2);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[50dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">{weightKg}kg</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="text-center text-sm text-muted-foreground">
            Bilanciere {barWeightKg}kg +{" "}
            {perSide > 0 ? `${perSide}kg per lato` : "nessun disco"}
          </div>

          {plates.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-full h-3 bg-muted rounded-full" />
              <div className="flex flex-wrap justify-center gap-2">
                {plates.map(({ plate, count }) => (
                  <div key={plate} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                        PLATE_COLORS[plate] || "bg-muted text-foreground",
                      )}
                    >
                      {plate}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Per ogni lato del bilanciere
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              Solo bilanciere
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// (StepperBtn removed — replaced by HybridStepper above)

// ---------------------------------------------------------------------------
// SetInputRow — One-thumb mobile layout
// ---------------------------------------------------------------------------

export const SetInputRow = memo(function SetInputRow({
  exerciseId,
  setNumber,
  targetKg,
  targetReps,
  targetRpe,
  actualKg,
  actualReps,
  rpe,
  completed,
  onUpdate,
  onComplete,
}: SetInputRowProps) {
  const { mutate: syncSet } = useSetMutation();
  const [plateOpen, setPlateOpen] = useState(false);

  const handleUpdate = useCallback(
    (field: string, value: string | boolean) => {
      onUpdate(field, value);
      syncSet({ exerciseId, setIndex: setNumber - 1, field, value });
    },
    [onUpdate, syncSet, exerciseId, setNumber],
  );

  const handleComplete = useCallback(
    (checked: boolean) => {
      triggerHaptic(checked ? "success" : "light");
      onComplete(checked);
      syncSet({
        exerciseId,
        setIndex: setNumber - 1,
        field: "completed",
        value: checked,
      });
    },
    [onComplete, syncSet, exerciseId, setNumber],
  );

  // Numeric helpers — fall back to target when input is empty
  const currentKg = actualKg === "" ? targetKg || 0 : parseFloat(actualKg) || 0;
  const currentReps =
    actualReps === "" ? targetReps || 0 : parseInt(actualReps, 10) || 0;

  const adjustKg = (delta: number) => {
    const base = actualKg === "" ? targetKg || 0 : parseFloat(actualKg) || 0;
    const next = Math.max(0, +(base + delta).toFixed(2));
    handleUpdate("actualKg", formatNumber(next));
  };

  const adjustReps = (delta: number) => {
    const base =
      actualReps === "" ? targetReps || 0 : parseInt(actualReps, 10) || 0;
    const next = Math.max(0, base + delta);
    handleUpdate("actualReps", next.toString());
  };

  const displayWeight = currentKg;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl p-3 transition-all duration-300",
          completed
            ? "bg-primary/10 ring-1 ring-primary/30"
            : "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
        )}
      >
        {/* Row header: set number + target hint + RPE inline */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {setNumber}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Target:{" "}
              <span className="font-medium text-foreground">
                {targetKg > 0 ? `${targetKg}kg` : "—"} × {targetReps || "—"}
                {targetRpe ? ` @${targetRpe}` : ""}
              </span>
            </span>
          </div>

          {/* RPE inline — small input, optional */}
          <div className="flex items-center gap-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              RPE
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              placeholder={targetRpe ? targetRpe.toString() : "—"}
              value={rpe}
              onChange={(e) => handleUpdate("rpe", e.target.value)}
              className={cn(
                "h-9 w-12 text-center text-sm font-semibold rounded-lg border-0 px-1",
                "bg-background",
                rpe && getRpeColor(parseInt(rpe)),
              )}
            />
          </div>
        </div>

        {/* Weight stepper — hybrid tap-to-edit */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex-1 min-w-0">
            <HybridStepper
              ariaLabel="peso"
              value={actualKg}
              displayValue={currentKg}
              onChange={(raw) => handleUpdate("actualKg", raw)}
              onAdjust={adjustKg}
              step={1}
              inputMode="decimal"
              unit="kg"
              completed={completed}
            />
          </div>
          <button
            type="button"
            aria-label="Calcolatore dischi"
            disabled={displayWeight <= 0}
            onClick={() => {
              triggerHaptic("light");
              setPlateOpen(true);
            }}
            className={cn(
              "h-12 w-12 shrink-0 rounded-xl flex items-center justify-center",
              "bg-background/80 hover:bg-background border border-border/50",
              "transition-transform active:scale-90 touch-manipulation",
              "disabled:opacity-30 disabled:pointer-events-none",
            )}
          >
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Reps stepper + big Check button */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <HybridStepper
              ariaLabel="ripetizioni"
              value={actualReps}
              displayValue={currentReps}
              onChange={(raw) => {
                const cleaned = raw.replace(/[^\d]/g, "");
                handleUpdate("actualReps", cleaned);
              }}
              onAdjust={adjustReps}
              step={1}
              inputMode="numeric"
              unit="reps"
              completed={completed}
            />
          </div>

          {/* Big Complete button */}
          <Button
            type="button"
            onClick={() => handleComplete(!completed)}
            aria-label={completed ? "Annulla completamento" : "Completa serie"}
            className={cn(
              "h-12 w-12 shrink-0 rounded-xl px-0",
              "transition-all active:scale-95 touch-manipulation",
              completed
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-background text-muted-foreground hover:bg-primary/15 hover:text-primary border border-border/50",
            )}
          >
            <Check
              className={cn(
                "h-5 w-5 transition-transform",
                completed && "scale-110",
              )}
              strokeWidth={3}
            />
          </Button>
        </div>
      </div>

      {/* Plate Calculator Drawer */}
      <InlinePlateDrawer
        open={plateOpen}
        onOpenChange={setPlateOpen}
        weightKg={displayWeight}
      />
    </>
  );
});
