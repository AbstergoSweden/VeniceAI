/**
 * Offline Indicator component to show network status.
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineIndicator shows a banner when the user goes offline.
 * Automatically hides when connection is restored.
 */
const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);

            // Hide reconnected message after 3 seconds
            setTimeout(() => {
                setShowReconnected(false);
            }, 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {/* Offline Banner */}
            {!isOnline && (
                <Motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-error text-white py-3 px-4 shadow-lg"
                >
                    <div className="container mx-auto flex items-center justify-center gap-3">
                        <WifiOff className="w-5 h-5 animate-pulse" />
                        <p className="text-sm font-semibold">
                            You're offline. Some features may not work.
                        </p>
                    </div>
                </Motion.div>
            )}

            {/* Reconnected Banner */}
            {showReconnected && (
                <Motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-3 px-4 shadow-lg"
                >
                    <div className="container mx-auto flex items-center justify-center gap-3">
                        <Wifi className="w-5 h-5" />
                        <p className="text-sm font-semibold">
                            You're back online!
                        </p>
                    </div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineIndicator;
