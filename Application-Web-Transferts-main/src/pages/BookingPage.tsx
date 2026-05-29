import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Luggage, Accessibility, Baby, ArrowRight, ArrowLeftRight, Wifi, Droplets, CreditCard, Star, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import { useState } from "react";

interface ExtraOption {
  id: string;
  label: string;
  desc: string;
  price: number;
  icon: React.ElementType;
}

const extras: ExtraOption[] = [
  { id: "panel", label: "Accueil avec panneau nominatif", desc: "Le chauffeur vous attend avec votre nom", price: 5, icon: CreditCard },
  { id: "water", label: "Eau fraîche à bord", desc: "Bouteilles d'eau pour tous les passagers", price: 5, icon: Droplets },
  { id: "wifi", label: "Wi-Fi embarqué", desc: "Connexion internet pendant le trajet", price: 10, icon: Wifi },
  { id: "vip", label: "Accueil VIP", desc: "Service premium avec assistance personnalisée", price: 20, icon: Star },
  { id: "assurance", label: "Assurance annulation", desc: "Remboursement intégral en cas d'annulation", price: 15, icon: ShieldCheck },
];

const BookingPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const tripType = params.get("type") || "one-way";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const dateStr = params.get("date");
  const returnDateStr = params.get("returnDate");
  const time = params.get("time") || "08:00";
  const passengers = parseInt(params.get("passengers") || "1");
  const bigLuggage = parseInt(params.get("bigLuggage") || "0");
  const smallLuggage = parseInt(params.get("smallLuggage") || "0");
  const pmr = params.get("pmr") === "true";
  const babySeat = params.get("babySeat") === "true";

  const date = dateStr ? new Date(dateStr) : null;
  const returnDate = returnDateStr ? new Date(returnDateStr) : null;

  if (!from || !to || !date) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Données de réservation manquantes.</p>
          <Button onClick={() => navigate("/")} variant="outline">Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const extrasTotal = extras.filter(e => selectedExtras.includes(e.id)).reduce((sum, e) => sum + e.price, 0);

  const handleConfirm = () => {
    const allParams = new URLSearchParams(params);
    allParams.set("extras", selectedExtras.join(","));
    allParams.set("extrasTotal", String(extrasTotal));
    navigate(`/vehicles?${allParams.toString()}`);
  };

  const DetailRow = ({ icon: Icon, label, value, iconColor = "text-primary" }: { icon: any; label: string; value: string; iconColor?: string }) => (
    <div className="flex items-start gap-3 py-3">
      <Icon className={`h-5 w-5 ${iconColor} shrink-0 mt-0.5`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">Détails de votre transfert</h1>
              <p className="text-muted-foreground">Vérifiez les informations et choisissez vos options.</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-1 divide-y divide-border/50">
              <DetailRow icon={tripType === "round-trip" ? ArrowLeftRight : ArrowRight} label="Type de trajet" value={tripType === "round-trip" ? "Aller-Retour" : "Aller simple"} />
              <DetailRow icon={MapPin} label="Point de départ" value={from} />
              <DetailRow icon={MapPin} label="Destination" value={to} iconColor="text-accent" />
              <DetailRow icon={Calendar} label="Date" value={format(date, "EEEE dd MMMM yyyy", { locale: fr })} />
              {returnDate && <DetailRow icon={Calendar} label="Date de retour" value={format(returnDate, "EEEE dd MMMM yyyy", { locale: fr })} iconColor="text-accent" />}
              <DetailRow icon={Clock} label="Heure" value={time} />
              <DetailRow icon={Users} label="Passagers" value={`${passengers} personne(s)`} />
              <DetailRow icon={Luggage} label="Bagages" value={`${bigLuggage} grand(s) + ${smallLuggage} petit(s)`} />
              {pmr && <DetailRow icon={Accessibility} label="PMR" value="Véhicule adapté requis" />}
              {babySeat && <DetailRow icon={Baby} label="Siège bébé" value="Oui" />}
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h3 className="font-display font-semibold text-foreground mb-4">Options supplémentaires</h3>
              <div className="space-y-3">
                {extras.map((opt) => {
                  const selected = selectedExtras.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleExtra(opt.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all border ${selected ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-transparent hover:bg-muted"}`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary border-primary" : "border-border"}`}>
                        {selected && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{opt.label}</p>
                          <span className="text-sm font-bold text-primary">+{opt.price} DT</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card-hover sticky top-24 space-y-5">
              <h3 className="font-display font-semibold text-foreground">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Trajet</span><span className="font-semibold text-foreground truncate ml-2 text-right">{from} → {to}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Passagers</span><span className="font-semibold text-foreground">{passengers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bagages</span><span className="font-semibold text-foreground">{bigLuggage + smallLuggage}</span></div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Options</span><span className="font-semibold text-primary">+{extrasTotal} DT</span></div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-1">Prochaine étape</p>
                <p className="text-sm text-foreground">Sélection du véhicule adapté à vos besoins</p>
              </div>
              <Button onClick={handleConfirm} className="w-full py-3.5 text-base font-semibold rounded-xl shadow-button gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                Confirmer et choisir un véhicule
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
