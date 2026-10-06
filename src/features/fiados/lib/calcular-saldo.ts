import { redondearMonto } from "@/shared/lib/moneda";
import type { EstadoPago } from "@/shared/types/venta";

export function calcularSaldo(
  ventas: Array<{ total: number; estadoPago: EstadoPago; anulada: boolean }>,
  pagos: Array<{ monto: number; anulado: boolean }>,
): number {
  const deudaEnCentavos = ventas.reduce((total, venta) => {
    if (venta.anulada || venta.estadoPago === "PAGADA") return total;
    return total + Math.round(redondearMonto(venta.total) * 100);
  }, 0);
  const pagosEnCentavos = pagos.reduce((total, pago) => {
    if (pago.anulado) return total;
    return total + Math.round(redondearMonto(pago.monto) * 100);
  }, 0);
  return redondearMonto((deudaEnCentavos - pagosEnCentavos) / 100);
}
