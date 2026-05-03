import { Bell, X, Sparkles, CheckCircle2 } from "lucide-react";

interface MacroRemaining {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface SuggestedMeal {
  badge: string;
  image: string;
  title: string;
  meta: string;
  macros: { label: string; value: string }[];
}

interface CopilotMacroInterventionData {
  user: { name: string; avatar: string };
  brand: string;
  title: string;
  remaining: MacroRemaining[];
  suggestion: SuggestedMeal;
}

const mockData: CopilotMacroInterventionData = {
  user: {
    name: "Athlete",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=faces",
  },
  brand: "MacroAI",
  title: "Evening Check-in",
  remaining: [
    { label: "PROTEIN", value: "50g", emphasis: true },
    { label: "CARBS", value: "15g" },
    { label: "FAT", value: "5g" },
  ],
  suggestion: {
    badge: "COPILOT SUGGESTION",
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=500&fit=crop",
    title: "Grilled Lemon-Herb Chicken Breast with Asparagus",
    meta: "Prep time: 15 mins • Perfect macro match",
    macros: [
      { label: "Pro", value: "48g" },
      { label: "Fat", value: "6g" },
      { label: "Carb", value: "12g" },
    ],
  },
};

const PRIMARY = "#005685";
const PRIMARY_CONTAINER = "#226fa3";
const SURFACE = "#f5faff";
const SURFACE_LOW = "#eaf5ff";
const TERTIARY_FIXED = "#cee5ff";
const ON_BG = "#001e2d";
const ON_SURFACE_VARIANT = "#40474f";

interface Props {
  data?: CopilotMacroInterventionData;
  onClose?: () => void;
  onGenerateAnother?: () => void;
  onLogMeal?: () => void;
}

const MacroPill = ({ label, value, emphasis }: MacroRemaining) => {
  if (emphasis) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col justify-between min-h-[140px]"
        style={{ background: PRIMARY_CONTAINER, color: "white" }}
      >
        <span className="text-xs font-semibold tracking-[0.12em] opacity-90 text-center">
          {label}
        </span>
        <span
          className="text-5xl text-center"
          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
        >
          {value}
        </span>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center justify-between"
      style={{ background: TERTIARY_FIXED, color: ON_BG }}
    >
      <span
        className="text-xs font-semibold tracking-[0.12em]"
        style={{ color: ON_SURFACE_VARIANT }}
      >
        {label}
      </span>
      <span
        className="text-2xl"
        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
};

const SuggestionCard = ({ meal }: { meal: SuggestedMeal }) => (
  <div
    className="rounded-2xl overflow-hidden bg-white border-l-4 shadow-sm"
    style={{ borderColor: PRIMARY_CONTAINER }}
  >
    <div className="relative">
      <img src={meal.image} alt={meal.title} className="w-full h-52 object-cover" />
      <div
        className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-white/95 backdrop-blur"
        style={{ color: PRIMARY }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold tracking-[0.1em]">{meal.badge}</span>
      </div>
    </div>
    <div className="p-5 space-y-3">
      <h3
        className="text-2xl leading-tight"
        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, color: ON_BG }}
      >
        {meal.title}
      </h3>
      <p className="text-sm" style={{ color: ON_SURFACE_VARIANT }}>
        {meal.meta}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {meal.macros.map((m) => (
          <span
            key={m.label}
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: "#c0c7d0", color: ON_BG }}
          >
            {m.label}: <span className="font-bold">{m.value}</span>
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default function CopilotMacroIntervention({
  data = mockData,
  onClose,
  onGenerateAnother,
  onLogMeal,
}: Props) {
  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: SURFACE, fontFamily: "Inter, sans-serif" }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#e4f3ff]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src={data.user.avatar}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <h1
            className="text-lg"
            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, color: PRIMARY }}
          >
            {data.brand}
          </h1>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ color: PRIMARY }}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-7">
        {/* Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: SURFACE_LOW, color: ON_BG }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h2
            className="text-2xl"
            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, color: ON_BG }}
          >
            {data.title}
          </h2>
        </div>

        {/* Remaining Macros */}
        <section className="space-y-4">
          <h3
            className="text-xl"
            style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, color: ON_BG }}
          >
            Remaining Macros
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MacroPill {...data.remaining[0]} />
            <div className="flex flex-col gap-3">
              {data.remaining.slice(1).map((m) => (
                <MacroPill key={m.label} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* Copilot Suggestion */}
        <SuggestionCard meal={data.suggestion} />

        {/* Generate Another */}
        <button
          onClick={onGenerateAnother}
          className="w-full text-center text-sm font-bold tracking-[0.12em] py-2"
          style={{ color: PRIMARY }}
        >
          GENERATE ANOTHER OPTION
        </button>
      </main>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-6 px-5">
        <div className="max-w-md mx-auto">
          <button
            onClick={onLogMeal}
            className="w-full rounded-full py-4 flex items-center justify-center gap-2 text-white font-bold tracking-wide shadow-lg active:scale-[0.99] transition"
            style={{ background: PRIMARY }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>LOG THIS MEAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
