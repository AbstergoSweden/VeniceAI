import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * @param {Error} error - The error that was thrown
   * @returns {Object} The new state object
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    // Note: error parameter required by React API but unused in this implementation
    return { hasError: true, error };
  }

  /**
   * @param {Error} error - The error that was caught
   * @param {Object} errorInfo - Information about the error
   * @returns {void}
   */
  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  /**
   * @returns {JSX.Element} The component's rendered output
   */
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
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