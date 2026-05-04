import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Activity, Clock, Dumbbell, Flame, Play, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import { useReadiness } from "@/hooks/useReadiness";
import { useTodaysWorkout } from "@/hooks/useTodaysWorkout";

import { SectionHeader } from "@/components/common/SectionHeader";
import { MetricCard } from "@/components/common/MetricCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CircularProgress } from "@/components/common/CircularProgress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Atleta";
  return fullName.trim().split(/\s+/)[0] ?? "Atleta";
}

function getReadinessColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score < 50) return "text-rose-600";
  return "text-amber-500";
}

function getReadinessVariant(
  score: number,
): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score < 50) return "danger";
  return "warning";
}

function getReadinessLabel(score: number): string {
  if (score >= 80) return "Ottima";
  if (score >= 50) return "Moderata";
  return "Bassa";
}

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { isLoading: profileLoading } = useAthleteProfile();
  const { readiness, isLoading: readinessLoading, calculateReadiness } =
    useReadiness();
  const { workout, isLoading: workoutLoading } = useTodaysWorkout();

  const firstName = getFirstName(profile?.full_name);

  const todayLabel = useMemo(() => {
    const formatted = format(new Date(), "EEEE, d MMMM", { locale: it });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  const readinessResult = useMemo(() => {
    if (!readiness?.isCompleted) return null;
    return calculateReadiness(readiness);
  }, [readiness, calculateReadiness]);

  const readinessScore = readinessResult?.score ?? 0;
  const isLoading = authLoading || profileLoading;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 bg-background min-h-screen">
      {/* A. Greeting */}
      <header className="flex flex-col gap-1">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              Ciao, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {todayLabel}
            </p>
          </>
        )}
      </header>

      {/* B. Readiness / Status */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Il tuo stato" icon={<Activity />} />

        {readinessLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : readinessResult ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 flex items-center gap-5">
            <CircularProgress
              progress={readinessScore}
              size={96}
              strokeWidth={8}
              colorClass={getReadinessColor(readinessScore)}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {readinessScore}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Score
                </span>
              </div>
            </CircularProgress>

            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Readiness
                </span>
                <StatusBadge
                  text={getReadinessLabel(readinessScore)}
                  variant={getReadinessVariant(readinessScore)}
                />
              </div>
              <p className="text-sm text-foreground line-clamp-2">
                {readinessResult.reason}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-5 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Check-in mancante
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Registra come ti senti oggi per calcolare il tuo punteggio di
              readiness.
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/athlete/dashboard?checkin=1")}
            >
              Fai il check-in
            </Button>
          </div>
        )}
      </section>

      {/* C. Today's Training */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Allenamento di oggi"
          icon={<Dumbbell />}
          actionText="Vedi piano"
          onAction={() => navigate("/athlete/training")}
        />

        {workoutLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : workout ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {workout.title}
                </h3>
                {workout.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workout.description}
                  </p>
                )}
              </div>
              <StatusBadge
                text={workout.status === "completed" ? "Completato" : "Da fare"}
                variant={workout.status === "completed" ? "success" : "info"}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {workout.estimatedDuration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {workout.estimatedDuration} min
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                {workout.exerciseCount} esercizi
              </span>
            </div>

            {workout.status !== "completed" && (
              <Button asChild className="w-full" size="lg">
                <Link to="/athlete/training/active">
                  <Play className="h-4 w-4" />
                  Inizia Allenamento
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-6 flex flex-col items-center text-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">
              Giorno di riposo
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Goditi il recupero! Il riposo è parte fondamentale del progresso.
            </p>
          </div>
        )}
      </section>

      {/* D. Quick metrics */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Statistiche" icon={<Flame />} />
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Sonno"
            value={readiness?.sleepHours ? `${readiness.sleepHours}h` : "—"}
            icon={<Clock />}
          />
          <MetricCard
            label="Energia"
            value={readiness?.energy ?? "—"}
            icon={<Flame />}
          />
        </div>
      </section>
    </div>
  );
}
