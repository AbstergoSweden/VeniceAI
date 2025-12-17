import React from 'react';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree.
 * Displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends React.Component {
  /**
   * Creates an instance of ErrorBoundary.
   * @param {object} props - Component props.
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Update state so the next render will show the fallback UI.
   * @param {Error} error - The error that was thrown.
   * @returns {object} The new state.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Log the error to an error reporting service.
   * @param {Error} error - The error that was thrown.
   * @param {object} errorInfo - Component stack trace.
   */
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  /**
   * Renders the fallback UI if an error exists, otherwise renders children.
   * @returns {JSX.Element} The rendered content.
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className="m3-surface flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold text-error mb-4">Something went wrong.</h2>
          <p className="text-on-surface-variant mb-4">An unexpected error occurred in the application.</p>
          <button
            className="m3-button-filled"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="w-full mt-6 p-4 bg-surface-container rounded-xl border border-outline-variant text-xs text-on-surface-variant overflow-auto max-h-60">
              <summary className="cursor-pointer">Error details</summary>
              <p>Error: {this.state.error && this.state.error.toString()}</p>
              <p>Stack: {this.state.error && this.state.error.stack}</p>
              <pre className="mt-2">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;