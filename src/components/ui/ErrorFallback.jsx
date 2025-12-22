/**
 * Error Fallback UI component for displaying user-friendly error messages.
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

/**
 * ErrorFallback component displays when an error boundary catches an error.
 * 
 * @param {Object} props
 * @param {Error} props.error - The caught error object
 * @param {Function} props.resetError - Function to reset the error boundary
 * @param {boolean} [props.showDetails] - Whether to show error details (default: dev mode only)
 */
const ErrorFallback = ({
    error,
    resetError,
    showDetails = import.meta.env.DEV
}) => {
    const handleReset = () => {
        // Clear any corrupted state
        try {
            localStorage.removeItem('venice_cache');
            sessionStorage.clear();
        } catch (e) {
            console.warn('Failed to clear storage:', e);
        }

        if (resetError) {
            resetError();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-surface-dim flex items-center justify-center p-4">
            <Motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-surface/50 backdrop-blur-xl border border-error/20 rounded-2xl p-8 shadow-2xl"
            >
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-error/10 rounded-full">
                        <AlertCircle className="w-16 h-16 text-error" />
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-center text-on-surface mb-4">
                    Oops! Something went wrong
                </h1>

                <p className="text-center text-on-surface-variant mb-6">
                    We encountered an unexpected error. Don't worry, your data is safe.
                    Try refreshing the page or return to the home screen.
                </p>

                {/* Error Details (Dev Mode) */}
                {showDetails && error && (
                    <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-xl">
                        <p className="text-sm font-mono text-error mb-2">
                            <strong>Error:</strong> {error.message}
                        </p>
                        {error.stack && (
                            <details className="text-xs font-mono text-error/70 mt-2">
                                <summary className="cursor-pointer hover:text-error">
                                    Stack Trace
                                </summary>
                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <Motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </Motion.button>

                    <Motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGoHome}
                        className="flex items-center gap-2 px-6 py-3 bg-surface hover:bg-surface-container border border-white/10 text-on-surface rounded-xl font-semibold transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Motion.button>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-on-surface-variant/60 mt-6">
                    If the problem persists, try clearing your browser cache or contact support.
                </p>
            </Motion.div>
        </div>
    );
};

export default ErrorFallback;
