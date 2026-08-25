import React from 'react';

interface Props {
  children: React.ReactNode;
  // Either a static fallback (section-level recovery, the common case), or a
  // render function that receives the actual caught error/reset handler
  // (used for the app's top-level, full-page crash screen which shows error
  // details and a hard reload instead of an in-place retry).
  fallback?: React.ReactNode | ((error: Error | null, reset: () => void) => React.ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// The single ErrorBoundary for the whole app — previously App.tsx had its
// own separate inline implementation (full-page crash screen) alongside
// this one (section-level, used only in TeacherPage.tsx), so a future
// change to error-boundary behavior (e.g. Sentry reporting) would only land
// in whichever one someone happened to find (Audit: duplicate ErrorBoundary
// implementations). One implementation, fallback shape covers both cases.
//
// Without this, an uncaught render error anywhere in the wrapped tree (e.g. a
// malformed Firestore doc reaching a `.trim()` on a non-string) blanks the
// entire page with no visible error and no way to recover except a manual
// refresh, since React unmounts the whole tree on an uncaught render error.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-bold text-zinc-400">
              Something went wrong loading this section.
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl transition-all"
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
