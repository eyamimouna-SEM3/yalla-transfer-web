import type { ProfileType } from "@/pages/AuthPage";
import iconCorporate from "@/assets/icon-corporate.png";
import iconTransport from "@/assets/icon-transport.png";
import iconParticulier from "@/assets/icon-particulier.png";
import iconChauffeur from "@/assets/icon-chauffeur.png";

const fournisseurProfiles = [
  {
    type: "transport" as ProfileType,
    icon: iconTransport,
    title: "Société de Transport",
    desc: "Flotte de véhicules",
  },
  {
    type: "chauffeur" as ProfileType,
    icon: iconChauffeur,
    title: "Chauffeur Indépendant",
    desc: "VTC Touristique",
  },
];

const clientProfiles = [
  {
    type: "particulier" as ProfileType,
    icon: iconParticulier,
    title: "Particulier",
    desc: "Touriste, Individuel",
  },
  {
    type: "corporate" as ProfileType,
    icon: iconCorporate,
    title: "Corporate",
    desc: "Agences de voyages, Hôtels",
  },
];

interface Props {
  onSelect: (type: ProfileType) => void;
}

const StepProfileSelection = ({ onSelect }: Props) => {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-base">YT</span>
          </div>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Créer votre compte
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Choisissez votre profil pour commencer votre expérience Yalla Transfer
        </p>
      </div>

      {/* Espace Client — affiché en premier pour guider le parcours utilisateur */}
      <div className="mb-8">
        <h3 className="font-display text-sm font-semibold text-primary uppercase tracking-wider mb-4 text-left">
          Espace Client
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clientProfiles.map(({ type, icon, title, desc }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="group relative bg-card rounded-2xl border border-border p-6 text-left hover:border-primary/50 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <img src={icon} alt={title} className="h-8 w-8 object-contain" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Espace Fournisseur */}
      <div>
        <h3 className="font-display text-sm font-semibold text-primary uppercase tracking-wider mb-4 text-left">
          Espace Fournisseur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fournisseurProfiles.map(({ type, icon, title, desc }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="group relative bg-card rounded-2xl border border-border p-6 text-left hover:border-primary/50 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <img src={icon} alt={title} className="h-8 w-8 object-contain" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepProfileSelection;
