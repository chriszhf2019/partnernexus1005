import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  remountKey: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, remountKey: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, remountKey: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      },
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
      url: window.location.href,
    };
    console.error('[ErrorBoundary]', JSON.stringify(logEntry, null, 2));
    // Store for display
    (window as any).__lastError = { error, errorInfo, logEntry };
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      remountKey: prev.remountKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8" role="alert">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {this.state.error?.stack && (
            <details className="mb-4 max-w-lg w-full">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">错误详情 (Debug)</summary>
              <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error.stack?.split('\n').slice(0, 8).join('\n')}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-black rounded-xl hover:bg-slate-800 dark:hover:bg-white/90 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try Again
          </button>
        </div>
      );
    }

    return <div key={this.state.remountKey}>{this.props.children}</div>;
  }
}
