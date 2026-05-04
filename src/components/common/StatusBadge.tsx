import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

export interface StatusBadgeProps {
  text: string;
  variant?: StatusBadgeVariant;
  className?: string;
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-primary/10 text-primary",
  default: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  text,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {text}
    </span>
  );
}

export default StatusBadge;
