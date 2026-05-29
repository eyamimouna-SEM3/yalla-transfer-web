import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Plus, AlertCircle, Loader2, Trash2, Pencil,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supplierService, type SupplierFleetDriver, type DriverInput } from "@/services/supplierService";
import { validators, validateAll } from "@/utils/validators";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState<SupplierFleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierFleetDriver | null>(null);

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
    validated: drivers.filter((d) => d.driverValidated).length,
  }), [drivers]);

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

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={counts.total} color="text-foreground" />
        <StatCard label="En ligne" value={counts.online} color="text-green-600" />
        <StatCard label="Validés" value={counts.validated} color="text-primary" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {drivers.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucun chauffeur dans la flotte. Ajoute ton premier chauffeur.
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
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs">En ligne</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm font-medium">{d.fullName}</TableCell>
                    <TableCell className="text-xs font-mono">{d.phone}</TableCell>
                    <TableCell className="text-xs">{d.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">{d.licenseNumber ?? "—"}</TableCell>
                    <TableCell>
                      {d.driverValidated ? (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30" variant="outline">Validé</Badge>
                      ) : (
                        <Badge className="text-[10px]" variant="secondary">En attente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.driverOnline ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>En ligne
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Hors ligne</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier" onClick={() => { setEditing(d); setOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
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
  const [vehicleType, setVehicleType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? "");
      setPhone(initial?.phone ?? "");
      setEmail(initial?.email ?? "");
      setLicenseNumber(initial?.licenseNumber ?? "");
      setVehicleType(initial?.vehicleType ?? "");
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
        vehicleType: vehicleType.trim() || undefined,
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
          <FieldInput label="Type véhicule conduit" value={vehicleType} onChange={setVehicleType} placeholder="sedan, van, …" />
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
