"use server";

import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { rangoDelDia, hoyISO } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

function aNumero(valor: Prisma.Decimal | null): number {
  return new Prisma.Decimal(valor ?? 0).toNumber();
}

export async function obtenerResumenDiario(fecha?: string): Promise<Resultado<ResumenDiario>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const fechaISO = fecha ?? hoyISO();
  const { desde, hasta } = rangoDelDia(fechaISO);

  try {
    const whereDia = { anulada: false, fecha: { gte: desde, lt: hasta } };
    const [
      vendido,
      cobradoEnVentas,
      fiadoNuevo,
      cantidadVentas,
      cobrosDia,
      deudaVentas,
      pagos,
      operaciones,
      ventasACobrarHoy,
    ] = await Promise.all([
      prisma.venta.aggregate({ where: whereDia, _sum: { total: true } }),
      prisma.venta.aggregate({
        where: { ...whereDia, estadoPago: "PAGADA" },
        _sum: { total: true },
      }),
      prisma.venta.aggregate({
        where: { ...whereDia, estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] } },
        _sum: { total: true },
      }),
      prisma.venta.count({ where: whereDia }),
      prisma.pago.aggregate({
        where: { fecha: { gte: desde, lt: hasta }, anulado: false },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.venta.aggregate({
        where: { anulada: false, estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] } },
        _sum: { total: true },
      }),
      prisma.pago.aggregate({ where: { anulado: false }, _sum: { monto: true } }),
      prisma.venta.findMany({
        where: { ...whereDia, claveOperacion: { not: null } },
        select: { claveOperacion: true },
      }),
      prisma.venta.findMany({
        where: {
          ...whereDia,
          estadoPago: "A_COBRAR_HOY",
        },
        select: {
          total: true,
          pagos: { where: { anulado: false }, select: { monto: true } },
        },
      }),
    ]);

    const vendidoNumero = aNumero(vendido._sum.total);
    const cobrado = new Prisma.Decimal(cobradoEnVentas._sum.total ?? 0)
      .plus(cobrosDia._sum.monto ?? 0)
      .toDecimalPlaces(2)
      .toNumber();
    const deudaTotal = new Prisma.Decimal(deudaVentas._sum.total ?? 0)
      .minus(pagos._sum.monto ?? 0)
      .toDecimalPlaces(2)
      .toNumber();
    return ok({
      fecha: fechaISO,
      vendido: vendidoNumero,
      cobrado,
      fiadoNuevo: aNumero(fiadoNuevo._sum.total),
      deudaTotal,
      cantidadVentas,
      cantidadACobrarHoy: ventasACobrarHoy.filter((venta) => {
        const pagosVenta = venta.pagos.reduce((total, pago) => total + aNumero(pago.monto), 0);
        return aNumero(venta.total) - pagosVenta > 0;
      }).length,
      clavesOperacion: operaciones.flatMap((venta) =>
        venta.claveOperacion ? [venta.claveOperacion] : [],
      ),
      cantidadCobros: cobrosDia._count,
    });
  } catch (error) {
    console.error("daily-summary.obtenerResumenDiario", error);
    return fallo("No se pudo obtener el resumen del día.");
  }
}
