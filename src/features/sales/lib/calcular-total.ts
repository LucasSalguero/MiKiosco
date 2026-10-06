import type { ItemNuevaVenta } from "@/shared/types/venta";
import { redondearMonto } from "@/shared/lib/moneda";

export function calcularTotalVenta(items: ItemNuevaVenta[]): number {
  const totalEnCentavos = items.reduce((total, item) => {
    const precioEnCentavos = Math.round(redondearMonto(item.precioUnitario) * 100);
    return total + item.cantidad * precioEnCentavos;
  }, 0);
  return redondearMonto(totalEnCentavos / 100);
}
