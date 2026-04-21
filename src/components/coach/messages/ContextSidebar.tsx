import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Activity,
  TrendingUp,
  X,
  Dumbbell,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Conversation } from "./ChatList";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface ContextSidebarProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for athlete context
const mockUpcomingWorkouts = [
  { date: new Date(), name: "Upper Body A", time: "09:00" },
  { date: addDays(new Date(), 1), name: "Lower Body A", time: "10:00" },
  { date: addDays(new Date(), 2), name: "Rest Day", time: null },
];

const mockLastWorkout = {
  name: "Full Body Strength",
  date: new Date(Date.now() - 24 * 60 * 60 * 1000),
  rpe: 8.5,
  duration: 62,
  exercises: 8,
};

const mockWeightData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  weight: 75 + Math.sin(i * 0.3) * 1.5 + Math.random() * 0.5,
}));

const mockComplianceData = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  compliance: 70 + Math.random() * 30,
}));

function MiniSparkline({
  data,
  dataKey,
  color,
}: {
  data: { [key: string]: number }[];
  dataKey: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ContextSidebar({
  conversation,
  isOpen,
  onClose,
}: ContextSidebarProps) {
  if (!conversation) {
    return (
      <Card
        className={cn(
          "border-0 shadow-sm h-full flex flex-col",
          "fixed inset-y-0 right-0 z-50 w-80 transition-all duration-300 lg:relative lg:w-full",
          isOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100",
        )}
      >
        <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
          <p className="text-sm">Seleziona un atleta per vedere il contesto</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-0 shadow-sm h-full flex flex-col overflow-hidden",
        "fixed inset-y-0 right-0 z-50 w-80 transition-all duration-300 lg:relative lg:w-full",
        isOpen
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100",
      )}
    >
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Contesto Atleta
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Section A: Mini Calendar */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Prossimi 3 Giorni
              </h4>
            </div>
            <div className="space-y-2">
              {mockUpcomingWorkouts.map((workout, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      {workout.time ? (
                        <Dumbbell className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-xs"></span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{workout.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(workout.date, "EEEE d", { locale: it })}
                        {workout.time && `• ${workout.time}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Recent Activity */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Ultima Attività
              </h4>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">
                    {mockLastWorkout.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(mockLastWorkout.date, "d MMMM", { locale: it })} •
                    {""}
                    {mockLastWorkout.duration} min
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      mockLastWorkout.rpe > 8 ? "destructive" : "secondary"
                    }
                    className="text-xs"
                  >
                    RPE {mockLastWorkout.rpe}
                  </Badge>
                  {mockLastWorkout.rpe > 8 && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{mockLastWorkout.exercises} esercizi</span>
                <span className="text-green-500"> Completato</span>
              </div>
            </div>
          </div>

          {/* Section C: Quick Metrics */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Metriche Rapide
              </h4>
            </div>

            <div className="space-y-4">
              {/* Body Weight */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Peso Corporeo (30gg)
                  </span>
                  <span className="text-sm font-semibold">
                    {mockWeightData[mockWeightData.length - 1].weight.toFixed(
                      1,
                    )}{" "}
                    kg
                  </span>
                </div>
                <MiniSparkline
                  data={mockWeightData}
                  dataKey="weight"
                  color="hsl(var(--primary))"
                />
              </div>

              {/* Compliance */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Compliance % (12 sett.)
                  </span>
                  <span className="text-sm font-semibold text-green-500">
                    {Math.round(
                      mockComplianceData[mockComplianceData.length - 1]
                        .compliance,
                    )}
                    %
                  </span>
                </div>
                <MiniSparkline
                  data={mockComplianceData}
                  dataKey="compliance"
                  color="hsl(142 71% 45%)"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
