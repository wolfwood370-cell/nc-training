import { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricTrend = "up" | "down" | "neutral";

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: MetricTrend;
  trendValue?: string;
  className?: string;
}

const trendStyles: Record<MetricTrend, { color: string; Icon: typeof ArrowUp }> = {
  up: { color: "text-emerald-600", Icon: ArrowUp },
  down: { color: "text-rose-600", Icon: ArrowDown },
  neutral: { color: "text-muted-foreground", Icon: ArrowRight },
};

export function MetricCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  className,
}: MetricCardProps) {
  const trendConfig = trend ? trendStyles[trend] : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {trendConfig && trendValue && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trendConfig.color,
            )}
          >
            <trendConfig.Icon className="h-3 w-3" />
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
