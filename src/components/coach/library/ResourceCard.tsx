import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Play,
  FileText,
  Link2,
  FileEdit,
  MoreVertical,
  Trash2,
  ExternalLink,
  Brain,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { ContentItem, ContentType } from "@/hooks/useContentLibrary";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResourceCardProps {
  resource: ContentItem;
  onDelete: (id: string) => void;
  onOpenVideo?: () => void;
}

const typeIcons: Record<ContentType, React.ReactNode> = {
  video: <Play className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  link: <Link2 className="h-5 w-5" />,
  text: <FileEdit className="h-5 w-5" />,
  ai_knowledge: <Brain className="h-5 w-5" />,
};

const typeColors: Record<ContentType, string> = {
  video: "bg-red-500/10 text-red-500",
  pdf: "bg-blue-500/10 text-blue-500",
  link: "bg-green-500/10 text-green-500",
  text: "bg-purple-500/10 text-purple-500",
  ai_knowledge: "bg-violet-500/10 text-violet-500",
};

export function ResourceCard({
  resource,
  onDelete,
  onOpenVideo,
}: ResourceCardProps) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [isIndexed, setIsIndexed] = useState(resource.type === "ai_knowledge");

  const isAiKnowledge = resource.type === "ai_knowledge";

  const handleOpen = () => {
    if (onOpenVideo) {
      onOpenVideo();
    } else if (resource.url) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleIngestToAI = async () => {
    setIsIngesting(true);
    try {
      const contentParts = [`Titolo: ${resource.title}`];
      if (resource.tags.length > 0) {
        contentParts.push(`Tags: ${resource.tags.join(",")}`);
      }
      if (resource.url) {
        contentParts.push(`URL: ${resource.url}`);
      }
      const content = contentParts.join("\n");

      const { data, error } = await supabase.functions.invoke(
        "ingest-knowledge",
        {
          body: {
            content,
            metadata: {
              source: resource.title,
              type: resource.type,
              resource_id: resource.id,
            },
          },
        },
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsIndexed(true);
      toast.success(`"${resource.title}"indicizzato nell'AI Brain!`);
    } catch (err) {
      console.error("Ingest error:", err);
      toast.error("Errore nell'indicizzazione. Riprova.");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card
      className={`group hover:shadow-md transition-shadow relative ${isAiKnowledge ? "border-violet-500/30" : ""}`}
    >
      {/* AI Brain badge for ai_knowledge type */}
      {isAiKnowledge && (
        <div className="absolute top-2 right-12 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-violet-500/15 to-cyan-500/15 text-violet-500 border-violet-500/20 text-[10px] gap-1"
                >
                  <Brain className="h-3 w-3" />
                  AI Brain
                  {isIndexed && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isIndexed
                  ? "L'AI conosce questo documento"
                  : "In attesa di indicizzazione..."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Non-AI indexed badge */}
      {!isAiKnowledge && isIndexed && (
        <div className="absolute top-2 right-12 z-10">
          <Badge
            variant="secondary"
            className="bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px] gap-1"
          >
            <Brain className="h-3 w-3" />
            AI
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
              {typeIcons[resource.type]}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base line-clamp-1">
                {resource.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(resource.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {resource.url && (
                <DropdownMenuItem onClick={handleOpen}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri
                </DropdownMenuItem>
              )}
              {!isAiKnowledge && (
                <DropdownMenuItem
                  onClick={handleIngestToAI}
                  disabled={isIngesting || isIndexed}
                >
                  {isIngesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  {isIndexed
                    ? "Già indicizzato"
                    : isIngesting
                      ? "Training..."
                      : "Aggiungi all'AI Brain"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(resource.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* AI Knowledge category badge */}
        {isAiKnowledge &&
          (() => {
            const catTag = resource.tags.find((t) => t.startsWith("cat:"));
            if (!catTag) return null;
            const categoryLabels: Record<string, string> = {
              tecnica_allenamento: "Tecnica & Allenamento",
              fisiologia_recupero: "Fisiologia & Recupero",
              nutrizione: "Nutrizione",
              mindset: "Mindset",
              admin_policy: "Admin & Policy",
              altro: "Altro",
            };
            const catKey = catTag.replace("cat:", "");
            const label = categoryLabels[catKey] || catKey;
            return (
              <Badge
                variant="outline"
                className="text-xs border-violet-500/30 text-violet-400"
              >
                {label}
              </Badge>
            );
          })()}

        {resource.tags.filter((t) => !t.startsWith("cat:")).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {resource.tags
              .filter((t) => !t.startsWith("cat:"))
              .map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
          </div>
        )}

        {!isAiKnowledge && (resource.url || onOpenVideo) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-2"
            onClick={handleOpen}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {onOpenVideo ? "Apri Telestration" : "Apri Risorsa"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
