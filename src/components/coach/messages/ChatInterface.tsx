import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Send,
  Mic,
  Image,
  Link2,
  Info,
  ArrowLeft,
  CheckCheck,
  Play,
  Pause,
  ExternalLink,
  Bot,
  User,
  Loader2,
  Brain,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "./ChatList";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useAiQuota } from "@/hooks/useAiQuota";

// Mock message types for demo
type MessageType = "text" | "audio" | "image" | "link";

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  isMe: boolean;
  isAi?: boolean;
  metadata?: {
    audioWaveform?: number[];
    audioDuration?: string;
    imageUrl?: string;
    linkPreview?: {
      title: string;
      description: string;
      thumbnail: string;
      url: string;
      provider: string;
    };
  };
}

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onBack: () => void;
  onToggleContext: () => void;
  showContextButton: boolean;
}

// Audio Waveform Component
function AudioPlayer({
  waveform,
  duration,
}: {
  waveform: number[];
  duration: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <div className="flex items-center gap-0.5 flex-1">
        {waveform.map((height, i) => (
          <div
            key={i}
            className="w-1 bg-current opacity-60 rounded-full"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>
      <span className="text-xs opacity-70 shrink-0">{duration}</span>
    </div>
  );
}

// Link Preview Component
function LinkPreview({
  preview,
}: {
  preview: NonNullable<Message["metadata"]>["linkPreview"];
}) {
  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors mt-2"
    >
      {preview.thumbnail && (
        <div className="aspect-video bg-muted relative">
          <img
            src={preview.thumbnail}
            alt={preview.title}
            className="w-full h-full object-cover"
          />
          {preview.provider.toLowerCase().includes("youtube") ||
          preview.provider.toLowerCase().includes("loom") ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="h-6 w-6 text-white ml-1" />
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <ExternalLink className="h-3 w-3" />
          {preview.provider}
        </div>
        <p className="text-sm font-medium line-clamp-1">{preview.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {preview.description}
        </p>
      </div>
    </a>
  );
}

// Sample messages for demo
const mockMessages: Message[] = [
  {
    id: "1",
    type: "text",
    content: "Ciao coach! Ho completato l'allenamento di oggi",
    timestamp: "10:30",
    isMe: false,
  },
  {
    id: "2",
    type: "text",
    content: "Ottimo lavoro! Come ti sei sentito durante la sessione?",
    timestamp: "10:35",
    isMe: true,
  },
  {
    id: "3",
    type: "audio",
    content: "",
    timestamp: "10:40",
    isMe: false,
    metadata: {
      audioWaveform: [
        8, 12, 18, 14, 20, 16, 22, 18, 14, 10, 16, 20, 24, 18, 12, 8, 14, 18,
        16, 12,
      ],
      audioDuration: "0:32",
    },
  },
  {
    id: "4",
    type: "image",
    content: "Post-workout selfie!",
    timestamp: "10:45",
    isMe: false,
    metadata: {
      imageUrl:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    },
  },
  {
    id: "5",
    type: "link",
    content: "Guarda questo video sulla tecnica corretta",
    timestamp: "10:50",
    isMe: true,
    metadata: {
      linkPreview: {
        title: "Perfect Squat Form - Complete Tutorial",
        description:
          "Learn the perfect squat technique with this comprehensive guide covering stance, depth, and common mistakes.",
        thumbnail:
          "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400&h=225&fit=crop",
        url: "https://www.youtube.com/watch?v=example",
        provider: "YouTube",
      },
    },
  },
  {
    id: "6",
    type: "text",
    content: "Perfetto! Lo guardo subito. Grazie mille coach!",
    timestamp: "10:52",
    isMe: false,
  },
];

export function ChatInterface({
  conversation,
  onBack,
  onToggleContext,
  showContextButton,
}: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<
    { role: string; content: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: quota, refetch: refetchQuota } = useAiQuota(isAiMode);
  const quotaExhausted = quota
    ? quota.message_count >= quota.daily_limit
    : false;

  // Scroll to bottom when AI messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const handleSendAiMessage = async () => {
    if (!messageText.trim() || isAiLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: "text",
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };

    const query = messageText.trim();
    setMessageText("");
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    // Create placeholder AI message
    const aiMsgId = `ai-${Date.now()}`;
    setAiMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        type: "text",
        content: "",
        timestamp: new Date().toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: false,
        isAi: true,
      },
    ]);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-coach`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, history: aiHistory }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          throw new Error("Troppe richieste, riprova tra poco.");
        }
        if (resp.status === 402) {
          throw new Error("Crediti AI esauriti.");
        }
        throw new Error("Errore nella risposta AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data:")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as
              | string
              | undefined;
            if (content) {
              fullContent += content;
              setAiMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: fullContent } : m,
                ),
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Update history for follow-up questions
      setAiHistory((prev) => [
        ...prev,
        { role: "user", content: query },
        { role: "assistant", content: fullContent },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      setAiMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: `${err instanceof Error ? err.message : "Errore sconosciuto"}`,
              }
            : m,
        ),
      );
    } finally {
      setIsAiLoading(false);
      refetchQuota();
    }
  };

  if (!conversation) {
    return (
      <Card className="border-0 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Seleziona una conversazione
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Scegli un atleta dalla lista per iniziare a messaggiare.
          </p>
        </div>
      </Card>
    );
  }

  const displayMessages = isAiMode ? aiMessages : mockMessages;

  return (
    <Card
      className={cn(
        "border-0 shadow-sm flex flex-col overflow-hidden h-full transition-colors duration-300",
        isAiMode && "ring-1 ring-violet-500/30",
      )}
    >
      {/* Chat Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b flex-shrink-0 transition-colors duration-300",
          isAiMode &&
            "bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border-violet-500/20",
        )}
      >
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {isAiMode ? (
            <>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
                  Assistente AI Coach
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Risponde dalla knowledge base del coach
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {conversation.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {conversation.athleteName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {conversation.isOnline ? "Online" : "Ultima attività 2h fa"}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* AI Mode Toggle */}
          <div className="flex items-center gap-2">
            <Label
              htmlFor="ai-mode"
              className="text-[10px] text-muted-foreground cursor-pointer"
            >
              {isAiMode ? (
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3 text-violet-500" /> AI
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> Coach
                </span>
              )}
            </Label>
            <Switch
              id="ai-mode"
              checked={isAiMode}
              onCheckedChange={setIsAiMode}
              className={cn(
                isAiMode &&
                  "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-cyan-500",
              )}
            />
          </div>

          {/* Quota Badge */}
          {isAiMode && quota && (
            <Badge
              variant={quotaExhausted ? "destructive" : "secondary"}
              className="text-[10px] shrink-0"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {quotaExhausted
                ? "Crediti AI esauriti"
                : `${quota.message_count}/${quota.daily_limit} oggi`}
            </Badge>
          )}

          {/* Context Toggle (Mobile) */}
          {showContextButton && !isAiMode && (
            <Button variant="ghost" size="icon" onClick={onToggleContext}>
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {/* AI Welcome message */}
          {isAiMode && aiMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                Assistente AI del Coach
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Il tuo assistente virtuale risponde basandosi sui documenti e i
                materiali del coach.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 max-w-sm justify-center">
                {[
                  "Come faccio lo squat correttamente?",
                  "Quante serie devo fare?",
                  "Tecnica di panca piana",
                ].map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs border-violet-500/20 hover:bg-violet-500/5"
                    onClick={() => {
                      setMessageText(q);
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}
            >
              {/* AI avatar */}
              {msg.isAi && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  msg.isMe
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.isAi
                      ? "bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-tl-sm"
                      : "bg-muted rounded-tl-sm",
                )}
              >
                {/* Text Message */}
                {msg.type === "text" &&
                  (msg.isAi ? (
                    msg.content ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                        <span className="italic animate-pulse">
                          Cerco nei manuali del coach...
                        </span>
                      </div>
                    )
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  ))}

                {/* Audio Message */}
                {msg.type === "audio" && msg.metadata?.audioWaveform && (
                  <AudioPlayer
                    waveform={msg.metadata.audioWaveform}
                    duration={msg.metadata.audioDuration || "0:00"}
                  />
                )}

                {/* Image Message */}
                {msg.type === "image" && (
                  <div>
                    {msg.content && (
                      <p className="text-sm mb-2">{msg.content}</p>
                    )}
                    <img
                      src={msg.metadata?.imageUrl}
                      alt="Shared image"
                      className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}

                {/* Link Message with Preview */}
                {msg.type === "link" && (
                  <div>
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <LinkPreview preview={msg.metadata?.linkPreview} />
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1",
                    msg.isMe
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="text-[10px]">{msg.timestamp}</span>
                  {msg.isMe && <CheckCheck className="h-3 w-3" />}
                  {msg.isAi && <Bot className="h-3 w-3 text-violet-500" />}
                </div>
              </div>
            </div>
          ))}

          {/* Coming Soon Notice - only in human mode */}
          {!isAiMode && (
            <div className="text-center py-4">
              <Badge variant="secondary" className="text-xs">
                Chat in tempo reale in arrivo
              </Badge>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div
        className={cn(
          "border-t p-4 flex-shrink-0 transition-colors duration-300",
          isAiMode &&
            "border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-cyan-500/5",
        )}
      >
        <div className="flex items-end gap-2">
          {/* Action Buttons - hidden in AI mode */}
          {!isAiMode && (
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              placeholder={
                isAiMode
                  ? quotaExhausted
                    ? "Limite giornaliero raggiunto..."
                    : "Chiedi al Coach AI (risponde dai documenti)..."
                  : "Scrivi un messaggio..."
              }
              className={cn(
                "min-h-[44px] max-h-32 resize-none",
                isAiMode &&
                  "border-violet-500/20 focus-visible:ring-violet-500/30",
              )}
              rows={1}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && isAiMode) {
                  e.preventDefault();
                  handleSendAiMessage();
                }
              }}
            />
          </div>

          {/* Send Button */}
          <Button
            size="icon"
            className={cn(
              "h-10 w-10 shrink-0",
              isAiMode &&
                "bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600",
            )}
            disabled={
              !messageText.trim() || isAiLoading || (isAiMode && quotaExhausted)
            }
            onClick={isAiMode ? handleSendAiMessage : undefined}
          >
            {isAiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {isAiMode
            ? quotaExhausted
              ? "Hai raggiunto il limite giornaliero. L'assistente tornerà domani!"
              : "Il tuo assistente virtuale sta cercando nei manuali del coach..."
            : "Per i video, usa Loom o YouTube e condividi il link"}
        </p>
      </div>
    </Card>
  );
}
