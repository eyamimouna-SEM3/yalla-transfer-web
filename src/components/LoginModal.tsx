import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connexion via NestJS backend
      const response = await authService.login(email, password);

      onOpenChange(false);
      setEmail("");
      setPassword("");

      if (response.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard", { state: { profile: response.user.role === "client_b2c" ? "particulier" : response.user.role === "client_b2b" ? "corporate" : response.user.role === "supplier" ? "transport" : "chauffeur", name: response.user.full_name || response.user.fullName } });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error?.data?.message || error?.message || error?.data?.error || "Email ou mot de passe incorrect.";
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] rounded-3xl">
        {/* Gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary to-accent" />
        
        <div className="px-8 pt-8 pb-10">
          <DialogHeader className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-base">YT</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Connexion</p>
            <DialogTitle className="font-display text-2xl font-bold text-foreground">
              Bienvenue !
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Connectez-vous à votre espace Yalla Transfer
            </p>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-semibold text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-semibold text-foreground">Mot de passe</Label>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    setTimeout(() => setShowForgot(true), 200);
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)] transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/inscription" onClick={() => onOpenChange(false)} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
      <ForgotPasswordDialog
        open={showForgot}
        onOpenChange={setShowForgot}
        initialEmail={email}
      />
    </Dialog>
  );
};

export default LoginModal;
