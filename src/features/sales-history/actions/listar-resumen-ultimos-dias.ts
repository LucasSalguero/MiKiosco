"use server";

import prisma from "@/shared/db/client";
import { Prisma } from "@prisma/client";
import { fallo, ok } from "@/shared/lib/resultado";
import { fechaLocalISO, hoyISO, rangoDelDia } from "@/shared/lib/fechas";
import type { ResumenDiario } from "@/shared/types/resumen-diario";
import type { Resultado } from "@/shared/types/resultado";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export async function listarResumenUltimosDias(
  cantidad: number,
): Promise<Resultado<ResumenDiario[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const dias = Math.max(1, cantidad);
  try {
    const hoy = hoyISO();
    const [año, mes, dia] = hoy.split("-").map(Number);
    const inicioCalendario = new Date(Date.UTC(año, mes - 1, dia - dias + 1));
    const desdeISO = [
      inicioCalendario.getUTCFullYear(),
      String(inicioCalendario.getUTCMonth() + 1).padStart(2, "0"),
      String(inicioCalendario.getUTCDate()).padStart(2, "0"),
    ].join("-");
    const { desde } = rangoDelDia(desdeISO);
    const { hasta } = rangoDelDia(hoy);
    const [ventas, pagos, deudaVentas, deudaPagos] = await Promise.all([
      prisma.venta.findMany({
        where: { anulada: false, fecha: { gte: desde, lt: hasta } },
        orderBy: { fecha: "asc" },
      }),
      prisma.pago.findMany({
        where: { fecha: { gte: desde, lt: hasta }, anulado: false },
        select: { fecha: true, monto: true },
        orderBy: { fecha: "asc" },
      }),
      prisma.venta.aggregate({
        where: { anulada: false, estadoPago: { in: ["A_COBRAR_HOY", "FIADA"] } },
        _sum: { total: true },
      }),
      prisma.pago.aggregate({ where: { anulado: false }, _sum: { monto: true } }),
    ]);

    type ResumenAcumulado = {
      fecha: string;
      vendido: Prisma.Decimal;
      cobrado: Prisma.Decimal;
      fiadoNuevo: Prisma.Decimal;
      deudaTotal: Prisma.Decimal;
      cantidadVentas: number;
      cantidadACobrarHoy: number;
      cantidadCobros?: number;
    };
    const deudaTotal = new Prisma.Decimal(deudaVentas._sum.total ?? 0).minus(
      deudaPagos._sum.monto ?? 0,
    );
    const resumen = new Map<string, ResumenAcumulado>();
    const obtenerDia = (fecha: string): ResumenAcumulado => {
      const existente = resumen.get(fecha);
      if (existente) return existente;
      const nuevo: ResumenAcumulado = {
        fecha,
        vendido: new Prisma.Decimal(0),
        cobrado: new Prisma.Decimal(0),
        fiadoNuevo: new Prisma.Decimal(0),
        deudaTotal,
        cantidadVentas: 0,
        cantidadACobrarHoy: 0,
      };
      resumen.set(fecha, nuevo);
      return nuevo;
    };

    for (const venta of ventas) {
      const fecha = fechaLocalISO(venta.fecha);
      const actual = obtenerDia(fecha);
      actual.vendido = actual.vendido.plus(venta.total);
      if (venta.estadoPago === "PAGADA") actual.cobrado = actual.cobrado.plus(venta.total);
      else {
        actual.fiadoNuevo = actual.fiadoNuevo.plus(venta.total);
        if (venta.estadoPago === "A_COBRAR_HOY") actual.cantidadACobrarHoy += 1;
      }
      actual.cantidadVentas += 1;
    }

    for (const pago of pagos) {
      const fecha = fechaLocalISO(pago.fecha);
      const actual = obtenerDia(fecha);
      actual.cobrado = actual.cobrado.plus(pago.monto);
      actual.cantidadCobros = (actual.cantidadCobros ?? 0) + 1;
    }

    const resultados: ResumenDiario[] = Array.from(resumen.values()).map((diaResumen) => ({
      ...diaResumen,
      vendido: diaResumen.vendido.toNumber(),
      cobrado: diaResumen.cobrado.toNumber(),
      fiadoNuevo: diaResumen.fiadoNuevo.toNumber(),
      deudaTotal: diaResumen.deudaTotal.toNumber(),
    }));
    return ok(resultados.sort((a, b) => a.fecha.localeCompare(b.fecha)));
  } catch (error) {
    console.error("sales-history.listarResumenUltimosDias", error);
    return fallo("No se pudo cargar el resumen reciente.");
  }
}
