/**
 * MealScannerDialog — Snap & Log AI food scanner.
 *
 * Mobile-first, one-thumb UX:
 *   1. Athlete taps "Scan Meal" → native camera opens (PWA).
 *   2. Image is base64-encoded and sent to `useAnalyzeMealPhoto`.
 *   3. While analyzing, a futuristic laser-scan animation overlays the photo.
 *   4. AI returns macros → review card with +/- steppers for quick correction.
 *   5. "Confirm & Log" pushes macros into `useMetabolicStore.addIntake`,
 *      fires success haptic + toast, and closes the dialog.
 */

import { useCallback, useRef, useState } from "react";
import { Camera, Check, Loader2, Minus, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAnalyzeMealPhoto, type MealAnalysis } from "@/hooks/useAnalyzeMealPhoto";
import { useMetabolicStore } from "@/stores/useMetabolicStore";
import { triggerHaptic } from "@/utils/ux";

interface MealScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableMacros {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

interface StepperProps {
  label: string;
  unit: string;
  value: number;
  step: number;
  onChange: (next: number) => void;
  accentClass: string;
}

function MacroStepper({ label, unit, value, step, onChange, accentClass }: StepperProps) {
  const dec = () => {
    triggerHaptic("light");
    onChange(Math.max(0, value - step));
  };
  const inc = () => {
    triggerHaptic("light");
    onChange(value + step);
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("h-2 w-2 rounded-full shrink-0", accentClass)} aria-hidden />
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={dec}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <div className="min-w-[64px] text-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={inc}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function MealScannerDialog({ open, onOpenChange }: MealScannerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditableMacros | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);

  const { mutate: analyze, isAnalyzing, reset: resetMutation } = useAnalyzeMealPhoto();
  const addIntake = useMetabolicStore((s) => s.addIntake);

  const resetAll = useCallback(() => {
    setImagePreview(null);
    setEdit(null);
    setAnalysis(null);
    resetMutation();
  }, [resetMutation]);

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) resetAll();
      onOpenChange(next);
    },
    [onOpenChange, resetAll],
  );

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
      setAnalysis(null);
      setEdit(null);

      analyze(
        { imageBase64: dataUrl, mimeType: file.type || "image/jpeg" },
        {
          onSuccess: (data) => {
            setAnalysis(data);
            setEdit({
              mealName: data.mealName,
              calories: Math.max(0, Math.round(data.calories)),
              protein: Math.max(0, Math.round(data.protein)),
              carbs: Math.max(0, Math.round(data.carbs)),
              fats: Math.max(0, Math.round(data.fats)),
            });
            triggerHaptic("light");
          },
          onError: (err) => {
            console.error("Meal analysis failed:", err);
            toast.error(
              err.code === "RATE_LIMITED"
                ? "AI is busy — please try again in a moment."
                : err.code === "UNAUTHORIZED"
                  ? "Please sign in to scan meals."
                  : "Could not recognize the meal. Try a clearer photo.",
            );
          },
        },
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not read the image. Please try another photo.");
    }
  };

  const handleConfirm = () => {
    if (!edit) return;
    addIntake({
      calories: edit.calories,
      protein: edit.protein,
      carbs: edit.carbs,
      fats: edit.fats,
    });
    triggerHaptic("success");
    toast.success(`${edit.mealName || "Meal"} logged · +${edit.calories} kcal`);
    resetAll();
    onOpenChange(false);
  };

  const showReview = !!edit && !isAnalyzing;
  const showScanningOverlay = isAnalyzing && !!imagePreview;
  const confidence = analysis?.confidenceScore ?? 0;
  const confidenceTone =
    confidence >= 0.8
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      : confidence >= 0.5
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-md w-[calc(100vw-1rem)] overflow-hidden gap-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Snap & Log Meal
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Image preview / capture target */}
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-muted aspect-square">
              <img
                src={imagePreview}
                alt="Captured meal"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {showScanningOverlay && (
                <>
                  {/* Pulsing scrim */}
                  <div className="absolute inset-0 bg-violet-500/15 animate-pulse" />
                  {/* Laser line */}
                  <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_20px_rgba(167,139,250,0.9)] animate-scan-line" />
                  {/* Corner brackets for a "scanning frame" feel */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-violet-300 rounded-tl-lg" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-violet-300 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-violet-300 rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-violet-300 rounded-br-lg" />
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    <span className="text-xs font-medium text-white tracking-wide drop-shadow">
                      AI analyzing…
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePickFile}
              className="w-full aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted/70 transition-colors flex flex-col items-center justify-center gap-3 group"
            >
              <div className="h-16 w-16 rounded-full bg-violet-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="h-7 w-7 text-violet-500" />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-semibold text-foreground">Tap to capture</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI estimates calories &amp; macros instantly
                </p>
              </div>
            </button>
          )}

          {/* Hidden native camera input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Review card */}
          {showReview && edit && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    AI estimate
                  </p>
                  <p className="text-base font-semibold text-foreground truncate">
                    {edit.mealName || "Meal"}
                  </p>
                </div>
                {analysis && (
                  <Badge variant="outline" className={cn("shrink-0", confidenceTone)}>
                    {Math.round(confidence * 100)}% sure
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <MacroStepper
                  label="Calories"
                  unit="kcal"
                  value={edit.calories}
                  step={25}
                  onChange={(v) => setEdit({ ...edit, calories: v })}
                  accentClass="bg-rose-500"
                />
                <MacroStepper
                  label="Protein"
                  unit="g"
                  value={edit.protein}
                  step={5}
                  onChange={(v) => setEdit({ ...edit, protein: v })}
                  accentClass="bg-violet-500"
                />
                <MacroStepper
                  label="Carbs"
                  unit="g"
                  value={edit.carbs}
                  step={5}
                  onChange={(v) => setEdit({ ...edit, carbs: v })}
                  accentClass="bg-amber-500"
                />
                <MacroStepper
                  label="Fats"
                  unit="g"
                  value={edit.fats}
                  step={2}
                  onChange={(v) => setEdit({ ...edit, fats: v })}
                  accentClass="bg-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    resetAll();
                    setTimeout(() => fileInputRef.current?.click(), 50);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Retake
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-violet-600 hover:bg-violet-600/90 text-white"
                  onClick={handleConfirm}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Confirm &amp; Log
                </Button>
              </div>
            </div>
          )}

          {/* Idle CTA when no preview yet */}
          {!imagePreview && !isAnalyzing && (
            <Button
              type="button"
              size="lg"
              className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-600/90 text-white font-semibold"
              onClick={handlePickFile}
            >
              <Camera className="h-5 w-5 mr-2" />
              Scan Meal
            </Button>
          )}

          {/* Cancel during analyze */}
          {isAnalyzing && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => handleClose(false)}
            >
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
