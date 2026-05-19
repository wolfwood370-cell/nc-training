import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Bookmark, Trash2, Plus, Dumbbell, Loader2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutTemplate } from "@/hooks/useWorkoutTemplates";
import type { ProgramExercise } from "@/components/coach/WeekGrid";

interface TemplatesSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WorkoutTemplate[];
  allTags: string[];
  isLoading: boolean;
  isDeleting: boolean;
  onInsert: (exercises: ProgramExercise[]) => void;
  onDelete: (templateId: string) => void;
  hydrateTemplate: (template: WorkoutTemplate) => ProgramExercise[];
}

export function TemplatesSidebar({
  open,
  onOpenChange,
  templates,
  allTags,
  isLoading,
  isDeleting,
  onInsert,
  onDelete,
  hydrateTemplate,
}: TemplatesSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || t.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleInsert = (template: WorkoutTemplate) => {
    const exercises = hydrateTemplate(template);
    onInsert(exercises);
    onOpenChange(false);
    setPreviewTemplate(null);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
      if (previewTemplate?.id === deleteConfirmId) {
        setPreviewTemplate(null);
      }
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Template Salvati
            </SheetTitle>
            <SheetDescription>
              Seleziona un template per inserirlo nel giorno corrente
            </SheetDescription>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca template..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="px-4 pb-2">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-1.5 pb-1">
                  <Badge
                    variant={selectedTag === null ? "default" : "outline"}
                    className="cursor-pointer shrink-0"
                    onClick={() => setSelectedTag(null)}
                  >
                    Tutti
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer shrink-0"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Separator />

          {/* Templates List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <div className="flex gap-1.5">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {templates.length === 0 ? "Nessun template salvato" : "Nessun template trovato"}
                  </p>
                  {templates.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Salva un allenamento per iniziare
                    </p>
                  )}
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={previewTemplate?.id === template.id}
                    onSelect={() =>
                      setPreviewTemplate(previewTemplate?.id === template.id ? null : template)
                    }
                    onDelete={() => setDeleteConfirmId(template.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Preview Panel */}
          {previewTemplate && (
            <>
              <Separator />
              <div className="p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{previewTemplate.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {previewTemplate.structure.length} esercizi
                  </Badge>
                </div>

                {previewTemplate.description && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {previewTemplate.description}
                  </p>
                )}

                <div className="space-y-1 mb-4 max-h-[120px] overflow-y-auto">
                  {previewTemplate.structure.map((ex, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs p-1.5 rounded bg-background"
                    >
                      <Dumbbell className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{ex.name}</span>
                      <span className="text-muted-foreground ml-auto shrink-0">
                        {ex.sets}×{ex.reps}
                      </span>
                    </div>
                  ))}
                </div>

                <Button className="w-full" onClick={() => handleInsert(previewTemplate)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Inserisci nel Giorno
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Template</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo template? L'azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Template Card Component
function TemplateCard({
  template,
  isSelected,
  onSelect,
  onDelete,
}: {
  template: WorkoutTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-primary/50 hover:bg-muted/50",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-medium text-sm truncate">{template.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {template.structure.length} esercizi
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Elimina template"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-3xs h-5">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-3xs h-5">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
