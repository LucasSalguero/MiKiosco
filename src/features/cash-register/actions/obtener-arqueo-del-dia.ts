"use server";

import prisma from "@/shared/db/client";
import { arqueoAPesos } from "@/features/cash-register/lib/calcular-arqueo";
import { cargarDia, mapearCierre } from "@/features/cash-register/lib/cargar-dia";
import { tieneSesionValida } from "@/shared/lib/autenticacion";
import { esFechaISOValida, hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import { aCentavos } from "@/shared/lib/moneda";
import { fallo, ok } from "@/shared/lib/resultado";
import type { ArqueoDelDia } from "@/shared/types/caja";
import type { Resultado } from "@/shared/types/resultado";

/**
 * Si el día ya está cerrado devuelve la foto guardada (y lo que entró después);
 * si no, el arqueo en vivo con el fondo sugerido del último cierre anterior.
 */
export async function obtenerArqueoDelDia(fecha: unknown): Promise<Resultado<ArqueoDelDia>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");
  if (typeof fecha !== "string" || !esFechaISOValida(fecha) || fecha > hoyISO()) {
    return fallo("La fecha no es válida.", "validation");
  }

  try {
    const cierre = await prisma.cierreCaja.findUnique({ where: { fecha } });

    if (cierre) {
      const { desde, hasta } = rangoDelDia(fecha);
      const [dia, ventasPosteriores, cobrosPosteriores] = await Promise.all([
        cargarDia(prisma, fecha, aCentavos(cierre.fondoInicial)),
        prisma.venta.aggregate({
          where: {
            fecha: { gte: desde, lt: hasta },
            anulada: false,
            registradaEn: { gt: cierre.cerradoEn },
          },
          _sum: { total: true },
          _count: true,
        }),
        prisma.pago.aggregate({
          where: { fecha: { gt: cierre.cerradoEn, lt: hasta }, anulado: false },
          _sum: { monto: true },
        }),
      ]);
      return ok({
        fecha,
        cerrado: true,
        cierre: mapearCierre(cierre),
        posteriores: {
          cantidadVentas: ventasPosteriores._count,
          importeVentas: aCentavos(ventasPosteriores._sum.total ?? 0) / 100,
          importeCobros: aCentavos(cobrosPosteriores._sum.monto ?? 0) / 100,
        },
        movimientos: dia.movimientos,
        topProductos: dia.topProductos,
        ventasPorHora: dia.ventasPorHora,
      });
    }

    const anterior = await prisma.cierreCaja.findFirst({
      where: { fecha: { lt: fecha } },
      orderBy: { fecha: "desc" },
      select: { efectivoContado: true },
    });
    const fondoSugeridoCentavos = anterior ? aCentavos(anterior.efectivoContado) : 0;
    const dia = await cargarDia(prisma, fecha, fondoSugeridoCentavos);
    return ok({
      fecha,
      cerrado: false,
      arqueo: arqueoAPesos(dia.arqueo),
      fondoSugerido: fondoSugeridoCentavos / 100,
      movimientos: dia.movimientos,
      topProductos: dia.topProductos,
      ventasPorHora: dia.ventasPorHora,
    });
  } catch (error) {
    console.error("cash-register.obtenerArqueoDelDia", error);
    return fallo("No se pudo cargar la caja del día.", "database");
  }
}
