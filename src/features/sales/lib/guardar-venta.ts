import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";
import type { NuevaVenta } from "@/shared/types/venta";
import { calcularTotalVenta } from "@/features/sales/lib/calcular-total";
import { validarNuevaVenta } from "@/features/sales/lib/validar-venta";

export async function guardarVenta(
  venta: NuevaVenta,
  clienteId: string,
): Promise<Resultado<{ id: number }>> {
  try {
    const existente = await prisma.venta.findUnique({ where: { clienteId }, select: { id: true } });
    if (existente) return ok({ id: existente.id });

    const validado = validarNuevaVenta(venta);
    if (!validado.ok) return fallo(validado.error, validado.code);

    const { items, fecha } = validado.data;
    const ids = items.map((item) => item.productoId);
    const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });
    if (productos.length !== ids.length) {
      return fallo("Hay productos que no existen.", "validation");
    }

    const total = calcularTotalVenta(items);
    const nuevaVenta = await prisma.$transaction(async (tx) => {
      const ventaCreada = await tx.venta.create({
        data: {
          fecha: new Date(fecha),
          total: new Prisma.Decimal(total.toFixed(2)),
          sincronizada: true,
          clienteId,
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

    revalidatePath("/");
    revalidatePath("/historial");
    return ok({ id: nuevaVenta.id });
  } catch (error) {
    console.error("sales.guardarVenta", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existente = await prisma.venta.findUnique({
        where: { clienteId },
        select: { id: true },
      });
      if (existente) return ok({ id: existente.id });
    }
    return fallo("No se pudo registrar la venta.", "database");
  }
}
