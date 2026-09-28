"use client";

import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

export function TotalDelDia({
  resumen,
  sinConexion,
  compacto = false,
}: {
  resumen: ResumenDiario | null;
  sinConexion?: boolean;
  compacto?: boolean;
}): ReactElement {
  const total = resumen?.total ?? 0;

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
