"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useCantidadPendientes } from "@/features/offline-sync/lib/use-cantidad-pendientes";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";

export function IndicadorConexion(): ReactElement {
  const [isMounted, setIsMounted] = useState(false);
  const { enLinea } = useEstadoConexion();
  const cantidadPendientes = useCantidadPendientes();
  const mostrarEstadoReal = isMounted;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`indicador-conexion ${mostrarEstadoReal && !enLinea ? "indicador-conexion--offline" : ""}`}
    >
      <span
        className="punto-conexion"
      />
      <span>{mostrarEstadoReal && enLinea ? "En línea" : "Sin conexión"}</span>
      <span className="text-slate-500">•</span>
      <span>{mostrarEstadoReal ? cantidadPendientes : 0} sin sincronizar</span>
    </div>
  );
}
