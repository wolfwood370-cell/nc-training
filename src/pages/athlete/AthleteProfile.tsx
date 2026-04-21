import { useState, useRef, forwardRef } from"react";
import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { useNavigate } from"react-router-dom";
import { useTheme } from"next-themes";
import { AthleteLayout } from"@/components/athlete/AthleteLayout";
import { ThemeCustomizationCard } from"@/components/athlete/ThemeCustomizationCard";
import { BadgeGrid } from"@/components/athlete/gamification/BadgeGrid";
import { ConsistencyRings } from"@/components/athlete/gamification/ConsistencyRings";
import { TrainingHeatmap } from"@/components/athlete/gamification/TrainingHeatmap";
import { supabase } from"@/integrations/supabase/client";
import { useAuth } from"@/hooks/useAuth";
import { useGamification } from"@/hooks/useGamification";
import { useAthleteSubscription } from"@/hooks/useBillingPlans";
import { Card, CardContent } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { Switch } from"@/components/ui/switch";
import { Badge } from"@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from"@/components/ui/avatar";
import { Skeleton } from"@/components/ui/skeleton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from"@/components/ui/drawer";
import { toast } from"sonner";
import {
  Camera,
  Flame,
  Trophy,
  Medal,
  Award,
  LogOut,
  Moon,
  Bell,
  CreditCard,
  ChevronRight,
  Scale,
  Ruler,
  TrendingUp,
  Loader2,
  Dumbbell,
  CheckCircle,
  XCircle,
  MessageSquarePlus,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { FeedbackDialog } from"@/components/common/FeedbackDialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from"recharts";

// PR Card component
const PRCard = forwardRef<HTMLDivElement, {
  exercise: string;
  weight: number;
  rank: 1 | 2 | 3;
}>(function PRCard({ exercise, weight, rank }, ref) {
  const colors = {
    1:"from-amber-400 to-yellow-500",
    2:"from-slate-300 to-slate-400",
    3:"from-amber-600 to-amber-700",
  };
  const icons = {
    1: Trophy,
    2: Medal,
    3: Award,
  };
  const Icon = icons[rank];

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-br",
        colors[rank],
        "shadow-lg"      )}
    >
      <div className="absolute top-2 right-2 opacity-20">
        <Icon className="h-12 w-12 text-white"/>
      </div>
      <div className="relative z-10">
        <p className="text-xs font-medium text-white/80 uppercase tracking-wide">
          {exercise}
        </p>
        <p className="text-2xl font-bold text-white mt-1">{weight} kg</p>
      </div>
    </div>
  );
});

// Settings row component
const SettingsRow = forwardRef<HTMLButtonElement, {
  icon: React.ElementType;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  toggle?: boolean;
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
}>(function SettingsRow(
  { icon: Icon, label, value, onClick, danger, toggle, checked, onToggle },
  ref
) {
  return (
    <button
      ref={ref}
      onClick={toggle ? undefined : onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
        "bg-card/50 backdrop-blur-sm border border-border/50",
        !toggle &&"active:bg-muted/50",
        danger &&"text-destructive"      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          danger ?"bg-destructive/10":"bg-primary/10"        )}
      >
        <Icon
          className={cn("h-5 w-5", danger ?"text-destructive":"text-primary")}
        />
      </div>
      <div className="flex-1 text-left">
        <p className={cn("font-medium", danger &&"text-destructive")}>
          {label}
        </p>
        {value && (
          <p className="text-sm text-muted-foreground">{value}</p>
        )}
      </div>
      {toggle ? (
        <Switch checked={checked} onCheckedChange={onToggle} />
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground"/>
      )}
    </button>
  );
});

export default function AthleteProfile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [tempWeight, setTempWeight] = useState("");
  const [tempHeight, setTempHeight] = useState("");
  const [notifications, setNotifications] = useState(true);

  // Get gamification data for streak
  const gamification = useGamification(user?.id);

  // Fetch latest weight and height from daily_metrics or onboarding_data
  const { data: bioData, isLoading: bioLoading } = useQuery({
    queryKey: ["athlete-bio", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get latest weight from daily_metrics
      const { data: metrics } = await supabase
        .from("daily_metrics")
        .select("weight_kg, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get height from profile onboarding_data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("onboarding_data")
        .eq("id", user.id)
        .maybeSingle();

      const onboardingData = profileData?.onboarding_data as any;

      return {
        weight: metrics?.weight_kg || onboardingData?.weight || null,
        height: onboardingData?.height || null,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch weight history for chart (last 30 days)
  const { data: weightHistory, isLoading: weightLoading } = useQuery({
    queryKey: ["weight-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from("daily_metrics")
        .select("weight_kg, date")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      return (data || [])
        .filter((d) => d.weight_kg)
        .map((d) => ({
          date: new Date(d.date).toLocaleDateString("it-IT", {
            day:"numeric",
            month:"short",
          }),
          weight: Number(d.weight_kg),
        }));
    },
    enabled: !!user?.id,
  });

  // Fetch Personal Records
  const { data: personalRecords, isLoading: prsLoading } = useQuery({
    queryKey: ["personal-records", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all workout exercises for this athlete
      const { data: exercises } = await supabase
        .from("workout_exercises")
        .select(
          `          exercise_name,
          sets_data,
          workout_logs!inner(athlete_id)
        `        )
        .eq("workout_logs.athlete_id", user.id);

      if (!exercises || exercises.length === 0) return [];

      // Calculate max weight per exercise
      const exerciseMaxes: Record<string, number> = {};

      exercises.forEach((ex) => {
        const setsData = ex.sets_data as any[];
        if (Array.isArray(setsData)) {
          setsData.forEach((set) => {
            const weight = set.weight_kg || set.weight || 0;
            if (weight > (exerciseMaxes[ex.exercise_name] || 0)) {
              exerciseMaxes[ex.exercise_name] = weight;
            }
          });
        }
      });

      // Sort by weight and take top 3
      const sorted = Object.entries(exerciseMaxes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return sorted.map(([name, weight], index) => ({
        exercise: name,
        weight,
        rank: (index + 1) as 1 | 2 | 3,
      }));
    },
    enabled: !!user?.id,
  });

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!avatarFile || !user?.id) return;

      const fileExt = avatarFile.name.split(".").pop();
      const fileName =`${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("coach-avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("coach-avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-bio"] });
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Foto profilo aggiornata!");
    },
    onError: () => {
      toast.error("Errore nel caricamento della foto");
    },
  });

  // Save bio data mutation
  const saveBioMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      // Update weight in daily_metrics
      if (tempWeight) {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("daily_metrics").upsert(
          {
            user_id: user.id,
            date: today,
            weight_kg: parseFloat(tempWeight),
          },
          { onConflict:"user_id,date"}
        );
      }

      // Update height in onboarding_data
      if (tempHeight) {
        const { data: current } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", user.id)
          .maybeSingle();

        const currentData = (current?.onboarding_data as any) || {};

        await supabase
          .from("profiles")
          .update({
            onboarding_data: {
              ...currentData,
              height: parseFloat(tempHeight),
            },
          })
          .eq("id", user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-bio"] });
      queryClient.invalidateQueries({ queryKey: ["weight-history"] });
      setEditDrawerOpen(false);
      toast.success("Dati aggiornati!");
    },
    onError: () => {
      toast.error("Errore nel salvare i dati");
    },
  });

  // Open edit drawer with current values
  const openEditDrawer = () => {
    setTempWeight(bioData?.weight?.toString() ||"");
    setTempHeight(bioData?.height?.toString() ||"");
    setEditDrawerOpen(true);
  };

  // Logout handler
  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Calculate streak text
  const streakText =
    gamification.currentStreak > 0
      ?`${gamification.currentStreak} Settimane`      :"Inizia la tua streak!";

  const avatarUrl = avatarPreview || profile?.avatar_url;
  const initials = profile?.full_name
    ?.split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ||"?";

  return (
    <AthleteLayout title="Profilo">
      <div className="flex-1 overflow-auto pb-24">
        <div className="p-4 space-y-6">
          {/* Header & Identity Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar with upload */}
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg"              >
                <Camera className="h-4 w-4"/>
              </button>
              <input
                ref={fileInputRef}
                type="file"                accept="image/*"                className="hidden"                onChange={handleAvatarChange}
              />
            </div>

            {/* Upload button if file selected */}
            {avatarFile && (
              <Button
                size="sm"                onClick={() => uploadAvatarMutation.mutate()}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                ) : null}
                Salva Foto
              </Button>
            )}

            {/* Name */}
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name ||"Atleta"}</h1>
              <p className="text-muted-foreground text-sm">
                {user?.email}
              </p>
            </div>

            {/* Streak Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow-lg">
              <Flame className="h-5 w-5"/>
              <span>{streakText}</span>
            </div>

            {/* Bio Stats */}
            <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  onClick={openEditDrawer}
                  className="flex items-center gap-6 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50"                >
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary"/>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      {bioLoading ? (
                        <Skeleton className="h-5 w-12"/>
                      ) : (
                        <p className="font-semibold">
                          {bioData?.weight ?`${bioData.weight} kg`:"—"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border"/>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary"/>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Altezza</p>
                      {bioLoading ? (
                        <Skeleton className="h-5 w-12"/>
                      ) : (
                        <p className="font-semibold">
                          {bioData?.height ?`${bioData.height} cm`:"—"}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Modifica Dati Fisici</DrawerTitle>
                  <DrawerDescription>
                    Aggiorna il tuo peso e altezza
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"                      type="number"                      step="0.1"                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      placeholder="Es. 75.5"                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altezza (cm)</Label>
                    <Input
                      id="height"                      type="number"                      value={tempHeight}
                      onChange={(e) => setTempHeight(e.target.value)}
                      placeholder="Es. 180"                    />
                  </div>
                </div>
                <DrawerFooter>
                  <Button
                    onClick={() => saveBioMutation.mutate()}
                    disabled={saveBioMutation.isPending}
                  >
                    {saveBioMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2"/>
                    ) : null}
                    Salva
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Annulla</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Bacheca Trofei */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary"/>
                <h2 className="text-lg font-semibold">Bacheca Trofei</h2>
              </div>
              <Button
                variant="ghost"                size="sm"                className="text-xs gap-1"                onClick={() => navigate("/athlete/leaderboard")}
              >
                <Trophy className="h-3.5 w-3.5"/>
                Classifica
              </Button>
            </div>

            {/* Consistency Rings — premium concentric SVG */}
            <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3 self-start">
                  <Flame className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold">Costanza</h3>
                </div>
                <ConsistencyRings athleteId={user?.id} size={200} />
              </CardContent>
            </Card>

            {/* Training Heatmap — last 90 days */}
            <TrainingHeatmap athleteId={user?.id} days={90} />

            {/* Badge Grid */}
            <BadgeGrid userId={user?.id} />
          </div>

          {/* Trophy Room Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary"/>
              <h2 className="text-lg font-semibold">Record Personali</h2>
            </div>

            {/* Weight Trend Chart */}
            {weightHistory && weightHistory.length > 1 && (
              <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground"/>
                    <p className="text-sm font-medium text-muted-foreground">
                      Peso ultimi 30 giorni
                    </p>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%"height="100%">
                      <LineChart data={weightHistory}>
                        <XAxis
                          dataKey="date"                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={["dataMin - 1","dataMax + 1"]}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor:"hsl(var(--card))",
                            border:"1px solid hsl(var(--border))",
                            borderRadius:"8px",
                          }}
                          formatter={(value: number) => [`${value} kg`,"Peso"]}
                        />
                        <Line
                          type="monotone"                          dataKey="weight"                          stroke="hsl(var(--primary))"                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {weightLoading && (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4">
                  <Skeleton className="h-32 w-full"/>
                </CardContent>
              </Card>
            )}

            {/* Personal Records */}
            {prsLoading ? (
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-24 rounded-2xl"/>
                <Skeleton className="h-24 rounded-2xl"/>
                <Skeleton className="h-24 rounded-2xl"/>
              </div>
            ) : personalRecords && personalRecords.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {personalRecords.map((pr) => (
                  <PRCard
                    key={pr.exercise}
                    exercise={pr.exercise}
                    weight={pr.weight}
                    rank={pr.rank}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2"/>
                  <p className="text-sm text-muted-foreground">
                    Completa i tuoi allenamenti per sbloccare i record personali!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Theme Customization Section */}
          <ThemeCustomizationCard />

          {/* Subscription Section */}
          <SubscriptionSection />

          {/* Settings Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Impostazioni</h2>

            <SettingsRow
              icon={Moon}
              label="Tema Scuro"              toggle
              checked={theme ==="dark"}
              onToggle={(checked) => setTheme(checked ?"dark":"light")}
            />

            <SettingsRow
              icon={Bell}
              label="Notifiche"              toggle
              checked={notifications}
              onToggle={setNotifications}
            />

            <FeedbackDialog
              trigger={
                <button className="w-full">
                  <SettingsRow
                    icon={MessageSquarePlus}
                    label="Segnala un Problema"                    value="Bug, suggerimenti, supporto"                  />
                </button>
              }
            />

            <div className="pt-4">
              <SettingsRow
                icon={LogOut}
                label="Esci"                danger
                onClick={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>
    </AthleteLayout>
  );
}

// Subscription status section
function SubscriptionSection() {
  const { data: subscription, isLoading } = useAthleteSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.open(data.url,"_blank");
      }
    } catch (e: any) {
      toast.error(e.message ||"Errore nell'apertura del portale");
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full"/>
        </CardContent>
      </Card>
    );
  }

  const isActive = subscription?.status ==="active";
  const plan = subscription?.billing_plans;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary"/>
        <h2 className="text-lg font-semibold">Abbonamento</h2>
      </div>

      <Card className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm",
        isActive &&"border-primary/30"      )}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isActive ? (
                <CheckCircle className="h-5 w-5 text-primary"/>
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground"/>
              )}
              <span className="font-medium">
                {isActive ?"Attivo":"Nessun abbonamento"}
              </span>
            </div>
            {isActive && (
              <Badge variant="default"className="bg-primary/20 text-primary border-primary/30">
                Attivo
              </Badge>
            )}
          </div>

          {plan && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Piano: <span className="text-foreground font-medium">{plan.name}</span></p>
              <p>
                €{(plan.price_amount / 100).toFixed(2)} / {plan.billing_interval ==="month"?"mese": plan.billing_interval ==="year"?"anno":"una tantum"}
              </p>
              {subscription?.current_period_end && (
                <p>
                  Scadenza: {new Date(subscription.current_period_end).toLocaleDateString("it-IT", {
                    day:"numeric",
                    month:"long",
                    year:"numeric",
                  })}
                </p>
              )}
            </div>
          )}

          {isActive && (
            <Button
              variant="outline"              className="w-full mt-2"              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2"/>
              ) : (
                <CreditCard className="h-4 w-4 mr-2"/>
              )}
               Gestisci Abbonamento
            </Button>
          )}

          {!isActive && (
            <p className="text-sm text-muted-foreground">
              Contatta il tuo coach per attivare un piano di abbonamento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
