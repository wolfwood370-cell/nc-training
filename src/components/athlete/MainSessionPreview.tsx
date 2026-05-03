import { Menu, Dumbbell, Activity, Clock, Zap, ClipboardList } from "lucide-react";

export interface BlockExercise {
  id: string;
  label: string; // e.g. "A1." or "B1"
  name: string;
  detail?: string; // "8 Reps • Tempo: 3-0-1-0"
  reps?: string; // "15 Reps", "Max Reps" — chip variant
}

export interface SessionBlock {
  id: string;
  title: string; // "Blocco A • Superset"
  badge?: string; // "4 SERIE" or "AMRAP 12 Minuti"
  badgeVariant?: "text" | "chip";
  exercises: BlockExercise[];
  variant?: "stacked" | "compact"; // stacked = icon rows w/ details; compact = chip rows
  recovery?: { icon?: "clock" | "bolt"; text: string };
}

export interface MainSessionPreviewProps {
  programTitle?: string;
  phaseTitle: string;
  phaseSubtitle?: string;
  blocks: SessionBlock[];
  performanceNote?: string;
  avatarUrl?: string;
  onMenu?: () => void;
}

export const MainSessionPreview = ({
  programTitle = "Elite Performance",
  phaseTitle,
  phaseSubtitle,
  blocks,
  performanceNote,
  avatarUrl,
  onMenu,
}: MainSessionPreviewProps) => {
  return (
    <div className="min-h-screen bg-background font-[Inter] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="p-2 -ml-2 text-primary" aria-label="Menu">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-[Manrope] font-bold text-primary uppercase tracking-wider text-sm">
            {programTitle}
          </h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="font-[Manrope] font-bold text-primary text-sm">A</span>
          )}
        </div>
      </header>

      <main className="px-4 py-5 space-y-5">
        {/* Phase header */}
        <section>
          <h2 className="font-[Manrope] font-bold text-3xl text-foreground leading-tight">
            {phaseTitle}
          </h2>
          {phaseSubtitle && (
            <p className="mt-1 text-primary font-[Manrope] font-semibold">{phaseSubtitle}</p>
          )}
        </section>

        {/* Blocks */}
        {blocks.map((b) => (
          <section
            key={b.id}
            className="bg-card rounded-2xl p-5 border border-border border-l-4 border-l-primary space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-foreground">
                {b.title}
              </p>
              {b.badge && b.badgeVariant !== "chip" && (
                <p className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  {b.badge}
                </p>
              )}
            </div>

            {b.badge && b.badgeVariant === "chip" && (
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-[Manrope] font-bold uppercase tracking-wider">
                {b.badge}
              </span>
            )}

            {/* Exercises */}
            {b.variant === "compact" ? (
              <ul className="space-y-3">
                {b.exercises.map((ex) => (
                  <li key={ex.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-[Manrope] font-bold text-xs text-primary w-6 flex-shrink-0">
                        {ex.label}
                      </span>
                      <span className="font-[Manrope] font-semibold text-foreground truncate">
                        {ex.name}
                      </span>
                    </div>
                    {ex.reps && (
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-foreground text-xs font-semibold flex-shrink-0">
                        {ex.reps}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-border">
                {b.exercises.map((ex) => (
                  <li key={ex.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-[Manrope] font-semibold text-foreground">
                        {ex.label} {ex.name}
                      </p>
                      {ex.detail && (
                        <p className="text-sm text-muted-foreground">{ex.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Recovery */}
            {b.recovery && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/5">
                {b.recovery.icon === "bolt" ? (
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <p className="font-[Manrope] font-bold text-xs uppercase tracking-wider text-foreground">
                  {b.recovery.text}
                </p>
              </div>
            )}
          </section>
        ))}

        {/* Performance Note */}
        {performanceNote && (
          <section className="bg-primary/5 rounded-2xl p-5 border-l-4 border-primary flex gap-3">
            <ClipboardList className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-[Manrope] font-bold text-primary mb-1">Performance Note</h3>
              <p className="text-sm text-foreground leading-relaxed">{performanceNote}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MainSessionPreview;
