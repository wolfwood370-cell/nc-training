import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  MessageCircle,
  Dumbbell,
  CreditCard,
  Bell,
  AlertTriangle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { AthleteBottomNav } from "@/components/athlete/AthleteBottomNav";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

const ICON_MAP: Record<string, LucideIcon> = {
  new_message: MessageCircle,
  message: MessageCircle,
  weekly_checkin: ClipboardList,
  task: ClipboardList,
  workout_completed: Dumbbell,
  program_assigned: Sparkles,
  payment: CreditCard,
  ai_alert: AlertTriangle,
  system: Dumbbell,
  general: Bell,
};

const TITLE_MAP: Record<string, string> = {
  new_message: "Nuovo messaggio",
  weekly_checkin: "Check-in Settimanale",
  workout_completed: "Workout completato",
  program_assigned: "Nuovo programma",
  ai_alert: "Avviso AI",
  payment: "Pagamento",
  general: "Notifica",
};

const isToday = (iso: string): boolean => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();

  const handleClick = (n: AppNotification) => {
    if (!n.read) markAsRead.mutate(n.id);
    if (n.link_url) navigate(n.link_url);
  };

  const todayItems = notifications.filter((n) => isToday(n.created_at));
  const previousItems = notifications.filter((n) => !isToday(n.created_at));

  const renderItem = (n: AppNotification) => {
    const Icon = ICON_MAP[n.type] ?? Bell;
    const title = TITLE_MAP[n.type] ?? "Notifica";
    const time = formatDistanceToNow(new Date(n.created_at), {
      addSuffix: false,
      locale: it,
    });

    if (!n.read) {
      return (
        <button
          key={n.id}
          type="button"
          onClick={() => handleClick(n)}
          className="relative bg-surface-container-low rounded-2xl p-4 mb-3 flex items-start gap-4 w-full text-left"
        >
          <span className="absolute top-4 left-3 w-2 h-2 rounded-full bg-primary-container" />
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center ml-3 shrink-0 text-primary-container shadow-sm">
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-on-surface text-sm">{title}</h3>
              <span className="text-xs font-medium text-primary-container whitespace-nowrap">
                {time}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
              {n.message}
            </p>
          </div>
        </button>
      );
    }

    return (
      <button
        key={n.id}
        type="button"
        onClick={() => handleClick(n)}
        className="bg-white border-b border-surface-variant/50 py-4 mb-1 flex items-start gap-4 pl-3 pr-4 w-full text-left"
      >
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0 text-on-surface-variant">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-normal text-on-surface-variant text-sm">
              {title}
            </h3>
            <span className="text-xs font-medium text-outline whitespace-nowrap">
              {time}
            </span>
          </div>
          <p className="text-sm text-outline mt-1 line-clamp-1">{n.message}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-2xl border-b border-surface-variant shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Indietro"
          className="text-on-surface hover:text-primary-container transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-xl font-semibold absolute left-1/2 -translate-x-1/2 text-on-surface">
          Notifiche
        </h1>
        <button
          type="button"
          onClick={() => markAllAsRead.mutate()}
          disabled={unreadCount === 0 || markAllAsRead.isPending}
          className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          Segna tutte come lette
        </button>
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-6 pt-24 pb-32">
        {todayItems.length > 0 && (
          <>
            <h2 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-4 mt-6">
              Oggi
            </h2>
            {todayItems.map(renderItem)}
          </>
        )}

        {previousItems.length > 0 && (
          <>
            <h2 className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-4 mt-6">
              Precedenti
            </h2>
            {previousItems.map(renderItem)}
          </>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 text-on-surface-variant">
            <Bell size={32} className="mb-3 opacity-60" />
            <p className="text-sm">Nessuna notifica al momento.</p>
          </div>
        )}
      </main>

      <AthleteBottomNav />
    </div>
  );
};

export default Notifications;
