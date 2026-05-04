import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
  children?: ReactNode;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 6,
  colorClass = "text-primary",
  trackClass = "text-muted",
  children,
  className,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-500", colorClass)}
        />
      </svg>
      {children !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default CircularProgress;
