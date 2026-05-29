import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, DollarSign, CreditCard, RotateCcw, FileText } from "lucide-react";

const mockTransactions = [
  { id: "TXN-2001", reservation: "R-1042", client: "Ahmed Ben Salah", amount: "85 TND", method: "Carte", status: "completed", type: "immediate", date: "01/03/2026" },
  { id: "TXN-2000", reservation: "R-1041", client: "StarTech Corp.", amount: "45 TND", method: "Virement", status: "pending", type: "deferred", date: "01/03/2026" },
  { id: "TXN-1999", reservation: "R-1040", client: "Marie Dupont", amount: "35 TND", method: "Carte", status: "completed", type: "immediate", date: "28/02/2026" },
  { id: "TXN-1998", reservation: "R-1039", client: "TransMed SA", amount: "220 TND", method: "Virement", status: "refunded", type: "immediate", date: "28/02/2026" },
  { id: "TXN-1997", reservation: "R-1038", client: "Karim Jaziri", amount: "95 TND", method: "Carte", status: "completed", type: "immediate", date: "27/02/2026" },
];

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Payé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  refunded: { label: "Remboursé", variant: "destructive" },
};

const AdminPayments = () => {
  const [search, setSearch] = useState("");
  const filtered = mockTransactions.filter((t) =>
    !search || t.client.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">Gestion des paiements et remboursements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" /> Export PDF</Button>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AdminStatCard icon={DollarSign} label="Total encaissé" value="14 500 TND" trend="+29.5%" sub="vs mois dernier" />
        <AdminStatCard icon={CreditCard} label="Transactions" value={mockTransactions.length} sub="ce mois" />
        <AdminStatCard icon={RotateCcw} label="Remboursements" value="220 TND" trend="1" trendUp={false} sub="ce mois" />
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Réservation</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{t.reservation}</TableCell>
                <TableCell className="font-medium">{t.client}</TableCell>
                <TableCell className="font-semibold">{t.amount}</TableCell>
                <TableCell className="text-sm">{t.method}</TableCell>
                <TableCell><Badge variant="outline">{t.type === "immediate" ? "Immédiat" : "Différé"}</Badge></TableCell>
                <TableCell><Badge variant={statusStyles[t.status].variant}>{statusStyles[t.status].label}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
