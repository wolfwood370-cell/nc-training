import {
  CalendarDays,
  Settings,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";

// ---------- Types ----------
interface MacroProgress {
  key: "pro" | "fat" | "carb";
  label: string;
  current: number;
  target: number;
  color: string; // hex
  trackColor: string; // hex w/ alpha
}

interface MealEntry {
  id: string;
  time: string; // "08:00"
  name: string; // "Colazione"
  items?: string; // "Avena, Uova"
  calories?: number; // undefined => empty slot
}

interface NutritionLogData {
  intakeKcal: number;
  remainingKcal: number;
  goalKcal: number;
  expenditureKcal: number;
  weightKg: number;
  macros: MacroProgress[];
  meals: MealEntry[];
}

// ---------- Tokens ----------
const PRIMARY = "#005685";
const PRIMARY_CONTAINER = "#226FA3";
const INK = "#001E2D";
const MUTED = "#40474F";
const OUTLINE = "#717880";
const SURFACE_CONTAINER = "#DEF0FF";
const BG = "#F5FAFF";

// ---------- Mock data ----------
const mockData: NutritionLogData = {
  intakeKcal: 1850,
  remainingKcal: 450,
  goalKcal: 2300,
  expenditureKcal: 2993,
  weightKg: 82.5,
  macros: [
    {
      key: "pro",
      label: "Pro",
      current: 160,
      target: 180,
      color: "#3B6284",
      trackColor: "#3B62841A",
    },
    {
      key: "fat",
      label: "Fat",
      current: 55,
      target: 65,
      color: "#476D90",
      trackColor: "#476D901A",
    },
    {
      key: "carb",
      label: "Carb",
      current: 180,
      target: 250,
      color: "#93CCFF",
      trackColor: "#93CCFF33",
    },
  ],
  meals: [
    {
      id: "breakfast",
      time: "08:00",
      name: "Colazione",
      items: "Avena, Uova",
      calories: 320,
    },
    {
      id: "lunch",
      time: "13:30",
      name: "Pranzo",
      items: "Pollo, Riso",
      calories: 480,
    },
    { id: "dinner", time: "19:00", name: "Cena" },
  ],
};

// ---------- Helpers ----------
function pct(current: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// ---------- Subcomponents ----------
function SegmentedControl({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div
      className="p-1 rounded-full flex w-full"
      style={{ background: SURFACE_CONTAINER }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold tracking-wide transition-all active:scale-[0.98] ${
              isActive ? "bg-white shadow-sm" : ""
            }`}
            style={{ color: isActive ? PRIMARY : MUTED }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function MacroBar({ macro }: { macro: MacroProgress }) {
  const p = pct(macro.current, macro.target);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: macro.color }}
        />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: MUTED }}
        >
          {macro.label}
        </span>
      </div>
      <span className="text-base font-semibold" style={{ color: INK }}>
        {macro.current}
        <span className="font-normal" style={{ color: MUTED }}>
          /{macro.target}g
        </span>
      </span>
      <div
        className="h-1 w-full rounded-full overflow-hidden"
        style={{ background: macro.trackColor }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${p}%`, background: macro.color }}
        />
      </div>
    </div>
  );
}

function GlanceCard({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down";
}) {
  const Icon = trend === "up" ? TrendingUp : TrendingDown;
  return (
    <div
      className="rounded-2xl p-4 flex justify-between items-center"
      style={{ background: SURFACE_CONTAINER }}
    >
      <div className="flex flex-col">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: MUTED }}
        >
          {label}
        </span>
        <span
          className="font-[Manrope] text-2xl font-bold leading-tight"
          style={{ color: INK }}
        >
          {value}{" "}
          <span className="text-sm font-normal" style={{ color: MUTED }}>
            {unit}
          </span>
        </span>
      </div>
      <div
        className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"
        style={{ color: PRIMARY_CONTAINER }}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function TimelineEntry({
  meal,
  onAdd,
}: {
  meal: MealEntry;
  onAdd?: (id: string) => void;
}) {
  const isEmpty = meal.calories === undefined;
  return (
    <div className="relative">
      <div
        className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-white flex items-center justify-center z-10 border-2"
        style={{
          borderColor: isEmpty ? "rgba(113,120,128,0.5)" : PRIMARY_CONTAINER,
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: isEmpty ? "rgba(113,120,128,0.5)" : PRIMARY_CONTAINER,
          }}
        />
      </div>
      {isEmpty ? (
        <div
          className="rounded-2xl p-4 flex justify-between items-center bg-transparent border border-dashed"
          style={{ borderColor: "rgba(113,120,128,0.5)" }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold" style={{ color: OUTLINE }}>
                {meal.time}
              </span>
              <h3 className="text-base font-semibold" style={{ color: MUTED }}>
                {meal.name}
              </h3>
            </div>
            <span
              className="text-xs italic font-normal"
              style={{ color: OUTLINE }}
            >
              Nessun alimento inserito
            </span>
          </div>
          <button
            onClick={() => onAdd?.(meal.id)}
            aria-label={`Aggiungi ${meal.name}`}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{ background: "#C5E7FF", color: PRIMARY }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4 flex justify-between items-center bg-white/70 backdrop-blur-xl border"
          style={{
            borderColor: "rgba(113,120,128,0.15)",
            boxShadow: "0 10px 40px -10px rgba(59,98,132,0.1)",
          }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-semibold"
                style={{ color: PRIMARY_CONTAINER }}
              >
                {meal.time}
              </span>
              <h3 className="text-base font-semibold" style={{ color: INK }}>
                {meal.name}
              </h3>
            </div>
            {meal.items && (
              <span className="text-xs font-normal" style={{ color: MUTED }}>
                {meal.items}
              </span>
            )}
          </div>
          <span
            className="text-base font-semibold whitespace-nowrap"
            style={{ color: PRIMARY }}
          >
            {meal.calories} kcal
          </span>
        </div>
      )}
    </div>
  );
}

// ---------- Main component ----------
interface DailyNutritionLogProps {
  data?: NutritionLogData;
  onAddMeal?: (mealId?: string) => void;
  onOpenCalendar?: () => void;
  onOpenSettings?: () => void;
}

export function DailyNutritionLog({
  data = mockData,
  onAddMeal,
  onOpenCalendar,
  onOpenSettings,
}: DailyNutritionLogProps) {
  const intakePct = pct(data.intakeKcal, data.goalKcal);

  return (
    <div
      className="min-h-screen flex flex-col font-[Inter] pb-32"
      style={{ background: BG, color: INK }}
    >
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 h-16">
        <button
          onClick={onOpenCalendar}
          aria-label="Calendario"
          className="hover:bg-slate-100/50 transition-colors rounded-full p-2"
          style={{ color: PRIMARY }}
        >
          <CalendarDays className="h-6 w-6" />
        </button>
        <h1
          className="font-extrabold tracking-tighter text-lg"
          style={{ color: PRIMARY }}
        >
          Nutrition
        </h1>
        <button
          onClick={onOpenSettings}
          aria-label="Impostazioni"
          className="hover:bg-slate-100/50 transition-colors rounded-full p-2"
          style={{ color: PRIMARY }}
        >
          <Settings className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-1 px-5 pt-6 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <SegmentedControl
          tabs={["Diario", "Strategia"]}
          active="Diario"
          onChange={() => {}}
        />

        {/* Macro Compass */}
        <section
          className="rounded-2xl p-6 flex flex-col gap-6 bg-white/70 backdrop-blur-xl border"
          style={{
            borderColor: "rgba(113,120,128,0.15)",
            boxShadow: "0 10px 40px -10px rgba(59,98,132,0.1)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: MUTED }}
                >
                  Assunte
                </span>
                <span
                  className="font-[Manrope] text-4xl font-bold leading-none mt-1"
                  style={{ color: PRIMARY }}
                >
                  {data.intakeKcal}{" "}
                  <span
                    className="text-base font-normal"
                    style={{ color: MUTED }}
                  >
                    kcal
                  </span>
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: MUTED }}
                >
                  Rimanenti
                </span>
                <span
                  className="font-[Manrope] text-2xl font-bold mt-1"
                  style={{ color: PRIMARY_CONTAINER }}
                >
                  {data.remainingKcal}{" "}
                  <span
                    className="text-base font-normal"
                    style={{ color: MUTED }}
                  >
                    kcal
                  </span>
                </span>
              </div>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: `${PRIMARY}1A` }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${intakePct}%`,
                  background: PRIMARY_CONTAINER,
                }}
              />
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-4 pt-4 border-t"
            style={{ borderColor: "rgba(113,120,128,0.2)" }}
          >
            {data.macros.map((m) => (
              <MacroBar key={m.key} macro={m} />
            ))}
          </div>
        </section>

        {/* Glance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <GlanceCard
            label="Dispendio"
            value={String(data.expenditureKcal)}
            unit="kcal"
            trend="up"
          />
          <GlanceCard
            label="Trend Peso"
            value={data.weightKg.toFixed(1)}
            unit="kg"
            trend="down"
          />
        </div>

        {/* Daily Timeline */}
        <section className="mt-2 flex flex-col gap-6">
          <h2
            className="font-[Manrope] text-2xl font-bold tracking-tight"
            style={{ color: PRIMARY }}
          >
            Diario Alimentare
          </h2>
          <div
            className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px]"
            style={
              {
                // pseudo-element bg via inline style is awkward; use real div instead
              } as React.CSSProperties
            }
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-[11px] w-[2px]"
              style={{ background: "rgba(113,120,128,0.3)" }}
            />
            {data.meals.map((meal) => (
              <TimelineEntry key={meal.id} meal={meal} onAdd={onAddMeal} />
            ))}
          </div>
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => onAddMeal?.()}
        aria-label="Aggiungi pasto"
        className="fixed bottom-28 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white z-40 transition-transform active:scale-95"
        style={{
          background: PRIMARY_CONTAINER,
          boxShadow: "0 8px 30px rgba(34,111,163,0.4)",
        }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default DailyNutritionLog;
