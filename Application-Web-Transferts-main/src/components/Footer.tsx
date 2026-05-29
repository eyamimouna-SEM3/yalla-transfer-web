import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import StoreButtons from "./StoreButtons";

const Footer = () => {
  return (
    <footer id="contact" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,25%,12%)] via-[hsl(210,25%,10%)] to-[hsl(210,25%,8%)]" />
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">YT</span>
              </div>
              <span className="font-display text-xl font-bold text-white">
                Yalla Transfer
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              La première marketplace de transferts privés en Tunisie.
            </p>
            <StoreButtons size="sm" />
          </div>

          {/* Yalla App */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-5">Yalla App</h4>
            <ul className="space-y-3 text-sm">
              {["App Store", "Google Play", "QR Code"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent/60" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-5">À propos</h4>
            <ul className="space-y-3 text-sm">
              {["Conditions générales", "Politique de confidentialité", "Mentions légales", "FAQ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/60 hover:text-accent transition-colors duration-200 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent/60" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-white text-base mb-5">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 text-white/70">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                </div>
                +216 XX XXX XXX
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                </div>
                contact@yallatransfer.com
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                Tunis, Tunisie
              </li>
            </ul>
            <div className="flex gap-2 mt-6">
              {[Facebook, Instagram, Linkedin, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/8 hover:bg-primary flex items-center justify-center transition-all duration-200 text-white/60 hover:text-primary-foreground hover:scale-110">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 Yalla go. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-accent transition-colors">CGV</a>
            <a href="#" className="hover:text-accent transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-accent transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
