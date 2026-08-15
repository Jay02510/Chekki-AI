import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Without this, an uncaught render error anywhere in the wrapped tree (e.g. a
// malformed Firestore doc reaching a `.trim()` on a non-string) blanks the
// entire page with no visible error and no way to recover except a manual
// refresh, since React unmounts the whole tree on an uncaught render error.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-zinc-400">
              Something went wrong loading this section.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
