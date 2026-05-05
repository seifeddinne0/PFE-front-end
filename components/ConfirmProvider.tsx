"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>();

  const confirm = (opts: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      const parsedOptions = typeof opts === "string" ? { message: opts } : opts;
      setOptions({
        title: parsedOptions.title || "Confirmation",
        confirmText: parsedOptions.confirmText || "Confirmer",
        cancelText: parsedOptions.cancelText || "Annuler",
        variant: parsedOptions.variant || "danger",
        message: parsedOptions.message,
      });
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 ${
              options.variant === "danger" ? "bg-red-50/50 dark:bg-red-900/10" : 
              options.variant === "warning" ? "bg-amber-50/50 dark:bg-amber-900/10" : 
              "bg-blue-50/50 dark:bg-blue-900/10"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  options.variant === "danger" ? "bg-red-100 text-red-600 dark:bg-red-900/30" : 
                  options.variant === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : 
                  "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-zinc-100">{options.title}</h3>
                <button onClick={handleCancel} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed">
                {options.message}
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-950/50 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                {options.cancelText}
              </button>
              <button 
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors ${
                  options.variant === "danger" ? "bg-red-500 hover:bg-red-600" : 
                  options.variant === "warning" ? "bg-amber-500 hover:bg-amber-600" : 
                  "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
