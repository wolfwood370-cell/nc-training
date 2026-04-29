import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { triggerConfetti } from "@/utils/ux";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { LegalStep } from "@/components/onboarding/steps/LegalStep";
import { BiometricsStep } from "@/components/onboarding/steps/BiometricsStep";
import { YesNoQuestionList } from "@/components/onboarding/steps/YesNoQuestionList";
import { NeurotypResult } from "@/components/onboarding/NeurotypResult";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OnboardingData,
  defaultOnboardingData,
  NeurotypType,
  MEDICAL_QUESTIONS,
  ORTHOPEDIC_QUESTIONS,
  SPORTS_QUESTIONS,
  LIFESTYLE_QUESTIONS,
  GOALS_QUESTIONS,
  NEUROTYPING_QUESTIONS,
  analyzeOnboarding,
  YesNoIDK,
} from "@/types/onboarding";

const STEP_LABELS = [
  "Termini",
  "Biometria",
  "Sicurezza",
  "Ortopedia",
  "Sport",
  "Lifestyle",
  "Obiettivi",
  "Neurotype",
];
const TOTAL_STEPS = 8;
const STORAGE_KEY = "onboarding_state_draft";

interface SavedDraft {
  currentStep: number;
  data: OnboardingData;
  savedAt: string;
}

const allAnswered = (values: Record<string, YesNoIDK | null> | object): boolean =>
  Object.values(values as Record<string, YesNoIDK | null>).every((v) => v !== null && v !== undefined);

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dominantType, setDominantType] = useState<NeurotypType | null>(null);
  const [scores, setScores] = useState<Record<NeurotypType, number>>({ "1A": 0, "1B": 0, "2A": 0, "2B": 0, "3": 0 });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<SavedDraft | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Resume / restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft: SavedDraft = JSON.parse(raw);
        if (draft.currentStep > 1 || JSON.stringify(draft.data) !== JSON.stringify(defaultOnboardingData)) {
          setPendingDraft(draft);
          setShowResumeDialog(true);
          return;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (authLoading || user) return;

    toast({
      title: "Accesso richiesto",
      description: "Accedi prima di completare l'onboarding atleta.",
      variant: "destructive",
    });
    navigate("/auth", { replace: true });
  }, [authLoading, navigate, toast, user]);

  // Persist draft
  useEffect(() => {
    if (!initialized) return;
    const draft: SavedDraft = { currentStep, data, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [currentStep, data, initialized]);

  const handleResume = () => {
    if (pendingDraft) {
      setCurrentStep(pendingDraft.currentStep);
      setData(pendingDraft.data);
    }
    setShowResumeDialog(false);
    setPendingDraft(null);
    setInitialized(true);
  };

  const handleStartFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumeDialog(false);
    setPendingDraft(null);
    setInitialized(true);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.legal.termsAccepted;
      case 2:
        return Boolean(
          data.biometrics.gender &&
            data.biometrics.dateOfBirth &&
            data.biometrics.heightCm &&
            data.biometrics.weightKg
        );
      case 3:
        return allAnswered(data.medical);
      case 4:
        return allAnswered(data.orthopedic);
      case 5:
        return allAnswered(data.sports);
      case 6:
        return allAnswered(data.lifestyle);
      case 7:
        return allAnswered(data.goals);
      case 8:
        return allAnswered(data.neurotyping);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS) {
      const result = analyzeOnboarding(data);
      setDominantType(result.dominant_neurotype);
      setScores(result.neurotype_scores);
      setShowResult(true);
    } else {
      setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
    }
  };

  // Auto-trigger result when all 15 neurotyping questions are answered on step 8
  useEffect(() => {
    if (currentStep === TOTAL_STEPS && allAnswered(data.neurotyping) && !showResult && !dominantType) {
      const result = analyzeOnboarding(data);
      setDominantType(result.dominant_neurotype);
      setScores(result.neurotype_scores);
      setShowResult(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data.neurotyping), currentStep]);

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleComplete = async () => {
    if (isSubmitting) return;

    const result = analyzeOnboarding(data);
    const finalDominantType = dominantType ?? result.dominant_neurotype;

    if (!user) {
      toast({
        title: "Accesso richiesto",
        description: "Accedi prima di salvare il profilo e accedere alla dashboard.",
        variant: "destructive",
      });
      navigate("/auth", { replace: true });
      return;
    }

    if (!dominantType) {
      setDominantType(finalDominantType);
      setScores(result.neurotype_scores);
    }

    setIsSubmitting(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          neurotype: finalDominantType,
          onboarding_completed: true,
          onboarding_data: JSON.parse(JSON.stringify(data)),
          medical_clearance_required: result.red_flags.medical_clearance_required,
          fms_exclusion_zones: result.red_flags.fms_exclusion_zones,
          experience_level: result.experience_level,
          calibration_requirements: result.calibration_requirements,
          red_flags: JSON.parse(JSON.stringify(result.red_flags)),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Generate coach alerts for red flags
      const coachId = profile?.coach_id;
      if (coachId) {
        const alerts: Array<{
          coach_id: string;
          athlete_id: string;
          type: string;
          severity: string;
          message: string;
          link: string;
        }> = [];
        const link = `/coach/athletes/${user.id}`;
        const athleteName = profile?.full_name || "L'atleta";

        if (result.red_flags.medical_clearance_required) {
          alerts.push({
            coach_id: coachId,
            athlete_id: user.id,
            type: "medical_clearance",
            severity: "high",
            message: `${athleteName} ha completato il PAR-Q con risposte affermative — richiesta clearance medica prima di prescrivere alta intensità.`,
            link,
          });
        }
        if (result.red_flags.fms_exclusion_zones.length > 0) {
          alerts.push({
            coach_id: coachId,
            athlete_id: user.id,
            type: "fms_exclusion",
            severity: "medium",
            message: `${athleteName} riporta limitazioni ortopediche (${result.red_flags.fms_exclusion_zones.join(", ")}). Applica filtro FMS sul primo mesociclo.`,
            link,
          });
        }
        if (result.red_flags.reduced_systemic_volume) {
          alerts.push({
            coach_id: coachId,
            athlete_id: user.id,
            type: "reduced_volume",
            severity: "medium",
            message: `${athleteName} riporta stress alto o sonno scarso — considera MRV ridotto nei primi microcicli.`,
            link,
          });
        }
        if (result.expectation_management_flag) {
          alerts.push({
            coach_id: coachId,
            athlete_id: user.id,
            type: "expectation_management",
            severity: "medium",
            message: `${athleteName} si aspetta cambiamenti drastici in <12 settimane — pianifica gestione delle aspettative al primo check-in.`,
            link,
          });
        }
        if (result.calibration_requirements.length > 0) {
          alerts.push({
            coach_id: coachId,
            athlete_id: user.id,
            type: "calibration_required",
            severity: "medium",
            message: `${athleteName} richiede una settimana di calibrazione: test ${result.calibration_requirements.join(", ")}.`,
            link,
          });
        }

        if (alerts.length > 0) {
          const { error: alertsError } = await supabase.from("coach_alerts").insert(alerts);
          if (alertsError) console.error("coach_alerts insert error", alertsError);
        }
      }

      localStorage.removeItem(STORAGE_KEY);

      triggerConfetti();
      toast({
        title: "Onboarding completato!",
        description: "Profilo salvato. Il tuo Coach è stato notificato dei flag rilevanti.",
      });
      navigate("/athlete", { replace: true });
      window.setTimeout(() => {
        if (window.location.pathname === "/onboarding") {
          window.location.replace("/athlete");
        }
      }, 150);
    } catch (error: unknown) {
      console.error("[Onboarding] handleComplete failed:", error);
      const message = error instanceof Error ? error.message : "Si è verificato un errore. Riprova.";
      toast({
        title: "Errore nel salvataggio",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Dialog open={showResumeDialog} onOpenChange={(open) => { if (!open) handleStartFresh(); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Riprendere da dove eri rimasto?</DialogTitle>
            <DialogDescription>
              Abbiamo trovato un onboarding in corso (Step {pendingDraft?.currentStep ?? 1}/{TOTAL_STEPS}). Vuoi continuare?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleStartFresh}>Ricomincia</Button>
            <Button onClick={handleResume} className="gradient-primary">Riprendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="p-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gradient-primary">Athlete Onboarding</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Profilazione iniziale per il calcolo del programma personalizzato.
          </p>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {!showResult && (
            <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />
          )}

          <div className="mt-12">
            <AnimatePresence mode="wait">
              {showResult && dominantType ? (
                <NeurotypResult
                  key="result"
                  dominantType={dominantType}
                  scores={scores}
                  onContinue={handleComplete}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <motion.div key={currentStep}>
                  {currentStep === 1 && (
                    <LegalStep data={data.legal} onUpdate={(legal) => setData({ ...data, legal })} />
                  )}
                  {currentStep === 2 && (
                    <BiometricsStep
                      data={data.biometrics}
                      onUpdate={(biometrics) => setData({ ...data, biometrics })}
                    />
                  )}
                  {currentStep === 3 && (
                    <YesNoQuestionList
                      title="Sicurezza Medica (PAR-Q)"
                      subtitle="Rispondi con sincerità. Una risposta affermativa attiverà la richiesta di clearance medica al tuo Coach."
                      questions={MEDICAL_QUESTIONS}
                      values={data.medical}
                      onChange={(medical) => setData({ ...data, medical })}
                      invertColors
                    />
                  )}
                  {currentStep === 4 && (
                    <YesNoQuestionList
                      title="Anamnesi Ortopedica"
                      subtitle="Identifichiamo le aree da proteggere nel primo mesociclo."
                      questions={ORTHOPEDIC_QUESTIONS}
                      values={data.orthopedic}
                      onChange={(orthopedic) => setData({ ...data, orthopedic })}
                      invertColors
                    />
                  )}
                  {currentStep === 5 && (
                    <YesNoQuestionList
                      title="Background Sportivo & Tecnica"
                      subtitle="Determiniamo il tuo livello tecnico per scegliere strumenti, esercizi e tipo di progressione."
                      questions={SPORTS_QUESTIONS}
                      values={data.sports}
                      onChange={(sports) => setData({ ...data, sports })}
                    />
                  )}
                  {currentStep === 6 && (
                    <YesNoQuestionList
                      title="Lifestyle, Stress, Sonno & Nutrizione"
                      subtitle="Modula il volume sostenibile (MRV) e il TDEE."
                      questions={LIFESTYLE_QUESTIONS}
                      values={data.lifestyle}
                      onChange={(lifestyle) => setData({ ...data, lifestyle })}
                    />
                  )}
                  {currentStep === 7 && (
                    <YesNoQuestionList
                      title="Obiettivi & Aspettative"
                      subtitle="Definisce il focus del macrociclo e l'eventuale settimana di calibrazione."
                      questions={GOALS_QUESTIONS}
                      values={data.goals}
                      onChange={(goals) => setData({ ...data, goals })}
                    />
                  )}
                  {currentStep === 8 && (
                    <YesNoQuestionList
                      title="Neurotyping"
                      subtitle="15 affermazioni sul tuo modo di allenarti. Determina il tuo neurotipo dominante."
                      questions={NEUROTYPING_QUESTIONS}
                      values={data.neurotyping}
                      onChange={(neurotyping) => setData({ ...data, neurotyping })}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {!showResult && (
        <footer className="p-6 border-t border-border bg-card/50">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Indietro
            </Button>
            <Button onClick={handleNext} disabled={!canProceed()} className="gradient-primary">
              {currentStep === TOTAL_STEPS ? (
                <>Calcola Neurotipo <ArrowRight className="h-4 w-4 ml-2" /></>
              ) : (
                <>Avanti <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        </footer>
      )}

      {isSubmitting && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
