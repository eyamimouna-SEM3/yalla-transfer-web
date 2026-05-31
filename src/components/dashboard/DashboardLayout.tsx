import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { ProfileType } from "@/pages/AuthPage";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";

export interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

interface Props {
  profile: ProfileType;
  userName: string;
  navItems: NavItem[];
  activeItem: string;
  onNavChange: (id: string) => void;
  children: React.ReactNode;
  /** Nombre de notifications non lues à afficher sur la cloche du header. */
  unreadNotifications?: number;
}

// Clés i18n pour les libellés de rôle (résolues par `t()` au rendu).
const profileLabelKeys: Record<string, string> = {
  particulier: "roles.client_b2c",
  corporate: "roles.client_b2b",
  transport: "roles.supplier",
  chauffeur: "roles.driver_independent",
};

const DashboardLayout = ({
  profile,
  userName,
  navItems,
  activeItem,
  onNavChange,
  children,
  unreadNotifications = 0,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLocale();
  const { signOut } = useAuth();

  // Déconnexion effective : purge le token/user du localStorage, déconnecte
  // les sockets temps réel, puis ramène l'utilisateur sur la home publique.
  const handleConfirmLogout = async () => {
    await signOut();
    setLogoutOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-muted/50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border flex flex-col transition-all duration-300 sticky top-0 h-screen",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">YT</span>
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-foreground truncate">
                Yalla Transfer
              </span>
            )}
          </Link>
        </div>

        {/* User info */}
        <div className={cn("px-4 py-4 border-b border-border", collapsed && "px-2 py-3")}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t(profileLabelKeys[profile || "particulier"])}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeItem === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-border space-y-1">
          <button
            onClick={() => onNavChange("settings")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeItem === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t("common.settings")}</span>}
          </button>
          <button
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t("common.logout")}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("common.searchPlaceholder")}
                className="bg-transparent text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavChange("notifications")}
              className="relative w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
              aria-label="Voir les notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-semibold text-xs">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl">{children}</div>
      </main>

      {/* Dialog de confirmation de déconnexion : affiché au clic sur le
          bouton "Déconnexion" de la sidebar. Évite les déconnexions
          accidentelles et purge proprement la session (token + sockets)
          avant la redirection vers la home. */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Voulez-vous vraiment vous déconnecter ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous serez redirigé vers la page d'accueil et devrez vous reconnecter pour accéder à votre espace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardLayout;
