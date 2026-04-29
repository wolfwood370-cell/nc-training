import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import { LegalConsent } from "@/types/onboarding";

interface LegalStepProps {
  data: LegalConsent;
  onUpdate: (data: LegalConsent) => void;
}

export function LegalStep({ data, onUpdate }: LegalStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Sicurezza & Termini</h2>
        <p className="text-muted-foreground text-sm">
          Prima di iniziare, leggi e accetta i termini di servizio e la liberatoria medico-sportiva.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6 space-y-4 text-sm">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 leading-relaxed text-muted-foreground">
                <p>
                  <strong className="text-foreground">Liberatoria medico-sportiva.</strong> L'attività fisica intensa
                  comporta rischi. Confermo di essere idoneo/a all'attività fisica e che, in caso di dubbi medici,
                  consulterò il mio medico curante prima di iniziare il programma.
                </p>
                <p>
                  <strong className="text-foreground">Termini di servizio.</strong> Accetto che le indicazioni fornite
                  da NC Personal Trainer sono di carattere educativo e prestazionale, non sostituiscono diagnosi o
                  prescrizioni mediche, e che la responsabilità dell'esecuzione resta in capo all'atleta.
                </p>
                <p>
                  <strong className="text-foreground">Trattamento dati.</strong> Acconsento al trattamento dei dati
                  biometrici, di allenamento e nutrizionali per la personalizzazione del programma da parte del mio
                  Coach.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t border-border">
              <Checkbox
                id="terms-accepted"
                checked={data.termsAccepted}
                onCheckedChange={(checked) =>
                  onUpdate({ ...data, termsAccepted: checked === true })
                }
                className="mt-0.5"
              />
              <Label htmlFor="terms-accepted" className="text-sm leading-relaxed cursor-pointer">
                Confermo di aver letto, compreso e accettato integralmente i termini di servizio e la liberatoria
                medico-sportiva. <span className="text-destructive">*</span>
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
