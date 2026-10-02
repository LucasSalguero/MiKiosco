import type { NuevaVenta } from "@/shared/types/venta";

import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
const ANTIGUEDAD_MAXIMA_MS = 30 * 24 * 60 * 60 * 1000;

export function validarNuevaVenta(venta: NuevaVenta): Resultado<NuevaVenta> {
  if (!Array.isArray(venta.items) || venta.items.length === 0) {
    return fallo("La venta debe incluir al menos un producto.", "validation");
  }

  if (typeof venta.fecha !== "string" || Number.isNaN(new Date(venta.fecha).getTime())) {
    return fallo("La fecha de la venta es inválida.", "validation");
  }
  const instanteVenta = new Date(venta.fecha).getTime();
  const ahora = Date.now();
  if (instanteVenta > ahora + TOLERANCIA_FUTURO_MS) {
    return fallo("La fecha de la venta no puede ser futura.", "validation");
  }
  if (instanteVenta < ahora - ANTIGUEDAD_MAXIMA_MS) {
    return fallo("La venta tiene más de 30 días y requiere revisión.", "validation");
  }

  for (const item of venta.items) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.productoNombre !== "string" ||
      typeof item.cantidad !== "number" ||
      typeof item.precioUnitario !== "number" ||
      typeof item.productoId !== "number"
    ) {
      return fallo("Hay un producto inválido en la venta.", "validation");
    }
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      return fallo("Las cantidades deben ser números enteros mayores a cero.", "validation");
    }

    if (!Number.isFinite(item.precioUnitario) || item.precioUnitario < 0) {
      return fallo("El precio unitario no es válido.", "validation");
    }

    if (!Number.isInteger(item.productoId) || item.productoId <= 0) {
      return fallo("El producto es inválido.", "validation");
    }
  }

  return ok({
    fecha: venta.fecha,
    items: venta.items.map((item) => ({
      productoId: item.productoId,
      productoNombre: item.productoNombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario.toFixed(2)),
    })),
  });
}
