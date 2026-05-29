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
  Car, Plus, CheckCircle2, Wrench, Power, PowerOff, Pencil, Trash2, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supplierService, type SupplierVehicle, type VehicleInput } from "@/services/supplierService";

const categories: { id: string; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "eco", label: "Eco" },
  { id: "sedan", label: "Berline" },
  { id: "premium", label: "Premium" },
  { id: "luxe", label: "Luxe" },
  { id: "van", label: "Van" },
  { id: "4x4", label: "4x4" },
  { id: "minibus", label: "Minibus" },
  { id: "bus", label: "Bus" },
  { id: "pmr", label: "PMR" },
];

const statusBadge = (s: string) => {
  const map: Record<string, { label: string; className: string }> = {
    available: { label: "Disponible", className: "bg-primary/15 text-primary border-primary/30" },
    on_mission: { label: "En mission", className: "bg-accent/15 text-accent border-accent/30" },
    maintenance: { label: "Maintenance", className: "bg-secondary/40 text-secondary-foreground border-border" },
    inactive: { label: "Désactivé", className: "bg-muted text-muted-foreground border-border" },
  };
  const m = map[s] ?? map.available;
  return <Badge variant="outline" className={`text-[10px] ${m.className}`}>{m.label}</Badge>;
};

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<SupplierVehicle[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierVehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      setError(null);
      const data = await supplierService.listVehicles();
      setVehicles(data);
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

  useEffect(() => { void fetchVehicles(); }, []);

  const filtered = useMemo(
    () => (filter === "all" ? vehicles : vehicles.filter((v) => v.category === filter)),
    [filter, vehicles],
  );

  const counts = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    on_mission: vehicles.filter((v) => v.status === "on_mission").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  }), [vehicles]);

  const handleSave = async (data: VehicleInput, id?: string) => {
    try {
      if (id) {
        const updated = await supplierService.updateVehicle(id, data);
        setVehicles((prev) => prev.map((v) => v.id === id ? updated : v));
        toast({ title: "Véhicule modifié", description: `${updated.brand} ${updated.model}` });
      } else {
        const created = await supplierService.createVehicle(data);
        setVehicles((prev) => [created, ...prev]);
        toast({ title: "Véhicule ajouté", description: `${created.brand} ${created.model} (${created.plate})` });
      }
      setOpen(false);
      setEditing(null);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      toast({
        title: id ? "Modification impossible" : "Ajout impossible",
        description: err.status === 409
          ? "Plaque déjà enregistrée par un autre véhicule."
          : err.message ?? "Réessaie.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (v: SupplierVehicle) => {
    if (!confirm(`Supprimer ${v.brand} ${v.model} (${v.plate}) ?`)) return;
    try {
      await supplierService.deleteVehicle(v.id);
      setVehicles((prev) => prev.filter((x) => x.id !== v.id));
      toast({ title: "Véhicule supprimé" });
    } catch (e) {
      const err = e as { message?: string };
      toast({ title: "Suppression impossible", description: err.message ?? "Réessaie.", variant: "destructive" });
    }
  };

  const toggleStatus = async (v: SupplierVehicle) => {
    const newStatus = v.status === "inactive" ? "available" : "inactive";
    try {
      const updated = await supplierService.updateVehicle(v.id, { status: newStatus });
      setVehicles((prev) => prev.map((x) => x.id === v.id ? updated : x));
    } catch (e) {
      const err = e as { message?: string };
      toast({ title: "Mise à jour impossible", description: err.message ?? "Réessaie.", variant: "destructive" });
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" /> Gestion des véhicules
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enregistrez, suivez et gérez l'ensemble de votre flotte.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4" /> Enregistrer un nouveau véhicule
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Car} label="Total" value={counts.total} bg="bg-foreground/10" iconColor="text-foreground" />
        <StatCard icon={CheckCircle2} label="Disponibles" value={counts.available} bg="bg-primary/15" iconColor="text-primary" />
        <StatCard icon={Car} label="En mission" value={counts.on_mission} bg="bg-accent/15" iconColor="text-accent" />
        <StatCard icon={Wrench} label="Maintenance" value={counts.maintenance} bg="bg-secondary" iconColor="text-secondary-foreground" />
      </div>

      {/* Filtres catégorie */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === cat.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {vehicles.length === 0 ? "Aucun véhicule. Ajoute ton premier véhicule." : "Aucun véhicule dans cette catégorie."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Plaque</TableHead>
                  <TableHead className="text-xs">Marque / Modèle</TableHead>
                  <TableHead className="text-xs">Catégorie</TableHead>
                  <TableHead className="text-xs">Capacité</TableHead>
                  <TableHead className="text-xs">Prix</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs font-medium">{v.plate}</TableCell>
                    <TableCell className="text-sm">{v.brand} {v.model}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{v.category}</Badge></TableCell>
                    <TableCell className="text-xs">{v.capacity} pax · {v.luggage} bag</TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      {v.basePrice != null ? `${v.basePrice} TND` : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(v.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Modifier" onClick={() => { setEditing(v); setOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title={v.status === "inactive" ? "Réactiver" : "Désactiver"} onClick={() => toggleStatus(v)}>
                          {v.status === "inactive" ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Supprimer" onClick={() => handleDelete(v)}>
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

      <VehicleFormDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, bg, iconColor }: { icon: typeof Car; label: string; value: number; bg: string; iconColor: string }) => (
  <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  </div>
);

interface FormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: SupplierVehicle | null;
  onSave: (data: VehicleInput, id?: string) => Promise<void>;
}

const VehicleFormDialog = ({ open, onOpenChange, initial, onSave }: FormDialogProps) => {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [category, setCategory] = useState("sedan");
  const [capacity, setCapacity] = useState("4");
  const [luggage, setLuggage] = useState("2");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState("available");
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setBrand(initial?.brand ?? "");
      setModel(initial?.model ?? "");
      setPlate(initial?.plate ?? "");
      setCategory(initial?.category ?? "sedan");
      setCapacity(String(initial?.capacity ?? 4));
      setLuggage(String(initial?.luggage ?? 2));
      setBasePrice(initial?.basePrice != null ? String(initial.basePrice) : "");
      setStatus(initial?.status ?? "available");
      setInsuranceNumber(initial?.insuranceNumber ?? "");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !plate.trim()) {
      toast({ title: "Champs requis", description: "Marque, modèle et plaque sont obligatoires.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        brand: brand.trim(),
        model: model.trim(),
        plate: plate.trim().toUpperCase(),
        category,
        capacity: parseInt(capacity, 10) || 4,
        luggage: parseInt(luggage, 10) || 2,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        status,
        insuranceNumber: insuranceNumber.trim() || null,
      }, initial?.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le véhicule" : "Nouveau véhicule"}</DialogTitle>
          <DialogDescription>Renseigne les caractéristiques du véhicule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Marque *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Mercedes" required />
            </div>
            <div>
              <Label className="text-xs">Modèle *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Classe E" required />
            </div>
          </div>
          <div>
            <Label className="text-xs">Plaque *</Label>
            <Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="123 TUN 4567" required className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.id !== "all").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="on_mission">En mission</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Désactivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Capacité pax</Label>
              <Input type="number" min={1} max={60} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Bagages</Label>
              <Input type="number" min={0} max={60} value={luggage} onChange={(e) => setLuggage(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Prix de base (TND)</Label>
              <Input type="number" min={0} step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="80" />
            </div>
          </div>
          <div>
            <Label className="text-xs">N° d'assurance (optionnel)</Label>
            <Input value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} placeholder="AS-123456" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleManagement;
