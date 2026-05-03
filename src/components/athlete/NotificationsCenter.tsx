import { ArrowLeft, ClipboardList, Dumbbell, CreditCard, MessageCircle, LucideIcon } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "message" | "checkin" | "training" | "payment";
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  avatarUrl?: string;
}

interface NotificationsCenterProps {
  onBack?: () => void;
  onMarkAllRead?: () => void;
  onSelect?: (n: NotificationItem) => void;
  today?: NotificationItem[];
  earlier?: NotificationItem[];
}

const ICON_MAP: Record<NotificationItem["type"], LucideIcon> = {
  message: MessageCircle,
  checkin: ClipboardList,
  training: Dumbbell,
  payment: CreditCard,
};

const DEFAULT_TODAY: NotificationItem[] = [
  {
    id: "1",
    type: "message",
    title: "New message from Coach",
    body: "Great job on the squats yesterday. Make sure to focus on your depth for the next set. Let me know how your knee feels.",
    time: "10m ago",
    unread: true,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    type: "checkin",
    title: "Weekly Check-in Due",
    body: "Please complete your end-of-week biometric and subjective feeling survey before midnight.",
    time: "2h ago",
    unread: true,
  },
];

const DEFAULT_EARLIER: NotificationItem[] = [
  {
    id: "3",
    type: "training",
    title: "Phase 2 Unlocked",
    body: "Hypertrophy block is now available.",
    time: "Yesterday",
  },
  {
    id: "4",
    type: "payment",
    title: "Payment successful",
    body: "Invoice #8892 paid via ending in 4242.",
    time: "Oct 12",
  },
];

function NotificationRow({
  item,
  onSelect,
  highlighted,
}: {
  item: NotificationItem;
  onSelect?: (n: NotificationItem) => void;
  highlighted: boolean;
}) {
  const Icon = ICON_MAP[item.type];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-2xl transition-colors ${
        highlighted ? "bg-secondary/60 hover:bg-secondary/80" : "hover:bg-secondary/40"
      }`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 pt-2 w-2">
        {item.unread && <span className="block h-2 w-2 rounded-full bg-primary" />}
      </div>

      {/* Avatar / Icon */}
      <div className="flex-shrink-0">
        {item.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-card flex items-center justify-center text-primary shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm font-['Manrope'] truncate ${
              item.unread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
            }`}
          >
            {item.title}
          </h3>
          <span className="flex-shrink-0 text-xs text-primary/80 font-medium whitespace-nowrap">
            {item.time}
          </span>
        </div>
        <p
          className={`mt-0.5 text-sm line-clamp-2 ${
            item.unread ? "text-muted-foreground" : "text-muted-foreground/80"
          }`}
        >
          {item.body}
        </p>
      </div>
    </button>
  );
}

export function NotificationsCenter({
  onBack,
  onMarkAllRead,
  onSelect,
  today = DEFAULT_TODAY,
  earlier = DEFAULT_EARLIER,
}: NotificationsCenterProps) {
  return (
    <div className="flex flex-col h-full bg-background font-['Inter']">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            onClick={onBack}
            aria-label="Back"
            className="h-10 w-10 flex items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-bold text-foreground font-['Manrope']">
            Notifications
          </h1>
          <button
            onClick={onMarkAllRead}
            className="text-sm font-semibold text-primary hover:text-primary/80 px-2"
          >
            Mark all read
          </button>
        </div>
      </header>

      {/* List */}
      <main className="flex-1 overflow-y-auto px-2 pb-6">
        {today.length > 0 && (
          <section className="pt-4">
            <h2 className="px-3 mb-2 text-xs font-bold tracking-widest text-primary/70 font-['Manrope']">
              TODAY
            </h2>
            <div className="space-y-2">
              {today.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  highlighted
                />
              ))}
            </div>
          </section>
        )}

        {earlier.length > 0 && (
          <section className="pt-6">
            <h2 className="px-3 mb-2 text-xs font-bold tracking-widest text-primary/70 font-['Manrope']">
              EARLIER
            </h2>
            <div className="divide-y divide-border/40">
              {earlier.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                  highlighted={false}
                />
              ))}
            </div>
          </section>
        )}

        {today.length === 0 && earlier.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default NotificationsCenter;
