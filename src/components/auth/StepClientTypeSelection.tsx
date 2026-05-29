import { motion } from "framer-motion";
import { User, Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "@/services/authService";
import { bookingService } from "@/services/bookingService";
import { pendingBookingStorage } from "@/utils/pendingBooking";
import { toast } from "@/hooks/use-toast";
import type { ProfileType } from "@/pages/AuthPage";

interface Props {
  onSelect: (type: ProfileType) => void;
  onBack?: () => void;
  name: string;
  email: string;
  password: string;
}

const options: { type: ProfileType; label: string; desc: string; icon: typeof User; role: string }[] = [
  {
    type: "particulier",
    label: "Client particulier",
    desc: "Pour vos déplacements personnels, familiaux ou loisirs.",
    icon: User,
    role: "client_b2c",
  },
  {
    type: "corporate",
    label: "Client corporate",
    desc: "Pour votre entreprise, vos collaborateurs et vos clients VIP.",
    icon: Building2,
    role: "client_b2b",
  },
];

const StepClientTypeSelection = ({ onSelect, onBack, name, email, password }: Props) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (type: ProfileType) => {
    const option = options.find(o => o.type === type);
    if (!option || submitting) return;
    setSubmitting(true);

    // Phone placeholder unique pour éviter les collisions sur la colonne `phone` (unique en DB).
    // Le client pourra le compléter dans son profil après inscription.
    const uniquePlaceholderPhone = `+2169${Date.now().toString().slice(-8)}`;

    let registered = false;
    let registerError: { status?: number; message?: string } | null = null;
    let loginError: { status?: number; message?: string } | null = null;

    try {
      await authService.register({
        fullName: name,
        email: email,
        phone: uniquePlaceholderPhone,
        password: password,
        role: option.role as any,
      });
      registered = true;
    } catch (error) {
      registerError = error as { status?: number; message?: string };
      // Si l'email existe déjà (409 conflict), on tente une connexion.
      if (registerError?.status === 409) {
        try {
          await authService.login(email, password);
          registered = true;
        } catch (lErr) {
          loginError = lErr as { status?: number; message?: string };
        }
      }
    }

    if (!registered) {
      setSubmitting(false);

      // Distinguer les types d'erreurs pour donner un message clair.
      const status = registerError?.status;
      let title = "Inscription impossible";
      let description = registerError?.message ?? "Réessaie dans un instant.";

      if (status === 401) {
        // Email non vérifié côté backend.
        title = "Email non vérifié";
        description = "Termine d'abord la vérification email puis réessaie. Un nouveau code peut être envoyé.";
      } else if (status === 409 && loginError) {
        // Email pris ET le mot de passe entré ne correspond pas.
        title = "Cet email a déjà un compte";
        description = "Connecte-toi avec ton mot de passe existant via /inscription pour récupérer ta réservation en attente.";
      } else if (status === 400) {
        title = "Données invalides";
        description = registerError?.message ?? "Vérifie les informations saisies.";
      }

      toast({ title, description, variant: "destructive" });
      return;
    }

    // Authentifié : on soumet la réservation en attente s'il y en a une.
    const pending = pendingBookingStorage.load();
    if (pending) {
      try {
        await bookingService.create(pending);
        pendingBookingStorage.clear();
        toast({ title: "Réservation enregistrée", description: "Tu peux la consulter dans ton dashboard." });
      } catch (err) {
        const e = err as { message?: string };
        toast({
          title: "Réservation non enregistrée",
          description: e?.message ?? "Une erreur est survenue.",
          variant: "destructive",
        });
      }
    }

    setSubmitting(false);
    navigate("/dashboard", { state: { profile: type, name } });
  };

  return (
    <div className="bg-card rounded-3xl border border-border shadow-lg p-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
      )}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          Quel est votre type de compte ?
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Cette information nous permet de vous orienter vers le bon espace client.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08 } }}
              whileHover={{ y: -3 }}
              onClick={() => handleSelect(opt.type)}
              className="text-left p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground text-lg mb-1">
                {opt.label}
              </h3>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default StepClientTypeSelection;
