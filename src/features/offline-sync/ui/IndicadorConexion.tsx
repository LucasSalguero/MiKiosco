"use client";

import type { ReactElement } from "react";

import { useCantidadPendientes } from "@/features/offline-sync/lib/use-cantidad-pendientes";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";

export function IndicadorConexion(): ReactElement {
  const { enLinea } = useEstadoConexion();
  const cantidadPendientes = useCantidadPendientes();

  return (
    <div
      className={`indicador-conexion ${!enLinea ? "indicador-conexion--offline" : ""}`}
      aria-live="polite"
    >
      <span className="punto-conexion" />
      <span>{enLinea ? "En línea" : "Sin conexión"}</span>
      <span>{cantidadPendientes} sin sincronizar</span>
    </div>
  );
}
