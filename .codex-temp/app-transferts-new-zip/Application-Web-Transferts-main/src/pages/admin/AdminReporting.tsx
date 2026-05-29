import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { TrendingUp, TrendingDown, Clock, Star, Users, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const conversionData = [
  { name: "Jan", taux: 62 }, { name: "Fév", taux: 68 }, { name: "Mar", taux: 71 },
  { name: "Avr", taux: 74 }, { name: "Mai", taux: 78 }, { name: "Jun", taux: 82 }, { name: "Jul", taux: 85 },
];

const pieData = [
  { name: "Actifs", value: 72, color: "hsl(var(--primary))" },
  { name: "Inactifs", value: 15, color: "hsl(var(--muted-foreground))" },
  { name: "Suspendus", value: 5, color: "hsl(var(--destructive))" },
];

const supplierTable = [
  { name: "TransMed SA", type: "Transport", responseTime: "1m 45s", rating: 4.8, lastLogin: "01/03/2026", status: "active" },
  { name: "Rapide Transfer", type: "Transport", responseTime: "3m 12s", rating: 4.5, lastLogin: "01/03/2026", status: "active" },
  { name: "Karim Jaziri", type: "Chauffeur", responseTime: "2m 30s", rating: 4.9, lastLogin: "28/02/2026", status: "active" },
  { name: "Slim Bouzid", type: "Chauffeur", responseTime: "8m 20s", rating: 4.2, lastLogin: "10/02/2026", status: "inactive" },
  { name: "Société Rapide", type: "Transport", responseTime: "5m 00s", rating: 3.9, lastLogin: "20/02/2026", status: "inactive" },
];

const AdminReporting = () => (
  <AdminLayout>
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Reporting & KPI</h1>
      <p className="text-sm text-muted-foreground">Analytiques avancées de la plateforme</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AdminStatCard icon={TrendingUp} label="Taux de conversion" value="85%" trend="+3%" sub="vs mois dernier" />
      <AdminStatCard icon={TrendingDown} label="Taux d'annulation" value="4.2%" trend="-0.8%" sub="amélioration" />
      <AdminStatCard icon={Clock} label="Temps réponse moyen" value="3m 15s" trend="-22s" sub="vs mois dernier" />
      <AdminStatCard icon={Star} label="Satisfaction client" value="4.7/5" trend="+0.1" sub="⭐" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground text-sm mb-1">Taux de conversion (%)</h3>
        <p className="text-xs text-muted-foreground mb-4">Évolution mensuelle</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={conversionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Bar dataKey="taux" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground text-sm mb-1">Fournisseurs</h3>
        <p className="text-xs text-muted-foreground mb-4">Répartition par statut</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Legend formatter={(value) => <span className="text-xs text-foreground">{value}</span>} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-display font-semibold text-foreground mb-4">Performance des fournisseurs</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Temps réponse</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supplierTable.map((s, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
              <TableCell className="text-sm">{s.responseTime}</TableCell>
              <TableCell className="font-semibold">⭐ {s.rating}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{s.lastLogin}</TableCell>
              <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status === "active" ? "Actif" : "Inactif"}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </AdminLayout>
);

export default AdminReporting;
