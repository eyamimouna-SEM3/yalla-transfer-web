import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight,
  ShieldAlert, ShieldCheck,
} from "lucide-react";
import { authService } from "@/services/authService";
import { validators } from "@/utils/validators";

const SPECIAL_REGEX = /[!@#$%^&*(),.?":{}|<>_\-\\/\[\];+=~`]/;

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide ou expiré. Demande un nouveau lien.");
    }
  }, [token]);

  // Indicateurs de force du mot de passe
  const strength = useMemo(() => ({
    hasMinLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: SPECIAL_REGEX.test(password),
  }), [password]);

  const isStrong = strength.hasMinLength && strength.hasLetter && strength.hasNumber && strength.hasSpecial;
  const passwordsMatch = password === confirm && confirm.length > 0;
  const isValid = isStrong && passwordsMatch && token.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwdError = validators.password(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    const matchError = validators.passwordsMatch(password, confirm);
    if (matchError) {
      setError(matchError);
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      // Auto-redirige vers la home après quelques secondes.
      setTimeout(() => navigate("/", { replace: true }), 3000);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 401) {
        setError("Le lien a expiré ou a déjà été utilisé. Demande un nouveau lien.");
      } else if (e.status === 400) {
        setError(e.message ?? "Mot de passe invalide.");
      } else {
        setError(e.message ?? "Réinitialisation impossible. Réessaie.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          {success ? (
            <div className="bg-card rounded-3xl border border-border shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.1)] overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
              <div className="p-8 sm:p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Mot de passe réinitialisé !
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Ton mot de passe a bien été mis à jour. Tu peux maintenant te connecter avec.
                </p>
                <Button onClick={() => navigate("/", { replace: true })} className="rounded-xl gap-2">
                  Aller à la page d'accueil <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Redirection automatique dans quelques secondes…
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.1)] overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-accent" />
              <div className="p-8 sm:p-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    Nouveau mot de passe
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Choisis un mot de passe sécurisé pour ton compte Yalla Transfer.
                  </p>
                </div>

                {!token ? (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 flex items-start gap-3 mb-6">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Lien invalide</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Aucun jeton de réinitialisation dans l'URL. Demande un nouveau lien depuis la page de connexion.
                      </p>
                      <Link to="/" className="text-xs text-primary font-semibold mt-2 inline-block">
                        Retour à l'accueil
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm font-semibold text-foreground">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPwd ? "text" : "password"}
                          placeholder="Minimum 8 caractères"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-primary/20"
                          required
                          autoFocus
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {password.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <div className={`h-1 flex-1 rounded-full transition-colors ${strength.hasMinLength ? "bg-green-500" : "bg-border"}`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${strength.hasLetter ? "bg-green-500" : "bg-border"}`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${strength.hasNumber ? "bg-green-500" : "bg-border"}`} />
                          <div className={`h-1 flex-1 rounded-full transition-colors ${strength.hasSpecial ? "bg-green-500" : "bg-border"}`} />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {isStrong ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-green-600">Mot de passe sécurisé</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
                              <span className="text-orange-500">
                                {!strength.hasMinLength ? `${8 - password.length} caractères restants` :
                                  !strength.hasLetter ? "Ajoute une lettre" :
                                  !strength.hasNumber ? "Ajoute un chiffre" :
                                  "Ajoute un caractère spécial"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirmation</Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Confirmez le mot de passe"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className={`pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-primary/20 ${
                            confirm.length > 0 && !passwordsMatch ? "border-destructive" : ""
                          }`}
                          required
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirm.length > 0 && !passwordsMatch && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Les mots de passe ne correspondent pas.
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!isValid || submitting}
                      className="w-full h-12 rounded-xl font-semibold text-base gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Réinitialisation…
                        </>
                      ) : (
                        <>
                          Valider le nouveau mot de passe <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
