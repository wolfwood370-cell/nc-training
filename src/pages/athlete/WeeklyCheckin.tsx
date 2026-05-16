// =============================================================================
// src/pages/athlete/WeeklyCheckin.tsx
// =============================================================================
// Phase 4 of the new Athlete App — Weekly Check-in, "Focus Mode".
//
// Minimalist single-task surface: a photo placeholder, a long-form
// narrative textarea, and a sticky bottom CTA. Designed to remove visual
// noise so the athlete can actually reflect on the week.
//
// Mount: SIBLING of <AthleteLayout> at /athlete/weekly-checkin — same
// rationale as DailyCheckin and AthleteReadinessDetails. The page owns
// its own sticky bottom action bar; nesting it under the layout would
// duplicate the bottom-fixed UI (Save vs BottomNavBar). The X button in
// the top bar is the single, unambiguous escape back to /athlete.
//
// No Supabase writes — `handleSubmit` logs the payload preview and toasts
// the user. Backend wiring lands in the follow-up commit.
//
// Note: the source HTML reference (weekly_check_in_focus_mode.html) was
// not accessible from disk at write time. The layout is reconstructed
// from the brief's structural requirements + the Aura Health System
// tokens already established by Phases 1–3.
// =============================================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Camera, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Tunables
// -----------------------------------------------------------------------------
const NARRATIVE_MAX_LEN = 1500;

export default function WeeklyCheckin() {
  const navigate = useNavigate();

  // -- State ----------------------------------------------------------------
  // Narrative text (controlled textarea, hard-capped to keep payloads bounded).
  const [narrative, setNarrative] = useState("");

  // Photo upload is a *visual* placeholder per brief — clicking the area
  // toggles between "empty" and "selected" states. No real file picker yet;
  // the eventual implementation will swap this for a hidden <input type="file"
  // accept="image/*" capture="environment" /> + an upload to Supabase Storage.
  const [photoSelected, setPhotoSelected] = useState(false);

  // -- Handlers -------------------------------------------------------------
  const handleClose = () => {
    navigate("/athlete");
  };

  const togglePhoto = () => {
    setPhotoSelected((prev) => !prev);
  };

  const handleSubmit = () => {
    // Payload shape mirrors what the Supabase insert will need next phase.
    // eslint-disable-next-line no-console
    console.info("[WeeklyCheckin] payload preview", {
      narrative: narrative.trim(),
      photoSelected,
    });
    toast.success("Check-in inviato", {
      description: "Il tuo coach lo riceverà a breve.",
    });
    navigate("/athlete");
  };

  const canSubmit = narrative.trim().length > 0 || photoSelected;
  const charCount = narrative.length;

  return (
    <div className="min-h-[100dvh] bg-surface text-on-surface font-sans antialiased pb-[140px]">
      {/* ---------------------------------------------------------------
         Top App Bar — fixed, glass, X button left, centered title
         --------------------------------------------------------------- */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40",
          "h-16 flex items-center px-4",
          "backdrop-blur-xl bg-white/85",
          "border-b border-[#c0c7d0]/40",
        )}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Chiudi check-in e torna alla dashboard"
          className={cn(
            "h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "text-brand-container",
            "transition-colors hover:bg-surface-container/60",
            "active:scale-95",
          )}
        >
          <X className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
        </button>
        <h1 className="flex-1 text-center -ml-10 font-display text-lg font-bold tracking-tight text-on-surface">
          Check-in Settimanale
        </h1>
      </header>

      {/* ---------------------------------------------------------------
         Main canvas — generous spacing, max-w narrow for focus
         --------------------------------------------------------------- */}
      <main className="pt-20 px-5 max-w-lg mx-auto flex flex-col gap-6">
        {/* Intro — single sentence, sets the reflective tone */}
        <section className="pt-2">
          <span className="font-display text-xs font-semibold tracking-widest uppercase text-brand-container">
            Riflessione settimanale
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-on-surface">
            Com'è andata questa settimana?
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Allenamenti, energia, sonno, recupero. Anche una foto di progresso,
            se vuoi. Il tuo coach legge tutto.
          </p>
        </section>

        {/* -------- Photo upload placeholder ----------------------- */}
        <section aria-label="Foto di progresso opzionale">
          <button
            type="button"
            onClick={togglePhoto}
            aria-pressed={photoSelected}
            className={cn(
              "w-full",
              "rounded-3xl p-8",
              "flex flex-col items-center justify-center gap-3",
              "transition-all duration-200 active:scale-[0.99]",
              photoSelected
                ? "bg-brand-container/10 border border-brand-container/30"
                : "bg-white/60 backdrop-blur-xl border border-dashed border-[#c0c7d0] hover:bg-white/80",
              "min-h-[160px]",
            )}
          >
            <div
              className={cn(
                "h-14 w-14 rounded-full",
                "flex items-center justify-center",
                "transition-colors",
                photoSelected
                  ? "bg-brand-container text-white"
                  : "bg-surface-container text-brand-container",
              )}
              aria-hidden="true"
            >
              {photoSelected ? (
                <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
              ) : (
                <Camera className="h-7 w-7" strokeWidth={1.75} />
              )}
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "font-display text-base font-semibold",
                  photoSelected ? "text-brand-container" : "text-on-surface",
                )}
              >
                {photoSelected ? "Foto aggiunta" : "Aggiungi foto progresso"}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {photoSelected
                  ? "Tocca per rimuovere"
                  : "Opzionale · JPG, PNG"}
              </p>
            </div>
          </button>
        </section>

        {/* -------- Narrative textarea ----------------------------- */}
        <section
          aria-label="Resoconto narrativo della settimana"
          className={cn(
            "rounded-3xl p-6",
            "bg-white/70 backdrop-blur-xl",
            "border border-[#c0c7d0]/30",
            "shadow-[0_10px_30px_rgba(80,118,142,0.05)]",
          )}
        >
          <label
            htmlFor="weekly-narrative"
            className="block font-display text-xs font-semibold tracking-widest uppercase text-brand-container mb-3"
          >
            Il tuo resoconto
          </label>
          <textarea
            id="weekly-narrative"
            value={narrative}
            onChange={(e) =>
              setNarrative(e.target.value.slice(0, NARRATIVE_MAX_LEN))
            }
            maxLength={NARRATIVE_MAX_LEN}
            placeholder="Allenamenti, sensazioni, sonno, energia, recupero. Scrivi quanto vuoi — il tuo coach legge tutto."
            rows={8}
            className={cn(
              "w-full resize-none",
              "bg-transparent",
              "font-sans text-base leading-relaxed text-on-surface",
              "placeholder:text-on-surface-variant/60",
              "focus:outline-none",
            )}
          />
          <div className="flex justify-end mt-2">
            <span
              className={cn(
                "font-sans text-[11px] tabular-nums",
                charCount >= NARRATIVE_MAX_LEN
                  ? "text-error font-semibold"
                  : "text-on-surface-variant/70",
              )}
              aria-live="polite"
            >
              {charCount} / {NARRATIVE_MAX_LEN}
            </span>
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------------
         Sticky bottom action bar — glass, single "Invia Check-in" CTA
         --------------------------------------------------------------- */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50",
          "backdrop-blur-2xl bg-white/90",
          "border-t border-[#c0c7d0]/40",
          "rounded-t-[32px]",
          "shadow-[0_-10px_40px_rgba(80,118,142,0.1)]",
          "pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]",
        )}
      >
        <div className="max-w-lg mx-auto px-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full py-4 rounded-full",
              "flex items-center justify-center gap-2",
              "bg-brand-container text-white",
              "font-display text-sm font-bold uppercase tracking-widest",
              "shadow-[0_8px_20px_rgba(34,111,163,0.3)]",
              "transition-all duration-200",
              "hover:brightness-110 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "disabled:active:scale-100 disabled:hover:brightness-100",
            )}
          >
            <Send className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            Invia Check-in
          </button>
        </div>
      </div>
    </div>
  );
}
