import { useState, useEffect } from"react";
import { WifiOff } from"lucide-react";
import { cn } from"@/lib/utils";

export function NetworkBadge() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setVisible(true); };
    const goOnline = () => {
      setIsOffline(false);
      // Keep visible briefly to show"back online"feel
      setTimeout(() => setVisible(false), 2000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    if (!navigator.onLine) {
      setIsOffline(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm transition-colors",
          isOffline
            ?"bg-amber-500/90 text-amber-950"            :"bg-emerald-500/90 text-emerald-950"        )}
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3.5 w-3.5"/>
            Modalità Offline — I dati verranno sincronizzati dopo
          </>
        ) : (
          "Connessione ripristinata"        )}
      </div>
    </div>
  );
}
