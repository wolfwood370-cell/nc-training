import { AthleteBottomNav } from "./AthleteBottomNav";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SunThemeToggle } from "@/components/SunThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SyncIndicator } from "@/components/athlete/SyncIndicator";
import { ResponsivePhoneWrapper } from "./PhoneMockup";


interface AthleteLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AthleteLayout({ children, title }: AthleteLayoutProps) {
  const appContent = (
    <div
      className="theme-athlete relative flex flex-col bg-white dark:bg-black text-foreground overflow-hidden"
      style={{ height: "100dvh", width: "100%" }}
    >
      {/* Status bar safe area */}
      <div style={{ paddingTop: "env(safe-area-inset-top)" }} className="flex-shrink-0" />

      {/* Header */}
      {title && (
        <header className="flex-shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 py-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <SyncIndicator />
            <h1 className="text-lg font-semibold text-center flex-1">{title}</h1>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    aria-label="Impostazioni"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <SunThemeToggle />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>
      )}

      {/* Main content - scrollable, padded for bottom nav + safe area */}
      <main
        className="flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-black"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </main>

      <AthleteBottomNav />
    </div>
  );

  return <ResponsivePhoneWrapper>{appContent}</ResponsivePhoneWrapper>;
}
