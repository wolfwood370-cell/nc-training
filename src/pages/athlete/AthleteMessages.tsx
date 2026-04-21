import { useState, useRef, useEffect } from"react";
import { AthleteLayout } from"@/components/athlete/AthleteLayout";
import { Card } from"@/components/ui/card";
import { ScrollArea } from"@/components/ui/scroll-area";
import { Button } from"@/components/ui/button";
import { Textarea } from"@/components/ui/textarea";
import { Badge } from"@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from"@/components/ui/avatar";
import {
  Bot,
  Brain,
  Loader2,
  MessageSquare,
  Send,
  User,
  Sparkles,
  HeadphonesIcon,
} from"lucide-react";
import { Switch } from"@/components/ui/switch";
import { Label } from"@/components/ui/label";
import { cn } from"@/lib/utils";
import { useAuth } from"@/hooks/useAuth";
import { useQuery } from"@tanstack/react-query";
import { supabase } from"@/integrations/supabase/client";
import ReactMarkdown from"react-markdown";
import { useChatRooms, useMessages } from"@/hooks/useChatRooms";

interface AiMessage {
  id: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  isAi?: boolean;
}

export default function AthleteMessages() {
  const { user } = useAuth();
  const [isAiMode, setIsAiMode] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Chat room logic ──
  const { rooms, isLoading: roomsLoading } = useChatRooms();
  const coachRoom = rooms.find((r) => r.type ==="direct");
  const roomId = coachRoom?.id ?? null;
  const { messages: realMessages, sendMessage, subscribeToMessages, isLoading: msgsLoading } = useMessages(roomId);

  // Determine the coach participant from room
  const coachParticipant = coachRoom?.participants.find((p) => p.user_id !== user?.id);

  // Fetch coach info fallback
  const { data: coachProfile } = useQuery({
    queryKey: ["athlete-coach-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", user.id)
        .single();
      if (!profile?.coach_id) return null;
      const { data: coach } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", profile.coach_id)
        .single();
      return coach;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  const coachName = coachParticipant?.profile?.full_name || coachProfile?.full_name ||"Coach";
  const coachAvatar = coachParticipant?.profile?.avatar_url || coachProfile?.avatar_url || undefined;

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToMessages(() => {});
    return unsub;
  }, [roomId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, realMessages]);

  // ── Send human message ──
  const handleSendHumanMessage = () => {
    if (!messageText.trim() || !roomId) return;
    sendMessage.mutate({ content: messageText.trim() });
    setMessageText("");
  };

  // ── Send AI message ──
  const handleSendAiMessage = async () => {
    if (!messageText.trim() || isAiLoading) return;

    const userMsg: AiMessage = {
      id:`user-${Date.now()}`,
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit"}),
      isMe: true,
    };

    const query = messageText.trim();
    setMessageText("");
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    const aiMsgId =`ai-${Date.now()}`;
    setAiMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        content:"",
        timestamp: new Date().toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit"}),
        isMe: false,
        isAi: true,
      },
    ]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Devi essere autenticato per usare l'AI.");

      const CHAT_URL =`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-coach`;
      const resp = await fetch(CHAT_URL, {
        method:"POST",
        headers: {
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`,
        },
        body: JSON.stringify({ query, history: aiHistory }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Troppe richieste, riprova tra poco.");
        if (resp.status === 402) throw new Error("Crediti AI esauriti.");
        throw new Error("Errore nella risposta AI");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer ="";
      let fullContent ="";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() ==="") continue;
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr ==="[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setAiMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
              );
            }
          } catch {
            textBuffer = line +"\n"+ textBuffer;
            break;
          }
        }
      }

      setAiHistory((prev) => [
        ...prev,
        { role:"user", content: query },
        { role:"assistant", content: fullContent },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      setAiMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content:`${err instanceof Error ? err.message :"Errore sconosciuto"}`}
            : m
        )
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSend = isAiMode ? handleSendAiMessage : handleSendHumanMessage;

  return (
    <AthleteLayout title="Messaggi">
      <div className="flex flex-col h-[calc(100dvh-12rem)] lg:h-[calc(100%-2rem)] px-4 pt-2">
        {/* Mode Toggle */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 rounded-xl mb-3 transition-colors duration-300",
          isAiMode
            ?"bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"            :"bg-muted/50 border border-border/50"        )}>
          <div className="flex items-center gap-3">
            {isAiMode ? (
              <>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <Brain className="h-4.5 w-4.5 text-white"/>
                </div>
                <div>
                  <h3 className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
                     Parla con AI
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Risponde dai documenti del coach</p>
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={coachAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {coachName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold"> Parla col Coach</h3>
                  <p className="text-[10px] text-muted-foreground">{coachName}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="ai-toggle"className="text-[10px] text-muted-foreground">
              {isAiMode ?"AI":"Coach"}
            </Label>
            <Switch
              id="ai-toggle"              checked={isAiMode}
              onCheckedChange={setIsAiMode}
              className={cn(
                isAiMode &&"data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-violet-500 data-[state=checked]:to-cyan-500"              )}
            />
          </div>
        </div>

        {/* Chat Area */}
        <Card className={cn(
          "flex-1 flex flex-col overflow-hidden border-0 shadow-sm transition-colors duration-300",
          isAiMode &&"ring-1 ring-violet-500/20"        )}>
          <ScrollArea className="flex-1"ref={scrollRef}>
            <div className="p-4 space-y-4">
              {/* ── AI MODE ── */}
              {isAiMode && aiMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                    <Sparkles className="h-7 w-7 text-violet-500"/>
                  </div>
                  <h3 className="text-base font-semibold mb-1">Assistente AI del Coach</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Chiedi qualsiasi cosa sull'allenamento. Rispondo basandomi sui materiali del tuo coach.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 max-w-sm justify-center">
                    {["Come faccio lo squat?","Quante serie devo fare?","Consigli per il recupero"].map((q) => (
                      <Button key={q} variant="outline"size="sm"className="text-xs border-violet-500/20 hover:bg-violet-500/5"onClick={() => setMessageText(q)}>
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {isAiMode && aiMessages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.isMe ?"justify-end":"justify-start")}>
                  {msg.isAi && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white"/>
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.isMe
                      ?"bg-primary text-primary-foreground rounded-tr-sm"                      :"bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-tl-sm"                  )}>
                    {msg.isAi ? (
                      msg.content ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500"/>
                          <span className="italic animate-pulse">Cerco nei manuali del coach...</span>
                        </div>
                      )
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <div className={cn("flex items-center justify-end gap-1 mt-1", msg.isMe ?"text-primary-foreground/70":"text-muted-foreground")}>
                      <span className="text-[10px]">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── COACH MODE ── */}
              {!isAiMode && !roomsLoading && !roomId && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <HeadphonesIcon className="h-7 w-7 text-muted-foreground"/>
                  </div>
                  <h3 className="text-base font-semibold mb-1">In attesa del Coach</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    La chat con il tuo coach sarà disponibile appena verrai assegnato. Nel frattempo usa la modalità AI!
                  </p>
                  <Badge variant="secondary"className="text-xs mt-3">In attesa di assegnazione</Badge>
                </div>
              )}

              {!isAiMode && (roomsLoading || msgsLoading) && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                </div>
              )}

              {!isAiMode && roomId && !msgsLoading && realMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="h-7 w-7 text-muted-foreground"/>
                  </div>
                  <h3 className="text-base font-semibold mb-1">Nessun messaggio</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Inizia la conversazione con il tuo coach!
                  </p>
                </div>
              )}

              {!isAiMode && roomId && realMessages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const time = new Date(msg.created_at).toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit"});
                return (
                  <div key={msg.id} className={cn("flex", isMe ?"justify-end":"justify-start")}>
                    {!isMe && (
                      <Avatar className="h-7 w-7 mr-2 mt-1 flex-shrink-0">
                        <AvatarImage src={coachAvatar} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{coachName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      isMe
                        ?"bg-primary text-primary-foreground rounded-tr-sm"                        :"bg-muted rounded-tl-sm"                    )}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={cn("flex items-center justify-end mt-1", isMe ?"text-primary-foreground/70":"text-muted-foreground")}>
                        <span className="text-[10px]">{time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Input – show for AI mode always, for coach mode only when room exists */}
          {(isAiMode || roomId) && (
            <div className={cn(
              "border-t p-3 flex-shrink-0",
              isAiMode
                ?"border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-cyan-500/5"                :"border-border"            )}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder={isAiMode ?"Chiedi al Coach AI...":`Scrivi a ${coachName}...`}
                    className={cn(
                      "min-h-[42px] max-h-28 resize-none text-sm",
                      isAiMode &&"border-violet-500/20 focus-visible:ring-violet-500/30"                    )}
                    rows={1}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key ==="Enter"&& !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
                <Button
                  size="icon"                  className={cn(
                    "h-10 w-10 shrink-0",
                    isAiMode &&"bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"                  )}
                  disabled={!messageText.trim() || (isAiMode && isAiLoading) || (!isAiMode && sendMessage.isPending)}
                  onClick={handleSend}
                >
                  {(isAiLoading || sendMessage.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                  ) : (
                    <Send className="h-4 w-4"/>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AthleteLayout>
  );
}
