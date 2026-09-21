"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { fechaLocalISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";

export async function listarResumenUltimosDias(
  cantidad: number,
): Promise<Resultado<ResumenDiario[]>> {
  const dias = Math.max(1, cantidad);

  try {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - dias + 1);
    desde.setHours(0, 0, 0, 0);

    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: desde,
        },
      },
      orderBy: { fecha: "asc" },
    });

    const resumen = new Map<string, ResumenDiario>();

    for (const venta of ventas) {
      const fecha = fechaLocalISO(venta.fecha);
      const actual = resumen.get(fecha) ?? { fecha, total: 0, cantidadVentas: 0 };
      actual.total += Number(venta.total.toString());
      actual.cantidadVentas += 1;
      resumen.set(fecha, actual);
    }

    const resultado = Array.from(resumen.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return ok(resultado);
  } catch (error) {
    console.error("sales-history.listarResumenUltimosDias", error);
    return fallo("No se pudo cargar el resumen reciente.");
  }
}
