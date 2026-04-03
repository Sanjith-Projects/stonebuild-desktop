'use client';

import { createContext, useContext, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { Toaster } from "@/components/ui/toaster";

type ToastType = "success" | "error";

const UIContext = createContext<any>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return (
    <UIContext.Provider
      value={{ showLoader, hideLoader, showToast }}
    >
      {children}

      {loading && <Loader />}

      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);