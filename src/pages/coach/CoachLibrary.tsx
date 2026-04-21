import { useState, useMemo } from"react";
import { CoachLayout } from"@/components/coach/CoachLayout";
import { Input } from"@/components/ui/input";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Skeleton } from"@/components/ui/skeleton";
import { Search, Filter, BookOpen } from"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from"@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from"@/components/ui/dialog";
import { useContentLibrary, ContentType, ContentItem } from"@/hooks/useContentLibrary";
import { AddResourceDialog } from"@/components/coach/library/AddResourceDialog";
import { ResourceCard } from"@/components/coach/library/ResourceCard";
import { TelestrationPlayer } from"@/components/coach/video/TelestrationPlayer";

const typeLabels: Record<ContentType, string> = {
  video:"Video",
  pdf:"PDF",
  link:"Link",
  text:"Text",
  ai_knowledge:"Conoscenza AI",
};

export default function CoachLibrary() {
  const { content, isLoading, allTags, createContent, isCreating, deleteContent } = useContentLibrary();
  
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [telestrationVideo, setTelestrationVideo] = useState<ContentItem | null>(null);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      // Search filter
      const matchesSearch = !search || 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      // Type filter
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(item.type);
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => item.tags.includes(tag));

      return matchesSearch && matchesType && matchesTags;
    });
  }, [content, search, selectedTypes, selectedTags]);

  const toggleType = (type: ContentType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedTags([]);
    setSearch("");
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedTags.length > 0 || search;

  return (
    <CoachLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Libreria Risorse</h1>
            <p className="text-muted-foreground text-sm">
              Contenuti didattici da condividere con i tuoi atleti
            </p>
          </div>
          <AddResourceDialog onAdd={createContent} isLoading={isCreating} />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input
              placeholder="Cerca risorse..."              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"className="gap-2">
                <Filter className="h-4 w-4"/>
                Filtri
                {hasActiveFilters && (
                  <Badge variant="secondary"className="ml-1 h-5 px-1.5">
                    {selectedTypes.length + selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"className="w-56">
              <DropdownMenuLabel>Tipo</DropdownMenuLabel>
              {(Object.keys(typeLabels) as ContentType[]).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                >
                  {typeLabels[type]}
                </DropdownMenuCheckboxItem>
              ))}
              
              {allTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tags</DropdownMenuLabel>
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
              
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"                    size="sm"                    className="w-full justify-start"                    onClick={clearFilters}
                  >
                    Rimuovi tutti i filtri
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedTypes.map((type) => (
              <Badge key={type} variant="outline"className="gap-1">
                {typeLabels[type]}
                <button onClick={() => toggleType(type)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="outline"className="gap-1">
                #{tag}
                <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Telestration Dialog */}
        <Dialog open={!!telestrationVideo} onOpenChange={(open) => !open && setTelestrationVideo(null)}>
          <DialogContent className="max-w-4xl p-6">
            <DialogTitle className="sr-only">Video Telestration</DialogTitle>
            {telestrationVideo?.url && (
              <TelestrationPlayer
                url={telestrationVideo.url}
                title={telestrationVideo.title}
                onClose={() => setTelestrationVideo(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg"/>
            ))}
          </div>
        ) : filteredContent.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContent.map((resource) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                onDelete={deleteContent}
                onOpenVideo={resource.type ==="video"&& resource.url ? () => setTelestrationVideo(resource) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground"/>
            </div>
            <h3 className="font-medium text-lg">Nessuna risorsa trovata</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {hasActiveFilters 
                ?"Prova a modificare i filtri o la ricerca"                :"Inizia a costruire la libreria aggiungendo la prima risorsa"              }
            </p>
          </div>
        )}
      </div>
    </CoachLayout>
  );
}
