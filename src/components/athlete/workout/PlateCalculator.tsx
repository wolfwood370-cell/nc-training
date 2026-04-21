import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog";
import { cn } from"@/lib/utils";

interface PlateCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weightKg: number;
  barWeightKg?: number;
}

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  25:"bg-red-500 text-white",
  20:"bg-blue-500 text-white",
  15:"bg-yellow-400 text-black",
  10:"bg-green-500 text-white",
  5:"bg-white text-black border border-border",
  2.5:"bg-red-300 text-white",
  1.25:"bg-zinc-400 text-white",
};

function calculatePlates(totalWeight: number, barWeight: number): { plate: number; count: number }[] {
  let remaining = (totalWeight - barWeight) / 2; // per side
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

export function PlateCalculator({
  open,
  onOpenChange,
  weightKg,
  barWeightKg = 20,
}: PlateCalculatorProps) {
  const belowBar = weightKg < barWeightKg;
  const plates = belowBar ? [] : calculatePlates(weightKg, barWeightKg);
  const perSide = belowBar ? 0 : (weightKg - barWeightKg) / 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">
             {weightKg}kg
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {belowBar ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Il peso è inferiore al bilanciere ({barWeightKg}kg)
              </p>
            </div>
          ) : (
            <>
              {/* Bar info */}
              <div className="text-center text-sm text-muted-foreground">
                Bilanciere {barWeightKg}kg + {perSide > 0 ?`${perSide}kg per lato`:"nessun disco"}
              </div>

              {/* Visual plate stack */}
              {plates.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-3 bg-zinc-300 dark:bg-zinc-600 rounded-full"/>
                  <div className="flex flex-wrap justify-center gap-2">
                    {plates.map(({ plate, count }) => (
                      <div key={plate} className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                            PLATE_COLORS[plate] ||"bg-muted text-foreground"                          )}
                        >
                          {plate}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">×{count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Per ogni lato del bilanciere
                  </p>
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm">Solo bilanciere</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
