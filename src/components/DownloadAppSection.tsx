import mockupPhonesDuo from "@/assets/mockup-phones-duo-new.png";
import StoreButtons from "./StoreButtons";

const DownloadAppSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl p-8 sm:p-12 border border-border/40">
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">
              Télécharger l'application
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
              Réservez vos transferts en quelques secondes depuis votre smartphone. Suivez votre chauffeur en temps réel.
            </p>
            <StoreButtons size="lg" />
          </div>

          <div className="flex-1 flex justify-center">
            <img
              src={mockupPhonesDuo}
              alt="Yalla Transfer App"
              className="w-full max-w-md lg:max-w-lg h-auto drop-shadow-2xl hover:scale-105 transition-all duration-500 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadAppSection;
