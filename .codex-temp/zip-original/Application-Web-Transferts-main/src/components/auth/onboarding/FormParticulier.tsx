import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, User, Phone, Globe, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  name: string;
  email: string;
  onBack: () => void;
}

const countryCodes = [
  { code: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+32", flag: "🇧🇪", name: "Belgique" },
  { code: "+41", flag: "🇨🇭", name: "Suisse" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+49", flag: "🇩🇪", name: "Allemagne" },
  { code: "+34", flag: "🇪🇸", name: "Espagne" },
  { code: "+39", flag: "🇮🇹", name: "Italie" },
  { code: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "+213", flag: "🇩🇿", name: "Algérie" },
];

const countries = [
  "Tunisie", "France", "Belgique", "Suisse", "Allemagne", "Espagne", "Italie",
  "Royaume-Uni", "USA", "Canada", "Maroc", "Algérie", "Egypte", "Emirats Arabes Unis",
  "Arabie Saoudite", "Qatar", "Kuwait", "Autre"
];

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-sm font-medium text-foreground mb-1.5 block">
    {children} {required && <span className="text-destructive">*</span>}
  </label>
);

const FormParticulier = ({ name, email, onBack }: Props) => {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("+216");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = phone.length >= 6 && country && nationality && otpVerified;

  const handleSendOtp = () => {
    if (phone.length >= 6) setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) setOtpVerified(true);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSuccess(true);
    setTimeout(() => navigate("/dashboard", { state: { profile: "particulier", name } }), 2000);
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">🎉 Compte créé avec succès !</h2>
        <p className="text-muted-foreground">Redirection vers votre espace...</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Compléter votre profil</h2>
          <p className="text-sm text-muted-foreground">Client Particulier</p>
        </div>
      </div>
      <p className="text-muted-foreground mb-8 mt-2">Quelques informations pour sécuriser vos réservations</p>

      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5">
        {/* Pre-filled */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nom & Prénom</FieldLabel>
            <Input value={name} disabled className="h-12 rounded-xl bg-muted" />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <Input value={email} disabled className="h-12 rounded-xl bg-muted" />
          </div>
        </div>

        {/* Nationalité */}
        <div>
          <FieldLabel required>Nationalité</FieldLabel>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sélectionner votre nationalité...</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Phone with OTP */}
        <div>
          <FieldLabel required>Numéro de Téléphone Mobile</FieldLabel>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <Input
              type="tel"
              placeholder="XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-xl flex-1"
            />
            {!otpSent && (
              <Button
                type="button"
                onClick={handleSendOtp}
                variant="outline"
                disabled={phone.length < 6}
                className="h-12 px-4 rounded-xl border-primary text-primary hover:bg-primary/5 whitespace-nowrap"
              >
                Vérifier via WhatsApp
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Un code de vérification sera envoyé via WhatsApp à ce numéro</p>
        </div>

        {/* OTP input */}
        {otpSent && !otpVerified && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <FieldLabel required>Code OTP reçu via WhatsApp</FieldLabel>
            <div className="flex gap-2">
              <Input
                placeholder="_ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-12 rounded-xl text-center text-xl tracking-widest font-bold"
              />
              <Button onClick={handleVerifyOtp} disabled={otp.length < 4} className="h-12 px-5 rounded-xl">
                Confirmer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Code envoyé via WhatsApp à {countryCode} {phone} — <span className="text-primary cursor-pointer hover:underline">Renvoyer</span></p>
          </div>
        )}

        {otpVerified && (
          <div className="flex items-center gap-2 text-sm text-primary bg-secondary rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4" />
            Numéro de téléphone vérifié avec succès ✔
          </div>
        )}

        {/* Country */}
        <div>
          <FieldLabel required>Pays de Résidence</FieldLabel>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sélectionner votre pays...</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Globe className="h-3 w-3" /> Permet d'adapter la devise et la langue
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 text-base font-semibold shadow-button rounded-xl gap-2"
        >
          Accéder à mon espace
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FormParticulier;
