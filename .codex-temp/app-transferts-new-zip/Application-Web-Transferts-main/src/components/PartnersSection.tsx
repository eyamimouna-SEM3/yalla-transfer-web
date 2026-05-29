import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const partners = ["Tunisair", "Nouvelair", "Royal Jordanian", "Turkish Airlines", "Air France", "Transavia"];
// Triplicate for seamless infinite loop
const scrollPartners = [...partners, ...partners, ...partners];

const PartnersSection = () => {
  return (
    <section id="partenaires" className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold mb-4 tracking-wide">RÉSEAU</span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
            Nos partenaires
          </h2>
        </div>

        {/* Horizontal infinite marquee */}
        <div className="relative mx-auto max-w-5xl mb-20 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] w-max">
            {scrollPartners.map((p, i) => (
              <div
                key={`${p}-${i}`}
                className="w-40 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer group shrink-0"
              >
                <span className="font-display font-bold text-muted-foreground group-hover:text-primary text-sm text-center leading-tight px-3 transition-colors duration-200">
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="font-display text-2xl lg:text-4xl font-black text-foreground mb-3 leading-tight">
            Nous accompagnons les sociétés de transfert
            <br />
            <span className="text-primary">sur la voie du succès</span>
          </h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Rejoignez un réseau de confiance et développez votre activité avec notre technologie.
          </p>
          <Button size="lg" className="rounded-full shadow-lg px-8 hover:scale-105 transition-all duration-200 gap-2" asChild>
            <Link to="/inscription">
              Rejoignez-nous
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
