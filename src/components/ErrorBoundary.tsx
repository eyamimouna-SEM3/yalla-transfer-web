import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-xl border border-destructive/30 bg-card p-6 shadow-card">
            <p className="text-sm font-semibold text-destructive mb-2">
              Une erreur a bloqué l'affichage de la page.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Rechargez la page. Si le problème revient, envoyez ce message d'erreur.
            </p>
            <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
