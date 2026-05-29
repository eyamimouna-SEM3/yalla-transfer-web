import { useState } from "react";
import type { ProfileType } from "@/pages/AuthPage";
import DashboardLayout, { type NavItem } from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  CalendarDays, Inbox, Car, Users, DollarSign, Star, BarChart3,
  TrendingUp, Bell, Clock, CheckCircle2, XCircle, Wrench, UserCheck,
  UserX, FileText, MessageSquare, ArrowUpDown,
} from "lucide-react";

const chauffeurNav: NavItem[] = [
  { icon: BarChart3, label: "Vue d'ensemble", id: "overview" },
  { icon: Inbox, label: "Nouvelles demandes", id: "requests", badge: 0 },
  { icon: CalendarDays, label: "Mes courses", id: "courses" },
  { icon: DollarSign, label: "Revenus", id: "revenue" },
  { icon: Star, label: "Évaluations", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications" },
];

const transportNav: NavItem[] = [
  { icon: BarChart3, label: "Vue d'ensemble", id: "overview" },
  { icon: Inbox, label: "Demandes entrantes", id: "requests", badge: 0 },
  { icon: Car, label: "Gestion des véhicules", id: "vehicles" },
  { icon: Users, label: "Gestion des chauffeurs", id: "drivers" },
  { icon: DollarSign, label: "Revenus & statistiques", id: "revenue" },
  { icon: Star, label: "Qualité & avis", id: "ratings" },
  { icon: Bell, label: "Notifications", id: "notifications" },
];

interface Props {
  profile: "chauffeur" | "transport";
  userName: string;
}

const SupplierDashboard = ({ profile, userName }: Props) => {
  const navItems = profile === "chauffeur" ? chauffeurNav : transportNav;
  const [activeItem, setActiveItem] = useState("overview");

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

      {activeItem === "overview" && <OverviewSection profile={profile} />}
      {activeItem === "requests" && <EmptyState message="📭 Aucune nouvelle demande pour le moment." />}
      {activeItem === "courses" && <EmptyState message="Aucune course en cours." />}
      {activeItem === "vehicles" && <EmptyState message="Aucun véhicule enregistré." actionLabel="Ajouter un véhicule" onAction={() => {}} />}
      {activeItem === "drivers" && <EmptyState message="Aucun chauffeur ajouté." actionLabel="Ajouter un chauffeur" onAction={() => {}} />}
      {activeItem === "revenue" && <RevenueSection />}
      {activeItem === "ratings" && <QualitySection />}
      {activeItem === "notifications" && <NotificationsSection />}
      {activeItem === "settings" && (
        <div className="bg-card rounded-2xl border border-border p-8">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">⚙ Paramètres du compte</h2>
          <p className="text-muted-foreground">Les paramètres seront disponibles prochainement.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

const OverviewSection = ({ profile }: { profile: string }) => (
  <div className="space-y-6">
    {/* Transferts */}
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <ArrowUpDown className="h-5 w-5 text-primary" /> Statistiques Transferts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={CalendarDays} label="Aujourd'hui" value={0} />
        <StatCard icon={Clock} label="En attente" value={0} />
        <StatCard icon={CheckCircle2} label="Confirmés" value={0} />
        <StatCard icon={TrendingUp} label="Terminés" value={0} />
        <StatCard icon={XCircle} label="Annulés" value={0} />
      </div>
    </div>

    {/* Revenus */}
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" /> Revenus
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Aujourd'hui" value="0 TND" />
        <StatCard icon={DollarSign} label="Ce mois" value="0 TND" />
        <StatCard icon={DollarSign} label="Total" value="0 TND" />
      </div>
    </div>

    {/* Flotte (transport only) */}
    {profile === "transport" && (
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" /> Flotte
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={CheckCircle2} label="Disponibles" value={0} />
          <StatCard icon={Car} label="Occupés" value={0} />
          <StatCard icon={Wrench} label="En maintenance" value={0} />
        </div>
      </div>
    )}

    {/* Chauffeurs (transport only) */}
    {profile === "transport" && (
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Chauffeurs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={UserCheck} label="Actifs" value={0} />
          <StatCard icon={Car} label="En course" value={0} />
          <StatCard icon={UserX} label="Hors ligne" value={0} />
        </div>
      </div>
    )}

    {/* Qualité */}
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" /> Qualité
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard icon={Star} label="Note moyenne" value="—" />
        <StatCard icon={MessageSquare} label="Avis clients" value={0} />
      </div>
    </div>

    {/* Activité récente */}
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" /> Activité récente
      </h2>
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <ActivityRow icon={Inbox} label="Dernières réservations" value="Aucune" />
        <ActivityRow icon={FileText} label="Dernières offres envoyées" value="Aucune" />
        <ActivityRow icon={CheckCircle2} label="Dernières courses terminées" value="Aucune" />
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

const RevenueSection = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard icon={DollarSign} label="Aujourd'hui" value="0 TND" />
      <StatCard icon={DollarSign} label="Ce mois" value="0 TND" />
      <StatCard icon={DollarSign} label="Total" value="0 TND" />
    </div>
    <EmptyState message="Aucun revenu enregistré pour le moment." />
  </div>
);

const QualitySection = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <StatCard icon={Star} label="Note moyenne" value="—" />
      <StatCard icon={MessageSquare} label="Avis clients" value={0} />
    </div>
    <EmptyState message="Aucune évaluation reçue pour le moment." />
  </div>
);

const NotificationsSection = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <StatCard icon={Inbox} label="Nouvelles demandes" value={0} />
      <StatCard icon={CheckCircle2} label="Réservations confirmées" value={0} />
    </div>
    <EmptyState message="Aucune notification pour le moment." />
  </div>
);

export default SupplierDashboard;
