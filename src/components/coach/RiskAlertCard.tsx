import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  AlertTriangle,
  Zap,
  MessageSquare,
  X,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CoachAlert } from "@/hooks/useCoachAlerts";

interface RiskAlertCardProps {
  alerts: CoachAlert[];
  isLoading: boolean;
  onDismiss: (alertId: string) => void;
  onMessageAthlete: (alert: CoachAlert) => void;
  onNavigate: (link: string) => void;
}

function getInitials(name: string | null): string {
  return (
    name
      ?.split("")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??"
  );
}

export function RiskAlertCard({
  alerts,
  isLoading,
  onDismiss,
  onMessageAthlete,
  onNavigate,
}: RiskAlertCardProps) {
  const highAlerts = alerts.filter((a) => a.severity === "high");
  const mediumAlerts = alerts.filter((a) => a.severity === "medium");

  if (!isLoading && alerts.length === 0) return null;

  return (
    <Card className="col-span-12 border-l-4 border-l-destructive shadow-md animate-fade-in">
      <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Zap className="h-5 w-5 text-destructive" />
              </div>
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Avvisi Intelligenti
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Rilevamento automatico rischi dai dati di allenamento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {highAlerts.length > 0 && (
              <Badge
                variant="destructive"
                className="tabular-nums text-sm px-3"
              >
                {highAlerts.length} critici
              </Badge>
            )}
            {mediumAlerts.length > 0 && (
              <Badge className="tabular-nums text-sm px-3 bg-warning/10 text-warning border-warning/30">
                {mediumAlerts.length} attenzione
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-[280px]">
            <div className="divide-y divide-border/50">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-4 px-4 lg:px-5 py-3 hover:bg-muted/30 transition-colors group",
                    alert.severity === "high"
                      ? "border-l-2 border-l-destructive"
                      : "border-l-2 border-l-warning",
                    !alert.read && "bg-muted/10",
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      className={cn(
                        "h-10 w-10 ring-2",
                        alert.severity === "high"
                          ? "ring-destructive/30"
                          : "ring-warning/30",
                      )}
                    >
                      <AvatarImage
                        src={alert.athlete?.avatar_url || undefined}
                      />
                      <AvatarFallback
                        className={cn(
                          "text-sm font-medium",
                          alert.severity === "high"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning",
                        )}
                      >
                        {getInitials(alert.athlete?.full_name ?? null)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center",
                        alert.severity === "high"
                          ? "bg-destructive"
                          : "bg-warning",
                      )}
                    >
                      <AlertTriangle className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => alert.link && onNavigate(alert.link)}
                  >
                    <p className="text-sm font-medium truncate">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          alert.severity === "high"
                            ? "border-destructive/50 text-destructive"
                            : "border-warning/50 text-warning",
                        )}
                      >
                        {alert.severity === "high" ? "Critico" : "Attenzione"}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMessageAthlete(alert);
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Messaggio
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(alert.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
