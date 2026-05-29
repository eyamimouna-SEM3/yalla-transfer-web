import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  email: string;
  onContinue: () => void;
}

const StepEmailSent = ({ email, onContinue }: Props) => {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center">
        <Mail className="h-10 w-10 text-primary" />
      </div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
        Vérifiez votre boîte mail
      </h2>
      <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
        Un lien d'activation vous a été envoyé à :
      </p>
      <p className="font-semibold text-foreground mb-8">{email}</p>

      <div className="bg-background rounded-2xl border border-border p-6 max-w-sm mx-auto mb-6">
        <p className="text-sm text-muted-foreground">
          Cliquez sur le lien dans votre email pour activer votre compte. Vérifiez également votre dossier spam.
        </p>
      </div>

      {/* Simulated continue for demo */}
      <Button
        onClick={onContinue}
        variant="outline"
        className="gap-2 rounded-xl"
      >
        Simuler la vérification
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default StepEmailSent;
