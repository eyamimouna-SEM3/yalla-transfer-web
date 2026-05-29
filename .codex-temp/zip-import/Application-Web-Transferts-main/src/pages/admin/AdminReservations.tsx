import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Download, XCircle, Phone, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statuses = ["Tous", "Non assignée", "Confirmée", "En cours", "Terminée", "Annulée"] as const;

const mockReservations = [
  { id: "R-1042", client: "Ahmed Ben Salah", clientType: "B2C", route: "Aéroport Tunis → Hammamet", date: "01/03/2026 15:00", passengers: 3, status: "unassigned", price: "85 TND", supplier: null, refundable: true, cancelledBy: null },
  { id: "R-1043", client: "Nour Saidi", clientType: "B2C", route: "Sousse → Aéroport Enfidha", date: "02/03/2026 08:00", passengers: 2, status: "unassigned", price: "60 TND", supplier: null, refundable: true, cancelledBy: null },
  { id: "R-1041", client: "StarTech Corp.", clientType: "Corporate", route: "Hôtel Laico → Aéroport", date: "01/03/2026 10:30", passengers: 1, status: "in_progress", price: "45 TND", supplier: "TransMed SA", refundable: false, cancelledBy: null },
  { id: "R-1040", client: "Marie Dupont", clientType: "B2C", route: "Sidi Bou Saïd → Tunis Centre", date: "28/02/2026 14:00", passengers: 2, status: "completed", price: "35 TND", supplier: "Rapide Transfer", refundable: false, cancelledBy: null },
  { id: "R-1039", client: "TransMed SA", clientType: "Corporate", route: "Port La Goulette → Sousse", date: "28/02/2026 08:00", passengers: 5, status: "cancelled", price: "220 TND", supplier: "Karim Jaziri", refundable: true, cancelledBy: "client" },
  { id: "R-1038", client: "Karim Jaziri", clientType: "B2C", route: "Monastir Aéroport → Mahdia", date: "27/02/2026 18:30", passengers: 4, status: "completed", price: "95 TND", supplier: "Slim Bouzid", refundable: false, cancelledBy: null },
  { id: "R-1037", client: "Nadia Trabelsi", clientType: "Corporate", route: "Tunis → Bizerte", date: "27/02/2026 09:00", passengers: 2, status: "confirmed", price: "120 TND", supplier: "TransMed SA", refundable: true, cancelledBy: null },
];

const mockSuppliers = [
  { name: "TransMed SA", type: "Société", phone: "+216 71 123 456", email: "contact@transmed.tn", vehicles: 12, rating: 4.8, available: true },
  { name: "Rapide Transfer", type: "Société", phone: "+216 71 789 012", email: "info@rapidetransfer.tn", vehicles: 8, rating: 4.5, available: true },
  { name: "Karim Jaziri", type: "Chauffeur indépendant", phone: "+216 98 111 222", email: "karim.j@email.com", vehicles: 1, rating: 4.9, available: true },
  { name: "Slim Bouzid", type: "Chauffeur indépendant", phone: "+216 98 333 444", email: "slim.b@email.com", vehicles: 1, rating: 4.6, available: false },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; filterLabel: string }> = {
  unassigned: { label: "Non assignée", variant: "secondary", filterLabel: "Non assignée" },
  confirmed: { label: "Confirmée", variant: "default", filterLabel: "Confirmée" },
  in_progress: { label: "En cours", variant: "secondary", filterLabel: "En cours" },
  completed: { label: "Terminée", variant: "outline", filterLabel: "Terminée" },
  cancelled: { label: "Annulée", variant: "destructive", filterLabel: "Annulée" },
};

const AdminReservations = () => {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = mockReservations
    .filter((r) => {
      if (filter !== "Tous") {
        const entry = Object.entries(statusMap).find(([, v]) => v.filterLabel === filter);
        if (entry && r.status !== entry[0]) return false;
      }
      if (search && !r.client.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.status === "unassigned" && b.status !== "unassigned") return -1;
      if (a.status !== "unassigned" && b.status === "unassigned") return 1;
      return 0;
    });

  return (
    <AdminLayout>
      <Tabs defaultValue="reservations">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Réservations</h1>
            <p className="text-sm text-muted-foreground">{mockReservations.length} réservations au total</p>
          </div>
          <TabsList>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="suppliers">Fournisseurs disponibles</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reservations">
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
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Itinéraire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Passagers</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Remboursement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className={r.status === "unassigned" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.client}</TableCell>
                    <TableCell className="text-sm">
                      {r.supplier ? (
                        <span className="text-foreground">{r.supplier}</span>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Non assignée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.route}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="text-center">{r.passengers}</TableCell>
                    <TableCell className="font-semibold text-sm">{r.price}</TableCell>
                    <TableCell><Badge variant={statusMap[r.status]?.variant}>{statusMap[r.status]?.label}</Badge></TableCell>
                    <TableCell>
                      {r.status === "cancelled" ? (
                        <Badge variant={r.refundable ? "default" : "outline"} className="text-[10px]">
                          {r.refundable ? "Remboursé" : "Non remboursable"}
                        </Badge>
                      ) : r.refundable ? (
                        <span className="text-[10px] text-muted-foreground">Remboursable</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                        {r.status !== "cancelled" && r.status !== "completed" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Annuler la réservation">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockSuppliers.map((s) => (
              <div key={s.name} className={`bg-card rounded-2xl border p-5 ${s.available ? "border-border" : "border-border opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.type} · {s.vehicles} véhicule(s) · ⭐ {s.rating}</p>
                  </div>
                  <Badge variant={s.available ? "default" : "secondary"}>
                    {s.available ? "Disponible" : "Indisponible"}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Phone className="h-3.5 w-3.5" /> {s.phone}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReservations;
