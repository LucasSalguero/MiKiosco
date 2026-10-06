"use server";

import prisma from "@/shared/db/client";
import { Prisma } from "@prisma/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esIdEnteroValido } from "@/shared/lib/validar-id";
import { obtenerSaldoCliente } from "@/features/fiados/lib/obtener-saldo-cliente";
import { decimalANumero } from "@/shared/lib/moneda";
import type { Resultado } from "@/shared/types/resultado";

export type MovimientoCuenta =
  | {
      tipo: "VENTA";
      id: number;
      fecha: string;
      monto: number;
      estadoPago: "A_COBRAR_HOY" | "FIADA";
      autorizadaPor: string | null;
      saldoPendiente: number;
      items: Array<{ id: number; nombre: string; cantidad: number; precioUnitario: number }>;
    }
  | {
      tipo: "PAGO";
      id: number;
      fecha: string;
      monto: number;
      medio: "EFECTIVO" | "TRANSFERENCIA" | "DESCONOCIDO";
      ventaId: number | null;
      anulado: boolean;
    };

export type CuentaCliente = {
  cliente: { id: number; nombre: string; telefono: string | null };
  saldo: number;
  movimientos: MovimientoCuenta[];
};

export async function obtenerCuentaCliente(
  clienteFiadoId: unknown,
): Promise<Resultado<CuentaCliente>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (!esIdEnteroValido(clienteFiadoId)) return fallo("El cliente seleccionado no es válido.");

  try {
    const [cliente, ventas, pagos, saldo] = await Promise.all([
      prisma.cliente.findUnique({
        where: { id: clienteFiadoId },
        select: { id: true, nombre: true, telefono: true },
      }),
      prisma.venta.findMany({
        where: {
          clienteFiadoId,
          anulada: false,
          estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] },
        },
        include: { items: true, pagos: { where: { anulado: false }, select: { monto: true } } },
      }),
      prisma.pago.findMany({
        where: { clienteFiadoId },
      }),
      obtenerSaldoCliente(prisma, clienteFiadoId),
    ]);
    if (!cliente) return fallo("No se encontró el cliente.", "validation");

    const movimientos: MovimientoCuenta[] = [
      ...ventas.map((venta) => ({
        tipo: "VENTA" as const,
        id: venta.id,
        fecha: venta.fecha.toISOString(),
        monto: decimalANumero(venta.total),
        estadoPago: venta.estadoPago as "A_COBRAR_HOY" | "FIADA",
        autorizadaPor: venta.autorizadaPor,
        saldoPendiente: Math.max(
          0,
          new Prisma.Decimal(venta.total)
            .minus(venta.pagos.reduce((suma, pago) => suma.plus(pago.monto), new Prisma.Decimal(0)))
            .toDecimalPlaces(2)
            .toNumber(),
        ),
        items: venta.items.map((item) => ({
          id: item.id,
          nombre: item.productoNombre,
          cantidad: item.cantidad,
          precioUnitario: decimalANumero(item.precioUnitario),
        })),
      })),
      ...pagos.map((pago) => ({
        tipo: "PAGO" as const,
        id: pago.id,
        fecha: pago.fecha.toISOString(),
        monto: decimalANumero(pago.monto),
        medio: pago.medio,
        ventaId: pago.ventaId,
        anulado: pago.anulado,
      })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));

    return ok({ cliente, saldo, movimientos });
  } catch (error) {
    console.error("fiados.obtenerCuentaCliente", error);
    return fallo("No se pudo cargar la cuenta del cliente.", "database");
  }
}
