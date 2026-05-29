import { Clock, CheckCircle2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  accountStatus: "pending" | "approved" | "rejected";
  contractStatus: "none" | "sent" | "signed" | "validated";
  userName: string;
}

const SupplierPendingScreen = ({ accountStatus, contractStatus, userName }: Props) => {
  // Pending admin validation
  if (accountStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 max-w-lg w-full text-center shadow-lg">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Compte en cours de vérification
          </h1>
          <p className="text-muted-foreground mb-2">
            Bonjour <span className="font-semibold text-foreground">{userName}</span>,
          </p>
          <div className="bg-muted/50 rounded-xl p-5 text-left space-y-2 border border-border">
            <p className="text-sm text-foreground font-medium">
              Notre équipe administrative doit vérifier vos informations.
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez patienter pendant la validation de votre compte.
            </p>
            <p className="text-sm text-primary font-medium">
              🔔 Vous recevrez une notification dès que votre compte sera approuvé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected
  if (accountStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 max-w-lg w-full text-center shadow-lg">
          <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6 flex items-center justify-center">
            <Clock className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            Compte non approuvé
          </h1>
          <p className="text-muted-foreground">
            Votre demande d'inscription n'a pas été approuvée. Veuillez contacter notre support pour plus d'informations.
          </p>
        </div>
      </div>
    );
  }

  // Approved but contract not yet validated
  if (accountStatus === "approved" && contractStatus !== "validated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 max-w-lg w-full text-center shadow-lg">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">
            ✅ Votre compte a été validé avec succès
          </h1>
          <p className="text-muted-foreground mb-4">
            Bienvenue sur notre plateforme.
          </p>

          <div className="bg-muted/50 rounded-xl p-5 text-left space-y-3 border border-border mb-6">
            <p className="text-sm text-foreground font-medium">
              Avant d'accéder à votre espace fournisseur, vous devez :
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Télécharger le contrat de collaboration</li>
              <li>Le légaliser et le signer</li>
              <li>Attendre la validation par l'administration</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button className="w-full h-12 gap-2 rounded-xl text-base font-semibold">
              <Download className="h-5 w-5" />
              Télécharger le contrat
            </Button>
            {contractStatus === "none" && (
              <p className="text-xs text-muted-foreground">
                Une fois signé et légalisé, transmettez-le à notre équipe.
              </p>
            )}
            {contractStatus === "sent" && (
              <div className="flex items-center gap-2 justify-center text-sm text-primary">
                <FileText className="h-4 w-4" />
                Contrat envoyé — en attente de votre signature
              </div>
            )}
            {contractStatus === "signed" && (
              <div className="flex items-center gap-2 justify-center text-sm text-primary">
                <Clock className="h-4 w-4" />
                Contrat signé — validation en cours par l'administration
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SupplierPendingScreen;
