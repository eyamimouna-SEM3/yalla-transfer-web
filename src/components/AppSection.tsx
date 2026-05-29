import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import mockupPhonesDuo from "@/assets/mockup-phones-duo-new.png";
import qrCodeApp from "@/assets/qr-code-app.png";
import StoreButtons from "./StoreButtons";

const AppSection = () => {
  return (
    <section id="app" className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-card-hover border border-border/60 overflow-hidden relative hover:shadow-2xl transition-shadow duration-500">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px]" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center relative z-10">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Yalla Transfert <span className="text-primary">App</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Réservez, suivez et gérez vos transferts en temps réel depuis votre smartphone.
              </p>
              <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center border border-border hover:border-primary/30 transition-colors p-2 shadow-card">
                <img
                  src={qrCodeApp}
                  alt="QR Code Yalla Transfer App"
                  className="w-full h-full object-contain"
                />
              </div>
              <StoreButtons size="lg" />
            </div>

            <div className="lg:col-span-1 text-center space-y-4">
              <p className="text-muted-foreground font-medium">Comment fonctionne l'app ?</p>
              <Button className="rounded-full shadow-button px-8 bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-105 transition-all duration-200" asChild>
                <Link to="/app">Découvrez ici</Link>
              </Button>
            </div>

            <div className="lg:col-span-1 flex justify-center lg:justify-end relative">
              <img
                src={mockupPhonesDuo}
                alt="Yalla Transfer App"
                className="w-full max-w-md lg:max-w-[28rem] xl:max-w-[32rem] h-auto drop-shadow-2xl hover:scale-105 transition-all duration-500 object-contain lg:-my-20"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppSection;
