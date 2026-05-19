import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ProgramExercise, ProgramData } from "@/components/coach/WeekGrid";
import { log } from "@/lib/logger";

interface AiProgramWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athleteId: string | null;
  athleteName: string;
  onApply: (programData: ProgramData, rationale: string) => void;
}

interface GeneratedDay {
  day_index: number;
  day_name: string;
  focus: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    load: string;
    rpe: number | null;
    rest_seconds: number;
    notes: string;
  }>;
}

interface GeneratedProgram {
  days: GeneratedDay[];
  rationale: string;
}

const EQUIPMENT_OPTIONS = [
  { value: "full_gym", label: "Palestra completa" },
  { value: "barbell_rack", label: "Bilanciere + Rack" },
  { value: "dumbbells_only", label: "Solo manubri" },
  { value: "home_minimal", label: "Home gym (minimal)" },
  { value: "bodyweight", label: "Corpo libero" },
];

const LOADING_MESSAGES = [
  "Analisi struttura fisica...",
  "Calcolo volume ottimale...",
  "Bilanciamento recupero...",
  "Selezione esercizi...",
  "Ottimizzazione progressione...",
  "Finalizzazione programma...",
];

const DAYS_FULL = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export function AiProgramWizard({
  open,
  onOpenChange,
  athleteId,
  athleteName,
  onApply,
}: AiProgramWizardProps) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"new" | "continue">("new");
  const [focusGoal, setFocusGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState("full_gym");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [generatedProgram, setGeneratedProgram] = useState<GeneratedProgram | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(0);
      setMode("new");
      setFocusGoal("");
      setDaysPerWeek(4);
      setEquipment("full_gym");
      setGeneratedProgram(null);
      setError(null);
      setIsGenerating(false);
      setLoadingMsgIndex(0);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!athleteId) {
      toast.error("Seleziona un atleta prima di generare");
      return;
    }
    setStep(1);
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-program", {
        body: {
          athlete_id: athleteId,
          focus_goal: focusGoal,
          days_per_week: daysPerWeek,
          equipment: EQUIPMENT_OPTIONS.find((e) => e.value === equipment)?.label || equipment,
          mode,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setGeneratedProgram(data as GeneratedProgram);
      setStep(2);
    } catch (err) {
      log.error("Generate error:", err);
      setError(err instanceof Error ? err.message : "Errore durante la generazione");
      setStep(0);
      toast.error("Errore generazione", {
        description: err instanceof Error ? err.message : "Riprova più tardi",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedProgram) return;

    // Convert generated program to ProgramData format
    const programData: ProgramData = { 0: {} };
    for (let d = 0; d < 7; d++) {
      programData[0][d] = [];
    }

    generatedProgram.days.forEach((day) => {
      const dayIndex = Math.min(Math.max(day.day_index, 0), 6);
      programData[0][dayIndex] = day.exercises.map((ex) => ({
        id: crypto.randomUUID(),
        exerciseId: "",
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        load: ex.load,
        rpe: ex.rpe,
        restSeconds: ex.rest_seconds,
        notes: ex.notes,
        isEmpty: false,
      }));
    });

    onApply(programData, generatedProgram.rationale);
    onOpenChange(false);
    toast.success("Programma AI applicato!", {
      description: `${generatedProgram.days.length} giorni di allenamento caricati nel builder.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Program Designer
          </DialogTitle>
          <DialogDescription>
            {step === 0 && `Genera un programma personalizzato per ${athleteName}`}
            {step === 1 && "Generazione in corso..."}
            {step === 2 && "Programma generato — rivedi e applica"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-1">
          {["Configurazione", "Generazione", "Revisione"].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  step === i
                    ? "bg-primary text-primary-foreground"
                    : step > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  step === i ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 max-h-[55vh] pr-2">
          <AnimatePresence mode="wait">
            {/* STEP 0: Configuration */}
            {step === 0 && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 py-2"
              >
                {/* Mode */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo di Programma</Label>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as "new" | "continue")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="mode-new"
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                        mode === "new"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <RadioGroupItem value="new" id="mode-new" className="sr-only" />
                      <Sparkles
                        className={cn(
                          "h-6 w-6",
                          mode === "new" ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-medium">Nuova Scheda</span>
                      <span className="text-2xs text-muted-foreground text-center">
                        Partenza da zero, assessment iniziale
                      </span>
                    </Label>
                    <Label
                      htmlFor="mode-continue"
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                        mode === "continue"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <RadioGroupItem value="continue" id="mode-continue" className="sr-only" />
                      <Dumbbell
                        className={cn(
                          "h-6 w-6",
                          mode === "continue" ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-medium">Progressione</span>
                      <span className="text-2xs text-muted-foreground text-center">
                        Basata sui log delle ultime 4 settimane
                      </span>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Focus Goal */}
                <div className="space-y-2">
                  <Label htmlFor="focus-goal" className="text-sm font-medium">
                    Obiettivo del Blocco
                  </Label>
                  <Textarea
                    id="focus-goal"
                    placeholder="Es: Migliorare profondità squat, ipertrofia upper body, aumentare 1RM panca..."
                    value={focusGoal}
                    onChange={(e) => setFocusGoal(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                {/* Days per week */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Frequenza Settimanale</Label>
                    <Badge variant="secondary" className="tabular-nums">
                      {daysPerWeek} giorni
                    </Badge>
                  </div>
                  <Slider
                    value={[daysPerWeek]}
                    onValueChange={([v]) => setDaysPerWeek(v)}
                    min={2}
                    max={6}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-3xs text-muted-foreground px-1">
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Equipment Disponibile</Label>
                  <Select value={equipment} onValueChange={setEquipment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Loading */}
            {step === 1 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-6"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                  </div>
                  <div className="absolute -inset-4 rounded-full border-2 border-violet-500/10 animate-pulse" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMsgIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-muted-foreground font-medium"
                  >
                    {LOADING_MESSAGES[loadingMsgIndex]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 2: Review */}
            {step === 2 && generatedProgram && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-2"
              >
                {/* Rationale */}
                <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">
                    Razionale del Programma
                  </p>
                  <p className="text-sm text-foreground/80">{generatedProgram.rationale}</p>
                </div>

                {/* Days preview */}
                {generatedProgram.days.map((day) => (
                  <div
                    key={day.day_index}
                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-3xs">
                          {DAYS_FULL[day.day_index] || day.day_name}
                        </Badge>
                        <span className="text-sm font-medium">{day.focus}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {day.exercises.length} esercizi
                      </span>
                    </div>
                    <div className="space-y-1">
                      {day.exercises.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs py-1 border-t border-border/30 first:border-0"
                        >
                          <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                          <span className="font-medium flex-1 truncate">{ex.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {ex.sets}×{ex.reps}
                          </span>
                          {ex.load && (
                            <Badge variant="secondary" className="text-3xs h-5">
                              {ex.load}
                            </Badge>
                          )}
                          {ex.rpe && (
                            <Badge variant="outline" className="text-3xs h-5">
                              RPE {ex.rpe}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2">
          {step === 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!focusGoal.trim() || !athleteId}
                className="gap-1.5"
              >
                Genera Programma
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Modifica
              </Button>
              <Button onClick={handleApply} className="gap-1.5 gradient-primary">
                <Check className="h-4 w-4" />
                Applica al Calendario
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
