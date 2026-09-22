"use client";

import type { ReactElement } from "react";

import { formatearPesos } from "@/shared/lib/moneda";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

export function TotalDelDia({
  resumen,
  sinConexion,
}: {
  resumen: ResumenDiario | null;
  sinConexion?: boolean;
}): ReactElement {
  const total = resumen?.total ?? 0;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <p className="text-sm uppercase tracking-wide text-emerald-700">Total del día</p>
      <p className="mt-3 text-4xl font-bold text-slate-900">{formatearPesos(total)}</p>
      {sinConexion ? (
        <p className="mt-2 text-sm text-emerald-700">Sin conexión: incluye solo ventas sin sincronizar</p>
      ) : null}
    </div>
  );
}
