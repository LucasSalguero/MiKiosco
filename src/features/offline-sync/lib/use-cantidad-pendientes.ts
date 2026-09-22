"use client";

import { useEffect, useState } from "react";

import { contarPendientes } from "@/features/offline-sync/lib/cola-ventas";

export function useCantidadPendientes(): number {
  const [cantidad, setCantidad] = useState<number>(0);

  useEffect(() => {
    const actualizar = async () => {
      const resultado = await contarPendientes();
      if (resultado.ok) {
        setCantidad(resultado.data);
      }
    };

    void actualizar();

    const onCambio = () => {
      void actualizar();
    };

    window.addEventListener("ventas-pendientes-cambio", onCambio);

    return () => {
      window.removeEventListener("ventas-pendientes-cambio", onCambio);
    };
  }, []);

  return cantidad;
}
