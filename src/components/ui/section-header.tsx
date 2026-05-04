import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  icon,
  actionText,
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="text-primary shrink-0 [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </span>
        )}
        <h2 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h2>
      </div>
      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default SectionHeader;
