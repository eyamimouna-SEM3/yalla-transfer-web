import btnAppStore from "@/assets/btn-appstore.png";
import btnGooglePlay from "@/assets/btn-googleplay.png";

interface StoreButtonsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-12 sm:h-14",
  md: "h-14 sm:h-16",
  lg: "h-16 sm:h-[72px]",
};

const StoreButtons = ({ className = "", size = "md" }: StoreButtonsProps) => {
  const imgClass = sizeMap[size];

  return (
    <div className={`flex flex-nowrap items-center gap-3 ${className}`}>
      <a
        href="https://apps.apple.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:scale-105 transition-transform duration-200"
      >
        <img
          src={btnAppStore}
          alt="Télécharger sur l'App Store"
          className={`${imgClass} object-contain`}
        />
      </a>
      <a
        href="https://play.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block hover:scale-105 transition-transform duration-200"
      >
        <img
          src={btnGooglePlay}
          alt="Télécharger sur Google Play"
          className={`${imgClass} object-contain`}
        />
      </a>
    </div>
  );
};

export default StoreButtons;
