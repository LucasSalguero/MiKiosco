import type { EstadoPago } from "@/shared/types/venta";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function obtenerEstadoPago(venta: unknown): EstadoPago | null {
  if (!esRegistro(venta)) return null;

  const estadoPago = venta.estadoPago;
  if (estadoPago === "PAGADA" || estadoPago === "A_COBRAR_HOY" || estadoPago === "FIADA") {
    return estadoPago;
  }
  if (estadoPago !== undefined) return null;

  if (venta.tipoPago === "FIADO") return "FIADA";
  if (venta.tipoPago === undefined || venta.tipoPago === "CONTADO") return "PAGADA";
  return null;
}
