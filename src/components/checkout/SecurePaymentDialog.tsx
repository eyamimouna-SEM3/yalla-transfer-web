import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, Shield, CreditCard, Mail, ArrowRight, CheckCircle2, Loader2, Wallet, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { validators, validateAll } from "@/utils/validators";
import { paymentService } from "@/services/paymentService";
import { cn } from "@/lib/utils";

export type PaymentMethodKind =
  | "card"
  | "clicktopay"
  | "edinar"
  | "wallet"
  | "bank"
  | "cash";

interface SecurePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethodKind | null;
  amount: number;
  currency?: string;
  /** Reçoit l'email saisi pour que le booking soit créé avec et reçoive le voucher par email. */
  onSuccess: (verifiedEmail: string) => void;
  transferDate?: Date;
}

const methodLabels: Record<PaymentMethodKind, string> = {
  card: "Carte internationale",
  clicktopay: "Carte nationale (Click to Pay)",
  edinar: "Carte E-Dinar",
  wallet: "Wallet numérique",
  bank: "Virement bancaire",
  cash: "Paiement en espèces",
};

type Phase = "form" | "processing" | "otp" | "success";

const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 12 }, (_, i) => String(currentYear + i));

const SecurePaymentDialog = ({
  open, onOpenChange, method, amount, currency = "DT", onSuccess, transferDate,
}: SecurePaymentDialogProps) => {
  const [phase, setPhase] = useState<Phase>("form");
  const [otp, setOtp] = useState("");

  // Card-like fields (also used for E-Dinar)
  const [cardNumber, setCardNumber] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [email, setEmail] = useState("");

  // Wallet-specific
  const [walletId, setWalletId] = useState("");
  const [walletPin, setWalletPin] = useState("");

  // Bank-specific
  const [iban, setIban] = useState("");

  const isCardLike = method === "card" || method === "clicktopay" || method === "edinar";
  const isWallet = method === "wallet";
  const isBank = method === "bank";

  useEffect(() => {
    if (open) {
      setPhase("form");
      setOtp("");
      setIban("");
    }
  }, [open, method]);

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

  // Erreurs détaillées par champ (messages français clairs).
  const fieldErrors = useMemo(() => {
    if (isCardLike) {
      const expiryString = month && year ? `${month}/${String(year).slice(-2)}` : "";
      return validateAll({
        email: () => validators.email(email),
        holder: () => validators.fullName(holder),
        cardNumber: () => validators.cardNumber(cardNumber),
        expiry: () => (month && year ? validators.expiry(expiryString, transferDate) : "Date d'expiration requise."),
        cvv: () => validators.cvv(cvv),
      });
    }
    if (isWallet) {
      return validateAll({
        email: () => validators.email(email),
        holder: () => validators.fullName(holder),
        walletId: () => (walletId.trim().length < 4 ? "Identifiant trop court (min 4 caractères)." : null),
        walletPin: () => (walletPin.length < 4 ? "PIN trop court (min 4 chiffres)." : null),
      });
    }
    if (isBank) {
      const trimmedIban = iban.trim().toUpperCase();
      return validateAll({
        email: () => validators.email(email),
        holder: () => validators.fullName(holder),
        iban: () => {
          if (!trimmedIban) return "IBAN requis.";
          if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(trimmedIban)) return "IBAN invalide (format ex : TN5912345678901234567890).";
          return null;
        },
      });
    }
    return validateAll({
      email: () => validators.email(email),
    });
  }, [isCardLike, isWallet, isBank, cardNumber, month, year, cvv, holder, email, walletId, walletPin, iban, transferDate]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const sendVerificationCode = async (targetEmail: string) => {
    await paymentService.sendCode({ email: targetEmail });
  };

  const handlePay = async () => {
    if (!isFormValid) return;
    setPhase("processing");
    try {
      await sendVerificationCode(email.trim().toLowerCase());
      setPhase("otp");
      toast({
        title: "Code envoyé",
        description: `Un code à 6 chiffres a été envoyé à ${email}. Vérifie ta boîte mail (et les spams).`,
      });
    } catch (err) {
      const e = err as { message?: string };
      setPhase("form");
      toast({
        title: "Envoi du code impossible",
        description: e?.message ?? "Vérifie ton email puis réessaie.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setPhase("processing");
    try {
      await paymentService.verifyCode({ email: email.trim().toLowerCase(), code: otp });
      setPhase("success");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess(email.trim().toLowerCase());
      }, 1100);
    } catch (err) {
      const e = err as { message?: string; status?: number };
      setPhase("otp");
      setOtp("");
      toast({
        title: "Code invalide",
        description: e?.status === 401
          ? "Le code ne correspond pas ou a expiré. Demande un nouveau code."
          : e?.message ?? "Réessaie.",
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    setOtp("");
    try {
      await sendVerificationCode(email.trim().toLowerCase());
      toast({
        title: "Nouveau code envoyé",
        description: `Un nouveau code a été envoyé à ${email}.`,
      });
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Envoi impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    }
  };

  if (!method) return null;

  const title = methodLabels[method];

  return (
    <Dialog open={open} onOpenChange={(v) => phase !== "processing" && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Lock className="h-4 w-4 text-primary" />
            Paiement sécurisé — {title}
          </DialogTitle>
          <DialogDescription>
            Vos informations sont chiffrées et protégées par 3D Secure.
          </DialogDescription>
        </DialogHeader>

        {phase === "form" && (
          <div className="space-y-3 pt-1">
            {isCardLike && (
              <>
                <div>
                  <Label className="text-xs">Nom du titulaire</Label>
                  <Input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value.toUpperCase())}
                    placeholder="NOM PRÉNOM"
                    className="mt-1"
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label className="text-xs">Numéro de carte</Label>
                  <div className="relative mt-1">
                    <Input
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="pr-10 font-mono tracking-wider"
                      maxLength={19}
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Mois</Label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">MM</option>
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Année</Label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">AAAA</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">CVV</Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      className={cn("mt-1 font-mono", cvv.length > 0 && fieldErrors.cvv && "border-destructive")}
                      maxLength={4}
                    />
                    {cvv.length > 0 && fieldErrors.cvv && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {fieldErrors.cvv}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {isWallet && (
              <>
                <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-2 text-xs">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Connectez-vous à votre portefeuille numérique pour confirmer le paiement.</span>
                </div>
                <div>
                  <Label className="text-xs">Nom du titulaire du wallet</Label>
                  <Input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="Nom complet"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Identifiant Wallet (téléphone ou ID)</Label>
                  <Input
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Code PIN du wallet</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={walletPin}
                    onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••"
                    className="mt-1 font-mono"
                    maxLength={6}
                  />
                </div>
              </>
            )}

            {isBank && (
              <>
                <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center gap-2 text-xs">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Vous recevrez nos coordonnées bancaires pour effectuer le virement.</span>
                </div>
                <div>
                  <Label className="text-xs">Nom du titulaire du compte</Label>
                  <Input
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="Nom complet"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">IBAN (max 20 chiffres)</Label>
                  <Input
                    value={iban}
                    onChange={(e) => setIban(e.target.value.replace(/\s/g, "").toUpperCase())}
                    placeholder="TN00 0000 0000 0000 0000 0000"
                    className="mt-1 font-mono"
                    maxLength={20}
                  />
                  {iban.length > 0 && fieldErrors.iban && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {fieldErrors.iban}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label className="text-xs flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Adresse e-mail (pour la vérification)
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border/60">
              <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
              Un code de vérification à usage unique vous sera envoyé par e-mail.
            </div>

            <Button
              onClick={handlePay}
              disabled={!isFormValid}
              className="w-full rounded-xl gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Payer {amount} {currency}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {phase === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Traitement sécurisé en cours…</p>
          </div>
        )}

        {phase === "otp" && (
          <div className="space-y-4 pt-1">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Vérification par e-mail</p>
              <p className="text-xs text-muted-foreground">
                Saisissez le code à 6 chiffres envoyé à<br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Astuce démo : saisissez n'importe quel code à 6 chiffres.
            </p>

            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="w-full rounded-xl gap-2 bg-primary hover:bg-primary/90"
            >
              Valider le paiement <CheckCircle2 className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full text-xs text-muted-foreground hover:text-primary underline transition-colors"
            >
              Renvoyer le code
            </button>
          </div>
        )}

        {phase === "success" && (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <p className="font-display font-semibold text-foreground">Paiement validé avec succès</p>
            <p className="text-xs text-muted-foreground">Votre réservation est confirmée.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SecurePaymentDialog;
