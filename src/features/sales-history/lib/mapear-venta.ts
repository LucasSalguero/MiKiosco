import type { Venta } from "@/shared/types/venta";
import { decimalANumero } from "@/shared/lib/moneda";

type VentaPersistida = {
  id: number;
  fecha: Date;
  total: { toString: () => string };
  sincronizada: boolean;
  items: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    precioUnitario: { toString: () => string };
    producto: { nombre: string };
  }>;
};

export function mapearVenta(venta: VentaPersistida): Venta {
  return {
    id: venta.id,
    fecha: venta.fecha.toISOString(),
    total: decimalANumero(venta.total),
    sincronizada: venta.sincronizada,
    items: venta.items.map((item) => {
      const precioUnitario = decimalANumero(item.precioUnitario);
      return {
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: Number((item.cantidad * precioUnitario).toFixed(2)),
      };
    }),
  };
}
