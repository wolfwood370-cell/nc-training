import { CoachLayout } from "@/components/coach/CoachLayout";
import { ExerciseLibrarySidebar } from "@/components/coach/ExerciseLibrarySidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, MousePointerClick, Plus, Search } from "lucide-react";

export default function ExerciseDatabase() {
  return (
    <CoachLayout
      title="Database Esercizi"
      subtitle="Crea, modifica e organizza la libreria biomeccanica degli esercizi"
    >
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* Sidebar with full CRUD */}
        <div className="w-[380px] flex-shrink-0 border border-border/50 rounded-lg bg-background overflow-hidden">
          <ExerciseLibrarySidebar className="h-full" />
        </div>

        {/* Main area — guidance panel */}
        <div className="flex-1 min-w-0">
          <Card className="h-full border-dashed">
            <CardContent className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center space-y-6">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Master Control · Esercizi
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Gestisci il database biomeccanico degli esercizi che userai
                    nei programmi. Tutte le modifiche sono immediate e
                    sincronizzate.
                  </p>
                </div>

                <div className="grid gap-3 text-left pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <Plus className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Crea</span>
                      <span className="text-muted-foreground"> — Usa il pulsante "Nuovo" nella sidebar per aggiungere un esercizio.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <Search className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Cerca & Filtra</span>
                      <span className="text-muted-foreground"> — Filtra per gruppo muscolare, attrezzatura o pattern motorio.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <MousePointerClick className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">Modifica & Archivia</span>
                      <span className="text-muted-foreground"> — Apri il menu di ogni esercizio per editarlo o archiviarlo.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
}
