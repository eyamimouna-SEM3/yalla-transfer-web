import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

// Curated list with Tunisia first, then common countries
export const COUNTRIES: Country[] = [
  { code: "TN", dial: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "FR", dial: "+33",  flag: "🇫🇷", name: "France" },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "Allemagne" },
  { code: "IT", dial: "+39",  flag: "🇮🇹", name: "Italie" },
  { code: "ES", dial: "+34",  flag: "🇪🇸", name: "Espagne" },
  { code: "BE", dial: "+32",  flag: "🇧🇪", name: "Belgique" },
  { code: "CH", dial: "+41",  flag: "🇨🇭", name: "Suisse" },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "NL", dial: "+31",  flag: "🇳🇱", name: "Pays-Bas" },
  { code: "PT", dial: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "DZ", dial: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "MA", dial: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "LY", dial: "+218", flag: "🇱🇾", name: "Libye" },
  { code: "EG", dial: "+20",  flag: "🇪🇬", name: "Égypte" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "Émirats A.U." },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Arabie Saoudite" },
  { code: "QA", dial: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "TR", dial: "+90",  flag: "🇹🇷", name: "Turquie" },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "USA / Canada" },
  { code: "CA", dial: "+1",   flag: "🇨🇦", name: "Canada" },
];

interface WhatsAppInputProps {
  country: Country;
  onCountryChange: (c: Country) => void;
  number: string;
  onNumberChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const WhatsAppInput = ({
  country, onCountryChange, number, onNumberChange,
  label = "N° WhatsApp", placeholder = "XX XXX XXX", className,
}: WhatsAppInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  );

  return (
    <div className={cn("relative", className)}>
      {label && <label className="text-xs font-semibold text-foreground mb-1 block">{label}</label>}
      <div className="flex w-full rounded-xl border border-border bg-muted/50 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-muted transition-colors border-r border-border shrink-0"
          aria-label="Sélectionner pays"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-sm font-semibold text-foreground">{country.dial}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s]/g, "").slice(0, 15))}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          maxLength={15}
        />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full sm:w-72 max-h-72 overflow-hidden bg-popover border border-border rounded-xl shadow-lg animate-in fade-in-0 slide-in-from-top-2">
            <div className="p-2 border-b border-border sticky top-0 bg-popover">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un pays…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-56">
              {filtered.map((c) => (
                <button
                  key={`${c.code}-${c.dial}`}
                  type="button"
                  onClick={() => { onCountryChange(c); setOpen(false); setSearch(""); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                    country.code === c.code && "bg-primary/5"
                  )}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 text-foreground">{c.name}</span>
                  <span className="text-muted-foreground text-xs font-mono">{c.dial}</span>
                  {country.code === c.code && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Aucun pays trouvé</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WhatsAppInput;
