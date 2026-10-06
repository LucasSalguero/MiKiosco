import type { EstadoPago } from "@/shared/types/venta";

export function calcularIngresosDelDia(
  ventas: Array<{ total: number; estadoPago: EstadoPago }>,
  pagos: number[],
): number {
  const ingresosEnCentavos = ventas.reduce(
    (total, venta) => total + (venta.estadoPago === "PAGADA" ? Math.round(venta.total * 100) : 0),
    0,
  );
  const pagosEnCentavos = pagos.reduce((total, pago) => total + Math.round(pago * 100), 0);
  return (ingresosEnCentavos + pagosEnCentavos) / 100;
}
