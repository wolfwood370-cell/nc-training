import { useState, useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { Cloud, CloudOff, Loader2, ShieldAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SyncIndicatorProps {
  /** Optional readiness score (0-100) to show status badge */
  readinessScore?: number | null;
}

/**
 * Small cloud icon that reflects global fetch + online state,
 * plus an optional readiness badge when a score is provided.
 */
export function SyncIndicator({ readinessScore }: SyncIndicatorProps) {
  const isFetching = useIsFetching();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

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

  const readinessBadge = readinessScore != null ? (
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

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-destructive" title="Offline">
        <CloudOff className="h-4 w-4" />
        <span className="text-[10px] font-medium leading-none">Offline</span>
        {readinessBadge}
      </div>
    );
  }

  if (isFetching > 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground" title="Syncing…">
        <Loader2 className="h-4 w-4 animate-spin" />
        {readinessBadge}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-primary/60" title="Synced">
      <Cloud className="h-4 w-4" />
      {readinessBadge}
    </div>
  );
}
