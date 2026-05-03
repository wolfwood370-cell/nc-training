import { ArrowLeft, MoreVertical, Play, Edit3, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FormAnalysisProps {
  videoThumbnail: string;
  exerciseName?: string;
  loggedAt?: string;
  coachName?: string;
  coachRole?: string;
  coachAvatar?: string;
  notes?: string;
  hasTelestration?: boolean;
  onBack?: () => void;
  onMore?: () => void;
  onPlay?: () => void;
  onAcknowledge?: () => void;
}

export default function FormAnalysis({
  videoThumbnail,
  exerciseName = "Barbell Back Squat - Set 2",
  loggedAt = "Logged yesterday at 18:30",
  coachName = "Coach Lumina's Notes",
  coachRole = "Aura Strength Coach",
  coachAvatar,
  notes = "Great depth on this set! However, notice how your hips shoot up slightly faster than your chest on rep 3. Focus on pushing your upper back into the bar out of the hole.",
  hasTelestration = true,
  onBack,
  onMore,
  onPlay,
  onAcknowledge,
}: FormAnalysisProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-primary">
            Form Analysis
          </h1>
          <button
            onClick={onMore}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-32 space-y-6">
        {/* Video player */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-muted shadow-sm">
          <img
            src={videoThumbnail}
            alt={exerciseName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="Play video"
          >
            <span className="h-16 w-16 rounded-full bg-background/40 backdrop-blur-md flex items-center justify-center group-hover:bg-background/60 transition-colors">
              <Play className="h-7 w-7 text-white fill-white ml-1" />
            </span>
          </button>
          {hasTelestration && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-md">
              <Edit3 className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold whitespace-nowrap">
                Coach Telestration Added
              </span>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div className="space-y-1.5">
          <h2 className="font-[Manrope] font-bold text-2xl text-foreground leading-tight">
            {exerciseName}
          </h2>
          <div className="flex items-center gap-1.5 text-sm text-primary/80">
            <Clock className="h-4 w-4" />
            <span>{loggedAt}</span>
          </div>
        </div>

        {/* Coach Notes card */}
        <section className="relative bg-card rounded-2xl p-5 shadow-sm border-l-4 border-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0 ring-2 ring-background shadow-sm">
              {coachAvatar ? (
                <img src={coachAvatar} alt={coachName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-[Manrope] font-bold text-base text-foreground leading-tight">
                {coachName}
              </h3>
              <p className="text-xs font-semibold text-primary mt-0.5">
                {coachRole}
              </p>
            </div>
          </div>
          <blockquote className="text-[15px] leading-relaxed text-foreground/90 italic">
            "{notes}"
          </blockquote>
        </section>
      </main>

      {/* Sticky CTA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4">
        <Button
          onClick={onAcknowledge}
          size="lg"
          className="w-full h-12 rounded-full font-[Manrope] font-semibold text-base"
        >
          Acknowledge &amp; Reply
          <Send className="h-4 w-4 ml-2" />
        </Button>
      </footer>
    </div>
  );
}
