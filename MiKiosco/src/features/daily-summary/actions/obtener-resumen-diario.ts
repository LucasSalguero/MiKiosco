"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { rangoDelDia, hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";

export async function obtenerResumenDiario(
  fecha?: string,
): Promise<Resultado<ResumenDiario>> {
  const fechaISO = fecha ?? hoyISO();
  const { desde, hasta } = rangoDelDia(fechaISO);

  try {
    const resumen = await prisma.venta.groupBy({
      by: ["fecha"],
      where: {
        fecha: {
          gte: desde,
          lt: hasta,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const total = resumen[0]?._sum.total ? Number(resumen[0]._sum.total.toString()) : 0;

    return ok({
      fecha: fechaISO,
      total,
      cantidadVentas: resumen[0]?._count.id ?? 0,
    });
  } catch (error) {
    console.error("daily-summary.obtenerResumenDiario", error);
    return fallo("No se pudo obtener el resumen del día.");
  }
}
