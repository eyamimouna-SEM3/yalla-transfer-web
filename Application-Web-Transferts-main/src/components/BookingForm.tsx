import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, ArrowRight, Accessibility, Baby, ArrowLeftRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import LocationCombobox from "./LocationCombobox";

const BookingForm = ({ compact }: { compact?: boolean }) => {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [hours, setHours] = useState("08");
  const [minutes, setMinutes] = useState("00");
  const [passengers, setPassengers] = useState("1");
  const [bigLuggage, setBigLuggage] = useState(0);
  const [smallLuggage, setSmallLuggage] = useState(0);
  const [pmr, setPmr] = useState(false);
  const [babySeat, setBabySeat] = useState(false);

  const handleBook = () => {
    if (!from || !to || !date) return;
    const params = new URLSearchParams({
      type: tripType, from, to,
      date: date.toISOString(),
      ...(returnDate && { returnDate: returnDate.toISOString() }),
      time: `${hours}:${minutes}`,
      passengers: passengers || "1",
      bigLuggage: String(bigLuggage),
      smallLuggage: String(smallLuggage),
      pmr: String(pmr),
      babySeat: String(babySeat),
    });
    navigate(`/booking?${params.toString()}`);
  };

  const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  const Counter = ({ value, onChange, min = 0, max = 20, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium">−</button>
        <span className="text-sm font-semibold w-6 text-center text-foreground">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium">+</button>
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-card-hover border border-border/60 hover:shadow-2xl transition-shadow duration-500">
      <h3 className="font-display font-bold text-foreground text-lg mb-5">Réserver un transfert</h3>

      {/* Trip Type Toggle */}
      <div className="flex bg-muted rounded-xl p-1 mb-5">
        <button onClick={() => setTripType("one-way")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200", tripType === "one-way" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <ArrowRight className="h-4 w-4" /> Aller simple
        </button>
        <button onClick={() => setTripType("round-trip")} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200", tripType === "round-trip" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <ArrowLeftRight className="h-4 w-4" /> Aller-Retour
        </button>
      </div>

      <div className="space-y-3">
        <LocationCombobox value={from} onChange={setFrom} placeholder="Point de départ" iconColor="text-primary" />
        <LocationCombobox value={to} onChange={setTo} placeholder="Destination" iconColor="text-accent" />

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 w-full text-left hover:bg-muted/80 transition-colors">
                <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
                <span className={cn("text-sm font-medium", !date && "text-muted-foreground")}>
                  {date ? format(date, "dd MMM yyyy", { locale: fr }) : "Date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 w-full text-left hover:bg-muted/80 transition-colors">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{hours}:{minutes}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 pointer-events-auto" align="start">
              <div className="flex gap-4 items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Heures</p>
                  <div className="grid grid-cols-6 gap-1 max-h-[180px] overflow-y-auto">
                    {hoursOptions.map((h) => (
                      <button key={h} onClick={() => setHours(h)} className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-all", hours === h ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-foreground")}>{h}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Minutes</p>
                  <div className="grid grid-cols-3 gap-1">
                    {minutesOptions.map((m) => (
                      <button key={m} onClick={() => setMinutes(m)} className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-all", minutes === m ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-foreground")}>{m}</button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        {tripType === "round-trip" && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 w-full text-left hover:bg-muted/80 transition-colors">
                <CalendarIcon className="h-5 w-5 text-accent shrink-0" />
                <span className={cn("text-sm font-medium", !returnDate && "text-muted-foreground")}>
                  {returnDate ? format(returnDate, "dd MMM yyyy", { locale: fr }) : "Date de retour"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} disabled={(d) => d < (date || new Date())} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        )}

        {/* Passengers & Luggage */}
        <div className="bg-muted rounded-xl px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Passagers</span>
            <input
              type="number"
              min={1}
              max={55}
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              className="w-16 text-center text-sm font-semibold bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>
          <div className="border-t border-border/50" />
          <Counter label="Grands bagages" value={bigLuggage} onChange={setBigLuggage} />
          <Counter label="Petits bagages" value={smallLuggage} onChange={setSmallLuggage} />
        </div>

        {/* PMR & Baby */}
        <div className="flex gap-3">
          <button onClick={() => setPmr(!pmr)} className={cn("flex-1 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 border", pmr ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:border-border")}>
            <Accessibility className="h-4 w-4 shrink-0" />
            <span className="text-xs">PMR</span>
          </button>
          <button onClick={() => setBabySeat(!babySeat)} className={cn("flex-1 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 border", babySeat ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:border-border")}>
            <Baby className="h-4 w-4 shrink-0" />
            <span className="text-xs">Siège bébé</span>
          </button>
        </div>

        <Button onClick={handleBook} className="w-full py-3.5 text-base font-semibold rounded-xl shadow-button gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground transition-all duration-200 hover:shadow-lg">
          Réserver le transfert
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BookingForm;
