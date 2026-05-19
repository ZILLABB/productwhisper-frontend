import React, { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastOptions {
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
  showToast: () => {},
});

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
    };

    setToasts((prevToasts) => [...prevToasts, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast: addToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  return (
    <div
      className={`flex items-start p-4 mb-4 rounded-lg border-l-4 shadow-md animate-fade-in ${getToastStyles()}`}
      role="alert"
    >
      <div className="flex-1">
        <p className="font-semibold">{toast.title}</p>
        <p className="text-sm mt-1">{toast.message}</p>
      </div>
      <button
        type="button"
        className="ml-4 text-gray-400 hover:text-gray-900 focus:outline-none"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastProvider;
