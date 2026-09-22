"use client";

import { useEffect, type ReactElement } from "react";

import { sincronizarPendientes, type EnviarVenta } from "@/features/offline-sync/lib/sincronizar";
import { useCantidadPendientes } from "@/features/offline-sync/lib/use-cantidad-pendientes";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";
import { useToast } from "@/shared/ui/use-toast";

export function SincronizadorAutomatico({ enviar }: { enviar: EnviarVenta }): ReactElement | null {
  const { enLinea } = useEstadoConexion();
  const pendientes = useCantidadPendientes();
  const { mostrar } = useToast();

  useEffect(() => {
    if (!enLinea || pendientes === 0) {
      return;
    }

    const sincronizar = async () => {
      const resultado = await sincronizarPendientes(enviar);

      if (!resultado.ok) {
        mostrar(resultado.error, "error");
        return;
      }

      if (resultado.data.enviadas > 0) {
        mostrar(`${resultado.data.enviadas} ventas sincronizadas`, "ok");
      }
    };

    void sincronizar();

    const intervalo = window.setInterval(() => {
      if (enLinea && pendientes > 0) {
        void sincronizar();
      }
    }, 60000);

    return () => window.clearInterval(intervalo);
  }, [enLinea, pendientes, enviar, mostrar]);

  useEffect(() => {
    if (!enLinea) {
      return;
    }

    const sincronizar = async () => {
      const resultado = await sincronizarPendientes(enviar);
      if (!resultado.ok) {
        mostrar(resultado.error, "error");
      } else if (resultado.data.enviadas > 0) {
        mostrar(`${resultado.data.enviadas} ventas sincronizadas`, "ok");
      }
    };

    void sincronizar();
  }, [enLinea, enviar, mostrar]);

  return null;
}
