import { useRef, useState } from "react";
import { X, HelpCircle, Minus, Plus, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface WeeklyCheckInProps {
  initialBodyweight?: number;
  step?: number;
  unit?: string;
  onClose?: () => void;
  onHelp?: () => void;
  onSubmit?: (data: {
    bodyweight: number;
    frontPhoto?: File;
    backPhoto?: File;
    notes: string;
  }) => void;
}

export default function WeeklyCheckIn({
  initialBodyweight = 75.5,
  step = 0.1,
  unit = "kg",
  onClose,
  onHelp,
  onSubmit,
}: WeeklyCheckInProps) {
  const [bodyweight, setBodyweight] = useState(initialBodyweight);
  const [notes, setNotes] = useState("");
  const [frontPhoto, setFrontPhoto] = useState<File | undefined>();
  const [backPhoto, setBackPhoto] = useState<File | undefined>();

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const adjust = (delta: number) =>
    setBodyweight((w) => Math.max(0, +(w + delta).toFixed(1)));

  const PhotoSlot = ({
    label,
    file,
    onClick,
  }: {
    label: string;
    file?: File;
    onClick: () => void;
  }) => {
    const previewUrl = file ? URL.createObjectURL(file) : null;
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2 overflow-hidden"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <Camera className="h-7 w-7 text-foreground/70" />
            <span className="text-sm text-foreground/80">{label}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-primary">
            Weekly Check-in
          </h1>
          <button
            onClick={onHelp}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5 text-primary" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <h2 className="font-[Manrope] font-bold text-3xl text-foreground leading-tight">
            Weekly Check-in
          </h2>
          <p className="text-sm text-foreground/70">
            Let's review your progress from the past 7 days.
          </p>
        </div>

        {/* Bodyweight card */}
        <section className="bg-card rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">
            Bodyweight
          </h3>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => adjust(-step)}
              className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              aria-label="Decrease weight"
            >
              <Minus className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="font-[Manrope] font-bold text-4xl text-foreground tabular-nums">
                {bodyweight.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            <button
              type="button"
              onClick={() => adjust(step)}
              className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              aria-label="Increase weight"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </section>

        {/* Physique Update */}
        <section className="bg-card rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">
            Physique Update
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PhotoSlot
              label="Front"
              file={frontPhoto}
              onClick={() => frontInputRef.current?.click()}
            />
            <PhotoSlot
              label="Back"
              file={backPhoto}
              onClick={() => backInputRef.current?.click()}
            />
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFrontPhoto(e.target.files?.[0])}
            />
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setBackPhoto(e.target.files?.[0])}
            />
          </div>
        </section>

        {/* Notes */}
        <section className="bg-card rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="font-[Manrope] font-bold text-xl text-foreground">
            How did this week feel?
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any struggles with hunger, fatigue, or the training volume?..."
            className="min-h-[110px] bg-primary/5 border-0 rounded-xl resize-none text-sm placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </section>
      </main>

      {/* Sticky CTA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4">
        <Button
          onClick={() =>
            onSubmit?.({ bodyweight, frontPhoto, backPhoto, notes })
          }
          size="lg"
          className="w-full h-12 rounded-full font-[Manrope] font-semibold text-base"
        >
          Submit to Coach
          <Send className="h-4 w-4 ml-2" />
        </Button>
      </footer>
    </div>
  );
}
