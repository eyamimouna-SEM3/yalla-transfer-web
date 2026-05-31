import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Eye,
  Download,
  XCircle,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  Users as UsersIcon,
  Briefcase,
  Car,
  CalendarDays,
  Clock,
  MapPin,
  Hash,
  Baby,
  Accessibility,
  RotateCw,
  CreditCard,
  Ticket,
  FileText,
  Building2,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "@/services/adminService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminService, type AdminBooking } from "@/services/adminService";
import { bookingService } from "@/services/bookingService";
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime";
import { useToast } from "@/hooks/use-toast";

const statuses = ["Tous", "En attente de confirmation", "Confirmée", "En cours", "Terminée", "Annulée"] as const;

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; filterLabel: string }> = {
  unassigned: { label: "En attente de confirmation", variant: "secondary", filterLabel: "En attente de confirmation" },
  pending: { label: "En attente de confirmation", variant: "secondary", filterLabel: "En attente de confirmation" },
  confirmed: { label: "Confirmée", variant: "default", filterLabel: "Confirmée" },
  assigned: { label: "Assignée", variant: "default", filterLabel: "Confirmée" },
  driver_en_route: { label: "Chauffeur en route", variant: "secondary", filterLabel: "En cours" },
  arrived: { label: "Arrivé", variant: "secondary", filterLabel: "En cours" },
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
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refundTarget, setRefundTarget] = useState<AdminBooking | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminBooking | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<AdminUser[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  const { toast } = useToast();

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
    raw: b, // on garde la référence complète pour les actions
    id: b.id,
    client: b.client?.fullName || b.passengerName || "Client",
    clientType: "B2C",
    route: `${b.departure} → ${b.destination}`,
    date: b.departureAt ? new Date(b.departureAt).toISOString().slice(0, 10) : "",
    passengers: b.passengers,
    status: b.status === "pending" ? "unassigned" : b.status,
    price: `${b.totalPrice} TND`,
    supplier: b.handledBySupplier?.companyName || b.handledBySupplier?.fullName || null,
    paymentStatus: b.payment?.status ?? null,
    paymentId: b.payment?.id ?? null,
    isCancelled: b.status === "cancelled",
    isRefunded: b.payment?.status === "refunded",
  }));

  const filtered = reservations
    .filter((r) => {
      if (filter !== "Tous") {
        // Un même filterLabel ("En cours", "Confirmée"…) couvre plusieurs
        // statuts backend (driver_en_route + arrived + in_progress + ongoing
        // pour "En cours" par ex.). On accepte donc tous les statuts dont
        // le filterLabel correspond — pas seulement le premier rencontré.
        const status = statusMap[r.status];
        if (!status || status.filterLabel !== filter) return false;
      }
      if (search && !r.client.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.status === "unassigned" && b.status !== "unassigned") return -1;
      if (a.status !== "unassigned" && b.status === "unassigned") return 1;
      return 0;
    });

  // ============ HANDLERS DES ACTIONS ============

  const handleView = (booking: AdminBooking) => {
    setSelectedBooking(booking);
  };

  const handleDownloadVoucher = async (booking: AdminBooking) => {
    setDownloadingId(booking.id);
    try {
      await bookingService.downloadVoucher(booking.id);
      toast({
        title: "Voucher téléchargé",
        description: `Voucher de la réservation ${booking.code ?? booking.id.slice(0, 8)} téléchargé avec succès.`,
      });
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Téléchargement impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelOpen = (booking: AdminBooking) => {
    setCancelTarget(booking);
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(cancelTarget.id, cancelReason);
      toast({
        title: "Réservation annulée",
        description: `La réservation ${cancelTarget.code ?? cancelTarget.id.slice(0, 8)} a été annulée. Le client a été notifié.`,
      });
      setCancelTarget(null);
      setCancelReason("");
      void fetchBookings();
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Annulation impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRefundOpen = (booking: AdminBooking) => {
    setRefundTarget(booking);
  };

  const handleRefundToggle = async (newStatus: "refunded" | "paid") => {
    if (!refundTarget?.payment?.id) {
      toast({
        title: "Aucun paiement associé",
        description: "Cette réservation n'a pas de paiement enregistré.",
        variant: "destructive",
      });
      setRefundTarget(null);
      return;
    }
    setRefundLoading(true);
    try {
      await adminService.updatePayment(refundTarget.payment.id, { status: newStatus });
      toast({
        title: newStatus === "refunded" ? "Marquée comme remboursée" : "Marquée comme non remboursée",
        description: `Statut du paiement mis à jour.`,
      });
      setRefundTarget(null);
      void fetchBookings();
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Mise à jour impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setRefundLoading(false);
    }
  };

  /* ===================== ASSIGNATION FOURNISSEUR ===================== */

  const handleAssignOpen = async (booking: AdminBooking) => {
    setAssignTarget(booking);
    setSelectedSupplierId("");
    // Charge la liste des fournisseurs actifs avec contrat validé.
    setSuppliersLoading(true);
    try {
      const allSuppliers = await adminService.getUsers({
        role: "supplier",
        status: "active",
      });
      const eligible = allSuppliers.filter(
        (s) => (s.contractStatus || "validated") === "validated",
      );
      setSuppliers(eligible);
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Chargement impossible",
        description: e?.message ?? "Impossible de charger les fournisseurs.",
        variant: "destructive",
      });
    } finally {
      setSuppliersLoading(false);
    }
  };

  const handleAssignConfirm = async () => {
    if (!assignTarget || !selectedSupplierId) return;
    setAssignLoading(true);
    try {
      // Si le booking est encore "pending" (= "Non assignée" côté UI)
      // on le passe aussi en "confirmed" pour que le workflow continue.
      const needsStatusBump = assignTarget.status === "pending";
      await adminService.updateBooking(assignTarget.id, {
        handledBySupplierId: selectedSupplierId,
        ...(needsStatusBump ? { status: "confirmed" } : {}),
      });
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      toast({
        title: "Réservation assignée",
        description: `${assignTarget.code ?? assignTarget.id.slice(0, 8)} a été attribuée à ${supplier?.companyName || supplier?.fullName || "un fournisseur"}.`,
      });
      setAssignTarget(null);
      setSelectedSupplierId("");
      void fetchBookings();
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Assignation impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  };

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

  return (
    <AdminLayout>
      <Tabs defaultValue="reservations">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Réservations</h1>
            <p className="text-sm text-muted-foreground">{reservations.length} réservations au total</p>
          </div>
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
                {filtered.map((r) => {
                  const canCancel = r.status !== "cancelled" && r.status !== "completed";
                  return (
                    <TableRow key={r.id} className={r.status === "unassigned" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}…</TableCell>
                      <TableCell className="font-medium">{r.client}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.route}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                      <TableCell className="text-center">{r.passengers}</TableCell>
                      <TableCell className="font-semibold text-sm">{r.price}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={statusMap[r.status]?.variant}>
                            {statusMap[r.status]?.label ?? r.status}
                          </Badge>
                          {/* Nom du fournisseur qui a accepté — affiché pour
                              tous les statuts post-acceptation (confirmée,
                              en cours, terminée, annulée). Caché tant que la
                              réservation est en attente. */}
                          {r.supplier && r.status !== "unassigned" && r.status !== "pending" && (
                            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" />
                              {r.supplier}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {r.isCancelled ? (
                          <button
                            onClick={() => handleRefundOpen(r.raw)}
                            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 rounded"
                            title="Cliquer pour changer le statut de remboursement"
                          >
                            <Badge
                              variant={r.isRefunded ? "default" : "outline"}
                              className={`text-[10px] cursor-pointer hover:opacity-80 ${
                                r.isRefunded
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                  : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {r.isRefunded ? "Remboursé" : "Non remboursé"}
                            </Badge>
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(r.raw)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* L'admin n'assigne PAS de fournisseur — ce sont les
                              sociétés de transport qui acceptent elles-mêmes
                              les réservations depuis leur dashboard. */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownloadVoucher(r.raw)}
                            disabled={downloadingId === r.id}
                            title="Télécharger le voucher PDF"
                          >
                            {downloadingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleCancelOpen(r.raw)}
                              title="Annuler la réservation"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* ============ DIALOG : DÉTAILS RÉSERVATION ============ */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              Détails de la réservation
              {selectedBooking && (
                <Badge variant={statusMap[selectedBooking.status]?.variant}>
                  {statusMap[selectedBooking.status]?.label ?? selectedBooking.status}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Code :{" "}
              <span className="font-mono font-semibold text-foreground">
                {selectedBooking?.code ?? selectedBooking?.id.slice(0, 8)}
              </span>
              {selectedBooking?.id && (
                <span className="text-xs text-muted-foreground ml-2">
                  (ID : {selectedBooking.id})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] px-6">
            {selectedBooking && (
              <div className="space-y-4 pb-4">
                {/* En-tête : prix + statut + tags */}
                <div className="rounded-xl border bg-card p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Prix total</p>
                    <p className="text-2xl font-bold text-primary">
                      {selectedBooking.totalPrice} TND
                    </p>
                    {(selectedBooking.vehiclesTotal != null ||
                      selectedBooking.optionsTotal != null) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Véhicules : {selectedBooking.vehiclesTotal ?? 0} TND
                        {" • "}
                        Options : {selectedBooking.optionsTotal ?? 0} TND
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooking.roundTrip && (
                      <Badge variant="secondary" className="gap-1">
                        <RotateCw className="h-3 w-3" /> Aller-retour
                      </Badge>
                    )}
                    {selectedBooking.babySeat && (
                      <Badge variant="secondary" className="gap-1">
                        <Baby className="h-3 w-3" /> Siège bébé
                      </Badge>
                    )}
                    {selectedBooking.pmr && (
                      <Badge variant="secondary" className="gap-1">
                        <Accessibility className="h-3 w-3" /> PMR
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Itinéraire */}
                <Section title="Itinéraire" icon={<MapPin className="h-4 w-4" />}>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Départ</p>
                        <p className="font-medium">{selectedBooking.departure}</p>
                        {(selectedBooking.pickupLat != null || selectedBooking.pickupLng != null) && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {selectedBooking.pickupLat}, {selectedBooking.pickupLng}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Arrivée</p>
                        <p className="font-medium">{selectedBooking.destination}</p>
                        {(selectedBooking.destinationLat != null || selectedBooking.destinationLng != null) && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {selectedBooking.destinationLat}, {selectedBooking.destinationLng}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> Départ prévu
                        </p>
                        <p className="text-sm font-medium">
                          {selectedBooking.departureAt
                            ? new Date(selectedBooking.departureAt).toLocaleString("fr-FR")
                            : "—"}
                        </p>
                      </div>
                      {selectedBooking.roundTrip && (
                        <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Retour prévu
                          </p>
                          <p className="text-sm font-medium">
                            {selectedBooking.returnAt
                              ? new Date(selectedBooking.returnAt).toLocaleString("fr-FR")
                              : "Non défini"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Section>

                {/* Composition (passagers + bagages) */}
                <Section title="Composition" icon={<UsersIcon className="h-4 w-4" />}>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat
                      icon={<UsersIcon className="h-4 w-4" />}
                      label="Passagers"
                      value={String(selectedBooking.passengers ?? 0)}
                    />
                    <Stat
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Grands bagages"
                      value={String(selectedBooking.largeLuggage ?? 0)}
                    />
                    <Stat
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Petits bagages"
                      value={String(selectedBooking.smallLuggage ?? 0)}
                    />
                  </div>
                </Section>

                {/* Véhicules */}
                {selectedBooking.vehicles && selectedBooking.vehicles.length > 0 && (
                  <Section title="Véhicules réservés" icon={<Car className="h-4 w-4" />}>
                    <div className="space-y-2">
                      {selectedBooking.vehicles.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {v.vehicle?.type || "Véhicule"}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({v.vehicle?.category || "—"})
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Quantité : {v.quantity} • {v.unitPrice} TND / unité
                            </p>
                          </div>
                          <p className="font-semibold text-sm">
                            {(v.quantity * v.unitPrice).toFixed(2)} TND
                          </p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Client (compte) */}
                <Section title="Client (titulaire du compte)" icon={<User className="h-4 w-4" />}>
                  <div className="space-y-1.5 text-sm">
                    <p className="font-medium">
                      {selectedBooking.client?.fullName ?? "—"}
                    </p>
                    {selectedBooking.client?.email && (
                      <a
                        href={`mailto:${selectedBooking.client.email}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Mail className="h-3 w-3" /> {selectedBooking.client.email}
                      </a>
                    )}
                    {selectedBooking.client?.phone && (
                      <a
                        href={`tel:${selectedBooking.client.phone}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="h-3 w-3" /> {selectedBooking.client.phone}
                      </a>
                    )}
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      ID : {selectedBooking.clientId}
                    </p>
                  </div>
                </Section>

                {/* Passager (si différent du client) */}
                {(selectedBooking.passengerName ||
                  selectedBooking.passengerEmail ||
                  selectedBooking.passengerPhone) && (
                  <Section title="Passager principal" icon={<User className="h-4 w-4" />}>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {selectedBooking.passengerName ?? "—"}
                      </p>
                      {selectedBooking.passengerEmail && (
                        <a
                          href={`mailto:${selectedBooking.passengerEmail}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1.5"
                        >
                          <Mail className="h-3 w-3" /> {selectedBooking.passengerEmail}
                        </a>
                      )}
                      {selectedBooking.passengerPhone && (
                        <a
                          href={`tel:${selectedBooking.passengerPhone}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="h-3 w-3" /> {selectedBooking.passengerPhone}
                        </a>
                      )}
                    </div>
                  </Section>
                )}

                {/* Fournisseur */}
                <Section title="Fournisseur" icon={<Building2 className="h-4 w-4" />}>
                  {selectedBooking.handledBySupplier ? (
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {selectedBooking.handledBySupplier.companyName ||
                          selectedBooking.handledBySupplier.fullName}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        ID : {selectedBooking.handledBySupplier.id}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun fournisseur assigné
                    </p>
                  )}
                </Section>

                {/* Chauffeur */}
                <Section title="Chauffeur affecté" icon={<Car className="h-4 w-4" />}>
                  {selectedBooking.assignedDriver ? (
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium">
                        {selectedBooking.assignedDriver.fullName}
                      </p>
                      {selectedBooking.assignedDriver.email && (
                        <a
                          href={`mailto:${selectedBooking.assignedDriver.email}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1.5"
                        >
                          <Mail className="h-3 w-3" /> {selectedBooking.assignedDriver.email}
                        </a>
                      )}
                      {selectedBooking.assignedDriver.phone && (
                        <a
                          href={`tel:${selectedBooking.assignedDriver.phone}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="h-3 w-3" /> {selectedBooking.assignedDriver.phone}
                        </a>
                      )}
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        ID : {selectedBooking.assignedDriver.id}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Aucun chauffeur affecté
                    </p>
                  )}
                </Section>

                {/* Paiement */}
                <Section title="Paiement" icon={<CreditCard className="h-4 w-4" />}>
                  {selectedBooking.payment ? (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Méthode</span>
                        <span className="font-medium">
                          {selectedBooking.payment.method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Montant</span>
                        <span className="font-medium">
                          {selectedBooking.payment.amount} TND
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge
                          variant={
                            selectedBooking.payment.status === "paid"
                              ? "default"
                              : selectedBooking.payment.status === "refunded"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {selectedBooking.payment.status === "refunded"
                            ? "Remboursé"
                            : selectedBooking.payment.status === "paid"
                              ? "Payé"
                              : selectedBooking.payment.status === "pending"
                                ? "En attente"
                                : selectedBooking.payment.status}
                        </Badge>
                      </div>
                      {selectedBooking.payment.voucherCode && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/40">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Ticket className="h-3.5 w-3.5" /> Voucher
                          </span>
                          <span className="font-mono text-xs">
                            {selectedBooking.payment.voucherCode}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] font-mono text-muted-foreground">
                        ID paiement : {selectedBooking.payment.id}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Pas de paiement enregistré
                    </p>
                  )}
                </Section>

                {/* Notes */}
                {selectedBooking.notes && (
                  <Section title="Notes" icon={<FileText className="h-4 w-4" />}>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedBooking.notes}
                    </p>
                  </Section>
                )}

                {/* Audit */}
                <Section title="Audit" icon={<Hash className="h-4 w-4" />}>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Créée le
                      </span>
                      <span>
                        {selectedBooking.createdAt
                          ? new Date(selectedBooking.createdAt).toLocaleString("fr-FR")
                          : "—"}
                      </span>
                    </div>
                    {selectedBooking.updatedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Modifiée le
                        </span>
                        <span>
                          {new Date(selectedBooking.updatedAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 pt-3 border-t border-border">
            {selectedBooking && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleDownloadVoucher(selectedBooking)}
                disabled={downloadingId === selectedBooking.id}
              >
                {downloadingId === selectedBooking.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Télécharger voucher
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : ANNULATION ============ */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Annuler cette réservation ?</DialogTitle>
            <DialogDescription>
              Le client sera notifié. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-3 text-sm">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{cancelTarget.departure} → {cancelTarget.destination}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Client : {cancelTarget.client?.fullName ?? cancelTarget.passengerName ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Code : {cancelTarget.code ?? cancelTarget.id.slice(0, 8)}
                </p>
              </div>
              <div>
                <Label htmlFor="cancel-reason" className="text-xs">Raison (facultatif)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Ex : Demande du client, météo défavorable, fournisseur indisponible…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{cancelReason.length}/500</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Annulation…</>
              ) : (
                "Oui, annuler"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : REMBOURSEMENT ============ */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Statut du remboursement</DialogTitle>
            <DialogDescription>
              Choisis le statut à appliquer pour cette réservation annulée.
            </DialogDescription>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">{refundTarget.departure} → {refundTarget.destination}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Montant : <span className="font-semibold text-primary">{refundTarget.totalPrice} TND</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Statut actuel :{" "}
                  <Badge
                    variant={refundTarget.payment?.status === "refunded" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {refundTarget.payment?.status === "refunded" ? "Remboursé" : "Non remboursé"}
                  </Badge>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={refundTarget.payment?.status === "refunded" ? "default" : "outline"}
                  className={`justify-start h-auto py-3 ${
                    refundTarget.payment?.status === "refunded"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  }`}
                  onClick={() => handleRefundToggle("refunded")}
                  disabled={refundLoading || refundTarget.payment?.status === "refunded"}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Marquer comme remboursé</p>
                    <p className="text-xs opacity-80">Le client a bien été remboursé.</p>
                  </div>
                </Button>

                <Button
                  variant={refundTarget.payment?.status !== "refunded" ? "default" : "outline"}
                  className="justify-start h-auto py-3"
                  onClick={() => handleRefundToggle("paid")}
                  disabled={refundLoading || refundTarget.payment?.status !== "refunded"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Marquer comme non remboursé</p>
                    <p className="text-xs opacity-80">Pas de remboursement effectué.</p>
                  </div>
                </Button>
              </div>

              {refundLoading && (
                <div className="flex items-center justify-center text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Mise à jour…
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={refundLoading}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DIALOG : ASSIGNER À UN FOURNISSEUR ============ */}
      <Dialog
        open={!!assignTarget}
        onOpenChange={(open) => {
          if (!open) {
            setAssignTarget(null);
            setSelectedSupplierId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner à un fournisseur</DialogTitle>
            <DialogDescription>
              {assignTarget && (
                <>
                  Réservation{" "}
                  <span className="font-mono text-foreground">
                    {assignTarget.code ?? assignTarget.id.slice(0, 8)}
                  </span>{" "}
                  — {assignTarget.departure} → {assignTarget.destination}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="supplier-select">Fournisseur</Label>
            {suppliersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement de la liste des fournisseurs...
              </div>
            ) : suppliers.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Aucun fournisseur éligible. Vérifie qu'au moins un supplier est
                actif et a un contrat validé.
              </div>
            ) : (
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier-select" className="w-full">
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {s.companyName || s.fullName}
                        </span>
                        {s.email && (
                          <span className="text-xs text-muted-foreground">
                            {s.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Le fournisseur recevra une notification et pourra ensuite
              affecter un de ses chauffeurs.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignTarget(null);
                setSelectedSupplierId("");
              }}
              disabled={assignLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignConfirm}
              disabled={!selectedSupplierId || assignLoading}
              className="gap-2"
            >
              {assignLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assignation...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Assigner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

/* -------- Sous-composants UI ------------------------------------------- */

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      {icon && <span className="text-primary">{icon}</span>}
      {title}
    </h4>
    {children}
  </div>
);

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
      {icon}
      <p className="text-[10px] uppercase tracking-wide">{label}</p>
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);

export default AdminReservations;
