"use client";

import type { ReactElement } from "react";

import { IndicadorConexion } from "@/features/offline-sync/ui/IndicadorConexion";
import { useEstadoConexion } from "@/features/offline-sync/lib/use-estado-conexion";
import { TotalDelDia } from "@/features/daily-summary/ui/TotalDelDia";
import { useTotalDia } from "@/features/daily-summary/ui/TotalDiaProvider";

export function CabeceraPuntoVenta(): ReactElement {
  const { total } = useTotalDia();
  const { enLinea } = useEstadoConexion();

  return (
    <header className="cabecera-punto-venta">
      <div>
        <p className="marca">Mi Kiosco</p>
        <h1>Vender</h1>
      </div>
      <div className="estado-punto-venta">
        <IndicadorConexion />
        <TotalDelDia total={total} compacto sinConexion={!enLinea} />
      </div>
    </header>
  );
}
