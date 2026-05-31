import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  name: string;
  email: string;
  password: string;
  onBack: () => void;
}

const activityTypes = [
  "Agence de Voyage", "Hôtel", "Resort & Spa", "Entreprise",
  "Organisateur d'événements", "Guide Touristique", "Autre",
];

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-sm font-medium text-foreground mb-1.5 block">
    {children} {required && <span className="text-destructive">*</span>}
  </label>
);

const FormCorporate = ({ name, email, password, onBack }: Props) => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    raisonSociale: name,
    activityType: "",
    matriculeFiscal: "",
    adresseFacturation: "",
    siteWeb: "",
    nomResponsable: "",
    emailPro: email,
    telephonePro: "",
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    // Real-time validation
    if (key === "telephonePro") {
      const phone = e.target.value;
      if (phone.length > 8) {
        setErrors(prev => ({ ...prev, telephonePro: "Le téléphone doit contenir exactement 8 chiffres" }));
      } else {
        setErrors(prev => ({ ...prev, telephonePro: "" }));
      }
    }
  };

  // Validation: phone must be 8 digits
  const isPhoneValid = form.telephonePro.length === 8 && /^\d{8}$/.test(form.telephonePro);

  const isValid =
    form.raisonSociale.trim().length > 1 &&
    form.activityType &&
    form.matriculeFiscal.trim().length > 3 &&
    form.adresseFacturation.trim().length > 5 &&
    form.nomResponsable.trim().length > 1 &&
    form.emailPro.trim().length > 3 &&
    isPhoneValid;

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    if (!isPhoneValid && form.telephonePro.length > 0) {
      newErrors.telephonePro = "Le téléphone doit contenir exactement 8 chiffres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isValid) {
      validateFields();
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        fullName: form.raisonSociale, // Raison sociale comme fullName (nom de l'entreprise)
        email: form.emailPro,
        phone: form.telephonePro,
        password: password,
        role: "client_b2b",
        activityType: form.activityType,
        matriculeFiscal: form.matriculeFiscal,
        address: form.adresseFacturation,
        website: form.siteWeb || undefined,
        responsibleName: form.nomResponsable,
        responsibleEmail: form.emailPro,
        responsiblePhone: form.telephonePro,
      });
      await refresh();
      setSuccess(true);
      toast.success("Inscription réussie ! Bienvenue sur Yalla Transfer.");
      setTimeout(() => navigate("/dashboard", { state: { profile: "corporate", name } }), 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error?.data?.message || error?.message || "Erreur lors de l'inscription. Veuillez réessayer.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">🎉 Compte Corporate créé !</h2>
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
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Profil Corporate</h2>
          <p className="text-sm text-muted-foreground">Partenaire Demandeur — Facturation B2B</p>
        </div>
      </div>
      <p className="text-muted-foreground mb-8 mt-2">Renseignez les informations de votre structure pour activer la facturation</p>

      {/* Section A */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">A</span>
          <h3 className="font-semibold text-foreground">Identité de la Structure</h3>
        </div>

        <div>
          <FieldLabel required>Raison Sociale</FieldLabel>
          <Input value={form.raisonSociale} onChange={set("raisonSociale")} placeholder="Nom de l'entreprise" className="h-12 rounded-xl" />
        </div>

        <div>
          <FieldLabel required>Type d'Activité</FieldLabel>
          <select
            value={form.activityType}
            onChange={set("activityType")}
            className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sélectionner votre secteur...</option>
            {activityTypes.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <FieldLabel required>Matricule Fiscal (MF)</FieldLabel>
          <Input value={form.matriculeFiscal} onChange={set("matriculeFiscal")} placeholder="Ex: 1234567/A/M/000" className="h-12 rounded-xl" />
          <p className="text-xs text-muted-foreground mt-1">Obligatoire pour la génération des factures</p>
        </div>

        <div>
          <FieldLabel required>Adresse de Facturation Complète</FieldLabel>
          <Input value={form.adresseFacturation} onChange={set("adresseFacturation")} placeholder="N° rue, Ville, Code postal, Pays" className="h-12 rounded-xl" />
        </div>

        <div>
          <FieldLabel>Site Web <span className="text-muted-foreground font-normal">(Optionnel)</span></FieldLabel>
          <Input value={form.siteWeb} onChange={set("siteWeb")} placeholder="https://www.monentreprise.tn" className="h-12 rounded-xl" />
        </div>
      </div>

      {/* Section B */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">B</span>
          <h3 className="font-semibold text-foreground">Le Gestionnaire du Compte</h3>
        </div>

        <div>
          <FieldLabel required>Nom & Prénom du Responsable</FieldLabel>
          <Input value={form.nomResponsable} onChange={set("nomResponsable")} placeholder="Ex: Mohamed Ben Ali" className="h-12 rounded-xl" />
        </div>

        <div>
          <FieldLabel required>Email du responsable des transferts</FieldLabel>
          <Input type="email" value={form.emailPro} onChange={set("emailPro")} placeholder="transferts@monentreprise.tn" className="h-12 rounded-xl" />
          <p className="text-xs text-muted-foreground mt-1">Utilisé pour la coordination des transferts et la réception des factures</p>
        </div>

        <div>
          <FieldLabel required>Téléphone Mobile Pro</FieldLabel>
          <Input
            type="tel"
            value={form.telephonePro}
            onChange={(e) => { set("telephonePro")(e); setErrors(prev => ({ ...prev, telephonePro: "" })); }}
            placeholder="XX XXX XXX (8 chiffres)"
            className={cn("h-12 rounded-xl", errors.telephonePro && "border-destructive")}
          />
          {errors.telephonePro && <p className="text-xs text-destructive mt-1">{errors.telephonePro}</p>}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full h-12 text-base font-semibold shadow-button rounded-xl gap-2"
        >
          Activer mon espace Corporate
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FormCorporate;
