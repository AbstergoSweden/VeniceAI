import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const Toast = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <Check className="w-5 h-5 text-green-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20',
        warning: 'bg-yellow-500/10 border-yellow-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    };

    return (
        <Motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
                "flex items-start gap-3 p-4 rounded-xl backdrop-blur-md border shadow-lg max-w-sm w-full",
                bgColors[type] || bgColors.info
            )}
        >
            <div className="mt-0.5">{icons[type] || icons.info}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white/90">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="text-white/50 hover:text-white transition p-0.5 rounded-full hover:bg-white/10"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </Motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast {...toast} onClose={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default Toast;
