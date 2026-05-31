import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import StepProfileSelection from "@/components/auth/StepProfileSelection";
import StepIdentification from "@/components/auth/StepIdentification";
import StepEmailSent from "@/components/auth/StepEmailSent";
import StepPassword from "@/components/auth/StepPassword";
import StepSuccess from "@/components/auth/StepSuccess";
import StepProfileForm from "@/components/auth/StepProfileForm";
import StepClientTypeSelection from "@/components/auth/StepClientTypeSelection";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type ProfileType = "particulier" | "corporate" | "transport" | "chauffeur" | null;

const VALID_PROFILES: ProfileType[] = ["particulier", "corporate", "transport", "chauffeur"];

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileType>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // Mode "quickfinalize" : après une réservation, on demande seulement
  // le mot de passe puis le type de client (particulier / corporate).
  const [quickFinalize, setQuickFinalize] = useState(false);

  // Si l'utilisateur est déjà connecté, on le redirige automatiquement vers
  // son dashboard. Inutile de lui demander de recréer un compte — y compris
  // pour le mode "quickfinalize" qui est conçu uniquement pour les invités
  // ayant réservé sans compte.
  useEffect(() => {
    if (loading) return;
    if (user) {
      toast({
        title: "Déjà connecté",
        description: `Vous êtes déjà connecté en tant que ${user.fullName || user.email}. Redirection vers votre espace…`,
      });
      const path = user.role === "admin" ? "/admin" : "/dashboard";
      navigate(path, { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const finalize = searchParams.get("finalize") as ProfileType | null;
    const quick = searchParams.get("quickfinalize");

    if (quick === "1") {
      // Parcours léger post-réservation : mot de passe → type client → dashboard
      setQuickFinalize(true);
      setName(searchParams.get("name") || "");
      setEmail(searchParams.get("email") || "");
      setStep(10); // étape "création mot de passe"
      return;
    }

    if (finalize && VALID_PROFILES.includes(finalize)) {
      setProfile(finalize);
      setName(searchParams.get("name") || "");
      setEmail(searchParams.get("email") || "");
      setStep(6);
    }
  }, [searchParams]);

  const handleProfileSelect = (type: ProfileType) => {
    setProfile(type);
    setStep(2);
  };

  const handleIdentification = (n: string, e: string) => {
    setName(n);
    setEmail(e);
    // Flow : Identification → Password (step 3) → EmailVerification (step 4) → Success (step 5)
    setStep(3);
  };

  const handlePasswordComplete = (pwd: string) => {
    setPassword(pwd);
    // Une fois le mot de passe défini, on envoie le code de vérification email.
    setStep(4);
  };

  const handleEmailVerified = () => {
    // Email vérifié → succès puis formulaire spécifique au profil.
    setStep(5);
  };

  const handleQuickPasswordComplete = (pwd: string) => {
    setPassword(pwd);
    // Avant de finaliser, on passe par une étape de vérification email (step 12).
    setStep(12);
  };

  const handleQuickEmailVerified = () => {
    // Email vérifié → on peut afficher le choix du type de compte.
    setStep(11);
  };

  const handleClientTypeSelected = (type: ProfileType) => {
    setProfile(type);
    // Redirection vers le dashboard dans le bon espace
    navigate("/dashboard", { state: { profile: type, name: name || "Client" } });
  };

  // Progress bar : quickfinalize fait maintenant 3 étapes (password, email verify, type).
  const totalSteps = quickFinalize ? 3 : 6;
  const progressStep = quickFinalize
    ? step === 10 ? 1 : step === 12 ? 2 : 3
    : step;

  const pageVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
  };

  // Pendant le chargement initial ou si l'utilisateur est déjà connecté
  // (et qu'on est en train de le rediriger), on affiche un spinner au lieu
  // du formulaire d'inscription pour éviter le "flash" visuel.
  const isRedirectingLoggedIn = !loading && user;
  if (loading || isRedirectingLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            {isRedirectingLoggedIn
              ? "Redirection vers votre espace…"
              : "Chargement…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  s <= progressStep ? "bg-primary w-10" : "bg-border w-6"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* === Quick finalize flow (post-réservation) === */}
            {quickFinalize && step === 10 && (
              <motion.div key="qf-password" {...pageVariants}>
                <StepPassword
                  email={email}
                  onBack={() => navigate(-1)}
                  onCompleteWithPassword={handleQuickPasswordComplete}
                />
              </motion.div>
            )}
            {quickFinalize && step === 12 && (
              <motion.div key="qf-verify-email" {...pageVariants}>
                <StepEmailSent email={email} onContinue={handleQuickEmailVerified} />
              </motion.div>
            )}
            {quickFinalize && step === 11 && (
              <motion.div key="qf-type" {...pageVariants}>
                <StepClientTypeSelection
                  onSelect={() => {}}
                  onBack={() => setStep(10)}
                  name={name}
                  email={email}
                  password={password}
                />
              </motion.div>
            )}

            {/* === Standard signup flow === */}
            {!quickFinalize && step === 1 && (
              <motion.div key="step1" {...pageVariants}>
                <StepProfileSelection onSelect={handleProfileSelect} />
              </motion.div>
            )}
            {!quickFinalize && step === 2 && (
              <motion.div key="step2" {...pageVariants}>
                <StepIdentification
                  profile={profile}
                  onContinue={handleIdentification}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
            {!quickFinalize && step === 3 && (
              <motion.div key="step3" {...pageVariants}>
                <StepPassword
                  email={email}
                  onBack={() => setStep(2)}
                  onCompleteWithPassword={handlePasswordComplete}
                />
              </motion.div>
            )}
            {!quickFinalize && step === 4 && (
              <motion.div key="step4" {...pageVariants}>
                <StepEmailSent email={email} onContinue={handleEmailVerified} />
              </motion.div>
            )}
            {!quickFinalize && step === 5 && (
              <motion.div key="step5" {...pageVariants}>
                <StepSuccess
                  profile={profile}
                  onContinue={() => setStep(6)}
                />
              </motion.div>
            )}
            {!quickFinalize && step === 6 && (
              <motion.div key="step6" {...pageVariants}>
                <StepProfileForm profile={profile} name={name} email={email} password={password} onBack={() => setStep(5)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
