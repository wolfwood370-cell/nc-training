import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { AthleteBottomNav } from "./AthleteBottomNav";

export function AthleteLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hideProfileButton = pathname.startsWith("/athlete/profile");

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>

      {!hideProfileButton && (
        <button
          type="button"
          onClick={() => navigate("/athlete/profile")}
          aria-label="Profilo"
          className="fixed top-3 right-3 z-[60] w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-surface-variant shadow-sm flex items-center justify-center text-on-surface hover:bg-white active:scale-95 transition-all"
        >
          <User className="w-5 h-5" strokeWidth={1.75} />
        </button>
      )}

      <AthleteBottomNav />
    </div>
  );
}

export default AthleteLayout;
