import { X, AlertTriangle, Info, Sparkles, ArrowLeftRight, ArrowRight, TrendingDown, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdjustmentItem {
  type: "swap" | "reduce" | "add";
  label: string;
  detail?: string;
}

interface CopilotRiskInterventionProps {
  onClose?: () => void;
  onAccept?: () => void;
  onDismiss?: () => void;
  riskTitle?: string;
  riskDescription?: React.ReactNode;
  riskWarning?: string;
  adjustments?: AdjustmentItem[];
}

const DEFAULT_ADJUSTMENTS: AdjustmentItem[] = [
  { type: "swap", label: "Barbell Back Squats", detail: "Leg Extensions" },
  { type: "reduce", label: "Overall volume reduced by 20%" },
  { type: "add", label: "Added 10 mins of hip mobility work" },
];

function AdjustmentRow({ item }: { item: AdjustmentItem }) {
  const Icon =
    item.type === "swap" ? ArrowLeftRight : item.type === "reduce" ? TrendingDown : PlusCircle;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-background/70 px-4 py-3">
      <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-[15px] leading-snug">
        {item.type === "swap" && item.detail ? (
          <>
            <p className="text-muted-foreground line-through">{item.label}</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-bold text-primary">
              <ArrowRight className="h-4 w-4" />
              {item.detail}
            </p>
          </>
        ) : (
          <p className="font-medium text-foreground">{item.label}</p>
        )}
      </div>
    </div>
  );
}

export function CopilotRiskIntervention({
  onClose,
  onAccept,
  onDismiss,
  riskTitle = "Risk Detected",
  riskDescription = (
    <>
      You reported severe <span className="font-bold">Quad soreness (9/10)</span> and poor sleep recovery.
    </>
  ),
  riskWarning = "Proceeding with today's heavy Lower Body Power session increases injury risk.",
  adjustments = DEFAULT_ADJUSTMENTS,
}: CopilotRiskInterventionProps) {
  return (
    <div className="flex flex-col h-full bg-secondary/30 font-['Inter']">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 flex items-center justify-center rounded-full text-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-primary font-['Manrope']">
            Copilot Intervention
          </h1>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-32">
        {/* Risk Card */}
        <section className="rounded-2xl bg-card shadow-sm p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground font-['Manrope']">
              {riskTitle}
            </h2>
          </div>

          <p className="text-[15px] leading-relaxed text-foreground/90">
            {riskDescription}
          </p>

          <div className="mt-4 flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
            <Info className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold leading-snug text-destructive">
              {riskWarning}
            </p>
          </div>
        </section>

        {/* Proposed Adjustments */}
        <section className="rounded-2xl bg-primary/5 border border-primary/15 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-primary font-['Manrope']">
              Proposed Adjustments
            </h2>
          </div>

          <div className="space-y-2">
            {adjustments.map((item, i) => (
              <AdjustmentRow key={i} item={item} />
            ))}
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pt-3 pb-5 bg-gradient-to-t from-background via-background to-transparent"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          onClick={onAccept}
          className="w-full h-14 rounded-full text-base font-bold tracking-wide font-['Manrope'] shadow-lg"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          ACCEPT SAFE PLAN
        </Button>
        <button
          onClick={onDismiss}
          className="w-full mt-3 text-sm font-semibold text-primary/80 hover:text-primary"
        >
          Keep Original Plan (Not Recommended)
        </button>
      </div>
    </div>
  );
}

export default CopilotRiskIntervention;
