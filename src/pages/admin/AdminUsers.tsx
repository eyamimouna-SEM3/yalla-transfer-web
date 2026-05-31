import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Eye,
  Users,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Ban,
  RotateCcw,
  RefreshCw,
  Phone,
  Mail,
  Building2,
  CalendarDays,
  Globe,
  MapPin,
  Briefcase,
  Car,
  CreditCard,
  Shield,
  Languages as LanguagesIcon,
  Award,
  Star,
  Wallet,
  TrendingUp,
  ExternalLink,
  Hash,
  IdCard,
  CheckCheck,
  CircleDot,
  Trash2,
  FolderDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminService,
  type AdminUser,
  type AdminUserDetails,
} from "@/services/adminService";
import { ScrollArea } from "@/components/ui/scroll-area";

/* -------------------------------------------------------------------------- */
/*  Mappings UI                                                                */
/* -------------------------------------------------------------------------- */

const accountStatusUi: Record<
  string,
  { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    variant: "secondary",
  },
  active: {
    label: "Actif",
    color: "bg-green-100 text-green-800 border-green-200",
    variant: "default",
  },
  suspended: {
    label: "Suspendu",
    color: "bg-red-100 text-red-700 border-red-200",
    variant: "destructive",
  },
};

const contractStatusUi: Record<string, { label: string; color: string }> = {
  pending: {
    label: "En attente",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
  validated: {
    label: "Validé",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "Rejeté",
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

const roleLabels: Record<string, string> = {
  client_b2c: "Client Particulier",
  client_b2b: "Client Corporate",
  client_company: "Client Corporate",
  // L'ancien rôle "client" générique (legacy) est traité comme Client
  // Particulier pour uniformiser le badge "Type" dans le tableau admin.
  client: "Client Particulier",
  supplier: "Société de transport",
  driver_independent: "Chauffeur indépendant",
  driver_employee: "Chauffeur salarié",
  admin: "Administrateur",
};

/* -------------------------------------------------------------------------- */
/*  Composant principal                                                        */
/* -------------------------------------------------------------------------- */

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const openUserDialog = async (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetails(null);
    setDialogOpen(true);
    setDetailsLoading(true);
    try {
      const details = await adminService.getUserDetails(user.id);
      setUserDetails(details);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Impossible de charger les détails",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserInList = (id: string, updates: Partial<AdminUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setSelectedUser((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  /* -------- Actions ---------------------------------------------------- */

  const runAction = async (
    user: AdminUser,
    payload: Parameters<typeof adminService.updateUser>[1],
    successTitle: string,
    successDesc: string,
    errorDesc: string,
  ) => {
    setActionLoading(user.id);
    try {
      const updated = await adminService.updateUser(user.id, payload);
      updateUserInList(user.id, {
        accountStatus: updated.accountStatus ?? payload.accountStatus,
        contractStatus: updated.contractStatus ?? payload.contractStatus,
      });
      toast({ title: successTitle, description: successDesc });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || errorDesc;
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = (user: AdminUser) => {
    // Pour les suppliers et chauffeurs indépendants : on valide AUSSI le
    // contrat en même temps (1 clic = compte actif + contrat validé =
    // utilisateur pleinement opérationnel).
    // Pour les clients : le contrat est déjà 'validated' par défaut.
    const isProvider =
      user.role === "supplier" || user.role === "driver_independent";
    const payload = isProvider
      ? { accountStatus: "active", contractStatus: "validated" }
      : { accountStatus: "active" };
    const description = isProvider
      ? `${user.fullName} est désormais actif et son contrat est validé.`
      : `${user.fullName} est désormais actif.`;
    return runAction(
      user,
      payload,
      "Compte approuvé",
      description,
      "Impossible d'approuver le compte",
    );
  };

  const handleReject = (user: AdminUser) =>
    runAction(
      user,
      { accountStatus: "suspended" },
      "Compte rejeté",
      `La demande de ${user.fullName} a été rejetée.`,
      "Impossible de rejeter le compte",
    );

  const handleSuspend = (user: AdminUser) =>
    runAction(
      user,
      { accountStatus: "suspended" },
      "Compte suspendu",
      `${user.fullName} ne pourra plus se connecter.`,
      "Impossible de suspendre le compte",
    );

  /**
   * Télécharge le dossier ZIP contenant tous les documents KYC de l'utilisateur
   * (permis, carte grise, assurance, patente, photos…). Sert à l'admin à
   * vérifier la conformité et l'authenticité des pièces fournies.
   */
  const handleDownloadDocuments = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      const safeName = (user.fullName ?? "utilisateur")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .slice(0, 40);
      const date = new Date().toISOString().slice(0, 10);
      await adminService.downloadUserDocuments(
        user.id,
        `Documents_${safeName}_${date}.zip`,
      );
      toast({
        title: "Dossier téléchargé",
        description: `Archive ZIP de ${user.fullName} prête à l'ouverture.`,
      });
    } catch (e) {
      const err = e as { message?: string };
      toast({
        title: "Téléchargement impossible",
        description: err.message ?? "Vérifie que l'utilisateur a fourni des documents.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = (user: AdminUser) =>
    runAction(
      user,
      { accountStatus: "active" },
      "Compte réactivé",
      `${user.fullName} est de nouveau actif.`,
      "Impossible de réactiver le compte",
    );

  const handleValidateContract = (user: AdminUser) =>
    runAction(
      user,
      { contractStatus: "validated" },
      "Contrat validé",
      `Le contrat de ${user.fullName} est désormais validé.`,
      "Impossible de valider le contrat",
    );

  const handleRejectContract = (user: AdminUser) =>
    runAction(
      user,
      { contractStatus: "rejected" },
      "Contrat rejeté",
      `Le contrat de ${user.fullName} a été rejeté.`,
      "Impossible de rejeter le contrat",
    );

  const handleResetContract = (user: AdminUser) =>
    runAction(
      user,
      { contractStatus: "pending" },
      "Contrat remis en attente",
      `Le contrat de ${user.fullName} est à nouveau en attente.`,
      "Impossible de remettre le contrat en attente",
    );

  const handleValidateDriver = (user: AdminUser) =>
    runAction(
      user,
      { driverValidated: true, accountStatus: "active" } as any,
      "Chauffeur validé",
      `${user.fullName} est validé et actif.`,
      "Impossible de valider le chauffeur",
    );

  const handleDelete = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast({
        title: "Utilisateur supprimé",
        description: `${user.fullName} a été supprimé définitivement.`,
      });
      // Si le dialog était ouvert sur ce user, on le ferme.
      if (selectedUser?.id === user.id) {
        setDialogOpen(false);
        setSelectedUser(null);
        setUserDetails(null);
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Impossible de supprimer l'utilisateur";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
    }
  };

  /* -------- Filtres / regroupements ----------------------------------- */

  // Liste de rôles visibles côté admin web.
  // - Les admins sont exclus (gérés par script, pas dans l'UI).
  // - Les driver_employee n'existent que côté mobile (créés par les suppliers),
  //   l'admin web ne les manipule pas.
  // - Le rôle legacy "client" (ancien mobile) est traité comme client particulier.
  const WEB_VISIBLE_ROLES = new Set([
    "client_b2c",
    "client_b2b",
    "client_company",
    "client",
    "supplier",
    "driver_independent",
  ]);

  const visibleUsers = useMemo(
    () => users.filter((u) => WEB_VISIBLE_ROLES.has(u.role)),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleUsers.filter((u) => {
      if (statusFilter !== "all" && (u.accountStatus || "active") !== statusFilter)
        return false;
      if (!q) return true;
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.companyName?.toLowerCase().includes(q)
      );
    });
  }, [visibleUsers, search, statusFilter]);

  const clients = filtered.filter(
    (u) =>
      u.role === "client_b2c" ||
      u.role === "client_b2b" ||
      u.role === "client_company" ||
      u.role === "client",
  );
  // Inclut le rôle legacy "client" (ancien mobile) dans les particuliers.
  const clientsParticuliers = clients.filter(
    (u) => u.role === "client_b2c" || u.role === "client",
  );
  const clientsCorporate = clients.filter(
    (u) => u.role === "client_b2b" || u.role === "client_company",
  );

  const fournisseurs = filtered.filter(
    (u) => u.role === "supplier" || u.role === "driver_independent",
  );
  const societesTransport = fournisseurs.filter((u) => u.role === "supplier");
  const chauffeursIndependants = fournisseurs.filter(
    (u) => u.role === "driver_independent",
  );

  /* -------- Stats summary --------------------------------------------- */

  // Les stats utilisent visibleUsers (sans admins ni driver_employee)
  // pour que TOTAL = clients + fournisseurs affichés.
  const stats = useMemo(() => {
    const total = visibleUsers.length;
    const pending = visibleUsers.filter((u) => u.accountStatus === "pending").length;
    const active = visibleUsers.filter((u) => (u.accountStatus || "active") === "active").length;
    const suspended = visibleUsers.filter((u) => u.accountStatus === "suspended").length;
    return { total, pending, active, suspended };
  }, [visibleUsers]);

  /* -------- Loading --------------------------------------------------- */

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  /* -------- Rendu d'une ligne (client) -------------------------------- */

  const ClientRowActions = ({ user }: { user: AdminUser }) => {
    const status = user.accountStatus || "active";
    const busy = actionLoading === user.id;
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Voir les détails"
          onClick={() => openUserDialog(user)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {/* Téléchargement du dossier client : avatar + pièces d'identité
            fournies sur les réservations. Pour B2B, inclut aussi les infos
            entreprise (matricule fiscal, adresse, responsable) dans l'index. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          title="Télécharger les documents (ZIP)"
          disabled={busy}
          onClick={() => handleDownloadDocuments(user)}
        >
          <FolderDown className="h-4 w-4" />
        </Button>
        {status === "pending" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Approuver"
              disabled={busy}
              onClick={() => handleApprove(user)}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Rejeter"
              disabled={busy}
              onClick={() => handleReject(user)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        {status === "active" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Suspendre"
            disabled={busy}
            onClick={() => handleSuspend(user)}
          >
            <Ban className="h-4 w-4" />
          </Button>
        )}
        {status === "suspended" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Réactiver"
            disabled={busy}
            onClick={() => handleReactivate(user)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {status !== "pending" && user.role !== "admin" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-700 hover:text-red-800 hover:bg-red-50"
            title="Supprimer définitivement"
            disabled={busy}
            onClick={() => setUserToDelete(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderClientTable = (rows: AdminUser[]) => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Aucun utilisateur ne correspond aux filtres.
              </TableCell>
            </TableRow>
          )}
          {rows.map((user) => {
            const status = user.accountStatus || "active";
            const ui = accountStatusUi[status] || accountStatusUi.active;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.fullName}
                  {user.companyName && (
                    <div className="text-xs text-muted-foreground">{user.companyName}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {user.email && <div>{user.email}</div>}
                  <div className="text-muted-foreground">{user.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[user.role] || user.role}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ui.color}`}
                  >
                    {ui.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ClientRowActions user={user} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  /* -------- Rendu d'une ligne (fournisseur) --------------------------- */

  const SupplierRowActions = ({ user }: { user: AdminUser }) => {
    const accStatus = user.accountStatus || "pending";
    const conStatus = user.contractStatus || "pending";
    const busy = actionLoading === user.id;
    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Voir les détails"
          onClick={() => openUserDialog(user)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {/* Téléchargement du dossier KYC complet (ZIP) — utile pour
            vérifier l'authenticité des documents fournis à l'inscription. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          title="Télécharger les documents (ZIP)"
          disabled={busy}
          onClick={() => handleDownloadDocuments(user)}
        >
          <FolderDown className="h-4 w-4" />
        </Button>
        {accStatus === "pending" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Approuver le compte"
              disabled={busy}
              onClick={() => handleApprove(user)}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Rejeter le compte"
              disabled={busy}
              onClick={() => handleReject(user)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        {accStatus === "active" && conStatus === "pending" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Valider le contrat"
            disabled={busy}
            onClick={() => handleValidateContract(user)}
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {accStatus === "active" && conStatus === "rejected" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Remettre le contrat en attente"
            disabled={busy}
            onClick={() => handleResetContract(user)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {accStatus === "active" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Suspendre"
            disabled={busy}
            onClick={() => handleSuspend(user)}
          >
            <Ban className="h-4 w-4" />
          </Button>
        )}
        {accStatus === "suspended" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Réactiver"
            disabled={busy}
            onClick={() => handleReactivate(user)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {accStatus !== "pending" && user.role !== "admin" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-700 hover:text-red-800 hover:bg-red-50"
            title="Supprimer définitivement"
            disabled={busy}
            onClick={() => setUserToDelete(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderFournisseurTable = (rows: AdminUser[]) => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Compte</TableHead>
            <TableHead>Contrat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Aucun fournisseur ne correspond aux filtres.
              </TableCell>
            </TableRow>
          )}
          {rows.map((user) => {
            const accStatus = user.accountStatus || "pending";
            const conStatus = user.contractStatus || "pending";
            const accUi = accountStatusUi[accStatus] || accountStatusUi.pending;
            const conUi = contractStatusUi[conStatus] || contractStatusUi.pending;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.fullName}
                  {user.companyName && (
                    <div className="text-xs text-muted-foreground">{user.companyName}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {user.email && <div>{user.email}</div>}
                  <div className="text-muted-foreground">{user.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[user.role] || user.role}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${accUi.color}`}
                  >
                    {accUi.label}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${conUi.color}`}
                  >
                    {conUi.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <SupplierRowActions user={user} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  /* -------- Header / stats / filtres ---------------------------------- */

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const isSupplier =
    selectedUser?.role === "supplier" ||
    selectedUser?.role === "driver_independent";
  const isDriver =
    selectedUser?.role === "driver_independent" ||
    selectedUser?.role === "driver_employee";
  const isB2B =
    selectedUser?.role === "client_b2b" ||
    selectedUser?.role === "client_company";

  // Helper : remplace les valeurs vides / null / undefined par "Non renseigné"
  const nz = (v: string | null | undefined): string => {
    if (v === null || v === undefined) return "Non renseigné";
    const s = String(v).trim();
    return s.length === 0 ? "Non renseigné" : s;
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} utilisateurs inscrits
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={refreshing}
          onClick={() => fetchUsers(true)}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} tone="default" />
        <StatCard label="Actifs" value={stats.active} tone="green" />
        <StatCard label="En attente" value={stats.pending} tone="yellow" />
        <StatCard label="Suspendus" value={stats.suspended} tone="red" />
      </div>

      {/* Recherche + filtre */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, téléphone ou société..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="suspended">Suspendus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border border-border/50">
          <TabsTrigger
            value="clients"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" /> Clients ({clients.length})
          </TabsTrigger>
          <TabsTrigger
            value="fournisseurs"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Truck className="h-4 w-4" /> Fournisseurs ({fournisseurs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="clients"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <Tabs defaultValue="particuliers" className="w-full">
            <TabsList className="mb-4 bg-background border border-border/60">
              <TabsTrigger
                value="particuliers"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Client particulier ({clientsParticuliers.length})
              </TabsTrigger>
              <TabsTrigger
                value="corporate"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Client corporate ({clientsCorporate.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="particuliers" className="mt-0">
              {renderClientTable(clientsParticuliers)}
            </TabsContent>
            <TabsContent value="corporate" className="mt-0">
              {renderClientTable(clientsCorporate)}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent
          value="fournisseurs"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <Tabs defaultValue="societes" className="w-full">
            <TabsList className="mb-4 bg-background border border-border/60">
              <TabsTrigger
                value="societes"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Société de transport ({societesTransport.length})
              </TabsTrigger>
              <TabsTrigger
                value="chauffeurs"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Chauffeur indépendant ({chauffeursIndependants.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="societes" className="mt-0">
              {renderFournisseurTable(societesTransport)}
            </TabsContent>
            <TabsContent value="chauffeurs" className="mt-0">
              {renderFournisseurTable(chauffeursIndependants)}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Dialog de détails */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {isSupplier ? "Détails du fournisseur" : "Détails de l'utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {isSupplier
                ? "Profil, documents KYC, contrat et activité"
                : "Profil complet et historique d'activité"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] px-6">
            {detailsLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!detailsLoading && selectedUser && (
              <div className="space-y-5 pb-4">
                {/* En-tête : avatar + identité */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                    {userDetails?.avatarUrl ? (
                      <img
                        src={userDetails.avatarUrl}
                        alt={selectedUser.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(selectedUser.fullName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground">
                      {selectedUser.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {roleLabels[selectedUser.role] || selectedUser.role}
                      {userDetails?.companyName && ` • ${userDetails.companyName}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <StatusPill
                        color={
                          accountStatusUi[selectedUser.accountStatus || "active"]?.color
                        }
                        label={`Compte : ${
                          accountStatusUi[selectedUser.accountStatus || "active"]?.label
                        }`}
                      />
                      {isSupplier && (
                        <StatusPill
                          color={
                            contractStatusUi[selectedUser.contractStatus || "pending"]
                              ?.color
                          }
                          label={`Contrat : ${
                            contractStatusUi[selectedUser.contractStatus || "pending"]
                              ?.label
                          }`}
                        />
                      )}
                      {userDetails?.isVerified && (
                        <StatusPill
                          color="bg-blue-100 text-blue-800 border-blue-200"
                          label="Email vérifié"
                        />
                      )}
                      {userDetails?.driverOnline && (
                        <StatusPill
                          color="bg-emerald-100 text-emerald-800 border-emerald-200"
                          label="En ligne"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistiques d'activité */}
                {userDetails?.stats?.client && (
                  <Section title="Activité client" icon={<TrendingUp className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <MiniStat
                        label="Réservations"
                        value={userDetails.stats.client.bookingsTotal}
                      />
                      <MiniStat
                        label="Terminées"
                        value={userDetails.stats.client.bookingsByStatus.completed || 0}
                      />
                      <MiniStat
                        label="En cours"
                        value={
                          (userDetails.stats.client.bookingsByStatus.confirmed || 0) +
                          (userDetails.stats.client.bookingsByStatus.assigned || 0) +
                          (userDetails.stats.client.bookingsByStatus.in_progress || 0)
                        }
                      />
                      <MiniStat
                        label="Annulées"
                        value={userDetails.stats.client.bookingsByStatus.cancelled || 0}
                      />
                      <MiniStat
                        label="Total dépensé"
                        value={`${userDetails.stats.client.totalSpent.toFixed(2)} TND`}
                      />
                    </div>
                    {userDetails.stats.client.lastBooking && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">
                          Dernière réservation
                        </p>
                        <p className="font-medium">
                          {userDetails.stats.client.lastBooking.code} —{" "}
                          {userDetails.stats.client.lastBooking.departure} →{" "}
                          {userDetails.stats.client.lastBooking.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(
                            userDetails.stats.client.lastBooking.departureAt,
                          )}{" "}
                          • {userDetails.stats.client.lastBooking.status} •{" "}
                          {userDetails.stats.client.lastBooking.totalPrice.toFixed(2)} TND
                        </p>
                      </div>
                    )}
                  </Section>
                )}

                {userDetails?.stats?.driver && (
                  <Section title="Activité chauffeur" icon={<Car className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniStat
                        label="Courses"
                        value={userDetails.stats.driver.tripsTotal}
                      />
                      <MiniStat
                        label="Terminées"
                        value={userDetails.stats.driver.tripsCompleted}
                      />
                      <MiniStat
                        label="Note moyenne"
                        value={
                          userDetails.stats.driver.averageRating
                            ? `${userDetails.stats.driver.averageRating.toFixed(2)} / 5`
                            : "—"
                        }
                      />
                      <MiniStat
                        label="Avis reçus"
                        value={userDetails.stats.driver.ratingsCount}
                      />
                    </div>
                  </Section>
                )}

                {userDetails?.stats?.supplier && (
                  <Section title="Activité fournisseur" icon={<Briefcase className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniStat
                        label="Véhicules"
                        value={userDetails.stats.supplier.vehiclesCount}
                      />
                      <MiniStat
                        label="Chauffeurs"
                        value={userDetails.stats.supplier.driversCount}
                      />
                      <MiniStat
                        label="Réservations gérées"
                        value={userDetails.stats.supplier.handledBookings}
                      />
                      <MiniStat
                        label="Terminées"
                        value={userDetails.stats.supplier.completedBookings}
                      />
                      <MiniStat
                        label="Offres envoyées"
                        value={userDetails.stats.supplier.offersTotal}
                      />
                      <MiniStat
                        label="Offres acceptées"
                        value={userDetails.stats.supplier.offersAccepted}
                      />
                      <MiniStat
                        label="Note moyenne"
                        value={
                          userDetails.stats.supplier.averageRating
                            ? `${userDetails.stats.supplier.averageRating.toFixed(2)} / 5`
                            : "—"
                        }
                      />
                      <MiniStat
                        label="Avis reçus"
                        value={userDetails.stats.supplier.ratingsCount}
                      />
                    </div>
                  </Section>
                )}

                {/* Coordonnées — TOUJOURS visible */}
                <Section title="Coordonnées" icon={<Phone className="h-4 w-4" />}>
                  <DetailGrid>
                    <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={nz(userDetails?.email || selectedUser.email)} />
                    <DetailRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={nz(userDetails?.phone || selectedUser.phone)} />
                    <DetailRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={nz(userDetails?.address)} />
                    <DetailRow icon={<MapPin className="h-4 w-4" />} label="Ville" value={nz(userDetails?.city)} />
                    <DetailRow icon={<Globe className="h-4 w-4" />} label="Pays" value={nz(userDetails?.country)} />
                    <DetailRow icon={<Globe className="h-4 w-4" />} label="Nationalité" value={nz(userDetails?.nationality)} />
                    <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="Site web" value={nz(userDetails?.website)} link={!!userDetails?.website} />
                  </DetailGrid>
                </Section>

                {/* Société — TOUJOURS visible pour B2B / supplier */}
                {(isB2B || selectedUser.role === "supplier") && (
                  <Section title="Société" icon={<Building2 className="h-4 w-4" />}>
                    <DetailGrid>
                      <DetailRow icon={<Building2 className="h-4 w-4" />} label="Raison sociale" value={nz(userDetails?.companyName)} />
                      <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Activité" value={nz(userDetails?.activityType)} />
                      <DetailRow icon={<Hash className="h-4 w-4" />} label="Tax ID" value={nz(userDetails?.taxId)} />
                      <DetailRow icon={<Hash className="h-4 w-4" />} label="Matricule fiscal" value={nz(userDetails?.matriculeFiscal)} />
                      <DetailRow icon={<CreditCard className="h-4 w-4" />} label="RIB" value={nz(userDetails?.rib)} />
                      <DetailRow icon={<FileText className="h-4 w-4" />} label="Registre commerce" value={nz(userDetails?.commerceRegister)} />
                      <DetailRow icon={<FileText className="h-4 w-4" />} label="Patente" value={nz(userDetails?.patent)} />
                    </DetailGrid>
                  </Section>
                )}

                {/* Responsable — TOUJOURS visible pour B2B */}
                {isB2B && (
                  <Section title="Responsable" icon={<Users className="h-4 w-4" />}>
                    <DetailGrid>
                      <DetailRow icon={<Users className="h-4 w-4" />} label="Nom" value={nz(userDetails?.responsibleName)} />
                      <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={nz(userDetails?.responsibleEmail)} />
                      <DetailRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={nz(userDetails?.responsiblePhone)} />
                    </DetailGrid>
                  </Section>
                )}

                {/* Capacité opérationnelle — TOUJOURS visible pour supplier */}
                {selectedUser.role === "supplier" && (
                  <Section title="Capacité opérationnelle" icon={<Truck className="h-4 w-4" />}>
                    <DetailGrid>
                      <DetailRow icon={<Car className="h-4 w-4" />} label="Taille flotte" value={userDetails?.fleetSize != null ? String(userDetails.fleetSize) : "Non renseigné"} />
                      <DetailRow icon={<Clock className="h-4 w-4" />} label="Disponibilité" value={userDetails?.is247 ? "24h/24 et 7j/7" : "Heures de bureau"} />
                      <DetailRow icon={<Shield className="h-4 w-4" />} label="RC pro" value={nz(userDetails?.civilLiabilityInsurance)} />
                    </DetailGrid>
                    <ChipsRow
                      label="Zones d'opération"
                      items={(userDetails?.operationalZones && userDetails.operationalZones.length > 0)
                        ? userDetails.operationalZones
                        : ["Non renseigné"]}
                    />
                    <ChipsRow
                      label="Types de véhicules"
                      items={(userDetails?.vehicleTypes && userDetails.vehicleTypes.length > 0)
                        ? userDetails.vehicleTypes
                        : ["Non renseigné"]}
                    />
                  </Section>
                )}

                {/* Chauffeur — profil — TOUJOURS visible pour driver */}
                {isDriver && (
                  <Section title="Profil chauffeur" icon={<IdCard className="h-4 w-4" />}>
                    <DetailGrid>
                      <DetailRow icon={<CheckCheck className="h-4 w-4" />} label="Validé" value={userDetails?.driverValidated ? "Oui" : "Non"} />
                      <DetailRow icon={<CircleDot className="h-4 w-4" />} label="En ligne" value={userDetails?.driverOnline ? "Oui" : "Non"} />
                      <DetailRow icon={<IdCard className="h-4 w-4" />} label="N° permis" value={nz(userDetails?.licenseNumber)} />
                      <DetailRow icon={<IdCard className="h-4 w-4" />} label="N° autorisation" value={nz(userDetails?.permitNumber)} />
                      <DetailRow icon={<IdCard className="h-4 w-4" />} label="Carte pro" value={nz(userDetails?.professionalCardNumber)} />
                      <DetailRow icon={<Award className="h-4 w-4" />} label="Expérience" value={userDetails?.experienceYears ? `${userDetails.experienceYears} ans` : "Non renseigné"} />
                      <DetailRow
                        icon={<Building2 className="h-4 w-4" />}
                        label="Employeur"
                        value={
                          userDetails?.employerSupplier
                            ? (userDetails.employerSupplier.companyName || userDetails.employerSupplier.fullName)
                            : (selectedUser.role === "driver_independent" ? "Indépendant" : "Non renseigné")
                        }
                      />
                    </DetailGrid>
                    <ChipsRow
                      label="Langues parlées"
                      items={(userDetails?.languages && userDetails.languages.length > 0)
                        ? userDetails.languages
                        : ["Non renseigné"]}
                      icon={<LanguagesIcon className="h-3 w-3" />}
                    />
                  </Section>
                )}

                {/* Véhicule — TOUJOURS visible pour driver */}
                {isDriver && (
                  <Section title="Véhicule" icon={<Car className="h-4 w-4" />}>
                    <DetailGrid>
                      <DetailRow icon={<Car className="h-4 w-4" />} label="Type" value={nz(userDetails?.vehicleType)} />
                      <DetailRow icon={<Car className="h-4 w-4" />} label="Marque" value={nz(userDetails?.vehicleBrand)} />
                      <DetailRow icon={<Car className="h-4 w-4" />} label="Modèle" value={nz(userDetails?.vehicleModel)} />
                      <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Année" value={userDetails?.vehicleYear ? String(userDetails.vehicleYear) : "Non renseigné"} />
                      <DetailRow icon={<CircleDot className="h-4 w-4" />} label="Couleur" value={nz(userDetails?.vehicleColor)} />
                      <DetailRow icon={<Hash className="h-4 w-4" />} label="Immatriculation" value={nz(userDetails?.vehicleRegistration)} />
                      <DetailRow icon={<Users className="h-4 w-4" />} label="Capacité" value={userDetails?.vehicleCapacity != null ? `${userDetails.vehicleCapacity} pers.` : "Non renseigné"} />
                      <DetailRow
                        icon={<Briefcase className="h-4 w-4" />}
                        label="Bagages"
                        value={
                          userDetails?.vehicleLuggageLarge != null || userDetails?.vehicleLuggageSmall != null
                            ? `${userDetails?.vehicleLuggageLarge ?? 0} grands / ${userDetails?.vehicleLuggageSmall ?? 0} petits`
                            : "Non renseigné"
                        }
                      />
                    </DetailGrid>
                    <PhotoGallery
                      photos={[
                        { label: "Avant", url: userDetails?.vehiclePhotoFront },
                        { label: "Arrière", url: userDetails?.vehiclePhotoBack },
                        { label: "Intérieur", url: userDetails?.vehiclePhotoInterior },
                      ]}
                    />
                    {!userDetails?.vehiclePhotoFront &&
                      !userDetails?.vehiclePhotoBack &&
                      !userDetails?.vehiclePhotoInterior && (
                        <p className="text-xs text-muted-foreground italic mt-2">
                          Aucune photo de véhicule chargée
                        </p>
                      )}
                  </Section>
                )}

                {/* Documents KYC — TOUJOURS visible pour driver / supplier */}
                {(isDriver || selectedUser.role === "supplier") && (
                  <Section title="Documents (KYC)" icon={<FileText className="h-4 w-4" />}>
                    <DocsList
                      docs={[
                        { label: "Permis (recto)", url: userDetails?.driverLicenseFront },
                        { label: "Permis (verso)", url: userDetails?.driverLicenseBack },
                        { label: "Carte grise (recto)", url: userDetails?.vehicleRegistrationFront },
                        { label: "Carte grise (verso)", url: userDetails?.vehicleRegistrationBack },
                        { label: "Assurance", url: userDetails?.insuranceDocument },
                        { label: "Patente", url: userDetails?.patentDocument },
                      ]}
                    />
                    <DetailGrid>
                      <DetailRow icon={<Shield className="h-4 w-4" />} label="N° assurance" value={nz(userDetails?.insuranceNumber)} />
                      <DetailRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Souscrite le"
                        value={userDetails?.insuranceDateObtained ? formatDate(userDetails.insuranceDateObtained) : "Non renseigné"}
                      />
                      <DetailRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Expire le"
                        value={userDetails?.insuranceDateExpiration ? formatDate(userDetails.insuranceDateExpiration) : "Non renseigné"}
                      />
                    </DetailGrid>
                  </Section>
                )}

                {/* Compte / Audit — TOUJOURS visible */}
                <Section title="Compte" icon={<Wallet className="h-4 w-4" />}>
                  <DetailGrid>
                    <DetailRow icon={<Hash className="h-4 w-4" />} label="ID utilisateur" value={selectedUser.id} mono />
                    <DetailRow icon={<Users className="h-4 w-4" />} label="Rôle" value={roleLabels[selectedUser.role] || selectedUser.role} />
                    <DetailRow icon={<Users className="h-4 w-4" />} label="Type de compte" value={nz(userDetails?.accountType)} />
                    {userDetails?.clientKind && (
                      <DetailRow icon={<Users className="h-4 w-4" />} label="Sous-type client" value={userDetails.clientKind} />
                    )}
                    <DetailRow icon={<Mail className="h-4 w-4" />} label="Email vérifié" value={userDetails?.isVerified ? "Oui" : "Non"} />
                    <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Inscrit le" value={formatDateTime(selectedUser.createdAt)} />
                    <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Dernière modification" value={userDetails?.updatedAt ? formatDateTime(userDetails.updatedAt) : "—"} />
                    <DetailRow icon={<Globe className="h-4 w-4" />} label="Langue" value={userDetails?.locale ? userDetails.locale.toUpperCase() : "FR"} />
                    <DetailRow icon={<Globe className="h-4 w-4" />} label="Thème" value={nz(userDetails?.themeMode)} />
                    {userDetails?.googleId && (
                      <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="Compte Google" value="Connecté" />
                    )}
                    {userDetails?.appleId && (
                      <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="Compte Apple" value="Connecté" />
                    )}
                  </DetailGrid>
                </Section>

                {/* Workflow validation (fournisseurs) */}
                {isSupplier && (
                  <Section title="Processus de validation" icon={<CheckCircle2 className="h-4 w-4" />}>
                    <div className="space-y-3">
                      <WorkflowStep
                        step={1}
                        label="Vérification des informations du compte"
                        done={selectedUser.accountStatus === "active"}
                        active={selectedUser.accountStatus === "pending"}
                      />
                      <WorkflowStep
                        step={2}
                        label="Validation du contrat"
                        done={selectedUser.contractStatus === "validated"}
                        active={
                          selectedUser.accountStatus === "active" &&
                          selectedUser.contractStatus !== "validated"
                        }
                      />
                      <WorkflowStep
                        step={3}
                        label="Compte pleinement opérationnel"
                        done={
                          selectedUser.accountStatus === "active" &&
                          selectedUser.contractStatus === "validated"
                        }
                        active={false}
                      />
                    </div>
                  </Section>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  {selectedUser.accountStatus === "pending" && (
                    <>
                      <Button
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        disabled={actionLoading === selectedUser.id}
                        onClick={() => handleApprove(selectedUser)}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approuver
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        disabled={actionLoading === selectedUser.id}
                        onClick={() => handleReject(selectedUser)}
                      >
                        <XCircle className="h-4 w-4" /> Rejeter
                      </Button>
                    </>
                  )}

                  {selectedUser.accountStatus === "active" && (
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      disabled={actionLoading === selectedUser.id}
                      onClick={() => handleSuspend(selectedUser)}
                    >
                      <Ban className="h-4 w-4" /> Suspendre
                    </Button>
                  )}

                  {selectedUser.accountStatus === "suspended" && (
                    <Button
                      className="flex-1 gap-2"
                      disabled={actionLoading === selectedUser.id}
                      onClick={() => handleReactivate(selectedUser)}
                    >
                      <RotateCcw className="h-4 w-4" /> Réactiver
                    </Button>
                  )}

                  {isSupplier &&
                    selectedUser.accountStatus === "active" &&
                    selectedUser.contractStatus !== "validated" && (
                      <Button
                        className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                        disabled={actionLoading === selectedUser.id}
                        onClick={() => handleValidateContract(selectedUser)}
                      >
                        <FileText className="h-4 w-4" /> Valider contrat
                      </Button>
                    )}

                  {isSupplier &&
                    selectedUser.accountStatus === "active" &&
                    selectedUser.contractStatus === "validated" && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={actionLoading === selectedUser.id}
                        onClick={() => handleRejectContract(selectedUser)}
                      >
                        <XCircle className="h-4 w-4" /> Rejeter contrat
                      </Button>
                    )}

                  {selectedUser.accountStatus !== "pending" &&
                    selectedUser.role !== "admin" && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-red-700 border-red-200 hover:bg-red-50"
                        disabled={actionLoading === selectedUser.id}
                        onClick={() => setUserToDelete(selectedUser)}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (
                <>
                  Vous êtes sur le point de supprimer définitivement{" "}
                  <strong>{userToDelete.fullName}</strong> (
                  {userToDelete.email || userToDelete.phone}).
                  <br />
                  Cette action est <strong>irréversible</strong>. L'historique des
                  réservations terminées sera conservé mais détaché de l'utilisateur.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === userToDelete?.id}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === userToDelete?.id}
              onClick={() => userToDelete && handleDelete(userToDelete)}
            >
              {actionLoading === userToDelete?.id
                ? "Suppression…"
                : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

/* -------- Helpers d'affichage -------------------------------------------- */

const initials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                            */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "green" | "yellow" | "red";
}) => {
  const tones = {
    default: "bg-card border-border",
    green: "bg-green-50 border-green-200 text-green-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    red: "bg-red-50 border-red-200 text-red-900",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  link,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  link?: boolean;
  mono?: boolean;
}) => (
  <div className="flex items-center gap-2 text-sm py-1.5 border-b border-border/40 last:border-b-0">
    <span className="text-muted-foreground shrink-0">{icon}</span>
    <span className="text-muted-foreground w-32 shrink-0 text-xs">{label}</span>
    {link && value && value !== "—" ? (
      <a
        href={value.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noreferrer"
        className={`font-medium text-primary hover:underline truncate ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </a>
    ) : (
      <span
        className={`font-medium text-foreground truncate ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    )}
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="border border-border rounded-xl p-4 bg-card">
    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
      {icon && <span className="text-primary">{icon}</span>}
      {title}
    </h4>
    {children}
  </div>
);

const DetailGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">{children}</div>
);

const StatusPill = ({ color, label }: { color?: string; label: string }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color || "bg-muted text-muted-foreground border-border"}`}
  >
    {label}
  </span>
);

const MiniStat = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg border border-border bg-muted/30 p-2.5">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
  </div>
);

const ChipsRow = ({
  label,
  items,
  icon,
}: {
  label: string;
  items: string[];
  icon?: React.ReactNode;
}) => (
  <div className="mt-3">
    <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={`${it}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
        >
          {icon}
          {it}
        </span>
      ))}
    </div>
  </div>
);

const PhotoGallery = ({
  photos,
}: {
  photos: Array<{ label: string; url?: string | null }>;
}) => {
  const valid = photos.filter((p) => p.url);
  if (valid.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-2">Photos véhicule</p>
      <div className="grid grid-cols-3 gap-2">
        {valid.map((p) => (
          <a
            key={p.label}
            href={p.url!}
            target="_blank"
            rel="noreferrer"
            className="block group"
          >
            <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={p.url!}
                alt={p.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-[10px] text-center mt-1 text-muted-foreground">
              {p.label}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

const DocsList = ({
  docs,
}: {
  docs: Array<{ label: string; url?: string | null }>;
}) => {
  const valid = docs.filter((d) => d.url);
  if (valid.length === 0)
    return (
      <p className="text-xs text-muted-foreground italic">
        Aucun document chargé
      </p>
    );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {valid.map((d) => (
        <a
          key={d.label}
          href={d.url!}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors text-sm"
        >
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1 truncate">{d.label}</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
};

const WorkflowStep = ({
  step,
  label,
  done,
  active,
}: {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done
          ? "bg-green-100 text-green-700"
          : active
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
    <span
      className={`text-sm ${
        done
          ? "text-green-700 font-medium"
          : active
            ? "text-primary font-medium"
            : "text-muted-foreground"
      }`}
    >
      {label}
      {active && <Clock className="inline h-3.5 w-3.5 ml-1.5" />}
    </span>
  </div>
);

export default AdminUsers;
