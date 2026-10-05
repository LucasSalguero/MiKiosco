"use server";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { rangoDelDia, hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { calcularIngresosDelDia } from "@/features/daily-summary/lib/calcular-ingresos";

export async function obtenerResumenDiario(fecha?: string): Promise<Resultado<ResumenDiario>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const fechaISO = fecha ?? hoyISO();
  const { desde, hasta } = rangoDelDia(fechaISO);

  try {
    const whereVenta = {
      anulada: false,
      fecha: { gte: desde, lt: hasta },
    };
    const [ventas, cantidadVentas, cobros, clienteIds] = await Promise.all([
      prisma.venta.findMany({
        where: whereVenta,
        select: { total: true, tipoPago: true },
      }),
      prisma.venta.count({ where: whereVenta }),
      prisma.cobroFiado.aggregate({
        where: { fecha: { gte: desde, lt: hasta }, venta: { anulada: false } },
        _sum: { monto: true },
      }),
      prisma.venta.findMany({
        where: { ...whereVenta, clienteId: { not: null } },
        select: { clienteId: true },
      }),
    ]);

    const total = calcularIngresosDelDia(
      ventas.map((venta) => ({ total: Number(venta.total), tipoPago: venta.tipoPago })),
      cobros._sum.monto ? [Number(cobros._sum.monto)] : [],
    );

    return ok({
      fecha: fechaISO,
      total,
      cantidadVentas,
      clienteIds: clienteIds.flatMap((venta) => (venta.clienteId ? [venta.clienteId] : [])),
    });
  } catch (error) {
    console.error("daily-summary.obtenerResumenDiario", error);
    return fallo("No se pudo obtener el resumen del día.");
  }
}
