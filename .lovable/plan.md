## Obiettivo

"Tabula rasa" del lato Athlete dell'app: rimuovere tutto il codice UI gonfio/duplicato per riportarlo a uno scheletro minimale pronto per essere ricostruito con architettura Smart/Dumb agganciata correttamente a Supabase. Coach app, hooks, stores, UI primitives, Supabase e routing globale **non vengono toccati**.

## Stato attuale (verificato)

- **5 pagine Athlete** in `src/pages/athlete/`: `AthleteDashboard.tsx`, `AthleteTraining.tsx`, `ActiveWorkout.tsx`, `AthleteNutrition.tsx`, `AthleteCopilot.tsx`.
- **~40 componenti** in `src/components/athlete/` + 5 sottocartelle: `cycle/`, `gamification/`, `nutrition/`, `vision/`, `workout/`.
- **Solo file Athlete** importano da `@/components/athlete/*`. Nessuna dipendenza dal Coach o da altre aree → cancellazione sicura.
- `App.tsx` lazy-importa le 5 pagine Athlete. Manterremo gli import e le route invariati: punteranno alle nuove pagine vuote.

## Cosa farò

### 1. Wipe pagine Athlete (`src/pages/athlete/`)

Sovrascrivere tutti i 5 file con un componente funzionale minimale, **senza alcun import da `@/components/athlete`**, mock data o stato. Esempio:

```tsx
export default function AthleteDashboard() {
  return <div className="p-4">Dashboard Shell</div>;
}
```

Stessa struttura per `AthleteTraining` ("Training Shell"), `ActiveWorkout` ("Active Workout Shell"), `AthleteNutrition` ("Nutrition Shell"), `AthleteCopilot` ("Copilot Shell").

### 2. Wipe componenti Athlete (`src/components/athlete/`)

**Cancellare** tutti i file e sottocartelle:

- Tutti i ~40 file `.tsx` a livello root (ACWRAnalysis, ActiveWorkoutHub, AmrapExecutionDrawer, BillingReceipt, CoachDirectChat, CopilotMacroIntervention/RiskIntervention, DailyNutritionLog, DailyReadinessLog, DailyRings, DailyTrainingHub, ExerciseExecutionDrawer, ExercisePreview, ExitWorkoutDialog, FormAnalysis, IntensityExecutionDrawer/Preview, MainSessionPreview, MealAnalysis, NotificationsCenter, NutritionStrategyOverview, PerformanceMilestones, PhoneMockup, PlanUpdateSummary, PostWorkoutDebrief, ReadinessAnalysisDetail, ReadinessLogging, SessionBuilderDialog, SorenessDeepDive, SupersetExecutionDrawer, SyncIndicator, ThemeCustomizationCard, TimeBasedProtocolPreview, TimedExecutionDrawer, TimedExercisePreview, TrainingMetrics, WeeklyCheckIn, WeightTrendAnalysis, WorkoutOverviewHub, AcwrCard).
- Sottocartelle complete: `cycle/`, `gamification/`, `nutrition/`, `vision/`, `workout/`.

**Conservare e riscrivere** solo 2 file: `AthleteLayout.tsx` e `AthleteBottomNav.tsx` (vedi step 3).

### 3. Reset di `AthleteLayout.tsx` e `AthleteBottomNav.tsx`

**`AthleteBottomNav.tsx`** — minimal, 4 link a `/athlete/dashboard`, `/athlete/workout`, `/athlete/nutrition`, `/athlete/copilot` con `react-router-dom` `NavLink`. Solo classi Tailwind di base (`flex`, `justify-around`, `border-t`). Nessuna icona custom, nessun PhoneMockup, nessun SyncIndicator/NotificationBell.

**`AthleteLayout.tsx`** — wrapper barebones:

```tsx
import { Outlet } from "react-router-dom";
import { AthleteBottomNav } from "./AthleteBottomNav";

export function AthleteLayout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
      <AthleteBottomNav />
    </div>
  );
}
```

Rimossi: `PhoneMockup`/`ResponsivePhoneWrapper`, `SyncIndicator`, `NotificationBell`, `SunThemeToggle`, header con titolo, safe-area paddings, theming complesso.

### 4. Aggiornamento minimo di `App.tsx`

Le pagine Athlete attualmente sono renderizzate **direttamente** senza passare per `AthleteLayout`. Per sfruttare il nuovo layout pulito + `<Outlet />` userò una route nidificata:

```tsx
<Route path="/athlete" element={<AthleteLayout />}>
  <Route index element={<AthleteDashboard />} />
  <Route path="dashboard" element={<AthleteDashboard />} />
  <Route path="workout" element={<AthleteTraining />} />
  <Route path="workout/active" element={<ActiveWorkout />} />
  <Route path="nutrition" element={<AthleteNutrition />} />
  <Route path="copilot" element={<AthleteCopilot />} />
</Route>
```

Aggiunta solo: import di `AthleteLayout` + ristrutturazione delle 6 route Athlete in nested. **Tutto il resto di `App.tsx` resta identico** (Coach routes, providers, lazy imports).

### 5. Verifiche post-wipe

- Nessun file fuori da `src/pages/athlete/` o `src/components/athlete/` viene modificato (eccezione: l'aggiornamento mirato delle route Athlete in `App.tsx`).
- `rg "components/athlete/(workout|nutrition|cycle|gamification|vision|ACWRAnalysis|...)"` deve restituire 0 risultati dopo la pulizia.
- Build TypeScript/Vite deve passare → schermo bianco con testo "Dashboard Shell" (e simili) sulle route `/athlete/*`.

## Vincoli rispettati (NON toccati)

- `src/pages/coach/**` e `src/components/coach/**` — intatti.
- `src/components/ui/**` (shadcn) — intatti.
- `src/hooks/**` (useAthleteProfile, useReadiness, ecc.) — intatti, pronti per la ricostruzione.
- `src/stores/**` (Zustand) — intatti.
- `supabase/**` (migrations, functions, types) — intatti.
- `src/App.tsx` — modifica chirurgica solo al blocco delle route Athlete per agganciare `AthleteLayout`.

## Risultato atteso

Dopo l'esecuzione: l'app compila senza errori, navigando su `/athlete/dashboard` (o qualsiasi route Athlete) si vede una shell vuota con testo placeholder e una bottom nav minimale a 4 voci. Pronto per ricostruire passo-passo con architettura Smart/Dumb.
