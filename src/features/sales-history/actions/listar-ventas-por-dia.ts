"use server";

import prisma from "@/shared/db/client";
import { rangoDelDia } from "@/shared/lib/fechas";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import type { Venta } from "@/shared/types/venta";

import { mapearVenta } from "@/features/sales-history/lib/mapear-venta";

export async function listarVentasPorDia(fecha: string): Promise<Resultado<Venta[]>> {
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
      },
      orderBy: { fecha: "desc" },
    });

    return ok(ventas.map(mapearVenta));
  } catch (error) {
    console.error("sales-history.listarVentasPorDia", error);
    return fallo("No se pudieron cargar las ventas del día.");
  }
}
