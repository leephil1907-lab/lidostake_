import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-main text-text-main flex items-center justify-center p-4">
          <div className="bg-card border border-border-main rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Something went wrong</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                An unexpected error occurred in the application interface. Please reload the page to restore protocol connection.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-input border border-border-main rounded-xl text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-28">
                {this.state.error.message || 'Unknown Application Error'}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3.5 bg-[#00A3FF] hover:bg-[#0090E6] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-[#00A3FF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
