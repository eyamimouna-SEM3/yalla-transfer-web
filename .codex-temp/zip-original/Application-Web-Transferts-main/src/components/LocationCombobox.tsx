import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { allLocations, LocationOption } from "@/data/locations";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  iconColor?: string;
}

const LocationCombobox = ({ value, onChange, placeholder, iconColor = "text-primary" }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = allLocations.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, LocationOption[]>>((acc, loc) => {
    (acc[loc.group] = acc[loc.group] || []).push(loc);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <MapPin className={cn("h-5 w-5 shrink-0", iconColor)} />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="bg-transparent text-sm font-medium placeholder:text-muted-foreground focus:outline-none w-full text-foreground"
        />
      </div>
      {open && Object.keys(grouped).length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">{group}</p>
              {items.map(item => (
                <button
                  key={item.label}
                  onClick={() => { onChange(item.label); setSearch(item.label); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationCombobox;
