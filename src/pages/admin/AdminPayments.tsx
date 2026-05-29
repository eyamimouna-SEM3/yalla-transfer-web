import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, DollarSign, CreditCard, RotateCcw, FileText, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminService, type AdminPayment } from "@/services/adminService";

type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

const statusStyles: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Payé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  refunded: { label: "Remboursé", variant: "destructive" },
  failed: { label: "Échec", variant: "destructive" },
};

const methodLabels: Record<string, string> = {
  wallet: "Wallet",
  "tn-card": "Carte nationale",
  card: "Carte",
  edinar: "E-Dinar",
  cash: "Espèces",
  bank: "Virement",
};

const StatusEditor = ({ value, onChange, disabled }: { value: PaymentStatus; onChange: (v: PaymentStatus) => void; disabled?: boolean }) => (
  <Select value={value} onValueChange={(v) => onChange(v as PaymentStatus)} disabled={disabled}>
    <SelectTrigger className="h-8 w-[130px] text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="paid">Payé</SelectItem>
      <SelectItem value="pending">En attente</SelectItem>
      <SelectItem value="refunded">Remboursé</SelectItem>
      <SelectItem value="failed">Échec</SelectItem>
    </SelectContent>
  </Select>
);

const exportCSV = (rows: AdminPayment[]) => {
  const header = ["ID", "Booking", "Trajet", "Méthode", "Montant", "Statut", "Date"];
  const lines = rows.map((p) => [
    p.id,
    p.booking?.code ?? p.bookingId,
    `${p.booking?.departure ?? ""} -> ${p.booking?.destination ?? ""}`,
    methodLabels[p.method] ?? p.method,
    p.amount,
    p.status,
    new Date(p.createdAt).toLocaleString("fr-FR"),
  ]);
  const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paiements-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const AdminPayments = () => {
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminService.getPayments();
        if (!cancelled) setPayments(data);
      } catch (e) {
        const err = e as { message?: string; status?: number };
        if (!cancelled) {
          setError(err.status === 401 || err.status === 403
            ? "Accès réservé aux administrateurs."
            : err.message ?? "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => payments.filter((p) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(s) ||
        p.bookingId.toLowerCase().includes(s) ||
        (p.booking?.code ?? "").toLowerCase().includes(s) ||
        (p.booking?.departure ?? "").toLowerCase().includes(s) ||
        (p.booking?.destination ?? "").toLowerCase().includes(s)
      );
    }),
    [payments, search],
  );

  // Statistiques agrégées sur les données réelles.
  const stats = useMemo(() => {
    const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
    const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    const totalRefunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount), 0);
    return { totalPaid, totalPending, totalRefunded, count: payments.length };
  }, [payments]);

  const updateStatus = async (id: string, status: PaymentStatus) => {
    const previous = payments;
    // Optimistic update
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    try {
      await adminService.updatePayment(id, { status });
      toast({ title: "Statut mis à jour", description: `Paiement ${id.slice(0, 8)} → ${statusStyles[status].label}` });
    } catch (e) {
      setPayments(previous);
      const err = e as { message?: string };
      toast({ title: "Erreur", description: err.message ?? "Mise à jour impossible.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Erreur</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des paiements — {stats.count} transaction{stats.count > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => exportCSV(filtered)}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <FileText className="h-4 w-4" /> Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AdminStatCard icon={DollarSign} label="Encaissé" value={`${stats.totalPaid.toLocaleString("fr-FR")} TND`} sub="paiements confirmés" />
        <AdminStatCard icon={CreditCard} label="En attente" value={`${stats.totalPending.toLocaleString("fr-FR")} TND`} sub="à confirmer" />
        <AdminStatCard icon={RotateCcw} label="Remboursé" value={`${stats.totalRefunded.toLocaleString("fr-FR")} TND`} sub="ce mois" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ID, code, trajet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucune transaction à afficher.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Réservation</TableHead>
                  <TableHead className="text-xs">Trajet</TableHead>
                  <TableHead className="text-xs">Méthode</TableHead>
                  <TableHead className="text-xs">Montant</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const status = (p.status as PaymentStatus) ?? "pending";
                  const s = statusStyles[status] ?? statusStyles.pending;
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-xs font-medium">{p.booking?.code ?? p.bookingId.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate">
                        {p.booking ? `${p.booking.departure} → ${p.booking.destination}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{methodLabels[p.method] ?? p.method}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-primary">
                        {Number(p.amount).toLocaleString("fr-FR")} {p.currency ?? "TND"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>
                          <StatusEditor value={status} onChange={(v) => updateStatus(p.id, v)} />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
