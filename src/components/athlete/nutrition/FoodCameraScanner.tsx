import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompression";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FoodCameraScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMealLogged: () => void;
}

type ScanStep = "idle" | "compressing" | "describing" | "analyzing" | "review";

interface AiResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence_score: number;
}

const LABOR_MESSAGES = [
  "Analisi ingredienti...",
  "Stima porzioni...",
  "Calcolo macronutrienti...",
  "Ottimizzazione risultati...",
];

type MealTimeType = "breakfast" | "lunch" | "dinner" | "snack";

export function FoodCameraScanner({
  open,
  onOpenChange,
  onMealLogged,
}: FoodCameraScannerProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ScanStep>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [laborIndex, setLaborIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");
  const [mealTime, setMealTime] = useState<MealTimeType>("lunch");

  const reset = useCallback(() => {
    setStep("idle");
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setLaborIndex(0);
    setEditName("");
    setEditCalories("");
    setEditProtein("");
    setEditCarbs("");
    setEditFat("");
    setMealTime("lunch");
    setDescription("");
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    setStep("compressing");

    try {
      const compressed = await compressImage(file, 1920, 0.8);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setImageBase64(base64);
        setStep("describing");
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Compression error:", err);
      toast.error("Errore nella compressione dell'immagine");
      reset();
    }
  };

  const toggleSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Riconoscimento vocale non supportato dal browser");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + "" + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const analyzeImage = async (base64: string, desc?: string) => {
    setStep("analyzing");
    setLaborIndex(0);

    // Labor illusion - cycle through messages
    const interval = setInterval(() => {
      setLaborIndex((prev) => Math.min(prev + 1, LABOR_MESSAGES.length - 1));
    }, 1500);

    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-meal-photo",
        {
          body: { image_base64: base64, userDescription: desc || undefined },
        },
      );

      clearInterval(interval);

      // Handle 429 rate limit specifically
      if (error) {
        const status =
          (error as any)?.status ?? (error as any)?.context?.status;
        if (status === 429 || data?.code === "DAILY_LIMIT") {
          clearInterval(interval);
          toast.error(
            "Limite giornaliero AI raggiunto. Passa a Pro per scansioni illimitate.",
            {
              duration: 5000,
            },
          );
          reset();
          return;
        }
        throw error;
      }
      if (data?.error) {
        if (data.code === "DAILY_LIMIT") {
          clearInterval(interval);
          toast.error(
            "Limite giornaliero AI raggiunto. Passa a Pro per scansioni illimitate.",
            {
              duration: 5000,
            },
          );
          reset();
          return;
        }
        toast.error(
          data.error === "Non è cibo"
            ? "L'immagine non sembra contenere cibo"
            : data.error,
        );
        reset();
        return;
      }

      const aiResult = data as AiResult;
      setResult(aiResult);
      setEditName(aiResult.name);
      setEditCalories(String(aiResult.calories));
      setEditProtein(String(aiResult.protein));
      setEditCarbs(String(aiResult.carbs));
      setEditFat(String(aiResult.fat));
      setStep("review");
    } catch (err) {
      clearInterval(interval);
      console.error("Analysis error:", err);
      toast.error("Errore nell'analisi. Riprova.");
      reset();
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Devi essere loggato");
      return;
    }

    setIsSaving(true);
    try {
      // Upload photo to storage if available
      let photoUrl: string | null = null;
      if (imageBase64) {
        const blob = await fetch(imageBase64).then((r) => r.blob());
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("food-photos")
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("food-photos")
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      const calories = parseInt(editCalories) || 0;
      const protein = parseInt(editProtein) || 0;
      const carbs = parseInt(editCarbs) || 0;
      const fats = parseInt(editFat) || 0;

      // Insert into meal_logs
      const { error: mealError } = await supabase.from("meal_logs").insert({
        user_id: user.id,
        name: editName || "Pasto",
        meal_time: mealTime,
        calories,
        protein,
        carbs,
        fats,
        photo_url: photoUrl,
        confidence_score: result?.confidence_score ?? null,
        notes: description || null,
      });

      if (mealError) throw mealError;

      // Also insert into nutrition_logs for total tracking
      const { error: nutritionError } = await supabase
        .from("nutrition_logs")
        .insert({
          athlete_id: user.id,
          meal_name: editName || "Pasto (AI)",
          calories,
          protein,
          carbs,
          fats,
        });

      if (nutritionError)
        console.error("nutrition_logs sync error:", nutritionError);

      toast.success("Pasto salvato!");
      onMealLogged();
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Errore nel salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const confidenceLabel = (score: number) => {
    if (score >= 0.8)
      return {
        text: "Alta",
        color: "bg-success/15 text-success border-success/20",
      };
    if (score >= 0.5)
      return {
        text: "Media",
        color: "bg-warning/15 text-warning border-warning/20",
      };
    return {
      text: "Bassa",
      color: "bg-destructive/15 text-destructive border-destructive/20",
    };
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-md flex flex-col overflow-hidden">
          <DrawerHeader className="text-center pb-2 shrink-0">
            <DrawerTitle className="text-lg flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Snap-to-Macro
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 px-4 overflow-y-auto space-y-4 pb-4">
            {/* IDLE STATE */}
            {step === "idle" && (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    Scatta una foto del pasto
                  </p>
                  <p className="text-sm text-muted-foreground">
                    L'AI analizzerà il cibo e stimerà calorie e macronutrienti
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 px-8 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90"
                >
                  Scatta Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* COMPRESSING STATE */}
            {step === "compressing" && (
              <div className="flex flex-col items-center gap-6 py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-primary animate-pulse">
                  Compressione foto...
                </p>
              </div>
            )}

            {/* DESCRIBING STATE - photo taken, add context */}
            {step === "describing" && (
              <div className="flex flex-col items-center gap-4 py-4">
                {imagePreview && (
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/20">
                    <img
                      src={imagePreview}
                      alt="Pasto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="w-full space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Descrivi il piatto (opzionale)
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Es: Pasta al sugo, 120g..."
                      className="bg-secondary/60 border-border min-h-[80px] pr-12 resize-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute bottom-2 right-2 h-8 w-8 rounded-full",
                        isListening &&
                          "bg-destructive/10 text-destructive animate-pulse",
                      )}
                      onClick={toggleSpeechRecognition}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Aggiungi dettagli su ingredienti e quantità per una stima
                    più precisa
                  </p>
                </div>
                <Button
                  onClick={() =>
                    imageBase64 && analyzeImage(imageBase64, description)
                  }
                  className="w-full h-12 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analizza Piatto
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    reset();
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cambia foto
                </Button>
              </div>
            )}

            {/* ANALYZING STATE */}
            {step === "analyzing" && (
              <div className="flex flex-col items-center gap-6 py-8">
                {imagePreview && (
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/20">
                    <img
                      src={imagePreview}
                      alt="Pasto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary animate-pulse">
                    {LABOR_MESSAGES[laborIndex]}
                  </p>
                </div>
              </div>
            )}

            {/* REVIEW STATE */}
            {step === "review" && (
              <div className="space-y-4">
                {/* Photo + Confidence */}
                <div className="flex gap-3 items-start">
                  {imagePreview && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <img
                        src={imagePreview}
                        alt="Pasto"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <p className="text-sm font-medium text-success flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Sembra buono! Ecco i valori stimati:
                    </p>
                    {result && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          confidenceLabel(result.confidence_score).color,
                        )}
                      >
                        Accuratezza:{" "}
                        {confidenceLabel(result.confidence_score).text} (
                        {Math.round(result.confidence_score * 100)}%)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Meal Time Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pasto</Label>
                  <Select
                    value={mealTime}
                    onValueChange={(v) => setMealTime(v as MealTimeType)}
                  >
                    <SelectTrigger className="bg-secondary/60 border-border h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast"> Colazione</SelectItem>
                      <SelectItem value="lunch"> Pranzo</SelectItem>
                      <SelectItem value="dinner"> Cena</SelectItem>
                      <SelectItem value="snack"> Spuntino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Editable Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Nome Pasto
                  </Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-secondary/60 border-border h-11"
                  />
                </div>

                {/* Editable Macros Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Calorie (kcal)
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editCalories}
                      onChange={(e) => setEditCalories(e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Proteine (g)
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editProtein}
                      onChange={(e) => setEditProtein(e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Carboidrati (g)
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editCarbs}
                      onChange={(e) => setEditCarbs(e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Grassi (g)
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={editFat}
                      onChange={(e) => setEditFat(e.target.value)}
                      className="bg-secondary/60 border-border h-11 text-base"
                    />
                  </div>
                </div>

                {/* Retry button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    reset();
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Scatta un'altra foto
                </Button>
              </div>
            )}
          </div>

          {/* Footer - only show in review */}
          {step === "review" && (
            <DrawerFooter className="pt-2 shrink-0 border-t border-border/50">
              <Button
                onClick={handleSave}
                className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva Pasto"
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                >
                  Annulla
                </Button>
              </DrawerClose>
            </DrawerFooter>
          )}

          {/* Footer - idle/analyzing close */}
          {step !== "review" && (
            <DrawerFooter className="pt-2 shrink-0">
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                >
                  Chiudi
                </Button>
              </DrawerClose>
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
