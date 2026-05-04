import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/athlete/dashboard", label: "Dashboard" },
  { to: "/athlete/workout", label: "Workout" },
  { to: "/athlete/nutrition", label: "Nutrition" },
  { to: "/athlete/copilot", label: "Copilot" },
];

export function AthleteBottomNav() {
  return (
    <nav className="flex justify-around border-t border-border bg-background">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              "flex-1 py-3 text-center text-sm",
              isActive ? "text-primary font-medium" : "text-muted-foreground"
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
