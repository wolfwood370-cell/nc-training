import { Outlet, useLocation } from "react-router-dom";
import { AthleteBottomNav, ATHLETE_NAV_ITEMS } from "./AthleteBottomNav";

function useSectionTitle(): string {
  const { pathname } = useLocation();
  const match = ATHLETE_NAV_ITEMS.find((item) => pathname.startsWith(item.to));
  return match?.label ?? "Athlete";
}

export function AthleteLayout() {
  const title = useSectionTitle();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 pb-20">
        <Outlet />
      </main>

      <AthleteBottomNav />
    </div>
  );
}

export default AthleteLayout;
