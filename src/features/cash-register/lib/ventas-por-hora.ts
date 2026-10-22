import { horaLocal } from "@/shared/lib/fechas";
import type { VentasDeLaHora } from "@/shared/types/caja";

export type VentaPorHora = {
  fecha: Date | string;
  totalCentavos: number;
  anulada: boolean;
};

/** 24 franjas (0 a 23, hora de Buenos Aires) con cantidad e importe en centavos. */
export function ventasPorHora(ventas: readonly VentaPorHora[]): VentasDeLaHora[] {
  const franjas = Array.from({ length: 24 }, (_, hora) => ({ hora, cantidad: 0, importe: 0 }));
  for (const venta of ventas) {
    if (venta.anulada) continue;
    const franja = franjas[horaLocal(new Date(venta.fecha))];
    franja.cantidad += 1;
    franja.importe += venta.totalCentavos;
  }
  return franjas;
}
