import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  DollarSign,
  CalendarCheck2,
  ShieldCheck,
  CreditCard,
  Wrench,
  Save,
  RotateCcw,
  Loader2,
  UserCog,
} from "lucide-react";
import { adminService, type AdminSetting } from "@/services/adminService";
import { SettingsContent } from "@/pages/DashboardPage";

const categoryMeta: Record<
  string,
  { label: string; description: string; icon: React.ElementType }
> = {
  platform: {
    label: "Plateforme",
    description: "Identité de la plateforme, support et préférences globales",
    icon: Building2,
  },
  pricing: {
    label: "Tarification",
    description: "Commissions, taxes et frais appliqués aux réservations",
    icon: DollarSign,
  },
  booking: {
    label: "Réservation",
    description: "Règles métier des réservations (délais, limites, expirations)",
    icon: CalendarCheck2,
  },
  validation: {
    label: "Workflow",
    description: "Validation des inscriptions et vérifications de sécurité",
    icon: ShieldCheck,
  },
  payment: {
    label: "Paiement",
    description: "Méthodes de paiement actives sur la plateforme",
    icon: CreditCard,
  },
  maintenance: {
    label: "Maintenance",
    description: "Mode maintenance et contrôle des inscriptions",
    icon: Wrench,
  },
};

const CATEGORY_ORDER = [
  "platform",
  "pricing",
  "booking",
  "validation",
  "payment",
  "maintenance",
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Valeurs locales modifiées (clé -> nouvelle valeur)
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  // Onglet actif (par défaut "profile"). Sert à masquer les boutons Save/Cancel
  // du header quand on est sur "Mon profil" (SettingsContent a ses propres boutons).
  const [activeTab, setActiveTab] = useState<string>("profile");

  // Chargement initial
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSettings();
        setSettings(data);
      } catch (err: any) {
        toast({
          title: "Erreur de chargement",
          description: err?.message || "Impossible de charger les paramètres.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Regroupement par catégorie
  const byCategory = useMemo(() => {
    const m = new Map<string, AdminSetting[]>();
    for (const s of settings) {
      const arr = m.get(s.category) ?? [];
      arr.push(s);
      m.set(s.category, arr);
    }
    return m;
  }, [settings]);

  // Valeur courante (draft prioritaire sur la base)
  const currentValue = (s: AdminSetting) =>
    draft[s.key] !== undefined ? draft[s.key] : s.value;

  const setValue = (key: string, value: string | number | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = Object.keys(draft).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await adminService.updateSettings(draft);
      // Mise à jour locale
      setSettings((prev) =>
        prev.map((s) =>
          draft[s.key] !== undefined ? { ...s, value: draft[s.key] } : s,
        ),
      );
      setDraft({});
      toast({
        title: "Paramètres enregistrés",
        description: `${Object.keys(draft).length} valeur(s) mise(s) à jour.`,
      });
    } catch (err: any) {
      toast({
        title: "Échec de l'enregistrement",
        description:
          err?.response?.data?.message || err?.message || "Réessaie.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft({});
    toast({
      title: "Modifications annulées",
      description: "Les valeurs ont été restaurées.",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Paramètres
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "profile"
              ? "Gère ton profil personnel, ton mot de passe et tes préférences."
              : "Configuration de la plateforme. Les changements prennent effet immédiatement."}
          </p>
        </div>
        {/* Les boutons Save/Cancel concernent uniquement les paramètres
            plateforme. Sur l'onglet "Mon profil", SettingsContent a ses propres
            boutons par section → on masque ceux-ci pour éviter la confusion. */}
        {activeTab !== "profile" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                  {hasChanges && (
                    <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">
                      {Object.keys(draft).length}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 border border-border/50 h-auto flex-wrap">
          {/* Onglet "Mon profil" — paramètres personnels de l'admin
              (nom, mot de passe, langue, thème). Placé en premier. */}
          <TabsTrigger
            value="profile"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <UserCog className="h-4 w-4" />
            Mon profil
          </TabsTrigger>
          {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
            const meta = categoryMeta[cat];
            const Icon = meta?.icon || Building2;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                {meta?.label || cat}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu de l'onglet "Mon profil" — réutilise SettingsContent qui est
            le même panneau que pour les clients/suppliers/chauffeurs. */}
        <TabsContent
          value="profile"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <SettingsContent />
        </TabsContent>

        {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
          const meta = categoryMeta[cat];
          const items = byCategory.get(cat)!;
          return (
            <TabsContent
              key={cat}
              value={cat}
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="mb-5 pb-4 border-b border-border">
                  <h2 className="font-semibold text-lg text-foreground">
                    {meta?.label || cat}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {meta?.description}
                  </p>
                </div>
                <div className="space-y-5">
                  {items.map((s) => (
                    <SettingRow
                      key={s.key}
                      setting={s}
                      value={currentValue(s)}
                      modified={draft[s.key] !== undefined}
                      onChange={(v) => setValue(s.key, v)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </AdminLayout>
  );
};

/* ---------- Composant ligne paramètre ---------------------------------- */

const SettingRow = ({
  setting,
  value,
  modified,
  onChange,
}: {
  setting: AdminSetting;
  value: string | number | boolean;
  modified: boolean;
  onChange: (v: string | number | boolean) => void;
}) => {
  const isLongText =
    setting.type === "text" && (setting.key.endsWith(".message") || String(value).length > 80);

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-3 items-start py-3 border-b border-border/40 last:border-b-0 ${modified ? "bg-primary/5 -mx-3 px-3 rounded-lg" : ""}`}
    >
      <div>
        <Label htmlFor={setting.key} className="text-sm font-medium text-foreground">
          {setting.label}
          {modified && (
            <span className="ml-2 text-[10px] font-medium text-primary">
              (modifié)
            </span>
          )}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {setting.key}
        </p>
      </div>
      <div>
        {setting.type === "boolean" && (
          <div className="flex items-center gap-2">
            <Switch
              id={setting.key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "Activé" : "Désactivé"}
            </span>
          </div>
        )}

        {setting.type === "number" && (
          <Input
            id={setting.key}
            type="number"
            value={String(value)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(n);
            }}
            className="h-10"
          />
        )}

        {setting.type === "text" && !isLongText && (
          <Input
            id={setting.key}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-10"
          />
        )}

        {setting.type === "text" && isLongText && (
          <Textarea
            id={setting.key}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
        )}

        {setting.type === "select" && (
          <Select
            value={String(value)}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger id={setting.key} className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(setting.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
