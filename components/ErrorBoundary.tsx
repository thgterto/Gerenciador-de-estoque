import React, { type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Algo deu errado nesta seção
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Ocorreu um erro inesperado ao processar os dados. Tente recarregar a página.
          </p>
          
          {this.state.error && (
            <div className="mb-6 p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-xs font-mono text-left w-full max-w-lg overflow-auto max-h-32 text-red-600">
               {this.state.error.toString()}
            </div>
          )}

          <div className="flex gap-3">
             <Button variant="white" onClick={this.handleRetry}>
                Tentar Novamente
             </Button>
             <Button variant="primary" onClick={this.handleReload}>
                Recarregar Página
             </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}