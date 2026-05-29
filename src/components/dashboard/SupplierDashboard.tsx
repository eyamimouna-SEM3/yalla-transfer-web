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
  CalendarDays, Inbox, Car, Users, DollarSign, Star, BarChart3,
  TrendingUp, Bell, Clock, CheckCircle2, XCircle, Wrench, UserCheck,
  UserX, FileText, MessageSquare, ListChecks, Check, X, ExternalLink, AlertCircle,
} from "lucide-react";
import VehicleManagement from "@/components/dashboard/supplier/VehicleManagement";
import DriverManagement from "@/components/dashboard/supplier/DriverManagement";
import type { Booking } from "@/services/bookingService";
import { offersService } from "@/services/offersService";
import { driverService } from "@/services/driverService";
import { notificationService, type UserNotification } from "@/services/notificationService";
import { ratingService, type RatingAggregate } from "@/services/ratingService";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const chauffeurNav: NavItem[] = [
  { icon: ListChecks, label: "Liste des réservations", id: "requests", badge: 2 },
  { icon: DollarSign, label: "Revenus", id: "revenue" },
  { icon: Star, label: "Évaluations", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications", badge: 3 },
];

const transportNav: NavItem[] = [
  { icon: ListChecks, label: "Liste des réservations", id: "requests", badge: 2 },
  { icon: Car, label: "Gestion des véhicules", id: "vehicles" },
  { icon: Users, label: "Gestion des chauffeurs", id: "drivers" },
  { icon: DollarSign, label: "Revenus & statistiques", id: "revenue" },
  { icon: Star, label: "Qualité & avis", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications", badge: 3 },
];

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
  const navItems = profile === "chauffeur" ? chauffeurNav : transportNav;
  const [activeItem, setActiveItem] = useState("requests");

  // Mapper les bookings réels pour l'affichage. Inclut maintenant pending ET confirmed
  // (confirmed sans driver = encore prenable). Voir DashboardPage qui charge les bonnes données.
  const newRequests = bookings
    .filter(b => (b.status === "pending" || b.status === "confirmed") && !b.assignedDriverId)
    .map(b => ({
      id: b.id,
      client: "Client",
      from: b.departure,
      to: b.destination,
      date: new Date(b.departureAt).toISOString().slice(0, 10),
      time: new Date(b.departureAt).toISOString().slice(11, 16),
      vehicle: b.vehicles?.[0]?.vehicle?.type ?? "",
      price: `${b.totalPrice} TND`,
      status: "new" as const,
    }));

  const acceptedCourses = bookings
    .filter(b => b.status === "confirmed" || b.status === "assigned" || b.status === "driver_en_route" || b.status === "in_progress")
    .map(b => ({
      id: b.id,
      client: "Client",
      from: b.departure,
      to: b.destination,
      date: new Date(b.departureAt).toISOString().slice(0, 10),
      time: new Date(b.departureAt).toISOString().slice(11, 16),
      vehicle: b.vehicles?.[0]?.vehicle?.type ?? "",
      price: `${b.totalPrice} TND`,
      status: b.status as "in_progress" | "completed" | "cancelled",
    }));

  // Utiliser les données réelles dès que l'utilisateur est authentifié (userRole défini),
  // même si la liste est vide. Le mock data est uniquement pour l'aperçu non connecté.
  const isAuthenticated = Boolean(userRole);
  const displayRequests = isAuthenticated ? newRequests : mockNewRequests;
  const displayCourses = isAuthenticated ? acceptedCourses : mockAcceptedCourses;

  return (
    <DashboardLayout
      profile={profile}
      userName={userName}
      navItems={navItems}
      activeItem={activeItem}
      onNavChange={setActiveItem}
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
      {activeItem === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-8">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">⚙ Paramètres du compte</h2>
          <p className="text-muted-foreground">Les paramètres seront disponibles prochainement.</p>
        </div>
      )}
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
  client: string;
  from: string;
  to: string;
  date: string;
  time: string;
  vehicle: string;
  price: string;
  status: string;
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
  return (
  <div className="space-y-4">
    <div>
      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" /> Liste des réservations
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        {useRealData
          ? "Données en temps réel issues du backend. Cliquez sur \"Faire offre\" pour proposer un prix au client."
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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground text-sm">Nouvelles demandes de réservation</h3>
          </div>
          {requests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Aucune réservation en attente.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Réf.</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Trajet</TableHead>
                    <TableHead className="text-xs">Date / Heure</TableHead>
                    <TableHead className="text-xs">Véhicule</TableHead>
                    <TableHead className="text-xs">Prix</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-medium">{r.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs font-semibold">{r.client}</TableCell>
                      <TableCell className="text-xs max-w-[220px]">
                        <div className="truncate"><span className="text-muted-foreground">De :</span> {r.from}</div>
                        <div className="truncate"><span className="text-muted-foreground">À :</span> {r.to}</div>
                      </TableCell>
                      <TableCell className="text-xs">{r.date}<br/><span className="text-muted-foreground">{r.time}</span></TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{r.vehicle}</Badge></TableCell>
                      <TableCell className="text-xs font-semibold text-primary">{r.price}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!useRealData ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => toast({ title: "Démo", description: "Connectez-vous pour interagir avec une vraie réservation." })}
                            >
                              <Check className="h-3 w-3" /> Aperçu
                            </Button>
                          ) : isDriver ? (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => acceptAsDriver(r.id, onRefresh)}
                              >
                                <Check className="h-3 w-3" /> Accepter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => passAsDriver(r.id, onRefresh)}
                              >
                                <X className="h-3 w-3" /> Refuser
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => submitOffer(r.id, r.price, onRefresh)}
                            >
                              <Check className="h-3 w-3" /> Faire offre
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="accepted" className="mt-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground text-sm">Mes courses acceptées</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Réf.</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Trajet</TableHead>
                  <TableHead className="text-xs">Date / Heure</TableHead>
                  <TableHead className="text-xs">Véhicule</TableHead>
                  <TableHead className="text-xs">Prix</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                  <TableHead className="text-xs text-right">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-medium">{c.id}</TableCell>
                    <TableCell className="text-xs font-semibold">{c.client}</TableCell>
                    <TableCell className="text-xs max-w-[220px]">
                      <div className="truncate"><span className="text-muted-foreground">De :</span> {c.from}</div>
                      <div className="truncate"><span className="text-muted-foreground">À :</span> {c.to}</div>
                    </TableCell>
                    <TableCell className="text-xs">{c.date}<br/><span className="text-muted-foreground">{c.time}</span></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{c.vehicle}</Badge></TableCell>
                    <TableCell className="text-xs font-semibold text-primary">{c.price}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.status === "completed" && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15">
                            <Check className="h-3 w-3 text-primary" />
                          </span>
                        )}
                        {c.status === "cancelled" && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive/15">
                            <X className="h-3 w-3 text-destructive" />
                          </span>
                        )}
                        {statusBadge(c.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                        <ExternalLink className="h-3 w-3" /> Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
