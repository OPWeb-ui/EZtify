import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-pastel-bg dark:bg-charcoal-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-charcoal-900 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-charcoal-700">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-bold text-charcoal-800 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-charcoal-500 dark:text-slate-400 text-sm mb-6">
              We encountered an unexpected error. The application has been paused to prevent data loss.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-brand-purple hover:bg-brand-purpleDark text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={16} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}