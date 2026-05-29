import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { ProfileType } from "@/pages/AuthPage";
import DashboardLayout, { type NavItem } from "@/components/dashboard/DashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import SupplierDashboard from "@/components/dashboard/SupplierDashboard";
import SupplierPendingScreen from "@/components/dashboard/SupplierPendingScreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays, PlusCircle, CreditCard, Users, DollarSign,
  FileText, Headphones, TrendingUp, Download, AlertCircle, Upload,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const navConfigs: Record<string, NavItem[]> = {
  particulier: [
    { icon: CalendarDays, label: "Mes réservations", id: "reservations" },
    { icon: PlusCircle, label: "Nouvelle réservation", id: "new" },
    { icon: CreditCard, label: "Historique des paiements", id: "payments" },
  ],
  corporate: [
    { icon: CalendarDays, label: "Mes réservations", id: "reservations" },
    { icon: Users, label: "Gestion des employés", id: "employees" },
    { icon: CalendarDays, label: "Historique des transferts", id: "transfers" },
    { icon: FileText, label: "Factures mensuelles", id: "invoices" },
    { icon: Headphones, label: "Support dédié", id: "support" },
  ],
};

// Mock reservations for demo
const mockReservations = [
  { id: "RES-001", date: "2026-03-12", time: "09:00", from: "Aéroport Tunis-Carthage", to: "Hôtel El Mouradi", vehicle: "ECO", status: "confirmed", voucherReady: true },
  { id: "RES-002", date: "2026-03-15", time: "14:30", from: "Sousse Centre", to: "Aéroport Enfidha", vehicle: "SEDAN", status: "pending", voucherReady: false },
  { id: "RES-003", date: "2026-03-20", time: "08:00", from: "Djerba Midoun", to: "Aéroport Djerba", vehicle: "VAN", status: "completed", voucherReady: true },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmée", variant: "default" },
  pending: { label: "En attente", variant: "secondary" },
  completed: { label: "Terminée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "destructive" },
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
  const profile: ProfileType = state?.profile || "particulier";
  const userName = state?.name || "Utilisateur";
  const rawAccountStatus = state?.accountStatus || "active";
  const contractStatus = (state?.contractStatus || "validated") as "none" | "sent" | "signed" | "validated";
  const pendingVoucher = state?.pendingVoucher || false;

  const isSupplier = profile === "chauffeur" || profile === "transport";
  const isSupplierPending = isSupplier && (
    rawAccountStatus === "pending" || rawAccountStatus === "rejected" ||
    (rawAccountStatus === "approved" && contractStatus !== "validated")
  );

  const navItems = navConfigs[profile] || navConfigs.particulier;
  const [activeItem, setActiveItem] = useState(navItems[0]?.id || "");

  if (isSupplierPending) {
    const mappedStatus = rawAccountStatus === "approved" ? "approved" : rawAccountStatus === "rejected" ? "rejected" : "pending";
    return (
      <SupplierPendingScreen
        accountStatus={mappedStatus}
        contractStatus={contractStatus}
        userName={userName}
      />
    );
  }

  if (isSupplier) {
    return <SupplierDashboard profile={profile as "chauffeur" | "transport"} userName={userName} />;
  }

  return (
    <DashboardLayout
      profile={profile}
      userName={userName}
      navItems={navItems}
      activeItem={activeItem}
      onNavChange={setActiveItem}
    >
      {/* Voucher notification */}
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
          Votre espace personnel vous permet de gérer vos réservations et vos informations en toute simplicité.
        </p>
      </div>

      {profile === "particulier" && <ParticulierContent active={activeItem} />}
      {profile === "corporate" && <CorporateContent active={activeItem} />}
      {activeItem === "settings" && <SettingsContent />}
    </DashboardLayout>
  );
};

const ParticulierContent = ({ active }: { active: string }) => {
  if (active === "settings") return null;
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Réservations" value={mockReservations.length} />
        <StatCard icon={CreditCard} label="Paiements" value="158 TND" />
        <StatCard icon={TrendingUp} label="Trajets effectués" value={1} />
      </div>

      {active === "reservations" && <ReservationsTable />}
      {active === "new" && <EmptyState message="Le tunnel de réservation sera disponible bientôt." />}
      {active === "payments" && <EmptyState message="Aucun paiement enregistré." />}
    </div>
  );
};

const ReservationsTable = () => (
  <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
    <div className="p-4 border-b border-border">
      <h2 className="font-display font-semibold text-foreground">Mes réservations</h2>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Réf.</TableHead>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Heure</TableHead>
            <TableHead className="text-xs">Trajet</TableHead>
            <TableHead className="text-xs">Véhicule</TableHead>
            <TableHead className="text-xs">Statut</TableHead>
            <TableHead className="text-xs text-right">Voucher</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockReservations.map(res => {
            const status = statusLabels[res.status] || statusLabels.pending;
            return (
              <TableRow key={res.id}>
                <TableCell className="font-mono text-xs font-medium">{res.id}</TableCell>
                <TableCell className="text-xs">{res.date}</TableCell>
                <TableCell className="text-xs">{res.time}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{res.from} → {res.to}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{res.vehicle}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {res.voucherReady ? (
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">En attente</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  </div>
);

const CorporateContent = ({ active }: { active: string }) => {
  if (active === "settings") return null;
  return (
    <div>
      {/* Voucher alert */}
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
        <StatCard icon={Users} label="Employés" value={0} />
        <StatCard icon={CalendarDays} label="Transferts" value={0} />
        <StatCard icon={FileText} label="Factures" value={0} />
        <StatCard icon={CreditCard} label="Total dépenses" value="0 TND" />
      </div>

      {active === "reservations" && <ReservationsTable />}
      {active === "employees" && <EmptyState message="Aucun employé ajouté." actionLabel="Ajouter un employé" onAction={() => {}} />}
      {active === "transfers" && <EmptyState message="Aucun transfert enregistré." />}
      {active === "invoices" && <EmptyState message="Aucune facture disponible." />}
      {active === "support" && <EmptyState message="Notre équipe support est à votre disposition." />}
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
