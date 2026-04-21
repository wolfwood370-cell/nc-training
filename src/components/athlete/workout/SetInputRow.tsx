import { memo, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetMutation } from "@/hooks/useSetMutation";
import { Calculator, Check, Minus, Plus } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHapticFeedback";
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

// ---------------------------------------------------------------------------
// Stepper Button (square, 48px min, with haptic)
// ---------------------------------------------------------------------------

function StepperBtn({
  onTap,
  variant = "ghost",
  ariaLabel,
  children,
  disabled,
}: {
  onTap: () => void;
  variant?: "ghost" | "filled";
  ariaLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        triggerHaptic("light");
        onTap();
      }}
      className={cn(
        "h-12 min-w-12 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums",
        "transition-transform active:scale-90 select-none touch-manipulation",
        "disabled:opacity-30 disabled:pointer-events-none",
        variant === "filled"
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "bg-background/80 text-foreground hover:bg-background",
      )}
    >
      {children}
    </button>
  );
}

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
    const next = Math.max(0, +(currentKg + delta).toFixed(2));
    handleUpdate("actualKg", next.toString());
  };

  const adjustReps = (delta: number) => {
    const next = Math.max(0, currentReps + delta);
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

        {/* Steppers Row: Weight (kg) */}
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-1.5 items-center mb-2">
          <StepperBtn ariaLabel="Riduci peso 5kg" onTap={() => adjustKg(-5)}>
            −5
          </StepperBtn>
          <StepperBtn ariaLabel="Riduci peso 2.5kg" onTap={() => adjustKg(-2.5)}>
            <Minus className="h-3.5 w-3.5" />
          </StepperBtn>

          <button
            type="button"
            onClick={() => displayWeight > 0 && setPlateOpen(true)}
            className={cn(
              "h-12 rounded-xl flex items-center justify-center gap-1.5 px-3",
              "bg-background border border-border/50",
              "active:scale-[0.98] transition-transform select-none touch-manipulation",
              completed && "border-primary/40",
            )}
          >
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                completed ? "text-primary" : "text-foreground",
              )}
            >
              {currentKg > 0 ? currentKg : "—"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              kg
            </span>
            {displayWeight > 0 && (
              <Calculator className="h-3 w-3 text-muted-foreground/60 ml-0.5" />
            )}
          </button>

          <StepperBtn ariaLabel="Aumenta peso 2.5kg" onTap={() => adjustKg(2.5)}>
            <Plus className="h-3.5 w-3.5" />
          </StepperBtn>
          <StepperBtn ariaLabel="Aumenta peso 5kg" onTap={() => adjustKg(5)}>
            +5
          </StepperBtn>
        </div>

        {/* Steppers Row: Reps + big Check button */}
        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_1fr] gap-1.5 items-center">
          <StepperBtn ariaLabel="Riduci reps" onTap={() => adjustReps(-1)}>
            <Minus className="h-3.5 w-3.5" />
          </StepperBtn>
          <StepperBtn ariaLabel="Riduci 5 reps" onTap={() => adjustReps(-5)}>
            −5
          </StepperBtn>

          <div
            className={cn(
              "h-12 rounded-xl flex items-center justify-center gap-1.5 px-3",
              "bg-background border border-border/50",
              completed && "border-primary/40",
            )}
          >
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                completed ? "text-primary" : "text-foreground",
              )}
            >
              {currentReps > 0 ? currentReps : "—"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              reps
            </span>
          </div>

          <StepperBtn ariaLabel="Aumenta reps" onTap={() => adjustReps(1)}>
            <Plus className="h-3.5 w-3.5" />
          </StepperBtn>
          <StepperBtn ariaLabel="Aumenta 5 reps" onTap={() => adjustReps(5)}>
            +5
          </StepperBtn>

          {/* Big Complete button */}
          <Button
            type="button"
            onClick={() => handleComplete(!completed)}
            aria-label={completed ? "Annulla completamento" : "Completa serie"}
            className={cn(
              "h-12 min-w-12 rounded-xl ml-1 px-3",
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
