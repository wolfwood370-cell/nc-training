import { ArrowLeft, CheckCircle2, CreditCard, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BillingReceiptProps {
  amount?: string;
  date?: string;
  plan?: string;
  cardLast4?: string;
  nextBillingDate?: string;
  onBack?: () => void;
  onReturnDashboard?: () => void;
  onDownloadPdf?: () => void;
}

export default function BillingReceipt({
  amount = "€150.00",
  date = "May 1, 2026",
  plan = "Elite Coaching Tier",
  cardLast4 = "4242",
  nextBillingDate = "June 1, 2026",
  onBack,
  onReturnDashboard,
  onDownloadPdf,
}: BillingReceiptProps) {
  const rows = [
    { label: "Date", value: date },
    { label: "Plan", value: plan },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-[Inter]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <h1 className="font-[Manrope] font-bold text-base text-primary">
            Billing
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 px-5 pt-8 pb-32">
        {/* Success hero */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2
              className="h-10 w-10 text-primary"
              strokeWidth={2}
            />
          </div>
          <h2 className="font-[Manrope] font-bold text-2xl text-foreground">
            Payment Successful
          </h2>
          <p className="font-[Manrope] font-bold text-5xl text-foreground tabular-nums">
            {amount}
          </p>
        </div>

        {/* Details card */}
        <section className="mt-10 bg-card rounded-2xl shadow-sm overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-5 py-5 ${
                i > 0 ? "border-t border-border/60" : ""
              }`}
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-base font-semibold text-foreground">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-5 border-t border-border/60">
            <span className="text-sm text-muted-foreground">Payment Method</span>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-base font-semibold text-foreground tracking-widest">
                ••••
              </span>
              <span className="text-base font-semibold text-foreground tabular-nums">
                {cardLast4}
              </span>
            </div>
          </div>
        </section>

        {/* Status banner */}
        <div className="mt-5 bg-primary/10 border-l-4 border-primary rounded-r-xl px-4 py-4 flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            Your coaching access is fully active. Your next billing date is{" "}
            <span className="font-bold">{nextBillingDate}</span>.
          </p>
        </div>
      </main>

      {/* Sticky actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-4 space-y-2">
        <Button
          onClick={onReturnDashboard}
          size="lg"
          className="w-full h-12 rounded-full font-[Manrope] font-bold tracking-wider text-sm"
        >
          RETURN TO DASHBOARD
        </Button>
        <button
          onClick={onDownloadPdf}
          className="w-full text-center text-xs font-bold tracking-wider text-primary py-2 hover:opacity-80 transition-opacity"
        >
          DOWNLOAD PDF RECEIPT
        </button>
      </footer>
    </div>
  );
}
