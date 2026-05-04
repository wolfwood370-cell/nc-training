import { useQuery, useMutation, useQueryClient } from"@tanstack/react-query";
import { supabase } from"@/integrations/supabase/client";
import { useAuth } from"@/hooks/useAuth";
import { toast } from"sonner";

export type ContentType ="video"|"pdf"|"link"|"text"|"ai_knowledge";

export interface ContentItem {
  id: string;
  coach_id: string;
  title: string;
  type: ContentType;
  url: string | null;
  tags: string[];
  created_at: string;
}

export interface CreateContentPayload {
  title: string;
  type: ContentType;
  url?: string;
  tags?: string[];
  /** Raw text content for ai_knowledge type */
  aiContent?: string;
  /** Category for ai_knowledge type */
  aiCategory?: string;
}

export function useContentLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["content-library", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("content_library")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateContentPayload) => {
      if (!user?.id) throw new Error("Not authenticated");

      const tags = [...(payload.tags || [])];
      // Store AI category as a special tag for display
      if (payload.type ==="ai_knowledge"&& payload.aiCategory) {
        tags.unshift(`cat:${payload.aiCategory}`);
      }

      const { data, error } = await supabase
        .from("content_library")
        .insert({
          coach_id: user.id,
          title: payload.title,
          type: payload.type,
          url: payload.url || null,
          tags,
        })
        .select()
        .single();

      if (error) throw error;

      // If ai_knowledge, trigger ingestion automatically
      if (payload.type ==="ai_knowledge"&& payload.aiContent) {
        try {
          const { error: fnError } = await supabase.functions.invoke("ingest-knowledge", {
            body: {
              content: payload.aiContent,
              metadata: {
                source: payload.title,
                type:"ai_knowledge",
                resource_id: data.id,
                category: payload.aiCategory ||"altro",
              },
            },
          });
          if (fnError) {
            console.error("Ingestion error:", fnError);
            toast.warning("Risorsa salvata, ma l'indicizzazione AI ha avuto un problema. Riprova dal menu.");
          }
        } catch (e) {
          console.error("Ingestion error:", e);
          toast.warning("Risorsa salvata, ma l'indicizzazione AI ha avuto un problema.");
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      if (variables.type ==="ai_knowledge") {
        toast.success("Risorsa salvata e AI aggiornata (Training avviato...)");
      } else {
        toast.success("Risorsa aggiunta con successo");
      }
    },
    onError: (error) => {
      toast.error("Errore nell'aggiunta:"+ error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("content_library")
        .delete()
        .eq("id", contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Risorsa eliminata");
    },
    onError: (error) => {
      toast.error("Errore nell'eliminazione:"+ error.message);
    },
  });

  // Get unique tags from all content
  const allTags = [...new Set(content.flatMap((item) => item.tags))];

  return {
    content,
    isLoading,
    allTags,
    createContent: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteContent: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
