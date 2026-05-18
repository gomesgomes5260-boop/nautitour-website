'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  error: Error | null;
  info: ErrorInfo | null;
};

export default class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BlockNoteEditor] crashed:', error, info);
    this.setState({ info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
    this.props.onReset?.();
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900">
              O editor de conteúdo falhou ao carregar.
            </p>
            <p className="text-sm text-red-800 mt-1">
              O resto do formulário continua funcionando. Você pode salvar como
              rascunho e tentar novamente depois.
            </p>
            <details className="mt-3 text-xs text-red-700">
              <summary className="cursor-pointer font-medium">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono bg-white/60 border border-red-200 rounded p-2 max-h-40 overflow-auto">
                {error.name}: {error.message}
                {error.stack ? `\n\n${error.stack}` : ''}
                {info?.componentStack ? `\n\nComponent stack:${info.componentStack}` : ''}
              </pre>
            </details>
            <button
              type="button"
              onClick={this.reset}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Tentar carregar editor de novo
            </button>
          </div>
        </div>
      </div>
    );
  }
}
