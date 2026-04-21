import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Droplets, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface CycleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    lastPeriodStart: string;
    cycleLength: number;
    contraceptiveType?: string;
  }) => Promise<void>;
  isSaving: boolean;
  defaultValues?: {
    lastPeriodStart?: string;
    cycleLength?: number;
    contraceptiveType?: string;
  };
}

export function CycleConfigDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  defaultValues,
}: CycleConfigDialogProps) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValues?.lastPeriodStart
      ? new Date(defaultValues.lastPeriodStart)
      : undefined,
  );
  const [cycleLength, setCycleLength] = useState(
    defaultValues?.cycleLength?.toString() || "28",
  );
  const [contraceptive, setContraceptive] = useState(
    defaultValues?.contraceptiveType || "none",
  );

  const handleSubmit = async () => {
    if (!date) {
      toast({
        title: "Seleziona la data di inizio dell'ultimo ciclo",
        variant: "destructive",
      });
      return;
    }
    const len = parseInt(cycleLength);
    if (isNaN(len) || len < 20 || len > 45) {
      toast({
        title: "La durata del ciclo deve essere tra 20 e 45 giorni",
        variant: "destructive",
      });
      return;
    }
    try {
      await onSave({
        lastPeriodStart: format(date, "yyyy-MM-dd"),
        cycleLength: len,
        contraceptiveType: contraceptive,
      });
      toast({ title: "Impostazioni ciclo salvate" });
      onOpenChange(false);
    } catch {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Configurazione Ciclo
          </DialogTitle>
          <DialogDescription>
            Configura il tuo ciclo mestruale per sbloccare gli aggiustamenti di
            allenamento basati sulla fase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Last Period Start */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Data Inizio Ultimo Ciclo
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Seleziona data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cycle Length */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Durata Media del Ciclo (giorni)
            </Label>
            <Input
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              min={20}
              max={45}
              className="tabular-nums"
            />
            <p className="text-xs text-muted-foreground">
              Intervallo tipico: 24–35 giorni
            </p>
          </div>

          {/* Contraceptive Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Tipo di Contraccettivo
            </Label>
            <Select value={contraceptive} onValueChange={setContraceptive}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuno</SelectItem>
                <SelectItem value="pill">Pillola Ormonale</SelectItem>
                <SelectItem value="iud_hormonal">IUD (Ormonale)</SelectItem>
                <SelectItem value="iud_copper">IUD (Rame)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
            {isSaving ? "Salvataggio..." : "Attiva Sincronizzazione Ciclo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
