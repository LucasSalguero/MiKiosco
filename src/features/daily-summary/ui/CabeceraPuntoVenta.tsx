"use client";

import { useEffect, useState, type ReactElement } from "react";

import { IndicadorConexion } from "@/features/offline-sync/ui/IndicadorConexion";
import { formatearPesos } from "@/shared/lib/moneda";
import type { ResumenDiario } from "@/shared/types/resumen-diario";

export function CabeceraPuntoVenta({ resumenInicial }: { resumenInicial: ResumenDiario | null }): ReactElement {
  const [total, setTotal] = useState(resumenInicial?.total ?? 0);

  useEffect(() => {
    const actualizar = (evento: Event) => {
      const detalle = (evento as CustomEvent<{ diferencia: number }>).detail;
      setTotal((actual) => Math.max(0, actual + detalle.diferencia));
    };
    window.addEventListener("total-del-dia-cambio", actualizar);
    return () => window.removeEventListener("total-del-dia-cambio", actualizar);
  }, []);

  return (
    <header className="cabecera-punto-venta">
      <div><p className="marca">Mi Kiosco</p><h1>Vender</h1></div>
      <div className="estado-punto-venta">
        <IndicadorConexion />
        <div className="total-compacto" aria-live="polite"><span>Hoy</span><strong>{formatearPesos(total)}</strong></div>
      </div>
    </header>
  );
}
