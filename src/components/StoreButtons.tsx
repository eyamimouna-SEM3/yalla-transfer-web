import btnAppStore from "@/assets/btn-appstore.png";
import btnGooglePlay from "@/assets/btn-googleplay.png";

interface StoreButtonsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Les deux badges officiels ont des proportions différentes (App Store ~3:1, Google Play ~2.7:1)
// On fixe une HAUTEUR commune et on laisse la largeur s'adapter (object-contain) pour
// garantir un alignement horizontal propre, équilibré et sans déformation.
const heightMap = {
  sm: "h-12 sm:h-14",
  md: "h-14 sm:h-16",
  lg: "h-16 sm:h-[68px]",
};

const StoreButtons = ({ className = "", size = "md" }: StoreButtonsProps) => {
  const heightClass = heightMap[size];

  return (
    <div className={`inline-flex flex-row flex-nowrap items-center justify-start gap-4 ${className}`}>
      <a
        href="https://apps.apple.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer"
        aria-label="Télécharger sur l'App Store"
      >
        <img
          src={btnAppStore}
          alt="Télécharger sur l'App Store"
          className={`block ${heightClass} w-auto object-contain pointer-events-none`}
        />
      </a>
      <a
        href="https://play.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer"
        aria-label="Télécharger sur Google Play"
      >
        <img
          src={btnGooglePlay}
          alt="Télécharger sur Google Play"
          className={`block ${heightClass} w-auto object-contain pointer-events-none`}
        />
      </a>
    </div>
  );
};

export default StoreButtons;
