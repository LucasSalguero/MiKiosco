"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/shared/db/client";
import { fallo, ok } from "@/shared/lib/resultado";
import type { Resultado } from "@/shared/types/resultado";

export async function reactivarProducto(id: number): Promise<Resultado<boolean>> {
  if (!Number.isInteger(id) || id <= 0) return fallo("El identificador del producto no es válido.");

  try {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) return fallo("No se encontró el producto.");
    if (producto.activo) return ok(true);

    const existente = await prisma.producto.findFirst({
      where: {
        activo: true,
        nombre: { equals: producto.nombre.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existente) return fallo("Ya existe un producto con ese nombre.");

    await prisma.producto.update({ where: { id }, data: { activo: true } });
    revalidatePath("/");
    revalidatePath("/productos");
    revalidatePath("/historial");
    return ok(true);
  } catch (error) {
    console.error("products.reactivarProducto", error);
    return fallo("No se pudo reactivar el producto.");
  }
}