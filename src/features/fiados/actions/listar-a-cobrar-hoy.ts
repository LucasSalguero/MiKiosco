"use server";

import prisma from "@/shared/db/client";
import { Prisma } from "@prisma/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import { decimalANumero } from "@/shared/lib/moneda";
import type { Resultado } from "@/shared/types/resultado";

export type VentaACobrarHoy = {
  id: number;
  clienteFiadoId: number;
  cliente: string;
  fecha: string;
  total: number;
  saldo: number;
};

export async function listarACobrarHoy(): Promise<Resultado<VentaACobrarHoy[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const { desde, hasta } = rangoDelDia(hoyISO());
    const ventas = await prisma.venta.findMany({
      where: {
        estadoPago: "A_COBRAR_HOY",
        anulada: false,
        fecha: { gte: desde, lt: hasta },
        clienteFiadoId: { not: null },
      },
      include: {
        clienteFiado: { select: { nombre: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { fecha: "asc" },
    });

    return ok(
      ventas.flatMap((venta) => {
        if (venta.clienteFiadoId === null) return [];
        const cobrado = venta.pagos.reduce(
          (suma, pago) => suma.plus(pago.monto),
          new Prisma.Decimal(0),
        );
        const saldoDecimal = new Prisma.Decimal(venta.total).minus(cobrado).toDecimalPlaces(2);
        const saldo = saldoDecimal.toNumber();
        if (saldo <= 0) return [];
        return [
          {
            id: venta.id,
            clienteFiadoId: venta.clienteFiadoId,
            cliente: venta.clienteFiado?.nombre ?? venta.clienteNombre ?? "Cliente",
            fecha: venta.fecha.toISOString(),
            total: decimalANumero(venta.total),
            saldo,
          },
        ];
      }),
    );
  } catch (error) {
    console.error("fiados.listarACobrarHoy", error);
    return fallo("No se pudieron cargar las ventas por cobrar hoy.", "database");
  }
}
