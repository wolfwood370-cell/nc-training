import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Radio, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export interface Conversation {
  athleteId: string;
  athleteName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
  isOnline: boolean;
}

interface ChatListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatList({
  conversations,
  isLoading,
  selectedConversation,
  onSelectConversation,
  isOpen,
  onClose,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const getTimeAgo = (date: Date | null) => {
    if (!date) return "";
    return formatDistanceToNow(date, { addSuffix: false, locale: it });
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.athleteName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "inbox") {
      return matchesSearch && conv.unreadCount > 0;
    }
    return matchesSearch;
  });

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <Card
      className={cn(
        "border-0 shadow-sm flex flex-col overflow-hidden h-full",
        "lg:relative lg:translate-x-0 lg:opacity-100",
        "fixed inset-y-0 left-0 z-50 w-80 transition-all duration-300 lg:w-full",
        isOpen
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100",
      )}
    >
      {/* Mobile Back Button */}
      <div className="lg:hidden flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Conversazioni</span>
      </div>

      {/* Tabs */}
      <CardHeader className="pb-2 flex-shrink-0 space-y-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-9">
            <TabsTrigger value="inbox" className="flex-1 text-xs gap-1.5">
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-3xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs">
              Tutti
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="flex-1 text-xs">
              Broadcast
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca atleta..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>

      {/* Conversations List */}
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "broadcasts" ? (
            <div className="p-6 text-center text-muted-foreground">
              <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Broadcast</p>
              <p className="text-xs mt-1">Invia messaggi a più atleti contemporaneamente</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">
                {activeTab === "inbox" ? "Nessun messaggio non letto" : "Nessun atleta trovato"}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.athleteId}
                  onClick={() => onSelectConversation(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    "hover:bg-muted/50",
                    selectedConversation?.athleteId === conv.athleteId && "bg-muted",
                  )}
                >
                  {/* Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {conv.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    {conv.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </div>

                  {/* Name & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          conv.unreadCount > 0 ? "font-semibold" : "font-medium",
                        )}
                      >
                        {conv.athleteName}
                      </p>
                      {conv.lastMessageTime && (
                        <span className="text-3xs text-muted-foreground shrink-0">
                          {getTimeAgo(conv.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Floating Broadcast Button */}
        <Button size="icon" className="absolute bottom-4 right-4 h-12 w-12 rounded-full shadow-lg">
          <Radio className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
