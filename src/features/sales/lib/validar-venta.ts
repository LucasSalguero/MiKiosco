import type { NuevaVenta } from "@/shared/types/venta";
import type { ItemNuevaVenta } from "@/shared/types/venta";
import { esIdEnteroValido } from "@/shared/lib/validar-id";

import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
const ANTIGUEDAD_MAXIMA_MS = 30 * 24 * 60 * 60 * 1000;

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function validarNuevaVenta(venta: unknown): Resultado<NuevaVenta> {
  if (!esRegistro(venta) || !Array.isArray(venta.items) || venta.items.length === 0) {
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

  const tipoPago = venta.tipoPago === undefined ? "CONTADO" : venta.tipoPago;
  if (tipoPago !== "CONTADO" && tipoPago !== "FIADO") {
    return fallo("El método de pago no es válido.", "validation");
  }
  const clienteNombre = typeof venta.clienteNombre === "string" ? venta.clienteNombre.trim() : "";
  if (tipoPago === "FIADO" && !clienteNombre) {
    return fallo("Ingresá el nombre del cliente para registrar el fiado.", "validation");
  }
  if (clienteNombre.length > 120) {
    return fallo("El nombre del cliente no puede superar los 120 caracteres.", "validation");
  }

  const items: ItemNuevaVenta[] = [];
  let totalEnCentavos = 0;
  for (const item of venta.items) {
    if (
      !esRegistro(item) ||
      typeof item.productoNombre !== "string" ||
      typeof item.cantidad !== "number" ||
      typeof item.precioUnitario !== "number" ||
      (typeof item.productoId !== "number" && item.productoId !== null)
    ) {
      return fallo("Hay un producto inválido en la venta.", "validation");
    }

    if (!item.productoNombre.trim()) {
      return fallo("El nombre del producto no es válido.", "validation");
    }

    if (
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad <= 0 ||
      item.cantidad > 2_147_483_647
    ) {
      return fallo("Las cantidades deben ser números enteros mayores a cero.", "validation");
    }

    if (
      !Number.isFinite(item.precioUnitario) ||
      item.precioUnitario < 0 ||
      item.precioUnitario > Number.MAX_SAFE_INTEGER / 100
    ) {
      return fallo("El precio unitario no es válido.", "validation");
    }

    if (item.productoId !== null && !esIdEnteroValido(item.productoId)) {
      return fallo("El producto es inválido.", "validation");
    }

    const precioUnitario = Number(item.precioUnitario.toFixed(2));
    const subtotalEnCentavos = Math.round(precioUnitario * 100) * item.cantidad;
    if (
      !Number.isSafeInteger(subtotalEnCentavos) ||
      !Number.isSafeInteger(totalEnCentavos + subtotalEnCentavos)
    ) {
      return fallo("El importe del producto supera el límite permitido.", "validation");
    }
    totalEnCentavos += subtotalEnCentavos;
    items.push({
      productoId: item.productoId,
      productoNombre: item.productoNombre.trim(),
      cantidad: item.cantidad,
      precioUnitario,
    });
  }

  return ok({
    fecha: venta.fecha,
    items,
    tipoPago,
    ...(tipoPago === "FIADO" ? { clienteNombre } : {}),
  });
}
