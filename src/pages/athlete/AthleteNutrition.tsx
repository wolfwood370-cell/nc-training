import { useState } from "react";
import { Settings, Check, Plus, Drumstick, Droplet, Wheat, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "today" | "week";

interface MacroRingProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  Icon: LucideIcon;
  colorClass: string;
}

interface MealCardProps {
  type: string;
  title: string;
  kcal: number;
  protein: number;
  imageUrl: string;
  logged?: boolean;
}

const MEALS: MealCardProps[] = [
  {
    type: "Colazione",
    title: "Avena e Frutti di Bosco",
    kcal: 450,
    protein: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=200&q=80",
    logged: true,
  },
  {
    type: "Pranzo",
    title: "Pollo Grigliato e Quinoa",
    kcal: 680,
    protein: 52,
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80",
    logged: true,
  },
  {
    type: "Spuntino",
    title: "Yogurt Greco e Mandorle",
    kcal: 320,
    protein: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=200&q=80",
    logged: true,
  },
];

function CalorieRing({ current, target }: { current: number; target: number }) {
  const size = 220;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, current / target));
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-container"
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary-container transition-[stroke-dashoffset] duration-1000 ease-out"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-5xl font-black text-on-surface tracking-tighter tabular-nums">
          {current.toLocaleString("it-IT")}
        </span>
        <span className="text-sm font-medium text-secondary mt-1">
          / {target.toLocaleString("it-IT")} kcal
        </span>
      </div>
    </div>
  );
}

function MacroRing({ label, current, target, unit, Icon, colorClass }: MacroRingProps) {
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, current / target));
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-container"
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={cn(colorClass, "transition-[stroke-dashoffset] duration-1000 ease-out")}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-6 w-6 text-on-surface" aria-hidden strokeWidth={1.75} />
        </div>
      </div>
      <span className="text-[10px] font-bold text-secondary uppercase mt-2 tracking-wider">
        {label}
      </span>
      <span className="text-xs font-semibold text-on-surface tabular-nums mt-0.5">
        {current}/{target}
        {unit}
      </span>
    </div>
  );
}

function MealCard({ type, title, kcal, protein, imageUrl, logged }: MealCardProps) {
  return (
    <div className="bg-white border border-surface-variant rounded-[24px] p-4 flex gap-4 items-center relative">
      {logged && (
        <span
          className="absolute -top-2 -right-2 bg-primary-container text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
          aria-label="Pasto registrato"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
      <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-secondary font-semibold uppercase tracking-wide">
          {type}
        </span>
        <span className="font-semibold text-on-surface truncate">{title}</span>
        <span className="text-xs text-secondary font-medium mt-1">
          {kcal} kcal • {protein}g Pro
        </span>
      </div>
    </div>
  );
}

export default function AthleteNutrition() {
  const [tab, setTab] = useState<TabKey>("today");

  const calories = { current: 2450, target: 3200 };
  const macros = {
    protein: { current: 110, target: 180 },
    fats: { current: 55, target: 90 },
    carbs: { current: 240, target: 380 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-surface-variant flex justify-between items-center px-6 py-4">
        <div
          className="w-10 h-10 rounded-full bg-surface-container overflow-hidden ring-1 ring-surface-variant"
          aria-label="Profilo atleta"
        >
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-display font-bold text-lg text-primary">
          Strategia Nutrizionale
        </h1>
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Impostazioni"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <main className="px-6 mt-6 space-y-6 max-w-md mx-auto pb-40 relative">
        {/* Segmented Control */}
        <div className="p-1 bg-surface-container rounded-full flex w-full">
          <button
            type="button"
            onClick={() => setTab("today")}
            className={cn(
              "flex-1 py-2 px-4 rounded-full font-semibold text-sm transition-all",
              tab === "today"
                ? "bg-primary-container text-white shadow-sm"
                : "text-secondary",
            )}
          >
            Oggi
          </button>
          <button
            type="button"
            onClick={() => setTab("week")}
            className={cn(
              "flex-1 py-2 px-4 rounded-full font-semibold text-sm transition-all",
              tab === "week"
                ? "bg-primary-container text-white shadow-sm"
                : "text-secondary",
            )}
          >
            Settimana
          </button>
        </div>

        {/* Calorie Bank Card */}
        <section className="bg-white/[0.7] backdrop-blur-md border border-surface-variant rounded-[32px] p-6 text-center shadow-sm relative overflow-hidden">
          <span className="absolute top-0 left-0 w-1.5 h-full bg-primary-container" aria-hidden />
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-4">
            Calorie Rimanenti
          </p>
          <div className="flex justify-center">
            <CalorieRing current={calories.current} target={calories.target} />
          </div>
        </section>

        {/* Macro Rings Card */}
        <section className="bg-white/[0.7] border border-surface-variant rounded-[32px] p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <MacroRing
              label="Pro"
              current={macros.protein.current}
              target={macros.protein.target}
              unit="g"
              Icon={Drumstick}
              colorClass="stroke-primary-container"
            />
            <MacroRing
              label="Grassi"
              current={macros.fats.current}
              target={macros.fats.target}
              unit="g"
              Icon={Droplet}
              colorClass="stroke-secondary"
            />
            <MacroRing
              label="Carb"
              current={macros.carbs.current}
              target={macros.carbs.target}
              unit="g"
              Icon={Wheat}
              colorClass="stroke-amber-400"
            />
          </div>
        </section>

        {/* Meal Timeline */}
        <section>
          <h2 className="font-display font-bold text-lg text-on-surface mb-4">
            I Tuoi Pasti
          </h2>
          <div className="space-y-4">
            {MEALS.map((meal) => (
              <MealCard key={`${meal.type}-${meal.title}`} {...meal} />
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button
        type="button"
        className="fixed bottom-28 right-6 z-40 bg-primary-container text-white px-5 py-4 rounded-full shadow-lg flex items-center gap-2 font-semibold hover:bg-primary transition-colors active:scale-95"
        aria-label="Aggiungi pasto"
      >
        <Plus className="h-5 w-5" strokeWidth={2.25} />
        Aggiungi Pasto
      </button>
    </div>
  );
}
