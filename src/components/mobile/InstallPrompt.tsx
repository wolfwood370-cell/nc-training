import { useState, useEffect } from "react";
import { X, Download, Smartphone, WifiOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Skip if already installed (standalone) or previously dismissed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone || localStorage.getItem(DISMISS_KEY)) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    // Android/Chrome: capture install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: no programmatic prompt — show manual instructions after delay
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      timer = setTimeout(() => setShow(true), 3000);
    } else {
      // Fallback for browsers without beforeinstallprompt
      timer = setTimeout(() => setShow((s) => s || false), 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!show) return null;

  return (
    <div
      className="absolute left-3 right-3 z-[60] animate-fade-in"
      style={{
        bottom: "calc(4.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-foreground">
                Installa l'app
              </p>
              <button
                onClick={dismiss}
                aria-label="Chiudi"
                className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Tocca l'icona Condividi e poi \"Aggiungi a Home\" per la migliore esperienza."
                : "Aggiungi l'app alla schermata Home per accesso rapido."}
            </p>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
              <span className="flex items-center gap-1">
                <Maximize2 className="h-3 w-3" /> Schermo intero
              </span>
            </div>

            {!isIOS && deferredPrompt && (
              <Button
                size="sm"
                className="mt-3 h-9 text-xs gap-1.5 min-h-[44px] w-full"
                onClick={handleInstall}
              >
                <Download className="h-3.5 w-3.5" />
                Installa ora
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
