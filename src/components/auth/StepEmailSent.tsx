import { useEffect, useState } from "react";
import { Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

interface Props {
  email: string;
  onContinue: () => void;
}

const StepEmailSent = ({ email, onContinue }: Props) => {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  // Envoi automatique du code au montage.
  useEffect(() => {
    void sendCode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compte à rebours du bouton "Renvoyer" (60s).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const sendCode = async (isInitial = false) => {
    setError(null);
    setSending(true);
    try {
      await authService.sendVerificationCode(email);
      setSentAt(Date.now());
      setResendCooldown(60);
      if (!isInitial) {
        toast({
          title: "Nouveau code envoyé",
          description: `Un nouveau code a été envoyé à ${email}.`,
        });
      }
    } catch (err) {
      const e = err as { message?: string; status?: number };
      if (e.status === 409) {
        setError("Un compte existe déjà avec cet email. Connecte-toi à la place.");
      } else if (e.status === 400) {
        setError("Format d'email invalide.");
      } else {
        setError(e.message ?? "Envoi impossible. Vérifie ton email et réessaie.");
      }
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      await authService.verifyEmailCode(email, code);
      setSuccess(true);
      // Petit délai pour voir l'animation de succès, puis on continue.
      setTimeout(() => onContinue(), 800);
    } catch (err) {
      const e = err as { message?: string; status?: number };
      setCode("");
      if (e.status === 401) {
        setError("Code invalide ou expiré. Demande un nouveau code.");
      } else {
        setError(e.message ?? "Vérification impossible.");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="text-center">
      <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center transition-colors ${
        success ? "bg-green-100" : "bg-accent"
      }`}>
        {success ? (
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        ) : (
          <Mail className="h-10 w-10 text-primary" />
        )}
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
        {success ? "Email vérifié !" : "Vérifiez votre email"}
      </h2>

      {success ? (
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          Ton adresse est confirmée. Tu vas passer à l'étape suivante…
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mb-1 max-w-sm mx-auto">
            Nous avons envoyé un code à 6 chiffres à :
          </p>
          <p className="font-semibold text-foreground mb-6">{email}</p>

          <div className="bg-background rounded-2xl border border-border p-6 max-w-sm mx-auto mb-4">
            {sending && !sentAt ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Envoi du code…
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  Saisis le code reçu (vérifie aussi tes spams).
                </p>
                <div className="flex justify-center mb-4">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <div className="text-xs text-destructive flex items-center justify-center gap-1 mb-3">
                    <AlertCircle className="h-3 w-3" /> {error}
                  </div>
                )}

                <Button
                  onClick={verify}
                  disabled={code.length !== 6 || verifying}
                  className="w-full rounded-xl gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Vérification…
                    </>
                  ) : (
                    <>
                      Vérifier <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <Button
            onClick={() => sendCode(false)}
            disabled={sending || resendCooldown > 0}
            variant="ghost"
            className="text-xs text-muted-foreground"
          >
            {resendCooldown > 0
              ? `Renvoyer dans ${resendCooldown}s`
              : sending
                ? "Envoi…"
                : "Renvoyer le code"}
          </Button>
        </>
      )}
    </div>
  );
};

export default StepEmailSent;
