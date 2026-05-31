import { useState, useMemo } from "react";
import DashboardLayout, { type NavItem } from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  CalendarDays, Inbox, Car, Users, DollarSign, Star, BarChart3,
  TrendingUp, Bell, Clock, CheckCircle2, XCircle, Wrench, UserCheck,
  UserX, FileText, MessageSquare, ListChecks, Check, X, ExternalLink, AlertCircle,
  MapPin, Phone, Mail, Baby, Accessibility, Luggage, Repeat, CreditCard, Hash,
  Bus, Loader2, UserPlus,
} from "lucide-react";
import type { SupplierFleetDriver } from "@/services/supplierService";
import VehicleManagement from "@/components/dashboard/supplier/VehicleManagement";
import DriverManagement from "@/components/dashboard/supplier/DriverManagement";
import type { Booking } from "@/services/bookingService";
import { offersService } from "@/services/offersService";
import { driverService } from "@/services/driverService";
import { supplierService } from "@/services/supplierService";
import { notificationService, type UserNotification } from "@/services/notificationService";
import { ratingService, type RatingAggregate } from "@/services/ratingService";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { SettingsContent } from "@/pages/DashboardPage";

// Configuration de navigation : les badges sont remplis dynamiquement au
// runtime à partir du nombre réel de réservations disponibles et de notifs
// non lues — voir buildNavItems() plus bas.
const chauffeurNavBase: NavItem[] = [
  { icon: ListChecks, label: "Liste des réservations", id: "requests" },
  { icon: DollarSign, label: "Revenus", id: "revenue" },
  { icon: Star, label: "Évaluations", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications" },
];

const transportNavBase: NavItem[] = [
  { icon: ListChecks, label: "Liste des réservations", id: "requests" },
  { icon: Car, label: "Gestion des véhicules", id: "vehicles" },
  { icon: Users, label: "Gestion des chauffeurs", id: "drivers" },
  { icon: DollarSign, label: "Revenus & statistiques", id: "revenue" },
  { icon: Star, label: "Qualité & avis", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications" },
];

const buildNavItems = (
  profile: "chauffeur" | "transport",
  requestsCount: number,
  unreadCount: number,
): NavItem[] => {
  const base = profile === "chauffeur" ? chauffeurNavBase : transportNavBase;
  return base.map((item) => {
    if (item.id === "requests" && requestsCount > 0) {
      return { ...item, badge: requestsCount };
    }
    if (item.id === "notifications" && unreadCount > 0) {
      return { ...item, badge: unreadCount };
    }
    return item;
  });
};

interface Props {
  profile: "chauffeur" | "transport";
  userName: string;
  bookings?: Booking[];
  /** Rôle réel renvoyé par le backend (driver_independent, driver_employee, supplier). */
  userRole?: string;
  /** ID utilisateur — nécessaire pour fetcher ratings + revenus. */
  userId?: string;
  /** À appeler après une action (accept / faire offre) pour rafraîchir la liste. */
  onRefresh?: () => void;
}

// ============== MOCK DATA ==============
const mockNewRequests = [
  { id: "REQ-101", client: "A. Ben S.", from: "Aéroport Tunis-Carthage", to: "Hôtel El Mouradi Gammarth", date: "2026-04-22", time: "10:30", vehicle: "SEDAN", price: "85 TND", status: "new" },
  { id: "REQ-102", client: "M. Trabelsi", from: "Sousse Centre", to: "Aéroport Enfidha", date: "2026-04-23", time: "06:00", vehicle: "VAN", price: "120 TND", status: "new" },
];

const mockAcceptedCourses = [
  { id: "CRS-200", client: "S. Khelifi", from: "Hammamet", to: "Aéroport Tunis", date: "2026-04-20", time: "14:00", vehicle: "SEDAN", price: "75 TND", status: "in_progress" },
  { id: "CRS-201", client: "K. Mejri", from: "Djerba Houmt Souk", to: "Hôtel Radisson", date: "2026-04-19", time: "09:00", vehicle: "ECO", price: "45 TND", status: "completed" },
  { id: "CRS-202", client: "L. Bouzid", from: "Monastir Aéroport", to: "Mahdia", date: "2026-04-18", time: "16:30", vehicle: "VAN", price: "95 TND", status: "cancelled" },
];

const mockReviews = [
  { id: 1, client: "S. K.", rating: 5, date: "2026-04-15", comment: "Chauffeur très professionnel, ponctuel et véhicule très propre. Je recommande vivement !" },
  { id: 2, client: "M. T.", rating: 4, date: "2026-04-10", comment: "Très bonne expérience dans l'ensemble. Conduite agréable." },
  { id: 3, client: "A. B.", rating: 5, date: "2026-04-05", comment: "Service impeccable du début à la fin. Merci !" },
  { id: 4, client: "L. B.", rating: 3, date: "2026-04-01", comment: "Correct mais un peu en retard." },
];

const mockNotifications = [
  { id: 1, type: "clickable", icon: Inbox, title: "Nouvelle réservation reçue", desc: "REQ-101 — A. Ben S. — Aéroport → Gammarth", time: "Il y a 5 min", action: "requests" },
  { id: 2, type: "clickable", icon: Clock, title: "Client en attente de confirmation", desc: "REQ-102 — M. Trabelsi attend votre réponse", time: "Il y a 20 min", action: "requests" },
  { id: 3, type: "info", icon: DollarSign, title: "Paiement reçu", desc: "+ 75 TND pour la course CRS-200", time: "Il y a 2 h" },
  { id: 4, type: "info", icon: XCircle, title: "Course annulée", desc: "CRS-202 — Annulation par le client", time: "Hier" },
  { id: 5, type: "info", icon: CheckCircle2, title: "Course terminée avec succès", desc: "CRS-201 — Note client : 5 ★", time: "Il y a 2 jours" },
];

// ============== COMPONENT ==============
const SupplierDashboard = ({ profile, userName, bookings = [], userRole = "", userId = "", onRefresh }: Props) => {
  const [activeItem, setActiveItem] = useState("requests");
  // Compteur de notifications non lues — alimenté par le NotificationsSection
  // qui charge ses propres données via notificationService.listMine().
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Récupère le nombre de notifications non lues au chargement du dashboard
  // et après chaque changement d'onglet (au cas où l'utilisateur a marqué
  // des notifs comme lues entre temps).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await notificationService.listMine();
        if (!cancelled) {
          setUnreadNotifications(list.filter((n) => !n.read).length);
        }
      } catch {
        // silencieux — pas critique pour l'affichage
      }
    })();
    return () => { cancelled = true; };
  }, [activeItem]);

  // Mapper les bookings réels pour l'affichage. Inclut maintenant pending ET confirmed
  // (confirmed sans driver = encore prenable). Voir DashboardPage qui charge les bonnes données.
  // Sérialise un booking backend en RequestRow enrichie consommée par
  // RequestsSection (utilisé à la fois par les sociétés de transport et
  // les chauffeurs indépendants).
  const toRequestRow = (b: Booking, status: string): RequestRow => ({
    id: b.id,
    code: b.code,
    client: b.passengerName?.trim() || "Client",
    from: b.departure,
    to: b.destination,
    date: new Date(b.departureAt).toISOString().slice(0, 10),
    time: new Date(b.departureAt).toISOString().slice(11, 16),
    vehicle: b.vehicles?.[0]?.vehicle?.type ?? "",
    vehicleCategory: b.vehicles?.[0]?.vehicle?.category ?? b.vehicles?.[0]?.vehicleId,
    price: `${b.totalPrice} TND`,
    status,
    passengerName: b.passengerName,
    passengerEmail: b.passengerEmail,
    passengerPhone: b.passengerPhone,
    passengers: b.passengers,
    largeLuggage: b.largeLuggage,
    smallLuggage: b.smallLuggage,
    babySeat: b.babySeat,
    pmr: b.pmr,
    roundTrip: b.roundTrip,
    returnAt: b.returnAt,
    notes: b.notes,
    paymentStatus: b.payment?.status,
    paymentMethod: b.payment?.method,
    createdAt: b.createdAt,
    assignedDriverId: b.assignedDriverId,
  });

  // Sépare les bookings en deux paniers indépendants :
  //
  // - "Nouvelles demandes" (onglet Réservations) = pool disponible
  //   à l'acceptation. On exclut explicitement les courses déjà prises
  //   par CE supplier (handledBySupplierId === userId) : sinon la carte
  //   restait visible après le clic Accepter et le bouton ne semblait pas
  //   réagir.
  //
  // - "Courses acceptées" (onglet Courses acceptées) = bookings que le
  //   supplier a explicitement acceptés (handledBySupplierId === userId).
  //   Cela ne dépend plus du statut tant que la course est encore active.
  const isInActivePool = (b: Booking) =>
    !b.handledBySupplierId &&
    !b.assignedDriverId &&
    (b.status === "pending" || b.status === "confirmed");

  // "À moi" : pour un supplier on regarde handledBySupplierId, pour un
  // chauffeur (indépendant ou employé) on regarde assignedDriverId.
  const driverRole = userRole === "driver_independent" || userRole === "driver_employee";
  const isMine = (b: Booking) => {
    if (!userId) return false;
    if (driverRole) return b.assignedDriverId === userId;
    return b.handledBySupplierId === userId;
  };

  // Tous les statuts qui apparaissent dans l'onglet "Courses acceptées"
  // (du moment où le supplier les accepte jusqu'à leur fin). On inclut
  // désormais "completed" et "cancelled" pour que la trace de la course
  // reste visible une fois terminée — un sous-filtre permet de basculer
  // entre actives / terminées.
  const isVisibleStatus = (s: string) =>
    s === "confirmed" ||
    s === "assigned" ||
    s === "driver_en_route" ||
    s === "arrived" ||
    s === "in_progress" ||
    s === "completed" ||
    s === "cancelled";

  const newRequests = bookings
    .filter(isInActivePool)
    .map(b => toRequestRow(b, "new"));

  const acceptedCourses = bookings
    .filter(b => isMine(b) && isVisibleStatus(b.status))
    .map(b => toRequestRow(b, b.status));

  // Utiliser les données réelles dès que l'utilisateur est authentifié (userRole défini),
  // même si la liste est vide. Le mock data est uniquement pour l'aperçu non connecté.
  const isAuthenticated = Boolean(userRole);
  const displayRequests = isAuthenticated ? newRequests : mockNewRequests;
  const displayCourses = isAuthenticated ? acceptedCourses : mockAcceptedCourses;

  // Calcul dynamique des badges de la sidebar : on affiche le vrai compte
  // de réservations disponibles et de notifications non lues.
  const navItems = buildNavItems(
    profile,
    isAuthenticated ? newRequests.length : 0,
    isAuthenticated ? unreadNotifications : 0,
  );

  return (
    <DashboardLayout
      profile={profile}
      userName={userName}
      navItems={navItems}
      activeItem={activeItem}
      onNavChange={setActiveItem}
      unreadNotifications={isAuthenticated ? unreadNotifications : 0}
    >
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
          👋 Bienvenue, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos transferts, véhicules et revenus depuis votre espace fournisseur.
        </p>
      </div>

      {activeItem === "requests" && <RequestsSection requests={displayRequests} courses={displayCourses} useRealData={isAuthenticated} userRole={userRole} onRefresh={onRefresh} />}
      {activeItem === "vehicles" && <VehicleManagement />}
      {activeItem === "drivers" && <DriverManagement />}
      {activeItem === "revenue" && <RevenueSection bookings={bookings} isAuthenticated={isAuthenticated} />}
      {activeItem === "ratings" && <RatingsSection userId={userId} userRole={userRole} isAuthenticated={isAuthenticated} />}
      {activeItem === "notifications" && <NotificationsSection onNav={setActiveItem} isAuthenticated={isAuthenticated} />}
      {activeItem === "settings" && <SettingsContent />}
    </DashboardLayout>
  );
};

// ============== OVERVIEW ==============
const OverviewSection = ({ profile, onNav }: { profile: string; onNav: (id: string) => void }) => (
  <div className="space-y-6">
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-primary" /> Statistiques Transferts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={CalendarDays} label="Aujourd'hui" value={3} />
        <StatCard icon={Clock} label="En attente" value={2} />
        <StatCard icon={CheckCircle2} label="Confirmés" value={5} />
        <StatCard icon={TrendingUp} label="Terminés" value={12} />
        <StatCard icon={XCircle} label="Annulés" value={1} />
      </div>
    </div>

    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" /> Revenus
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Aujourd'hui" value="240 TND" />
        <StatCard icon={DollarSign} label="Ce mois" value="3 850 TND" />
        <StatCard icon={DollarSign} label="Total" value="18 420 TND" />
      </div>
    </div>

    {profile === "transport" && (
      <>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" /> Flotte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={CheckCircle2} label="Disponibles" value={4} />
            <StatCard icon={Car} label="Occupés" value={2} />
            <StatCard icon={Wrench} label="En maintenance" value={1} />
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Chauffeurs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={UserCheck} label="Actifs" value={6} />
            <StatCard icon={Car} label="En course" value={2} />
            <StatCard icon={UserX} label="Hors ligne" value={3} />
          </div>
        </div>
      </>
    )}

    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" /> Qualité
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard icon={Star} label="Note moyenne" value="4.6 / 5" />
        <StatCard icon={MessageSquare} label="Avis clients" value={mockReviews.length} />
      </div>
    </div>

    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" /> Activité récente
      </h2>
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <ActivityRow icon={Inbox} label="Dernières réservations" value={`${mockNewRequests.length} nouvelles`} />
        <ActivityRow icon={FileText} label="Dernières offres envoyées" value="3 cette semaine" />
        <ActivityRow icon={CheckCircle2} label="Dernières courses terminées" value="12 ce mois" />
      </div>
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={() => onNav("requests")} className="gap-2">
          <ListChecks className="h-4 w-4" /> Voir mes demandes
        </Button>
      </div>
    </div>
  </div>
);

const ActivityRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <span className="text-sm text-muted-foreground">{value}</span>
  </div>
);

// ============== REQUESTS (Tabs) ==============
const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: React.ElementType }> = {
    new: { label: "Nouvelle", variant: "secondary" },
    in_progress: { label: "En cours", variant: "default" },
    completed: { label: "Terminée", variant: "outline", icon: Check },
    cancelled: { label: "Annulée", variant: "destructive", icon: X },
  };
  const s = map[status] || map.new;
  const Icon = s.icon;
  return (
    <Badge variant={s.variant} className="text-[10px] gap-1">
      {Icon && <Icon className="h-3 w-3" />} {s.label}
    </Badge>
  );
};

interface RequestRow {
  id: string;
  code?: string;
  client: string;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicle: string;
  /** Catégorie brute du véhicule (eco/sedan/van/minibus/bus/...) — utilisée
   *  pour filtrer les chauffeurs par catégorie de permis lors de l'assignation. */
  vehicleCategory?: string;
  price: string;
  status: string;
  // Infos supplémentaires affichées dans la liste de cartes pour aider la
  // société/le chauffeur indépendant à décider d'accepter ou non.
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  passengers?: number;
  largeLuggage?: number;
  smallLuggage?: number;
  babySeat?: boolean;
  pmr?: boolean;
  roundTrip?: boolean;
  returnAt?: string | null;
  notes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt?: string;
  /** Identifiant du chauffeur affecté (null si pas encore assigné). */
  assignedDriverId?: string | null;
}

const submitOffer = async (bookingId: string, priceStr: string, onDone?: () => void) => {
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(price) || price <= 0) {
    toast({ title: "Prix invalide", description: "Impossible de soumettre l'offre.", variant: "destructive" });
    return;
  }
  try {
    await offersService.create({ bookingId, price });
    toast({ title: "Offre envoyée", description: `Le client a été notifié de votre proposition à ${price} TND.` });
    onDone?.();
  } catch (e) {
    const err = e as { message?: string; status?: number };
    toast({
      title: "Envoi impossible",
      description: err.status === 409
        ? "Vous avez déjà fait une offre sur cette réservation."
        : err.message ?? "Réessaie dans un instant.",
      variant: "destructive",
    });
  }
};

// Le fournisseur (société) accepte directement une nouvelle réservation client.
// La réservation passe de "pending" à "confirmed" et lui est rattachée.
// Il pourra ensuite assigner un de ses chauffeurs.
const acceptAsSupplier = async (bookingId: string, onDone?: () => void) => {
  try {
    await supplierService.acceptBooking(bookingId);
    toast({
      title: "Réservation acceptée",
      description: "La réservation vous est désormais affectée. Vous pouvez maintenant lui assigner un chauffeur.",
    });
    onDone?.();
  } catch (e) {
    const err = e as { message?: string; status?: number };
    toast({
      title: "Acceptation impossible",
      description: err.status === 400
        ? err.message ?? "Cette réservation a déjà été acceptée par un autre fournisseur."
        : err.message ?? "Réessaie dans un instant.",
      variant: "destructive",
    });
  }
};

/**
 * Le supplier assigne un de ses chauffeurs à une course acceptée.
 * - Backend : POST /supplier/bookings/:id/assign-driver
 * - Le booking passe en statut `assigned`, le chauffeur est notifié.
 */
const assignDriverToBooking = async (
  bookingId: string,
  driverId: string,
  driverName: string,
  onDone?: () => void,
) => {
  try {
    await supplierService.assignDriver(bookingId, driverId);
    toast({
      title: "Chauffeur assigné",
      description: `${driverName} a été affecté à cette course.`,
    });
    onDone?.();
  } catch (e) {
    const err = e as { message?: string; status?: number };
    toast({
      title: "Assignation impossible",
      description: err.message ?? "Réessaie dans un instant.",
      variant: "destructive",
    });
  }
};

const acceptAsDriver = async (bookingId: string, onDone?: () => void) => {
  try {
    await driverService.acceptBooking(bookingId);
    toast({ title: "Course acceptée", description: "Tu es maintenant assigné à cette réservation." });
    onDone?.();
  } catch (e) {
    const err = e as { message?: string; status?: number };
    toast({
      title: "Acceptation impossible",
      description: err.message ?? "Cette course n'est plus disponible.",
      variant: "destructive",
    });
  }
};

const passAsDriver = async (bookingId: string, onDone?: () => void) => {
  try {
    await driverService.passBooking(bookingId);
    toast({ title: "Course refusée", description: "Elle ne te sera plus proposée en priorité." });
    onDone?.();
  } catch (e) {
    const err = e as { message?: string };
    toast({ title: "Refus impossible", description: err.message ?? "Réessaie.", variant: "destructive" });
  }
};

/**
 * Carte détaillée d'une demande de réservation, affichée dans la "Liste
 * des réservations". Présente toutes les informations utiles que le client
 * a renseignées (passager, trajet, options, paiement) et propose au
 * supplier d'accepter la course, ou au chauffeur indépendant d'accepter
 * ou refuser.
 */
const RequestCard = ({
  r, isDriver, useRealData, onRefresh,
}: {
  r: RequestRow;
  isDriver: boolean;
  useRealData: boolean;
  onRefresh?: () => void;
}) => {
  // Format relatif "il y a X min/h/j" pour l'horodatage de création.
  const ago = (() => {
    if (!r.createdAt) return null;
    const ms = Date.now() - new Date(r.createdAt).getTime();
    const min = Math.max(0, Math.round(ms / 60000));
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const d = Math.round(h / 24);
    return `il y a ${d} j`;
  })();

  const displayCode = r.code || `#${r.id.slice(0, 8)}`;
  const luggageTotal = (r.largeLuggage ?? 0) + (r.smallLuggage ?? 0);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/30 transition-colors">
      {/* En-tête : référence + statut + ancienneté */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono font-semibold text-foreground">{displayCode}</span>
          {ago && (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {ago}
            </span>
          )}
        </div>
        {statusBadge(r.status)}
      </div>

      {/* Corps : grille 2 colonnes (trajet + passager) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloc trajet */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            Trajet demandé
          </p>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{r.from}</p>
              <p className="text-xs text-muted-foreground">Départ</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{r.to}</p>
              <p className="text-xs text-muted-foreground">Arrivée</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {r.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {r.time}
            </span>
            {r.roundTrip && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Repeat className="h-3.5 w-3.5" /> Aller-retour
              </span>
            )}
          </div>
          {r.roundTrip && r.returnAt && (
            <p className="text-xs text-muted-foreground pl-5">
              Retour : {new Date(r.returnAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
            </p>
          )}
        </div>

        {/* Bloc passager + contact */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">
            Client
          </p>
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="font-semibold text-foreground truncate">
              {r.passengerName?.trim() || r.client || "Client"}
            </p>
          </div>
          {r.passengerPhone && (
            <a href={`tel:${r.passengerPhone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono">{r.passengerPhone}</span>
            </a>
          )}
          {r.passengerEmail && (
            <a href={`mailto:${r.passengerEmail}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors min-w-0">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{r.passengerEmail}</span>
            </a>
          )}
        </div>
      </div>

      {/* Bandeau besoins (passagers, bagages, options, véhicule) */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[11px] gap-1">
          <Users className="h-3 w-3" /> {r.passengers ?? "?"} passager{(r.passengers ?? 0) > 1 ? "s" : ""}
        </Badge>
        {luggageTotal > 0 && (
          <Badge variant="outline" className="text-[11px] gap-1">
            <Luggage className="h-3 w-3" /> {luggageTotal} bagage{luggageTotal > 1 ? "s" : ""}
            {(r.largeLuggage ?? 0) > 0 && (r.smallLuggage ?? 0) > 0 && (
              <span className="text-muted-foreground">({r.largeLuggage}G+{r.smallLuggage}P)</span>
            )}
          </Badge>
        )}
        {r.babySeat && (
          <Badge variant="outline" className="text-[11px] gap-1 bg-accent/10 border-accent/30 text-accent">
            <Baby className="h-3 w-3" /> Siège bébé
          </Badge>
        )}
        {r.pmr && (
          <Badge variant="outline" className="text-[11px] gap-1 bg-primary/10 border-primary/30 text-primary">
            <Accessibility className="h-3 w-3" /> PMR
          </Badge>
        )}
        {r.vehicle && (
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Car className="h-3 w-3" /> {r.vehicle}
          </Badge>
        )}
        {r.paymentStatus && (
          <Badge
            variant="outline"
            className={`text-[11px] gap-1 ${
              r.paymentStatus === "paid"
                ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <CreditCard className="h-3 w-3" />
            {r.paymentStatus === "paid" ? "Payé" : "Paiement en attente"}
            {r.paymentMethod && ` · ${r.paymentMethod}`}
          </Badge>
        )}
      </div>

      {/* Pied : prix + actions */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Montant proposé</p>
          <p className="font-display text-lg font-bold text-primary">{r.price}</p>
        </div>
        <div className="flex items-center gap-2">
          {!useRealData ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => toast({ title: "Démo", description: "Connectez-vous pour interagir avec une vraie réservation." })}
            >
              <Check className="h-3 w-3" /> Aperçu
            </Button>
          ) : isDriver ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={() => passAsDriver(r.id, onRefresh)}
              >
                <X className="h-3 w-3" /> Refuser
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => acceptAsDriver(r.id, onRefresh)}
              >
                <Check className="h-3 w-3" /> Accepter la course
              </Button>
            </>
          ) : (
            // Société de transport : un seul bouton "Accepter" qui passe la
            // réservation en "confirmed" et la lui attribue (elle pourra
            // ensuite assigner un de ses chauffeurs).
            <Button
              size="sm"
              className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => acceptAsSupplier(r.id, onRefresh)}
            >
              <Check className="h-3 w-3" /> Accepter la réservation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Détermine quelle catégorie de permis de conduire est nécessaire pour
 * conduire le véhicule demandé par la course. Minibus et bus exigent le
 * permis D ; tous les autres véhicules légers se contentent du permis B.
 *
 * Les chauffeurs sans `vehicleType` valide en base sont considérés comme
 * permis B par défaut (cas le plus fréquent).
 */
const requiredLicenseFor = (vehicleCategory: string | undefined): "license_b" | "license_d" => {
  const cat = (vehicleCategory ?? "").toLowerCase().trim();
  if (cat === "minibus" || cat === "bus" || cat === "autocar") return "license_d";
  return "license_b";
};

const normalizeDriverLicense = (raw: string | null | undefined): "license_b" | "license_d" => {
  if (!raw) return "license_b";
  const v = raw.trim().toLowerCase();
  if (v === "license_d" || v === "d" || v === "bus" || v === "minibus") return "license_d";
  return "license_b";
};

/**
 * Dialog permettant au supplier de choisir un chauffeur disponible parmi
 * son équipe pour l'affecter à la course. Filtre automatiquement les
 * chauffeurs incompatibles avec la catégorie de permis requise. Affiche
 * un avertissement clair si aucun chauffeur compatible n'est trouvé.
 */
const AssignDriverDialog = ({
  open, onOpenChange, course, onAssigned,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  course: RequestRow | null;
  onAssigned?: () => void;
}) => {
  const [drivers, setDrivers] = useState<SupplierFleetDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setLoading(true);
    supplierService.fleetDrivers()
      .then((data) => setDrivers(data))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, [open]);

  const requiredLicense = requiredLicenseFor(course?.vehicleCategory);
  const eligibleDrivers = drivers.filter((d) => {
    const licenseOk = normalizeDriverLicense(d.vehicleType) === requiredLicense;
    const activeOk = d.accountStatus !== "suspended";
    const validatedOk = d.driverValidated !== false;
    return licenseOk && activeOk && validatedOk;
  });

  const handleConfirm = async () => {
    if (!selected || !course) return;
    const driver = drivers.find((d) => d.id === selected);
    if (!driver) return;
    setSubmitting(true);
    try {
      await assignDriverToBooking(course.id, driver.id, driver.fullName, onAssigned);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Assigner un chauffeur
          </DialogTitle>
          <DialogDescription>
            Course <span className="font-mono">{course?.code || course?.id.slice(0, 8)}</span> · {course?.from} → {course?.to}
            <br />
            <span className="text-xs">
              Permis requis :{" "}
              {requiredLicense === "license_d" ? (
                <span className="inline-flex items-center gap-1 font-semibold text-accent">
                  <Bus className="h-3 w-3" /> Permis D (minibus / bus)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <Car className="h-3 w-3" /> Permis B (voitures, vans, 4×4)
                </span>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto -mx-1 px-1">
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : eligibleDrivers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Aucun chauffeur compatible n'est disponible dans votre flotte pour cette catégorie de permis.
              {requiredLicense === "license_d" && (
                <span className="block mt-1 text-xs">
                  Ajoutez ou validez un chauffeur titulaire du permis D depuis Gestion des chauffeurs.
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleDrivers.map((d) => {
                const isSelected = selected === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{d.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.phone ?? "—"}
                          {d.licenseNumber && ` · ${d.licenseNumber}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {d.driverOnline ? (
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> En ligne
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Hors ligne</Badge>
                        )}
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Confirmer l'assignation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Carte d'une course déjà acceptée par le supplier. Réutilise la mise en page
 * de RequestCard pour la cohérence visuelle, mais remplace le bouton
 * « Accepter » par les actions de gestion : Assigner un chauffeur, et
 * affichage du chauffeur déjà affecté le cas échéant.
 */
const AcceptedCourseCard = ({
  r, onRefresh,
}: {
  r: RequestRow;
  onRefresh?: () => void;
}) => {
  const [assignOpen, setAssignOpen] = useState(false);
  const displayCode = r.code || `#${r.id.slice(0, 8)}`;
  const luggageTotal = (r.largeLuggage ?? 0) + (r.smallLuggage ?? 0);
  const hasDriver = !!r.assignedDriverId;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono font-semibold text-foreground">{displayCode}</span>
        </div>
        {statusBadge(r.status)}
      </div>

      {/* Trajet + Client */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">Trajet</p>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="font-medium text-foreground truncate">{r.from}</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="font-medium text-foreground truncate">{r.to}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {r.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {r.time}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide">Client</p>
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="font-semibold text-foreground truncate">
              {r.passengerName?.trim() || r.client || "Client"}
            </p>
          </div>
          {r.passengerPhone && (
            <a href={`tel:${r.passengerPhone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono">{r.passengerPhone}</span>
            </a>
          )}
          {r.passengerEmail && (
            <a href={`mailto:${r.passengerEmail}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors min-w-0">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{r.passengerEmail}</span>
            </a>
          )}
        </div>
      </div>

      {/* Badges besoins */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[11px] gap-1">
          <Users className="h-3 w-3" /> {r.passengers ?? "?"} passager{(r.passengers ?? 0) > 1 ? "s" : ""}
        </Badge>
        {luggageTotal > 0 && (
          <Badge variant="outline" className="text-[11px] gap-1">
            <Luggage className="h-3 w-3" /> {luggageTotal} bagage{luggageTotal > 1 ? "s" : ""}
          </Badge>
        )}
        {r.babySeat && (
          <Badge variant="outline" className="text-[11px] gap-1 bg-accent/10 border-accent/30 text-accent">
            <Baby className="h-3 w-3" /> Siège bébé
          </Badge>
        )}
        {r.pmr && (
          <Badge variant="outline" className="text-[11px] gap-1 bg-primary/10 border-primary/30 text-primary">
            <Accessibility className="h-3 w-3" /> PMR
          </Badge>
        )}
        {r.vehicle && (
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Car className="h-3 w-3" /> {r.vehicle}
          </Badge>
        )}
        {r.paymentStatus && (
          <Badge variant="outline" className={`text-[11px] gap-1 ${
            r.paymentStatus === "paid"
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}>
            <CreditCard className="h-3 w-3" />
            {r.paymentStatus === "paid" ? "Payé" : "Paiement en attente"}
          </Badge>
        )}
      </div>

      {/* Pied : prix + actions chauffeur */}
      <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Montant</p>
          <p className="font-display text-lg font-bold text-primary">{r.price}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasDriver ? (
            <Badge variant="outline" className="text-[11px] gap-1 bg-primary/10 border-primary/30 text-primary px-2.5 py-1">
              <UserCheck className="h-3.5 w-3.5" /> Chauffeur assigné
            </Badge>
          ) : (
            <Button
              size="sm"
              className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setAssignOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" /> Assigner un chauffeur
            </Button>
          )}
        </div>
      </div>

      <AssignDriverDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        course={r}
        onAssigned={onRefresh}
      />
    </div>
  );
};

const RequestsSection = ({
  requests, courses, useRealData, userRole = "", onRefresh,
}: {
  requests: RequestRow[];
  courses: RequestRow[];
  useRealData: boolean;
  userRole?: string;
  onRefresh?: () => void;
}) => {
  const isDriver = userRole === "driver_independent" || userRole === "driver_employee";

  // Sous-classification de l'onglet "Courses acceptées" pour la société
  // de transport. Permet de distinguer rapidement les courses qui exigent
  // une action (assigner un chauffeur) de celles déjà en mouvement.
  type AcceptedFilter = "all" | "toAssign" | "assigned" | "ongoing" | "completed" | "cancelled";
  const [acceptedFilter, setAcceptedFilter] = useState<AcceptedFilter>("all");

  const isToAssign = (c: RequestRow) => !c.assignedDriverId && c.status === "confirmed";
  const isAssigned = (c: RequestRow) => !!c.assignedDriverId && c.status === "assigned";
  // Pour le chauffeur, "En cours" englobe TOUT ce qui n'est ni terminé ni
  // annulé (de l'instant où il accepte → trajet en route → trajet en cours).
  const isOngoing = (c: RequestRow) =>
    isDriver
      ? c.status === "assigned" ||
        c.status === "driver_en_route" ||
        c.status === "arrived" ||
        c.status === "in_progress" ||
        c.status === "confirmed"
      : c.status === "driver_en_route" ||
        c.status === "arrived" ||
        c.status === "in_progress";
  const isCompleted = (c: RequestRow) => c.status === "completed";
  const isCancelled = (c: RequestRow) => c.status === "cancelled";

  const counts = {
    all: courses.length,
    toAssign: courses.filter(isToAssign).length,
    assigned: courses.filter(isAssigned).length,
    ongoing: courses.filter(isOngoing).length,
    completed: courses.filter(isCompleted).length,
    cancelled: courses.filter(isCancelled).length,
  };

  const filteredCourses = courses.filter((c) => {
    if (acceptedFilter === "all") return true;
    if (acceptedFilter === "toAssign") return isToAssign(c);
    if (acceptedFilter === "assigned") return isAssigned(c);
    if (acceptedFilter === "ongoing") return isOngoing(c);
    if (acceptedFilter === "completed") return isCompleted(c);
    if (acceptedFilter === "cancelled") return isCancelled(c);
    return true;
  });

  return (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" /> Liste des réservations
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {useRealData
          ? (isDriver
              // Chauffeur indépendant : il accepte ou refuse une course
              ? "Données en temps réel. Acceptez ou refusez les courses proposées."
              // Société de transport : elle accepte puis assigne un chauffeur
              : "Données en temps réel. Acceptez une réservation puis assignez-lui un chauffeur de votre flotte.")
          : "Aperçu (données de démonstration). Connectez-vous pour voir vos vraies réservations."}
      </p>
    </div>

    <Tabs defaultValue="reservations" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="reservations" className="gap-2">
          <Inbox className="h-4 w-4" /> Réservations
          <Badge variant="secondary" className="text-[10px] ml-1">{requests.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="accepted" className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Courses acceptées
          <Badge variant="secondary" className="text-[10px] ml-1">{courses.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reservations" className="mt-4">
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground text-sm">
              Nouvelles demandes de réservation
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {requests.length} en attente
            </Badge>
          </div>

          {requests.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune réservation en attente pour le moment.
              </p>
            </div>
          ) : (
            // Liste de cartes détaillées : chaque carte regroupe toutes les
            // informations dont la société / le chauffeur a besoin pour
            // décider s'il accepte ou refuse la course.
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  r={r}
                  isDriver={isDriver}
                  useRealData={useRealData}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="accepted" className="mt-4">
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground text-sm">
              Mes courses acceptées
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {courses.length} active{courses.length > 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Sous-filtres : adaptés selon le rôle. Pour un chauffeur
              indépendant, les statuts "À assigner" et "Affectées" n'ont
              pas de sens (il EST le chauffeur, dès qu'il accepte, la course
              lui est affectée). On expose donc seulement :
              Toutes / En cours / Terminées / Annulées.
              Pour une société de transport, on garde les 6 pills d'origine. */}
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(isDriver
                ? [
                    { id: "all" as const, label: "Toutes", count: counts.all, color: "" },
                    { id: "ongoing" as const, label: "En cours", count: counts.assigned + counts.ongoing, color: "text-green-600" },
                    { id: "completed" as const, label: "Terminées", count: counts.completed, color: "text-primary" },
                    { id: "cancelled" as const, label: "Annulées", count: counts.cancelled, color: "text-destructive" },
                  ]
                : [
                    { id: "all" as const, label: "Toutes", count: counts.all, color: "" },
                    { id: "toAssign" as const, label: "À assigner", count: counts.toAssign, color: "text-accent" },
                    { id: "assigned" as const, label: "Affectées au chauffeur", count: counts.assigned, color: "text-primary" },
                    { id: "ongoing" as const, label: "En cours", count: counts.ongoing, color: "text-green-600" },
                    { id: "completed" as const, label: "Terminées", count: counts.completed, color: "text-primary" },
                    { id: "cancelled" as const, label: "Annulées", count: counts.cancelled, color: "text-destructive" },
                  ]
              ).map((opt) => {
                const isActive = acceptedFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAcceptedFilter(opt.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    {opt.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive ? "bg-primary-foreground/20" : "bg-muted"
                      } ${!isActive ? opt.color : ""}`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {courses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Vous n'avez accepté aucune course pour le moment.
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune course dans cette catégorie.
              </p>
            </div>
          ) : (
            // Cartes détaillées : mêmes infos que pour l'onglet Réservations,
            // mais avec un bouton "Assigner un chauffeur" à la place du bouton
            // Accepter (la course est déjà à nous). Le bouton ouvre un dialog
            // qui filtre les chauffeurs par catégorie de permis compatible
            // avec le véhicule demandé.
            <div className="space-y-3">
              {filteredCourses.map((c) => (
                <AcceptedCourseCard key={c.id} r={c} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  </div>
  );
};

// ============== REVENUE (Day / Week / Month) — DONNÉES RÉELLES ==============
const RevenueSection = ({ bookings, isAuthenticated }: { bookings: Booking[]; isAuthenticated: boolean }) => {
  // Calcul à la volée depuis les bookings réels du chauffeur/supplier
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Seules les courses terminées comptent comme revenu réel
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const bucket = (start: Date, end?: Date) => {
    const list = completedBookings.filter((b) => {
      const d = new Date(b.departureAt || b.createdAt);
      if (d < start) return false;
      if (end && d >= end) return false;
      return true;
    });
    const revenue = list.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
    return { count: list.length, revenue };
  };

  const day = bucket(startOfDay);
  const week = bucket(startOfWeek);
  const month = bucket(startOfMonth);
  const previousMonth = bucket(startOfPreviousMonth, startOfMonth);

  const trend = previousMonth.revenue > 0
    ? `${Math.round(((month.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)}%`
    : undefined;

  const formatTND = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} TND`;
  const avg = (count: number, total: number) => count > 0 ? formatTND(total / count) : "—";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" /> Revenus
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isAuthenticated
            ? "Calculés en temps réel depuis tes courses terminées."
            : "Aperçu — connecte-toi pour voir tes vrais revenus."}
        </p>
      </div>

      <Tabs defaultValue="day" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="day">Jour</TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
          <TabsTrigger value="month">Mois</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={DollarSign} label="Revenu du jour" value={formatTND(day.revenue)} />
            <StatCard icon={CheckCircle2} label="Courses du jour" value={day.count} />
            <StatCard icon={TrendingUp} label="Panier moyen" value={avg(day.count, day.revenue)} />
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={DollarSign} label="Revenu cette semaine" value={formatTND(week.revenue)} />
            <StatCard icon={CheckCircle2} label="Courses cette semaine" value={week.count} />
            <StatCard icon={TrendingUp} label="Panier moyen" value={avg(week.count, week.revenue)} />
          </div>
        </TabsContent>

        <TabsContent value="month" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={DollarSign} label="Revenu ce mois" value={formatTND(month.revenue)} trend={trend} sub={trend ? "vs mois passé" : undefined} />
            <StatCard icon={CheckCircle2} label="Courses ce mois" value={month.count} />
            <StatCard icon={TrendingUp} label="Panier moyen" value={avg(month.count, month.revenue)} />
          </div>
          {month.count === 0 && isAuthenticated && (
            <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucune course terminée ce mois-ci. Tes revenus apparaîtront ici dès que tu finiras une course.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============== RATINGS ==============
const StarsRow = ({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${i <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const RatingsSection = ({ userId, userRole, isAuthenticated }: { userId: string; userRole: string; isAuthenticated: boolean }) => {
  const [data, setData] = useState<RatingAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const isDriver = userRole === "driver_independent" || userRole === "driver_employee";
        const aggregate = isDriver
          ? await ratingService.forDriver(userId)
          : await ratingService.forSupplier(userId);
        if (!cancelled) setData(aggregate);
      } catch (e) {
        const err = e as { message?: string };
        if (!cancelled) setError(err.message ?? "Chargement impossible.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, userRole, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Connecte-toi pour voir tes évaluations clients.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.count ?? 0;
  const avg = data?.averageGlobal != null ? data.averageGlobal.toFixed(1) : "—";
  const totalStars = items.reduce((s, r) => s + (r.globalScore ?? 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" /> Évaluations & avis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Vraies notes laissées par tes clients après chaque course.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border p-5">
          <span className="text-sm text-muted-foreground">Note moyenne</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="font-display text-3xl font-bold text-foreground">{avg}</p>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <div className="mt-2"><StarsRow rating={Math.round(Number(avg) || 0)} /></div>
        </div>
        <StatCard icon={MessageSquare} label="Total avis" value={total} />
        <StatCard icon={Star} label="Étoiles cumulées" value={Math.round(totalStars * 10) / 10} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-2">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-foreground text-sm">Avis clients</h3>
        </div>
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucun avis reçu pour le moment. Ils apparaîtront ici après que tes clients aient noté leurs courses.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((r) => {
              const star = Math.round(r.globalScore ?? 0);
              const initials = r.ratedById?.slice(0, 1).toUpperCase() ?? "?";
              return (
                <div key={r.id} className="p-4 hover:bg-muted/40 transition-colors rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold text-sm">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">Client</span>
                          <StarsRow rating={star} />
                          <span className="text-xs text-muted-foreground">({r.globalScore?.toFixed(1) ?? "—"}/5)</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {r.comment ? (
                        <p className="text-sm text-foreground/90 mt-2 leading-relaxed">{r.comment}</p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground mt-2">Sans commentaire.</p>
                      )}
                      {(r.scorePunctuality || r.scoreVehicle || r.scoreProfessionalism) && (
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {r.scorePunctuality != null && (
                            <span>Ponctualité : <strong className="text-foreground">{r.scorePunctuality}/5</strong></span>
                          )}
                          {r.scoreVehicle != null && (
                            <span>Véhicule : <strong className="text-foreground">{r.scoreVehicle}/5</strong></span>
                          )}
                          {r.scoreProfessionalism != null && (
                            <span>Pro : <strong className="text-foreground">{r.scoreProfessionalism}/5</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============== NOTIFICATIONS — DONNÉES RÉELLES ==============
const iconForType = (type: string) => {
  switch (type) {
    case "booking": return Inbox;
    case "payment": return DollarSign;
    case "info": return MessageSquare;
    case "alert": return AlertCircle;
    case "warning": return AlertCircle;
    default: return Bell;
  }
};

const NotificationsSection = ({ onNav, isAuthenticated }: { onNav: (id: string) => void; isAuthenticated: boolean }) => {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
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

  useEffect(() => { void fetchAll(); }, [isAuthenticated]);

  const markRead = async (id?: string) => {
    try {
      await notificationService.markRead(id ? [id] : undefined);
      setItems((prev) => prev.map((n) => (id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })));
    } catch (e) {
      const err = e as { message?: string };
      toast({ title: "Action impossible", description: err.message ?? "Réessaie.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Connecte-toi pour voir tes notifications.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  // Notifications "cliquables" = celles liées à un booking
  const clickable = unread.filter((n) => n.bookingId);
  const infoUnread = unread.filter((n) => !n.bookingId);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Toutes tes notifications en temps réel.
          </p>
        </div>
        {unread.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => markRead()}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Bell} label="Total" value={items.length} />
        <StatCard icon={Inbox} label="Non lues" value={unread.length} />
        <StatCard icon={CheckCircle2} label="Lues" value={read.length} />
      </div>

      {/* Notifications cliquables (action sur réservation) */}
      {clickable.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground text-sm">Action requise</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">{clickable.length}</Badge>
          </div>
          <div className="divide-y divide-border">
            {clickable.map((n) => {
              const Icon = iconForType(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => { void markRead(n.id); onNav("requests"); }}
                  className="w-full text-left p-4 hover:bg-primary/5 transition-colors flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.createdAt)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notifications informatives non lues */}
      {infoUnread.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground text-sm">Informations</h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{infoUnread.length}</Badge>
          </div>
          <div className="divide-y divide-border">
            {infoUnread.map((n) => {
              const Icon = iconForType(n.type);
              return (
                <div key={n.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => void markRead(n.id)}>
                    <Check className="h-3 w-3" /> Lu
                  </Button>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique lu */}
      {read.length > 0 && (
        <details className="bg-card rounded-2xl border border-border overflow-hidden">
          <summary className="p-4 cursor-pointer flex items-center gap-2 hover:bg-muted/40 transition-colors">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display font-semibold text-foreground text-sm">Historique ({read.length})</h3>
          </summary>
          <div className="divide-y divide-border border-t border-border">
            {read.slice(0, 50).map((n) => {
              const Icon = iconForType(n.type);
              return (
                <div key={n.id} className="p-4 flex items-start gap-3 opacity-60">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {items.length === 0 && !error && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Aucune notification pour le moment.
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;
