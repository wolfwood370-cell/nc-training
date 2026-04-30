import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Save, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { CoachLayout } from "@/components/coach/CoachLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMovementStore } from "@/stores/useMovementStore";
import { useSaveAssessment, SaveAssessmentError } from "@/hooks/useSaveAssessment";
import {
  FMS_TESTS,
  FMS_CLEARING_TESTS,
  type FmsScore,
  type FmsTestId,
  type Side,
  type NullableScore,
} from "@/types/movement";

// ---------------------------------------------------------------------------
// Score Selector — large tap targets, color-coded
// ---------------------------------------------------------------------------

const SCORE_OPTIONS: FmsScore[] = [0, 1, 2, 3];

function scoreClasses(score: FmsScore, selected: boolean): string {
  if (!selected) {
    return "bg-muted/40 text-muted-foreground hover:bg-muted border-border";
  }
  switch (score) {
    case 0:
      return "bg-rose-600 text-white border-rose-600 shadow-sm";
    case 1:
      return "bg-rose-500/90 text-white border-rose-500 shadow-sm";
    case 2:
      return "bg-amber-500 text-white border-amber-500 shadow-sm";
    case 3:
      return "bg-emerald-600 text-white border-emerald-600 shadow-sm";
  }
}

function ScoreSelector({
  value,
  onChange,
  ariaLabel,
}: {
  value: NullableScore;
  onChange: (score: FmsScore) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="grid grid-cols-4 gap-2"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {SCORE_OPTIONS.map((s) => {
        const selected = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s)}
            className={cn(
              "h-14 rounded-lg border-2 font-bold text-xl transition-all",
              "active:scale-95 touch-manipulation",
              scoreClasses(s, selected),
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test Card
// ---------------------------------------------------------------------------

function TestCard({
  testId,
}: {
  testId: FmsTestId;
}) {
  const def = FMS_TESTS.find((t) => t.id === testId)!;
  const test = useMovementStore((s) => s.assessment?.tests[testId]);
  const setScore = useMovementStore((s) => s.setScore);

  if (!test) return null;

  const isRedFlag =
    (test.kind === "bilateral" && test.score === 0) ||
    (test.kind === "asymmetrical" &&
      (test.leftScore === 0 || test.rightScore === 0));

  return (
    <Card
      className={cn(
        "transition-colors",
        isRedFlag && "border-rose-500/70 ring-1 ring-rose-500/30",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              {def.displayName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {def.bodyArea}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wider shrink-0"
          >
            {def.kind === "bilateral" ? "Bilaterale" : "Asimmetrico"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {test.kind === "bilateral" ? (
          <ScoreSelector
            value={test.score}
            onChange={(s) => setScore(testId, null, s)}
            ariaLabel={`Score ${def.displayName}`}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Sinistra
              </Label>
              <ScoreSelector
                value={test.leftScore}
                onChange={(s) => setScore(testId, "left" as Side, s)}
                ariaLabel={`${def.displayName} sinistra`}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Destra
              </Label>
              <ScoreSelector
                value={test.rightScore}
                onChange={(s) => setScore(testId, "right" as Side, s)}
                ariaLabel={`${def.displayName} destra`}
              />
            </div>
          </div>
        )}

        {def.gatedBy && (
          <p className="text-[11px] text-muted-foreground italic">
            ⚠ Gated dal clearing test:{" "}
            {FMS_CLEARING_TESTS.find((c) => c.id === def.gatedBy)?.displayName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Clearing Test Card
// ---------------------------------------------------------------------------

function ClearingTestsCard() {
  const clearing = useMovementStore((s) => s.assessment?.clearingTests);
  const setClearingTestPain = useMovementStore((s) => s.setClearingTestPain);

  if (!clearing) return null;

  const anyPain = FMS_CLEARING_TESTS.some((t) => clearing[t.id]?.hasPain);

  return (
    <Card
      className={cn(
        "transition-colors",
        anyPain && "border-rose-500/70 ring-1 ring-rose-500/30",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base font-semibold">
            Clearing Tests
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Un risultato positivo (dolore) forza a 0 il punteggio del pattern
          collegato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {FMS_CLEARING_TESTS.map((ct) => {
          const hasPain = clearing[ct.id]?.hasPain ?? false;
          return (
            <div
              key={ct.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-colors",
                hasPain
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-border bg-muted/30",
              )}
            >
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`ct-${ct.id}`}
                  className="text-sm font-medium block"
                >
                  {ct.displayName}
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Gates: {FMS_TESTS.find((t) => t.id === ct.gates)?.displayName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    hasPain ? "text-rose-600" : "text-muted-foreground",
                  )}
                >
                  {hasPain ? "Pain" : "OK"}
                </span>
                <Switch
                  id={`ct-${ct.id}`}
                  checked={hasPain}
                  onCheckedChange={(v) => setClearingTestPain(ct.id, v)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Athlete picker
// ---------------------------------------------------------------------------

function useCoachAthletes(coachId: string | undefined) {
  return useQuery({
    queryKey: ["coach-athletes-fms", coachId],
    queryFn: async () => {
      if (!coachId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("coach_id", coachId)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!coachId,
  });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FmsScreening() {
  const { user, profile } = useAuth();
  const coachId = user?.id;

  const { data: athletes = [], isLoading: loadingAthletes } =
    useCoachAthletes(coachId);

  const assessment = useMovementStore((s) => s.assessment);
  const startAssessment = useMovementStore((s) => s.startAssessment);
  const resetAssessment = useMovementStore((s) => s.resetAssessment);
  const getFinalScore = useMovementStore((s) => s.getFinalScore);
  const serialize = useMovementStore((s) => s.serialize);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [generalNotes, setGeneralNotesLocal] = useState("");
  const setGeneralNotes = useMovementStore((s) => s.setGeneralNotes);

  const saveMutation = useSaveAssessment();

  // Recompute composite on every render (cheap; store getter)
  const composite = assessment ? getFinalScore() : null;

  // Auto-start a session whenever the coach picks a new athlete
  useEffect(() => {
    if (!coachId || !selectedAthleteId) return;
    if (assessment?.athleteId === selectedAthleteId) return;
    startAssessment({ athleteId: selectedAthleteId, coachId });
    setGeneralNotesLocal("");
  }, [selectedAthleteId, coachId, assessment?.athleteId, startAssessment]);

  const handleSave = async () => {
    setGeneralNotes(generalNotes);
    const draft = serialize();
    if (!draft) {
      toast.error("Nessuna valutazione attiva");
      return;
    }
    try {
      await saveMutation.mutateAsync(draft);
      toast.success(
        composite?.isComplete
          ? `Valutazione salvata · Totale ${composite.total}/21`
          : "Progresso salvato",
      );
      resetAssessment();
      setSelectedAthleteId("");
    } catch (e) {
      if (e instanceof SaveAssessmentError) {
        toast.error(e.message);
      } else {
        toast.error("Errore nel salvataggio della valutazione");
      }
    }
  };

  const handleReset = () => {
    resetAssessment();
    setSelectedAthleteId("");
    setGeneralNotesLocal("");
  };

  const selectedAthleteName = useMemo(
    () => athletes.find((a) => a.id === selectedAthleteId)?.full_name ?? "",
    [athletes, selectedAthleteId],
  );

  return (
    <CoachLayout
      title="Movement Screen"
      subtitle="Functional Movement Screen — valutazione clinica"
    >
      <div className="mx-auto max-w-2xl px-4 py-4 pb-32 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              FMS Screening
            </h1>
            <p className="text-xs text-muted-foreground">
              Valutazione on-the-floor · 7 test + 3 clearing
            </p>
          </div>
        </div>

        {/* Athlete picker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Atleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedAthleteId}
              onValueChange={setSelectedAthleteId}
              disabled={loadingAthletes}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue
                  placeholder={
                    loadingAthletes
                      ? "Caricamento atleti…"
                      : "Seleziona un atleta"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {athletes.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="py-3">
                    {a.full_name ?? "Atleta senza nome"}
                  </SelectItem>
                ))}
                {athletes.length === 0 && !loadingAthletes && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nessun atleta disponibile
                  </div>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!assessment && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Seleziona un atleta per iniziare la valutazione FMS.
            </CardContent>
          </Card>
        )}

        {assessment && (
          <>
            {/* 7 FMS Tests */}
            <div className="space-y-3">
              {FMS_TESTS.map((t) => (
                <TestCard key={t.id} testId={t.id} />
              ))}
            </div>

            <Separator className="my-2" />

            {/* Clearing Tests */}
            <ClearingTestsCard />

            {/* General Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Note Generali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotesLocal(e.target.value)}
                  placeholder="Osservazioni cliniche, compensi, asimmetrie…"
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sticky bottom action bar */}
      {assessment && (
        <div className="fixed bottom-0 inset-x-0 lg:left-64 border-t bg-background/95 backdrop-blur-sm z-40 px-4 py-3 safe-area-pb">
          <div className="mx-auto max-w-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedAthleteName || "Atleta"}
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    composite?.hasRedFlags
                      ? "text-rose-600"
                      : composite?.isComplete
                        ? "text-emerald-600"
                        : "text-foreground",
                  )}
                >
                  {composite?.total ?? "—"}
                </span>
                <span className="text-sm text-muted-foreground">/ 21</span>
                {composite?.isComplete && !composite.hasRedFlags && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-1" />
                )}
                {composite?.hasRedFlags && (
                  <AlertTriangle className="h-4 w-4 text-rose-600 ml-1" />
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              disabled={saveMutation.isPending}
              className="h-12 w-12 shrink-0"
              aria-label="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="h-12 px-6 shrink-0 font-semibold"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              {saveMutation.isPending ? "Salvataggio…" : "Salva"}
            </Button>
          </div>
        </div>
      )}
    </CoachLayout>
  );
}
