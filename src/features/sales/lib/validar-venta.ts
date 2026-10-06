import type { NuevaVenta, EstadoPago, ItemNuevaVenta } from "@/shared/types/venta";
import type { Resultado } from "@/shared/types/resultado";
import { fallo, ok } from "@/shared/lib/resultado";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import { normalizarNombreCliente } from "@/features/fiados/lib/normalizar-nombre-cliente";
import { redondearMonto } from "@/shared/lib/moneda";

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
const ANTIGUEDAD_MAXIMA_MS = 30 * 24 * 60 * 60 * 1000;

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function validarNuevaVenta(
  venta: unknown,
  esReintentoOffline = false,
): Resultado<NuevaVenta> {
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

  if (!esReintentoOffline && (venta.tipoPago !== undefined || venta.clienteNombre !== undefined)) {
    return fallo(
      "La venta usa un formato antiguo que requiere sincronización offline.",
      "validation",
    );
  }
  const legacyNombre = typeof venta.clienteNombre === "string" ? venta.clienteNombre : undefined;
  if (venta.tipoPago !== undefined && venta.tipoPago !== "CONTADO" && venta.tipoPago !== "FIADO") {
    return fallo("El método de pago no es válido.", "validation");
  }
  const legacyTipo = venta.tipoPago === "FIADO" ? "FIADA" : undefined;
  const estadoPago = (venta.estadoPago ?? legacyTipo ?? "PAGADA") as EstadoPago;
  if (estadoPago !== "PAGADA" && estadoPago !== "A_COBRAR_HOY" && estadoPago !== "FIADA") {
    return fallo("El estado de pago no es válido.", "validation");
  }

  const clienteFiadoId = venta.clienteFiadoId;
  if (venta.clienteNuevoNombre !== undefined && typeof venta.clienteNuevoNombre !== "string") {
    return fallo("El nombre del cliente no es válido.", "validation");
  }
  const clienteNuevoNombre =
    typeof venta.clienteNuevoNombre === "string"
      ? venta.clienteNuevoNombre.trim()
      : (legacyNombre?.trim() ?? "");
  const tieneClienteId = clienteFiadoId !== undefined;
  const tieneClienteNuevo = clienteNuevoNombre.length > 0;
  if (tieneClienteId && !esIdEnteroValido(clienteFiadoId)) {
    return fallo("El cliente seleccionado no es válido.", "validation");
  }
  if (tieneClienteId && tieneClienteNuevo) {
    return fallo("Elegí un cliente existente o ingresá uno nuevo, no ambos.", "validation");
  }
  if (estadoPago !== "PAGADA" && !tieneClienteId && !tieneClienteNuevo) {
    return fallo("Elegí un cliente para registrar el fiado.", "validation");
  }
  if (estadoPago === "PAGADA" && (tieneClienteId || tieneClienteNuevo)) {
    return fallo("Una venta de contado no puede quedar asociada a una cuenta fiada.", "validation");
  }
  if (clienteNuevoNombre.length > 120) {
    return fallo("El nombre del cliente no puede superar los 120 caracteres.", "validation");
  }
  if (tieneClienteNuevo && !normalizarNombreCliente(clienteNuevoNombre)) {
    return fallo("Ingresá un nombre de cliente válido.", "validation");
  }

  if (venta.autorizadaPor !== undefined && typeof venta.autorizadaPor !== "string") {
    return fallo("El nombre de quien autorizó no es válido.", "validation");
  }
  if (
    venta.autorizacionConfirmada !== undefined &&
    typeof venta.autorizacionConfirmada !== "boolean"
  ) {
    return fallo("La confirmación de autorización no es válida.", "validation");
  }
  const autorizadaPor = typeof venta.autorizadaPor === "string" ? venta.autorizadaPor.trim() : "";
  const autorizacionConfirmada =
    venta.autorizacionConfirmada === true || (legacyTipo === "FIADA" && !venta.estadoPago);
  if (estadoPago === "FIADA" && !autorizacionConfirmada) {
    return fallo("Confirmá que el dueño autorizó anotar esta compra.", "validation");
  }
  if (
    estadoPago !== "FIADA" &&
    (venta.autorizadaPor !== undefined || venta.autorizacionConfirmada !== undefined)
  ) {
    return fallo("La autorización solo corresponde a una cuenta mensual.", "validation");
  }
  if (autorizadaPor.length > 120) {
    return fallo("El nombre de quien autorizó no puede superar los 120 caracteres.", "validation");
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
      item.precioUnitario > 9_999_999_999.99 ||
      !Number.isSafeInteger(Math.round(item.precioUnitario * 100))
    ) {
      return fallo("El precio unitario no es válido.", "validation");
    }
    if (item.productoId !== null && !esIdEnteroValido(item.productoId)) {
      return fallo("El producto es inválido.", "validation");
    }

    const precioUnitario = redondearMonto(item.precioUnitario);
    const subtotalEnCentavos = Math.round(precioUnitario * 100) * item.cantidad;
    if (
      !Number.isSafeInteger(subtotalEnCentavos) ||
      subtotalEnCentavos > 999_999_999_999 ||
      !Number.isSafeInteger(totalEnCentavos + subtotalEnCentavos) ||
      totalEnCentavos + subtotalEnCentavos > 999_999_999_999
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
    estadoPago,
    ...(typeof clienteFiadoId === "number" ? { clienteFiadoId } : {}),
    ...(tieneClienteNuevo ? { clienteNuevoNombre } : {}),
    ...(estadoPago === "FIADA"
      ? {
          autorizadaPor,
          autorizacionConfirmada: true,
        }
      : {}),
  });
}
