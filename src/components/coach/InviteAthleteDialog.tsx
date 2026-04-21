import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const inviteFormSchema = z.object({
  firstName: z.string().min(1, "Il nome è obbligatorio"),
  lastName: z.string().min(1, "Il cognome è obbligatorio"),
  email: z.string().email("Indirizzo email non valido"),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface InviteAthleteDialogProps {
  onAthleteInvited?: () => void;
  trigger?: React.ReactNode;
}

export function InviteAthleteDialog({
  onAthleteInvited,
  trigger,
}: InviteAthleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Devi effettuare l'accesso per invitare atleti.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the invite token
      const { error } = await supabase.from("invite_tokens").insert({
        coach_id: user.id,
        email: data.email.toLowerCase().trim(),
        full_name: `${data.firstName} ${data.lastName}`,
      });

      if (error) {
        throw error;
      }

      // 2. Send invitation email via edge function
      const { data: emailResult, error: emailError } =
        await supabase.functions.invoke("send-email", {
          body: {
            to: data.email.toLowerCase().trim(),
            type: "invite",
            data: { coachName: profile?.full_name || "Il tuo Coach" },
          },
        });

      if (emailError) {
        console.warn("Email send failed, but invite was created:", emailError);
      }

      toast({
        title: "Invito inviato!",
        description: `Email di invito inviata a ${data.email}.`,
      });

      form.reset();
      setOpen(false);
      onAthleteInvited?.();
    } catch (error: any) {
      console.error("Error inviting athlete:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile invitare l'atleta. Riprova.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gradient-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Invita atleta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invita Atleta
          </DialogTitle>
          <DialogDescription>
            Invia un invito a un nuovo atleta per unirsi al tuo programma di
            coaching.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Mario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input placeholder="Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="mario.rossi@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gradient-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invia Invito
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
