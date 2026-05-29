import { MapPin, CheckCircle, Car } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: MapPin, step: "1", title: "Choisir votre trajet", desc: "Sélectionnez votre point de départ et votre destination en quelques clics." },
  { icon: CheckCircle, step: "2", title: "Confirmer la réservation", desc: "Choisissez le véhicule adapté et confirmez instantanément." },
  { icon: Car, step: "3", title: "Profiter du transfert", desc: "Votre chauffeur vous attend. Voyagez en toute sérénité." },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted)/0.4),transparent_70%)]" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-foreground text-background rounded-lg text-xs font-bold mb-5 tracking-wide">
            SIMPLE & RAPIDE
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            Comment ça marche
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative group"
            >
              <div className="bg-card rounded-3xl p-8 border border-border hover:border-primary/30 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)] transition-all duration-400">
                {/* Step number badge */}
                <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-sm mb-6">
                  {s.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <s.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>

                <h3 className="font-display text-xl font-bold text-foreground mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>

              {/* Connector line between cards */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
