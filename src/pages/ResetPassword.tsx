import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { MetaHead } from "@/components/MetaHead";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for recovery token
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    if (password.length < 6) {
      toast.error("La password deve avere almeno 6 caratteri");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password aggiornata con successo!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Errore durante il reset della password");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <>
        <MetaHead title="Reset Password" description="Reimposta la tua password." />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Link non valido</CardTitle>
              <CardDescription>
                Il link di recupero password non è valido o è scaduto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/auth")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaHead title="Nuova Password" description="Imposta la tua nuova password." />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Nuova Password</CardTitle>
            <CardDescription>
              Inserisci la tua nuova password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? "Aggiornamento..." : "Aggiorna password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
