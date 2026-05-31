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
  CalendarDays, PlusCircle, CreditCard, TrendingUp, Download, AlertCircle, Upload, Wallet, Bell, CheckCircle2, Clock, Receipt, Users, FileSpreadsheet, Plane, XCircle,
  User, Lock, Eye, EyeOff, Settings as Cog, Info, Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useLocale } from "@/hooks/useLocale";
import BookingForm from "@/components/BookingForm";
import { notificationService, type UserNotification } from "@/services/notificationService";
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

// Construit les configurations de navigation en utilisant les traductions.
// Appelé depuis le composant pour bénéficier du re-render à chaque
// changement de langue.
const buildNavConfigs = (t: (k: string) => string): Record<string, NavItem[]> => ({
  particulier: [
    { icon: CalendarDays, label: t("dashboard.myReservations"), id: "reservations" },
    { icon: CreditCard, label: t("dashboard.paymentsHistory"), id: "payments" },
  ],
  corporate: [
    { icon: CalendarDays, label: t("dashboard.myReservations"), id: "reservations" },
    { icon: FileSpreadsheet, label: t("dashboard.monthlyInvoices"), id: "invoices" },
    { icon: CreditCard, label: t("dashboard.paymentsHistory"), id: "payments" },
  ],
});

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

// Mappage des status de réservation vers les libellés affichés côté client.
// Nouveau workflow : une réservation neuve est "pending" tant qu'un fournisseur
// ne l'a pas explicitement acceptée → libellé "En attente du fournisseur".
const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente du fournisseur", variant: "secondary" },
  confirmed: { label: "Confirmée", variant: "default" },
  assigned: { label: "Chauffeur assigné", variant: "default" },
  driver_en_route: { label: "Chauffeur en route", variant: "default" },
  arrived: { label: "Chauffeur arrivé", variant: "default" },
  in_progress: { label: "En cours", variant: "default" },
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
        const [pool, mine] = await Promise.all([
          driverService.availableBookings().catch(() => [] as Booking[]),
          bookingService.getAll().catch(() => [] as Booking[]),
        ]);
        setBookings(mergeUnique([...pool, ...mine]));
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
  // Compteur de notifications non lues pour le badge de la cloche du header.
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
          // Chauffeur voit :
          //  - le pool complet des courses disponibles (assignedDriverId NULL)
          //  - ses propres courses déjà assignées/terminées/annulées
          const [pool, mine] = await Promise.all([
            driverService.availableBookings().catch(() => [] as Booking[]),
            bookingService.getAll().catch(() => [] as Booking[]),
          ]);
          if (!cancelled) setBookings(mergeUnique([...pool, ...mine]));
        } else {
          // Client B2C / B2B : ses propres réservations.
          const bookingsData = await bookingService.getAll();
          if (!cancelled) setBookings(bookingsData);
        }
      } catch (e) {
        console.warn("Impossible de charger les réservations:", e);
      }

      // Les paiements sont extraits depuis bookings.payment via un useEffect
      // dédié (plus bas), pour qu'ils restent synchronisés avec les bookings.

      if (!cancelled) setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Extrait les paiements depuis le champ `payment` de chaque réservation.
  // Le backend ne propose pas d'endpoint /payments dédié aux clients, mais
  // chaque booking porte déjà l'info de paiement liée.
  useEffect(() => {
    const extracted: Payment[] = [];
    for (const b of bookings) {
      if (b.payment && b.payment.id) {
        extracted.push({
          id: b.payment.id,
          bookingId: b.id,
          amount: Number(b.payment.amount ?? 0),
          currency: "TND",
          method: b.payment.method ?? "card",
          status: (b.payment.status as Payment["status"]) ?? "pending",
          voucherCode: b.payment.voucherCode,
          voucherUrl: b.payment.voucherUrl,
          createdAt: b.createdAt,
        });
      }
    }
    setPayments(extracted);
  }, [bookings]);

  // Charger le nombre de notifications non lues pour le badge de la cloche.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await notificationService.listMine();
        if (!cancelled) {
          setUnreadNotifications(list.filter((n) => !n.read).length);
        }
      } catch {
        // silencieux — pas critique
      }
    })();
    return () => { cancelled = true; };
  }, [userData?.id]);

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

  const { t } = useLocale();
  const navConfigs = buildNavConfigs(t);
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
      unreadNotifications={unreadNotifications}
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
          👋 {t("dashboard.welcome", { name: userName })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard.subtitle")}
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
  const { t } = useLocale();
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
          <StatCard icon={CalendarDays} label={t("dashboard.myReservations")} value={bookings.length} />
        </button>
        <button onClick={() => onNavChange("payments")} className="text-left">
          <StatCard icon={Wallet} label={t("dashboard.totalBilled")} value={`${totalPaid} TND`} />
        </button>
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={TrendingUp} label={t("dashboard.completedTransfers")} value={completedCount} />
        </button>
      </div>

      {active === "reservations" && <ReservationsHub bookings={bookings} />}
      {active === "payments" && <PaymentsHistory payments={payments} />}
    </div>
  );
};

const ReservationsHub = ({ bookings }: { bookings: Booking[] }) => {
  const navigate = useNavigate();
  const { t } = useLocale();
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

  const [cancelling, setCancelling] = useState<DashboardReservation | null>(null);
  // Dialog "Nouvelle réservation" : permet de saisir une réservation sans
  // quitter le dashboard (l'avatar et la sidebar restent visibles).
  const [showNewBooking, setShowNewBooking] = useState(false);

  const upcoming = reservations.filter(r =>
    (r.status === "confirmed" || r.status === "pending") && new Date(r.date) >= now
  );
  const ongoing = reservations.filter(r => r.status === "assigned" || r.status === "driver_en_route" || r.status === "arrived" || r.status === "in_progress");
  const past = reservations.filter(r =>
    r.status === "completed" || r.status === "cancelled"
  );

  const handleCancelConfirm = (id: string) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r));
    setCancelling(null);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-foreground">{t("dashboard.myReservations")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("dashboard.cancelHint")}
          </p>
        </div>
        <Button onClick={() => setShowNewBooking(true)} size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="h-4 w-4" /> {t("dashboard.newReservation")}
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="upcoming">{t("dashboard.tabs.pending")} ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="ongoing">{t("dashboard.tabs.inProgress")} ({ongoing.length})</TabsTrigger>
            <TabsTrigger value="past">{t("dashboard.tabs.completed")} ({past.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="mt-0">
          <ReservationsTable items={upcoming} emptyMessage={t("dashboard.empty.pending")} onCancel={setCancelling} />
        </TabsContent>
        <TabsContent value="ongoing" className="mt-0">
          <ReservationsTable items={ongoing} emptyMessage={t("dashboard.empty.inProgress")} onCancel={setCancelling} />
        </TabsContent>
        <TabsContent value="past" className="mt-0">
          <ReservationsTable items={past} emptyMessage={t("dashboard.empty.completed")} />
        </TabsContent>
      </Tabs>

      <CancelReservationDialog
        reservation={cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={(id) => handleCancelConfirm(id)}
      />

      {/* Dialog Nouvelle réservation : l'utilisateur reste connecté dans son
          dashboard. À la soumission, navigation vers /booking?... — même page
          que depuis la home. */}
      <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 sm:p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{t("dashboard.newReservation")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-6">
            <BookingForm compact />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ReservationsTable = ({
  items, emptyMessage, onCancel,
}: {
  items: DashboardReservation[];
  emptyMessage: string;
  onCancel?: (r: DashboardReservation) => void;
}) => {
  const { t } = useLocale();
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
            <TableHead className="text-xs">{t("table.id")}</TableHead>
            <TableHead className="text-xs">{t("table.date")}</TableHead>
            <TableHead className="text-xs">{t("table.time")}</TableHead>
            <TableHead className="text-xs">{t("table.trip")}</TableHead>
            <TableHead className="text-xs">{t("table.vehicle")}</TableHead>
            <TableHead className="text-xs">{t("table.price")}</TableHead>
            <TableHead className="text-xs">{t("table.status")}</TableHead>
            <TableHead className="text-xs text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(res => {
            const status = statusLabels[res.status] || statusLabels.pending;
            const statusLabel = t(`bookingStatus.${res.status}` as any) || status.label;
            const transferDate = new Date(`${res.date}T${res.time}`);
            const hoursBefore = (transferDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            // La modification d'une réservation a été retirée : seule l'annulation
            // est désormais possible côté client (web + mobile).
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
                  <Badge variant={status.variant} className="text-[10px]">{statusLabel}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                        onClick={() => onCancel?.(res)}
                        title={t("dashboard.actions.cancel")}
                      >
                        <XCircle className="h-3 w-3" /> {t("dashboard.actions.cancel")}
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
                    {!res.voucherReady && !canCancel && (
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

const PaymentsHistory = ({ payments }: { payments: Payment[] }) => {
  const { t, locale } = useLocale();
  // Mappe la langue UI vers la locale de Date pour formater la date dans
  // la même langue que le reste de l'interface (fr → fr-FR, en → en-GB, es → es-ES).
  const dateLocale = locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "fr-FR";
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-semibold text-foreground">{t("payments.title")}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("payments.subtitle")}
        </p>
      </div>
      {payments.length === 0 ? (
        <div className="p-6"><EmptyState message={t("payments.empty")} /></div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t("payments.bookingId")}</TableHead>
                <TableHead className="text-xs">{t("table.date")}</TableHead>
                <TableHead className="text-xs">{t("payments.amountPaid")}</TableHead>
                <TableHead className="text-xs">{t("payments.paymentMethod")}</TableHead>
                <TableHead className="text-xs">{t("table.status")}</TableHead>
                <TableHead className="text-xs text-right">{t("payments.receipt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => {
                const status = paymentStatusLabels[p.status] || paymentStatusLabels.pending;
                const statusLabel = t(`paymentStatus.${p.status}` as any) || status.label;
                return (
                  <TableRow key={p.bookingId + p.createdAt}>
                    <TableCell className="font-mono text-xs font-medium">{p.bookingId}</TableCell>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString(dateLocale)}</TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{p.amount} {p.currency}</TableCell>
                    <TableCell className="text-xs">{p.method}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="text-[10px]">{statusLabel}</Badge>
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
};

// ================= CORPORATE =================

const CorporateContent = ({ active, onNavChange, bookings, payments }: { active: string; onNavChange: (id: string) => void; bookings: Booking[]; payments: Payment[] }) => {
  const { t } = useLocale();
  if (active === "settings") return null;
  if (active === "notifications") return <NotificationsView onNavChange={onNavChange} />;

  const totalSpent = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  // Bannière voucher : on cherche la réservation à venir la plus proche dont
  // le voucher est prêt (payment status = paid). Si rien → pas de bannière.
  // Le bouton télécharge le voucher de cette réservation précise.
  const upcomingPaidBooking = bookings
    .filter(
      (b) =>
        b.payment?.status === "paid" &&
        (b.status === "confirmed" || b.status === "pending" || b.status === "assigned") &&
        new Date(b.departureAt) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime(),
    )[0];

  const handleDownloadVoucher = async () => {
    if (!upcomingPaidBooking) return;
    try {
      await bookingService.downloadVoucher(upcomingPaidBooking.id);
      toast({
        title: "Voucher téléchargé",
        description: `Réservation ${upcomingPaidBooking.code ?? upcomingPaidBooking.id.slice(0, 8)}.`,
      });
    } catch (err) {
      const e = err as { message?: string };
      toast({
        title: "Téléchargement impossible",
        description: e?.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {upcomingPaidBooking && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("voucherBanner.title")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("voucherBanner.description", {
                code: upcomingPaidBooking.code ?? upcomingPaidBooking.id.slice(0, 8),
                from: upcomingPaidBooking.departure,
                to: upcomingPaidBooking.destination,
              })}
            </p>
            <Button
              size="sm"
              className="mt-2 gap-1 text-xs"
              variant="outline"
              onClick={handleDownloadVoucher}
            >
              <Download className="h-3 w-3" /> {t("voucherBanner.downloadButton")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={CalendarDays} label={t("dashboard.totalTransfers")} value={bookings.length} />
        </button>
        <button onClick={() => onNavChange("reservations")} className="text-left">
          <StatCard icon={TrendingUp} label={t("dashboard.completedTransfers")} value={bookings.filter(b => b.status === "completed").length} />
        </button>
        <button onClick={() => onNavChange("invoices")} className="text-left">
          <StatCard icon={FileSpreadsheet} label={t("dashboard.totalBilled")} value={`${totalSpent} TND`} />
        </button>
      </div>

      {active === "reservations" && <ReservationsHub bookings={bookings} />}
      {active === "invoices" && <MonthlyInvoicesView />}
      {active === "payments" && <PaymentsHistory payments={payments} />}
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

// Icônes selon le type renvoyé par le backend (info / promo / alert / booking / payment / voucher).
const notifIconByType: Record<string, { icon: typeof Bell; color: string }> = {
  booking: { icon: CalendarDays, color: "text-primary bg-primary/10" },
  reservation: { icon: CalendarDays, color: "text-primary bg-primary/10" },
  payment: { icon: CreditCard, color: "text-accent bg-accent/10" },
  confirmation: { icon: CheckCircle2, color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  voucher: { icon: Receipt, color: "text-primary bg-primary/10" },
  info: { icon: Bell, color: "text-primary bg-primary/10" },
  promo: { icon: Bell, color: "text-accent bg-accent/10" },
  alert: { icon: AlertCircle, color: "text-destructive bg-destructive/10" },
};

const formatRelativeTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString("fr-FR");
};

const NotificationsView = ({ onNavChange }: { onNavChange: (id: string) => void }) => {
  const { t } = useLocale();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.listMine();
      setItems(data);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message ?? "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAll(); }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      const err = e as { message?: string };
      toast({
        title: "Action impossible",
        description: err.message ?? "Réessaie.",
        variant: "destructive",
      });
    }
  };

  const handleClick = async (n: UserNotification) => {
    if (!n.read) {
      try {
        await notificationService.markRead([n.id]);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // silencieux
      }
    }
    // Redirige vers l'onglet correspondant selon le type
    if (n.type === "payment") onNavChange("payments");
    else onNavChange("reservations");
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display font-semibold text-foreground">{t("notifications.title")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("notifications.subtitle")}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          {t("notifications.empty")}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => {
            const cfg = notifIconByType[n.type] || notifIconByType.info;
            const Icon = cfg.icon;
            return (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(n.createdAt)}</span>
                      {n.bookingId && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{n.bookingId.slice(0, 8)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/* ---------- Paramètres du compte (panneau fonctionnel) ---------- */

export const SettingsContent = () => {
  const { user, refresh } = useAuth();
  const { themeMode: ctxThemeMode, setThemeMode } = useTheme();
  const { locale: ctxLocale, setLocale, t } = useLocale();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [preferences, setPreferences] = useState({
    locale: ctxLocale,
    themeMode: ctxThemeMode,
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Resync local state si user change (après refresh par exemple)
  useEffect(() => {
    if (!user) return;
    setProfile({
      fullName: user.fullName || user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    });
    setPreferences({
      locale: (user as any).locale || "fr",
      themeMode: (user as any).themeMode || "system",
    });
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await authService.updateProfile({
        fullName: profile.fullName.trim() || undefined,
        email: profile.email.trim().toLowerCase() || undefined,
        phone: profile.phone.trim() || undefined,
        address: profile.address.trim() || undefined,
      });
      await refresh();
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch (err: any) {
      toast({
        title: "Échec de la mise à jour",
        description: err?.data?.message || err?.message || "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await authService.updatePreferences(preferences);
      await refresh();
      toast({ title: "Préférences enregistrées", description: "Tes choix ont été pris en compte." });
    } catch (err: any) {
      toast({
        title: "Échec",
        description: err?.data?.message || err?.message || "Réessaie.",
        variant: "destructive",
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwd.next.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast({
        title: "Confirmation incorrecte",
        description: "Les deux mots de passe doivent être identiques.",
        variant: "destructive",
      });
      return;
    }
    setSavingPwd(true);
    try {
      await authService.changePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "", confirm: "" });
      toast({ title: "Mot de passe modifié", description: "Tu peux maintenant te connecter avec le nouveau." });
    } catch (err: any) {
      toast({
        title: "Échec du changement",
        description: err?.data?.message || err?.message || "Vérifie ton ancien mot de passe.",
        variant: "destructive",
      });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">{t("settings.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Profil */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">{t("settings.sections.personalInfo")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.fullName")}</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.email")}</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.phone")}</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+216 XX XXX XXX"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.address")}</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t("settings.saveChanges")}
          </Button>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t("settings.sections.changePassword")}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPwd((v) => !v)}
            className="text-xs gap-1.5"
          >
            {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPwd ? t("settings.hide") : t("settings.show")}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.currentPassword")}</label>
            <input
              type={showPwd ? "text" : "password"}
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.newPassword")}</label>
              <input
                type={showPwd ? "text" : "password"}
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={t("settings.passwordMinChars")}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.confirmPassword")}</label>
              <input
                type={showPwd ? "text" : "password"}
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={t("settings.repeatNew")}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={savingPwd || !pwd.current || !pwd.next}
            className="gap-2"
          >
            {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {t("settings.changePasswordBtn")}
          </Button>
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Cog className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">{t("settings.sections.preferences")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.language")}</label>
            <select
              value={preferences.locale}
              onChange={(e) => {
                const next = e.target.value as "fr" | "en" | "es";
                // Applique la langue IMMÉDIATEMENT à toute l'UI
                setLocale(next);
                setPreferences({ ...preferences, locale: next });
              }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("settings.fields.theme")}</label>
            <select
              value={preferences.themeMode}
              onChange={(e) => {
                const next = e.target.value as ThemeMode;
                // Applique le thème IMMÉDIATEMENT à toute l'UI
                setThemeMode(next);
                setPreferences({ ...preferences, themeMode: next });
              }}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="system">{t("settings.themes.system")}</option>
              <option value="light">{t("settings.themes.light")}</option>
              <option value="dark">{t("settings.themes.dark")}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSavePreferences} disabled={savingPrefs} className="gap-2">
            {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t("settings.savePrefs")}
          </Button>
        </div>
      </div>

      {/* Infos compte */}
      <div className="bg-muted/40 rounded-2xl border border-border p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-3.5 w-3.5" />
          <span className="font-semibold">{t("settings.sections.aboutAccount")}</span>
        </div>
        <p>{t("settings.fields.userId")} : <span className="font-mono">{user?.id ?? "—"}</span></p>
        <p>{t("settings.fields.role")} : {user?.role || "—"}</p>
        {user?.account_status && <p>{t("settings.fields.accountStatus")} : {user.account_status}</p>}
      </div>
    </div>
  );
};

export default DashboardPage;
