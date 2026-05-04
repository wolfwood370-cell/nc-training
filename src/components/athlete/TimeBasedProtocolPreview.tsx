import { ArrowLeft, MoreVertical, Play, Clock } from "lucide-react";

export interface TimeProtocolStep {
  id: string;
  minuteLabel: string;
  title: string;
  description: string;
}

interface TimeBasedProtocolPreviewProps {
  blockLabel?: string;
  protocolTitle: string;
  protocolTypeLabel: string;
  protocolDurationLabel: string;
  description: string;
  steps: TimeProtocolStep[];
  topBarTitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  onStart?: () => void;
}

export function TimeBasedProtocolPreview({
  blockLabel = "BLOCCO DI CONDIZIONAMENTO",
  protocolTitle,
  protocolTypeLabel,
  protocolDurationLabel,
  description,
  steps,
  topBarTitle = "Training Overview",
  onBack,
  onMenu,
  onStart,
}: TimeBasedProtocolPreviewProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-[Inter] flex flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-16 bg-background/95 backdrop-blur border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="font-[Manrope] font-bold text-xl text-primary tracking-tight">
          {topBarTitle}
        </h1>

        <button
          type="button"
          onClick={onMenu}
          className="p-2 -mr-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
          aria-label="Menu"
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-5 py-5 pb-32">
        <div className="max-w-md mx-auto">
          <section className="bg-card rounded-[2rem] border border-border shadow-[0_10px_40px_hsl(var(--primary)/0.08)] p-6 overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-[Manrope] font-bold text-xs uppercase tracking-[0.18em] text-foreground mb-3">
                  {blockLabel}
                </p>
                <h2 className="font-[Manrope] font-bold text-4xl leading-[1.05] tracking-tight text-foreground max-w-[8ch]">
                  {protocolTitle}
                </h2>
              </div>

              <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/20">
                <Clock className="w-4 h-4" />
                <div className="font-[Manrope] font-bold text-sm leading-tight">
                  <div>{protocolTypeLabel}</div>
                  <div>{protocolDurationLabel}</div>
                </div>
              </div>
            </div>

            <p className="text-[15px] leading-8 text-foreground/80 mb-8 max-w-[28ch]">{description}</p>

            <div className="bg-primary/10 rounded-[2rem] p-5 md:p-6 space-y-6">
              {steps.map((step, index) => (
                <div key={step.id}>
                  <div className="inline-flex items-center rounded-full bg-card px-5 py-3 shadow-sm border border-border mb-5">
                    <span className="font-[Manrope] font-bold text-sm text-foreground tracking-tight">
                      {step.minuteLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-[Manrope] font-semibold text-[1.95rem] leading-[1.08] tracking-tight text-foreground max-w-[12ch]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-8 text-foreground/75 max-w-[24ch]">
                      {step.description}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="mt-7 border-t border-dashed border-border" />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 px-5 pb-8 pt-10 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={onStart}
            className="w-full h-16 rounded-full bg-primary text-primary-foreground font-[Manrope] font-medium text-2xl shadow-[0_8px_30px_hsl(var(--primary)/0.28)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span>Start Session</span>
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default TimeBasedProtocolPreview;
