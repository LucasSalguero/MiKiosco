"use client";

import { createContext, useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";

export type ToastTipo = "ok" | "error";

export type Toast = {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
  accion?: { etiqueta: string; alEjecutar: () => void };
};

export type ToastContextValue = {
  mostrar: (mensaje: string, tipo?: ToastTipo, accion?: Toast["accion"]) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: ToastTipo = "ok", accion?: Toast["accion"]) => {
    const id = Date.now() + Math.random();
    setToasts((actual) => [...actual, { id, mensaje, tipo, accion }]);
    window.setTimeout(() => {
      setToasts((actual) => actual.filter((toast) => toast.id !== id));
    }, accion ? 6000 : 3000);
  }, []);

  const value = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="contenedor-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.tipo}`}
          >
            <span>{toast.mensaje}</span>
            {toast.accion ? <button type="button" onClick={toast.accion.alEjecutar}>{toast.accion.etiqueta}</button> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastContext };
