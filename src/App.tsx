import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RoleRedirect } from "@/components/RoleRedirect";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { AthleteLayout } from "@/components/athlete/AthleteLayout";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { MaterialYouProvider } from "@/providers/MaterialYouProvider";
import { OfflineSyncProvider } from "@/providers/OfflineSyncProvider";

// Public
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";

// Athlete
const AthleteDashboard = lazy(() => import("@/pages/athlete/AthleteDashboard"));
const AthleteTraining = lazy(() => import("@/pages/athlete/AthleteTraining"));
const AthleteNutrition = lazy(() => import("@/pages/athlete/AthleteNutrition"));
const AthleteHabits = lazy(() => import("@/pages/athlete/AthleteHabits"));
const AthleteHealth = lazy(() => import("@/pages/athlete/AthleteHealth"));
const AthleteMessages = lazy(() => import("@/pages/athlete/AthleteMessages"));
const AthleteProfile = lazy(() => import("@/pages/athlete/AthleteProfile"));
const AthleteLeaderboard = lazy(() => import("@/pages/athlete/AthleteLeaderboard"));
const FocusDashboard = lazy(() => import("@/pages/athlete/FocusDashboard"));
const WorkoutPlayer = lazy(() => import("@/pages/athlete/WorkoutPlayer"));
const WorkoutSummary = lazy(() => import("@/pages/athlete/WorkoutSummary"));
const OnboardingWizard = lazy(() => import("@/pages/onboarding/OnboardingWizard"));

// Coach
const CoachHome = lazy(() => import("@/pages/coach/CoachHome"));
const CoachAthletes = lazy(() => import("@/pages/coach/CoachAthletes"));
const AthleteDetail = lazy(() => import("@/pages/coach/AthleteDetail"));
const CoachAnalytics = lazy(() => import("@/pages/coach/CoachAnalytics"));
const CoachBusiness = lazy(() => import("@/pages/coach/CoachBusiness"));
const CoachCalendar = lazy(() => import("@/pages/coach/CoachCalendar"));
const CoachCheckinInbox = lazy(() => import("@/pages/coach/CoachCheckinInbox"));
const CoachLibrary = lazy(() => import("@/pages/coach/CoachLibrary"));
const CoachMessages = lazy(() => import("@/pages/coach/CoachMessages"));
const CoachSettings = lazy(() => import("@/pages/coach/CoachSettings"));
const ExerciseDatabase = lazy(() => import("@/pages/coach/ExerciseDatabase"));
const FmsScreening = lazy(() => import("@/pages/coach/FmsScreening"));
const KnowledgeBase = lazy(() => import("@/pages/coach/KnowledgeBase"));
const MasterCopilot = lazy(() => import("@/pages/coach/MasterCopilot"));
const ProgramBuilder = lazy(() => import("@/pages/coach/ProgramBuilder"));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AthleteRoute({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <ProtectedRoute>
      <AthleteLayout title={title}>
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </AthleteLayout>
    </ProtectedRoute>
  );
}

function CoachRoute({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        <CoachLayout title={title}>
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </CoachLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  return (
    <MaterialYouProvider>
      <OfflineSyncProvider userRole={profile?.role}>{children}</OfflineSyncProvider>
    </MaterialYouProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RoleRedirect fallback={<Index />} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms" element={<TermsOfService />} />

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageFallback />}>
                  <OnboardingWizard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Athlete */}
          <Route path="/athlete" element={<Navigate to="/athlete/dashboard" replace />} />
          <Route path="/athlete/dashboard" element={<AthleteRoute><AthleteDashboard /></AthleteRoute>} />
          <Route path="/athlete/focus" element={<AthleteRoute title="Focus"><FocusDashboard /></AthleteRoute>} />
          <Route path="/athlete/training" element={<AthleteRoute title="Workout"><AthleteTraining /></AthleteRoute>} />
          <Route path="/athlete/nutrition" element={<AthleteRoute title="Nutrizione"><AthleteNutrition /></AthleteRoute>} />
          <Route path="/athlete/habits" element={<AthleteRoute title="Abitudini"><AthleteHabits /></AthleteRoute>} />
          <Route path="/athlete/health" element={<AthleteRoute title="Salute"><AthleteHealth /></AthleteRoute>} />
          <Route path="/athlete/messages" element={<AthleteRoute title="Copilot"><AthleteMessages /></AthleteRoute>} />
          <Route path="/athlete/profile" element={<AthleteRoute title="Profilo"><AthleteProfile /></AthleteRoute>} />
          <Route path="/athlete/leaderboard" element={<AthleteRoute title="Classifica"><AthleteLeaderboard /></AthleteRoute>} />
          <Route path="/athlete/workout/:id" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><WorkoutPlayer /></Suspense></ProtectedRoute>} />
          <Route path="/athlete/workout/:id/summary" element={<ProtectedRoute><Suspense fallback={<PageFallback />}><WorkoutSummary /></Suspense></ProtectedRoute>} />

          {/* Coach */}
          <Route path="/coach" element={<Navigate to="/coach/home" replace />} />
          <Route path="/coach/home" element={<CoachRoute title="Hub"><CoachHome /></CoachRoute>} />
          <Route path="/coach/athletes" element={<CoachRoute title="Atleti"><CoachAthletes /></CoachRoute>} />
          <Route path="/coach/athletes/:id" element={<CoachRoute><AthleteDetail /></CoachRoute>} />
          <Route path="/coach/analytics" element={<CoachRoute title="Analytics"><CoachAnalytics /></CoachRoute>} />
          <Route path="/coach/business" element={<CoachRoute title="Business"><CoachBusiness /></CoachRoute>} />
          <Route path="/coach/calendar" element={<CoachRoute title="Calendario"><CoachCalendar /></CoachRoute>} />
          <Route path="/coach/checkin-inbox" element={<CoachRoute title="Check-in"><CoachCheckinInbox /></CoachRoute>} />
          <Route path="/coach/library" element={<CoachRoute title="Libreria"><CoachLibrary /></CoachRoute>} />
          <Route path="/coach/messages" element={<CoachRoute title="Messaggi"><CoachMessages /></CoachRoute>} />
          <Route path="/coach/settings" element={<CoachRoute title="Impostazioni"><CoachSettings /></CoachRoute>} />
          <Route path="/coach/exercises" element={<CoachRoute title="Esercizi"><ExerciseDatabase /></CoachRoute>} />
          <Route path="/coach/fms" element={<CoachRoute title="FMS"><FmsScreening /></CoachRoute>} />
          <Route path="/coach/knowledge" element={<CoachRoute title="Knowledge Base"><KnowledgeBase /></CoachRoute>} />
          <Route path="/coach/copilot" element={<CoachRoute title="Copilot"><MasterCopilot /></CoachRoute>} />
          <Route path="/coach/program-builder" element={<CoachRoute title="Program Builder"><ProgramBuilder /></CoachRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}
