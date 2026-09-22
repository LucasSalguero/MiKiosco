import type { Venta } from "@/shared/types/venta";

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
    total: Number(venta.total.toString()),
    sincronizada: venta.sincronizada,
    items: venta.items.map((item) => ({
      id: item.id,
      productoId: item.productoId,
      productoNombre: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precioUnitario.toString()),
      subtotal: Number(item.cantidad * Number(item.precioUnitario.toString())),
    })),
  };
}
