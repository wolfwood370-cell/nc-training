import { Outlet } from "react-router-dom";
import { AthleteBottomNav } from "./AthleteBottomNav";

export function AthleteLayout() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <AthleteBottomNav />
    </div>
  );
}
