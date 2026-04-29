import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { YesNoIDK, YesNoQuestion } from "@/types/onboarding";

interface YesNoQuestionListProps<T> {
  title: string;
  subtitle?: string;
  questions: YesNoQuestion[];
  values: T;
  onChange: (values: T) => void;
  /** When true, "no" answers are highlighted as positive (green) and "yes" as negative (red).
   *  Used for risk-style questionnaires (PAR-Q, Orthopedic) where a "yes" indicates a red flag. */
  invertColors?: boolean;
}

const OPTIONS: { value: YesNoIDK; label: string }[] = [
  { value: "yes", label: "Sì" },
  { value: "no", label: "No" },
  { value: "idk", label: "Non lo so" },
];

export function YesNoQuestionList<T>({
  title,
  subtitle,
  questions,
  values,
  onChange,
  invertColors = false,
}: YesNoQuestionListProps<T>) {
  const yesClass = invertColors
    ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
    : "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  const noClass = invertColors
    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm max-w-xl mx-auto">{subtitle}</p>}
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {questions.map((q, index) => {
          const current = (values as any)[q.id] as YesNoIDK | null;
          return (
            <Card key={q.id} className={cn("transition-colors", current ? "border-primary/30" : "border-border")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums mt-0.5">
                    {index + 1}.
                  </span>
                  <p className="text-sm leading-relaxed text-foreground flex-1">{q.text}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pl-6">
                  {OPTIONS.map((opt) => {
                    const selected = current === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange({ ...values, [q.id]: opt.value })}
                        className={cn(
                          "px-3 py-2 rounded-md border-2 text-sm font-medium transition-all",
                          selected
                            ? opt.value === "yes"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : opt.value === "no"
                              ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
}
