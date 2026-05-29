import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProfileType } from "@/pages/AuthPage";

interface Props {
  profile: ProfileType;
  onContinue: () => void;
}

const isSupplier = (p: ProfileType) => p === "transport" || p === "chauffeur";

const profileMessages: Record<string, { title: string; desc: string; next: string }> = {
  particulier: {
    title: "Bienvenue sur Yalla Transfer ! 🎉",
    desc: "Votre compte est prêt. Complétez votre profil pour accéder à toutes les fonctionnalités.",
    next: "Compléter mon profil",
  },
  corporate: {
    title: "Compte Corporate créé ! 🏢",
    desc: "Votre espace business est prêt. Renseignez les informations de votre structure pour activer la facturation.",
    next: "Configurer mon compte Corporate",
  },
  chauffeur: {
    title: "Inscription reçue ! 🚖",
    desc: "Notre équipe va vérifier vos informations. Complétez votre profil et ajoutez vos documents.",
    next: "Compléter mon profil Chauffeur",
  },
  transport: {
    title: "Inscription Société reçue ! 🏢",
    desc: "Notre équipe va examiner votre dossier. Complétez les informations de votre flotte.",
    next: "Compléter mon profil Société",
  },
};

const StepSuccess = ({ profile, onContinue }: Props) => {
  const msg = profileMessages[profile || "particulier"];

  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
        {msg.title}
      </h2>

      <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
        {msg.desc}
      </p>

      <div className="bg-background rounded-2xl border border-border p-6 max-w-sm mx-auto my-8 text-left space-y-2">
        <p className="text-sm font-semibold text-foreground">Prochaine étape</p>
        <p className="text-sm text-muted-foreground">
          {isSupplier(profile)
            ? "Afin d'activer votre compte, veuillez compléter les informations spécifiques à votre profil et uploader vos documents."
            : "Renseignez vos coordonnées pour sécuriser vos réservations et personnaliser votre expérience."}
        </p>
      </div>

      <Button
        onClick={onContinue}
        className="gap-2 rounded-xl h-12 px-8 text-base font-semibold shadow-button"
      >
        {msg.next}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default StepSuccess;
