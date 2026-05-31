import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Truck, Upload, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
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

const vehicleTypes = [
  { id: "ECO", label: "ECO", desc: "Citadine (Clio, Rio...) — 3 Pax" },
  { id: "SEDAN", label: "SEDAN", desc: "Berline Confort (Passat, Jetta...) — 3/4 Pax" },
  { id: "PREMIUM", label: "PREMIUM", desc: "Berline Luxe (Mercedes E, BMW 5...) — 3 Pax" },
  { id: "LUXE", label: "LUXE", desc: "VIP & Protocole (Mercedes S, Porsche...) — 3 Pax" },
  { id: "PMR", label: "PMR", desc: "Véhicule Aménagé (Rampe Fauteuil Roulant) — 1+3 Pax" },
  { id: "VAN", label: "VAN", desc: "Minivan Familial (Vito, Transporter...) — 7/9 Pax" },
  { id: "4X4", label: "4x4", desc: "SUV / Tout-terrain (Land Cruiser, Prado...) — 4/6 Pax" },
  { id: "MINIBUS", label: "MINIBUS", desc: "Petit groupe (Toyota Coaster...) — 16/20 Pax" },
  { id: "AUTOCAR", label: "AUTOCAR", desc: "Groupe Moyen — 24/27 Pax" },
  { id: "BUS", label: "BUS", desc: "Grand Tourisme — 50+ Pax" },
];

const zones = [
  "National (Tout le pays)", "Tunis & Grand Tunis", "Sfax", "Sousse & Sahel",
  "Djerba & Médenine", "Hammamet & Nabeul", "Monastir", "Mahdia",
  "Kairouan", "Gafsa & Tozeur", "Tabarka & Aïn Draham", "Spécialisé Aéroports",
];

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-sm font-medium text-foreground mb-1.5 block">
    {children} {required && <span className="text-destructive">*</span>}
  </label>
);

const UploadField = ({ label, required, value, onChange }: { label: string; required?: boolean; value?: string; onChange?: (file: string) => void }) => {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <label className={`flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${value ? "border-primary bg-secondary" : "border-border hover:border-primary hover:bg-primary/5"}`}>
        <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => onChange?.(e.target.files?.[0]?.name || "")} />
        {value ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
        <span className={`text-sm ${value ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {value || "Cliquer pour uploader (PDF, JPG, PNG)"}
        </span>
      </label>
    </div>
  );
};

const FormTransport = ({ name, email, password, onBack }: Props) => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    raisonSociale: name,
    matriculeFiscal: "",
    nomGerant: "",
    adresseSiege: "",
    h24: "",
    emailOp: email,
    telephoneDispatch: "",
    rib: "",
  });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Documents KYC
  const [commerceRegister, setCommerceRegister] = useState("");
  const [patent, setPatent] = useState("");
  const [civilLiabilityInsurance, setCivilLiabilityInsurance] = useState("");

  // Validation: phone must be 8 digits for Tunisia
  const isPhoneValid = form.telephoneDispatch.length === 8 && /^\d{8}$/.test(form.telephoneDispatch);

  // Validation: IBAN max 20 characters
  const isIbanValid = form.rib.length > 0 && form.rib.length <= 20 && /^[A-Z0-9]+$/i.test(form.rib);

  const toggleVehicle = (id: string) =>
    setSelectedVehicles((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);

  const toggleZone = (z: string) => {
    const isNational = z === "National (Tout le pays)";
    if (isNational) {
      setSelectedZones((v) => v.includes(z) ? [] : [z]);
    } else {
      setSelectedZones((v) => {
        const without = v.filter((x) => x !== "National (Tout le pays)" && x !== z);
        return v.includes(z) ? without : [...without, z];
      });
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    // Real-time validation
    if (key === "telephoneDispatch") {
      const phone = e.target.value;
      if (phone.length > 8) {
        setErrors(prev => ({ ...prev, telephoneDispatch: "Le téléphone doit contenir exactement 8 chiffres" }));
      } else {
        setErrors(prev => ({ ...prev, telephoneDispatch: "" }));
      }
    }
    if (key === "rib") {
      const rib = e.target.value;
      if (rib.length > 20) {
        setErrors(prev => ({ ...prev, rib: "L'IBAN doit contenir maximum 20 caractères" }));
      } else if (rib.length > 0 && !/^[A-Z0-9]+$/i.test(rib)) {
        setErrors(prev => ({ ...prev, rib: "IBAN invalide (lettres et chiffres uniquement)" }));
      } else {
        setErrors(prev => ({ ...prev, rib: "" }));
      }
    }
  };

  const isValid =
    form.raisonSociale.trim().length > 1 &&
    form.matriculeFiscal.trim().length > 3 &&
    form.nomGerant.trim().length > 1 &&
    form.adresseSiege.trim().length > 3 &&
    form.h24 &&
    selectedVehicles.length > 0 &&
    selectedZones.length > 0 &&
    form.emailOp.trim().length > 3 &&
    isPhoneValid &&
    isIbanValid;

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    if (!isPhoneValid && form.telephoneDispatch.length > 0) {
      newErrors.telephoneDispatch = "Le téléphone doit contenir exactement 8 chiffres";
    }
    if (!isIbanValid && form.rib.length > 0) {
      newErrors.rib = "L'IBAN doit contenir maximum 20 caractères (lettres et chiffres)";
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
        fullName: form.raisonSociale,
        email: form.emailOp,
        phone: form.telephoneDispatch,
        password: password,
        role: "supplier",
        matriculeFiscal: form.matriculeFiscal,
        address: form.adresseSiege,
        responsibleName: form.nomGerant,
        responsibleEmail: form.emailOp,
        responsiblePhone: form.telephoneDispatch,
        is24_7: form.h24 === "Oui",
        rib: form.rib,
        operationalZones: JSON.stringify(selectedZones),
        vehicleTypes: JSON.stringify(selectedVehicles),
        commerceRegister: commerceRegister || undefined,
        patent: patent || undefined,
        civilLiabilityInsurance: civilLiabilityInsurance || undefined,
      });
      await refresh();
      setSuccess(true);
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Veuillez réessayer.";
      alert(`Erreur lors de l'inscription. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
          <Clock className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">✅ Votre compte a été créé avec succès</h2>
        <p className="text-muted-foreground mb-2">Merci pour votre inscription.</p>
        <div className="bg-muted/50 rounded-xl p-6 max-w-md mx-auto mt-4 border border-border">
          <p className="text-sm text-foreground font-medium mb-2">
            Notre équipe administrative doit vérifier vos informations.
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Veuillez patienter pendant la validation de votre compte.
          </p>
          <p className="text-sm text-primary font-medium">
            🔔 Vous recevrez une notification dès que votre compte sera approuvé.
          </p>
        </div>
        <Button
          onClick={() => {
            toast.success("Inscription réussie ! Bienvenue sur Yalla Transfer.");
            navigate("/dashboard", { state: { profile: "transport", name: form.raisonSociale, accountStatus: "pending", contractStatus: "pending" } });
          }}
          variant="outline"
          className="mt-6 gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
        >
          <ShieldCheck className="h-4 w-4" />
          Accéder à mon espace
        </Button>
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
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Société de Transport</h2>
          <p className="text-sm text-muted-foreground">Fournisseur Flotte — Enregistrement légal</p>
        </div>
      </div>
      <p className="text-muted-foreground mb-8 mt-2">Créez votre compte Master. Les véhicules seront ajoutés depuis votre dashboard après validation.</p>

      {/* Section A */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">A</span>
          <h3 className="font-semibold text-foreground">Identité Juridique</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Raison Sociale</FieldLabel>
            <Input value={form.raisonSociale} onChange={set("raisonSociale")} className="h-12 rounded-xl" />
          </div>
          <div>
            <FieldLabel required>Matricule Fiscal (MF)</FieldLabel>
            <Input value={form.matriculeFiscal} onChange={set("matriculeFiscal")} placeholder="1234567/A/M/000" className="h-12 rounded-xl" />
          </div>
        </div>

        <div>
          <FieldLabel required>Nom du Gérant / Représentant Légal</FieldLabel>
          <Input value={form.nomGerant} onChange={set("nomGerant")} placeholder="Nom et Prénom" className="h-12 rounded-xl" />
        </div>

        <div>
          <FieldLabel required>Adresse du Siège Social</FieldLabel>
          <Input value={form.adresseSiege} onChange={set("adresseSiege")} placeholder="Adresse complète" className="h-12 rounded-xl" />
        </div>

        <div>
          <FieldLabel required>Fonctionnez-vous 24/7 ?</FieldLabel>
          <div className="flex gap-4">
            {["Oui", "Non"].map((opt) => (
              <label key={opt} className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 cursor-pointer transition-colors ${form.h24 === opt ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                <input type="radio" name="h24" value={opt} checked={form.h24 === opt} onChange={set("h24")} className="hidden" />
                {form.h24 === opt && <CheckCircle2 className="h-4 w-4" />} {opt}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Permet le matching horaire avec les demandes clients</p>
        </div>
      </div>

      {/* Section B - Véhicules */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">B</span>
          <h3 className="font-semibold text-foreground">Capacité Opérationnelle</h3>
        </div>

        <div>
          <FieldLabel required>Types de Véhicules Exploités</FieldLabel>
          <p className="text-xs text-muted-foreground mb-3">Sélectionnez tous les types que vous opérez</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vehicleTypes.map(({ id, label, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleVehicle(id)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedVehicles.includes(id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selectedVehicles.includes(id) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                  {selectedVehicles.includes(id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel required>Zone de Transport Couverte</FieldLabel>
          <p className="text-xs text-muted-foreground mb-3">Sélectionnez les zones que vous desservez</p>
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => {
              const isNational = z === "National (Tout le pays)";
              const nationalSelected = selectedZones.includes("National (Tout le pays)");
              const isDisabled = !isNational && nationalSelected;
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => !isDisabled && toggleZone(z)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${selectedZones.includes(z) ? "border-primary bg-primary text-primary-foreground font-medium" : isDisabled ? "border-border/50 text-muted-foreground/50 cursor-not-allowed opacity-50" : "border-border hover:border-primary/50 text-foreground"}`}
                >
                  {z}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section C - Coordonnées & Finance */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">C</span>
          <h3 className="font-semibold text-foreground">Coordonnées & Finance</h3>
        </div>

        <div>
          <FieldLabel required>Email Opérationnel</FieldLabel>
          <Input type="email" value={form.emailOp} onChange={set("emailOp")} placeholder="dispatch@masociete.tn" className="h-12 rounded-xl" />
          <p className="text-xs text-muted-foreground mt-1">Pour recevoir les appels d'offres</p>
        </div>

        <div>
          <FieldLabel required>Téléphone Dispatching (24/7)</FieldLabel>
          <Input
            type="tel"
            value={form.telephoneDispatch}
            onChange={set("telephoneDispatch")}
            placeholder="XX XXX XXX (8 chiffres)"
            className={cn("h-12 rounded-xl", errors.telephoneDispatch && "border-destructive")}
          />
          {errors.telephoneDispatch && <p className="text-xs text-destructive mt-1">{errors.telephoneDispatch}</p>}
        </div>

        <div>
          <FieldLabel required>RIB Bancaire (IBAN) — Max 20 caractères</FieldLabel>
          <Input
            value={form.rib}
            onChange={set("rib")}
            placeholder="TN59 XXXX XXXX XXXX XXXX XXXX"
            className={cn("h-12 rounded-xl font-mono", errors.rib && "border-destructive")}
          />
          {errors.rib && <p className="text-xs text-destructive mt-1">{errors.rib}</p>}
          <p className="text-xs text-muted-foreground mt-1">Obligatoire pour le virement de vos gains</p>
        </div>
      </div>

      {/* Section D - KYC Documents */}
      <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5 mb-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">D</span>
          <h3 className="font-semibold text-foreground">Conformité KYC — Documents</h3>
        </div>
        <p className="text-sm text-muted-foreground">Ces documents sont requis pour la validation de votre compte fournisseur</p>
        <UploadField label="Registre de Commerce (RNE)" required value={commerceRegister} onChange={setCommerceRegister} />
        <UploadField label="Patente" required value={patent} onChange={setPatent} />
        <UploadField label="Assurance Responsabilité Civile Pro" required value={civilLiabilityInsurance} onChange={setCivilLiabilityInsurance} />

        <Button onClick={handleSubmit} disabled={!isValid} className="w-full h-12 text-base font-semibold shadow-button rounded-xl gap-2">
          Soumettre mon dossier
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FormTransport;
