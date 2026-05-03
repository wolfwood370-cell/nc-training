import { ArrowLeft, Clock, Zap, Repeat, ClipboardList, Play } from "lucide-react";

export interface ProtocolStep {
  id: string;
  icon?: "bolt" | "repeat";
  title: string;
  description: string;
  indented?: boolean;
}

interface IntensityProtocolPreviewProps {
  sessionTitle: string; // "Leg Day B"
  phaseLabel: string; // "Hypertrophy Phase"
  durationMin: number; // 65
  exerciseLabel: string; // "C1. Seated Leg Curl"
  exerciseSubtitle: string; // "Isolamento • 1 Serie Totale (Protocollo esteso)"
  techniqueName: string; // "Rest-Pause"
  techniqueLabel?: string; // "Tecnica di Intensità"
  imageUrl?: string;
  steps: ProtocolStep[];
  coachNote?: string;
  targetVolume: { value: string | number; unit?: string };
  intensity: { value: string | number; unit?: string };
  athleteAvatarUrl?: string;
  onBack?: () => void;
  onStart?: () => void;
}

const StepIcon = ({ icon }: { icon?: ProtocolStep["icon"] }) => {
  const Icon = icon === "repeat" ? Repeat : Zap;
  return (
    <div className="mt-0.5 w-6 h-6 rounded-full bg-card border border-primary/20 flex items-center justify-center shadow-sm shrink-0">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
  );
};

export function IntensityProtocolPreview({
  sessionTitle,
  phaseLabel,
  durationMin,
  exerciseLabel,
  exerciseSubtitle,
  techniqueName,
  techniqueLabel = "Tecnica di Intensità",
  imageUrl,
  steps,
  coachNote,
  targetVolume,
  intensity,
  athleteAvatarUrl,
  onBack,
  onStart,
}: IntensityProtocolPreviewProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-card/70 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-manrope font-semibold tracking-tight text-lg">
            Training Overview
          </span>
        </div>
        {athleteAvatarUrl && (
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-card shadow-sm">
            <img src={athleteAvatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </header>

      <main className="pt-24 pb-32 px-6 max-w-md mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-manrope font-extrabold text-4xl text-foreground mb-3 tracking-tight">
            {sessionTitle}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-[10px] uppercase tracking-wider">
              {phaseLabel}
            </span>
            <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {durationMin} Min
            </span>
          </div>
        </div>

        {/* Protocol Card */}
        <section className="mb-8">
          <div className="bg-card rounded-2xl shadow-[0_10px_40px_hsl(var(--primary)/0.08)] border border-border overflow-hidden">
            {imageUrl && (
              <div className="h-48 w-full relative">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>
            )}

            <div className={`p-6 ${imageUrl ? "-mt-8" : ""} relative z-10`}>
              <div className="flex justify-between items-center mb-5">
                <span className="text-foreground font-bold text-[10px] uppercase tracking-[0.15em]">
                  {techniqueLabel}
                </span>
                <span className="bg-primary text-primary-foreground font-semibold text-xs px-4 py-1 rounded-full shadow-sm">
                  {techniqueName}
                </span>
              </div>

              <div className="mb-6">
                <h2 className="font-manrope text-2xl font-bold text-foreground leading-tight mb-1">
                  {exerciseLabel}
                </h2>
                <p className="text-muted-foreground text-sm">{exerciseSubtitle}</p>
              </div>

              {/* Protocol breakdown */}
              <div className="bg-muted/50 rounded-2xl p-5 border border-border space-y-6">
                {steps.map((step) => (
                  <div key={step.id} className={step.indented ? "pl-8 relative" : "relative"}>
                    {step.indented && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 w-4 h-5 border-l border-b border-border rounded-bl-md"
                      />
                    )}
                    <div className="flex items-start gap-3">
                      <StepIcon icon={step.icon} />
                      <div>
                        <h4 className="font-manrope font-bold text-foreground text-sm">
                          {step.title}
                        </h4>
                        <p className="text-muted-foreground text-xs leading-relaxed mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {coachNote && (
              <div className="bg-primary/5 border-t border-primary/10 p-5 flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                  {coachNote}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
              Target Volume
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-manrope text-3xl font-bold text-foreground">
                {targetVolume.value}
              </span>
              <span className="text-muted-foreground text-xs uppercase">
                {targetVolume.unit ?? "Reps"}
              </span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
              Intensity
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-manrope text-3xl font-bold text-foreground">
                {intensity.value}
              </span>
              <span className="text-muted-foreground text-xs uppercase">
                {intensity.unit ?? "RPE"}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            type="button"
            onClick={onStart}
            className="w-full bg-primary text-primary-foreground font-manrope font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            START SESSION
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IntensityProtocolPreview;
