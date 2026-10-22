import type { MedioPagoRegistrado } from "@/shared/types/venta";

const ETIQUETAS: Record<MedioPagoRegistrado, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  DESCONOCIDO: "Sin registrar",
};

/** Texto para mostrar un medio de pago. DESCONOCIDO son registros anteriores al dato. */
export function etiquetaMedioPago(medio: MedioPagoRegistrado): string {
  return ETIQUETAS[medio];
}
