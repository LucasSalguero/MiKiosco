"use server";

import prisma from "@/shared/db/client";
import { rangoDelDia } from "@/shared/lib/fechas";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import type { Venta } from "@/shared/types/venta";

import { mapearVenta } from "@/features/sales-history/lib/mapear-venta";
import { tieneSesionValida } from "@/shared/lib/autenticacion";

export async function listarVentasPorDia(fecha: string): Promise<Resultado<Venta[]>> {
  if (!(await tieneSesionValida())) return fallo("Ingresá el PIN para continuar.", "unauthorized");

  const { desde, hasta } = rangoDelDia(fecha);

  try {
    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: desde,
          lt: hasta,
        },
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        clienteFiado: { select: { nombre: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { fecha: "desc" },
    });

    return ok(ventas.map(mapearVenta));
  } catch (error) {
    console.error("sales-history.listarVentasPorDia", error);
    return fallo("No se pudieron cargar las ventas del día.");
  }
}
