"use client";

import type { ReactElement } from "react";

import { useCantidadPendientes } from "@/features/offline-sync/lib/use-cantidad-pendientes";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";

export function IndicadorConexion(): ReactElement {
  const { enLinea } = useEstadoConexion();
  const cantidadPendientes = useCantidadPendientes();

  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
      <span
        className={`h-2.5 w-2.5 rounded-full ${enLinea ? "bg-emerald-500" : "bg-red-500"}`}
      />
      <span>{enLinea ? "En línea" : "Sin conexión"}</span>
      <span className="text-slate-500">•</span>
      <span>{cantidadPendientes} sin sincronizar</span>
    </div>
  );
}
