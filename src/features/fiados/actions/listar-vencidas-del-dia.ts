"use server";

import prisma from "@/shared/db/client";
import { Prisma } from "@prisma/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import type { Resultado } from "@/shared/types/resultado";

export type VentaVencida = {
  id: number;
  cliente: string;
  fecha: string;
  total: number;
};

export async function listarVencidasDelDia(): Promise<Resultado<VentaVencida[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  try {
    const hoy = hoyISO();
    const mañana = new Date(
      Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, Number(hoy.slice(8, 10)) + 1),
    );
    const fechaManana = [
      mañana.getUTCFullYear(),
      String(mañana.getUTCMonth() + 1).padStart(2, "0"),
      String(mañana.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const { hasta: finDelDia } = rangoDelDia(fechaManana);
    const ventas = await prisma.venta.findMany({
      where: {
        estadoPago: "A_COBRAR_HOY",
        anulada: false,
        fecha: { lt: finDelDia },
        clienteFiadoId: { not: null },
      },
      include: {
        clienteFiado: { select: { nombre: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { fecha: "asc" },
    });
    return ok(
      ventas.map((venta) => ({
        id: venta.id,
        cliente: venta.clienteFiado?.nombre ?? venta.clienteNombre ?? "Cliente",
        fecha: venta.fecha.toISOString(),
        total: new Prisma.Decimal(venta.total)
          .minus(venta.pagos.reduce((total, pago) => total.plus(pago.monto), new Prisma.Decimal(0)))
          .toDecimalPlaces(2)
          .toNumber(),
      })),
    );
  } catch (error) {
    console.error("fiados.listarVencidasDelDia", error);
    return fallo("No se pudieron consultar las ventas por cobrar.", "database");
  }
}
