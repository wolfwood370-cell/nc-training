import { useState } from"react";
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { AthleteLayout } from"@/components/athlete/AthleteLayout";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Textarea } from"@/components/ui/textarea";
import { Badge } from"@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from"@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from"@/components/ui/select";
import {
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  Bone,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { supabase } from"@/integrations/supabase/client";
import { useAuth } from"@/hooks/useAuth";
import { toast } from"sonner";
import { format } from"date-fns";
import { it } from"date-fns/locale";

// Body zones for injury tracking
const bodyZones = [
  "Spalla Dx",
  "Spalla Sx",
  "Gomito Dx",
  "Gomito Sx",
  "Polso Dx",
  "Polso Sx",
  "Schiena Alta",
  "Schiena Bassa",
  "Anca Dx",
  "Anca Sx",
  "Ginocchio Dx",
  "Ginocchio Sx",
  "Caviglia Dx",
  "Caviglia Sx",
  "Collo",
  "Altro",
];

// FMS test definitions
const fmsTests = [
  { key:"deep_squat", name:"Deep Squat", bilateral: true },
  { key:"hurdle_step", name:"Hurdle Step", bilateral: false },
  { key:"inline_lunge", name:"Inline Lunge", bilateral: false },
  { key:"shoulder_mobility", name:"Shoulder Mobility", bilateral: false },
  { key:"active_straight_leg", name:"Active Straight Leg", bilateral: false },
  { key:"trunk_stability", name:"Trunk Stability", bilateral: true },
  { key:"rotary_stability", name:"Rotary Stability", bilateral: false },
] as const;

interface Injury {
  id: string;
  body_zone: string;
  description: string | null;
  injury_date: string;
  status:"in_rehab"|"recovered"|"chronic";
  notes: string | null;
}

interface FmsTest {
  id: string;
  test_date: string;
  deep_squat: number | null;
  hurdle_step_l: number | null;
  hurdle_step_r: number | null;
  inline_lunge_l: number | null;
  inline_lunge_r: number | null;
  shoulder_mobility_l: number | null;
  shoulder_mobility_r: number | null;
  active_straight_leg_l: number | null;
  active_straight_leg_r: number | null;
  trunk_stability: number | null;
  rotary_stability_l: number | null;
  rotary_stability_r: number | null;
  notes: string | null;
}

const statusConfig = {
  in_rehab: { label:"In Riabilitazione", color:"bg-warning text-warning-foreground", icon: Clock },
  recovered: { label:"Recuperato", color:"bg-success text-white", icon: CheckCircle2 },
  chronic: { label:"Cronico", color:"bg-destructive text-destructive-foreground", icon: AlertTriangle },
};

const getScoreColor = (score: number | null): string => {
  if (score === null) return"bg-secondary text-muted-foreground";
  if (score === 3) return"bg-success text-white";
  if (score === 2) return"bg-warning text-warning-foreground";
  return"bg-destructive text-destructive-foreground";
};

const getScoreBg = (score: number | null): string => {
  if (score === null) return"bg-secondary/50";
  if (score === 3) return"bg-success/10 border-success/30";
  if (score === 2) return"bg-warning/10 border-warning/30";
  return"bg-destructive/10 border-destructive/30";
};

export default function AthleteHealth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [injuryDialogOpen, setInjuryDialogOpen] = useState(false);
  const [fmsDialogOpen, setFmsDialogOpen] = useState(false);
  const [selectedFmsTest, setSelectedFmsTest] = useState<string | null>(null);
  
  // Form states
  const [newInjury, setNewInjury] = useState({
    body_zone:"",
    description:"",
    injury_date: new Date().toISOString().split("T")[0],
    status:"in_rehab"as const,
    notes:"",
  });
  
  const [fmsScores, setFmsScores] = useState<Record<string, number | null>>({});
  const [fmsNotes, setFmsNotes] = useState("");

  // Fetch injuries
  const { data: injuries = [], isLoading: loadingInjuries } = useQuery({
    queryKey: ["injuries", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("injuries")
        .select("*")
        .eq("athlete_id", user.id)
        .order("injury_date", { ascending: false });
      if (error) throw error;
      return data as Injury[];
    },
    enabled: !!user?.id,
  });

  // Today's date for FMS reset logic
  const today = new Date().toISOString().split("T")[0];
  
  // Fetch TODAY's FMS test only - reset if it's a new day
  const { data: todayFms } = useQuery({
    queryKey: ["fms-today", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("fms_tests")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("test_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as FmsTest | null;
    },
    enabled: !!user?.id,
  });
  
  // Fetch latest historical FMS test for display purposes (not for form state)
  const { data: latestFms } = useQuery({
    queryKey: ["fms-latest", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("fms_tests")
        .select("*")
        .eq("athlete_id", user.id)
        .order("test_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as FmsTest | null;
    },
    enabled: !!user?.id,
  });

  // Add injury mutation
  const addInjuryMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { error } = await supabase.from("injuries").insert({
        athlete_id: user.id,
        body_zone: newInjury.body_zone,
        description: newInjury.description || null,
        injury_date: newInjury.injury_date,
        status: newInjury.status,
        notes: newInjury.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["injuries"] });
      setInjuryDialogOpen(false);
      setNewInjury({
        body_zone:"",
        description:"",
        injury_date: new Date().toISOString().split("T")[0],
        status:"in_rehab",
        notes:"",
      });
      toast.success("Infortunio registrato");
    },
    onError: (error) => {
      console.error("Error adding injury:", error);
      toast.error("Errore nel salvataggio");
    },
  });

  // Add or Update FMS test mutation using UPSERT
  const addFmsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const today = new Date().toISOString().split("T")[0];
      
      // First, get the existing test for today to merge scores
      const { data: existingTest, error: fetchError } = await supabase
        .from("fms_tests")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("test_date", today)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error fetching existing FMS test:", fetchError);
        throw fetchError;
      }
      
      // Build the complete payload by merging existing data with new scores
      const payload = {
        athlete_id: user.id,
        test_date: today,
        // Start with existing values (or null)
        deep_squat: existingTest?.deep_squat ?? null,
        hurdle_step_l: existingTest?.hurdle_step_l ?? null,
        hurdle_step_r: existingTest?.hurdle_step_r ?? null,
        inline_lunge_l: existingTest?.inline_lunge_l ?? null,
        inline_lunge_r: existingTest?.inline_lunge_r ?? null,
        shoulder_mobility_l: existingTest?.shoulder_mobility_l ?? null,
        shoulder_mobility_r: existingTest?.shoulder_mobility_r ?? null,
        active_straight_leg_l: existingTest?.active_straight_leg_l ?? null,
        active_straight_leg_r: existingTest?.active_straight_leg_r ?? null,
        trunk_stability: existingTest?.trunk_stability ?? null,
        rotary_stability_l: existingTest?.rotary_stability_l ?? null,
        rotary_stability_r: existingTest?.rotary_stability_r ?? null,
        notes: fmsNotes || existingTest?.notes || null,
      };
      
      // Override with new scores (only those that are explicitly set in fmsScores)
      if (fmsScores.deep_squat !== undefined) payload.deep_squat = fmsScores.deep_squat;
      if (fmsScores.hurdle_step_l !== undefined) payload.hurdle_step_l = fmsScores.hurdle_step_l;
      if (fmsScores.hurdle_step_r !== undefined) payload.hurdle_step_r = fmsScores.hurdle_step_r;
      if (fmsScores.inline_lunge_l !== undefined) payload.inline_lunge_l = fmsScores.inline_lunge_l;
      if (fmsScores.inline_lunge_r !== undefined) payload.inline_lunge_r = fmsScores.inline_lunge_r;
      if (fmsScores.shoulder_mobility_l !== undefined) payload.shoulder_mobility_l = fmsScores.shoulder_mobility_l;
      if (fmsScores.shoulder_mobility_r !== undefined) payload.shoulder_mobility_r = fmsScores.shoulder_mobility_r;
      if (fmsScores.active_straight_leg_l !== undefined) payload.active_straight_leg_l = fmsScores.active_straight_leg_l;
      if (fmsScores.active_straight_leg_r !== undefined) payload.active_straight_leg_r = fmsScores.active_straight_leg_r;
      if (fmsScores.trunk_stability !== undefined) payload.trunk_stability = fmsScores.trunk_stability;
      if (fmsScores.rotary_stability_l !== undefined) payload.rotary_stability_l = fmsScores.rotary_stability_l;
      if (fmsScores.rotary_stability_r !== undefined) payload.rotary_stability_r = fmsScores.rotary_stability_r;
      
      
      
      // Upsert using the unique constraint on (athlete_id, test_date)
      const { error } = await supabase
        .from("fms_tests")
        .upsert(payload, { 
          onConflict:"athlete_id,test_date",
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error("Error upserting FMS test:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all FMS-related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["fms-latest"] });
      queryClient.invalidateQueries({ queryKey: ["fms-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["athlete-health-profile"] });
      setFmsDialogOpen(false);
      setFmsScores({});
      setFmsNotes("");
      toast.success("Test FMS salvato");
    },
    onError: (error: Error) => {
      console.error("FMS mutation error:", error);
      toast.error(`Errore nel salvataggio: ${error.message}`);
    },
  });

  // Update injury status mutation
  const updateInjuryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("injuries")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["injuries"] });
      toast.success("Stato aggiornato");
    },
  });

  // Get FMS score - prioritize today's test, fallback to latest for display
  const getFmsScore = (testKey: string): { left: number | null; right: number | null } | number | null => {
    // Use today's test if available, otherwise show latest historical
    const fmsSource = todayFms || latestFms;
    if (!fmsSource) return null;
    
    const test = fmsTests.find(t => t.key === testKey);
    if (!test) return null;
    
    if (test.bilateral) {
      return (fmsSource as any)[testKey] ?? null;
    }
    
    return {
      left: (fmsSource as any)[`${testKey}_l`] ?? null,
      right: (fmsSource as any)[`${testKey}_r`] ?? null,
    };
  };

  const openFmsTestDialog = (testKey: string) => {
    setSelectedFmsTest(testKey);
    // Pre-fill with TODAY's scores only - reset if it's a new day
    if (todayFms) {
      // Today's test exists - load those scores for editing
      const test = fmsTests.find(t => t.key === testKey);
      if (test?.bilateral) {
        setFmsScores({ [testKey]: (todayFms as any)[testKey] });
      } else {
        setFmsScores({
          [`${testKey}_l`]: (todayFms as any)[`${testKey}_l`],
          [`${testKey}_r`]: (todayFms as any)[`${testKey}_r`],
        });
      }
    } else {
      // No test for today - start fresh (reset logic)
      setFmsScores({});
    }
    setFmsDialogOpen(true);
  };

  const handleSaveFmsTest = () => {
    addFmsMutation.mutate();
  };

  return (
    <AthleteLayout>
      <div className="space-y-6 p-4 animate-fade-in">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-xl font-bold">Salute & Prevenzione</h1>
          <p className="text-sm text-muted-foreground">
            Monitora infortuni e mobilità funzionale
          </p>
        </div>

        {/* ===== INJURY TRACKER ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bone className="h-4 w-4 text-primary"/>
              Tracker Infortuni
            </h2>
            <Button
              size="sm"              variant="outline"              className="h-8 gap-1"              onClick={() => setInjuryDialogOpen(true)}
            >
              <Plus className="h-4 w-4"/>
              Aggiungi
            </Button>
          </div>

          {injuries.length === 0 ? (
            <Card className="border-0">
              <CardContent className="p-6 text-center">
                <HeartPulse className="h-10 w-10 mx-auto text-success mb-2"/>
                <p className="text-sm text-muted-foreground">Nessun infortunio registrato</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Ottimo! Continua così </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {injuries.map((injury) => {
                const StatusIcon = statusConfig[injury.status].icon;
                return (
                  <Card key={injury.id} className="border-0">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{injury.body_zone}</span>
                            <Badge className={cn("text-[10px] h-5", statusConfig[injury.status].color)}>
                              <StatusIcon className="h-3 w-3 mr-1"/>
                              {statusConfig[injury.status].label}
                            </Badge>
                          </div>
                          {injury.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{injury.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {format(new Date(injury.injury_date),"d MMM yyyy", { locale: it })}
                          </p>
                        </div>
                        <Select
                          value={injury.status}
                          onValueChange={(value) => updateInjuryMutation.mutate({ id: injury.id, status: value })}
                        >
                          <SelectTrigger className="w-auto h-7 text-xs border-0 bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_rehab">In Riabilitazione</SelectItem>
                            <SelectItem value="recovered">Recuperato</SelectItem>
                            <SelectItem value="chronic">Cronico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== FMS TESTS ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary"/>
                Test FMS
              </h2>
              {todayFms ? (
                <p className="text-[10px] text-success font-medium">
                   Test di oggi salvato
                </p>
              ) : latestFms ? (
                <p className="text-[10px] text-muted-foreground">
                  Ultimo: {format(new Date(latestFms.test_date),"d MMM yyyy", { locale: it })}
                </p>
              ) : null}
            </div>
            <Button
              size="sm"              variant="outline"              className="h-8 gap-1"              onClick={() => {
                setSelectedFmsTest(null);
                setFmsScores({});
                setFmsNotes("");
                setFmsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4"/>
              Nuovo Test
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {fmsTests.map((test) => {
              const score = getFmsScore(test.key);
              const isBilateral = test.bilateral;
              
              let displayScore: number | null = null;
              let leftScore: number | null = null;
              let rightScore: number | null = null;
              
              if (isBilateral) {
                displayScore = score as number | null;
              } else if (score && typeof score ==="object") {
                leftScore = score.left;
                rightScore = score.right;
                displayScore = leftScore !== null && rightScore !== null 
                  ? Math.min(leftScore, rightScore) 
                  : leftScore ?? rightScore;
              }

              return (
                <Card
                  key={test.key}
                  className={cn(
                    "border cursor-pointer active:scale-[0.98] transition-all",
                    getScoreBg(displayScore)
                  )}
                  onClick={() => openFmsTestDialog(test.key)}
                >
                  <CardContent className="p-3">
                    <p className="text-xs font-medium mb-2 line-clamp-1">{test.name}</p>
                    
                    {isBilateral ? (
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                        getScoreColor(displayScore)
                      )}>
                        {displayScore ??"—"}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground mb-0.5">L</p>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                            getScoreColor(leftScore)
                          )}>
                            {leftScore ??"—"}
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-muted-foreground mb-0.5">R</p>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                            getScoreColor(rightScore)
                          )}>
                            {rightScore ??"—"}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FMS Legend */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {[3, 2, 1, 0].map((score) => (
              <div key={score} className="flex items-center gap-1.5">
                <div className={cn("h-3 w-3 rounded-full", getScoreColor(score))} />
                <span className="text-[10px] text-muted-foreground">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== ADD INJURY DIALOG ===== */}
      <Dialog open={injuryDialogOpen} onOpenChange={setInjuryDialogOpen}>
        <DialogContent className="theme-athlete bg-background">
          <DialogHeader>
            <DialogTitle>Registra Infortunio</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli dell'infortunio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zona Corporea</Label>
              <Select
                value={newInjury.body_zone}
                onValueChange={(value) => setNewInjury(prev => ({ ...prev, body_zone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona zona"/>
                </SelectTrigger>
                <SelectContent>
                  {bodyZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data Infortunio</Label>
              <Input
                type="date"                value={newInjury.injury_date}
                onChange={(e) => setNewInjury(prev => ({ ...prev, injury_date: e.target.value }))}
                className="bg-secondary/50"              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Input
                placeholder="Es. Stiramento muscolare"                value={newInjury.description}
                onChange={(e) => setNewInjury(prev => ({ ...prev, description: e.target.value }))}
                className="bg-secondary/50"              />
            </div>
            
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Dettagli aggiuntivi..."                value={newInjury.notes}
                onChange={(e) => setNewInjury(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-secondary/50 min-h-[80px]"              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"              onClick={() => setInjuryDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={() => addInjuryMutation.mutate()}
              disabled={!newInjury.body_zone || addInjuryMutation.isPending}
              className="gradient-primary"            >
              {addInjuryMutation.isPending ?"Salvataggio...":"Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== FMS TEST DIALOG ===== */}
      <Dialog open={fmsDialogOpen} onOpenChange={setFmsDialogOpen}>
        <DialogContent className="theme-athlete bg-background max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFmsTest 
                ? fmsTests.find(t => t.key === selectedFmsTest)?.name 
                :"Nuovo Test FMS"}
            </DialogTitle>
            <DialogDescription>
              {selectedFmsTest 
                ?"Aggiorna il punteggio per questo test"                :"Inserisci i punteggi per tutti i test"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {(selectedFmsTest ? [fmsTests.find(t => t.key === selectedFmsTest)!] : fmsTests).map((test) => (
              <div key={test.key} className="space-y-2">
                <Label className="text-sm font-medium">{test.name}</Label>
                
                {test.bilateral ? (
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((score) => (
                      <Button
                        key={score}
                        type="button"                        variant="outline"                        className={cn(
                          "flex-1 h-12 text-lg font-bold",
                          fmsScores[test.key] === score && getScoreColor(score)
                        )}
                        onClick={() => setFmsScores(prev => ({ ...prev, [test.key]: score }))}
                      >
                        {score}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">L:</span>
                      <div className="flex gap-2 flex-1">
                        {[0, 1, 2, 3].map((score) => (
                          <Button
                            key={score}
                            type="button"                            variant="outline"                            className={cn(
                              "flex-1 h-10 text-sm font-bold",
                              fmsScores[`${test.key}_l`] === score && getScoreColor(score)
                            )}
                            onClick={() => setFmsScores(prev => ({ ...prev, [`${test.key}_l`]: score }))}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">R:</span>
                      <div className="flex gap-2 flex-1">
                        {[0, 1, 2, 3].map((score) => (
                          <Button
                            key={score}
                            type="button"                            variant="outline"                            className={cn(
                              "flex-1 h-10 text-sm font-bold",
                              fmsScores[`${test.key}_r`] === score && getScoreColor(score)
                            )}
                            onClick={() => setFmsScores(prev => ({ ...prev, [`${test.key}_r`]: score }))}
                          >
                            {score}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Osservazioni sul test..."                value={fmsNotes}
                onChange={(e) => setFmsNotes(e.target.value)}
                className="bg-secondary/50 min-h-[80px]"              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"              onClick={() => setFmsDialogOpen(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSaveFmsTest}
              disabled={addFmsMutation.isPending}
              className="gradient-primary"            >
              {addFmsMutation.isPending ?"Salvataggio...":"Salva Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AthleteLayout>
  );
}
