import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import {
  CalendarDays,
  Users,
  Repeat2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { adminService, type AdminStats, type AdminBooking } from "@/services/adminService";
import { useBookingsRealtime } from "@/hooks/useBookingsRealtime";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmée", variant: "default" },
  assigned: { label: "Assignée", variant: "default" },
  driver_en_route: { label: "Chauffeur en route", variant: "secondary" },
  arrived: { label: "Arrivé", variant: "secondary" },
  in_progress: { label: "En cours", variant: "secondary" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [s, b] = await Promise.all([
        adminService.getStats(),
        adminService.getBookings(),
      ]);
      setStats(s);
      setBookings(b);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      if (err.status === 401 || err.status === 403) {
        setError("Accès refusé : connecte-toi avec un compte administrateur.");
      } else {
        setError(err.message ?? "Impossible de charger les données.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Temps réel : refetch quand une nouvelle réservation ou un changement de statut arrive.
  useBookingsRealtime({
    onCreated: () => { void fetchData(); },
    onStatusChanged: () => { void fetchData(); },
  });

  // Agrégation mensuelle des 12 derniers mois pour les graphiques.
  const { reservationsChart, revenueChart } = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, { reservations: number; revenue: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = { reservations: 0, revenue: 0 };
    }
    for (const b of bookings) {
      const created = new Date(b.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      if (!buckets[key]) continue;
      buckets[key].reservations += 1;
      if (b.status === "completed" || b.status === "in_progress") {
        buckets[key].revenue += Number(b.totalPrice ?? 0);
      }
    }
    const reservationsChart = Object.entries(buckets).map(([key, v]) => {
      const [, m] = key.split("-").map(Number);
      return { name: monthLabels[m], reservations: v.reservations };
    });
    const revenueChart = Object.entries(buckets).map(([key, v]) => {
      const [, m] = key.split("-").map(Number);
      return { name: monthLabels[m], revenue: v.revenue };
    });
    return { reservationsChart, revenueChart };
  }, [bookings]);

  const recentActivity = useMemo(
    () => bookings.slice(0, 5).map((b) => ({
      id: b.code ?? b.id.slice(0, 8),
      client: b.client?.fullName ?? b.passengerName ?? "—",
      route: `${b.departure} → ${b.destination}`,
      status: b.status,
      date: new Date(b.createdAt).toLocaleDateString("fr-FR"),
    })),
    [bookings],
  );

  const inProgressCount = bookings.filter((b) => ["in_progress", "driver_en_route", "arrived"].includes(b.status)).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <p className="font-semibold text-destructive">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Yalla Transfer</p>
      </div>

      {/* KPI Cards — données réelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={CalendarDays}
          label="Total Réservations"
          value={stats?.bookings.total ?? 0}
          sub={`${stats?.bookings.pending ?? 0} en attente`}
        />
        <AdminStatCard
          icon={Users}
          label="Fournisseurs Actifs"
          value={stats?.users.suppliers ?? 0}
          sub={`${stats?.users.drivers ?? 0} chauffeurs`}
        />
        <AdminStatCard
          icon={Repeat2}
          label="Réclamations ouvertes"
          value={stats?.claims.open ?? 0}
          sub="à traiter"
        />
        <AdminStatCard
          icon={DollarSign}
          label="Revenus encaissés"
          value={`${(stats?.revenue.totalPaid ?? 0).toLocaleString("fr-FR")} TND`}
          sub="paiements confirmés"
        />
      </div>

      {/* Charts — données réelles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm">Réservations</h3>
              <p className="text-xs text-muted-foreground">Évolution sur 12 mois</p>
            </div>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reservationsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="reservations" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm">Revenus (TND)</h3>
              <p className="text-xs text-muted-foreground">Encaissements sur 12 mois</p>
            </div>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicateurs temps réel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <div>
            <p className="text-xs text-muted-foreground">En cours</p>
            <p className="font-bold text-foreground text-sm">{inProgressCount} transferts</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="font-bold text-foreground text-sm">{pendingCount} à confirmer</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Réclamations</p>
            <p className="font-bold text-foreground text-sm">{stats?.claims.open ?? 0} ouvertes</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total utilisateurs</p>
            <p className="font-bold text-foreground text-sm">{stats?.users.total ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">Activité récente</h3>
            <p className="text-xs text-muted-foreground">5 dernières réservations</p>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune réservation enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((a) => {
              const s = statusMap[a.status] ?? { label: a.status, variant: "secondary" as const };
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{a.id}</span>
                    <span className="text-sm font-medium text-foreground truncate">{a.client}</span>
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">{a.route}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">{a.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
