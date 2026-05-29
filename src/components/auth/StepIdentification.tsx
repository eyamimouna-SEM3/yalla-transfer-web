import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, User, Mail, AlertCircle } from "lucide-react";
import { validators, validateAll } from "@/utils/validators";
import type { ProfileType } from "@/pages/AuthPage";

interface Props {
  profile: ProfileType;
  onContinue: (name: string, email: string) => void;
  onBack: () => void;
}

const StepIdentification = ({ profile, onContinue, onBack }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isSociety = profile === "corporate" || profile === "transport";
  const nameLabel = isSociety ? "Nom de la Société" : "Nom et Prénom";
  const namePlaceholder = isSociety ? "Ex: Tunisia Travel Agency" : "Ex: Mohamed Ben Ali";

  const validate = () => {
    return validateAll({
      name: () => validators.fullName(name),
      email: () => validators.email(email),
    });
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    setTouched({ name: true, email: true });
    if (Object.keys(errs).length === 0) {
      onContinue(name.trim(), email.trim().toLowerCase());
    }
  };

  const handleBlur = (field: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  const showError = (field: string) => touched[field] && errors[field];

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div className="bg-card rounded-3xl border border-border shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.1)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-accent" />

        <div className="p-8 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Vos informations
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Renseignez vos coordonnées pour créer votre compte
          </p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{nameLabel}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  aria-invalid={!!showError("name")}
                  className={`h-12 rounded-xl pl-10 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all ${
                    showError("name") ? "border-destructive" : ""
                  }`}
                />
              </div>
              {showError("name") && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Adresse E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={!!showError("email")}
                  className={`h-12 rounded-xl pl-10 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all ${
                    showError("email") ? "border-destructive" : ""
                  }`}
                />
              </div>
              {showError("email") && (
                <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] transition-all"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIdentification;
