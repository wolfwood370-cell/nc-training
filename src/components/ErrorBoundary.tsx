import { Component, type ErrorInfo, type ReactNode } from"react";
import { Button } from"@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-6">
            <span className="text-6xl"role="img"aria-label="error"></span>
            <h1 className="text-2xl font-bold text-foreground">
              Qualcosa è andato storto
            </h1>
            <p className="text-muted-foreground">
              Non è colpa tua. Si è verificato un errore imprevisto nell'applicazione.
            </p>
            {this.state.error && (
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReload} className="btn-primary-glow">
              Ricarica App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
