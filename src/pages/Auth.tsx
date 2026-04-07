import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dumbbell, Users } from "lucide-react";
import { mapSupabaseError } from "@/lib/errorMapping";
import { MetaHead } from "@/components/MetaHead";
import { Footer } from "@/components/layout/Footer";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<"coach" | "athlete">("athlete");

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast.error("Inserisci la tua email prima di procedere");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email di recupero inviata! Controlla la tua casella di posta.");
    } catch (error: any) {
      toast.error(mapSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { user } = await signIn(loginEmail, loginPassword);
      toast.success("Login effettuato!");
      
      // Navigate based on role will be handled by auth state change
      navigate("/");
    } catch (error: any) {
      toast.error(mapSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signUp(signupEmail, signupPassword, signupName, signupRole);
      toast.success("Account creato! Benvenuto!");
      
      // Navigate based on role
      navigate(signupRole === "coach" ? "/coach" : "/athlete");
    } catch (error: any) {
      toast.error(mapSupabaseError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <MetaHead title="Accedi" description="Accedi o registrati alla piattaforma CoachHub." />
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">CoachHub</CardTitle>
          <CardDescription>
            Piattaforma per coaching ibrido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="signup">Registrati</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="coach@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? "Accesso in corso..." : "Accedi"}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Password dimenticata?
                </button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Mario Rossi"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="mario@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Sono un...</Label>
                  <RadioGroup
                    value={signupRole}
                    onValueChange={(v) => setSignupRole(v as "coach" | "athlete")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="role-coach"
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        signupRole === "coach"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="coach" id="role-coach" className="sr-only" />
                      <Users className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-sm font-medium">Coach</span>
                    </Label>
                    <Label
                      htmlFor="role-athlete"
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        signupRole === "athlete"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value="athlete" id="role-athlete" className="sr-only" />
                      <Dumbbell className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-sm font-medium">Atleta</span>
                    </Label>
                  </RadioGroup>
                </div>
                
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? "Creazione account..." : "Crea account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
    </>
  );
}
