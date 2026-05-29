import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  date: string;
  time: string;
  price: number;
}

interface Props {
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: (reservationId: string, refundAmount: number, refundPct: number) => void;
}

const CancelReservationDialog = ({ reservation, onClose, onConfirm }: Props) => {
  const [phase, setPhase] = useState<"review" | "processing" | "done">("review");

  const { hoursBefore, refundPct, refundAmount } = useMemo(() => {
    if (!reservation) return { hoursBefore: 0, refundPct: 0, refundAmount: 0 };
    const transferDate = new Date(`${reservation.date}T${reservation.time}`);
    const hours = (transferDate.getTime() - Date.now()) / (1000 * 60 * 60);
    let pct = 0;
    if (hours > 48) pct = 100;
    else if (hours > 24) pct = 50;
    else if (hours > 6) pct = 25;
    else pct = 0;
    return {
      hoursBefore: hours,
      refundPct: pct,
      refundAmount: Math.round(reservation.price * (pct / 100)),
    };
  }, [reservation]);

  if (!reservation) return null;

  const tiers: { range: string; pct: number }[] = [
    { range: "Plus de 48h avant", pct: 100 },
    { range: "Plus de 24h avant", pct: 50 },
    { range: "Plus de 6h avant", pct: 25 },
    { range: "Moins de 6h", pct: 0 },
  ];

  const handleConfirm = () => {
    setPhase("processing");
    setTimeout(() => {
      setPhase("done");
      toast({
        title: "Réservation annulée",
        description:
          refundPct > 0
            ? `Remboursement de ${refundAmount} TND (${refundPct}%) en cours de traitement.`
            : "Aucun remboursement applicable selon notre politique.",
      });
      setTimeout(() => {
        onConfirm(reservation.id, refundAmount, refundPct);
        setPhase("review");
        onClose();
      }, 5000);
    }, 900);
  };

  const handleClose = () => {
    if (phase === "processing" || phase === "done") return;
    setPhase("review");
    onClose();
  };

  return (
    <Dialog open={!!reservation} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Annuler la réservation {reservation.id}
          </DialogTitle>
          <DialogDescription>
            Veuillez prendre connaissance de notre politique de remboursement avant de confirmer.
          </DialogDescription>
        </DialogHeader>

        {phase === "review" && (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Politique de remboursement
              </p>
              <ul className="space-y-1.5">
                {tiers.map((t) => {
                  const active = t.pct === refundPct;
                  return (
                    <li
                      key={t.range}
                      className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 border ${
                        active
                          ? "border-primary bg-primary/5 text-foreground font-semibold"
                          : "border-transparent text-muted-foreground"
                      }`}
                    >
                      <span>{t.range}</span>
                      <span className={active ? "text-primary" : ""}>
                        {t.pct}% remboursé
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-border p-4 bg-card space-y-1">
              <p className="text-xs text-muted-foreground">Délai avant le transfert</p>
              <p className="font-display font-bold text-foreground text-lg">
                {hoursBefore > 0 ? `${Math.floor(hoursBefore)} h` : "Transfert dépassé"}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                <span className="text-xs text-muted-foreground">Montant remboursé</span>
                <span className="font-display font-extrabold text-primary text-xl">
                  {refundAmount} TND
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ({refundPct}% de {reservation.price} TND)
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border/60">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              Le remboursement sera effectué sur le moyen de paiement initial sous 5 à 10 jours.
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>
                Conserver
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                className="gap-2"
              >
                Confirmer l'annulation
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "processing" && (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Traitement de l'annulation…</p>
          </div>
        )}

        {phase === "done" && (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <p className="font-display font-semibold text-foreground">Annulation confirmée</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancelReservationDialog;
