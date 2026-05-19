import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Play, Pause, ExternalLink, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Message } from "@/hooks/useChatRooms";
import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logger";

interface MessageBubbleProps {
  message: Message & {
    sender?: { id: string; full_name: string | null; avatar_url: string | null };
  };
  isOwn: boolean;
  showAvatar?: boolean;
}

// Helper to detect Loom/YouTube URLs
function detectVideoEmbed(
  content: string,
): { type: "loom" | "youtube" | null; url: string; thumbnailUrl: string } | null {
  const loomMatch = content.match(/https?:\/\/(www\.)?loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    const videoId = loomMatch[2];
    return {
      type: "loom",
      url: `https://www.loom.com/share/${videoId}`,
      thumbnailUrl: `https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`,
    };
  }

  const youtubeMatch = content.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      type: "youtube",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };
  }

  return null;
}

function AudioPlayer({ url }: { url?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mock waveform bars
  const bars = Array.from({ length: 32 }, () => Math.random() * 100);

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 flex items-center gap-0.5 h-8">
        {bars.map((height, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors",
              i < (progress * bars.length) / 100 ? "bg-primary" : "bg-muted-foreground/30",
            )}
            style={{ height: `${Math.max(15, height * 0.8)}%` }}
          />
        ))}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums">0:32</span>
    </div>
  );
}

function ImageBubble({ url, alt }: { url: string; alt?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="block rounded-lg overflow-hidden max-w-[240px] hover:opacity-90 transition-opacity"
      >
        <img src={url} alt={alt || "Immagine"} className="w-full h-auto object-cover" />
      </button>

      {/* Simple lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <img src={url} alt={alt || "Immagine"} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

function VideoPreviewCard({
  embed,
  content,
}: {
  embed: NonNullable<ReturnType<typeof detectVideoEmbed>>;
  content: string;
}) {
  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border bg-card hover:bg-accent/50 transition-colors max-w-[280px]"
    >
      <div className="relative aspect-video bg-muted">
        <img
          src={embed.thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-3xs font-medium uppercase",
              embed.type === "loom"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {embed.type === "loom" ? "Loom" : "YouTube"}
          </span>
          <ExternalLink className="h-3 w-3" />
        </div>
        <p className="text-sm font-medium line-clamp-2">
          {content.replace(embed.url, "").trim() || "Guarda il video"}
        </p>
      </div>
    </a>
  );
}

function NativeVideoBubble({ filePath }: { filePath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getSignedUrl() {
      // Check if it's already a full URL (legacy data) or a file path
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        // Legacy: already a URL, use directly
        setSignedUrl(filePath);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from("chat-media")
          .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

        if (error) throw error;
        setSignedUrl(data.signedUrl);
      } catch (err) {
        log.error("Failed to get signed URL:", err);
        setError("Video non disponibile");
      } finally {
        setIsLoading(false);
      }
    }

    getSignedUrl();
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden max-w-[300px] border bg-card flex items-center justify-center h-[150px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="rounded-xl overflow-hidden max-w-[300px] border bg-card flex items-center justify-center h-[150px] text-muted-foreground text-sm">
        {error || "Video non disponibile"}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden max-w-[300px] border bg-card">
      <video
        src={signedUrl}
        controls
        preload="metadata"
        className="w-full h-auto"
        style={{ maxHeight: "200px" }}
      >
        Il tuo browser non supporta il video.
      </video>
    </div>
  );
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const videoEmbed =
    message.media_type === "loom" || message.media_type === "text"
      ? detectVideoEmbed(message.content)
      : null;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = () => {
    // If it's a video embed (Loom/YouTube)
    if (videoEmbed) {
      return <VideoPreviewCard embed={videoEmbed} content={message.content} />;
    }

    switch (message.media_type) {
      case "audio":
        return (
          <div
            className={cn(
              "rounded-2xl px-4 py-3",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <AudioPlayer url={message.media_url || undefined} />
          </div>
        );

      case "image":
        return <ImageBubble url={message.media_url || "/placeholder.svg"} />;

      case "video_native" as string:
        return <NativeVideoBubble filePath={message.media_url || ""} />;

      default:
        return (
          <div
            className={cn(
              "rounded-2xl px-4 py-2 max-w-[320px]",
              isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        );
    }
  };

  return (
    <div className={cn("flex gap-2 mb-3", isOwn ? "flex-row-reverse" : "flex-row")}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(message.sender?.full_name || null)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        {renderContent()}
        <span
          className={cn(
            "text-3xs text-muted-foreground mt-1 px-1",
            isOwn ? "text-right" : "text-left",
          )}
        >
          {format(new Date(message.created_at), "HH:mm", { locale: it })}
        </span>
      </div>
    </div>
  );
}
