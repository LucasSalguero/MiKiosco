"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import { obtenerPendientes } from "@/features/offline-sync/lib/cola-ventas";
import { hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

type ResumenDiarioContextValue = {
  resumen: ResumenDiario | null;
  registrarCambio: (diferenciaTotal: number, diferenciaCantidad: number) => void;
};

const ContextoResumenDiario = createContext<ResumenDiarioContextValue | null>(null);

export function ResumenDiarioProvider({ children }: { children: ReactNode }): ReactElement {
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      const fecha = hoyISO();
      const resultadoPendientes = await obtenerPendientes();
      let resumenServidor = null;

      try {
        const resultadoResumen = await obtenerResumenDiario(fecha);
        if (resultadoResumen.ok) resumenServidor = resultadoResumen.data;
      } catch (error) {
        console.error("daily-summary.ResumenDiarioProvider", error);
      }

      if (!activo) return;

      setResumen(
        combinarConPendientes(
          resumenServidor,
          resultadoPendientes.ok ? resultadoPendientes.data : [],
          fecha,
        ),
      );
    };

    void cargar();
    window.addEventListener("ventas-pendientes-cambio", cargar);
    window.addEventListener("online", cargar);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", cargar);
      window.removeEventListener("online", cargar);
    };
  }, []);

  const registrarCambio = (diferenciaTotal: number, diferenciaCantidad: number) => {
    setResumen((actual) => ({
      fecha: actual?.fecha ?? hoyISO(),
      total: Math.max(0, (actual?.total ?? 0) + diferenciaTotal),
      cantidadVentas: Math.max(0, (actual?.cantidadVentas ?? 0) + diferenciaCantidad),
    }));
  };

  return (
    <ContextoResumenDiario.Provider value={{ resumen, registrarCambio }}>
      {children}
    </ContextoResumenDiario.Provider>
  );
}

export function useResumenDiario(): ResumenDiarioContextValue {
  const contexto = useContext(ContextoResumenDiario);
  if (!contexto) {
    throw new Error("useResumenDiario debe usarse dentro de ResumenDiarioProvider.");
  }
  return contexto;
}
