import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  Search,
  Users,
  MessageSquarePlus,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/hooks/useChatRooms";
import { useAuth } from "@/hooks/useAuth";

interface RoomListProps {
  rooms: ChatRoom[];
  isLoading: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onNewChat?: () => void;
}

export function RoomList({
  rooms,
  isLoading,
  selectedRoomId,
  onSelectRoom,
  onNewChat,
}: RoomListProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "unread" | "groups">("all");

  const getOtherParticipant = (room: ChatRoom) => {
    if (room.type === "group") return null;
    return room.participants.find((p) => p.user_id !== user?.id)?.profile;
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === "group" && room.name) return room.name;
    const other = getOtherParticipant(room);
    return other?.full_name || "Utente";
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === "group") return null;
    return getOtherParticipant(room)?.avatar_url;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split("")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.last_message) return "Nessun messaggio";

    const { media_type, content } = room.last_message;
    const isMe = room.last_message.sender_id === user?.id;
    const prefix = isMe ? "Tu:" : "";

    switch (media_type) {
      case "audio":
        return `${prefix} Nota vocale`;
      case "image":
        return `${prefix} Immagine`;
      case "loom":
        return `${prefix} Video`;
      default:
        return `${prefix}${content.slice(0, 40)}${content.length > 40 ? "..." : ""}`;
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const name = getRoomDisplayName(room).toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());

    if (tab === "unread") return matchesSearch && room.unread_count > 0;
    if (tab === "groups") return matchesSearch && room.type === "group";
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-card border-r">
        <div className="p-4 border-b space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messaggi</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca conversazione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-xs">
              Tutti
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Non letti
              {rooms.filter((r) => r.unread_count > 0).length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-4 px-1 text-[10px]"
                >
                  {rooms.filter((r) => r.unread_count > 0).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              Gruppi
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {tab === "unread"
                ? "Nessun messaggio non letto"
                : "Nessuna conversazione"}
            </div>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  "hover:bg-accent/50",
                  selectedRoomId === room.id && "bg-accent",
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getRoomAvatar(room) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {room.type === "group" ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        getInitials(getRoomDisplayName(room))
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {room.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm truncate",
                        room.unread_count > 0 && "text-foreground",
                      )}
                    >
                      {getRoomDisplayName(room)}
                    </span>
                    {room.last_message && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(
                          new Date(room.last_message.created_at),
                          {
                            addSuffix: false,
                            locale: it,
                          },
                        )}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate mt-0.5",
                      room.unread_count > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    {getLastMessagePreview(room)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
