import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", website: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ title: "Veuillez remplir les champs obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast({ title: "Message envoyé !", description: "Nous vous répondrons dans les plus brefs délais." });
      setForm({ name: "", email: "", website: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Contact Card */}
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-background via-background to-muted/40 border border-border/60 shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left - Info */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Contactez-nous
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-md">
                  Nous nous engageons à traiter vos informations afin de vous contacter et discuter de votre projet.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Mail className="h-4.5 w-4.5 text-foreground" />
                    </div>
                    <span className="text-foreground font-medium">contact@yallatransfer.com</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="h-4.5 w-4.5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Tunis, Tunisie</p>
                      <p className="text-muted-foreground text-sm">Centre Urbain Nord</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <Phone className="h-4.5 w-4.5 text-foreground" />
                    </div>
                    <span className="text-foreground font-medium">+216 XX XXX XXX</span>
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div className="p-10 lg:p-14 bg-card">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Input
                      placeholder="Nom *"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="rounded-xl border-border/60 bg-muted/30 h-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="rounded-xl border-border/60 bg-muted/30 h-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Site web"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="rounded-xl border-border/60 bg-muted/30 h-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="rounded-xl border-border/60 bg-muted/30 min-h-[120px] text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-button transition-all duration-300"
                  >
                    {loading ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
