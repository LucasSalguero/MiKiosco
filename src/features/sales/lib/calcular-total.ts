import type { ItemNuevaVenta } from "@/shared/types/venta";

export function calcularTotalVenta(items: ItemNuevaVenta[]): number {
  const totalEnCentavos = items.reduce(
    (total, item) =>
      total + item.cantidad * Math.round(Number(item.precioUnitario.toFixed(2)) * 100),
    0,
  );
  return totalEnCentavos / 100;
}
