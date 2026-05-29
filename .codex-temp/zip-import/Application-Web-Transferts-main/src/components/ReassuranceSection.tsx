import { ShieldCheck, Clock, CreditCard, Headphones, Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Sécurité garantie",
    desc: "Tous nos chauffeurs sont vérifiés et nos véhicules régulièrement contrôlés pour votre tranquillité.",
    stat: "100%",
    statLabel: "chauffeurs vérifiés",
  },
  {
    icon: Clock,
    title: "Ponctualité assurée",
    desc: "Suivi en temps réel et chauffeurs ponctuels pour chaque transfert, sans stress.",
    stat: "24/7",
    statLabel: "disponibilité",
  },
  {
    icon: CreditCard,
    title: "Tarifs transparents",
    desc: "Prix fixés à l'avance, sans frais cachés ni mauvaise surprise à l'arrivée.",
    stat: "0",
    statLabel: "frais cachés",
  },
  {
    icon: Star,
    title: "Service premium",
    desc: "Une flotte variée de véhicules haut de gamme pour répondre à toutes vos exigences.",
    stat: "4.9",
    statLabel: "note moyenne",
  },
  {
    icon: MapPin,
    title: "Couverture nationale",
    desc: "Disponible dans toutes les régions de Tunisie, des aéroports aux hôtels et sites touristiques.",
    stat: "50+",
    statLabel: "destinations",
  },
  {
    icon: Headphones,
    title: "Support réactif",
    desc: "Une équipe dédiée pour vous accompagner avant, pendant et après votre transfert.",
    stat: "5 min",
    statLabel: "temps de réponse",
  },
];

const ReassuranceSection = () => {
  return (
    <section id="apropos" className="py-24 lg:py-32 relative overflow-hidden bg-muted/30">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block px-5 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold mb-5 tracking-widest uppercase border border-primary/20">
            Nos engagements
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Pourquoi choisir <span className="text-primary">Yalla</span> Transfer ?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Nous mettons tout en œuvre pour rendre chaque transfert simple, sûr et agréable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative rounded-2xl p-7 bg-card border border-border/60 hover:border-primary/40 transition-all duration-500 h-full flex flex-col hover:-translate-y-1 hover:shadow-xl overflow-hidden">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Top row: icon + stat */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-300">
                      <r.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-black text-primary">{r.stat}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.statLabel}</p>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{r.desc}</p>

                  {/* Bottom accent line */}
                  <div className="mt-5 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-accent transition-all duration-700 rounded-full" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReassuranceSection;
