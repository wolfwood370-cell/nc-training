import { CoachLayout } from"@/components/coach/CoachLayout";
import { MetaHead } from"@/components/MetaHead";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Skeleton } from"@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from"@/components/ui/avatar";
import { InviteAthleteDialog } from"@/components/coach/InviteAthleteDialog";
import { RiskTable } from"@/components/coach/RiskTable";
import { RiskAlertCard } from"@/components/coach/RiskAlertCard";

import { useAuth } from"@/hooks/useAuth";
import { useNavigate } from"react-router-dom";
import { useEffect } from"react";
import { 
  useCoachDashboardMetrics,
  type UrgentAlert,
  type AlertType,
  type AlertSeverity,
} from"@/hooks/useCoachDashboardMetrics";
import { useCoachAlerts, type CoachAlert } from"@/hooks/useCoachAlerts";
import { useChatRooms } from"@/hooks/useChatRooms";
import { toast } from"sonner";
import { 
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Battery,
  CheckCircle2,
  UserPlus,
  ChevronRight,
  Calendar,
  MessageSquare,
  Activity,
  Flame,
  AlertCircle,
  Clock,
  Users,
  DollarSign,
  Target,
  Zap,
  CalendarX,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { format, formatDistanceToNow } from"date-fns";
import { it } from"date-fns/locale";

// ===== ALERT CONFIGURATION =====
const getAlertConfig = (type: AlertType) => {
  const configs: Record<AlertType, { icon: typeof AlertTriangle; label: string; bgClass: string; textClass: string }> = {
    missed_workout: { 
      icon: CalendarX, 
      label:"Allenamento Saltato",
      bgClass:"bg-destructive/10",
      textClass:"text-destructive"    },
    low_readiness: { 
      icon: Battery, 
      label:"Readiness Bassa",
      bgClass:"bg-destructive/10",
      textClass:"text-destructive"    },
    active_injury: { 
      icon: AlertCircle, 
      label:"Infortunio Attivo",
      bgClass:"bg-destructive/10",
      textClass:"text-destructive"    },
    high_acwr: { 
      icon: Flame, 
      label:"ACWR Elevato",
      bgClass:"bg-warning/10",
      textClass:"text-warning"    },
    rpe_spike: { 
      icon: Zap, 
      label:"RPE Elevato",
      bgClass:"bg-warning/10",
      textClass:"text-warning"    },
    no_checkin: { 
      icon: Clock, 
      label:"Nessun Check-in",
      bgClass:"bg-muted",
      textClass:"text-muted-foreground"    },
  };
  return configs[type] ?? { 
    icon: AlertTriangle, 
    label:"Alert",
    bgClass:"bg-muted",
    textClass:"text-muted-foreground"  };
};

const getSeverityStyles = (severity: AlertSeverity) => {
  switch (severity) {
    case"critical":
      return { ring:"ring-destructive/30", bg:"bg-destructive", badge:"bg-destructive/10 text-destructive border-destructive/30"};
    case"warning":
      return { ring:"ring-warning/30", bg:"bg-warning", badge:"bg-warning/10 text-warning border-warning/30"};
    case"info":
    default:
      return { ring:"ring-muted", bg:"bg-muted-foreground", badge:"bg-muted text-muted-foreground border-border"};
  }
};

export default function CoachHome() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  
  const {
    urgentAlerts,
    feedbackItems,
    todaySchedule,
    businessMetrics,
    healthyAthletes,
    isLoading,
  } = useCoachDashboardMetrics();

  const {
    alerts: smartAlerts,
    isLoading: alertsLoading,
    dismissAlert,
  } = useCoachAlerts();

  const { getOrCreateDirectRoom } = useChatRooms();

  // Separate alerts by severity for Bento layout
  const criticalAlerts = urgentAlerts.filter(a => a.severity ==="critical"|| a.severity ==="warning");
  const infoAlerts = urgentAlerts.filter(a => a.severity ==="info");

  const handleMessageFromAlert = async (alert: CoachAlert) => {
    try {
      if (!user?.id) return;
      const roomId = await getOrCreateDirectRoom.mutateAsync(alert.athlete_id);
      // Navigate to messages with alert context
      const alertContext = encodeURIComponent(JSON.stringify({
        message: alert.message,
        severity: alert.severity,
        workoutLogId: alert.workout_log_id,
        createdAt: alert.created_at,
      }));
      navigate(`/coach/messages?room=${roomId}&alertContext=${alertContext}`);
    } catch {
      toast.error("Errore nell'apertura della chat");
    }
  };

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <CoachLayout title="Centro di Comando"subtitle="Caricamento...">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full"/>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32"/>
            <Skeleton className="h-32"/>
            <Skeleton className="h-32"/>
          </div>
        </div>
      </CoachLayout>
    );
  }

  const hasAthletes = businessMetrics.activeClients > 0;

  return (
    <>
    <MetaHead title="Dashboard"description="Centro di comando per il tuo coaching."/>
    <CoachLayout title="Centro di Comando"subtitle="Triage Giornaliero">
      <div className="space-y-5 animate-fade-in">
        
        {/* Empty State for New Coaches */}
        {!isLoading && !hasAthletes && (
          <Card className="p-12 text-center border-0 shadow-sm">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 ring-4 ring-primary/10">
              <UserPlus className="h-10 w-10 text-primary"/>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Benvenuto, Coach! 
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Invita il tuo primo atleta per iniziare a monitorare carico, recupero e performance in tempo reale.
            </p>
            <InviteAthleteDialog 
              trigger={
                <Button className="gradient-primary h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  <UserPlus className="h-5 w-5 mr-2"/>
                  Invita il Primo Atleta
                </Button>
              }
            />
          </Card>
        )}

        {/* ===== BENTO GRID LAYOUT ===== */}
        {hasAthletes && (
          <>
          <div className="grid grid-cols-12 gap-4 lg:gap-5">

            {/* ===== ROW 0: SMART ALERTS (WATCHDOG) ===== */}
            <RiskAlertCard
              alerts={smartAlerts}
              isLoading={alertsLoading}
              onDismiss={(id) => dismissAlert.mutate(id)}
              onMessageAthlete={handleMessageFromAlert}
              onNavigate={(link) => navigate(link)}
            />
            
            
            {/* Urgent Alerts - Takes more space */}
            <Card className="col-span-12 lg:col-span-8 border-l-4 border-l-destructive shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                      <ShieldAlert className="h-5 w-5 text-destructive"/>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                         Allerte Urgenti
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Allenamenti saltati • Readiness bassa • Rischio infortunio • ACWR &gt; 1.3
                      </p>
                    </div>
                  </div>
                  {criticalAlerts.length > 0 && (
                    <Badge variant="destructive"className="tabular-nums text-sm px-3">
                      {criticalAlerts.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="h-10 w-10 rounded-full"/>
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32"/>
                          <Skeleton className="h-3 w-48"/>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : criticalAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mb-3">
                      <CheckCircle2 className="h-7 w-7 text-success"/>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Tutto OK!</h3>
                    <p className="text-sm text-muted-foreground">
                      Nessun atleta in zona critica. Ottimo lavoro!
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-y divide-border/50">
                      {criticalAlerts.map((alert) => (
                        <AlertRow 
                          key={alert.id} 
                          alert={alert} 
                          onClick={() => navigate(`/coach/athlete/${alert.athleteId}`)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Business Health - Compact sidebar */}
            <Card className="col-span-12 lg:col-span-4 border-l-4 border-l-success shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <TrendingUp className="h-4 w-4 text-success"/>
                  </div>
                  <CardTitle className="text-sm font-bold"> Salute Business</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Active Clients */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm text-muted-foreground">Clienti Attivi</span>
                  </div>
                  <span className="text-xl font-bold tabular-nums">{businessMetrics.activeClients}</span>
                </div>
                
                {/* MRR (Mocked) */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success"/>
                    <span className="text-sm text-muted-foreground">Ricavo Mensile</span>
                  </div>
                  <span className="text-xl font-bold tabular-nums text-success">
                    €{businessMetrics.monthlyRecurringRevenue}
                  </span>
                </div>
                
                {/* Compliance Rate */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground"/>
                    <span className="text-sm text-muted-foreground">Tasso Check-in</span>
                  </div>
                  <span className={cn(
                    "text-xl font-bold tabular-nums",
                    businessMetrics.complianceRate >= 80 ?"text-success":
                    businessMetrics.complianceRate >= 50 ?"text-warning":"text-destructive"                  )}>
                    {businessMetrics.complianceRate}%
                  </span>
                </div>
                
                {/* Churn Risk */}
                {businessMetrics.churnRisk > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive"/>
                      <span className="text-sm text-muted-foreground">A Rischio</span>
                    </div>
                    <span className="text-xl font-bold tabular-nums text-destructive">
                      {businessMetrics.churnRisk}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ===== ROW 2: NEEDS FEEDBACK (YELLOW) + TODAY'S SCHEDULE ===== */}
            
            {/* Needs Feedback */}
            <Card className="col-span-12 lg:col-span-7 border-l-4 border-l-warning shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 lg:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                      <MessageSquare className="h-5 w-5 text-warning"/>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                         Richiede Feedback
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Allenamenti completati nelle ultime 24h in attesa di revisione
                      </p>
                    </div>
                  </div>
                  {feedbackItems.length > 0 && (
                    <Badge className="tabular-nums text-sm px-3 bg-warning/10 text-warning border-warning/20">
                      {feedbackItems.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-14"/>
                    ))}
                  </div>
                ) : feedbackItems.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted/50 mb-2">
                      <CheckCircle2 className="h-6 w-6 text-muted-foreground"/>
                    </div>
                    <p className="text-sm text-muted-foreground">Nessun feedback in sospeso</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Gli allenamenti completati appariranno qui</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[220px]">
                    <div className="divide-y divide-border/50">
                      {feedbackItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-4 lg:px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"                          onClick={() => navigate(`/coach/athlete/${item.athleteId}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.avatarUrl || undefined} />
                            <AvatarFallback className="bg-warning/10 text-warning text-sm font-medium">
                              {item.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              <span className="font-semibold">{item.athleteName}</span>
                              <span className="text-muted-foreground"> ha completato </span>
                              <span className="font-medium text-foreground">'{item.workoutTitle}'</span>
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3"/>
                                {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true, locale: it })}
                              </span>
                              {item.rpeGlobal && (
                                <Badge variant="outline"className={cn(
                                  "text-[10px] px-1.5 py-0 h-4",
                                  item.rpeGlobal > 8 ?"border-warning/50 text-warning":""                                )}>
                                  RPE {item.rpeGlobal}
                                </Badge>
                              )}
                              {item.hasNotes && (
                                <Badge variant="outline"className="text-[10px] px-1.5 py-0 h-4">
                                   Notes
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm"                            variant="outline"                            className="opacity-0 group-hover:opacity-100 transition-opacity"                          >
                            Rivedi
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card className="col-span-12 lg:col-span-5 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary"/>
                    <CardTitle className="text-sm font-bold"> Programma di Oggi</CardTitle>
                  </div>
                  <Badge variant="secondary"className="tabular-nums">
                    {todaySchedule.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(),"EEEE, MMMM d", { locale: it })}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12"/>
                    ))}
                  </div>
                ) : todaySchedule.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nessun allenamento programmato per oggi
                    </p>
                    <Button 
                      variant="link"                      size="sm"                      className="mt-2 text-xs"                      onClick={() => navigate("/coach/programs")}
                    >
                      Crea un programma
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[220px]">
                    <div className="p-2 space-y-1">
                      {todaySchedule.map((workout) => (
                        <div
                          key={workout.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"                          onClick={() => navigate(`/coach/athlete/${workout.athleteId}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {workout.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{workout.athleteName}</p>
                            <p className="text-xs text-muted-foreground truncate">{workout.title}</p>
                          </div>
                          <Activity className="h-4 w-4 text-muted-foreground"/>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* ===== ROW 3: OPTIMAL ZONE + INFO ALERTS ===== */}
            
            {/* Healthy Athletes */}
            <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse"/>
                  <CardTitle className="text-sm font-bold"> Zona Ottimale</CardTitle>
                  <Badge variant="secondary"className="ml-auto text-xs tabular-nums bg-success/10 text-success">
                    {healthyAthletes.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Atleti senza criticità</p>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {healthyAthletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tutti gli atleti richiedono attenzione
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {healthyAthletes.slice(0, 14).map((athlete) => (
                      <Avatar 
                        key={athlete.id} 
                        className="h-9 w-9 border-2 border-success/30 cursor-pointer hover:scale-110 transition-transform"                        title={`${athlete.name}${athlete.readinessScore ?`(${athlete.readinessScore}%)`:''}`}
                        onClick={() => navigate(`/coach/athlete/${athlete.id}`)}
                      >
                        <AvatarImage src={athlete.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-success/10 text-success font-medium">
                          {athlete.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {healthyAthletes.length > 14 && (
                      <div 
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/80"                        onClick={() => navigate("/coach/athletes")}
                      >
                        +{healthyAthletes.length - 14}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Alerts (No Check-ins) */}
            <Card className="col-span-12 lg:col-span-6 border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground"/>
                  <CardTitle className="text-sm font-bold"> In Attesa di Check-in</CardTitle>
                  <Badge variant="secondary"className="ml-auto text-xs tabular-nums">
                    {infoAlerts.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Atleti che non hanno fatto il check-in oggi</p>
              </CardHeader>
              <CardContent className="p-0">
                {infoAlerts.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Tutti hanno fatto il check-in! </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[140px]">
                    <div className="p-2 flex flex-wrap gap-2">
                      {infoAlerts.slice(0, 10).map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"                          onClick={() => navigate(`/coach/athlete/${alert.athleteId}`)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={alert.avatarUrl || undefined} />
                            <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                              {alert.avatarInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {alert.athleteName.split("")[0]}
                          </span>
                        </div>
                      ))}
                      {infoAlerts.length > 10 && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          +{infoAlerts.length - 10} altri
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ===== RISK TABLE ===== */}
          <div className="mt-5">
            <RiskTable />
          </div>
          </>
        )}
      </div>
    </CoachLayout>
    </>
  );
}

// ===== ALERT ROW COMPONENT =====
function AlertRow({ 
  alert, 
  onClick 
}: { 
  alert: UrgentAlert; 
  onClick: () => void;
}) {
  const config = getAlertConfig(alert.alertType);
  const severity = getSeverityStyles(alert.severity);
  const Icon = config.icon;

  return (
    <div 
      className="flex items-center gap-4 px-4 lg:px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"      onClick={onClick}
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <Avatar className={cn("h-10 w-10 ring-2", severity.ring)}>
          <AvatarImage src={alert.avatarUrl || undefined} />
          <AvatarFallback className={cn("text-sm font-medium", config.bgClass, config.textClass)}>
            {alert.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card flex items-center justify-center",
          severity.bg
        )}>
          <Icon className="h-2.5 w-2.5 text-white"/>
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{alert.athleteName}</p>
          <Badge 
            variant="outline"            className={cn("text-[10px] px-1.5 py-0 h-5", severity.badge)}
          >
            {alert.value}
          </Badge>
          <Badge variant="outline"className="text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex">
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {alert.details}
        </p>
      </div>
      
      {/* Action hint */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"/>
    </div>
  );
}
