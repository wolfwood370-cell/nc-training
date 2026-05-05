import { useState, useRef, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Brain, PlusCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "copilot" | "athlete";
  text: string;
  timestamp: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "seed-1",
    role: "copilot",
    text: "La costanza è la base della performance d'élite. I tuoi dati giornalieri indicano un ottimo recupero neurale. Suggerisco di mantenere il sovraccarico progressivo programmato per oggi.",
    timestamp: "09:12",
  },
  {
    id: "seed-2",
    role: "athlete",
    text: "Perfetto, mi sento molto bene oggi. Pronto a spingere nello squat.",
    timestamp: "09:14",
  },
];

export default function AthleteCopilot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // AI Quota (mock visual values per design spec)
  const quotaRemaining = 8;
  const quotaTotal = 10;
  const quotaPct = Math.round((quotaRemaining / quotaTotal) * 100);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: "athlete",
        text: trimmed,
        timestamp: formatTime(new Date()),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/70 backdrop-blur-xl border-b border-surface-variant">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="text-on-surface hover:text-violet-600 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold text-on-surface">Coach Copilot</h1>
        <button
          type="button"
          aria-label="Altre opzioni"
          className="text-on-surface hover:text-violet-600 transition-colors"
        >
          <MoreVertical size={22} />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-6 max-w-md mx-auto flex flex-col gap-6">
        {/* AI Quota Card */}
        <section className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              Quota Copilot AI
            </span>
            <span className="text-sm font-bold">
              {quotaRemaining} / {quotaTotal} Rimaste
            </span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <p className="text-xs opacity-70 mt-2">
            La tua quota si ricaricherà automaticamente lunedì.
          </p>
        </section>

        {/* Chat Canvas */}
        <section className="flex flex-col gap-4">
          {messages.map((m) =>
            m.role === "copilot" ? (
              <article
                key={m.id}
                className="bg-white rounded-[24px] p-5 border border-surface-variant shadow-sm relative overflow-hidden flex flex-col gap-3 self-start max-w-[90%]"
              >
                <header className="flex items-center gap-2 text-violet-600">
                  <Brain size={16} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Copilot Insight
                  </span>
                </header>
                <p className="text-sm text-on-surface leading-relaxed">{m.text}</p>
                <span className="text-[10px] text-outline mt-1 self-start">
                  {m.timestamp}
                </span>
              </article>
            ) : (
              <article
                key={m.id}
                className="bg-slate-900 text-white rounded-[24px] p-4 rounded-tr-sm shadow-sm self-end max-w-[85%] flex flex-col gap-1"
              >
                <p className="text-sm">{m.text}</p>
                <span className="text-[10px] opacity-60 text-right mt-1">
                  {m.timestamp}
                </span>
              </article>
            ),
          )}
          <div ref={scrollAnchorRef} />
        </section>
      </main>

      {/* Bottom Input Area */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-surface-variant p-4 pb-8 z-50"
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            type="button"
            aria-label="Aggiungi allegato"
            className="text-outline hover:text-violet-600 shrink-0 transition-colors"
          >
            <PlusCircle size={26} />
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Chiedi al Copilot..."
            className="flex-1 bg-surface-container-low text-on-surface text-base rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-outline-variant/70"
          />
          <button
            type="submit"
            aria-label="Invia messaggio"
            className="bg-violet-600 text-white p-3 rounded-full flex items-center justify-center shrink-0 hover:bg-violet-700 transition-colors shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
