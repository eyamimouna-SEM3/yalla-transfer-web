import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Car, CheckCircle2, Upload, Camera, User, Clock, ShieldCheck } from "lucide-react";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  name: string;
  email: string;
  password: string;
  onBack: () => void;
}

const languages = ["Français", "Anglais", "Arabe", "Allemand", "Espagnol", "Italien", "Russe", "Chinois"];
const vehicleCapacities = ["3 places", "4 places", "7 places", "9 places"];
const cities = [
  "Tunis", "Ariana", "Ben Arous", "La Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine",
  "Tataouine", "Gafsa", "Tozeur", "Kébili", "Djerba"
];

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="text-sm font-medium text-foreground mb-1.5 block">
    {children} {required && <span className="text-destructive">*</span>}
  </label>
);

const UploadField = ({ label, required, hint, value, onChange }: { label: string; required?: boolean; hint?: string; value?: string; onChange?: (file: string) => void }) => {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      <label className={`flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${value ? "border-primary bg-secondary" : "border-border hover:border-primary hover:bg-primary/5"}`}>
        <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => onChange?.(e.target.files?.[0]?.name || "")} />
        {value ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
        <span className={`text-sm truncate ${value ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {value || "Cliquer pour uploader (PDF, JPG, PNG)"}
        </span>
      </label>
    </div>
  );
};

const RectoVersoUpload = ({ label, required, rectoValue, versoValue, onRectoChange, onVersoChange }: { label: string; required?: boolean; rectoValue?: string; versoValue?: string; onRectoChange?: (file: string) => void; onVersoChange?: (file: string) => void }) => {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="grid grid-cols-2 gap-3 mt-1.5">
        <label className={`flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${rectoValue ? "border-primary bg-secondary" : "border-border hover:border-primary hover:bg-primary/5"}`}>
          <input type="file" accept=".jpg,.png,.pdf" className="hidden" onChange={(e) => onRectoChange?.(e.target.files?.[0]?.name || "")} />
          {rectoValue ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className={`text-sm truncate ${rectoValue ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {rectoValue ? "Recto ✔" : "📄 Recto"}
          </span>
        </label>
        <label className={`flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${versoValue ? "border-primary bg-secondary" : "border-border hover:border-primary hover:bg-primary/5"}`}>
          <input type="file" accept=".jpg,.png,.pdf" className="hidden" onChange={(e) => onVersoChange?.(e.target.files?.[0]?.name || "")} />
          {versoValue ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
          <span className={`text-sm truncate ${versoValue ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {versoValue ? "Verso ✔" : "📄 Verso"}
          </span>
        </label>
      </div>
    </div>
  );
};

const VehiclePhotoField = ({ label, value, onChange }: { label: string; value?: string; onChange?: (file: string) => void }) => {
  return (
    <label className={`flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center ${value ? "border-primary bg-secondary" : "border-border hover:border-primary hover:bg-primary/5"}`}>
      <input type="file" accept=".jpg,.png,.webp" className="hidden" onChange={(e) => onChange?.(e.target.files?.[0]?.name || "")} />
      {value ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
      <span className={`text-xs font-medium ${value ? "text-primary" : "text-muted-foreground"}`}>{value ? "Photo ajoutée ✔" : label}</span>
    </label>
  );
};

const steps = ["Le Chauffeur", "Le Véhicule", "Conformité Légale"];

const FormChauffeur = ({ name, email, password, onBack }: Props) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [h24, setH24] = useState("");
  const [experience, setExperience] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [chauffeur, setChauffeur] = useState({
    nom: name,
    phone: "",
    city: "",
    numPermis: "",
    numCartePro: "",
  });

  const [vehicle, setVehicle] = useState({
    marque: "",
    modele: "",
    immat: "",
    annee: "",
    couleur: "",
    capacity: "",
    grandesValises: "",
    petitesValises: "",
  });

  const [insurance, setInsurance] = useState({
    numero: "",
    dateObtention: "",
    dateExpiration: "",
  });

  // Documents
  const [driverLicenseFront, setDriverLicenseFront] = useState("");
  const [driverLicenseBack, setDriverLicenseBack] = useState("");
  const [vehicleRegistrationFront, setVehicleRegistrationFront] = useState("");
  const [vehicleRegistrationBack, setVehicleRegistrationBack] = useState("");
  const [insuranceDocument, setInsuranceDocument] = useState("");
  const [patentDocument, setPatentDocument] = useState("");

  // Vehicle photos
  const [vehiclePhotoFront, setVehiclePhotoFront] = useState("");
  const [vehiclePhotoBack, setVehiclePhotoBack] = useState("");
  const [vehiclePhotoInterior, setVehiclePhotoInterior] = useState("");

  // Avatar (photo de profil)
  const [avatarUrl, setAvatarUrl] = useState("");

  const setCh = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setChauffeur((f) => ({ ...f, [key]: e.target.value }));
    // Real-time validation for phone - show error only after 8 digits
    if (key === "phone") {
      const phone = e.target.value;
      if (phone.length > 8) {
        setErrors(prev => ({ ...prev, phone: "Le téléphone doit contenir exactement 8 chiffres" }));
      } else {
        setErrors(prev => ({ ...prev, phone: "" }));
      }
    }
  };

  const setVeh = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setVehicle((f) => ({ ...f, [key]: e.target.value }));

  const setIns = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInsurance((f) => ({ ...f, [key]: e.target.value }));

  const toggleLang = (l: string) =>
    setSelectedLangs((v) => v.includes(l) ? v.filter((x) => x !== l) : [...v, l]);

  // Validation: phone must be exactly 8 digits for Tunisia
  const isPhoneValid = chauffeur.phone.length === 8 && /^\d{8}$/.test(chauffeur.phone);

  const canGoStep1 = chauffeur.nom.trim().length > 1 && isPhoneValid && chauffeur.city && selectedLangs.length > 0 && chauffeur.numPermis.trim().length > 3 && chauffeur.numCartePro.trim().length > 3;
  const canGoStep2 = vehicle.marque && vehicle.modele && vehicle.immat && vehicle.annee && vehicle.couleur && vehicle.capacity && vehicle.grandesValises && vehicle.petitesValises;
  const canSubmit = h24 && experience;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authService.register({
        fullName: chauffeur.nom,
        email: email,
        phone: chauffeur.phone,
        password: password,
        role: "driver_independent",
        avatarUrl: avatarUrl || undefined,
        city: chauffeur.city,
        permitNumber: chauffeur.numPermis,
        professionalCardNumber: chauffeur.numCartePro,
        languages: JSON.stringify(selectedLangs),
        experienceYears: experience,
        is24_7: h24 === "Oui",
        driverLicenseFront: driverLicenseFront || undefined,
        driverLicenseBack: driverLicenseBack || undefined,
        vehicleRegistrationFront: vehicleRegistrationFront || undefined,
        vehicleRegistrationBack: vehicleRegistrationBack || undefined,
        insuranceDocument: insuranceDocument || undefined,
        insuranceNumber: insurance.numero || undefined,
        insuranceDateObtained: insurance.dateObtention || undefined,
        insuranceDateExpiration: insurance.dateExpiration || undefined,
        patentDocument: patentDocument || undefined,
        vehicleBrand: vehicle.marque,
        vehicleModel: vehicle.modele,
        vehicleRegistration: vehicle.immat,
        vehicleYear: vehicle.annee ? parseInt(vehicle.annee) : undefined,
        vehicleColor: vehicle.couleur,
        vehicleCapacity: vehicle.capacity ? parseInt(vehicle.capacity.split(" ")[0]) : undefined,
        vehicleLuggageLarge: vehicle.grandesValises ? parseInt(vehicle.grandesValises) : undefined,
        vehicleLuggageSmall: vehicle.petitesValises ? parseInt(vehicle.petitesValises) : undefined,
        vehiclePhotoFront: vehiclePhotoFront || undefined,
        vehiclePhotoBack: vehiclePhotoBack || undefined,
        vehiclePhotoInterior: vehiclePhotoInterior || undefined,
      });
      setSuccess(true);
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
            navigate("/dashboard", { state: { profile: "chauffeur", name: chauffeur.nom, accountStatus: "active", contractStatus: "validated" } });
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
          <Car className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Chauffeur Indépendant</h2>
          <p className="text-sm text-muted-foreground">Profil Marketplace — Taxi Touristique</p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-2 mb-8 mt-4">
        {steps.map((s, i) => (
          <div key={s} className={`flex-1 py-2 px-3 rounded-xl border-2 text-center text-xs font-semibold transition-all ${i === step ? "border-primary bg-primary/5 text-primary" : i < step ? "border-green-400 bg-green-50 text-green-700" : "border-border text-muted-foreground"}`}>
            {i < step ? "✔" : i + 1}. {s}
          </div>
        ))}
      </div>

      {/* Step 1: Chauffeur */}
      {step === 0 && (
        <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Étape 1 — Le Chauffeur</h3>
          </div>

          {/* Profile photo */}
          <div>
            <FieldLabel required>Photo de Profil (Selfie Pro)</FieldLabel>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className={`w-20 h-20 rounded-full border-2 border-dashed ${avatarUrl ? "border-primary bg-secondary" : "border-border hover:border-primary"} bg-muted flex flex-col items-center justify-center transition-colors`}>
                {avatarUrl ? <CheckCircle2 className="h-8 w-8 text-primary" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
                <span className={`text-xs text-center mt-1 ${avatarUrl ? "text-primary" : "text-muted-foreground"}`}>{avatarUrl ? "Ajoutée" : "Photo"}</span>
              </div>
              <input type="file" accept=".jpg,.png" className="hidden" onChange={(e) => setAvatarUrl(e.target.files?.[0]?.name || "")} />
              <div>
                <p className="text-sm font-medium text-foreground">Ajouter une photo professionnelle</p>
                <p className="text-xs text-muted-foreground">Obligatoire pour l'affichage client — JPG, PNG</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Nom & Prénom</FieldLabel>
              <Input value={chauffeur.nom} onChange={setCh("nom")} className="h-12 rounded-xl" />
            </div>
            <div>
              <FieldLabel required>Numéro de Téléphone</FieldLabel>
              <Input
                type="tel"
                value={chauffeur.phone}
                onChange={(e) => { setCh("phone")(e); setErrors(prev => ({ ...prev, phone: "" })); }}
                placeholder="XX XXX XXX (8 chiffres)"
                className={cn("h-12 rounded-xl", errors.phone && "border-destructive")}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <FieldLabel required>Ville de Rattachement (Base opérationnelle)</FieldLabel>
            <select value={chauffeur.city} onChange={setCh("city")} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Sélectionner votre ville...</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>N° Permis de Conduire</FieldLabel>
              <Input value={chauffeur.numPermis} onChange={setCh("numPermis")} placeholder="Ex: 12345678" className="h-12 rounded-xl" />
            </div>
            <div>
              <FieldLabel required>N° Carte Professionnelle</FieldLabel>
              <Input value={chauffeur.numCartePro} onChange={setCh("numCartePro")} placeholder="Ex: CP-XXXXXX" className="h-12 rounded-xl" />
            </div>
          </div>

          <div>
            <FieldLabel required>Langues Parlées</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button key={l} type="button" onClick={() => toggleLang(l)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${selectedLangs.includes(l) ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border hover:border-primary/50"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => setStep(1)} disabled={!canGoStep1} className="w-full h-12 text-base font-semibold shadow-button rounded-xl gap-2">
            Étape suivante : Le Véhicule <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Vehicle */}
      {step === 1 && (
        <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Étape 2 — Le Véhicule</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Marque</FieldLabel>
              <Input value={vehicle.marque} onChange={setVeh("marque")} placeholder="Ex: Mercedes, Toyota..." className="h-12 rounded-xl" />
            </div>
            <div>
              <FieldLabel required>Modèle</FieldLabel>
              <Input value={vehicle.modele} onChange={setVeh("modele")} placeholder="Ex: Vito, Land Cruiser..." className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Immatriculation (Plaque)</FieldLabel>
              <Input value={vehicle.immat} onChange={setVeh("immat")} placeholder="Ex: 123 TUN 456" className="h-12 rounded-xl font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Masquée au public — requise pour l'Ordre de Mission</p>
            </div>
            <div>
              <FieldLabel required>Année de mise en circulation</FieldLabel>
              <Input type="number" value={vehicle.annee} onChange={setVeh("annee")} placeholder="Ex: 2020" min="2005" max="2025" className="h-12 rounded-xl" />
            </div>
          </div>

          <div>
            <FieldLabel required>Couleur</FieldLabel>
            <Input value={vehicle.couleur} onChange={setVeh("couleur")} placeholder="Ex: Noir, Blanc, Argent..." className="h-12 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Capacité Passagers</FieldLabel>
              <select value={vehicle.capacity} onChange={setVeh("capacity")} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Sélectionner...</option>
                {vehicleCapacities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>Capacité Bagages</FieldLabel>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Grandes valises</label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={vehicle.grandesValises}
                    onChange={setVeh("grandesValises")}
                    placeholder="Nombre"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Petites valises</label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={vehicle.petitesValises}
                    onChange={setVeh("petitesValises")}
                    placeholder="Nombre"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle photos */}
          <div>
            <FieldLabel required>Photos du Véhicule</FieldLabel>
            <p className="text-xs text-muted-foreground mb-3">3 photos obligatoires pour rassurer le client</p>
            <div className="grid grid-cols-3 gap-3">
              <VehiclePhotoField label="📸 Avant" value={vehiclePhotoFront} onChange={setVehiclePhotoFront} />
              <VehiclePhotoField label="📸 Arrière" value={vehiclePhotoBack} onChange={setVehiclePhotoBack} />
              <VehiclePhotoField label="📸 Intérieur" value={vehiclePhotoInterior} onChange={setVehiclePhotoInterior} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="h-12 px-6 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button onClick={() => setStep(2)} disabled={!canGoStep2} className="flex-1 h-12 text-base font-semibold shadow-button rounded-xl gap-2">
              Étape suivante : Conformité <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 2 && (
        <div className="bg-background rounded-2xl border border-border p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Étape 3 — Conformité Légale</h3>
          </div>
          <p className="text-sm text-muted-foreground">Documents requis pour validation et affichage sur la marketplace</p>

          {/* Permis - Recto/Verso */}
          <RectoVersoUpload label="Permis de Conduire" required rectoValue={driverLicenseFront} versoValue={driverLicenseBack} onRectoChange={setDriverLicenseFront} onVersoChange={setDriverLicenseBack} />

          {/* Carte Grise - Recto/Verso */}
          <RectoVersoUpload label="Carte Grise" required rectoValue={vehicleRegistrationFront} versoValue={vehicleRegistrationBack} onRectoChange={setVehicleRegistrationFront} onVersoChange={setVehicleRegistrationBack} />

          {/* Attestation d'assurance with extra fields */}
          <div className="space-y-3">
            <UploadField label='Attestation d&apos;Assurance "Transport de Personnes"' required value={insuranceDocument} onChange={setInsuranceDocument} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-2 border-l-2 border-primary/20">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">N° d'assurance</label>
                <Input value={insurance.numero} onChange={setIns("numero")} placeholder="Ex: ASS-XXXXXX" className="h-10 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date d'obtention</label>
                <Input type="date" value={insurance.dateObtention} onChange={setIns("dateObtention")} className="h-10 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date d'expiration</label>
                <Input type="date" value={insurance.dateExpiration} onChange={setIns("dateExpiration")} className="h-10 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <UploadField label="Patente / Carte Professionnelle" required value={patentDocument} onChange={setPatentDocument} />

          {/* 24/7 */}
          <div>
            <FieldLabel required>Fonctionnez-vous 24/7 ?</FieldLabel>
            <div className="flex gap-4">
              {["Oui", "Non"].map((opt) => (
                <label key={opt} className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border-2 cursor-pointer transition-colors ${h24 === opt ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                  <input type="radio" name="h24" value={opt} checked={h24 === opt} onChange={(e) => setH24(e.target.value)} className="hidden" />
                  {h24 === opt && <CheckCircle2 className="h-4 w-4" />} {opt}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Permet le matching horaire avec les demandes clients</p>
          </div>

          {/* Experience */}
          <div>
            <FieldLabel required>Expérience en transport touristique ?</FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              {["0–2 ans", "2–5 ans", "5+ ans"].map((opt) => (
                <label key={opt} className={`flex items-center justify-center h-12 rounded-xl border-2 cursor-pointer text-sm transition-all ${experience === opt ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary/50"}`}>
                  <input type="radio" name="exp" value={opt} checked={experience === opt} onChange={(e) => setExperience(e.target.value)} className="hidden" />
                  {opt}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Permet de rassurer les clients sur votre profil</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="h-12 px-6 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 h-12 text-base font-semibold shadow-button rounded-xl gap-2">
              Soumettre mon dossier <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormChauffeur;
