"use server";

import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import type { NuevaVenta } from "@/shared/types/venta";

import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { validarNuevaVenta } from "@/features/sales/lib/validar-venta";

export async function crearVenta(venta: NuevaVenta): Promise<Resultado<{ id: number }>> {
  const validado = validarNuevaVenta(venta);

  if (!validado.ok) {
    return fallo(validado.error);
  }

  const { items, fecha } = validado.data;
  const ids = items.map((item) => item.productoId);

  try {
    const productos = await prisma.producto.findMany({
      where: { id: { in: ids } },
    });

    if (productos.length !== ids.length) {
      return fallo("Hay productos que no existen.");
    }

    const total = calcularTotalVenta(items);

    const nuevaVenta = await prisma.$transaction(async (tx) => {
      const ventaCreada = await tx.venta.create({
        data: {
          fecha: new Date(fecha),
          total: new Prisma.Decimal(total.toFixed(2)),
          sincronizada: true,
        },
      });

      await tx.ventaItem.createMany({
        data: items.map((item) => ({
          ventaId: ventaCreada.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: new Prisma.Decimal(item.precioUnitario.toFixed(2)),
        })),
      });

      return ventaCreada;
    });

    return ok({ id: nuevaVenta.id });
  } catch (error) {
    console.error("sales.crearVenta", error);
    return fallo("No se pudo registrar la venta.");
  }
}
