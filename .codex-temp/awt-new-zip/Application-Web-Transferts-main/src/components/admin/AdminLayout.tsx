import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Repeat2,
  CreditCard,
  BarChart3,
  Bell,
  Search,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Utilisateurs", path: "/admin/users" },
  { icon: CalendarDays, label: "Réservations", path: "/admin/reservations" },
  
  { icon: CreditCard, label: "Transactions", path: "/admin/payments" },
  { icon: BarChart3, label: "Reporting & KPI", path: "/admin/reporting" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const sidebar = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">YT</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display font-bold text-foreground text-sm truncate block">
                Yalla Transfer
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">ADMIN PANEL</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <p className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2", collapsed && "hidden")}>
          Menu principal
        </p>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.path)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        <Link
          to="/admin/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm items-center justify-center hover:bg-primary/10 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex bg-card border-r border-border flex-col transition-all duration-300 sticky top-0 h-screen relative",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Rechercher..." className="bg-transparent text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">5</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-primary font-semibold text-xs">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground">Admin</p>
                <p className="text-[10px] text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
