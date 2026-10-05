import type { Venta } from "@/shared/types/venta";
import { decimalANumero } from "@/shared/lib/moneda";

type VentaPersistida = {
  id: number;
  fecha: Date;
  total: { toString: () => string };
  sincronizada: boolean;
  anulada: boolean;
  tipoPago: "CONTADO" | "FIADO";
  clienteNombre: string | null;
  items: Array<{
    id: number;
    productoId: number | null;
    productoNombre: string;
    cantidad: number;
    precioUnitario: { toString: () => string };
    producto: { nombre: string } | null;
  }>;
  cobros: Array<{ monto: { toString: () => string } }>;
};

export function mapearVenta(venta: VentaPersistida): Venta {
  return {
    id: venta.id,
    fecha: venta.fecha.toISOString(),
    total: decimalANumero(venta.total),
    sincronizada: venta.sincronizada,
    anulada: venta.anulada,
    tipoPago: venta.tipoPago,
    clienteNombre: venta.clienteNombre,
    saldoPendiente:
      venta.tipoPago === "FIADO"
        ? Math.max(
            0,
            Number(
              (
                decimalANumero(venta.total) -
                venta.cobros.reduce((suma, cobro) => suma + decimalANumero(cobro.monto), 0)
              ).toFixed(2),
            ),
          )
        : 0,
    items: venta.items.map((item) => {
      const precioUnitario = decimalANumero(item.precioUnitario);
      return {
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.productoNombre || item.producto?.nombre || "Producto",
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: Number((item.cantidad * precioUnitario).toFixed(2)),
      };
    }),
  };
}
