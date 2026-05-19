import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloneWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceWeekIndex: number;
  totalWeeks: number;
  onConfirm: (targetWeekIndices: number[]) => void;
  isLoading?: boolean;
}

export function CloneWeekDialog({
  open,
  onOpenChange,
  sourceWeekIndex,
  totalWeeks,
  onConfirm,
  isLoading,
}: CloneWeekDialogProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedWeeks([]);
    }
    onOpenChange(isOpen);
  };

  const toggleWeek = (weekIndex: number) => {
    setSelectedWeeks((prev) =>
      prev.includes(weekIndex) ? prev.filter((w) => w !== weekIndex) : [...prev, weekIndex],
    );
  };

  const handleSelectAll = () => {
    const availableWeeks = Array.from({ length: totalWeeks }, (_, i) => i).filter(
      (i) => i !== sourceWeekIndex,
    );
    setSelectedWeeks(availableWeeks);
  };

  const handleConfirm = () => {
    if (selectedWeeks.length > 0) {
      onConfirm(selectedWeeks);
    }
  };

  // Generate available weeks (exclude source)
  const availableWeeks = Array.from({ length: totalWeeks }, (_, i) => i).filter(
    (i) => i !== sourceWeekIndex,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Clona Settimana {sourceWeekIndex + 1}
          </DialogTitle>
          <DialogDescription>Seleziona le settimane in cui copiare la struttura</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Settimane destinazione</Label>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSelectAll}>
              Seleziona tutte
            </Button>
          </div>

          <ScrollArea className="h-[200px] rounded-md border p-2">
            <div className="grid grid-cols-4 gap-2">
              {availableWeeks.map((weekIndex) => (
                <div
                  key={weekIndex}
                  role="checkbox"
                  aria-checked={selectedWeeks.includes(weekIndex)}
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-md cursor-pointer transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selectedWeeks.includes(weekIndex)
                      ? "bg-primary/10 border-primary text-primary"
                      : "hover:bg-secondary border-transparent",
                  )}
                  onClick={() => toggleWeek(weekIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleWeek(weekIndex);
                    }
                  }}
                >
                  <Checkbox checked={selectedWeeks.includes(weekIndex)} className="sr-only" />
                  <span className="text-sm font-medium">S{weekIndex + 1}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedWeeks.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{selectedWeeks.length}</Badge>
              <span>
                settiman{selectedWeeks.length === 1 ? "a" : "e"} selezionat
                {selectedWeeks.length === 1 ? "a" : "e"}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={selectedWeeks.length === 0 || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clonazione...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clona in {selectedWeeks.length} settiman
                {selectedWeeks.length === 1 ? "a" : "e"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
