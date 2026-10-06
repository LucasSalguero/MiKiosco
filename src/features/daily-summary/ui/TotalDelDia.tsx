"use client";

import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";

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
      <p>{compacto ? "Cobrado hoy" : "Cobrado del día"}</p>
      <strong>{formatearPesos(total)}</strong>
      {sinConexion ? (
        <small>Sin conexión: incluye ventas de contado guardadas en este dispositivo</small>
      ) : null}
    </div>
  );
}
