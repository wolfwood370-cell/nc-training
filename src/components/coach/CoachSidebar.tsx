import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Dumbbell, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  CreditCard,
  BookOpen,
  Inbox,
  LifeBuoy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainNavItems = [
  { title: "Dashboard", url: "/coach", icon: LayoutDashboard },
  { title: "Inbox", url: "/coach/inbox", icon: Inbox },
  { title: "Atleti", url: "/coach/athletes", icon: Users },
  { title: "Programmi", url: "/coach/programs", icon: Dumbbell },
  { title: "Calendario", url: "/coach/calendar", icon: Calendar },
  { title: "Messaggi", url: "/coach/messages", icon: MessageSquare },
  { title: "Libreria", url: "/coach/library", icon: BookOpen },
  { title: "Analisi", url: "/coach/analytics", icon: BarChart3 },
  { title: "Business", url: "/coach/business", icon: CreditCard },
];

const secondaryNavItems = [
  { title: "Impostazioni", url: "/coach/settings", icon: Settings },
];

export function CoachSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
      toast.error("Errore durante il logout");
      window.location.href = "/auth";
    }
  };

  return (
    <Sidebar 
      collapsible="icon"
      className={cn(
        "border-r-0 sidebar-transition",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-base font-semibold text-sidebar-foreground">FitCoach</h1>
                <p className="text-xs text-sidebar-foreground/50">Piattaforma Pro</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-medium px-3 mb-1">
              Menu Principale
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === "/coach"}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
                            isCollapsed && "justify-center px-2"
                          )}
                          activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                        >
                          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest font-medium px-3 mb-1">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
                            isCollapsed && "justify-center px-2"
                          )}
                          activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                        >
                          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                          {!isCollapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <FeedbackDialog
                      trigger={
                        <SidebarMenuButton asChild>
                          <button
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full",
                              isCollapsed && "justify-center px-2"
                            )}
                          >
                            <LifeBuoy className="h-[18px] w-[18px] flex-shrink-0" />
                            {!isCollapsed && <span className="text-sm">Supporto</span>}
                          </button>
                        </SidebarMenuButton>
                      }
                    />
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
                      Supporto
                    </TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("p-3", isCollapsed && "p-2")}>
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors cursor-pointer",
          isCollapsed && "justify-center p-1"
        )}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-sidebar-foreground">MC</span>
              </div>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p className="font-medium">Marco Coach</p>
                <p className="text-xs text-muted-foreground">Piano Pro</p>
              </TooltipContent>
            )}
          </Tooltip>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Marco Coach</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">Piano Pro</p>
              </div>
              <button className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
