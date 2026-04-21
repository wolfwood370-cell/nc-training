import { ReactNode, useEffect, useState, useRef, useCallback } from"react";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from"@/components/ui/alert-dialog";
import { Timer, Flag, Wifi, WifiOff, Video } from"lucide-react";
import { cn } from"@/lib/utils";
import { ResponsivePhoneWrapper } from"@/components/athlete/PhoneMockup";
import { Drawer, DrawerContent, DrawerTrigger } from"@/components/ui/drawer";
import { BarPathCamera } from"@/components/athlete/vision/BarPathCamera";

interface ActiveSessionShellProps {
  title: string;
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  isOnline: boolean;
  isRecoveryMode: boolean;
  onFinish: () => void;
  children: ReactNode;
  restTimerNode?: ReactNode;
  currentExercise?: number;
  totalExercises?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return`${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
}

// Hold-to-Finish Button that opens a confirmation dialog
function HoldToFinishButton({ onFinish, completedSets, totalSets }: { onFinish: () => void; completedSets: number; totalSets: number }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const HOLD_MS = 1200;
  const STEP = 40;

  const start = useCallback(() => {
    let p = 0;
    timerRef.current = setInterval(() => {
      p += (STEP / HOLD_MS) * 100;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setShowConfirm(true);
      }
    }, STEP);
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setProgress(0);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const noSetsLogged = completedSets === 0;

  return (
    <>
      <button
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        className="relative h-8 px-3 text-xs font-semibold rounded-md overflow-hidden bg-primary text-primary-foreground shrink-0 select-none touch-none"      >
        <div
          className="absolute inset-0 bg-destructive/80 transition-none"          style={{ width:`${progress}%`}}
        />
        <span className="relative flex items-center gap-1">
          <Flag className="h-3.5 w-3.5"/>
          {progress > 0 ?"Tieni premuto…":"Termina"}
        </span>
      </button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {noSetsLogged ?"Nessuna serie registrata":"Terminare l'allenamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {noSetsLogged
                ?"Non hai completato nessuna serie. Questo annullerà la sessione."                :`Hai completato ${completedSets} di ${totalSets} serie. Vuoi terminare?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua</AlertDialogCancel>
            <AlertDialogAction
              onClick={onFinish}
              className={noSetsLogged ?"bg-destructive text-destructive-foreground hover:bg-destructive/90":""}
            >
              {noSetsLogged ?"Annulla sessione":"Termina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ActiveSessionShell({
  title,
  elapsedSeconds,
  completedSets,
  totalSets,
  isOnline,
  isRecoveryMode,
  onFinish,
  children,
  restTimerNode,
  currentExercise,
  totalExercises,
}: ActiveSessionShellProps) {
  const [visionOpen, setVisionOpen] = useState(false);
  // Prevent accidental back-swipe / navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue ="";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const shellContent = (
    <div className="h-[100dvh] lg:h-full flex flex-col bg-[hsl(var(--m3-surface,var(--background)))] text-foreground relative overflow-hidden"style={{ overscrollBehaviorY:"none"}}>
      {/* Status bar safe area */}
      <div className="safe-top flex-shrink-0"/>

      {/* Compact Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-[hsl(var(--m3-surface,var(--background)))]/95 backdrop-blur-xl border-b border-border/20 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold truncate">{title}</h1>
              {isRecoveryMode && (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] h-5 shrink-0">
                   Recupero
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3"/>
                <span className="tabular-nums font-medium">{formatTime(elapsedSeconds)}</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {completedSets}/{totalSets} serie
              </span>
              {!isOnline && (
                <WifiOff className="h-3 w-3 text-amber-500"/>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Drawer open={visionOpen} onOpenChange={setVisionOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline"size="sm"className="h-8 px-2.5 text-xs gap-1">
                  <Video className="h-3.5 w-3.5"/>
                  <span className="hidden sm:inline">Analisi Video</span>
                  <span className="sm:hidden"></span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[95dvh] p-0">
                <BarPathCamera onClose={() => setVisionOpen(false)} />
              </DrawerContent>
            </Drawer>
            <HoldToFinishButton onFinish={onFinish} completedSets={completedSets} totalSets={totalSets} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"            style={{ width:`${progressPercent}%`}}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Floating rest timer */}
      {restTimerNode}
    </div>
  );

  return <ResponsivePhoneWrapper>{shellContent}</ResponsivePhoneWrapper>;
}
