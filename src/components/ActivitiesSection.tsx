import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import activityMountain from "@/assets/activity-mountain.jpg";
import activityDesert from "@/assets/activity-desert.jpg";
import activityCamping from "@/assets/activity-camping.jpg";
import activityHotel from "@/assets/activity-hotel.jpg";

const activities = [
  { title: "Désert Sahara", desc: "Explorez les dunes dorées du Grand Sahara tunisien.", image: activityDesert },
  { title: "Randonnée montagne", desc: "Découvrez les sentiers naturels de la Tunisie verte.", image: activityMountain },
  { title: "Camping", desc: "Vivez une expérience unique sous les étoiles.", image: activityCamping },
  { title: "Hôtel de luxe", desc: "Séjournez dans les meilleurs établissements du pays.", image: activityHotel },
];

const ActivitiesSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-[hsl(199,80%,40%)] text-primary-foreground relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-3">
            Besoin d'activités pendant votre séjour ?
          </h2>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto">
            Découvrez nos excursions, randonnées et expériences locales proposées par Yalla Go
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {activities.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl overflow-hidden border border-primary-foreground/10 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={a.image}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-display font-bold text-lg mb-1 text-white">{a.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="rounded-full px-8 font-semibold gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
            <Compass className="h-4 w-4" />
            Explorer les activités
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActivitiesSection;
