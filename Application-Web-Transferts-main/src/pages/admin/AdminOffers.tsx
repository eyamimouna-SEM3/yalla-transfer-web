import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Eye, Bell, ChevronDown, ChevronUp } from "lucide-react";

const mockRequests = [
  {
    id: "REQ-301",
    client: "Ahmed Ben Salah",
    route: "Aéroport Tunis → Hammamet",
    date: "02/03/2026 15:00",
    passengers: 3,
    status: "pending",
    offers: [
      { supplier: "TransMed SA", price: "85 TND", responseTime: "2 min", rating: 4.8, vehicles: 12 },
      { supplier: "Rapide Transfer", price: "92 TND", responseTime: "5 min", rating: 4.5, vehicles: 8 },
      { supplier: "Karim Jaziri", price: "78 TND", responseTime: "8 min", rating: 4.9, vehicles: 1 },
    ],
  },
  {
    id: "REQ-300",
    client: "StarTech Corp.",
    route: "Hôtel Africa → Aéroport Tunis",
    date: "02/03/2026 08:00",
    passengers: 1,
    status: "pending",
    offers: [
      { supplier: "TransMed SA", price: "42 TND", responseTime: "1 min", rating: 4.8, vehicles: 12 },
      { supplier: "Slim Bouzid", price: "38 TND", responseTime: "3 min", rating: 4.6, vehicles: 1 },
    ],
  },
  {
    id: "REQ-299",
    client: "Marie Dupont",
    route: "Tunis Centre → Sidi Bou Saïd",
    date: "01/03/2026 14:00",
    passengers: 2,
    status: "assigned",
    offers: [
      { supplier: "Rapide Transfer", price: "35 TND", responseTime: "1 min", rating: 4.5, vehicles: 8, selected: true },
    ],
  },
];

const AdminOffers = () => {
  const [expandedId, setExpandedId] = useState<string | null>("REQ-301");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Offres fournisseurs</h1>
        <p className="text-sm text-muted-foreground">Supervision du reverse bidding — marketplace</p>
      </div>

      <div className="space-y-4">
        {mockRequests.map((req) => (
          <div key={req.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">{req.id}</span>
                <span className="font-medium text-foreground">{req.client}</span>
                <span className="text-xs text-muted-foreground">{req.route}</span>
                <Badge variant={req.status === "pending" ? "secondary" : "default"}>
                  {req.status === "pending" ? "En attente" : "Assignée"}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{req.offers.length} offre(s)</span>
                {expandedId === req.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {/* Offers */}
            {expandedId === req.id && (
              <div className="border-t border-border p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">Offres reçues</p>
                  <p className="text-xs text-muted-foreground">{req.date} · {req.passengers} passager(s)</p>
                </div>
                {req.offers.map((offer, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      offer.selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="font-medium text-foreground text-sm">{offer.supplier}</p>
                        <p className="text-xs text-muted-foreground">⭐ {offer.rating} · {offer.vehicles} véhicule(s) · Réponse: {offer.responseTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg text-foreground">{offer.price}</span>
                      {offer.selected ? (
                        <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Sélectionnée</Badge>
                      ) : req.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="gap-1 h-8"><CheckCircle2 className="h-3.5 w-3.5" /> Valider</Button>
                          <Button size="sm" variant="outline" className="gap-1 h-8"><Bell className="h-3.5 w-3.5" /> Notifier</Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminOffers;
