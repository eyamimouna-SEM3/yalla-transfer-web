import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, MessageSquare, AlertTriangle, Send, Clock } from "lucide-react";

const notifTypes = [
  { id: "email", label: "Email global", icon: Mail, description: "Envoyer un email à tous les utilisateurs ou un segment" },
  { id: "push", label: "Notification push", icon: Bell, description: "Notification in-app en temps réel" },
  { id: "info", label: "Message d'information", icon: MessageSquare, description: "Publier un message visible sur le dashboard" },
  { id: "alert", label: "Alerte système", icon: AlertTriangle, description: "Déclencher une alerte urgente sur la plateforme" },
];

const recentNotifs = [
  { type: "email", title: "Promotion été 2026", target: "Tous les clients B2C", date: "01/03/2026 10:00", status: "sent" },
  { type: "push", title: "Nouvelle fonctionnalité disponible", target: "Tous les utilisateurs", date: "28/02/2026 14:30", status: "sent" },
  { type: "alert", title: "Maintenance prévue — 05/03", target: "Tous", date: "27/02/2026 09:00", status: "scheduled" },
  { type: "info", title: "Mise à jour des CGU", target: "Fournisseurs", date: "25/02/2026 11:00", status: "sent" },
];

const AdminNotifications = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications & Contenu</h1>
        <p className="text-sm text-muted-foreground">Gérer les communications de la plateforme</p>
      </div>

      {/* Notif types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {notifTypes.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelectedType(selectedType === n.id ? null : n.id)}
            className={`text-left p-5 rounded-2xl border transition-all ${
              selectedType === n.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <n.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm">{n.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{n.description}</p>
          </button>
        ))}
      </div>

      {/* Compose */}
      {selectedType && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Composer — {notifTypes.find((n) => n.id === selectedType)?.label}
          </h3>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Titre</label>
              <Input placeholder="Titre de la notification..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
              <textarea
                placeholder="Contenu du message..."
                className="w-full min-h-[120px] rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button className="gap-2"><Send className="h-4 w-4" /> Envoyer maintenant</Button>
              <Button variant="outline" className="gap-2"><Clock className="h-4 w-4" /> Planifier</Button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Historique des notifications</h3>
        <div className="space-y-3">
          {recentNotifs.map((n, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {n.type === "email" && <Mail className="h-4 w-4 text-primary" />}
                  {n.type === "push" && <Bell className="h-4 w-4 text-primary" />}
                  {n.type === "info" && <MessageSquare className="h-4 w-4 text-primary" />}
                  {n.type === "alert" && <AlertTriangle className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.target} · {n.date}</p>
                </div>
              </div>
              <Badge variant={n.status === "sent" ? "default" : "secondary"}>
                {n.status === "sent" ? "Envoyé" : "Planifié"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
