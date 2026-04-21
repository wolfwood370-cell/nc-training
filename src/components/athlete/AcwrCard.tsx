import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcwrData } from "@/hooks/useAcwrData";
import {
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Activity,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ZONE_RANGES: Array<{ from: number; to: number; label: string; tone: string }> = [
  { from: 0.0, to: 0.8, label: "Detraining", tone: "bg-muted" },
  { from: 0.8, to: 1.3, label: "Sweet Spot", tone: "bg-success" },
  { from: 1.3, to: 1.5, label: "Caution", tone: "bg-warning" },
  { from: 1.5, to: 2.0, label: "Danger", tone: "bg-destructive" },
];

export function AcwrCard() {
  const { data, isLoading, error } = useAcwrData();

  if (isLoading) {
    return (
      <Card className="border-0">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  // Empty / insufficient
  if (error || !data || data.status === "insufficient-data") {
    return (
      <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Carico ACWR
              </p>
              <p className="text-lg font-bold text-muted-foreground/70">—</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/30">
            {error
              ? "Errore nel caricamento"
              : "Completa 7+ giorni di allenamento per sbloccare le analytics ACWR"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    switch (data?.status) {
      case "optimal":
        return {
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
          zoneLabel: "Sweet Spot",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          zoneLabel: "Caution",
        };
      case "high-risk":
        return {
          icon: AlertOctagon,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          zoneLabel: "Danger Zone",
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-muted-foreground",
          bgColor: "bg-secondary",
          borderColor: "border-border",
          zoneLabel: "—",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const ratio = data?.ratio ?? null;

  // Position pointer along 0–2 scale (clamped)
  const ratioForBar = Math.max(0, Math.min(2, ratio ?? 0));
  const pointerPct = (ratioForBar / 2) * 100;

  return (
    <Card className={cn("border overflow-hidden", config.bgColor, config.borderColor)}>
      <CardContent className="p-4 space-y-3">
        {/* === ACTIONABLE STATE === */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-background/40 backdrop-blur-sm",
            )}
          >
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Carico ACWR
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold tabular-nums", config.color)}>
                {ratio !== null ? ratio.toFixed(2) : "—"}
              </span>
              <span className={cn("text-xs font-semibold", config.color)}>
                {config.zoneLabel}
              </span>
            </div>
          </div>
        </div>

        {/* === COLOR-CODED GAUGE BAR === */}
        <div className="space-y-1.5">
          <div className="relative h-2 rounded-full overflow-hidden flex">
            {ZONE_RANGES.map((zone) => (
              <div
                key={zone.label}
                className={cn("h-full opacity-60", zone.tone)}
                style={{ width: `${((zone.to - zone.from) / 2) * 100}%` }}
              />
            ))}
            {ratio !== null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-foreground border-2 border-background shadow"
                style={{ left: `${pointerPct}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>0</span>
            <span>0.8</span>
            <span>1.3</span>
            <span>1.5</span>
            <span>2.0</span>
          </div>
        </div>

        {/* === EXPANDABLE DETAILS === */}
        <Accordion type="single" collapsible className="w-full -mx-1">
          <AccordionItem value="details" className="border-none">
            <AccordionTrigger
              className={cn(
                "py-2 px-1 hover:no-underline text-xs font-medium text-muted-foreground",
                "min-h-[44px] active:scale-[0.98] transition-transform",
                "[&>svg]:h-4 [&>svg]:w-4",
              )}
            >
              Dettagli carico
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-background/40 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Acuto (7g)
                  </p>
                  <p className="font-bold tabular-nums">
                    {Math.round(data.acuteLoad ?? 0)} AU
                  </p>
                </div>
                <div className="rounded-lg bg-background/40 p-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Cronico (28g)
                  </p>
                  <p className="font-bold tabular-nums">
                    {Math.round(data.chronicLoad ?? 0)} AU
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                ACWR &lt; 0.8 = detraining · 0.8–1.3 = sweet spot · &gt; 1.5 = rischio infortunio
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
