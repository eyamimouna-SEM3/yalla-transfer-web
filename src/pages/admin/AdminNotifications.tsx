import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Mail, Bell, MessageSquare, AlertTriangle, Send, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminService, type AdminNotification } from "@/services/adminService";
import { validators, validateAll } from "@/utils/validators";

const notifTypes = [
  { id: "info", label: "Information", icon: MessageSquare, description: "Message d'information général" },
  { id: "promo", label: "Promotion", icon: Mail, description: "Campagne promotionnelle" },
  { id: "alert", label: "Alerte système", icon: AlertTriangle, description: "Alerte urgente plateforme" },
  { id: "booking", label: "Notification réservation", icon: Bell, description: "Notification liée aux courses" },
];

const targetOptions = [
  { value: "all", label: "Tous les utilisateurs" },
  { value: "client_b2c", label: "Clients particuliers" },
  { value: "client_b2b", label: "Clients corporate" },
  { value: "supplier", label: "Fournisseurs" },
  { value: "driver_independent", label: "Chauffeurs indépendants" },
  { value: "driver_employee", label: "Chauffeurs salariés" },
  { value: "admin", label: "Administrateurs" },
];

const typeIcon = (type: string) => {
  switch (type) {
    case "promo": return Mail;
    case "alert": return AlertTriangle;
    case "booking": return Bell;
    default: return MessageSquare;
  }
};

const AdminNotifications = () => {
  const [selectedType, setSelectedType] = useState<string>("info");
  const [target, setTarget] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoadError(null);
      const data = await adminService.getNotifications();
      setNotifications(data);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      setLoadError(err.status === 401 || err.status === 403
        ? "Accès réservé aux administrateurs."
        : err.message ?? "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async () => {
    const errs = validateAll({
      title: () => validators.required(title, "Titre"),
      message: () => validators.required(message, "Message"),
    });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSending(true);
    try {
      const result = await adminService.broadcastNotification({
        title: title.trim(),
        body: message.trim(),
        type: selectedType,
        targetRole: target === "all" ? undefined : target,
      });
      toast({
        title: "Notification envoyée",
        description: result.message,
      });
      setTitle("");
      setMessage("");
      void fetchNotifications();
    } catch (e) {
      const err = e as { message?: string };
      toast({
        title: "Envoi impossible",
        description: err.message ?? "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Diffuser des messages à tes utilisateurs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {notifTypes.map((n) => (
          <button
            key={n.id}
            onClick={() => setSelectedType(n.id)}
            className={`text-left p-5 rounded-2xl border transition-all ${
              selectedType === n.id ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
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

      <div className="bg-card rounded-2xl border border-border p-6 mb-8">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Composer — {notifTypes.find((n) => n.id === selectedType)?.label}
        </h3>
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Destinataires</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Titre <span className="text-destructive">*</span></label>
            <Input
              placeholder="Ex : Maintenance prévue dimanche"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              aria-invalid={!!errors.title}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.title}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{title.length}/150 caractères</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Message <span className="text-destructive">*</span></label>
            <textarea
              placeholder="Contenu du message…"
              className={`w-full min-h-[120px] rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none ${
                errors.message ? "border-destructive" : "border-input"
              }`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
            {errors.message && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{message.length}/1000 caractères</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Envoi…" : "Envoyer maintenant"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Historique des notifications</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : loadError ? (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {loadError}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune notification envoyée.</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {notifications.map((n) => {
              const Icon = typeIcon(n.type);
              return (
                <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {n.user ? `${n.user.fullName} (${n.user.role})` : "Système"} · {new Date(n.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={n.read ? "outline" : "default"} className="text-[10px] flex-shrink-0">
                    {n.read ? "Lu" : "Non lu"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
