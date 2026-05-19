import { Sun, Moon, MapPin, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSunTheme } from "@/hooks/useSunTheme";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SunThemeToggle() {
  const { sunTimes, locationStatus, currentTheme: sunTheme } = useSunTheme();
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    // Mark as manual override
    localStorage.setItem("theme-manual-override", "true");
  };

  const resetToAutomatic = () => {
    localStorage.removeItem("theme-manual-override");
    setTheme(sunTheme);
  };

  const isManualOverride =
    typeof window !== "undefined" && localStorage.getItem("theme-manual-override");

  const getStatusIcon = () => {
    switch (locationStatus) {
      case "granted":
        return <MapPin className="h-3 w-3 text-success" />;
      case "denied":
      case "unavailable":
        return <MapPinOff className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (locationStatus === "denied" || locationStatus === "unavailable") {
      return "Usando orari predefiniti (06:00 - 19:00)";
    }

    if (sunTimes) {
      return `Alba: ${format(sunTimes.sunrise, "HH:mm", { locale: it })} • Tramonto: ${format(sunTimes.sunset, "HH:mm", { locale: it })}`;
    }

    return "Caricamento...";
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Current theme and manual toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-primary" />
          ) : (
            <Sun className="h-4 w-4 text-warning" />
          )}
          <span className="text-sm font-medium">Tema {theme === "dark" ? "Scuro" : "Chiaro"}</span>
          {getStatusIcon()}
        </div>

        <Button variant="outline" size="sm" onClick={handleThemeToggle} className="h-8">
          {theme === "dark" ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
          {theme === "dark" ? "Chiaro" : "Scuro"}
        </Button>
      </div>

      {/* Sun times info */}
      <p className="text-xs text-muted-foreground">{getStatusText()}</p>

      {/* Reset to automatic if manually overridden */}
      {isManualOverride && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToAutomatic}
          className="text-xs h-7 text-muted-foreground hover:text-foreground"
        >
          Ripristina tema automatico
        </Button>
      )}
    </div>
  );
}
