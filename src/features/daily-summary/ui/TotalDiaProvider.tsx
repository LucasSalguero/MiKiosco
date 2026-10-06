"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { obtenerResumenDiario } from "@/features/daily-summary/actions/obtener-resumen-diario";
import { combinarConPendientes } from "@/features/daily-summary/lib/combinar-resumen";
import { obtenerPendientes } from "@/features/offline-sync/lib/cola-ventas";
import { hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import { useToast } from "@/shared/ui/use-toast";

type TotalDiaContextValue = {
  total: number;
  cantidadACobrarHoy: number;
  sumar: (diferencia: number) => void;
};

const ContextoTotalDia = createContext<TotalDiaContextValue | null>(null);

export function TotalDiaProvider({
  children,
  totalInicial,
  clavesOperacionInicial = [],
  cantidadACobrarHoyInicial = 0,
  errorInicial,
}: {
  children: ReactNode;
  totalInicial: number;
  clavesOperacionInicial?: string[];
  cantidadACobrarHoyInicial?: number;
  errorInicial?: string;
}): ReactElement {
  const [total, setTotal] = useState(totalInicial);
  const [cantidadACobrarHoy, setCantidadACobrarHoy] = useState(cantidadACobrarHoyInicial);
  const totalServidor = useRef<ResumenDiario>({
    fecha: hoyISO(),
    vendido: totalInicial,
    cobrado: totalInicial,
    fiadoNuevo: 0,
    deudaTotal: 0,
    cantidadVentas: 0,
    cantidadACobrarHoy: cantidadACobrarHoyInicial,
    clavesOperacion: clavesOperacionInicial,
  });
  const errorOfflineNotificado = useRef(Boolean(errorInicial));
  const { mostrar } = useToast();

  useEffect(() => {
    if (errorInicial) mostrar(errorInicial, "error");
    let activo = true;

    const actualizar = async () => {
      const fecha = hoyISO();
      let resumen = { ...totalServidor.current, fecha };
      try {
        const resultadoResumen = await obtenerResumenDiario(fecha);
        if (resultadoResumen.ok) {
          resumen = resultadoResumen.data;
          totalServidor.current = resultadoResumen.data;
          setCantidadACobrarHoy(resultadoResumen.data.cantidadACobrarHoy);
          errorOfflineNotificado.current = false;
        } else if (!errorOfflineNotificado.current) {
          mostrar(
            "Sin conexión o señal débil. El cobrado incluye las ventas de contado guardadas en este dispositivo.",
            "error",
          );
          errorOfflineNotificado.current = true;
        }
      } catch (error) {
        console.error("daily-summary.TotalDiaProvider.resumen", error);
        if (!errorOfflineNotificado.current) {
          mostrar(
            "Sin conexión o señal débil. El cobrado incluye las ventas de contado guardadas en este dispositivo.",
            "error",
          );
          errorOfflineNotificado.current = true;
        }
      }
      if (!activo) return;

      const resultadoPendientes = await obtenerPendientes();
      if (!activo) return;
      if (!resultadoPendientes.ok) {
        mostrar(resultadoPendientes.error, "error");
        setTotal(resumen.cobrado);
        setCantidadACobrarHoy(resumen.cantidadACobrarHoy);
        return;
      }

      const combinado = combinarConPendientes(resumen, resultadoPendientes.data, fecha);
      setTotal(combinado.cobrado);
      setCantidadACobrarHoy(combinado.cantidadACobrarHoy);
    };

    void actualizar().catch((error: unknown) => {
      console.error("daily-summary.TotalDiaProvider", error);
      if (activo) mostrar("No se pudo actualizar el total del día.", "error");
    });
    const actualizarConManejoError = () => {
      void actualizar().catch((error: unknown) => {
        console.error("daily-summary.TotalDiaProvider", error);
        if (activo) mostrar("No se pudo actualizar el total del día.", "error");
      });
    };
    window.addEventListener("ventas-pendientes-cambio", actualizarConManejoError);
    window.addEventListener("online", actualizarConManejoError);
    return () => {
      activo = false;
      window.removeEventListener("ventas-pendientes-cambio", actualizarConManejoError);
      window.removeEventListener("online", actualizarConManejoError);
    };
  }, [errorInicial, mostrar]);

  const sumar = (diferencia: number) => {
    const sumarCentavos = (monto: number) =>
      (Math.round(monto * 100) + Math.round(diferencia * 100)) / 100;
    totalServidor.current = {
      ...totalServidor.current,
      cobrado: Math.max(0, sumarCentavos(totalServidor.current.cobrado)),
    };
    setTotal((actual) => Math.max(0, sumarCentavos(actual)));
  };

  return (
    <ContextoTotalDia.Provider value={{ total, cantidadACobrarHoy, sumar }}>
      {children}
    </ContextoTotalDia.Provider>
  );
}

export function useTotalDia(): TotalDiaContextValue {
  const contexto = useContext(ContextoTotalDia);
  if (!contexto) throw new Error("useTotalDia debe usarse dentro de TotalDiaProvider.");
  return contexto;
}
