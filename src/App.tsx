import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { SunThemeSync } from "@/components/logic/SunThemeSync";
import { OfflineSyncProvider } from "@/providers/OfflineSyncProvider";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { NetworkBadge } from "@/components/ui/NetworkBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { SwUpdatePrompt } from "@/components/pwa/SwUpdatePrompt";


// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CoachHome = lazy(() => import("./pages/coach/CoachHome"));
const CoachAthletes = lazy(() => import("./pages/coach/CoachAthletes"));
const AthleteDetail = lazy(() => import("./pages/coach/AthleteDetail"));
const CoachCalendar = lazy(() => import("./pages/coach/CoachCalendar"));
const CoachMessages = lazy(() => import("./pages/coach/CoachMessages"));
const CoachAnalytics = lazy(() => import("./pages/coach/CoachAnalytics"));
const CoachSettings = lazy(() => import("./pages/coach/CoachSettings"));
const CoachBusiness = lazy(() => import("./pages/coach/CoachBusiness"));
const ProgramBuilder = lazy(() => import("./pages/coach/ProgramBuilder"));
const CoachLibrary = lazy(() => import("./pages/coach/CoachLibrary"));
const CoachCheckinInbox = lazy(() => import("./pages/coach/CoachCheckinInbox"));
const FocusDashboard = lazy(() => import("./pages/athlete/FocusDashboard"));
const AthleteLeaderboard = lazy(() => import("./pages/athlete/AthleteLeaderboard"));
const AthleteTraining = lazy(() => import("./pages/athlete/AthleteTraining"));
const AthleteNutrition = lazy(() => import("./pages/athlete/AthleteNutrition"));
const AthleteHealth = lazy(() => import("./pages/athlete/AthleteHealth"));
const AthleteProfile = lazy(() => import("./pages/athlete/AthleteProfile"));
const WorkoutPlayer = lazy(() => import("./pages/athlete/WorkoutPlayer"));
const WorkoutSummary = lazy(() => import("./pages/athlete/WorkoutSummary"));
const AthleteDashboard = lazy(() => import("./pages/athlete/AthleteDashboard"));
const AthleteHabits = lazy(() => import("./pages/athlete/AthleteHabits"));
const AthleteMessages = lazy(() => import("./pages/athlete/AthleteMessages"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <OfflineSyncProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SunThemeSync />
        <NetworkBadge />
        <InstallPrompt />
        <SwUpdatePrompt />
        
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Coach Routes — wrapped in SubscriptionGuard */}
              <Route path="/coach" element={<SubscriptionGuard><CoachHome /></SubscriptionGuard>} />
              <Route path="/coach/athletes" element={<SubscriptionGuard><CoachAthletes /></SubscriptionGuard>} />
              <Route path="/coach/athlete/:id" element={<SubscriptionGuard><AthleteDetail /></SubscriptionGuard>} />
              <Route path="/coach/programs" element={<SubscriptionGuard><ProgramBuilder /></SubscriptionGuard>} />
              <Route path="/coach/calendar" element={<SubscriptionGuard><CoachCalendar /></SubscriptionGuard>} />
              <Route path="/coach/messages" element={<SubscriptionGuard><CoachMessages /></SubscriptionGuard>} />
              <Route path="/coach/library" element={<SubscriptionGuard><CoachLibrary /></SubscriptionGuard>} />
              <Route path="/coach/analytics" element={<SubscriptionGuard><CoachAnalytics /></SubscriptionGuard>} />
              <Route path="/coach/business" element={<SubscriptionGuard><CoachBusiness /></SubscriptionGuard>} />
              <Route path="/coach/inbox" element={<SubscriptionGuard><CoachCheckinInbox /></SubscriptionGuard>} />
              <Route path="/coach/settings" element={<SubscriptionGuard><CoachSettings /></SubscriptionGuard>} />
              
              {/* Athlete Routes */}
              <Route path="/athlete" element={<FocusDashboard />} />
              <Route path="/athlete/dashboard" element={<AthleteDashboard />} />
              <Route path="/athlete/focus" element={<FocusDashboard />} />
              <Route path="/athlete/workout" element={<AthleteTraining />} />
              <Route path="/athlete/workout/:id" element={<WorkoutPlayer />} />
              <Route path="/athlete/workout/summary/:sessionId" element={<WorkoutSummary />} />
              <Route path="/athlete/messages" element={<AthleteMessages />} />
              <Route path="/athlete/nutrition" element={<AthleteNutrition />} />
              <Route path="/athlete/health" element={<AthleteHealth />} />
              <Route path="/athlete/leaderboard" element={<AthleteLeaderboard />} />
              <Route path="/athlete/habits" element={<AthleteHabits />} />
              <Route path="/athlete/profile" element={<AthleteProfile />} />
              
              {/* Onboarding */}
              <Route path="/onboarding" element={<OnboardingWizard />} />
              
              {/* Legal */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </OfflineSyncProvider>
  </ThemeProvider>
);

export default App;
