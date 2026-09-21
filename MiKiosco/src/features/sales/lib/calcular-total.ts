import type { ItemNuevaVenta } from "@/shared/types/venta";

export function calcularTotalVenta(items: ItemNuevaVenta[]): number {
  return items.reduce((total, item) => total + item.cantidad * item.precioUnitario, 0);
}
