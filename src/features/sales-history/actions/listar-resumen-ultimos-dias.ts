"use server";

import prisma from "@/shared/db/client";
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

    const where = { anulada: false, fecha: { gte: desde, lt: hasta } };
    const [ventas, cobros] = await Promise.all([
      prisma.venta.findMany({ where, orderBy: { fecha: "asc" } }),
      prisma.cobroFiado.findMany({
        where: { fecha: { gte: desde, lt: hasta }, venta: { anulada: false } },
        select: { fecha: true, monto: true },
        orderBy: { fecha: "asc" },
      }),
    ]);

    const resumen = new Map<string, ResumenDiario>();

    for (const venta of ventas) {
      const fecha = fechaLocalISO(venta.fecha);
      const actual = resumen.get(fecha) ?? { fecha, total: 0, cantidadVentas: 0 };
      if (venta.tipoPago === "CONTADO") actual.total += Number(venta.total.toString());
      actual.cantidadVentas += 1;
      resumen.set(fecha, actual);
    }

    for (const cobro of cobros) {
      const fecha = fechaLocalISO(cobro.fecha);
      const actual = resumen.get(fecha) ?? { fecha, total: 0, cantidadVentas: 0 };
      actual.total = Number((actual.total + Number(cobro.monto.toString())).toFixed(2));
      actual.cantidadCobros = (actual.cantidadCobros ?? 0) + 1;
      resumen.set(fecha, actual);
    }

    const resultado = Array.from(resumen.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return ok(resultado);
  } catch (error) {
    console.error("sales-history.listarResumenUltimosDias", error);
    return fallo("No se pudo cargar el resumen reciente.");
  }
}
