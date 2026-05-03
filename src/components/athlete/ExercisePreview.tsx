import { ArrowLeft, MoreVertical, Play, Mic, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PreviewSet {
  set: number;
  target: string;
  previous: string;
}

export interface ExercisePreviewProps {
  exerciseLabel?: string;
  exerciseName: string;
  videoThumbnailUrl?: string;
  coachNotes?: string;
  sets: PreviewSet[];
  onBack?: () => void;
  onMore?: () => void;
  onPlayVideo?: () => void;
  onStart?: () => void;
  onClose?: () => void;
}

export const ExercisePreview = ({
  exerciseLabel = "A1.",
  exerciseName,
  videoThumbnailUrl,
  coachNotes,
  sets,
  onBack,
  onMore,
  onPlayVideo,
  onStart,
  onClose,
}: ExercisePreviewProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2 text-primary" aria-label="Back">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-[Manrope] font-bold text-primary text-lg">Exercise Preview</h1>
        <button onClick={onMore} className="p-2 -mr-2 text-primary" aria-label="More">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-5 pb-32">
        {/* Video */}
        <button
          onClick={onPlayVideo}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted group"
        >
          {videoThumbnailUrl ? (
            <img src={videoThumbnailUrl} alt={exerciseName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-background/95 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
          </div>
        </button>

        {/* Title */}
        <h2 className="font-[Manrope] font-bold text-2xl text-foreground">
          {exerciseLabel} {exerciseName}
        </h2>

        {/* Coach Notes */}
        {coachNotes && (
          <div className="relative bg-primary/5 rounded-2xl p-4 pl-5 border-l-4 border-primary flex gap-3">
            <Mic className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-primary mb-1">
                Coach's Notes
              </p>
              <p className="text-sm text-foreground leading-relaxed">{coachNotes}</p>
            </div>
          </div>
        )}

        {/* Lock banner */}
        <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3 border border-border">
          <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Preview Mode. Start the workout to log your sets.
          </p>
        </div>

        {/* Sets table */}
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 px-2 pb-2 border-b border-border">
            {["SET", "TARGET", "PREVIOUS", "KG", "REPS"].map((h) => (
              <div
                key={h}
                className="font-[Manrope] font-semibold text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>

          {sets.map((s) => (
            <div
              key={s.set}
              className="grid grid-cols-5 gap-2 items-center px-2 py-3 rounded-xl bg-muted/30"
            >
              <div className="text-sm font-semibold text-foreground">{s.set}</div>
              <div className="text-sm text-muted-foreground">{s.target}</div>
              <div className="text-sm text-muted-foreground">{s.previous}</div>
              <div className="h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                -
              </div>
              <div className="h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                -
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 space-y-2">
        <Button
          onClick={onStart}
          className="w-full h-12 rounded-full font-[Manrope] font-bold tracking-wide gap-2"
          size="lg"
        >
          <PlayCircle className="w-5 h-5" />
          START WORKOUT NOW
        </Button>
        <button
          onClick={onClose}
          className="w-full text-center text-sm font-[Manrope] font-semibold text-primary tracking-wide py-2"
        >
          CLOSE PREVIEW
        </button>
      </footer>
    </div>
  );
};

export default ExercisePreview;
