"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { rangoDelDia, hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export async function obtenerResumenDiario(fecha?: string): Promise<Resultado<ResumenDiario>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const fechaISO = fecha ?? hoyISO();
  const { desde, hasta } = rangoDelDia(fechaISO);

  try {
    const resumen = await prisma.venta.aggregate({
      where: {
        anulada: false,
        fecha: {
          gte: desde,
          lt: hasta,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });
    const clienteIds = await prisma.venta.findMany({
      where: {
        anulada: false,
        clienteId: { not: null },
        fecha: { gte: desde, lt: hasta },
      },
      select: { clienteId: true },
    });

    const total = resumen._sum.total ? Number(resumen._sum.total.toString()) : 0;

    return ok({
      fecha: fechaISO,
      total,
      cantidadVentas: resumen._count.id,
      clienteIds: clienteIds.flatMap((venta) => (venta.clienteId ? [venta.clienteId] : [])),
    });
  } catch (error) {
    console.error("daily-summary.obtenerResumenDiario", error);
    return fallo("No se pudo obtener el resumen del día.");
  }
}
