"use client";

import { useEffect, useRef, type ReactElement } from "react";

import { sincronizarPendientes } from "@/features/offline-sync/lib/sincronizar";
import { enviarVenta } from "@/features/offline-sync/lib/enviar-venta";
import { useCantidadPendientes } from "@/features/offline-sync/lib/use-cantidad-pendientes";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";
import { useToast } from "@/shared/ui/use-toast";

export function SincronizadorAutomatico(): ReactElement | null {
  const { enLinea } = useEstadoConexion();
  const pendientes = useCantidadPendientes();
  const { mostrar } = useToast();
  const ultimoAvisoRevision = useRef(0);

  useEffect(() => {
    let temporizadorReintento: number | undefined;
    if (pendientes === 0) ultimoAvisoRevision.current = 0;
    const sincronizar = async (forzarReintento = false) => {
      if (!navigator.onLine || pendientes === 0) return;
      const resultado = await sincronizarPendientes(enviarVenta, forzarReintento);

      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }

      if (resultado.data.enviadas > 0) {
        mostrar(`${resultado.data.enviadas} ventas sincronizadas`, "ok");
      }
      if (
        resultado.data.requierenRevision > 0 &&
        resultado.data.requierenRevision !== ultimoAvisoRevision.current
      ) {
        ultimoAvisoRevision.current = resultado.data.requierenRevision;
        mostrar(
          `${resultado.data.requierenRevision} ventas no se pudieron sincronizar. Revisalas en Historial.`,
          "error",
        );
      }
      if (temporizadorReintento !== undefined) window.clearTimeout(temporizadorReintento);
      if (resultado.data.proximoIntento) {
        const demora = Math.max(0, new Date(resultado.data.proximoIntento).getTime() - Date.now());
        temporizadorReintento = window.setTimeout(() => sincronizarConManejoError(), demora);
      }
    };

    const sincronizarConManejoError = (forzarReintento = false) => {
      void sincronizar(forzarReintento).catch((error: unknown) => {
        console.error("offline-sync.SincronizadorAutomatico", error);
        mostrar("No se pudieron sincronizar las ventas pendientes.", "error");
      });
    };
    const sincronizarAlVolver = () => sincronizarConManejoError(true);
    const sincronizarPorCambio = () => sincronizarConManejoError();

    if (enLinea && pendientes > 0) sincronizarConManejoError();
    window.addEventListener("online", sincronizarAlVolver);
    window.addEventListener("ventas-pendientes-cambio", sincronizarPorCambio);

    const intervalo = window.setInterval(() => {
      if (enLinea && pendientes > 0) {
        sincronizarConManejoError();
      }
    }, 60000);

    return () => {
      window.clearInterval(intervalo);
      if (temporizadorReintento !== undefined) window.clearTimeout(temporizadorReintento);
      window.removeEventListener("online", sincronizarAlVolver);
      window.removeEventListener("ventas-pendientes-cambio", sincronizarPorCambio);
    };
  }, [enLinea, pendientes, mostrar]);

  return null;
}
