import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Clock, Users, CreditCard, Building2, Mail, CheckCircle2, Upload, ArrowRight, User, Briefcase, Shield, Banknote, Download, AlertCircle, Wallet, MousePointerClick, Smartphone } from "lucide-react";
import { useState, useMemo } from "react";
import { vehicleTypes } from "@/data/vehicleTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const steps = [
  { label: "Résumé", num: 1 },
  { label: "Paiement", num: 2 },
  { label: "Confirmation", num: 3 },
];

interface CartItem {
  vehicleId: string;
  vehicleName: string;
  vehiclePrice: number;
  provider: string;
  quantity: number;
}

const CheckoutPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const dateStr = params.get("date");
  const time = params.get("time") || "";
  const passengers = params.get("passengers") || "1";
  const extrasTotal = parseInt(params.get("extrasTotal") || "0");
  const extras = params.get("extras") || "";

  // Support both old single-vehicle and new cart format
  const cartItems: CartItem[] = useMemo(() => {
    const cartStr = params.get("cart");
    if (cartStr) {
      try { return JSON.parse(cartStr); } catch { return []; }
    }
    // Fallback for old format
    const vehicleId = params.get("vehicleId");
    if (vehicleId) {
      return [{
        vehicleId,
        vehicleName: params.get("vehicleName") || "",
        vehiclePrice: parseInt(params.get("vehiclePrice") || "0"),
        provider: params.get("provider") || "",
        quantity: 1,
      }];
    }
    return [];
  }, [params]);

  const hasBus = cartItems.some(item => item.vehicleId === "bus" || item.vehicleId === "autocar");
  const vehicleTotal = cartItems.reduce((s, item) => s + item.vehiclePrice * item.quantity, 0);
  const totalPrice = vehicleTotal + extrasTotal;
  const date = dateStr ? new Date(dateStr) : null;

  const paymentMethods = useMemo(() => {
    const methods = [
      { id: "wallet", label: "Wallet", icon: Wallet, desc: "Portefeuille numérique" },
      { id: "clicktopay", label: "Click to Pay", icon: MousePointerClick, desc: "Paiement rapide" },
      { id: "card", label: "Carte internationale", icon: CreditCard, desc: "Visa, Mastercard" },
      { id: "edinar", label: "E-Dinar", icon: Mail, desc: "Carte e-DINAR" },
    ];
    if (hasBus) {
      methods.push({ id: "bank", label: "Virement bancaire", icon: Building2, desc: "Transfert bancaire" });
      methods.push({ id: "cash", label: "Espèces", icon: Banknote, desc: "Paiement en cash" });
    }
    return methods;
  }, [hasBus]);

  const handlePay = () => {
    if (!paymentMethod) return;
    setCurrentStep(3);
    setShowPostPayment(true);
  };

  const handleIdUpload = (file: File) => {
    setIdFile(file);
    setIdUploaded(true);
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard", {
      state: {
        profile: "particulier",
        name: formData.fullName || "Client",
        pendingVoucher: !idUploaded,
      },
    });
  };

  const handleGoHome = () => navigate("/");

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16 max-w-5xl">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep >= step.num ? "bg-primary text-primary-foreground shadow-md" : "bg-border text-muted-foreground"
                }`}>
                  {currentStep > step.num ? <CheckCircle2 className="h-5 w-5" /> : step.num}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${currentStep >= step.num ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-20 sm:w-32 h-0.5 mx-2 mb-5 rounded-full transition-all ${currentStep > step.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Summary */}
          <div className="lg:col-span-3 space-y-5">
            {/* Transfer summary */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-display font-semibold text-foreground text-lg mb-4">Résumé du trajet</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-px h-8 bg-border" />
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Départ</p>
                      <p className="text-sm font-semibold text-foreground">{from}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="text-sm font-semibold text-foreground">{to}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-3 grid grid-cols-3 gap-3 text-sm">
                  {date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{format(date, "dd MMM yyyy", { locale: fr })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{passengers} pax</span>
                  </div>
                </div>
              </div>

              {/* Vehicle rows */}
              <div className="mt-4 space-y-2">
                {cartItems.map((item, idx) => {
                  const vehicle = vehicleTypes.find(v => v.id === item.vehicleId);
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-muted/60 rounded-xl border border-border/50">
                      {vehicle && <img src={vehicle.image} alt={item.vehicleName} className="w-20 h-14 object-contain rounded-lg" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-foreground text-sm">{item.vehicleName}</p>
                        <p className="text-xs text-muted-foreground">{vehicle?.description}</p>
                        {item.provider && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><User className="h-3 w-3" /> {item.provider}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {item.quantity > 1 && <p className="text-xs text-muted-foreground">×{item.quantity}</p>}
                        <p className="font-display font-extrabold text-primary text-lg">{item.vehiclePrice * item.quantity} DT</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {extras && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  Options : {extras.split(",").filter(Boolean).join(", ")} <span className="font-semibold text-primary">(+{extrasTotal} DT)</span>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-display font-semibold text-foreground text-lg mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-muted-foreground">{item.vehicleName} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                    <span className="font-semibold text-foreground">{item.vehiclePrice * item.quantity} DT</span>
                  </div>
                ))}
                {extrasTotal > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Options supplémentaires</span>
                    <span className="font-semibold text-primary">+{extrasTotal} DT</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Frais de service</span>
                  <span className="font-semibold text-primary">GRATUIT</span>
                </div>
                <div className="border-t border-border pt-3 mt-1 flex justify-between items-center">
                  <span className="font-display font-bold text-foreground text-base">Total</span>
                  <span className="font-display font-extrabold text-primary text-xl">{totalPrice} DT</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Payment */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm sticky top-24 space-y-5">
              <h3 className="font-display font-semibold text-foreground text-lg">Paiement</h3>

              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => { setPaymentMethod(pm.id); setCurrentStep(2); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      paymentMethod === pm.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <pm.icon className={`h-5 w-5 ${paymentMethod === pm.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-semibold leading-tight ${paymentMethod === pm.id ? "text-primary" : "text-foreground"}`}>{pm.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{pm.desc}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Nom du titulaire</label>
                    <input className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" placeholder="Nom sur la carte" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Numéro de carte</label>
                    <input className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" placeholder="0000 0000 0000 0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Expiration</label>
                      <input className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" placeholder="MM/AA" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">CVC</label>
                      <input className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" placeholder="123" />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-foreground">Coordonnées bancaires</p>
                  <p className="text-xs text-muted-foreground">IBAN : TN59 1000 0001 2345 6789 0123</p>
                  <p className="text-xs text-muted-foreground">BIC : BTUATNTT</p>
                  <p className="text-xs text-muted-foreground mt-2">Veuillez effectuer le virement puis cliquer sur "Payer" pour confirmer.</p>
                </div>
              )}

              {paymentMethod === "edinar" && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-foreground">e-DINAR / La Poste</p>
                  <p className="text-xs text-muted-foreground">Vous serez redirigé vers le portail sécurisé de La Poste Tunisienne pour finaliser le paiement.</p>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-foreground">Portefeuille numérique</p>
                  <p className="text-xs text-muted-foreground">Payez directement depuis votre portefeuille numérique sécurisé.</p>
                </div>
              )}

              {paymentMethod === "clicktopay" && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-foreground">Click to Pay</p>
                  <p className="text-xs text-muted-foreground">Paiement rapide et sécurisé en un clic.</p>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200 p-4 bg-muted/50 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-foreground">Paiement en espèces</p>
                  <p className="text-xs text-muted-foreground">Le paiement sera effectué en espèces directement au chauffeur le jour du transfert.</p>
                  <p className="text-xs text-accent font-medium">Disponible uniquement pour les bus et autocars.</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                Paiement 100% sécurisé et crypté
              </div>

              <Button
                onClick={handlePay}
                disabled={!paymentMethod}
                className="w-full py-3.5 text-base font-semibold rounded-xl shadow-md gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground disabled:opacity-50 transition-all"
              >
                Payer {totalPrice} DT
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Post-payment dialog */}
      <Dialog open={showPostPayment} onOpenChange={setShowPostPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {idUploaded ? "Voucher disponible !" : "Réservation acceptée !"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Votre réservation a été acceptée.</p>
                {!idUploaded && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Pour télécharger votre voucher, veuillez joindre une pièce d'identité afin de valider votre compte.
                  </p>
                )}
              </div>
            </div>

            {!idUploaded ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-foreground">Nom complet</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Votre nom complet" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="votre@email.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="+216 XX XXX XXX" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Pièce d'identité (Passeport ou CIN)</label>
                  <label className="flex items-center justify-center gap-2 mt-1 w-full py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors bg-muted/30">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{idFile ? idFile.name : "Cliquez pour télécharger"}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setIdFile(file); }
                    }} />
                  </label>
                </div>
                <Button
                  onClick={() => { if (idFile) handleIdUpload(idFile); }}
                  disabled={!formData.fullName || !formData.phone || !formData.email || !idFile}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold gap-2"
                >
                  Valider et télécharger le voucher <Download className="h-4 w-4" />
                </Button>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Je le ferai plus tard → Aller au dashboard
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <p className="text-foreground font-semibold">Votre voucher est prêt !</p>
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold gap-2">
                  <Download className="h-4 w-4" /> Télécharger le voucher
                </Button>
                <div className="space-y-2 pt-2">
                  <Button onClick={handleGoToDashboard} variant="outline" className="w-full rounded-xl gap-2">
                    Accéder au dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleGoHome} variant="ghost" className="w-full rounded-xl text-muted-foreground">
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutPage;
