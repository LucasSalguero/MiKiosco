import type { Venta } from "@/shared/types/venta";
import { decimalANumero } from "@/shared/lib/moneda";

type VentaPersistida = {
  id: number;
  fecha: Date;
  total: { toString: () => string };
  sincronizada: boolean;
  anulada: boolean;
  estadoPago: "PAGADA" | "A_COBRAR_HOY" | "FIADA";
  clienteFiadoId: number | null;
  clienteFiado: { nombre: string } | null;
  clienteNombre: string | null;
  autorizadaPor: string | null;
  items: Array<{
    id: number;
    productoId: number | null;
    productoNombre: string;
    cantidad: number;
    precioUnitario: { toString: () => string };
    producto: { nombre: string } | null;
  }>;
  pagos: Array<{ monto: { toString: () => string } }>;
};

export function mapearVenta(venta: VentaPersistida): Venta {
  return {
    id: venta.id,
    fecha: venta.fecha.toISOString(),
    total: decimalANumero(venta.total),
    sincronizada: venta.sincronizada,
    anulada: venta.anulada,
    estadoPago: venta.estadoPago,
    clienteFiadoId: venta.clienteFiadoId,
    clienteNombre: venta.clienteFiado?.nombre ?? venta.clienteNombre,
    autorizadaPor: venta.autorizadaPor,
    saldoPendiente:
      venta.estadoPago !== "PAGADA"
        ? Math.max(
            0,
            Math.round(decimalANumero(venta.total) * 100) -
              venta.pagos.reduce(
                (suma, pago) => suma + Math.round(decimalANumero(pago.monto) * 100),
                0,
              ),
          ) / 100
        : 0,
    items: venta.items.map((item) => {
      const precioUnitario = decimalANumero(item.precioUnitario);
      return {
        id: item.id,
        productoId: item.productoId,
        productoNombre: item.productoNombre || item.producto?.nombre || "Producto",
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: (Math.round(precioUnitario * 100) * item.cantidad) / 100,
      };
    }),
  };
}
