import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, ArrowRight, Check } from "lucide-react";
import { NeurotypType, NEUROTYPE_LABELS as neurotypLabels } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface NeurotypResultProps {
  dominantType: NeurotypType;
  scores: Record<NeurotypType, number>;
  onContinue: () => void;
  isSubmitting: boolean;
}

const typeColors: Record<NeurotypType, string> = {
  '1A': 'from-red-500 to-orange-500',
  '1B': 'from-orange-500 to-yellow-500',
  '2A': 'from-green-500 to-teal-500',
  '2B': 'from-blue-500 to-indigo-500',
  '3': 'from-purple-500 to-pink-500',
};

const typeEmojis: Record<NeurotypType, string> = {
  '1A': '🔥',
  '1B': '⚡',
  '2A': '🌊',
  '2B': '💎',
  '3': '🎯',
};

export function NeurotypResult({ dominantType, scores, onContinue, isSubmitting }: NeurotypResultProps) {
  const { name, description } = neurotypLabels[dominantType];
  const maxScore = Math.max(...Object.values(scores));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 text-center"
    >
      {/* Celebration Header */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 mb-4"
        >
          <Check className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Profilo Completato!</span>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-2">
            Il tuo Neurotipo Dominante è:
          </h2>
        </motion.div>
      </div>

      {/* Main Result Card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="max-w-md mx-auto"
      >
        <Card className="relative overflow-hidden border-2 border-primary/30">
          <div className={cn(
            "absolute inset-0 opacity-10 bg-gradient-to-br",
            typeColors[dominantType]
          )} />
          
          <CardHeader className="relative pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
              className="text-6xl mb-4"
            >
              {typeEmojis[dominantType]}
            </motion.div>
            
            <CardTitle className={cn(
              "text-2xl bg-gradient-to-r bg-clip-text text-transparent",
              typeColors[dominantType]
            )}>
              {name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative">
            <CardDescription className="text-base leading-relaxed mb-6">
              {description}
            </CardDescription>

            {/* Score Breakdown */}
            <div className="space-y-2">
              {(Object.entries(scores) as [NeurotypType, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([type, score], index) => {
                  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                  const isDominant = type === dominantType;
                  
                  return (
                    <motion.div
                      key={type}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span className={cn(
                        "text-xs font-mono w-8",
                        isDominant ? "text-primary font-bold" : "text-muted-foreground"
                      )}>
                        {type}
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r",
                            isDominant ? typeColors[type] : "from-muted-foreground/50 to-muted-foreground/30"
                          )}
                        />
                      </div>
                      <span className={cn(
                        "text-xs w-8 text-right tabular-nums",
                        isDominant ? "text-primary font-bold" : "text-muted-foreground"
                      )}>
                        {score}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <Button
          onClick={onContinue}
          disabled={isSubmitting}
          size="lg"
          className="gradient-primary text-lg px-8 py-6"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
              </motion.div>
              Salvataggio...
            </>
          ) : (
            <>
              Vai alla Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
