import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BiometricsData } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface BiometricsStepProps {
  data: BiometricsData;
  onUpdate: (data: BiometricsData) => void;
}

export function BiometricsStep({ data, onUpdate }: BiometricsStepProps) {

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          I tuoi dati biometrici
        </h2>
        <p className="text-muted-foreground">
          Questi dati ci aiutano a personalizzare il tuo programma
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Gender Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Genere</Label>
          <RadioGroup
            value={data.gender || ""}
            onValueChange={(value) =>
              onUpdate({ ...data, gender: value as BiometricsData["gender"] })
            }
            className="flex gap-3"
          >
            {[
              { value: "male", label: "Maschio" },
              { value: "female", label: "Femmina" },
              { value: "other", label: "Altro" },
            ].map((option) => (
              <div key={option.value} className="flex-1">
                <RadioGroupItem
                  value={option.value}
                  id={`gender-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`gender-${option.value}`}
                  className={cn(
                    "flex items-center justify-center px-4 py-3 rounded-lg border-2 cursor-pointer transition-all",
                    "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                    "hover:border-primary/50",
                  )}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dob" className="text-sm font-medium">
            Data di nascita
          </Label>
          <Input
            id="dob"
            type="date"
            value={data.dateOfBirth || ""}
            onChange={(e) => onUpdate({ ...data, dateOfBirth: e.target.value })}
            className="bg-card"
          />
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="height" className="text-sm font-medium">
              Altezza (cm)
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={data.heightCm || ""}
              onChange={(e) =>
                onUpdate({
                  ...data,
                  heightCm: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium">
              Peso (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70"
              value={data.weightKg || ""}
              onChange={(e) =>
                onUpdate({
                  ...data,
                  weightKg: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="bg-card"
            />
          </div>
        </div>

        {/* Wearables */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Watch className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">
              Quali dispositivi indossi quotidianamente?
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {wearableOptions.map((wearable) => {
              const isSelected = data.wearables.includes(wearable.id);

              return (
                <motion.button
                  key={wearable.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWearableToggle(wearable.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all text-sm",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground",
                    )}
                  >
                    {isSelected && (
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <span className="truncate">{wearable.label}</span>
                  {wearable.autoSync && isSelected && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-success text-success-foreground"
                    >
                      Sync
                    </Badge>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Auto-sync badge */}
          {hasAutoSyncDevice && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/10 border border-success/30"
            >
              <Check className="h-5 w-5 text-success" />
              <span className="text-sm text-success font-medium">
                Morning Readiness Auto-Sync enabled
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
