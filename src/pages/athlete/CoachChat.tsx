import { useState, useRef, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, PlusCircle, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAthleteProfile } from "@/hooks/useAthleteProfile";
import { useChatRooms, useMessages } from "@/hooks/useChatRooms";
import { toast } from "sonner";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=faces";

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export default function CoachChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coach } = useAthleteProfile();
  const { getOrCreateDirectRoom } = useChatRooms();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Resolve direct room with the coach
  useEffect(() => {
    if (!coach.coachId || roomId) return;
    getOrCreateDirectRoom.mutate(coach.coachId, {
      onSuccess: (id) => setRoomId(id),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Impossibile aprire la chat"
        ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach.coachId]);

  const { messages, sendMessage, subscribeToMessages, isLoading } = useMessages(roomId);

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = subscribeToMessages(() => {});
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !roomId || sendMessage.isPending) return;
    sendMessage.mutate(
      { content: trimmed, media_type: "text" },
      {
        onSuccess: () => setInput(""),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Invio non riuscito"
          ),
      }
    );
  };

  const coachAvatar = coach.logoUrl ?? FALLBACK_AVATAR;
  const coachName = coach.coachName ?? "Coach";

  return (
    <div className="min-h-screen bg-surface-container-lowest font-sans flex flex-col">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-lg border-b border-surface-variant shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={coachAvatar}
              alt={coachName}
              className="relative w-10 h-10 rounded-full object-cover border border-outline-variant/30"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <h1 className="font-display text-lg font-semibold text-on-surface">
            {coachName}
          </h1>
        </div>

        <button
          type="button"
          className="text-on-surface hover:text-primary transition-colors"
          aria-label="Videochiamata"
        >
          <Video className="w-6 h-6" />
        </button>
      </header>

      {/* Chat Canvas */}
      <main className="flex-1 overflow-y-auto px-4 pt-24 pb-28 flex flex-col gap-6 w-full max-w-2xl mx-auto">
        {isLoading && (
          <div className="flex justify-center pt-10 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && roomId && (
          <p className="text-center text-sm text-on-surface-variant pt-10">
            Inizia la conversazione con il tuo coach.
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          if (!isMine) {
            return (
              <div key={msg.id} className="flex items-end gap-3 self-start max-w-[85%]">
                <img
                  src={coachAvatar}
                  alt="Coach"
                  className="w-8 h-8 rounded-full shrink-0 object-cover"
                />
                <div>
                  <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-bl-sm shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 ml-1">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="flex items-end gap-3 self-end max-w-[85%]">
              <div className="flex flex-col items-end">
                <div className="bg-primary-container text-white p-4 rounded-2xl rounded-br-sm shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 mr-1 text-right">
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      {/* Bottom Input */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-surface-variant p-4 pb-8 z-50"
      >
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            type="button"
            className="text-on-surface-variant hover:text-primary shrink-0 transition-colors"
            aria-label="Allega"
          >
            <PlusCircle className="w-6 h-6" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi al coach..."
            disabled={!roomId}
            className="flex-1 bg-surface-container-low text-on-surface text-base rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-primary-container placeholder:text-on-surface-variant/70 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!roomId || !input.trim() || sendMessage.isPending}
            className="bg-primary-container text-white p-3 rounded-full flex items-center justify-center shrink-0 hover:scale-95 transition-transform shadow-sm disabled:opacity-60"
            aria-label="Invia"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
