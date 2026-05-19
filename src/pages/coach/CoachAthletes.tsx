import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InviteAthleteDialog } from "@/components/coach/InviteAthleteDialog";
import { useAthletesRiskOverview } from "@/hooks/useAthletesRiskOverview";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Search, LayoutGrid, List, ChevronRight, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type ViewMode = "grid" | "list";

export default function CoachAthletes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { allAthletes, isLoading } = useAthletesRiskOverview();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Query for athletes with active (in_progress) workout sessions
  const { data: liveAthleteIds = [] } = useQuery({
    queryKey: ["live-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const athleteIds = allAthletes.map((a) => a.athleteId);
      if (athleteIds.length === 0) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("athlete_id")
        .in("athlete_id", athleteIds)
        .eq("status", "scheduled")
        .not("started_at", "is", null);
      if (error) return [];
      return [...new Set((data ?? []).map((d) => d.athlete_id))];
    },
    enabled: !!user && allAthletes.length > 0,
    refetchInterval: 30000,
  });

  // Realtime: instantly update live status when any workout_log changes
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("live-sessions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["live-sessions", user.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Filter athletes by search query
  const filteredAthletes = allAthletes.filter((athlete) =>
    athlete.athleteName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getLastActiveText = (date: string | null) => {
    if (!date) return "Mai attivo";
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: it,
      });
    } catch {
      return "Data sconosciuta";
    }
  };

  const isActive = (date: string | null) => {
    if (!date) return false;
    return Date.now() - new Date(date).getTime() < 3 * 24 * 60 * 60 * 1000;
  };

  if (authLoading) {
    return (
      <CoachLayout title="Atleti" subtitle="Caricamento...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout title="Atleti" subtitle="Gestisci il tuo roster di atleti">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca atleti..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1 bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Vista griglia"
                className={cn("h-8 w-8", viewMode === "grid" && "bg-background shadow-sm")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Vista elenco"
                className={cn("h-8 w-8", viewMode === "list" && "bg-background shadow-sm")}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <InviteAthleteDialog
              trigger={
                <Button size="sm" className="gradient-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invita Atleta
                </Button>
              }
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Totale:</span>
            <Badge variant="secondary">{allAthletes.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Attivi:</span>
            <span className="font-medium">
              {allAthletes.filter((a) => isActive(a.readinessDate)).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <span className="text-muted-foreground">Inattivi:</span>
            <span className="font-medium">
              {allAthletes.filter((a) => !isActive(a.readinessDate)).length}
            </span>
          </div>
        </div>

        {/* Athletes Display */}
        {isLoading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2",
            )}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-32" : "h-16"} />
            ))}
          </div>
        ) : filteredAthletes.length === 0 && allAthletes.length > 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-border bg-muted/10">
            <p className="text-muted-foreground">Nessun atleta trovato per "{searchQuery}"</p>
          </Card>
        ) : allAthletes.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border bg-muted/10">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nessun atleta ancora</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Invita i tuoi atleti per iniziare a monitorare i loro progressi.
            </p>
            <InviteAthleteDialog
              trigger={
                <Button className="gradient-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invita il tuo primo atleta
                </Button>
              }
            />
          </Card>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAthletes.map((athlete) => {
              const active = isActive(athlete.readinessDate);
              const isLive = liveAthleteIds.includes(athlete.athleteId);

              return (
                <Card
                  key={athlete.athleteId}
                  onClick={() => navigate(`/coach/athlete/${athlete.athleteId}`)}
                  className={cn(
                    "group cursor-pointer transition-all duration-200 p-4",
                    "bg-card border border-border/50",
                    "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]",
                    "active:scale-[0.98]",
                    isLive && "ring-2 ring-success/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Status Dot */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage
                          src={athlete.avatarUrl || undefined}
                          alt={athlete.athleteName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {athlete.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      {isLive ? (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-success animate-pulse" />
                      ) : (
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                            active ? "bg-success" : "bg-muted-foreground/50",
                          )}
                        />
                      )}
                    </div>

                    {/* Name & Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {athlete.athleteName}
                        </h3>
                        {isLive && (
                          <Badge
                            variant="secondary"
                            className="text-3xs px-1.5 py-0 h-4 bg-success/10 text-success border-success/30 gap-1 shrink-0"
                          >
                            <Radio className="h-2.5 w-2.5" />
                            Live
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isLive
                            ? "text-success"
                            : active
                              ? "text-success"
                              : "text-muted-foreground",
                        )}
                      >
                        {isLive ? "In allenamento" : active ? "Attivo" : "Inattivo"}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Last Active */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ultima attività</span>
                      <span className="text-foreground font-medium tabular-nums">
                        {getLastActiveText(athlete.readinessDate)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <Card className="divide-y divide-border/50">
            {filteredAthletes.map((athlete) => {
              const active = isActive(athlete.readinessDate);
              const isLive = liveAthleteIds.includes(athlete.athleteId);

              const goToAthlete = () => navigate(`/coach/athlete/${athlete.athleteId}`);
              return (
                <div
                  key={athlete.athleteId}
                  role="button"
                  tabIndex={0}
                  onClick={goToAthlete}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToAthlete();
                    }
                  }}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {/* Avatar with Status Dot */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-border">
                      <AvatarImage src={athlete.avatarUrl || undefined} alt={athlete.athleteName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {athlete.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    {isLive ? (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success animate-pulse" />
                    ) : (
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                          active ? "bg-success" : "bg-muted-foreground/50",
                        )}
                      />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {athlete.athleteName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getLastActiveText(athlete.readinessDate)}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {isLive ? (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-success/10 text-success border-success/30 gap-1"
                    >
                      <Radio className="h-3 w-3" />
                      Live
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {active ? "Attivo" : "Inattivo"}
                    </Badge>
                  )}

                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </CoachLayout>
  );
}
