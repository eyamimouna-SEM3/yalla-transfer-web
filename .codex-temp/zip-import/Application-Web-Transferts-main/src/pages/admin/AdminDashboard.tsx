import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import {
  CalendarDays,
  Users,
  Repeat2,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const chartData = [
  { name: "Jan", reservations: 45 },
  { name: "Fév", reservations: 72 },
  { name: "Mar", reservations: 98 },
  { name: "Avr", reservations: 134 },
  { name: "Mai", reservations: 167 },
  { name: "Jun", reservations: 210 },
  { name: "Jul", reservations: 289 },
];

const revenueData = [
  { name: "Jan", revenue: 2400 },
  { name: "Fév", revenue: 3800 },
  { name: "Mar", revenue: 5200 },
  { name: "Avr", revenue: 7100 },
  { name: "Mai", revenue: 8900 },
  { name: "Jun", revenue: 11200 },
  { name: "Jul", revenue: 14500 },
];

const recentActivity = [
  { id: "R-1042", client: "Ahmed Ben Salah", type: "B2C", route: "Aéroport Tunis → Hammamet", status: "confirmed", date: "01/03/2026" },
  { id: "R-1041", client: "StarTech Corp.", type: "Corporate", route: "Hôtel Laico → Aéroport", status: "in_progress", date: "01/03/2026" },
  { id: "R-1040", client: "Marie Dupont", type: "B2C", route: "Sidi Bou Saïd → Tunis Centre", status: "completed", date: "28/02/2026" },
  { id: "R-1039", client: "TransMed SA", type: "Corporate", route: "Port La Goulette → Sousse", status: "cancelled", date: "28/02/2026" },
  { id: "R-1038", client: "Karim Jaziri", type: "B2C", route: "Monastir Aéroport → Mahdia", status: "completed", date: "27/02/2026" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmée", variant: "default" },
  in_progress: { label: "En cours", variant: "secondary" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
};

const AdminDashboard = () => (
  <AdminLayout>
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Yalla Transfer</p>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AdminStatCard icon={CalendarDays} label="Total Réservations" value="1 042" trend="+12.5%" sub="vs mois dernier" />
      <AdminStatCard icon={Users} label="Fournisseurs Actifs" value={87} trend="+8" sub="ce mois" />
      <AdminStatCard icon={Repeat2} label="Offres en Attente" value={23} trend="5 nouvelles" sub="aujourd'hui" />
      <AdminStatCard icon={DollarSign} label="Revenus" value="14 500 TND" trend="+29.5%" sub="vs mois dernier" />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">Réservations</h3>
            <p className="text-xs text-muted-foreground">Évolution mensuelle</p>
          </div>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
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
            <p className="text-xs text-muted-foreground">Croissance mensuelle</p>
          </div>
          <DollarSign className="h-4 w-4 text-primary" />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Real-time indicators */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        <div>
          <p className="text-xs text-muted-foreground">En cours</p>
          <p className="font-bold text-foreground text-sm">12 transferts</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
        <Clock className="h-4 w-4 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Temps moyen</p>
          <p className="font-bold text-foreground text-sm">4 min 32s</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        <div>
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="font-bold text-foreground text-sm">23 offres</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
        <Users className="h-4 w-4 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">Connectés</p>
          <p className="font-bold text-foreground text-sm">34 utilisateurs</p>
        </div>
      </div>
    </div>

  </AdminLayout>
);

export default AdminDashboard;
