import { cn } from "@/lib/utils";
import { Dumbbell, Flame, Check, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface DailyRingsProps {
  fuelValue: number;
  fuelTarget: number;
  trainingProgress: number; // 0-100
  habitsCompleted: number;
  habitsTotal: number;
  brandColor?: string;
  /** Optional data source label, e.g. "Oura", "Garmin", "Whoop" */
  dataSource?: string | null;
}

// Helper to determine color based on percentage
const getFuelColor = (percentage: number): string => {
  // 90-110% is green (target zone)
  if (percentage >= 90 && percentage <= 110) return "hsl(160 84% 39%)"; // success
  // Under 90% is yellow (under-eating)
  if (percentage < 90) return "hsl(38 92% 50%)"; // warning
  // Over 110% is red (over-eating)
  return "hsl(0 84% 60%)"; // destructive
};

const getTrainingColor = (percentage: number, brandColor?: string): string => {
  if (percentage >= 100) return "hsl(160 84% 39%)"; // success - completed
  // Use brand color for in-progress/pending, fallback to primary
  return brandColor || "hsl(var(--primary))";
};

const getHabitsColor = (percentage: number): string => {
  // Indigo/Purple theme for habits
  if (percentage >= 100) return "hsl(160 84% 39%)"; // success when complete
  return "hsl(250 60% 60%)"; // Indigo/Purple
};

// Single Progress Ring Component with animations
const ProgressRing = ({
  percentage,
  color,
  size = 88,
  strokeWidth = 7,
  icon: Icon,
  label,
  value,
  unit,
  isCenter = false,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  isCenter?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <motion.div 
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow effect for center ring */}
        {isCenter && (
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-30"
            style={{ backgroundColor: color }}
          />
        )}
        
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth={strokeWidth}
            opacity={0.5}
          />
          {/* Progress ring with animation */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        
        {/* Center icon with pulse animation when complete */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div 
            className={cn(
              "rounded-full p-2",
              isCenter && "p-2.5"
            )}
            style={{ 
              backgroundColor: `${color}15`,
            }}
          >
            <Icon 
              className={cn(
                isCenter ? "h-6 w-6" : "h-5 w-5"
              )} 
              style={{ color }} 
            />
          </div>
        </motion.div>
      </div>
      
      {/* Value and label */}
      <div className="text-center mt-1">
        <div className="flex items-baseline justify-center">
          <motion.span 
            className={cn(
              "font-bold tabular-nums",
              isCenter ? "text-base" : "text-sm"
            )} 
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
          </motion.span>
          {unit && (
            <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
    </motion.div>
  );
};

export function DailyRings({
  fuelValue,
  fuelTarget,
  trainingProgress,
  habitsCompleted,
  habitsTotal,
  brandColor,
  dataSource,
}: DailyRingsProps) {
  const fuelPercentage = fuelTarget > 0 ? (fuelValue / fuelTarget) * 100 : 0;
  const habitsPercentage = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

  // Format fuel display
  const fuelDisplay = fuelValue >= 1000
    ? `${(fuelValue / 1000).toFixed(1)}k`
    : fuelValue.toString();
  const fuelUnit = fuelTarget >= 1000
    ? `/${(fuelTarget / 1000).toFixed(1)}k`
    : `/${fuelTarget}`;

  return (
    <div className="relative">
      {/* Rings */}
      <div className="flex items-end justify-center gap-4 py-3 scale-[0.95] sm:scale-100">
        <ProgressRing
          percentage={fuelPercentage}
          color={getFuelColor(fuelPercentage)}
          size={80}
          strokeWidth={6}
          icon={Flame}
          label="Energia"
          value={fuelDisplay}
          unit={fuelUnit}
        />

        <ProgressRing
          percentage={trainingProgress}
          color={getTrainingColor(trainingProgress, brandColor)}
          size={104}
          strokeWidth={8}
          icon={trainingProgress >= 100 ? Check : Dumbbell}
          label="Allenamento"
          value={trainingProgress >= 100 ? "Fatto" : "Da Fare"}
          isCenter
        />

        <ProgressRing
          percentage={habitsPercentage}
          color={getHabitsColor(habitsPercentage)}
          size={80}
          strokeWidth={6}
          icon={Check}
          label="Abitudini"
          value={`${habitsCompleted}/${habitsTotal}`}
        />
      </div>

      {/* Data source attribution */}
      {dataSource && (
        <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1">
          Powered by {dataSource}
        </p>
      )}
    </div>
  );
}
