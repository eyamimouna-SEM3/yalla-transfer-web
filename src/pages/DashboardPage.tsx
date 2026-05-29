import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ProfileType } from "@/pages/AuthPage";
import DashboardLayout, { type NavItem } from "@/components/dashboard/DashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import SupplierDashboard from "@/components/dashboard/SupplierDashboard";
import SupplierPendingScreen from "@/components/dashboard/SupplierPendingScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays, PlusCircle, CreditCard, TrendingUp, Download, AlertCircle, Upload, Wallet, Bell, CheckCircle2, Clock, Receipt, Users, FileSpreadsheet, Pencil, Plane, XCircle,
} from "lucide-react";
import CancelReservationDialog from "@/components/dashboard/CancelReservationDialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { authService, type AuthUser } from "@/services/authService";
import { bookingService, type Booking } from "@/services/bookingService";
import { paymentService, type Payment } from "@/services/paymentService";
import { supplierService } from "@/services/supplierService";
import { driverService } from "@/services/driverService";
import { invoiceService, type MonthlyInvoice } from "@/services/invoiceService";
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime";
import { pendingBookingStorage } from "@/utils/pendingBooking";
import { tokenStorage } from "@/utils/tokenStorage";

const navConfigs: Record<string, NavItem[]> = {
  particulier: [
    { icon: CalendarDays, label: "Mes réservations", id: "reservations" },
    { icon: CreditCard, label: "Historique des paiements", id: "payments" },
  ],
  corporate: [
    { icon: CalendarDays, label: "Mes réservations", id: "reservations" },
    { icon: Users, label: "Réservation de groupe", id: "group" },
    { icon: FileSpreadsheet, label: "Facturation mensuelle", id: "invoices" },
    { icon: CreditCard, label: "Historique des paiements", id: "payments" },
  ],
};

// Mock reservations
const mockReservations = [
  { id: "RES-001", date: "2026-05-12", time: "09:00", from: "Aéroport Tunis-Carthage", to: "Hôtel El Mouradi", vehicle: "ECO", status: "confirmed", price: 85, voucherReady: true },
  { id: "RES-002", date: "2026-05-15", time: "14:30", from: "Sousse Centre", to: "Aéroport Enfidha", vehicle: "SEDAN", status: "pending", price: 120, voucherReady: false },
  { id: "RES-003", date: "2026-04-15", time: "11:00", from: "Tunis Centre", to: "Hammamet", vehicle: "VAN", status: "ongoing", price: 140, voucherReady: true },
  { id: "RES-004", date: "2026-03-20", time: "08:00", from: "Djerba Midoun", to: "Aéroport Djerba", vehicle: "VAN", status: "completed", price: 95, voucherReady: true },
  { id: "RES-005", date: "2026-02-10", time: "16:00", from: "Aéroport Tunis-Carthage", to: "La Marsa", vehicle: "ECO", status: "completed", price: 60, voucherReady: true },
];

type DashboardReservation = {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  vehicle: string;
  status: Booking["status"];
  price: number;
  voucherReady: boolean;
};

// Mock payments derived from reservations
const mockPayments = [
  { reservationId: "RES-001", date: "2026-05-01", amount: 85, method: "Carte internationale", status: "paid" },
  { reservationId: "RES-002", date: "2026-05-08", amount: 120, method: "Wallet", status: "pending" },
  { reservationId: "RES-003", date: "2026-04-10", amount: 140, method: "Carte nationale", status: "paid" },
  { reservationId: "RES-004", date: "2026-03-18", amount: 95, method: "E-Dinar", status: "paid" },
  { reservationId: "RES-005", date: "2026-02-09", amount: 60, method: "Carte internationale", status: "paid" },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmée", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  ongoing: { label: "En cours", variant: "default" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const paymentStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Payé", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  refunded: { label: "Remboursé", variant: "outline" },
  failed: { label: "Échoué", variant: "destructive" },
};

const DashboardPage = () => {
  const location = useLocation();
  const state = location.state as {
    profile?: ProfileType;
    name?: string;
    accountStatus?: string;
    contractStatus?: string;
    pendingVoucher?: boolean;
  } | null;

  // Helper : déduplique des bookings par id en gardant le 1er.
  const mergeUnique = (items: Booking[]): Booking[] => {
    const seen = new Set<string>();
    const out: Booking[] = [];
    for (const b of items) {
      if (b && b.id && !seen.has(b.id)) {
        seen.add(b.id);
        out.push(b);
      }
    }
    return out;
  };

  // Re-charge les réservations selon le rôle de l'utilisateur connecté.
  // Appelé après chaque action (accept / faire offre / refuser) côté supplier/chauffeur.
  const refreshBookingsForRole = useCallback(async (role: string) => {
    try {
      if (role === "supplier") {
        const [unassigned, recent] = await Promise.all([
          supplierService.unassignedBookings().catch(() => [] as Booking[]),
          supplierService.recentBookings().catch(() => [] as Booking[]),
        ]);
        setBookings(mergeUnique([...unassigned, ...recent]));
      } else if (role === "driver_independent" || role === "driver_employee") {
        const [next, assigned] = await Promise.all([
          driverService.nextBooking().catch(() => null),
          bookingService.getAll().catch(() => [] as Booking[]),
        ]);
        const all: Booking[] = [];
        if (next) all.push(next);
        all.push(...assigned);
        setBookings(mergeUnique(all));
      } else {
        const bookingsData = await bookingService.getAll();
        setBookings(bookingsData);
      }
    } catch (e) {
      console.warn("Refresh réservations échoué:", e);
    }
  }, []);

  // Données réelles depuis la DB
  const [userData, setUserData] = useState<AuthUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis la DB
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      setLoading(true);
      timeoutId = setTimeout(() => {
        // Après 5s, on affiche le dashboard même sans données API
        if (!cancelled) setLoading(false);
      }, 5000);

      let fetchedUser: AuthUser | null = null;
      try {
        fetchedUser = await authService.me();
        if (!cancelled) {
          setUserData(fetchedUser);
          clearTimeout(timeoutId);
        }
      } catch (e) {
        console.warn("Impossible de charger l'utilisateur:", e);
        if (!cancelled) clearTimeout(timeoutId);
      }
      if (cancelled) return;

      // Filet de sécurité : soumettre une éventuelle réservation en attente
      // si l'utilisateur arrive ici authentifié (cas du parcours invité → inscription).
      try {
        const pending = pendingBookingStorage.load();
        if (pending && tokenStorage.getToken()) {
          await bookingService.create(pending);
          pendingBookingStorage.clear();
        }
      } catch (e) {
        console.warn("Soumission réservation en attente échouée:", e);
      }

      // Selon le rôle, on charge des réservations différentes pour alimenter le dashboard.
      try {
        const role = fetchedUser?.role ?? "";
        const isSupplier = role === "supplier";
        const isDriver = role === "driver_independent" || role === "driver_employee";

        if (isSupplier) {
          // Supplier voit : les courses non assignées (marketplace) + ses courses récentes.
          const [unassigned, recent] = await Promise.all([
            supplierService.unassignedBookings().catch(() => [] as Booking[]),
            supplierService.recentBookings().catch(() => [] as Booking[]),
          ]);
          const merged = mergeUnique([...unassigned, ...recent]);
          if (!cancelled) setBookings(merged);
        } else if (isDriver) {
          // Chauffeur voit : la prochaine course bookable + ses courses déjà assignées.
          const [next, assigned] = await Promise.all([
            driverService.nextBooking().catch(() => null),
            bookingService.getAll().catch(() => [] as Booking[]),
          ]);
          const all: Booking[] = [];
          if (next) all.push(next);
          all.push(...assigned);
          if (!cancelled) setBookings(mergeUnique(all));
        } else {
          // Client B2C / B2B : ses propres réservations.
          const bookingsData = await bookingService.getAll();
          if (!cancelled) setBookings(bookingsData);
        }
      } catch (e) {
        console.warn("Impossible de charger les réservations:", e);
      }

      try {
        // Les paiements de l'utilisateur sont liés aux bookings — on lit depuis bookings.payment
        // (le backend ne propose pas /payments pour l'utilisateur final, seulement /payments/methods)
        if (!cancelled) {
          setPayments([]);
        }
      } catch (e) {
        console.warn("Impossible de charger les paiements:", e);
      }

      if (!cancelled) setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Synchro temps réel : nouvelles réservations / changements de statut depuis web ou mobile.
  useBookingsRealtime({
    onCreated: (b) => {
      if (b.id) setBookings(prev => prev.some(x => x.id === b.id) ? prev : [b as Booking, ...prev]);
    },
    onStatusChanged: (b) => {
      if (!b.id || !b.status) return;
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: b.status as Booking["status"] } : x));
    },
    onDriverAssigned: (b) => {
      if (!b.id) return;
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, ...b, status: b.status as Booking["status"] } as Booking : x));
    },
  });

  // Déterminer le profil à partir des données utilisateur ou du state
  const profileFromData = userData?.role === "client_b2c" ? "particulier" :
    userData?.role === "client_b2b" ? "corporate" :
      userData?.role === "supplier" ? "transport" :
        (userData?.role === "driver_independent" || userData?.role === "driver_employee") ? "chauffeur" : null;

  const profile: ProfileType = profileFromData || state?.profile || "particulier";
  const userName = userData?.full_name || userData?.fullName || state?.name || "Utilisateur";
  const pendingVoucher = state?.pendingVoucher || false;

  const [accountStatus, setAccountStatus] = useState(userData?.account_status || state?.accountStatus || "active");
  const [contractStatus, setContractStatus] = useState<"none" | "sent" | "signed" | "validated">(
    (userData?.contract_status || state?.contractStatus || "validated") as "none" | "sent" | "signed" | "validated"
  );

  useEffect(() => {
    if (!userData) return;

    setAccountStatus(userData.account_status || userData.accountStatus || "active");
    setContractStatus(
      (userData.contract_status || userData.contractStatus || "validated") as "none" | "sent" | "signed" | "validated"
    );
  }, [userData]);

  const isSupplier = profile === "chauffeur" || profile === "transport";
  const isSupplierPending = isSupplier && (
    accountStatus === "pending" || accountStatus === "rejected" ||
    (accountStatus === "approved" && contractStatus !== "validated")
  );

  const handleSimulateApproval = useCallback(() => {
    setAccountStatus("active");
    setContractStatus("validated");
  }, []);

  const navItems = navConfigs[profile] || navConfigs.particulier;
  const [activeItem, setActiveItem] = useState(navItems[0]?.id || "");

  // Afficher le chargement initial
  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  if (isSupplierPending) {
    const mappedStatus = accountStatus === "approved" ? "approved" : accountStatus === "rejected" ? "rejected" : "pending";
    return (
      <SupplierPendingScreen
        accountStatus={mappedStatus}
        contractStatus={contractStatus}
        userName={userName}
        onSimulateApproval={handleSimulateApproval}
      />
    );
  }

  if (isSupplier) {
    return (
      <SupplierDashboard
        profile={profile as "chauffeur" | "transport"}
        userName={userName}
        bookings={bookings}
        userRole={userData?.role}
        userId={userData?.id}
        onRefresh={() => void refreshBookingsForRole(userData?.role ?? "")}
      />
    );
  }

  return (
    <DashboardLayout
      profile={profile}
      userName={userName}
      navItems={navItems}
      activeItem={activeItem}
      onNavChange={setActiveItem}
    >
      {pendingVoucher && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Voucher en attente de validation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Veuillez télécharger votre pièce d'identité pour accéder à votre voucher de réservation.
            </p>
            <Button size="sm" className="mt-2 gap-1 text-xs" variant="outline">
              <Upload className="h-3 w-3" /> Envoyer ma pièce d'identité
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          👋 Bienvenue, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Votre espace personnel vous permet de gérer vos réservations et vos paiements en toute simplicité.
        </p>
      </div>

      {profile === "particulier" && <ParticulierContent active={activeItem} onNavChange={setActiveItem} bookings={bookings} payments={payments} />}
      {profile === "corporate" && <CorporateContent active={activeItem} onNavChange={setActiveItem} bookings={bookings} payments={payments} />}
      {activeItem === "settings" && <SettingsContent />}
    </DashboardLayout>
  );
};

// ================= PARTICULIER =================

const ParticulierContent = ({ active, onNavChange, bookings, payments }: { active: string; onNavChange: (id: string) => void; bookings: Booking[]; payments: Payment[] }) => {
  const totalPaid = useMemo(
    () => payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const completedCount = bookings.filter(b => b.status === "completed").length;

  if (active === "settings") return null;
  if (active === "notifications") return <NotificationsView onNavChange={onNavChange} />;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={CalendarDays} label="Réservations" value={bookings.length} />
        </button>
        <button onClick={() => onNavChange("payments")} className="text-left">
          <StatCard icon={Wallet} label="Total payé" value={`${totalPaid} TND`} />
        </button>
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={TrendingUp} label="Trajets effectués" value={completedCount} />
        </button>
      </div>

      {active === "reservations" && <ReservationsHub bookings={bookings} />}
      {active === "payments" && <PaymentsHistory payments={payments} />}
    </div>
  );
};

const ReservationsHub = ({ bookings }: { bookings: Booking[] }) => {
  const navigate = useNavigate();
  const now = new Date();

  const apiReservations = useMemo<DashboardReservation[]>(() => bookings.map(b => {
    const dep = b.departureAt ? new Date(b.departureAt) : new Date();
    return {
      id: b.id,
      date: dep.toISOString().slice(0, 10),
      time: dep.toISOString().slice(11, 16),
      from: b.departure,
      to: b.destination,
      vehicle: b.vehicles?.[0]?.vehicle?.type ?? "",
      status: b.status,
      price: b.totalPrice,
      voucherReady: b.status === "confirmed" || b.status === "completed",
    };
  }), [bookings]);

  const [reservations, setReservations] = useState<DashboardReservation[]>(apiReservations);

  useEffect(() => {
    setReservations(apiReservations);
  }, [apiReservations]);

  const [editing, setEditing] = useState<DashboardReservation | null>(null);
  const [cancelling, setCancelling] = useState<DashboardReservation | null>(null);

  const upcoming = reservations.filter(r =>
    (r.status === "confirmed" || r.status === "pending") && new Date(r.date) >= now
  );
  const ongoing = reservations.filter(r => r.status === "assigned" || r.status === "driver_en_route" || r.status === "arrived" || r.status === "in_progress");
  const past = reservations.filter(r =>
    r.status === "completed" || r.status === "cancelled"
  );

  const handleSave = (updated: DashboardReservation) => {
    setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditing(null);
    toast({
      title: "✅ Réservation modifiée",
      description: `La réservation ${updated.id} a été mise à jour avec succès.`,
    });
  };

  const handleCancelConfirm = (id: string) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r));
    setCancelling(null);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-foreground">Mes réservations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vous pouvez modifier une réservation jusqu'à 24h avant le transfert.
          </p>
        </div>
        <Button onClick={() => navigate("/#booking")} size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="h-4 w-4" /> Nouvelle réservation
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="upcoming">En attente ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="ongoing">En cours ({ongoing.length})</TabsTrigger>
            <TabsTrigger value="past">Terminées ({past.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="mt-0">
          <ReservationsTable items={upcoming} emptyMessage="Aucune réservation en attente." onEdit={setEditing} onCancel={setCancelling} />
        </TabsContent>
        <TabsContent value="ongoing" className="mt-0">
          <ReservationsTable items={ongoing} emptyMessage="Aucune réservation en cours." onEdit={setEditing} onCancel={setCancelling} />
        </TabsContent>
        <TabsContent value="past" className="mt-0">
          <ReservationsTable items={past} emptyMessage="Aucune réservation terminée." onEdit={setEditing} />
        </TabsContent>
      </Tabs>

      <EditReservationDialog
        reservation={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <CancelReservationDialog
        reservation={cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={(id) => handleCancelConfirm(id)}
      />
    </div>
  );
};

const ReservationsTable = ({
  items, emptyMessage, onEdit, onCancel,
}: {
  items: DashboardReservation[];
  emptyMessage: string;
  onEdit?: (r: DashboardReservation) => void;
  onCancel?: (r: DashboardReservation) => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }
  const now = new Date();
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">ID</TableHead>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Heure</TableHead>
            <TableHead className="text-xs">Trajet</TableHead>
            <TableHead className="text-xs">Véhicule</TableHead>
            <TableHead className="text-xs">Tarif</TableHead>
            <TableHead className="text-xs">Statut</TableHead>
            <TableHead className="text-xs text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(res => {
            const status = statusLabels[res.status] || statusLabels.pending;
            const transferDate = new Date(`${res.date}T${res.time}`);
            const hoursBefore = (transferDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            const canEdit = onEdit && hoursBefore >= 24 && (res.status === "confirmed" || res.status === "pending");
            const canCancel = onCancel && (res.status === "confirmed" || res.status === "pending") && hoursBefore > 0;
            return (
              <TableRow key={res.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-medium">{res.id}</TableCell>
                <TableCell className="text-xs">{res.date}</TableCell>
                <TableCell className="text-xs">{res.time}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{res.from} → {res.to}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{res.vehicle}</Badge>
                </TableCell>
                <TableCell className="text-xs font-semibold text-primary">{res.price} TND</TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                        onClick={() => onEdit?.(res)}
                        title="Modifier la réservation (>24h avant le transfert)"
                      >
                        <Pencil className="h-3 w-3" /> Modifier
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => onCancel?.(res)}
                        title="Annuler la réservation"
                      >
                        <XCircle className="h-3 w-3" /> Annuler
                      </Button>
                    )}
                    {res.voucherReady && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                        onClick={async () => {
                          try {
                            await bookingService.downloadVoucher(res.id);
                            toast({ title: "Voucher téléchargé", description: `Réservation ${res.id}` });
                          } catch (err) {
                            const e = err as { message?: string };
                            toast({
                              title: "Téléchargement impossible",
                              description: e?.message ?? "Réessaie dans un instant.",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Télécharger le voucher PDF"
                      >
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    )}
                    {!res.voucherReady && !canEdit && !canCancel && (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const EditReservationDialog = ({
  reservation, onClose, onSave,
}: {
  reservation: DashboardReservation | null;
  onClose: () => void;
  onSave: (r: DashboardReservation) => void;
}) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [flight, setFlight] = useState("");

  useMemo(() => {
    if (reservation) {
      setDate(reservation.date);
      setTime(reservation.time);
      setFlight("");
    }
  }, [reservation]);

  if (!reservation) return null;

  return (
    <Dialog open={!!reservation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la réservation {reservation.id}</DialogTitle>
          <DialogDescription>
            Adaptez votre transfert si votre vol a changé. Modifiable jusqu'à 24h avant le départ.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border p-3 bg-muted/30 text-xs">
            <p className="font-medium text-foreground">{reservation.from} → {reservation.to}</p>
            <p className="text-muted-foreground mt-0.5">Véhicule : {reservation.vehicle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs">Nouvelle date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs">Nouvelle heure</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="flight" className="text-xs flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5" /> Numéro de vol (optionnel)
            </Label>
            <Input id="flight" placeholder="ex : TU714" value={flight} onChange={(e) => setFlight(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => onSave({ ...reservation, date, time })}
          >
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PaymentsHistory = ({ payments }: { payments: Payment[] }) => (
  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
    <div className="p-4 border-b border-border">
      <h2 className="font-display font-semibold text-foreground">Historique des paiements</h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        Tous vos paiements effectués avec le détail de chaque transaction.
      </p>
    </div>
    {payments.length === 0 ? (
      <div className="p-6"><EmptyState message="Aucun paiement enregistré." /></div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">ID Réservation</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Montant payé</TableHead>
              <TableHead className="text-xs">Mode de paiement</TableHead>
              <TableHead className="text-xs">Statut</TableHead>
              <TableHead className="text-xs text-right">Reçu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(p => {
              const status = paymentStatusLabels[p.status] || paymentStatusLabels.pending;
              return (
                <TableRow key={p.bookingId + p.createdAt}>
                  <TableCell className="font-mono text-xs font-medium">{p.bookingId}</TableCell>
                  <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="text-xs font-semibold text-primary">{p.amount} {p.currency}</TableCell>
                  <TableCell className="text-xs">{p.method}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "paid" ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                        <Download className="h-3 w-3" /> PDF
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
);

// ================= CORPORATE =================

const CorporateContent = ({ active, onNavChange, bookings, payments }: { active: string; onNavChange: (id: string) => void; bookings: Booking[]; payments: Payment[] }) => {
  if (active === "settings") return null;
  if (active === "notifications") return <NotificationsView onNavChange={onNavChange} />;

  const totalSpent = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-xl">
        <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Veuillez télécharger votre voucher</p>
          <p className="text-xs text-muted-foreground mt-1">
            Votre voucher de réservation est disponible. Téléchargez-le pour le présenter lors de votre transfert.
          </p>
          <Button size="sm" className="mt-2 gap-1 text-xs" variant="outline">
            <Download className="h-3 w-3" /> Télécharger le voucher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={CalendarDays} label="Total des transferts" value={bookings.length} />
        </button>
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={TrendingUp} label="Transferts effectués" value={bookings.filter(b => b.status === "completed").length} />
        </button>
        <button onClick={() => onNavChange("group")} className="text-left">
          <StatCard icon={Users} label="Réservations de groupe" value={0} />
        </button>
        <button onClick={() => onNavChange("invoices")} className="text-left">
          <StatCard icon={FileSpreadsheet} label="Total facturé" value={`${totalSpent} TND`} />
        </button>
      </div>

      {active === "reservations" && <ReservationsHub bookings={bookings} />}
      {active === "group" && <GroupBookingView onNavChange={onNavChange} />}
      {active === "invoices" && <MonthlyInvoicesView />}
      {active === "payments" && <PaymentsHistory payments={payments} />}
    </div>
  );
};

// ============== GROUP BOOKING ==============

const GroupBookingView = ({ onNavChange }: { onNavChange: (id: string) => void }) => {
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState("");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!passengers || !date || !from || !to) {
      toast({ title: "Champs manquants", description: "Merci de renseigner tous les champs.", variant: "destructive" });
      return;
    }
    const pax = parseInt(passengers, 10);
    if (!Number.isFinite(pax) || pax < 5) {
      toast({ title: "Nombre invalide", description: "Une réservation de groupe nécessite au minimum 5 passagers.", variant: "destructive" });
      return;
    }
    const departureAt = new Date(`${date}T08:00:00`);
    if (Number.isNaN(departureAt.getTime()) || departureAt.getTime() < Date.now() - 60 * 60 * 1000) {
      toast({ title: "Date invalide", description: "La date doit être dans le futur.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Choix automatique du véhicule selon nb pax
      const vehicleId = pax <= 9 ? "van" : pax <= 20 ? "minibus" : pax <= 27 ? "autocar" : "bus";
      await bookingService.create({
        departure: from,
        destination: to,
        departureAt: departureAt.toISOString(),
        passengers: pax,
        vehicles: [{ id: vehicleId, quantity: 1 }],
        paymentMethod: "card",
        notes: `Réservation de groupe corporate — ${pax} passagers`,
      });
      toast({
        title: "Réservation créée",
        description: `Transfert de groupe pour ${pax} passagers enregistré. Tu peux la suivre dans tes réservations.`,
      });
      setFrom(""); setTo(""); setDate(""); setPassengers("");
      onNavChange("reservations");
    } catch (e) {
      const err = e as { message?: string };
      toast({
        title: "Création impossible",
        description: err.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Réservation de groupe
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Organisez un transfert pour plusieurs passagers depuis votre dashboard.
        </p>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Lieu de départ</Label>
            <Input placeholder="Ex : Aéroport Tunis-Carthage" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Destination</Label>
            <Input placeholder="Ex : Hôtel El Mouradi" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date du transfert</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre de passagers</Label>
            <Input type="number" min={2} placeholder="Ex : 12" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 gap-1.5">
            {submitting ? <CalendarDays className="h-4 w-4 animate-pulse" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? "Envoi…" : "Envoyer la demande"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/#booking")} className="gap-1.5">
            Réservation détaillée
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============== MONTHLY INVOICES (B2B — données réelles) ==============

const MonthlyInvoicesView = () => {
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invoiceService.monthly();
        if (!cancelled) setInvoices(data);
      } catch (e) {
        const err = e as { message?: string; status?: number };
        if (!cancelled) {
          setError(err.status === 403
            ? "Réservé aux clients corporate."
            : err.message ?? "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const exportAllCSV = () => {
    const header = ["Période", "Code", "Trajet", "Date", "Montant", "Statut paiement"];
    const lines = invoices.flatMap((inv) => inv.lines.map((l) => [
      inv.label,
      l.code ?? l.bookingId.slice(0, 8),
      `${l.departure} -> ${l.destination}`,
      new Date(l.departureAt).toLocaleDateString("fr-FR"),
      l.totalPrice,
      l.paymentStatus,
    ]));
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportInvoiceCSV = (inv: MonthlyInvoice) => {
    const header = ["Code", "Trajet", "Date", "Montant", "Statut"];
    const lines = inv.lines.map((l) => [
      l.code ?? l.bookingId.slice(0, 8),
      `${l.departure} -> ${l.destination}`,
      new Date(l.departureAt).toLocaleDateString("fr-FR"),
      l.totalPrice,
      l.paymentStatus,
    ]);
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture-${inv.period}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Facturation mensuelle
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vos transferts agrégés par mois — données réelles.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={exportAllCSV} disabled={invoices.length === 0}>
          <Download className="h-4 w-4" /> Tout exporter
        </Button>
      </div>
      {invoices.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Aucune facturation à afficher. Crée tes premiers transferts.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Période</TableHead>
                <TableHead className="text-xs">Transferts</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs">Encaissé</TableHead>
                <TableHead className="text-xs">Reste dû</TableHead>
                <TableHead className="text-xs text-right">Export</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.period} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-xs font-medium">{inv.label}</TableCell>
                  <TableCell className="text-xs">{inv.count}</TableCell>
                  <TableCell className="text-xs font-semibold text-primary">{inv.total} {inv.currency}</TableCell>
                  <TableCell className="text-xs text-green-600">{inv.paid} {inv.currency}</TableCell>
                  <TableCell className="text-xs">
                    {inv.due > 0 ? (
                      <Badge variant="secondary" className="text-[10px]">{inv.due} {inv.currency}</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] bg-green-600/15 text-green-700 border-green-600/30">Soldé</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:bg-primary/10" onClick={() => exportInvoiceCSV(inv)}>
                      <Download className="h-3 w-3" /> CSV
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ================= NOTIFICATIONS =================

type NotificationType = "reservation" | "payment" | "confirmation" | "voucher";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  target: string; // dashboard nav id or external route
  reservationId?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "confirmation",
    title: "Réservation confirmée",
    message: "Votre transfert RES-001 du 12 mai a été confirmé par le chauffeur.",
    time: "Il y a 2 h",
    read: false,
    target: "reservations",
    reservationId: "RES-001",
  },
  {
    id: "n2",
    type: "payment",
    title: "Paiement reçu",
    message: "Nous avons bien reçu votre paiement de 85 TND pour la réservation RES-001.",
    time: "Il y a 3 h",
    read: false,
    target: "payments",
    reservationId: "RES-001",
  },
  {
    id: "n3",
    type: "voucher",
    title: "Voucher disponible",
    message: "Votre voucher de la réservation RES-003 est prêt à être téléchargé.",
    time: "Hier",
    read: false,
    target: "reservations",
    reservationId: "RES-003",
  },
  {
    id: "n4",
    type: "reservation",
    title: "Rappel — Transfert à venir",
    message: "Votre transfert RES-002 est prévu le 15 mai à 14h30.",
    time: "Il y a 2 jours",
    read: true,
    target: "reservations",
    reservationId: "RES-002",
  },
];

const notifIcons: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  reservation: { icon: CalendarDays, color: "text-primary bg-primary/10" },
  payment: { icon: CreditCard, color: "text-accent bg-accent/10" },
  confirmation: { icon: CheckCircle2, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  voucher: { icon: Receipt, color: "text-primary bg-primary/10" },
};

const NotificationsView = ({ onNavChange }: { onNavChange: (id: string) => void }) => {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-display font-semibold text-foreground">Notifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cliquez sur une notification pour accéder à la section concernée.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {mockNotifications.map((n) => {
          const cfg = notifIcons[n.type];
          const Icon = cfg.icon;
          return (
            <li key={n.id}>
              <button
                onClick={() => onNavChange(n.target)}
                className="w-full text-left flex items-start gap-3 p-4 hover:bg-muted/60 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{n.time}</span>
                    {n.reservationId && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{n.reservationId}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const SettingsContent = () => (
  <div className="bg-card rounded-2xl border border-border p-8">
    <h2 className="font-display text-xl font-bold text-foreground mb-2">⚙ Paramètres du compte</h2>
    <p className="text-muted-foreground">Les paramètres de votre compte seront disponibles prochainement.</p>
  </div>
);

export default DashboardPage;
