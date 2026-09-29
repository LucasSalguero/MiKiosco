"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { rangoDelDia, hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";

export async function obtenerResumenDiario(fecha?: string): Promise<Resultado<ResumenDiario>> {
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

    const total = resumen._sum.total ? Number(resumen._sum.total.toString()) : 0;

    return ok({
      fecha: fechaISO,
      total,
      cantidadVentas: resumen._count.id,
    });
  } catch (error) {
    console.error("daily-summary.obtenerResumenDiario", error);
    return fallo("No se pudo obtener el resumen del día.");
  }
}
