import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Luggage, Baby, Accessibility, ArrowRight, Star, ShoppingCart, Plus, Minus } from "lucide-react";
import { vehicleTypes, VehicleType } from "@/data/vehicleTypes";
import { motion, AnimatePresence } from "framer-motion";

// Smart vehicle category filtering based on passenger count
const getRelevantCategories = (passengers: number, pmr: boolean): string[] => {
  if (pmr) return ["pmr"];
  if (passengers <= 4) return ["eco", "sedan", "premium", "luxe"];
  if (passengers <= 9) return ["van", "4x4"];
  if (passengers <= 20) return ["minibus"];
  if (passengers <= 27) return ["autocar"];
  return ["bus"];
};

// Generic descriptions without brand names
const genericDescriptions: Record<string, string> = {
  eco: "Citadine économique",
  sedan: "Berline confort",
  premium: "Berline haut de gamme",
  luxe: "VIP / Protocole",
  pmr: "Véhicule adapté mobilité réduite",
  van: "Minivan familial",
  "4x4": "SUV / Tout-terrain",
  minibus: "Petit groupe",
  autocar: "Groupe moyen (24-27 places)",
  bus: "Grand tourisme (50+ places)",
};

const VehicleSelectionPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const [selectedOffers, setSelectedOffers] = useState<Record<string, number>>({});

  const passengers = parseInt(params.get("passengers") || "1");
  const bigLuggage = parseInt(params.get("bigLuggage") || "0");
  const smallLuggage = parseInt(params.get("smallLuggage") || "0");
  const pmr = params.get("pmr") === "true";
  const babySeat = params.get("babySeat") === "true";
  const extrasTotal = parseInt(params.get("extrasTotal") || "0");
  const from = params.get("from") || "";
  const to = params.get("to") || "";

  const relevantCategories = useMemo(() => getRelevantCategories(passengers, pmr), [passengers, pmr]);

  // Filter matching vehicles — one per type
  const matchingVehicles = useMemo(() => vehicleTypes.filter(v => {
    if (!relevantCategories.includes(v.id)) return false;
    if (v.maxPassengers < passengers) return false;
    if (v.bigLuggage < bigLuggage) return false;
    if (v.smallLuggage < smallLuggage) return false;
    if (babySeat && !v.babySeat) return false;
    return true;
  }), [relevantCategories, passengers, bigLuggage, smallLuggage, babySeat]);

  // One offer per vehicle type (no duplicate providers)
  const offers = useMemo(() => {
    const mapped = matchingVehicles.map(v => ({
      vehicle: v,
      price: v.basePrice,
      rating: 4.6,
      id: v.id,
    }));
    return mapped.sort((a, b) => sortBy === "price" ? a.price - b.price : b.rating - a.rating);
  }, [matchingVehicles, sortBy]);

  const updateQuantity = (offerId: string, delta: number) => {
    setSelectedOffers(prev => {
      const current = prev[offerId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [offerId]: _, ...rest } = prev;
        return rest;
      }
      // Prevent selecting more vehicles than passengers
      const currentTotal = Object.values(prev).reduce((s, q) => s + q, 0);
      if (delta > 0 && currentTotal >= passengers) {
        return prev; // Don't allow adding more vehicles than passengers
      }
      return { ...prev, [offerId]: next };
    });
  };

  const totalSelectedCount = Object.values(selectedOffers).reduce((s, q) => s + q, 0);
  const totalSelectedPrice = Object.entries(selectedOffers).reduce((s, [id, qty]) => {
    const offer = offers.find(o => o.id === id);
    return s + (offer ? offer.price * qty : 0);
  }, 0);

  const handleReserve = () => {
    const items = Object.entries(selectedOffers)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const offer = offers.find(o => o.id === id)!;
        return {
          vehicleId: offer.vehicle.id,
          vehicleName: offer.vehicle.name,
          vehiclePrice: offer.price,
          provider: "",
          quantity: qty,
        };
      });

    const allParams = new URLSearchParams(params);
    allParams.set("cart", JSON.stringify(items));
    allParams.set("cartTotal", String(totalSelectedPrice));
    navigate(`/checkout?${allParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        {/* Route summary bar */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Itinéraire</p>
                <p className="font-semibold text-foreground text-sm truncate">{from} → {to}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {passengers} passager(s)</span>
              <span className="flex items-center gap-1.5"><Luggage className="h-3.5 w-3.5" /> {bigLuggage + smallLuggage} bagage(s)</span>
              {pmr && <Badge variant="secondary" className="text-xs gap-1"><Accessibility className="h-3 w-3" /> PMR</Badge>}
              {babySeat && <Badge variant="secondary" className="text-xs gap-1"><Baby className="h-3 w-3" /> Bébé</Badge>}
            </div>
          </div>
        </div>

        {/* Header with count and sort */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            {offers.length} type{offers.length > 1 ? "s" : ""} de véhicule{offers.length > 1 ? "s" : ""} disponible{offers.length > 1 ? "s" : ""}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Trier par</span>
            <Button variant={sortBy === "price" ? "default" : "outline"} size="sm" onClick={() => setSortBy("price")} className="text-xs h-8">Prix</Button>
            <Button variant={sortBy === "rating" ? "default" : "outline"} size="sm" onClick={() => setSortBy("rating")} className="text-xs h-8">Note</Button>
          </div>
        </div>

        {/* Vehicle grid — one card per type */}
        {offers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {offers.map((offer, i) => {
                const qty = selectedOffers[offer.id] || 0;
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    layout
                  >
                    <div className={`group w-full bg-card rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${qty > 0 ? "border-primary shadow-lg" : "border-border hover:border-primary/30 hover:shadow-md"}`}>
                      {/* Vehicle image */}
                      <div className="relative bg-muted/40 px-6 pt-6 pb-2 flex items-center justify-center h-44 overflow-hidden">
                        <img
                          src={offer.vehicle.image}
                          alt={offer.vehicle.name}
                          className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                        />
                        <Badge className="absolute top-3 left-3 text-[10px] font-bold bg-primary/90 text-primary-foreground border-0">
                          {offer.vehicle.name}
                        </Badge>
                        {i === 0 && sortBy === "price" && (
                          <Badge className="absolute top-3 right-3 text-[10px] font-semibold bg-accent text-accent-foreground border-0">
                            Meilleur prix
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        <p className="text-sm font-semibold text-foreground">{genericDescriptions[offer.vehicle.id] || offer.vehicle.description}</p>

                        {/* Features */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
                            <Users className="h-3 w-3" /> {offer.vehicle.maxPassengers} places
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
                            <Luggage className="h-3 w-3" /> {offer.vehicle.bigLuggage}G + {offer.vehicle.smallLuggage}P
                          </span>
                          {offer.vehicle.babySeat && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 rounded-full px-2.5 py-1">
                              <Baby className="h-3 w-3" /> Bébé
                            </span>
                          )}
                          {offer.vehicle.pmr && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 rounded-full px-2.5 py-1">
                              <Accessibility className="h-3 w-3" /> PMR
                            </span>
                          )}
                        </div>

                        {/* Rating + Price */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-accent fill-accent" />
                            <span className="text-sm font-medium text-foreground">{offer.rating}</span>
                            <span className="text-[11px] text-muted-foreground">/ 5</span>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-extrabold text-xl text-primary leading-none">
                              {offer.price + extrasTotal}
                            </p>
                            <p className="text-[10px] text-muted-foreground">DT · TTC</p>
                          </div>
                        </div>

                        {/* Quantity controls — direct toggle on card click + / - */}
                        <div className="pt-1">
                          {qty === 0 ? (
                            <button
                              onClick={() => updateQuantity(offer.id, 1)}
                              className="w-full h-9 text-xs font-semibold rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-muted-foreground"
                            >
                              Cliquez pour sélectionner
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-primary/10 rounded-lg border border-primary/30 px-2 py-1">
                              <button
                                onClick={() => updateQuantity(offer.id, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary/20 text-primary transition-colors"
                                aria-label="Diminuer"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-bold text-primary">
                                {qty} sélectionné{qty > 1 ? "s" : ""}
                              </span>
                              <button
                                onClick={() => updateQuantity(offer.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary/20 text-primary transition-colors"
                                aria-label="Augmenter"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Luggage className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">Aucun véhicule disponible</p>
            <p className="text-sm text-muted-foreground mb-6">Aucun véhicule ne correspond à vos critères de recherche.</p>
            <Button variant="outline" onClick={() => navigate(-1)}>Modifier ma recherche</Button>
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      <AnimatePresence>
        {totalSelectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl"
          >
            <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {totalSelectedCount} véhicule{totalSelectedCount > 1 ? "s" : ""} sélectionné{totalSelectedCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total : <span className="font-bold text-primary">{totalSelectedPrice + extrasTotal * totalSelectedCount} DT</span>
                  </p>
                </div>
              </div>
              <Button onClick={handleReserve} className="rounded-xl px-6 font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                Réserver <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleSelectionPage;
