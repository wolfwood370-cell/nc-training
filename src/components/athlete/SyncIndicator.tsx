import { useEffect, useState, useMemo } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { CloudOff, Loader2, RefreshCw, Cloud, ShieldAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  /** Optional readiness score (0-100) to show status badge */
  readinessScore?: number | null;
  /** Show a manual refresh button when stale */
  showRefresh?: boolean;
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function formatRelative(ms: number): string {
  if (ms < 60_000) return "ora";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}

/**
 * Data freshness indicator with three states:
 *  - Syncing  → spinning icon
 *  - Up to date → cloud icon + "ora"
 *  - Stale   → muted text "Xm fa" + manual refresh button
 */
export function SyncIndicator({
  readinessScore,
  showRefresh = true,
}: SyncIndicatorProps) {
  const isFetching = useIsFetching();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Re-render every 30s so relative time stays fresh
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Latest dataUpdatedAt across all queries
  const lastSyncedAt = useMemo(() => {
    const queries = queryClient.getQueryCache().getAll();
    let latest = 0;
    for (const q of queries) {
      const t = q.state.dataUpdatedAt;
      if (t > latest) latest = t;
    }
    return latest;
  }, [queryClient, isFetching, now]);

  const ageMs = lastSyncedAt > 0 ? now - lastSyncedAt : Infinity;
  const isStale = lastSyncedAt > 0 && ageMs > STALE_THRESHOLD_MS;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const readinessBadge =
    readinessScore != null ? (
      readinessScore < 40 ? (
        <Badge
          variant="destructive"
          className="gap-1 text-[10px] px-1.5 py-0"
          title={`Readiness: ${readinessScore}`}
        >
          <ShieldAlert className="h-3 w-3" />
          Recupero
        </Badge>
      ) : readinessScore >= 80 ? (
        <Badge
          className="gap-1 text-[10px] px-1.5 py-0 bg-success/15 text-success border-success/30"
          title={`Readiness: ${readinessScore}`}
        >
          <Zap className="h-3 w-3" />
          Prime
        </Badge>
      ) : null
    ) : null;

  // Offline takes priority
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-destructive" title="Offline">
        <CloudOff className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-none">Offline</span>
        {readinessBadge}
      </div>
    );
  }

  // Syncing
  if (isFetching > 0) {
    return (
      <div
        className="flex items-center gap-1.5 text-muted-foreground"
        title="Sincronizzazione…"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[10px] font-medium leading-none">Sync…</span>
        {readinessBadge}
      </div>
    );
  }

  // Stale
  if (isStale) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="text-[10px] font-medium leading-none text-muted-foreground/70"
          title={`Ultimo aggiornamento ${formatRelative(ageMs)}`}
        >
          {formatRelative(ageMs)}
        </span>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            aria-label="Aggiorna dati"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground",
              "min-h-[44px] min-w-[44px] -m-3 p-3",
              "transition-transform active:scale-90 hover:text-foreground",
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {readinessBadge}
      </div>
    );
  }

  // Up to date
  return (
    <div
      className="flex items-center gap-1.5 text-success/80"
      title="Dati aggiornati"
    >
      <Cloud className="h-4 w-4" />
      <span className="text-[10px] font-medium leading-none">
        {lastSyncedAt > 0 ? formatRelative(ageMs) : "ora"}
      </span>
      {readinessBadge}
    </div>
  );
}
