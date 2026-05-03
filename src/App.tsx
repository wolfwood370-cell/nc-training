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
import { CelebrationOverlay } from "@/components/celebration/Confetti";


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
const ExerciseDatabase = lazy(() => import("./pages/coach/ExerciseDatabase"));
const CoachCheckinInbox = lazy(() => import("./pages/coach/CoachCheckinInbox"));
const FmsScreening = lazy(() => import("./pages/coach/FmsScreening"));
const KnowledgeBase = lazy(() => import("./pages/coach/KnowledgeBase"));
const MasterCopilot = lazy(() => import("./pages/coach/MasterCopilot"));
const AthleteDashboard = lazy(() => import("./pages/athlete/AthleteDashboard"));
const AthleteTraining = lazy(() => import("./pages/athlete/AthleteTraining"));
const AthleteNutrition = lazy(() => import("./pages/athlete/AthleteNutrition"));
const AthleteCopilot = lazy(() => import("./pages/athlete/AthleteCopilot"));
const ActiveWorkout = lazy(() => import("./pages/athlete/ActiveWorkout"));
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
        <CelebrationOverlay />

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
              <Route path="/coach/exercises" element={<SubscriptionGuard><ExerciseDatabase /></SubscriptionGuard>} />
              <Route path="/coach/analytics" element={<SubscriptionGuard><CoachAnalytics /></SubscriptionGuard>} />
              <Route path="/coach/business" element={<SubscriptionGuard><CoachBusiness /></SubscriptionGuard>} />
              <Route path="/coach/inbox" element={<SubscriptionGuard><CoachCheckinInbox /></SubscriptionGuard>} />
              <Route path="/coach/fms" element={<SubscriptionGuard><FmsScreening /></SubscriptionGuard>} />
              <Route path="/coach/knowledge" element={<SubscriptionGuard><KnowledgeBase /></SubscriptionGuard>} />
              <Route path="/coach/copilot" element={<SubscriptionGuard><MasterCopilot /></SubscriptionGuard>} />
              <Route path="/coach/settings" element={<SubscriptionGuard><CoachSettings /></SubscriptionGuard>} />
              
              {/* Athlete Routes */}
              <Route path="/athlete" element={<AthleteDashboard />} />
              <Route path="/athlete/dashboard" element={<AthleteDashboard />} />
              <Route path="/athlete/workout" element={<AthleteTraining />} />
              <Route path="/athlete/workout/active" element={<ActiveWorkout />} />
              <Route path="/athlete/nutrition" element={<AthleteNutrition />} />
              <Route path="/athlete/copilot" element={<AthleteCopilot />} />
              
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
