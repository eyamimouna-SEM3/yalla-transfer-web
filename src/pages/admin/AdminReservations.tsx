import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Download, XCircle, Phone, Mail, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService, type AdminBooking } from "@/services/adminService";
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime";

const statuses = ["Tous", "Non assignée", "Confirmée", "En cours", "Terminée", "Annulée"] as const;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; filterLabel: string }> = {
  unassigned: { label: "Non assignée", variant: "secondary", filterLabel: "Non assignée" },
  pending: { label: "En attente", variant: "secondary", filterLabel: "Non assignée" },
  confirmed: { label: "Confirmée", variant: "default", filterLabel: "Confirmée" },
  in_progress: { label: "En cours", variant: "secondary", filterLabel: "En cours" },
  ongoing: { label: "En cours", variant: "secondary", filterLabel: "En cours" },
  completed: { label: "Terminée", variant: "outline", filterLabel: "Terminée" },
  cancelled: { label: "Annulée", variant: "destructive", filterLabel: "Annulée" },
};

const AdminReservations = () => {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les réservations depuis la DB
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getBookings();
      setBookings(data);
    } catch (error) {
      console.error("Erreur chargement réservations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Mise à jour temps réel via WebSocket — quand une réservation est créée
  // ou son statut change (depuis mobile, web ou backend), on re-fetch.
  useBookingsRealtime({
    onCreated: () => { void fetchBookings(); },
    onStatusChanged: (b) => {
      if (!b.id || !b.status) { void fetchBookings(); return; }
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: b.status as AdminBooking["status"] } : x));
    },
    onDriverAssigned: () => { void fetchBookings(); },
  });

  // Mapper les données de l'API vers le format attendu
  const reservations = bookings.map(b => ({
    id: b.id,
    client: b.client?.fullName || b.passengerName || "Client",
    clientType: "B2C",
    route: `${b.departure} → ${b.destination}`,
    date: b.departureAt ? new Date(b.departureAt).toISOString().slice(0, 10) : "",
    passengers: b.passengers,
    status: b.status === "pending" ? "unassigned" : b.status,
    price: `${b.totalPrice} TND`,
    supplier: b.handledBySupplier?.companyName || b.handledBySupplier?.fullName || null,
    refundable: b.status === "pending",
    cancelledBy: null,
  }));

  // Afficher le chargement
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const filtered = reservations
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
            <p className="text-sm text-muted-foreground">{reservations.length} réservations au total</p>
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
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Fonctionnalité en cours de développement</p>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReservations;
