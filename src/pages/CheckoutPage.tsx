import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Clock, Users, CreditCard, Building2, Mail, CheckCircle2, Upload, ArrowRight, User, Briefcase, Shield, Banknote, Download, AlertCircle, Wallet, IdCard, Smartphone, Lock } from "lucide-react";
import { useState, useMemo } from "react";
import { vehicleTypes } from "@/data/vehicleTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WhatsAppInput, { COUNTRIES, Country } from "@/components/WhatsAppInput";
import SecurePaymentDialog, { type PaymentMethodKind } from "@/components/checkout/SecurePaymentDialog";
import { bookingService } from "@/services/bookingService";
import { pendingBookingStorage } from "@/utils/pendingBooking";
import { tokenStorage } from "@/utils/tokenStorage";
import { cn } from "@/lib/utils";

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
  const [showSecurePayment, setShowSecurePayment] = useState(false);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Tunisie par défaut

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
      { id: "clicktopay", label: "Carte nationale", icon: IdCard, desc: "Carte bancaire tunisienne" },
      { id: "card", label: "Carte internationale", icon: CreditCard, desc: "Visa, Mastercard" },
      { id: "edinar", label: "E-Dinar", icon: Mail, desc: "Carte e-DINAR" },
    ];
    if (hasBus) {
      methods.push({ id: "bank", label: "Virement bancaire", icon: Building2, desc: "Transfert bancaire" });
      methods.push({ id: "cash", label: "Espèces", icon: Banknote, desc: "Paiement en cash" });
    }
    return methods;
  }, [hasBus]);

  // Card form state (shared between "card" and "clicktopay")
  const [cardData, setCardData] = useState({ holder: "", number: "", expiry: "", cvc: "" });
  const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };
  const showCardForm = paymentMethod === "card" || paymentMethod === "clicktopay";

  // Create booking. Si l'utilisateur n'est pas encore connecté (parcours invité),
  // on sauvegarde la réservation localement et on la soumettra après l'inscription
  // dans le flux /inscription?quickfinalize=1.
  // `verifiedEmail` (optionnel) = email vérifié via OTP dans SecurePaymentDialog.
  // Il sera utilisé comme passengerEmail pour que le voucher PDF soit envoyé par email
  // depuis le backend (BookingsService → MailService.sendVoucherEmail).
  const createBooking = async (verifiedEmail?: string) => {
    // dateStr peut être : null, "yyyy-MM-dd", ou un ISO complet ("yyyy-MM-ddTHH:mm:ss.sssZ")
    // selon d'où vient l'utilisateur. On reconstruit une date robuste.
    let baseDate: Date;
    if (dateStr) {
      const candidate = new Date(dateStr);
      baseDate = Number.isNaN(candidate.getTime()) ? new Date() : candidate;
    } else {
      baseDate = new Date();
    }
    if (time && /^\d{1,2}:\d{2}/.test(time)) {
      const [h, m] = time.split(":").map((s) => parseInt(s, 10));
      if (Number.isFinite(h) && Number.isFinite(m)) {
        baseDate.setHours(h, m, 0, 0);
      }
    }
    const departureAt = baseDate.toISOString();
    const vehicleId = cartItems[0]?.vehicleId || "eco";

    // Email à utiliser pour le voucher : priorité à l'email vérifié OTP, sinon formData.
    const passengerEmail = verifiedEmail || formData.email || "";

    const payload = {
      departure: from,
      destination: to,
      departureAt,
      passengers: parseInt(passengers),
      vehicles: cartItems.length > 0
        ? cartItems.map((c) => ({ id: c.vehicleId, quantity: c.quantity }))
        : [{ id: vehicleId, quantity: 1 }],
      paymentMethod: (paymentMethod as "wallet" | "tn-card" | "card" | "edinar" | "cash") || "card",
      passengerName: formData.fullName,
      passengerPhone: formData.phone,
      passengerEmail,
      notes: extras || undefined,
    };

    if (!tokenStorage.getToken()) {
      // Pas connecté : on garde la réservation en attente, soumission après inscription.
      pendingBookingStorage.save(payload);
      setCreatedBookingId(null);
      return;
    }

    const created = await bookingService.create(payload);
    setCreatedBookingId(created.id);
    setBookingError(null);
  };

  const handleDownloadVoucher = async () => {
    if (!createdBookingId) {
      // Fallback : si non connecté lors de la réservation, on indique de le faire depuis le dashboard.
      setBookingError("Voucher disponible après connexion dans ton dashboard.");
      return;
    }
    try {
      await bookingService.downloadVoucher(createdBookingId);
    } catch (err) {
      const e = err as { message?: string };
      setBookingError(e?.message ?? "Téléchargement impossible.");
    }
  };

  const handlePay = async () => {
    if (!paymentMethod) return;
    // Bank transfer & cash do not require online verification
    if (paymentMethod === "bank" || paymentMethod === "cash") {
      try {
        await createBooking();
        setBookingError(null);
      } catch (e) {
        const err = e as { message?: string; status?: number };
        console.error("Failed to create booking:", e);
        setBookingError(err?.message ?? "Création de la réservation impossible.");
      }
      setCurrentStep(3);
      setShowPostPayment(true);
      return;
    }
    setShowSecurePayment(true);
  };

  const handleSecurePaymentSuccess = async (verifiedEmail: string) => {
    // Récupère l'email vérifié via OTP pour préremplir le formulaire passager
    // et garantir que le voucher PDF soit envoyé à la bonne adresse.
    if (verifiedEmail) {
      setFormData((p) => ({ ...p, email: verifiedEmail }));
    }
    try {
      await createBooking(verifiedEmail);
      setBookingError(null);
    } catch (e) {
      const err = e as { message?: string; status?: number };
      console.error("Failed to create booking:", e);
      setBookingError(err?.message ?? "Création de la réservation impossible.");
    }
    setCurrentStep(3);
    setShowPostPayment(true);
  };

  const handleIdUpload = (file: File) => {
    setIdFile(file);
    setIdUploaded(true);
  };

  // Parcours léger post-réservation : mot de passe → choix du type de client → dashboard.
  // Le client ne doit PAS revoir le formulaire complet d'inscription.
  const handleGoToDashboard = () => {
    navigate(
      `/inscription?quickfinalize=1&name=${encodeURIComponent(formData.fullName || "Client")}&email=${encodeURIComponent(formData.email || "")}`
    );
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

              {showCardForm && (
                <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <Lock className="h-3.5 w-3.5" />
                    {paymentMethod === "clicktopay" ? "Carte bancaire nationale (Tunisie)" : "Carte bancaire internationale"}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Nom du titulaire</label>
                    <input
                      type="text"
                      value={cardData.holder}
                      onChange={(e) => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                      className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground tracking-wide"
                      placeholder="NOM PRÉNOM"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Numéro de carte</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                        className="w-full px-3 py-2.5 pr-11 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground tracking-wider font-mono"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Expiration</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-mono"
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">CVV</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={cardData.cvc}
                        onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground font-mono"
                        placeholder="•••"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border/60">
                    <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
                    Vos données sont chiffrées et transmises via 3D Secure.
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
                className="w-full py-3.5 text-base font-semibold rounded-xl shadow-md gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-all"
              >
                Payer {totalPrice} DT
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Secure payment with email OTP — applies to all online methods */}
      <SecurePaymentDialog
        open={showSecurePayment}
        onOpenChange={setShowSecurePayment}
        method={paymentMethod as PaymentMethodKind | null}
        amount={totalPrice}
        currency="DT"
        onSuccess={handleSecurePaymentSuccess}
        transferDate={date}
      />

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
                    Merci de renseigner les informations du <span className="font-semibold text-primary">passager principal</span> pour valider votre voucher.
                  </p>
                )}
              </div>
            </div>

            {!idUploaded ? (
              <>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                  <User className="h-3.5 w-3.5" />
                  Informations du passager principal
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Nom du passager principal</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Nom complet du passager principal" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full mt-1 px-3 py-2.5 bg-muted/50 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="votre@email.com" />
                </div>
                <WhatsAppInput
                  label="N° WhatsApp du passager principal"
                  country={country}
                  onCountryChange={setCountry}
                  number={formData.phone}
                  onNumberChange={(v) => setFormData(p => ({ ...p, phone: v }))}
                  placeholder="XX XXX XXX"
                />
                <div>
                  <label className="text-xs font-semibold text-foreground">Pièce d'identité du passager principal (Passeport ou CIN)</label>
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
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                >
                  Valider et télécharger le voucher <Download className="h-4 w-4" />
                </Button>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Je le ferai plus tard → Créer mon mot de passe
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <p className="text-foreground font-semibold">Votre voucher est prêt !</p>
                {bookingError && (
                  <div className="bg-destructive/10 text-destructive text-xs rounded-md p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="text-left">{bookingError}</span>
                  </div>
                )}
                <Button
                  onClick={handleDownloadVoucher}
                  disabled={!createdBookingId}
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                >
                  <Download className="h-4 w-4" /> Télécharger le voucher
                </Button>
                <div className="space-y-2 pt-2">
                  <Button onClick={handleGoToDashboard} className="w-full rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Accéder à mon dashboard <ArrowRight className="h-4 w-4" />
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
