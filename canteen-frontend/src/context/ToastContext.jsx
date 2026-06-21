import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const notify = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-max">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className="bg-foreground text-background px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-auto border border-background/20"
                        >
                            {t.type === 'success' && <CheckCircle2 size={18} className="text-success shrink-0" />}
                            {t.type === 'info' && <Info size={18} className="text-blue-400 shrink-0" />}
                            {t.type === 'alert' && <AlertCircle size={18} className="text-destructive shrink-0" />}
                            <span className="text-sm font-semibold tracking-wide flex-1 px-1">{t.message}</span>
                            <button 
                                onClick={() => removeToast(t.id)} 
                                className="opacity-50 hover:opacity-100 transition-opacity p-1 shrink-0"
                            >
                                <span className="text-[10px] font-bold">✕</span>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
