import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock } from "lucide-react";

interface Props {
  email: string;
  onBack: () => void;
  onComplete: (password: string) => void;
}

const StepPassword = ({ email, onBack, onComplete }: Props) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch = password === confirm;
  const isValid = isStrong && confirm.length > 0 && passwordsMatch;

  const getStrengthLabel = () => {
    if (password.length === 0) return null;
    if (!hasMinLength) return { text: `${8 - password.length} caractères restants`, color: "text-destructive", icon: ShieldAlert };
    if (!isStrong) return { text: "Ajoutez une majuscule et un chiffre", color: "text-orange-500", icon: ShieldAlert };
    return { text: "Mot de passe sécurisé", color: "text-green-600", icon: ShieldCheck };
  };

  const strength = getStrengthLabel();

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
            Sécurisez votre compte
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Créez un mot de passe pour finaliser votre inscription
          </p>

          <div className="space-y-5">
            {/* Email reminder */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Adresse E-mail</label>
              <Input value={email} disabled className="h-12 rounded-xl bg-muted/50" />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pl-10 pr-12 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Strength indicators */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <div className={`h-1 flex-1 rounded-full transition-colors ${hasMinLength ? "bg-green-500" : "bg-border"}`} />
                  <div className={`h-1 flex-1 rounded-full transition-colors ${hasUppercase ? "bg-green-500" : "bg-border"}`} />
                  <div className={`h-1 flex-1 rounded-full transition-colors ${hasNumber ? "bg-green-500" : "bg-border"}`} />
                </div>
                {strength && (
                  <div className="flex items-center gap-2 text-xs">
                    <strength.icon className={`h-3.5 w-3.5 ${strength.color}`} />
                    <span className={strength.color}>{strength.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Confirmation</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 rounded-xl pl-10 pr-12 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm.length > 0 && (
                <div className="flex items-center gap-2 text-xs mt-2">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-green-600">Mots de passe identiques</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive">Les mots de passe ne correspondent pas</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => isValid && onComplete(password)}
              disabled={!isValid}
              className="w-full h-12 text-base font-semibold rounded-xl gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] transition-all"
            >
              Valider et créer mon compte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepPassword;
