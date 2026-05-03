## Diagnosi

L'app è attualmente **non avviabile**. La preview mostra una schermata bianca perché il dev server di Vite restituisce errori bloccanti su quasi tutte le pagine.

### Problema 1 — `src/App.tsx` punta a un'app fantasma "Lumina"

Il file `App.tsx` definisce solo 5 rotte (`/dashboard`, `/training`, `/nutrition`, `/copilot`, `/notifications`) che renderizzano pagine top-level (`src/pages/Dashboard.tsx`, `Training.tsx`, ecc.). Queste pagine importano moduli **inesistenti**:

- `@/components/layout` → la cartella esiste ma contiene solo `Footer.tsx`, nessun `Header`/`BottomNav` esportato
- `@/components/dashboard` → cartella **non esiste**
- `@/data` → cartella **non esiste** (mock `mockReadiness`, `mockTodayWorkout`, ecc.)

Risultato: ogni rotta crasha con `Failed to resolve import "@/components/layout"`.

Nel frattempo l'app **reale** (athlete + coach + auth + Supabase + onboarding) vive in `src/pages/athlete/`, `src/pages/coach/`, `src/pages/Auth.tsx`, `src/pages/onboarding/` ed esiste anche un `AppShell` con `BottomNavigation` e tutta l'infrastruttura (`useAuth`, `RoleRedirect`, `SubscriptionGuard`, layout coach/athlete, ecc.) — ma **non è collegata al router**.

### Problema 2 — Dipendenze mancanti

`src/lib/utils.ts` (usato da praticamente tutti i componenti shadcn) importa `clsx` e `tailwind-merge`, ma **nessuno dei due è in `package.json`**. Vite logga: `Failed to resolve import "clsx" from "src/lib/utils.ts"`.

Probabilmente mancano anche altre dipendenze runtime (es. `@tanstack/react-query`, providers, ecc.) usate dai componenti reali — andranno verificate al primo riavvio pulito.

### Problema 3 — Provider globali assenti

`src/main.tsx` monta `<App />` nudo. Mancano: `QueryClientProvider` (TanStack Query), `TooltipProvider`, `<Toaster />`, `MaterialYouProvider`, `OfflineSyncProvider`, `ErrorBoundary`, `MetaHead` — tutti file presenti nel codebase ma non istanziati. Senza di essi, qualunque hook `useQuery` o toast crasha appena la pagina monta.

---

## Piano di intervento

### Step 1 — Reinstallare le dipendenze base
Aggiungere via `bun add`:
- `clsx`
- `tailwind-merge`

E verificare presenza di: `@tanstack/react-query`, `@supabase/supabase-js`, `zustand`, `idb-keyval`, `date-fns`, `lucide-react`, `sonner`, `recharts`. Aggiungere quelle mancanti.

### Step 2 — Riscrivere `src/App.tsx` per usare l'app reale
Sostituire le 5 rotte fantasma con il routing effettivo:

```text
/auth                         → Auth
/onboarding                   → OnboardingWizard
/                             → RoleRedirect (coach→/coach, athlete→/athlete)
/athlete/*                    → AthleteLayout
   ├─ dashboard                → AthleteDashboard
   ├─ training                 → AthleteTraining
   ├─ nutrition                → AthleteNutrition
   ├─ habits / health / messages / profile / leaderboard
   ├─ workout/:id              → WorkoutPlayer
   └─ workout/:id/summary      → WorkoutSummary
/coach/*                      → CoachLayout
   ├─ home / athletes / athlete/:id
   ├─ analytics / business / calendar / checkin-inbox
   ├─ library / messages / settings
   ├─ exercises / fms / knowledge / copilot / program-builder
*                             → NotFound
```

Avvolgere le rotte private con `SubscriptionGuard` dove rilevante (coerente con il pattern già definito).

### Step 3 — Aggiornare `src/main.tsx` con i provider
Wrapping nell'ordine corretto:
```text
ErrorBoundary
└─ QueryClientProvider (con queryPersister offline-first)
   └─ TooltipProvider
      └─ MaterialYouProvider
         └─ OfflineSyncProvider
            └─ App
            └─ Toaster (sonner) + SwUpdatePrompt
```

### Step 4 — Eliminare il codice morto "Lumina"
Cancellare le pagine top-level obsolete che importano moduli inesistenti, così Vite non prova più a pre-trasformarle:
- `src/pages/Dashboard.tsx`
- `src/pages/Training.tsx`
- `src/pages/Nutrition.tsx`
- `src/pages/Copilot.tsx`
- `src/pages/Notifications.tsx`
- `src/pages/Index.tsx` (se non più referenziato)
- `src/pages/shell/*` (duplicato del flusso "Lumina") — da confermare

In alternativa, se vuoi conservare uno scaffolding "Lumina" come prototipo, possiamo spostare quei file in `src/_legacy/` ed escluderli dal build.

### Step 5 — Smoke test
Dopo le modifiche, verificare:
1. `/auth` carica senza errori console
2. Login → redirect corretto a `/athlete/dashboard` o `/coach/home`
3. Bottom nav atleta e sidebar coach visibili
4. Nessun errore Vite "Failed to resolve import"

---

## Domanda per te prima di procedere

Le pagine top-level "Lumina" (`Dashboard.tsx`, `Training.tsx`, ecc.) e la cartella `src/pages/shell/` sembrano un **prototipo separato** mai integrato. Confermi che posso **eliminarle** insieme alle rotte fantasma in `App.tsx`, oppure preferisci che le **conservi** in un branch/cartella legacy?

Una volta che approvi, applico tutto in un'unica passata e l'app torna avviabile.