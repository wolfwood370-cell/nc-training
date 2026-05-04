import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { RoomList } from "@/components/coach/messages/RoomList";
import { ChatPane } from "@/components/coach/messages/ChatPane";
import { AthleteContextPane } from "@/components/coach/messages/AthleteContextPane";
import { NewChatDialog } from "@/components/coach/messages/NewChatDialog";
import { useAuth } from "@/hooks/useAuth";
import { useChatRooms, ChatRoom } from "@/hooks/useChatRooms";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export default function CoachMessages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { rooms, isLoading, getOrCreateDirectRoom, markRoomAsRead } = useChatRooms();
  const isMobile = useIsMobile();

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showRoomList, setShowRoomList] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Parse alert context from URL
  const alertContextParam = searchParams.get("alertContext");
  const alertContext = alertContextParam
    ? (() => { try { return JSON.parse(decodeURIComponent(alertContextParam)); } catch { return null; } })()
    : null;

  // Auto-select room from URL param
  const roomIdParam = searchParams.get("room");
  useEffect(() => {
    if (roomIdParam && rooms.length > 0 && !selectedRoom) {
      const room = rooms.find((r) => r.id === roomIdParam);
      if (room) {
        setSelectedRoom(room);
        markRoomAsRead.mutate(room.id);
        if (isMobile) setShowRoomList(false);
      }
    }
  }, [roomIdParam, rooms, selectedRoom, markRoomAsRead, isMobile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Update selected room when rooms change (to get fresh data)
  useEffect(() => {
    if (selectedRoom) {
      const updated = rooms.find(r => r.id === selectedRoom.id);
      if (updated && updated !== selectedRoom) {
        setSelectedRoom(updated);
      }
    }
  }, [rooms, selectedRoom]);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    markRoomAsRead.mutate(room.id);
    if (isMobile) {
      setShowRoomList(false);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setShowRoomList(true);
      setSelectedRoom(null);
    }
  };

  const handleToggleContext = () => {
    setShowContext(!showContext);
  };

  const handleNewChat = async (athleteId: string) => {
    setIsCreatingRoom(true);
    try {
      const roomId = await getOrCreateDirectRoom.mutateAsync(athleteId);
      setNewChatOpen(false);
      
      // Find and select the room
      setTimeout(() => {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          handleSelectRoom(room);
        }
      }, 500);
      
      toast.success("Conversazione pronta");
    } catch (error) {
      toast.error("Errore nella creazione della chat");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <CoachLayout title="Centro Comunicazioni" subtitle="Messaggi e contesto atleti">
      <div className="animate-fade-in h-[calc(100vh-10rem)] min-h-[500px]">
        {/* 3-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full rounded-lg overflow-hidden border bg-card">
          {/* Left Pane: Room List (25% on desktop) */}
          <div className={`lg:col-span-3 h-full ${isMobile && !showRoomList ? 'hidden' : ''}`}>
            <RoomList
              rooms={rooms}
              isLoading={isLoading}
              selectedRoomId={selectedRoom?.id || null}
              onSelectRoom={handleSelectRoom}
              onNewChat={() => setNewChatOpen(true)}
            />
          </div>

          {/* Center Pane: Chat Interface (50% on desktop) */}
          <div className={`lg:col-span-5 h-full ${isMobile && showRoomList ? 'hidden' : ''}`}>
            <ChatPane
              room={selectedRoom}
              onBack={handleBack}
              onToggleContext={handleToggleContext}
              showBackButton={isMobile}
              alertContext={alertContext}
            />
          </div>

          {/* Right Pane: Context Sidebar (25% on desktop) */}
          <div className="lg:col-span-4 h-full hidden lg:block">
            <AthleteContextPane
              room={selectedRoom}
              isOpen={true}
              onClose={() => setShowContext(false)}
            />
          </div>
        </div>

        {/* Mobile Context Overlay */}
        {isMobile && (
          <>
            {showContext && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowContext(false)}
              />
            )}
            <AthleteContextPane
              room={selectedRoom}
              isOpen={showContext}
              onClose={() => setShowContext(false)}
            />
          </>
        )}

        {/* New Chat Dialog */}
        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onSelectAthlete={handleNewChat}
          isCreating={isCreatingRoom}
        />
      </div>
    </CoachLayout>
  );
}
