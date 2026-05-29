import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import StepProfileSelection from "@/components/auth/StepProfileSelection";
import StepIdentification from "@/components/auth/StepIdentification";
import StepEmailSent from "@/components/auth/StepEmailSent";
import StepPassword from "@/components/auth/StepPassword";
import StepSuccess from "@/components/auth/StepSuccess";
import StepProfileForm from "@/components/auth/StepProfileForm";

export type ProfileType = "particulier" | "corporate" | "transport" | "chauffeur" | null;

const AuthPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProfileType>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleProfileSelect = (type: ProfileType) => {
    setProfile(type);
    setStep(2);
  };

  const handleIdentification = (n: string, e: string) => {
    setName(n);
    setEmail(e);
    setStep(3);
  };

  const totalSteps = 6;

  const pageVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
  };

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
                  s <= step ? "bg-primary w-10" : "bg-border w-6"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" {...pageVariants}>
                <StepProfileSelection onSelect={handleProfileSelect} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" {...pageVariants}>
                <StepIdentification
                  profile={profile}
                  onContinue={handleIdentification}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" {...pageVariants}>
                <StepEmailSent email={email} onContinue={() => setStep(4)} />
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" {...pageVariants}>
                <StepPassword email={email} onBack={() => setStep(3)} onComplete={() => setStep(5)} />
              </motion.div>
            )}
            {step === 5 && (
              <motion.div key="step5" {...pageVariants}>
                <StepSuccess
                  profile={profile}
                  onContinue={() => setStep(6)}
                />
              </motion.div>
            )}
            {step === 6 && (
              <motion.div key="step6" {...pageVariants}>
                <StepProfileForm profile={profile} name={name} email={email} onBack={() => setStep(5)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
