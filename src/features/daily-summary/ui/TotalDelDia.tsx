"use client";

import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

export function TotalDelDia({
  total,
  sinConexion,
  compacto = false,
}: {
  total: number;
  sinConexion?: boolean;
  compacto?: boolean;
}): ReactElement {
  return (
    <div className={compacto ? "total-del-dia--compacto" : "total-del-dia"} aria-live="polite">
      <p>{compacto ? "Hoy" : "Total del día"}</p>
      <strong>{formatearPesos(total)}</strong>
      {sinConexion ? (
        <small>Sin conexión: incluye ventas guardadas en este dispositivo</small>
      ) : null}
    </div>
  );
}
