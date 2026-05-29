import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Search, XCircle, Clock, Ban } from "lucide-react";
import { adminService, type AdminBookingOffer } from "@/services/adminService";

const statusStyles: Record<AdminBookingOffer["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  accepted: { label: "Acceptée", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejetée", variant: "destructive", icon: XCircle },
  expired: { label: "Expirée", variant: "outline", icon: Clock },
  withdrawn: { label: "Retirée", variant: "outline", icon: Ban },
};

const AdminOffers = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<AdminBookingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminService.getBookingOffers();
        if (!cancelled) setOffers(data);
      } catch (e) {
        const err = e as { message?: string; status?: number };
        if (!cancelled) {
          setError(err.status === 401 || err.status === 403
            ? "Accès réservé aux administrateurs."
            : err.message ?? "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Regrouper les offres par réservation pour la vue marketplace
  const grouped = useMemo(() => {
    const map = new Map<string, { booking: AdminBookingOffer["booking"]; offers: AdminBookingOffer[] }>();
    for (const offer of offers) {
      const key = offer.bookingId;
      const entry = map.get(key) ?? { booking: offer.booking, offers: [] };
      entry.offers.push(offer);
      map.set(key, entry);
    }
    const arr = Array.from(map.values());
    // Filtre recherche
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return arr.filter((g) =>
        g.booking.code?.toLowerCase().includes(q) ||
        g.booking.departure.toLowerCase().includes(q) ||
        g.booking.destination.toLowerCase().includes(q) ||
        (g.booking.client?.fullName ?? "").toLowerCase().includes(q),
      );
    }
    return arr;
  }, [offers, search]);

  // Compteurs globaux
  const counts = useMemo(() => ({
    pending: offers.filter((o) => o.status === "pending").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    rejected: offers.filter((o) => o.status === "rejected").length,
    total: offers.length,
  }), [offers]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Erreur</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Offres fournisseurs</h1>
        <p className="text-sm text-muted-foreground">
          Marketplace — {counts.total} offre{counts.total > 1 ? "s" : ""} ({counts.pending} en attente, {counts.accepted} acceptée{counts.accepted > 1 ? "s" : ""})
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code, trajet ou client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
            Aucune offre fournisseur enregistrée pour l'instant.
          </div>
        ) : (
          grouped.map(({ booking, offers: items }) => {
            const isExpanded = expandedId === booking.id;
            const cheapest = items.reduce((min, o) => o.price < min ? o.price : min, Number.POSITIVE_INFINITY);
            return (
              <div key={booking.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-wrap min-w-0">
                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{booking.code}</span>
                    <span className="font-medium text-foreground truncate">{booking.client?.fullName ?? "—"}</span>
                    <span className="text-xs text-muted-foreground truncate">{booking.departure} → {booking.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">{items.length} offre{items.length > 1 ? "s" : ""}</Badge>
                    {Number.isFinite(cheapest) && (
                      <span className="text-xs font-semibold text-primary">Min : {cheapest} TND</span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">Offres reçues</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.departureAt).toLocaleDateString("fr-FR")} · {booking.passengers} passager(s)
                      </p>
                    </div>
                    {items.map((o) => {
                      const s = statusStyles[o.status];
                      const Icon = s.icon;
                      return (
                        <div
                          key={o.id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            o.status === "accepted" ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-wrap min-w-0">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">
                                {o.supplier.companyName ?? o.supplier.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {o.driver ? `Chauffeur : ${o.driver.fullName}` : "Pas de chauffeur assigné"}
                                {o.vehicle ? ` · ${o.vehicle.type}` : ""}
                              </p>
                              {o.notes && (
                                <p className="text-xs text-muted-foreground italic mt-1">"{o.notes}"</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-display font-bold text-lg text-foreground">{o.price} TND</span>
                            <Badge variant={s.variant} className="gap-1 text-[10px]">
                              <Icon className="h-3 w-3" /> {s.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
