import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast: Toast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="pointer-events-auto animate-slideIn"
                        style={{
                            animation: 'slideIn 0.3s ease-out'
                        }}
                    >
                        <div
                            className={`
                                min-w-[320px] max-w-md px-4 py-3 rounded-xl backdrop-blur-xl border shadow-lg
                                flex items-center gap-3 relative overflow-hidden
                                ${toast.type === 'success'
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : toast.type === 'error'
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                }
                            `}
                        >
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {toast.type === 'success' && (
                                    <CheckCircle size={20} className="text-green-400" />
                                )}
                                {toast.type === 'error' && (
                                    <XCircle size={20} className="text-red-400" />
                                )}
                                {toast.type === 'info' && (
                                    <AlertCircle size={20} className="text-blue-400" />
                                )}
                            </div>

                            {/* Message */}
                            <p className="flex-1 text-sm font-medium">{toast.message}</p>

                            {/* Close Button */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-all"
                            >
                                <X size={16} />
                            </button>

                            {/* Progress Bar */}
                            <div
                                className={`
                                    absolute bottom-0 left-0 h-1 animate-progress
                                    ${toast.type === 'success'
                                        ? 'bg-green-400'
                                        : toast.type === 'error'
                                            ? 'bg-red-400'
                                            : 'bg-blue-400'
                                    }
                                `}
                                style={{
                                    animation: 'progress 3s linear'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Animations */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
