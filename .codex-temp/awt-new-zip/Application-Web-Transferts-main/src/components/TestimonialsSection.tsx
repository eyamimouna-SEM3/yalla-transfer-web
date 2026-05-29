import { Star, Quote } from "lucide-react";

const testimonials = [
  { quote: "C'est l'un des meilleurs plateformes que j'utilise pour mon transfert.", author: "Sophie M.", role: "Touriste, France" },
  { quote: "Nos clients préfèrent le transfert personnel avec Yalla Transfer.", author: "Ahmed B.", role: "Agence de voyages, Tunis" },
  { quote: "Nos clients préfèrent le transfert personnel avec Yalla Transfer.", author: "Maria G.", role: "Hôtel, Djerba" },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold mb-4 tracking-wide">AVIS CLIENTS</span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
            Témoignages
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="bg-card rounded-2xl p-8 shadow-card border border-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative group"
            >
              <Quote className="h-8 w-8 text-primary/15 absolute top-6 right-6 group-hover:text-primary/25 transition-colors" />
              <p className="text-foreground italic leading-relaxed mb-6 text-lg relative z-10">
                "{t.quote}"
              </p>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
