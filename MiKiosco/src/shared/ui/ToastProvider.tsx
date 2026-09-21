"use client";

import { createContext, useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";

export type ToastTipo = "ok" | "error";

export type Toast = {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
};

export type ToastContextValue = {
  mostrar: (mensaje: string, tipo?: ToastTipo) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: ToastTipo = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((actual) => [...actual, { id, mensaje, tipo }]);
    window.setTimeout(() => {
      setToasts((actual) => actual.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border px-3 py-2 text-sm shadow-md ${
              toast.tipo === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastContext };
