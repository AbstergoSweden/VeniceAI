import React, { useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  const styles = {
    success: 'bg-green-500/80 border-green-400',
    error: 'bg-red-500/80 border-red-400',
    info: 'bg-blue-500/80 border-blue-400'
  };

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <Motion.div
      layout
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`fixed bottom-4 right-4 flex items-center p-4 rounded-lg shadow-lg backdrop-blur-md text-white border ${styles[type] || styles.info} z-[100] min-w-[300px] max-w-md`}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-1 font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-3 p-1 hover:bg-white/20 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </Motion.div>
  );
};

export default Toast;
