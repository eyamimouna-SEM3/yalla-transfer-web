import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoginModal from "./LoginModal";

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

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("FR");
  const [currency, setCurrency] = useState("EUR");
  const [loginOpen, setLoginOpen] = useState(false);

  const navItems = [
    { label: "À propos", href: "/#apropos" },
    { label: "Notre App", href: "/app" },
    { label: "Nos partenaires", href: "/#partenaires" },
    { label: "Contact", href: "/contact" },
  ];

  const currentCurrency = currencies.find((c) => c.code === currency)!;
  const currentLang = languages.find((l) => l.code === lang)!;

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

            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              onClick={() => setLoginOpen(true)}
            >
              Connexion
            </Button>
            <Button size="sm" className="rounded-full shadow-button bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200" asChild>
              <Link to="/inscription">S'inscrire</Link>
            </Button>
          </div>

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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-full border-primary text-primary"
                onClick={() => { setMobileOpen(false); setLoginOpen(true); }}
              >
                Connexion
              </Button>
              <Button size="sm" className="flex-1 rounded-full shadow-button bg-accent text-accent-foreground" asChild>
                <Link to="/inscription" onClick={() => setMobileOpen(false)}>S'inscrire</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};

export default Header;
