import { useMemo, useCallback } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dumbbell,
  X,
  Calculator,
  Clock,
  Target,
  Hash,
  FileText,
  Zap,
  Timer,
  Settings2,
  ChevronDown,
  TrendingUp,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgramExercise } from "@/stores/useProgramBuilderStore";
import type { ProgressionRule, ProgressionType, ExerciseProgression } from "@/types/progression";
import {
  getProgressionTypeLabel,
  getDefaultProgressionValue,
  getProgressionDescription,
} from "@/types/progression";
import { useProgramBuilderStore } from "@/stores/useProgramBuilderStore";
import { useShallow } from "zustand/shallow";
import { useState } from "react";

const REST_OPTIONS = [30, 45, 60, 90, 120, 180, 240, 300];
const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

// Available tracking fields that can be added
const ALL_TRACKING_FIELDS = [
  { value: "sets", label: "Serie" },
  { value: "reps", label: "Ripetizioni" },
  { value: "weight", label: "Peso (kg)" },
  { value: "rpe", label: "RPE" },
  { value: "rest", label: "Recupero" },
  { value: "tempo", label: "Tempo" },
  { value: "rir", label: "RIR" },
  { value: "distance", label: "Distanza" },
  { value: "time", label: "Tempo (durata)" },
  { value: "calories", label: "Calorie" },
];

interface ExerciseContextEditorProps {
  exercise: ProgramExercise;
  dayIndex: number;
  weekIndex: number;
  oneRM: number;
  onClose: () => void;
  className?: string;
}

export function ExerciseContextEditor({
  exercise,
  dayIndex,
  weekIndex,
  oneRM,
  onClose,
  className,
}: ExerciseContextEditorProps) {
  // UI-only state (not program data)
  const [trackingFieldsOpen, setTrackingFieldsOpen] = useState(false);

  // Get the store update action directly
  const updateExercise = useProgramBuilderStore((state) => state.updateExercise);

  // Memoized handler to update a single field directly in the store
  const handleChange = useCallback(
    <K extends keyof ProgramExercise>(key: K, value: ProgramExercise[K]) => {
      updateExercise(dayIndex, exercise.id, { [key]: value }, weekIndex);
    },
    [updateExercise, dayIndex, weekIndex, exercise.id],
  );

  // Toggle tracking field
  const handleToggleTrackingField = useCallback(
    (field: string) => {
      const currentFields = exercise.snapshotTrackingFields || [];
      const newFields = currentFields.includes(field)
        ? currentFields.filter((f) => f !== field)
        : [...currentFields, field];
      handleChange("snapshotTrackingFields", newFields);
    },
    [exercise.snapshotTrackingFields, handleChange],
  );

  // Calculate kg from percentage
  const calculatedKg = useMemo(() => {
    const match = exercise.load.match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (match && oneRM > 0) {
      const percent = parseFloat(match[1]);
      const kg = Math.round(oneRM * (percent / 100));
      return `${kg} kg`;
    }
    return null;
  }, [exercise.load, oneRM]);

  // Format rest time
  const formatRest = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins} min`;
    }
    return `${seconds}s`;
  };

  const activeTrackingFields = exercise.snapshotTrackingFields || [];

  return (
    <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{exercise.name}</h3>
                <p className="text-3xs text-muted-foreground">{DAYS[dayIndex]}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Snapshot Muscles Badge */}
        {exercise.snapshotMuscles && exercise.snapshotMuscles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {exercise.snapshotMuscles.slice(0, 3).map((muscle) => (
              <Badge key={muscle} variant="secondary" className="text-4xs h-4 px-1.5">
                {muscle}
              </Badge>
            ))}
            {exercise.snapshotMuscles.length > 3 && (
              <Badge variant="outline" className="text-4xs h-4 px-1.5">
                +{exercise.snapshotMuscles.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Volume Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" />
              Volume
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sets */}
              <div className="space-y-1.5">
                <Label htmlFor="sets" className="text-xs flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  Serie
                </Label>
                <Input
                  id="sets"
                  type="number"
                  min={1}
                  max={20}
                  value={exercise.sets || ""}
                  onChange={(e) => handleChange("sets", parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>

              {/* Reps */}
              <div className="space-y-1.5">
                <Label htmlFor="reps" className="text-xs flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  Ripetizioni
                </Label>
                <Input
                  id="reps"
                  type="text"
                  value={exercise.reps}
                  onChange={(e) => handleChange("reps", e.target.value)}
                  placeholder="8-10"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Intensity Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calculator className="h-3.5 w-3.5" />
              Intensità
            </div>

            {/* Load */}
            <div className="space-y-1.5">
              <Label htmlFor="load" className="text-xs">
                Carico
              </Label>
              <div className="relative">
                <Input
                  id="load"
                  type="text"
                  value={exercise.load}
                  onChange={(e) => handleChange("load", e.target.value)}
                  placeholder="80% o 100kg"
                  className="h-9 pr-20"
                />
                {calculatedKg && (
                  <Badge
                    variant="secondary"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-3xs h-5"
                  >
                    ≈ {calculatedKg}
                  </Badge>
                )}
              </div>
              <p className="text-3xs text-muted-foreground">
                Puoi usare % (basato su 1RM: {oneRM}kg) o kg diretti
              </p>
            </div>

            {/* RPE */}
            <div className="space-y-1.5">
              <Label htmlFor="rpe" className="text-xs">
                RPE (Rate of Perceived Exertion)
              </Label>
              <Select
                value={exercise.rpe?.toString() || "none"}
                onValueChange={(val) =>
                  handleChange("rpe", val === "none" ? null : parseFloat(val))
                }
              >
                <SelectTrigger id="rpe" className="h-9">
                  <SelectValue placeholder="Seleziona RPE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuno</SelectItem>
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
                    <SelectItem key={rpe} value={rpe.toString()}>
                      RPE {rpe}{" "}
                      {rpe >= 9.5
                        ? "- Massimale"
                        : rpe >= 8.5
                          ? "- Molto duro"
                          : rpe >= 7
                            ? "- Moderato"
                            : "- Leggero"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Timing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Timer className="h-3.5 w-3.5" />
              Tempo
            </div>

            {/* Rest */}
            <div className="space-y-1.5">
              <Label htmlFor="rest" className="text-xs flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Recupero
              </Label>
              <Select
                value={exercise.restSeconds.toString()}
                onValueChange={(val) => handleChange("restSeconds", parseInt(val))}
              >
                <SelectTrigger id="rest" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REST_OPTIONS.map((sec) => (
                    <SelectItem key={sec} value={sec.toString()}>
                      {formatRest(sec)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              Note
            </div>

            <Textarea
              value={exercise.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Istruzioni speciali, cue tecniche, variazioni..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>

          <Separator />

          {/* Progression Logic Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <TrendingUp className="h-3.5 w-3.5" />
                Progressione
              </div>
              <Switch
                checked={exercise.progression?.enabled || false}
                onCheckedChange={(checked) => {
                  const currentProgression = exercise.progression || { enabled: false, rules: [] };
                  handleChange("progression", { ...currentProgression, enabled: checked });
                }}
              />
            </div>

            {exercise.progression?.enabled && (
              <div className="space-y-3 p-3 rounded-lg bg-chart-3/5 border border-chart-3/20">
                <p className="text-3xs text-muted-foreground">
                  Definisci le regole di progressione automatica per le settimane successive
                </p>

                {/* Existing Rules */}
                {(exercise.progression?.rules || []).map((rule, ruleIndex) => (
                  <div
                    key={ruleIndex}
                    className="flex items-center gap-2 p-2 rounded-md bg-background border"
                  >
                    <Select
                      value={rule.type}
                      onValueChange={(type: ProgressionType) => {
                        const newRules = [...(exercise.progression?.rules || [])];
                        newRules[ruleIndex] = {
                          ...rule,
                          type,
                          value: getDefaultProgressionValue(type),
                        };
                        handleChange("progression", { ...exercise.progression!, rules: newRules });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rir_decrease">Diminuisci RIR</SelectItem>
                        <SelectItem value="rpe_increase">Aumenta RPE</SelectItem>
                        <SelectItem value="load_percent">Aumenta Carico (%)</SelectItem>
                        <SelectItem value="load_absolute">Aumenta Carico (kg)</SelectItem>
                        <SelectItem value="reps_increase">Aumenta Ripetizioni</SelectItem>
                        <SelectItem value="sets_increase">Aumenta Serie</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      step={
                        rule.type === "rpe_increase" ? 0.5 : rule.type.includes("percent") ? 0.5 : 1
                      }
                      min={0}
                      value={rule.value}
                      onChange={(e) => {
                        const newRules = [...(exercise.progression?.rules || [])];
                        newRules[ruleIndex] = { ...rule, value: parseFloat(e.target.value) || 0 };
                        handleChange("progression", { ...exercise.progression!, rules: newRules });
                      }}
                      className="h-8 w-20 text-xs"
                    />

                    <Badge variant="secondary" className="text-4xs flex-shrink-0">
                      {getProgressionDescription(rule)}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => {
                        const newRules = (exercise.progression?.rules || []).filter(
                          (_, i) => i !== ruleIndex,
                        );
                        handleChange("progression", { ...exercise.progression!, rules: newRules });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* Add Rule Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed"
                  onClick={() => {
                    const newRule: ProgressionRule = {
                      type: "rir_decrease",
                      value: 1,
                    };
                    const currentRules = exercise.progression?.rules || [];
                    handleChange("progression", {
                      ...exercise.progression!,
                      rules: [...currentRules, newRule],
                    });
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi Regola
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Tracking Fields Configuration - Collapsible */}
          <Collapsible open={trackingFieldsOpen} onOpenChange={setTrackingFieldsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" />
                  Campi Tracciamento ({activeTrackingFields.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    trackingFieldsOpen && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3 space-y-2">
                <p className="text-3xs text-muted-foreground mb-2">
                  Seleziona quali campi l'atleta dovrà compilare durante l'allenamento
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TRACKING_FIELDS.map((field) => (
                    <label
                      key={field.value}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                        activeTrackingFields.includes(field.value)
                          ? "bg-primary/5 border-primary/30"
                          : "bg-background border-border hover:border-primary/20",
                      )}
                    >
                      <Checkbox
                        checked={activeTrackingFields.includes(field.value)}
                        onCheckedChange={() => handleToggleTrackingField(field.value)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
