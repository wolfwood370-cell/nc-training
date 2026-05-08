import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, BadgeCheck } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* 1. Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 w-full bg-white/70 backdrop-blur-xl border-b border-surface-variant/50 shadow-sm">
        <button
          onClick={() => navigate("/coach/settings")}
          className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors"
        >
          <ArrowLeft className="text-primary" size={24} />
        </button>
        <h1 className="font-display font-bold text-lg text-primary tracking-tight">
          Fatturazione
        </h1>
        <div className="w-10" />
      </header>

      {/* 2. Main Layout */}
      <main className="flex-grow px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full pb-32">
        {/* 3. Hero Success Section */}
        <section className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-on-surface mb-2">
            Pagamento Completato
          </h2>
          <p className="font-display text-5xl font-extrabold text-on-surface">
            €150.00
          </p>
        </section>

        {/* 4. Transaction Details Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-variant/50 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex flex-col gap-6 relative z-10">
            {/* Row 1 (Date) */}
            <div className="flex justify-between items-center border-b border-surface-variant/30 pb-4">
              <span className="text-xs text-outline font-semibold uppercase">Data</span>
              <span className="font-medium text-base text-on-surface">1 Maggio 2026</span>
            </div>
            {/* Row 2 (Plan) */}
            <div className="flex justify-between items-center border-b border-surface-variant/30 pb-4">
              <span className="text-xs text-outline font-semibold uppercase">Piano</span>
              <span className="font-medium text-base text-on-surface">Elite Coaching Tier</span>
            </div>
            {/* Row 3 (Method) */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-outline font-semibold uppercase">Metodo di Pagamento</span>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-on-surface-variant" />
                <span className="font-medium text-base text-on-surface">•••• 4242</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Subscription Status Banner */}
        <div className="bg-surface-container rounded-xl p-4 flex items-start gap-4 border-l-4 border-primary">
          <BadgeCheck size={20} className="shrink-0 mt-0.5 text-primary" />
          <p className="text-sm text-on-surface leading-relaxed">
            Il tuo accesso al coaching è completamente attivo. La data del prossimo rinnovo è il{" "}
            <strong className="font-bold">1 Giugno 2026</strong>.
          </p>
        </div>
      </main>

      {/* 6. Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md px-6 py-6 border-t border-surface-variant/30 flex flex-col gap-4 z-40 pb-[env(safe-area-inset-bottom,24px)]">
        <button
          onClick={() => navigate("/coach/settings")}
          className="w-full max-w-md mx-auto bg-primary-container text-white rounded-full py-4 px-6 font-bold text-xs uppercase tracking-widest text-center shadow-lg hover:opacity-90 active:scale-95 transition-all"
        >
          TORNA ALLA DASHBOARD
        </button>
        <button className="w-full max-w-md mx-auto bg-transparent text-secondary rounded-full py-3 px-6 font-bold text-xs uppercase tracking-widest text-center hover:bg-surface-container active:scale-95 transition-all">
          SCARICA RICEVUTA PDF
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
