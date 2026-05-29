import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { validators } from "@/utils/validators";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-rempli depuis le modal de login si l'utilisateur a déjà saisi son email. */
  initialEmail?: string;
}

const ForgotPasswordDialog = ({ open, onOpenChange, initialEmail = "" }: Props) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClose = (next: boolean) => {
    if (!submitting) {
      onOpenChange(next);
      if (!next) {
        // Reset l'état au prochain ouverture
        setTimeout(() => {
          setSent(false);
          setError(null);
          setEmail(initialEmail);
        }, 300);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validators.email(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 404) {
        setError("Aucun compte n'est associé à cet email.");
      } else {
        setError(e.message ?? "Envoi impossible. Réessaie dans un instant.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] rounded-3xl">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-accent" />

        <div className="px-8 pt-8 pb-10">
          {!sent ? (
            <>
              <DialogHeader className="mb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="font-display text-2xl font-bold text-foreground">
                  Mot de passe oublié ?
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  Saisis ton email — nous t'enverrons un lien pour choisir un nouveau mot de passe.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-semibold text-foreground">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all ${
                        error ? "border-destructive" : ""
                      }`}
                      required
                      autoFocus
                      disabled={submitting}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {error}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={submitting || !email.trim()}
                    className="w-full h-12 rounded-xl font-semibold text-base gap-2 bg-primary hover:bg-primary/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Envoi…
                      </>
                    ) : (
                      <>
                        Envoyer le lien <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleClose(false)}
                    disabled={submitting}
                    className="w-full text-sm text-muted-foreground gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-5 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Email envoyé !
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Si un compte existe pour cette adresse, un email contenant un lien de réinitialisation t'a été envoyé.
              </p>
              <p className="font-semibold text-foreground mb-6">{email}</p>
              <div className="bg-muted/50 rounded-2xl border border-border p-4 mb-6 text-left">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  📩 Vérifie ta boîte mail (et le dossier <strong>spam</strong>).<br/>
                  🔗 Clique sur le bouton "Réinitialiser mon mot de passe" du mail.<br/>
                  ⏱️ Le lien est valable <strong>1 heure</strong>.
                </p>
              </div>
              <Button
                onClick={() => handleClose(false)}
                className="w-full h-12 rounded-xl font-semibold"
              >
                J'ai compris
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
