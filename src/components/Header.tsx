import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import LoginModal from "./LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

// Calcule les initiales (2 lettres max) pour l'avatar fallback.
const getInitials = (name?: string, email?: string) => {
  const base = name?.trim() || email?.trim() || "?";
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Détermine la route du dashboard selon le rôle de l'utilisateur.
const dashboardPath = (role?: string) => {
  if (role === "admin") return "/admin";
  return "/dashboard";
};

// Les libellés sont maintenant traduits via t() — voir dashboardLabel/roleLabel
// dans le composant Header qui utilise useLocale().

// Construit le state à passer au dashboard pour qu'il affiche le bon profil.
// Note : driver_employee n'existe que côté mobile, pas traité ici.
const dashboardState = (
  role?: string,
  name?: string,
): { profile: string; name: string } | undefined => {
  if (role === "admin") return undefined;
  let profile = "particulier";
  if (role === "client_b2b" || role === "client_company") profile = "corporate";
  else if (role === "supplier") profile = "transport";
  else if (role === "driver_independent") profile = "chauffeur";
  return { profile, name: name || "Utilisateur" };
};

const currencies = [
  { code: "EUR", symbol: "€", label: "" },
  { code: "TND", symbol: "DT", label: "" },
  { code: "USD", symbol: "$", label: "Dollar" },
];

const languages = [
  { code: "FR", label: "", flag: "🇫🇷" },
  { code: "EN", label: "", flag: "🇬🇧" },
  { code: "ES", label: "", flag: "🇪🇸" },
];

// Libellés traduits — utilisés par renderAvatarMenu et le dropdown.
const roleLabelKey = (role?: string): string => {
  switch (role) {
    case "admin": return "roles.admin";
    case "supplier": return "roles.supplier";
    case "driver_independent": return "roles.driver_independent";
    case "client_b2b":
    case "client_company": return "roles.client_b2b";
    case "client_b2c":
    case "client": return "roles.client_b2c";
    default: return "roles.user";
  }
};

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currency, setCurrency] = useState("EUR");
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();

  // Synchronise le sélecteur de langue du header avec i18next
  const lang = locale.toUpperCase();
  const setLang = (next: string) => setLocale(next.toLowerCase() as "fr" | "en" | "es");

  const navItems = [
    { label: t("header.about"), href: "/#apropos" },
    { label: t("header.ourApp"), href: "/app" },
    { label: t("header.partners"), href: "/#partenaires" },
    { label: t("header.contact"), href: "/contact" },
  ];

  const currentCurrency = currencies.find((c) => c.code === currency)!;
  const currentLang = languages.find((l) => l.code === lang)!;

  const displayName = user?.fullName || user?.full_name || user?.email || "";
  const userInitials = getInitials(displayName, user?.email);
  const userAvatarUrl = user?.avatar_url;

  const handleGoToDashboard = () => {
    if (!user) return;
    const path = dashboardPath(user.role);
    const state = dashboardState(user.role, displayName);
    navigate(path, state ? { state } : undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Rendu de l'avatar dropdown — réutilisé desktop + mobile.
  const renderAvatarMenu = (compact: boolean = false) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative ${compact ? "h-9 w-9" : "h-10 w-10"} rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 overflow-hidden border-2 border-primary/30 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-center`}
          aria-label="Menu utilisateur"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-primary font-bold text-sm">
              {userInitials}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[240px] rounded-xl shadow-lg border-border/60 mt-2"
      >
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden shrink-0">
              {userAvatarUrl ? (
                <img
                  src={userAvatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-primary font-bold text-sm">
                  {userInitials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground truncate">
                {displayName || "Utilisateur"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t(roleLabelKey(user?.role))}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleGoToDashboard}
          className="cursor-pointer rounded-lg gap-2 py-2.5"
        >
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span>{t("header.myDashboard")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer rounded-lg gap-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>{t("common.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <span className="text-primary-foreground font-display font-bold text-sm">YT</span>
            </div>
            <span className="font-display font-bold text-foreground text-lg hidden sm:inline">
              Yalla Transfer
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Currency Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200">
                  <span className="font-bold text-foreground">{currentCurrency.symbol}</span>
                  <span>{currentCurrency.code}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl shadow-lg border-border/60 px-[5px] pr-[64px] pb-0 pt-[2px] pl-[3px] mx-[30px] my-[13px] mt-[9px] mr-0">
                {currencies.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`cursor-pointer rounded-lg ${currency === c.code ? "bg-primary/10 text-primary font-semibold" : "px-0"}`}
                  >
                    <span className="font-bold mr-3 text-base">{c.symbol}</span>
                    <span>{c.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200">
                  <span className="text-base leading-none">{currentLang.flag}</span>
                  <span>{currentLang.code}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[170px] rounded-xl shadow-lg border-border/60">
                {languages.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`cursor-pointer rounded-lg ${lang === l.code ? "bg-primary/10 text-primary font-semibold" : ""}`}
                  >
                    <span className="text-lg mr-3">{l.flag}</span>
                    <span>{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {authLoading ? (
              // Pendant la restauration de session (au boot), on évite de
              // flasher les boutons Connexion/S'inscrire alors que l'utilisateur
              // est en réalité connecté. Skeleton circulaire à la place de
              // l'avatar.
              <div
                className="h-10 w-10 rounded-full bg-muted animate-pulse"
                aria-label="Chargement de votre session"
              />
            ) : user ? (
              renderAvatarMenu()
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  onClick={() => setLoginOpen(true)}
                >
                  {t("header.login")}
                </Button>
                <Button size="sm" className="rounded-full shadow-button bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200" asChild>
                  <Link to="/inscription">{t("header.register")}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile : avatar visible si connecté, à côté du toggle.
              Pendant authLoading, skeleton compact pour éviter le flash. */}
          {authLoading ? (
            <div className="lg:hidden flex items-center mr-2">
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            </div>
          ) : user ? (
            <div className="lg:hidden flex items-center mr-2">
              {renderAvatarMenu(true)}
            </div>
          ) : null}

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-background border-b border-border px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3 mb-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary py-2 px-3 rounded-lg hover:bg-primary/5 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 mb-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs font-medium border border-border rounded-full px-3 py-1.5">
                    <span className="font-bold">{currentCurrency.symbol}</span>
                    <span>{currentCurrency.code}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl">
                  {currencies.map((c) => (
                    <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)} className="cursor-pointer">
                      <span className="font-bold mr-2">{c.symbol}</span>{c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs font-medium border border-border rounded-full px-3 py-1.5">
                    <span className="text-base leading-none">{currentLang.flag}</span>
                    <span>{currentLang.code}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl">
                  {languages.map((l) => (
                    <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="cursor-pointer">
                      <span className="text-base mr-2">{l.flag}</span>{l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {authLoading ? (
              // Skeleton placeholder pendant la restauration de session pour
              // éviter le flash "non connecté".
              <div className="h-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 justify-start"
                  onClick={() => {
                    setMobileOpen(false);
                    handleGoToDashboard();
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("header.myDashboard")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 justify-start text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full border-primary text-primary"
                  onClick={() => { setMobileOpen(false); setLoginOpen(true); }}
                >
                  {t("header.login")}
                </Button>
                <Button size="sm" className="flex-1 rounded-full shadow-button bg-accent text-accent-foreground" asChild>
                  <Link to="/inscription" onClick={() => setMobileOpen(false)}>{t("header.register")}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default Header;
