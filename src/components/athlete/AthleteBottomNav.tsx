import { Home, Dumbbell, Utensils, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Home", url: "/athlete/dashboard", icon: Home },
  { title: "Training", url: "/athlete/workout", icon: Dumbbell },
  { title: "Nutrition", url: "/athlete/nutrition", icon: Utensils },
  { title: "Copilot", url: "/athlete/copilot", icon: Sparkles },
];

export function AthleteBottomNav() {
  const { light } = useHapticFeedback();
  const isMobile = useIsMobile();

  // Fetch coach brand color for active state
  const { data: brandColor } = useQuery({
    queryKey: ["athlete-brand-color"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("coach_id")
        .eq("id", user.id)
        .single();

      if (!profile?.coach_id) return null;

      const { data: coach } = await supabase
        .from("profiles")
        .select("brand_color")
        .eq("id", profile.coach_id)
        .single();

      return coach?.brand_color || null;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Mobile-only navigation. Hidden on tablet/desktop.
  if (!isMobile) return null;

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glassmorphic surface */}
      <div className="absolute inset-0 bg-background/75 backdrop-blur-xl border-t border-border/50" />

      <div className="relative flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/athlete/dashboard"}
            onClick={() => light()}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[48px] min-w-[48px] text-zinc-500 transition-transform duration-150 active:scale-90"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <div className="relative flex flex-col items-center">
                {/* Active top indicator dot/line */}
                {isActive && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ backgroundColor: brandColor || "hsl(var(--primary))" }}
                  />
                )}

                <div
                  className={cn(
                    "relative p-2 rounded-2xl transition-all duration-300 ease-out",
                    isActive && "bg-primary/10",
                  )}
                  style={
                    isActive && brandColor
                      ? { backgroundColor: `${brandColor}15` }
                      : undefined
                  }
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "stroke-[2.5px] fill-current/10" : "stroke-[1.5px]",
                    )}
                    style={isActive ? { color: brandColor || undefined } : undefined}
                  />
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive && "font-semibold",
                  )}
                  style={isActive ? { color: brandColor || undefined } : undefined}
                >
                  {item.title}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
