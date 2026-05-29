import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, RotateCcw, Download, XCircle } from "lucide-react";

const statuses = ["Tous", "Confirmée", "En cours", "Terminée", "Annulée"] as const;

const mockReservations = [
  { id: "R-1042", client: "Ahmed Ben Salah", clientType: "B2C", route: "Aéroport Tunis → Hammamet", date: "01/03/2026 15:00", passengers: 3, status: "confirmed", price: "85 TND" },
  { id: "R-1041", client: "StarTech Corp.", clientType: "Corporate", route: "Hôtel Laico → Aéroport", date: "01/03/2026 10:30", passengers: 1, status: "in_progress", price: "45 TND" },
  { id: "R-1040", client: "Marie Dupont", clientType: "B2C", route: "Sidi Bou Saïd → Tunis Centre", date: "28/02/2026 14:00", passengers: 2, status: "completed", price: "35 TND" },
  { id: "R-1039", client: "TransMed SA", clientType: "Corporate", route: "Port La Goulette → Sousse", date: "28/02/2026 08:00", passengers: 5, status: "cancelled", price: "220 TND" },
  { id: "R-1038", client: "Karim Jaziri", clientType: "B2C", route: "Monastir Aéroport → Mahdia", date: "27/02/2026 18:30", passengers: 4, status: "completed", price: "95 TND" },
  { id: "R-1037", client: "Nadia Trabelsi", clientType: "Corporate", route: "Tunis → Bizerte", date: "27/02/2026 09:00", passengers: 2, status: "completed", price: "120 TND" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; filterLabel: string }> = {
  confirmed: { label: "Confirmée", variant: "default", filterLabel: "Confirmée" },
  in_progress: { label: "En cours", variant: "secondary", filterLabel: "En cours" },
  completed: { label: "Terminée", variant: "outline", filterLabel: "Terminée" },
  cancelled: { label: "Annulée", variant: "destructive", filterLabel: "Annulée" },
};

const AdminReservations = () => {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = mockReservations.filter((r) => {
    if (filter !== "Tous") {
      const entry = Object.entries(statusMap).find(([, v]) => v.filterLabel === filter);
      if (entry && r.status !== entry[0]) return false;
    }
    if (search && !r.client.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Réservations</h1>
          <p className="text-sm text-muted-foreground">{mockReservations.length} réservations au total</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Créer une réservation</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher par ID ou client..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"}`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Itinéraire</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Passagers</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-medium">{r.client}</TableCell>
                <TableCell><Badge variant="outline">{r.clientType}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.route}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                <TableCell className="text-center">{r.passengers}</TableCell>
                <TableCell className="font-semibold text-sm">{r.price}</TableCell>
                <TableCell><Badge variant={statusMap[r.status].variant}>{statusMap[r.status].label}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCcw className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><XCircle className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;
