import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { TrendingUp, TrendingDown, Clock, Star, Users, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminService, type AdminStats, type AdminBooking, type AdminUser } from "@/services/adminService";

const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const AdminReporting = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, b, u] = await Promise.all([
          adminService.getStats(),
          adminService.getBookings(),
          adminService.getUsers(),
        ]);
        if (!cancelled) {
          setStats(s);
          setBookings(b);
          setUsers(u);
        }
      } catch (e) {
        const err = e as { message?: string; status?: number };
        if (!cancelled) {
          setError(err.status === 401 || err.status === 403
            ? "Accès réservé aux administrateurs."
            : err.message ?? "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Calculs analytiques sur les vraies données
  const analytics = useMemo(() => {
    const totalBookings = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const conversionRate = totalBookings > 0 ? (completed / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelled / totalBookings) * 100 : 0;

    const supplierUsers = users.filter((u) => u.role === "supplier");
    const driverUsers = users.filter((u) => u.role === "driver_independent" || u.role === "driver_employee");
    const activeUsers = users.filter((u) => u.accountStatus === "active");
    const suspendedUsers = users.filter((u) => u.accountStatus === "suspended");
    const pendingUsers = users.filter((u) => u.accountStatus === "pending");

    return {
      totalBookings,
      completed,
      cancelled,
      conversionRate: conversionRate.toFixed(1),
      cancellationRate: cancellationRate.toFixed(1),
      supplierUsers,
      driverUsers,
      activeUsers: activeUsers.length,
      suspendedUsers: suspendedUsers.length,
      pendingUsers: pendingUsers.length,
    };
  }, [bookings, users]);

  // Graph : conversion (terminées / créées) par mois sur 12 mois
  const conversionData = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, { total: number; completed: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[`${d.getFullYear()}-${d.getMonth()}`] = { total: 0, completed: 0 };
    }
    for (const b of bookings) {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!buckets[key]) continue;
      buckets[key].total += 1;
      if (b.status === "completed") buckets[key].completed += 1;
    }
    return Object.entries(buckets).map(([key, v]) => {
      const [, m] = key.split("-").map(Number);
      return {
        name: monthLabels[m],
        taux: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
      };
    });
  }, [bookings]);

  // Pie : répartition des statuts utilisateurs
  const pieData = useMemo(() => [
    { name: "Actifs", value: analytics.activeUsers, color: "hsl(var(--primary))" },
    { name: "En attente", value: analytics.pendingUsers, color: "hsl(45, 80%, 55%)" },
    { name: "Suspendus", value: analytics.suspendedUsers, color: "hsl(var(--destructive))" },
  ], [analytics]);

  // Top fournisseurs par nombre de courses
  const topSuppliers = useMemo(() => {
    const counts = new Map<string, { name: string; count: number; lastBooking: string }>();
    for (const b of bookings) {
      const supplier = b.handledBySupplier;
      if (!supplier) continue;
      const key = supplier.id;
      const label = supplier.companyName ?? supplier.fullName ?? "—";
      const current = counts.get(key) ?? { name: label, count: 0, lastBooking: b.createdAt };
      current.count += 1;
      if (new Date(b.createdAt) > new Date(current.lastBooking)) current.lastBooking = b.createdAt;
      counts.set(key, current);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [bookings]);

  const exportReport = () => {
    const lines = [
      ["Indicateur", "Valeur"],
      ["Réservations totales", String(analytics.totalBookings)],
      ["Terminées", String(analytics.completed)],
      ["Annulées", String(analytics.cancelled)],
      ["Taux de conversion (%)", analytics.conversionRate],
      ["Taux d'annulation (%)", analytics.cancellationRate],
      ["Utilisateurs actifs", String(analytics.activeUsers)],
      ["Utilisateurs en attente", String(analytics.pendingUsers)],
      ["Utilisateurs suspendus", String(analytics.suspendedUsers)],
      ["Fournisseurs", String(analytics.supplierUsers.length)],
      ["Chauffeurs", String(analytics.driverUsers.length)],
      ["Revenus encaissés (TND)", String(stats?.revenue.totalPaid ?? 0)],
      ["Réclamations ouvertes", String(stats?.claims.open ?? 0)],
    ];
    const csv = lines.map((cols) => cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
            <p className="font-semibold text-destructive">Erreur</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reporting & KPI</h1>
          <p className="text-sm text-muted-foreground">Analytiques temps réel — données issues du backend.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportReport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard icon={TrendingUp} label="Taux de conversion" value={`${analytics.conversionRate}%`} sub={`${analytics.completed}/${analytics.totalBookings} terminées`} />
        <AdminStatCard icon={TrendingDown} label="Taux d'annulation" value={`${analytics.cancellationRate}%`} sub={`${analytics.cancelled} annulations`} />
        <AdminStatCard icon={Users} label="Comptes actifs" value={analytics.activeUsers} sub={`${analytics.pendingUsers} en attente`} />
        <AdminStatCard icon={Star} label="Revenus" value={`${(stats?.revenue.totalPaid ?? 0).toLocaleString("fr-FR")} TND`} sub="paiements confirmés" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display font-semibold text-foreground text-sm mb-1">Taux de conversion (%)</h3>
          <p className="text-xs text-muted-foreground mb-4">Sur 12 mois</p>
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
          <h3 className="font-display font-semibold text-foreground text-sm mb-1">Statuts comptes utilisateurs</h3>
          <p className="text-xs text-muted-foreground mb-4">{users.length} utilisateurs au total</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(d) => `${d.name}: ${d.value}`} outerRadius={70} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground text-sm mb-1">Top fournisseurs</h3>
        <p className="text-xs text-muted-foreground mb-4">Classement par nombre de courses prises en charge</p>
        {topSuppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun fournisseur actif sur les réservations actuelles.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fournisseur</TableHead>
                  <TableHead className="text-xs">Courses</TableHead>
                  <TableHead className="text-xs">Dernière course</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs">{s.count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.lastBooking).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell><Badge variant="default" className="text-[10px]">Actif</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReporting;
