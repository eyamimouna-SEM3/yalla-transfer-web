import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Pencil, Users, Truck, CheckCircle2, XCircle, FileText, Clock, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MockUser {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  role: string;
  accountStatus?: string;
  contractStatus?: string;
}

const initialUsers: MockUser[] = [
  { id: 1, name: "Ahmed Ben Salah", email: "ahmed@mail.com", type: "Client Particulier", status: "active", role: "client" },
  { id: 2, name: "StarTech Corp.", email: "contact@startech.tn", type: "Client Corporate", status: "active", role: "client" },
  { id: 3, name: "TransMed SA", email: "info@transmed.tn", type: "Société de transport", status: "active", role: "fournisseur", accountStatus: "pending", contractStatus: "none" },
  { id: 4, name: "Karim Jaziri", email: "karim.j@mail.com", type: "Chauffeur indépendant", status: "active", role: "fournisseur", accountStatus: "approved", contractStatus: "signed" },
  { id: 5, name: "Marie Dupont", email: "marie.d@mail.com", type: "Client Particulier", status: "inactive", role: "client" },
  { id: 6, name: "Société Rapide", email: "rapide@transport.tn", type: "Société de transport", status: "suspended", role: "fournisseur", accountStatus: "approved", contractStatus: "validated" },
  { id: 7, name: "Nadia Trabelsi", email: "nadia.t@corp.tn", type: "Client Corporate", status: "active", role: "client" },
  { id: 8, name: "Slim Bouzid", email: "slim.b@mail.com", type: "Chauffeur indépendant", status: "inactive", role: "fournisseur", accountStatus: "pending", contractStatus: "none" },
];

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Actif", variant: "default" },
  inactive: { label: "Inactif", variant: "secondary" },
  suspended: { label: "Suspendu", variant: "destructive" },
};

const accountStatusStyles: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "Approuvé", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-800 border-red-200" },
  active: { label: "Actif", color: "bg-blue-100 text-blue-800 border-blue-200" },
};

const contractStatusStyles: Record<string, { label: string; color: string }> = {
  none: { label: "Non envoyé", color: "bg-gray-100 text-gray-600 border-gray-200" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-800 border-blue-200" },
  signed: { label: "Signé", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  validated: { label: "Validé", color: "bg-green-100 text-green-800 border-green-200" },
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<MockUser[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateUser = (id: number, updates: Partial<MockUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (selectedUser?.id === id) {
      setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleApprove = (user: MockUser) => {
    updateUser(user.id, { accountStatus: "approved", contractStatus: "sent" });
    toast({
      title: "✅ Compte approuvé",
      description: `${user.name} a été approuvé. Le contrat a été envoyé.`,
    });
  };

  const handleReject = (user: MockUser) => {
    updateUser(user.id, { accountStatus: "rejected" });
    toast({
      title: "❌ Compte rejeté",
      description: `La demande de ${user.name} a été rejetée.`,
      variant: "destructive",
    });
  };

  const handleValidateContract = (user: MockUser) => {
    updateUser(user.id, { contractStatus: "validated", status: "active", accountStatus: "active" });
    toast({
      title: "🎉 Compte activé",
      description: `${user.name} est maintenant actif et peut accéder à son dashboard.`,
    });
  };

  const handleSendContract = (user: MockUser) => {
    updateUser(user.id, { contractStatus: "sent" });
    toast({
      title: "📄 Contrat envoyé",
      description: `Le contrat a été envoyé à ${user.name}.`,
    });
  };

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const clients = filtered.filter(u => u.role === "client");
  const fournisseurs = filtered.filter(u => u.role === "fournisseur");

  const renderClientTable = (users: MockUser[]) => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
              <TableCell><Badge variant="outline">{user.type}</Badge></TableCell>
              <TableCell><Badge variant={statusStyles[user.status]?.variant || "secondary"}>{statusStyles[user.status]?.label || user.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderFournisseurTable = (users: MockUser[]) => (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Validation</TableHead>
            <TableHead>Contrat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const accStatus = user.accountStatus || "pending";
            const conStatus = user.contractStatus || "none";
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell><Badge variant="outline">{user.type}</Badge></TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${accountStatusStyles[accStatus]?.color || ""}`}>
                    {accountStatusStyles[accStatus]?.label || accStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${contractStatusStyles[conStatus]?.color || ""}`}>
                    {contractStatusStyles[conStatus]?.label || conStatus}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUser(user); setDialogOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {accStatus === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Approuver" onClick={() => handleApprove(user)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Rejeter" onClick={() => handleReject(user)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {accStatus === "approved" && conStatus === "none" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Envoyer le contrat" onClick={() => handleSendContract(user)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {accStatus === "approved" && conStatus === "signed" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Valider le contrat" onClick={() => handleValidateContract(user)}>
                        <FileText className="h-4 w-4" />
                      </Button>
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

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{users.length} utilisateurs inscrits</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter un utilisateur</Button>
      </div>

      <div className="relative flex-1 max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom ou email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border border-border/50">
          <TabsTrigger value="clients" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="h-4 w-4"/> Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="fournisseurs" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Truck className="h-4 w-4"/> Fournisseurs ({fournisseurs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {renderClientTable(clients)}
        </TabsContent>
        <TabsContent value="fournisseurs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {renderFournisseurTable(fournisseurs)}
        </TabsContent>
      </Tabs>

      {/* Supplier detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du fournisseur</DialogTitle>
            <DialogDescription>Informations et statut de validation</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nom</span>
                  <p className="font-medium text-foreground">{selectedUser.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium text-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium text-foreground">{selectedUser.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Validation</span>
                  <p className="font-medium text-foreground">
                    {accountStatusStyles[selectedUser.accountStatus || "pending"]?.label}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contrat</span>
                  <p className="font-medium text-foreground">
                    {contractStatusStyles[selectedUser.contractStatus || "none"]?.label}
                  </p>
                </div>
              </div>

              {/* Workflow steps */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Processus de validation</h4>
                <WorkflowStep
                  step={1}
                  label="Vérification des informations"
                  done={selectedUser.accountStatus !== "pending"}
                  active={selectedUser.accountStatus === "pending"}
                />
                <WorkflowStep
                  step={2}
                  label="Signature du contrat"
                  done={selectedUser.contractStatus === "signed" || selectedUser.contractStatus === "validated"}
                  active={selectedUser.accountStatus === "approved" && (selectedUser.contractStatus === "none" || selectedUser.contractStatus === "sent")}
                />
                <WorkflowStep
                  step={3}
                  label="Activation du compte"
                  done={selectedUser.contractStatus === "validated"}
                  active={selectedUser.contractStatus === "signed"}
                />
              </div>

              <div className="flex gap-2 pt-2">
                {selectedUser.accountStatus === "pending" && (
                  <>
                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => { handleApprove(selectedUser); }}>
                      <CheckCircle2 className="h-4 w-4" /> Approuver
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-2" onClick={() => { handleReject(selectedUser); }}>
                      <XCircle className="h-4 w-4" /> Rejeter
                    </Button>
                  </>
                )}
                {selectedUser.accountStatus === "approved" && selectedUser.contractStatus === "none" && (
                  <Button className="w-full gap-2" onClick={() => { handleSendContract(selectedUser); }}>
                    <Send className="h-4 w-4" /> Envoyer le contrat
                  </Button>
                )}
                {selectedUser.accountStatus === "approved" && selectedUser.contractStatus === "signed" && (
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" onClick={() => { handleValidateContract(selectedUser); }}>
                    <CheckCircle2 className="h-4 w-4" /> Valider le contrat & activer le compte
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const WorkflowStep = ({ step, label, done, active }: { step: number; label: string; done: boolean; active: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-green-100 text-green-700" : active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
    <span className={`text-sm ${done ? "text-green-700 font-medium" : active ? "text-primary font-medium" : "text-muted-foreground"}`}>
      {label}
      {active && <Clock className="inline h-3.5 w-3.5 ml-1.5" />}
    </span>
  </div>
);

export default AdminUsers;
