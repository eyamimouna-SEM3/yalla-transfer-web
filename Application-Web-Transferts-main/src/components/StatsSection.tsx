import { Car, Users, ArrowRightLeft, Headphones } from "lucide-react";

const stats = [
  { icon: Car, value: "180+", label: "Sociétés de transport" },
  { icon: Users, value: "980+", label: "Clients satisfaits" },
  { icon: ArrowRightLeft, value: "780+", label: "Transferts réalisés" },
  { icon: Headphones, value: "24/7", label: "Service clientèle" },
];

const StatsSection = () => {
  return (
    <section className="py-14 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/90" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-foreground/25 group-hover:scale-110 transition-all duration-300">
                <s.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="font-display text-3xl font-extrabold text-primary-foreground">{s.value}</p>
              <p className="text-sm text-primary-foreground/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
