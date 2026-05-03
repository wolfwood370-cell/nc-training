import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Video, PlusCircle, Send } from "lucide-react";

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
  avatarUrl?: string;
}

interface CoachDirectChatProps {
  coachName?: string;
  coachAvatarUrl?: string;
  online?: boolean;
  initialMessages?: ChatMessage[];
  onBack?: () => void;
  onVideoCall?: () => void;
  onSend?: (text: string) => void;
  onAttach?: () => void;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    text: "Great job on the squats yesterday. Make sure to prioritize recovery today.",
    time: "10:00 AM",
    fromMe: false,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    text: "Thanks! Will do. I feel a bit of soreness in my quads.",
    time: "10:05 AM",
    fromMe: true,
  },
  {
    id: "3",
    text: "Understood. I've adjusted your mobility routine in today's focus.",
    time: "10:10 AM",
    fromMe: false,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.fromMe) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[78%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
            <p className="text-[15px] leading-relaxed">{msg.text}</p>
          </div>
          <p className="mt-1 text-xs font-semibold text-muted-foreground text-right pr-1">
            {msg.time}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <img
        src={msg.avatarUrl}
        alt=""
        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
      />
      <div className="max-w-[78%]">
        <div className="bg-secondary text-foreground rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <p className="text-[15px] leading-relaxed">{msg.text}</p>
        </div>
        <p className="mt-1 text-xs font-semibold text-muted-foreground pl-1">
          {msg.time}
        </p>
      </div>
    </div>
  );
}

export function CoachDirectChat({
  coachName = "Coach Alexander",
  coachAvatarUrl = "https://i.pravatar.cc/150?img=47",
  online = true,
  initialMessages = DEFAULT_MESSAGES,
  onBack,
  onVideoCall,
  onSend,
  onAttach,
}: CoachDirectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, time, fromMe: true },
    ]);
    setInput("");
    onSend?.(text);
  };

  return (
    <div className="flex flex-col h-full bg-background font-['Inter']">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-3 px-3 h-16">
          <button
            onClick={onBack}
            aria-label="Back"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-shrink-0">
            <img
              src={coachAvatarUrl}
              alt={coachName}
              className="h-10 w-10 rounded-full object-cover"
            />
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
            )}
          </div>
          <h1 className="flex-1 text-lg font-bold text-foreground font-['Manrope'] truncate">
            {coachName}
          </h1>
          <button
            onClick={onVideoCall}
            aria-label="Video call"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <Video className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
      </main>

      {/* Input bar */}
      <footer
        className="flex-shrink-0 border-t border-border/40 bg-background px-3 py-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onAttach}
            aria-label="Attach"
            className="h-11 w-11 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <PlusCircle className="h-6 w-6" />
          </button>

          <div className="flex-1 bg-secondary rounded-full px-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message your coach..."
              className="w-full bg-transparent border-0 outline-none text-[15px] py-3 placeholder:text-muted-foreground/70"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send"
            className="h-11 w-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default CoachDirectChat;
