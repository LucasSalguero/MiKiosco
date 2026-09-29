"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import { obtenerPendientes } from "@/features/offline-sync/lib/cola-ventas";
import { hoyISO } from "@/shared/lib/fechas";
import { useToast } from "@/shared/ui/use-toast";

type TotalDiaContextValue = {
  total: number;
  sumar: (diferencia: number) => void;
};

const ContextoTotalDia = createContext<TotalDiaContextValue | null>(null);

export function TotalDiaProvider({
  children,
  totalInicial,
  errorInicial,
}: {
  children: ReactNode;
  totalInicial: number;
  errorInicial?: string;
}): ReactElement {
  const [total, setTotal] = useState(totalInicial);
  const totalServidor = useRef(totalInicial);
  const { mostrar } = useToast();

  useEffect(() => {
    if (errorInicial) mostrar(errorInicial, "error");
    let activo = true;

    const actualizar = async () => {
      const fecha = hoyISO();
      const [resultadoResumen, resultadoPendientes] = await Promise.all([
        obtenerResumenDiario(fecha),
        obtenerPendientes(),
      ]);
      if (!activo) return;

      const resumen = resultadoResumen.ok
        ? resultadoResumen.data
        : { fecha, total: totalServidor.current, cantidadVentas: 0 };
      if (!resultadoResumen.ok) mostrar(resultadoResumen.error, "error");
      else totalServidor.current = resultadoResumen.data.total;

      if (!resultadoPendientes.ok) {
        mostrar(resultadoPendientes.error, "error");
        setTotal(resumen.total);
        return;
      }

      setTotal(combinarConPendientes(resumen, resultadoPendientes.data, fecha).total);
    };

    void actualizar().catch((error: unknown) => {
      console.error("daily-summary.TotalDiaProvider", error);
      if (activo) mostrar("No se pudo actualizar el total del día.", "error");
    });
    window.addEventListener("ventas-pendientes-cambio", actualizar);
    window.addEventListener("online", actualizar);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", actualizar);
      window.removeEventListener("online", actualizar);
    };
  }, [errorInicial, mostrar]);

  const sumar = (diferencia: number) => {
    setTotal((actual) => Math.max(0, actual + diferencia));
  };

  return (
    <ContextoTotalDia.Provider value={{ total, sumar }}>
      {children}
    </ContextoTotalDia.Provider>
  );
}

export function useTotalDia(): TotalDiaContextValue {
  const contexto = useContext(ContextoTotalDia);
  if (!contexto) throw new Error("useTotalDia debe usarse dentro de TotalDiaProvider.");
  return contexto;
}