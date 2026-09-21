import type { NuevaVenta } from "@/shared/types/venta";

import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export function validarNuevaVenta(venta: NuevaVenta): Resultado<NuevaVenta> {
  if (!Array.isArray(venta.items) || venta.items.length === 0) {
    return fallo("La venta debe incluir al menos un producto.");
  }

  if (typeof venta.fecha !== "string" || Number.isNaN(new Date(venta.fecha).getTime())) {
    return fallo("La fecha de la venta es inválida.");
  }

  for (const item of venta.items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      return fallo("Las cantidades deben ser números enteros mayores a cero.");
    }

    if (!Number.isFinite(item.precioUnitario) || item.precioUnitario < 0) {
      return fallo("El precio unitario no es válido.");
    }

    if (!Number.isInteger(item.productoId) || item.productoId <= 0) {
      return fallo("El producto es inválido.");
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
