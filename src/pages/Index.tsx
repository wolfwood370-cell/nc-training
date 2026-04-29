import { Button } from "@/components/ui/button";
import { MetaHead } from "@/components/MetaHead";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  Brain,
  Camera,
  HeartPulse,
  Zap,
  ArrowRight,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "VBT Analysis",
    description: "Velocity Based Training con tracking in tempo reale della velocità di esecuzione.",
  },
  {
    icon: Camera,
    title: "AI Nutrition",
    description: "Scatta una foto al tuo pasto e l'AI analizza calorie e macronutrienti.",
  },
  {
    icon: HeartPulse,
    title: "Cycle Syncing",
    description: "Periodizzazione intelligente sincronizzata con il ciclo mestruale.",
  },
  {
    icon: Brain,
    title: "Neurotype Profiling",
    description: "Programmi personalizzati basati sul tuo profilo neurotipi co.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "ACWR, volume tracking e analisi predittiva degli infortuni.",
  },
  {
    icon: Shield,
    title: "Coach Dashboard",
    description: "Gestisci decine di atleti con una piattaforma progettata per i professionisti.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function Index() {
  const { user, profile } = useAuth();

  const dashboardPath = profile?.role === "coach" ? "/coach" : profile?.role === "athlete" ? (profile.onboarding_completed ? "/athlete" : "/onboarding") : "/auth";

  return (
    <>
    <MetaHead title="Home" description="Piattaforma completa per coaching fitness ibrido." />
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">CoachHub</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild className="btn-primary-glow text-primary-foreground">
                <Link to={dashboardPath}>Vai alla Dashboard <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Accedi</Link>
                </Button>
                <Button asChild className="btn-primary-glow text-primary-foreground">
                  <Link to="/auth">Inizia Ora</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="container mx-auto px-6 py-24 lg:py-40 relative">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium"
              >
                <Zap className="h-3.5 w-3.5" />
                Piattaforma di Coaching Scientifica
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
              >
                L'Evoluzione del{" "}
                <span className="text-primary">Coaching Online.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto"
              >
                Dati, Scienza e AI al servizio della tua performance.
                Una piattaforma che connette coach e atleti con strumenti di ultima generazione.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              >
                <Button size="lg" asChild className="btn-primary-glow text-primary-foreground h-12 px-8 text-base">
                  <Link to="/auth">
                    Inizia Ora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                  <Link to="/auth">
                    Accedi
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 lg:py-28 border-t border-border/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Strumenti per il coaching del futuro
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Ogni funzionalità è progettata per massimizzare i risultati con un approccio basato sulla scienza.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-border/50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-3xl font-bold tracking-tight">
                Pronto a trasformare il tuo coaching?
              </h2>
              <p className="text-muted-foreground">
                Unisciti ai professionisti che utilizzano dati e scienza per ottenere risultati superiori.
              </p>
              <Button size="lg" asChild className="btn-primary-glow text-primary-foreground h-12 px-10">
                <Link to="/auth">
                  Inizia Gratuitamente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
}
