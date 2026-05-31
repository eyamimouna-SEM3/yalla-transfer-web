import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Plus, AlertCircle, Loader2, Trash2, Pencil, Car, Bus, Ban, ShieldCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supplierService, type SupplierFleetDriver, type DriverInput } from "@/services/supplierService";
import { validators, validateAll } from "@/utils/validators";

// Classification des permis de conduire :
// - license_b : permis B → autorise tous les véhicules légers (eco, sedan,
//   premium, luxe, van, 4×4 — jusqu'à 9 places, 3,5 t).
// - license_d : permis D → autorise les véhicules de transport en commun
//   (minibus dès 9 places, bus / autocars). Un chauffeur D peut aussi
//   conduire B en pratique mais on le classifie sur sa qualification la
//   plus élevée (le besoin métier ici est de savoir qui peut prendre un
//   minibus/bus).
//
// La valeur est persistée dans le champ libre User.vehicle_type du backend
// (pas de migration nécessaire). Si la valeur lue n'est pas reconnue, on la
// considère comme "license_b" par défaut (cas le plus fréquent).
export type LicenseCategory = "license_b" | "license_d";

const LICENSE_OPTIONS: { value: LicenseCategory; label: string; description: string; icon: typeof Car }[] = [
  {
    value: "license_b",
    label: "Permis B (voitures, vans, 4×4)",
    description: "Eco, Berline, Premium, Luxe, Van, 4×4",
    icon: Car,
  },
  {
    value: "license_d",
    label: "Permis D (minibus, bus)",
    description: "Minibus, Bus, Autocars",
    icon: Bus,
  },
];

const normalizeLicense = (raw: string | null | undefined): LicenseCategory => {
  if (!raw) return "license_b";
  const v = raw.trim().toLowerCase();
  if (v === "license_d" || v === "d" || v === "bus" || v === "minibus") return "license_d";
  return "license_b";
};

const licenseBadge = (raw: string | null | undefined) => {
  const cat = normalizeLicense(raw);
  if (cat === "license_d") {
    return (
      <Badge variant="outline" className="text-[10px] bg-accent/15 text-accent border-accent/30 gap-1">
        <Bus className="h-3 w-3" /> Permis D
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30 gap-1">
      <Car className="h-3 w-3" /> Permis B
    </Badge>
  );
};

const DriverManagement = () => {
  const [drivers, setDrivers] = useState<SupplierFleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierFleetDriver | null>(null);
  // Filtre par catégorie de permis : "all" / "license_b" / "license_d"
  const [licenseFilter, setLicenseFilter] = useState<"all" | LicenseCategory>("all");

  const fetchDrivers = async () => {
    try {
      setError(null);
      const data = await supplierService.fleetDrivers();
      setDrivers(data);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      if (err.status === 401 || err.status === 403) {
        setError("Accès réservé aux fournisseurs.");
      } else {
        setError(err.message ?? "Chargement impossible.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchDrivers(); }, []);

  const counts = useMemo(() => ({
    total: drivers.length,
    online: drivers.filter((d) => d.driverOnline).length,
    validated: drivers.filter((d) => d.driverValidated && d.accountStatus !== "suspended").length,
    banned: drivers.filter((d) => d.accountStatus === "suspended").length,
    licenseB: drivers.filter((d) => normalizeLicense(d.vehicleType) === "license_b").length,
    licenseD: drivers.filter((d) => normalizeLicense(d.vehicleType) === "license_d").length,
  }), [drivers]);

  const filteredDrivers = useMemo(() => {
    if (licenseFilter === "all") return drivers;
    return drivers.filter((d) => normalizeLicense(d.vehicleType) === licenseFilter);
  }, [drivers, licenseFilter]);

  const handleSave = async (data: DriverInput, id?: string) => {
    try {
      if (id) {
        const updated = await supplierService.updateDriver(id, data);
        setDrivers((prev) => prev.map((d) => d.id === id ? updated : d));
        toast({ title: "Chauffeur modifié", description: updated.fullName });
      } else {
        const created = await supplierService.createDriver(data);
        setDrivers((prev) => [created, ...prev]);
        if (created.generatedPassword) {
          toast({
            title: "Chauffeur créé",
            description: `Mot de passe généré : ${created.generatedPassword} — communique-le au chauffeur.`,
            duration: 15000,
          });
        } else {
          toast({ title: "Chauffeur créé", description: created.fullName });
        }
      }
      setOpen(false);
      setEditing(null);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      toast({
        title: id ? "Modification impossible" : "Création impossible",
        description: err.status === 409
          ? "Email ou téléphone déjà utilisé."
          : err.message ?? "Réessaie.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (d: SupplierFleetDriver) => {
    if (!confirm(`Retirer ${d.fullName} de la flotte ?`)) return;
    try {
      await supplierService.removeDriver(d.id);
      setDrivers((prev) => prev.filter((x) => x.id !== d.id));
      toast({ title: "Chauffeur retiré de la flotte" });
    } catch (e) {
      const err = e as { message?: string };
      toast({ title: "Retrait impossible", description: err.message ?? "Réessaie.", variant: "destructive" });
    }
  };

  /**
   * Bannit ou réactive un chauffeur. Le bannissement bloque immédiatement
   * sa connexion à l'app mobile (vérifié à chaque requête par le JwtGuard
   * côté backend) et le force hors-ligne.
   */
  const handleToggleBan = async (d: SupplierFleetDriver) => {
    const isBanned = d.accountStatus === "suspended";
    const action = isBanned ? "réactiver" : "bannir";
    const confirmMsg = isBanned
      ? `Réactiver ${d.fullName} ? Il pourra se reconnecter à l'app mobile et recevoir des courses.`
      : `Bannir ${d.fullName} ? Il sera immédiatement déconnecté de l'app mobile et ne pourra plus se reconnecter.`;
    if (!confirm(confirmMsg)) return;
    try {
      const updated = isBanned
        ? await supplierService.unbanDriver(d.id)
        : await supplierService.banDriver(d.id);
      setDrivers((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
      toast({
        title: isBanned ? "Chauffeur réactivé" : "Chauffeur banni",
        description: isBanned
          ? `${d.fullName} peut à nouveau se connecter.`
          : `${d.fullName} a été déconnecté de l'app mobile.`,
      });
    } catch (e) {
      const err = e as { message?: string };
      toast({
        title: `Impossible de ${action} le chauffeur`,
        description: err.message ?? "Réessaie.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">Erreur</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Gestion des chauffeurs
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enregistrez et gérez vos chauffeurs salariés.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4" /> Ajouter un chauffeur
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={counts.total} color="text-foreground" />
        <StatCard label="En ligne" value={counts.online} color="text-green-600" />
        <StatCard label="Validés" value={counts.validated} color="text-primary" />
        <StatCard label="Bannis" value={counts.banned} color="text-destructive" />
        <StatCard label="Permis B" value={counts.licenseB} color="text-primary" />
        <StatCard label="Permis D" value={counts.licenseD} color="text-accent" />
      </div>

      {/* Filtres catégorie de permis */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all" as const, label: "Tous", icon: null },
          { id: "license_b" as const, label: "Permis B (voitures, vans, 4×4)", icon: Car },
          { id: "license_d" as const, label: "Permis D (minibus, bus)", icon: Bus },
        ].map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setLicenseFilter(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                licenseFilter === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filteredDrivers.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {drivers.length === 0
              ? "Aucun chauffeur dans la flotte. Ajoute ton premier chauffeur."
              : "Aucun chauffeur dans cette catégorie de permis."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="text-xs">Téléphone</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">N° permis</TableHead>
                  <TableHead className="text-xs">Catégorie</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs">En ligne</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm font-medium">{d.fullName}</TableCell>
                    <TableCell className="text-xs font-mono">{d.phone}</TableCell>
                    <TableCell className="text-xs">{d.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">{d.licenseNumber ?? "—"}</TableCell>
                    <TableCell>{licenseBadge(d.vehicleType)}</TableCell>
                    <TableCell>
                      {d.accountStatus === "suspended" ? (
                        <Badge className="text-[10px] gap-1" variant="destructive">
                          <Ban className="h-3 w-3" /> Banni
                        </Badge>
                      ) : d.driverValidated ? (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30" variant="outline">Validé</Badge>
                      ) : (
                        <Badge className="text-[10px]" variant="secondary">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.accountStatus === "suspended" ? (
                        <span className="text-xs text-muted-foreground italic">Déconnecté</span>
                      ) : d.driverOnline ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>En ligne
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Hors ligne</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Modifier"
                          onClick={() => { setEditing(d); setOpen(true); }}
                          disabled={d.accountStatus === "suspended"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {d.accountStatus === "suspended" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:bg-green-500/10"
                            title="Réactiver l'accès à l'app mobile"
                            onClick={() => handleToggleBan(d)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-orange-600 hover:bg-orange-500/10"
                            title="Bannir (déconnexion immédiate de l'app mobile)"
                            onClick={() => handleToggleBan(d)}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Retirer de la flotte" onClick={() => handleRemove(d)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DriverFormDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-card rounded-2xl border border-border p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
  </div>
);

interface FormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: SupplierFleetDriver | null;
  onSave: (data: DriverInput, id?: string) => Promise<void>;
}

const DriverFormDialog = ({ open, onOpenChange, initial, onSave }: FormDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  // Catégorie de permis : license_b (voitures) ou license_d (minibus/bus).
  // Stockée dans le champ libre `vehicleType` côté backend.
  const [licenseCategory, setLicenseCategory] = useState<LicenseCategory>("license_b");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? "");
      setPhone(initial?.phone ?? "");
      setEmail(initial?.email ?? "");
      setLicenseNumber(initial?.licenseNumber ?? "");
      setLicenseCategory(normalizeLicense(initial?.vehicleType));
      setErrors({});
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAll({
      fullName: () => validators.fullName(fullName),
      phone: () => validators.phone(phone),
      ...(email ? { email: () => validators.email(email) } : {}),
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        // On persiste la valeur normalisée — c'est suffisant pour discriminer
        // qui peut conduire un minibus/bus.
        vehicleType: licenseCategory,
      }, initial?.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le chauffeur" : "Nouveau chauffeur"}</DialogTitle>
          <DialogDescription>
            {initial ? "Modifier les infos du chauffeur." : "Un mot de passe lui sera généré automatiquement."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldInput label="Nom complet *" value={fullName} onChange={setFullName} placeholder="Mohamed Ben Ali" error={errors.fullName} />
          <FieldInput label="Téléphone *" value={phone} onChange={setPhone} placeholder="+21622345678" error={errors.phone} />
          <FieldInput label="Email (optionnel)" value={email} onChange={setEmail} placeholder="chauffeur@example.com" type="email" error={errors.email} />
          <FieldInput label="N° permis" value={licenseNumber} onChange={setLicenseNumber} placeholder="P-123456" />
          <div>
            <Label className="text-xs">Catégorie de permis *</Label>
            <Select value={licenseCategory} onValueChange={(v) => setLicenseCategory(v as LicenseCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {LICENSE_OPTIONS.find((o) => o.value === licenseCategory)?.description}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Enregistrer" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FieldInput = ({ label, value, onChange, placeholder, type = "text", error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={error ? "border-destructive" : ""}
    />
    {error && (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> {error}
      </p>
    )}
  </div>
);

export default DriverManagement;
