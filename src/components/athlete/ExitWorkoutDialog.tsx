import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ExitWorkoutDialogProps {
  open: boolean;
  elapsedTime: string;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const ExitWorkoutDialog = ({
  open,
  elapsedTime,
  onResume,
  onFinish,
  onDiscard,
  onOpenChange,
}: ExitWorkoutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl p-6 font-[Inter]">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-primary" />
          </div>

          <h2 className="font-[Manrope] font-bold text-xl text-foreground">
            Pause or End Workout?
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Your global timer is currently running at{" "}
            <span className="font-semibold text-foreground">{elapsedTime}</span>. What would you
            like to do?
          </p>

          <div className="w-full space-y-2 pt-2">
            <Button
              onClick={onResume}
              className="w-full h-12 rounded-xl font-[Manrope] font-semibold"
            >
              Resume Workout
            </Button>
            <Button
              onClick={onFinish}
              variant="secondary"
              className="w-full h-12 rounded-xl font-[Manrope] font-semibold bg-primary/10 text-foreground hover:bg-primary/15"
            >
              Finish &amp; Save Data
            </Button>
            <button
              onClick={onDiscard}
              className="w-full h-11 font-[Manrope] font-bold text-sm uppercase tracking-wider text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
            >
              Discard Workout
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitWorkoutDialog;
