import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type {
  ContentType,
  CreateContentPayload,
} from "@/hooks/useContentLibrary";

interface AddResourceDialogProps {
  onAdd: (payload: CreateContentPayload) => void;
  isLoading: boolean;
}

const ACCEPTED_FILES = ".pdf,.txt,.md";

export function AddResourceDialog({
  onAdd,
  isLoading,
}: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("link");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  // AI Knowledge fields
  const [aiText, setAiText] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiTab, setAiTab] = useState("text");
  const [aiCategory, setAiCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setType("link");
    setUrl("");
    setTagsInput("");
    setAiText("");
    setAiFile(null);
    setAiTab("text");
    setAiCategory("");
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    if (type === "ai_knowledge") {
      setUploading(true);
      try {
        let contentText = "";
        let fileUrl: string | undefined;

        if (aiTab === "text") {
          contentText = aiText;
        } else if (aiFile) {
          // Upload file to storage, then read text
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) throw new Error("Non autenticato");

          const filePath = `${userId}/${Date.now()}_${aiFile.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("ai-knowledge-docs")
            .upload(filePath, aiFile);

          if (uploadErr) throw uploadErr;

          // Read the file as text client-side for ingestion
          contentText = await aiFile.text();
          const { data: urlData } = supabase.storage
            .from("ai-knowledge-docs")
            .getPublicUrl(filePath);
          fileUrl = urlData?.publicUrl;
        }

        if (!contentText.trim()) {
          setUploading(false);
          return;
        }

        onAdd({
          title,
          type: "ai_knowledge",
          url: fileUrl,
          tags,
          aiContent: contentText,
          aiCategory: aiCategory || undefined,
        });

        resetForm();
        setOpen(false);
      } catch (err) {
        console.error("Upload error:", err);
        setUploading(false);
      }
      return;
    }

    // Standard resource types
    onAdd({
      title,
      type,
      url: url || undefined,
      tags,
    });

    resetForm();
    setOpen(false);
  };

  const isAiKnowledge = type === "ai_knowledge";
  const canSubmit =
    title &&
    !isLoading &&
    !uploading &&
    (!isAiKnowledge || (aiTab === "text" ? aiText.trim() : aiFile));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Aggiungi Risorsa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuova Risorsa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isAiKnowledge
                  ? "Es. Regola: Gestione Infortuni Schiena"
                  : "Es. Guida al Riscaldamento Mobilità"
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ContentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">Documento PDF</SelectItem>
                <SelectItem value="link">Link Esterno</SelectItem>
                <SelectItem value="text">Testo/Note</SelectItem>
                <SelectItem value="ai_knowledge"> Conoscenza AI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Knowledge: Tabbed inputs */}
          {isAiKnowledge && (
            <>
              <div className="space-y-2">
                <Label>Categoria Conoscenza</Label>
                <Select value={aiCategory} onValueChange={setAiCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnica_allenamento">
                      {" "}
                      Tecnica & Allenamento
                    </SelectItem>
                    <SelectItem value="fisiologia_recupero">
                      {" "}
                      Fisiologia & Recupero
                    </SelectItem>
                    <SelectItem value="nutrizione"> Nutrizione</SelectItem>
                    <SelectItem value="mindset"> Mindset</SelectItem>
                    <SelectItem value="admin_policy">
                      {" "}
                      Admin & Policy
                    </SelectItem>
                    <SelectItem value="altro"> Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Regola o Conoscenza per l'AI</Label>
                <Tabs value={aiTab} onValueChange={setAiTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="text" className="flex-1">
                      {" "}
                      Scrivi Manualmente
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex-1">
                      {" "}
                      Carica Documento
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="text">
                    <Textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="Scrivi qui una regola (es.'Consiglia sempre 3g di creatina...','Se l'atleta ha mal di schiena, rimuovi Stacco e Squat.')"
                      rows={6}
                      className="mt-2"
                    />
                  </TabsContent>
                  <TabsContent value="file">
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept={ACCEPTED_FILES}
                        onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formati supportati: PDF, TXT, Markdown (.md)
                      </p>
                      {aiFile && (
                        <p className="text-sm text-foreground mt-1">
                          {aiFile.name} ({(aiFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {/* Standard fields for non-AI types */}
          {!isAiKnowledge && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tag (separati da virgola)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={
                isAiKnowledge
                  ? "ai, regole, infortuni"
                  : "mobilità, riscaldamento, principiante"
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {uploading || isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isAiKnowledge ? "Training AI..." : "Aggiunta..."}
                </>
              ) : isAiKnowledge ? (
                "Salva e Addestra AI"
              ) : (
                "Aggiungi Risorsa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
