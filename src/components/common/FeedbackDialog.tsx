import { useState } from"react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Textarea } from"@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from"@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from"@/components/ui/form";
import { MessageSquarePlus, Loader2 } from"lucide-react";
import { supabase } from"@/integrations/supabase/client";
import { useAuth } from"@/hooks/useAuth";
import { toast } from"sonner";
import { useForm } from"react-hook-form";
import { zodResolver } from"@hookform/resolvers/zod";
import { z } from"zod";

const CATEGORIES = [
  { value:"bug", label:"Bug / Problema"},
  { value:"feature_request", label:"Suggerimento"},
  { value:"billing", label:"Fatturazione"},
  { value:"other", label:"Altro"},
] as const;

const feedbackSchema = z.object({
  category: z.enum(["bug","feature_request","billing","other"]),
  message: z.string().trim().min(10,"Il messaggio deve contenere almeno 10 caratteri").max(2000,"Massimo 2000 caratteri"),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

function collectMetadata() {
  const isPwa = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;
  return {
    url: window.location.pathname,
    userAgent: navigator.userAgent,
    screenSize:`${window.innerWidth}x${window.innerHeight}`,
    pwaMode: isPwa,
    timestamp: new Date().toISOString(),
  };
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { category:"bug", message:""},
  });

  const isSubmitting = form.formState.isSubmitting;

  const COOLDOWN_MS = 60_000;
  const LS_KEY ="last_feedback_timestamp";

  const onSubmit = async (values: FeedbackFormValues) => {
    if (!user?.id) {
      toast.error("Devi essere loggato per inviare feedback");
      return;
    }
    if (!navigator.onLine) {
      toast.error("Sei offline. Riprova quando torni online.");
      return;
    }

    const lastTs = Number(localStorage.getItem(LS_KEY) || 0);
    const elapsed = Date.now() - lastTs;
    if (elapsed < COOLDOWN_MS) {
      const secsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      toast.error(`Attendi ancora ${secsLeft} secondi prima di inviare un altro feedback.`);
      return;
    }

    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        category: values.category,
        message: values.message,
        metadata: collectMetadata(),
      } as any);

      if (error) throw error;

      localStorage.setItem(LS_KEY, String(Date.now()));

      toast.success("Feedback inviato! Grazie per il tuo contributo");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Non siamo riusciti a inviare il feedback, riprova più tardi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline"className="gap-2">
            <MessageSquarePlus className="h-4 w-4"/>
            Help & Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary"/>
            Invia Feedback
          </DialogTitle>
          <DialogDescription>
            Segnala un bug, suggerisci una funzionalità o contattaci.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="category"              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"              render={({ field }) => (
                <FormItem>
                  <FormLabel>Messaggio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descrivi il problema o il suggerimento (min. 10 caratteri)..."                      rows={4}
                      className="resize-none"                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-[10px] text-muted-foreground">
                    Informazioni del browser e della pagina verranno incluse automaticamente.
                  </p>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button"variant="outline"onClick={() => setOpen(false)} disabled={isSubmitting}>
                Annulla
              </Button>
              <Button type="submit"disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                ) : (
                  <MessageSquarePlus className="h-4 w-4 mr-2"/>
                )}
                Invia
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
