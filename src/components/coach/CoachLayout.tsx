import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { CoachSidebar } from "./CoachSidebar";
import { CoachBottomNav } from "./CoachBottomNav";
import { Search, ChevronRight, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SunThemeToggle } from "@/components/SunThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface CoachLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function CoachHeader({ title }: { title?: string; subtitle?: string }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="h-14 border-b border-border/50 bg-background flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Page title for mobile */}
        {title && (
          <div className="md:hidden">
            <h1 className="text-sm font-semibold">{title}</h1>
          </div>
        )}

        {/* Search - Desktop only */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca atleti, programmi..."
            className="pl-9 w-72 h-9 bg-secondary/50 border-0 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-[18px] w-[18px] text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <SunThemeToggle />
          </PopoverContent>
        </Popover>
        <NotificationBell />
      </div>
    </header>
  );
}

export function CoachLayout({ children, title, subtitle }: CoachLayoutProps) {
  return (
    <div className="theme-coach">
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950">
          {/* Sidebar - desktop only */}
          <div className="hidden md:flex">
            <CoachSidebar />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <CoachHeader title={title} subtitle={subtitle} />

            {/* Main Content */}
            <main
              className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 pb-20 md:pb-6"
              style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
            >
              {/* Page Header - Desktop */}
              {(title || subtitle) && (
                <div className="mb-6 hidden lg:block">
                  {title && (
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </main>
          </div>

          {/* Bottom nav - mobile only */}
          <CoachBottomNav />
        </div>
      </SidebarProvider>
    </div>
  );
}
