import { memo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetMutation } from "@/hooks/useSetMutation";
import { Calculator } from "lucide-react";
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
          {/* Bar info */}
          <div className="text-center text-sm text-muted-foreground">
            Bilanciere {barWeightKg}kg +{""}
            {perSide > 0 ? `${perSide}kg per lato` : "nessun disco"}
          </div>

          {/* Visual plate stack */}
          {plates.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              {/* Bar representation */}
              <div className="w-full h-3 bg-muted rounded-full" />

              {/* Plates per side */}
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
// SetInputRow
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

  const handleUpdate = (field: string, value: string | boolean) => {
    onUpdate(field, value);
    syncSet({ exerciseId, setIndex: setNumber - 1, field, value });
  };

  const handleComplete = (checked: boolean) => {
    onComplete(checked);
    syncSet({
      exerciseId,
      setIndex: setNumber - 1,
      field: "completed",
      value: checked,
    });
  };

  // Determine the weight to show in plate calc: prefer actual, fall back to target
  const displayWeight = parseFloat(actualKg) || targetKg;

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-[2.5rem_1fr_1fr_1fr_2.5rem] gap-2 items-center p-2.5 rounded-xl transition-all duration-300",
          completed
            ? "bg-primary/10 ring-1 ring-primary/20"
            : "bg-[hsl(var(--m3-surface-container,var(--secondary)))]",
        )}
      >
        {/* Set Number */}
        <div className="text-center">
          <span
            className={cn(
              "text-sm font-bold",
              completed ? "text-primary" : "text-muted-foreground",
            )}
          >
            {setNumber}
          </span>
          <p className="text-[9px] text-muted-foreground leading-none mt-0.5">
            {targetKg > 0 ? `${targetKg}kg` : "—"}
          </p>
        </div>

        {/* Weight Input + Plate Calc trigger */}
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={targetKg > 0 ? targetKg.toString() : "kg"}
            value={actualKg}
            onChange={(e) => handleUpdate("actualKg", e.target.value)}
            className={cn(
              "h-11 text-center text-sm font-semibold rounded-lg border-0 pr-8",
              completed ? "bg-primary/5 text-primary" : "bg-background",
            )}
          />
          {displayWeight > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => setPlateOpen(true)}
              type="button"
            >
              <Calculator className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Reps Input */}
        <Input
          type="number"
          inputMode="numeric"
          placeholder={targetReps.toString()}
          value={actualReps}
          onChange={(e) => handleUpdate("actualReps", e.target.value)}
          className={cn(
            "h-11 text-center text-sm font-semibold rounded-lg border-0",
            completed ? "bg-primary/5 text-primary" : "bg-background",
          )}
        />

        {/* RPE Input */}
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          placeholder={targetRpe ? targetRpe.toString() : "RPE"}
          value={rpe}
          onChange={(e) => handleUpdate("rpe", e.target.value)}
          className={cn(
            "h-11 text-center text-sm font-semibold rounded-lg border-0",
            completed ? "bg-primary/5" : "bg-background",
            rpe && getRpeColor(parseInt(rpe)),
          )}
        />

        {/* Complete Checkbox */}
        <div className="flex justify-center">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => handleComplete(checked as boolean)}
            className={cn(
              "h-7 w-7 rounded-full transition-all duration-200",
              completed &&
                "border-primary bg-primary text-primary-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary",
            )}
          />
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
