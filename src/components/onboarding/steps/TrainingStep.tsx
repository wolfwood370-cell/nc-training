import { motion } from"framer-motion";
import { Label } from"@/components/ui/label";
import { RadioGroup, RadioGroupItem } from"@/components/ui/radio-group";
import { Slider } from"@/components/ui/slider";
import { Gauge, AlertTriangle, Check, HeartPulse } from"lucide-react";
import { TrainingData } from"@/types/onboarding";
import { cn } from"@/lib/utils";

interface TrainingStepProps {
  data: TrainingData;
  onUpdate: (data: TrainingData) => void;
}

const painAreas = [
  { id:'neck', label:'Collo'},
  { id:'shoulder', label:'Spalla'},
  { id:'lower_back', label:'Bassa Schiena'},
  { id:'knee', label:'Ginocchio'},
  { id:'ankle', label:'Caviglia'},
  { id:'none', label:'Nessuno'},
];

export function TrainingStep({ data, onUpdate }: TrainingStepProps) {
  const handlePainAreaToggle = (areaId: string) => {
    let newAreas: string[];
    
    if (areaId ==='none') {
      newAreas = data.painAreas.includes('none') ? [] : ['none'];
    } else {
      const filtered = data.painAreas.filter(a => a !=='none');
      if (filtered.includes(areaId)) {
        newAreas = filtered.filter(a => a !== areaId);
      } else {
        newAreas = [...filtered, areaId];
      }
    }
    
    onUpdate({ ...data, painAreas: newAreas });
  };

  const hasRedFlags = data.heartCondition === true || data.chestPain === true;

  const getRpeLabel = (value: number) => {
    if (value <= 3) return'Leggero';
    if (value <= 5) return'Moderato';
    if (value <= 7) return'Impegnativo';
    if (value <= 9) return'Molto duro';
    return'Massimale';
  };

  const getRpeColor = (value: number) => {
    if (value <= 3) return'text-success';
    if (value <= 5) return'text-blue-500';
    if (value <= 7) return'text-warning';
    return'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Training & Salute
        </h2>
        <p className="text-muted-foreground">
          Questi dati alimentano ACWR e valutazione FMS
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        {/* RPE Calibration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground"/>
            <Label className="text-sm font-medium">
              Su una scala 1-10, quanto deve essere duro un allenamento per sentirti soddisfatto?
            </Label>
          </div>
          
          <div className="px-2">
            <Slider
              value={[data.preferredRpe]}
              onValueChange={(value) => onUpdate({ ...data, preferredRpe: value[0] })}
              min={1}
              max={10}
              step={1}
              className="w-full"            />
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>1 (Facile)</span>
              <span className={cn("font-bold text-lg", getRpeColor(data.preferredRpe))}>
                {data.preferredRpe} - {getRpeLabel(data.preferredRpe)}
              </span>
              <span>10 (Max)</span>
            </div>
          </div>
        </div>

        {/* Pain Map */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Hai dolori attuali?</Label>
          
          <div className="grid grid-cols-3 gap-2">
            {painAreas.map((area) => {
              const isSelected = data.painAreas.includes(area.id);
              
              return (
                <motion.button
                  key={area.id}
                  type="button"                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePainAreaToggle(area.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all text-sm",
                    isSelected 
                      ? area.id ==='none'                        ?"border-success bg-success/5"                        :"border-warning bg-warning/5"                      :"border-border hover:border-primary/50"                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    isSelected 
                      ? area.id ==='none'                        ?"border-success bg-success"                        :"border-warning bg-warning"                      :"border-muted-foreground"                  )}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-white"/>}
                  </div>
                  <span className={cn(
                    "truncate",
                    isSelected && area.id !=='none'&&"text-warning"                  )}>{area.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* PAR-Q Questions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-muted-foreground"/>
            <Label className="text-sm font-medium">Domande PAR-Q (Red Flags)</Label>
          </div>

          {/* Heart Condition */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Il medico ti ha mai diagnosticato problemi cardiaci?
            </Label>
            
            <RadioGroup
              value={data.heartCondition === null ?'': data.heartCondition ?'yes':'no'}
              onValueChange={(value) => onUpdate({ ...data, heartCondition: value ==='yes'})}
              className="flex gap-3"            >
              {[
                { value:'yes', label:'Sì'},
                { value:'no', label:'No'},
              ].map((option) => (
                <div key={option.value} className="flex-1">
                  <RadioGroupItem
                    value={option.value}
                    id={`heart-${option.value}`}
                    className="peer sr-only"                  />
                  <Label
                    htmlFor={`heart-${option.value}`}
                    className={cn(
                      "flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                      "hover:border-primary/50"                    )}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Chest Pain */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Avverti dolore al petto sotto sforzo?
            </Label>
            
            <RadioGroup
              value={data.chestPain === null ?'': data.chestPain ?'yes':'no'}
              onValueChange={(value) => onUpdate({ ...data, chestPain: value ==='yes'})}
              className="flex gap-3"            >
              {[
                { value:'yes', label:'Sì'},
                { value:'no', label:'No'},
              ].map((option) => (
                <div key={option.value} className="flex-1">
                  <RadioGroupItem
                    value={option.value}
                    id={`chest-${option.value}`}
                    className="peer sr-only"                  />
                  <Label
                    htmlFor={`chest-${option.value}`}
                    className={cn(
                      "flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                      "hover:border-primary/50"                    )}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Red Flag Warning */}
        {hasRedFlags && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30"          >
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-medium text-destructive">
                 Certificato medico richiesto prima di iniziare
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Per la tua sicurezza, è necessario un certificato di idoneità sportiva prima di iniziare il programma di allenamento.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
